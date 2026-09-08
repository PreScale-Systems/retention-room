"""Create the schema and load a simulated audience for Cold Harbor into ClickHouse.

    python scripts/seed.py                    # uses CLICKHOUSE_* env vars, 60k sessions/episode
    SESSIONS_PER_EPISODE=20000 python scripts/seed.py
    python scripts/seed.py --drop             # start over

Simulation, per episode:
  • a per-second quit hazard built from scene kind, seeded scene boosts, and a credits spike
  • sessions sampled from that survival curve; ~8% start mid-episode (resume)
  • heartbeats every 30s, seeks (backward seeks cluster on the reveals), rebuffers, and exits
  • one delivery incident (ep5, smart_tv / LATAM / edge-c) that exits viewers for a non-story reason
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from datetime import datetime, timedelta  # noqa: F401
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from data.show import CDNS, DEVICES, EPISODES, KIND_HAZARD, REGIONS, behaviour, resolve_hotspots, runtime, scene_rows  # noqa: E402

DB = os.environ.get("CLICKHOUSE_DATABASE", "retention")
HEARTBEAT = 30
RELEASE = datetime(2026, 6, 5, 7, 0, 0)  # episodes drop weekly from here


def ch_client():
    import clickhouse_connect

    return clickhouse_connect.get_client(
        host=os.environ.get("CLICKHOUSE_HOST", "localhost"),
        port=int(os.environ.get("CLICKHOUSE_PORT", "8123")),
        username=os.environ.get("CLICKHOUSE_USER", "default"),
        password=os.environ.get("CLICKHOUSE_PASSWORD", ""),
        secure=os.environ.get("CLICKHOUSE_SECURE", "false").lower() == "true",
    )


def apply_schema(client, drop: bool):
    if drop:
        client.command(f"DROP DATABASE IF EXISTS {DB}")
    sql = (Path(__file__).resolve().parent.parent / "sql" / "schema.sql").read_text().replace("{db}", DB)
    sql = "\n".join(l for l in sql.splitlines() if not l.strip().startswith("--"))
    for stmt in [s.strip() for s in sql.split(";") if s.strip()]:
        client.command(stmt)


def hazard_curve(ep: int, rows) -> np.ndarray:
    """Per-second probability of quitting. Shaped by scene kind and story seeds."""
    T = runtime(ep)
    h = np.zeros(T, dtype=np.float64)
    base = 0.00011  # ~1 in 9000 per second in a plain dialogue scene
    for r in rows:
        k = KIND_HAZARD[r["kind"]]
        boost = behaviour["exit_boost"].get((ep, r["scene_number"]), 1.0)
        seg = np.full(r["end_sec"] - r["start_sec"], base * k)
        if boost > 1.0:
            # ramps in: viewers give a slow scene a minute before they bail
            ramp = np.linspace(0.3, 1.0, seg.size) ** 2
            seg *= 1.0 + (boost - 1.0) * ramp
        h[r["start_sec"]:r["end_sec"]] = seg
    # first two minutes: sampling / "is this for me" churn
    h[:120] *= 3.0
    # end credits: most people leave; post-credits gets the rest
    return h


def sample_sessions(ep: int, n: int, rng: np.random.Generator, rows):
    T = runtime(ep)
    h = hazard_curve(ep, rows)
    surv = np.exp(-np.cumsum(h))  # S(t)
    u = rng.random(n)
    # exit second = first t where S(t) < u ; if never, they completed
    exit_sec = np.searchsorted(-surv, -u)  # surv is decreasing → -surv increasing
    credits_start = [r for r in rows if r["kind"] == "credits"][-1]["start_sec"]
    exit_sec = np.minimum(exit_sec, T)
    completed = exit_sec >= credits_start

    resume = rng.random(n) < 0.08
    start_sec = np.where(resume, rng.integers(60, max(61, T - 300), n), 0).astype(np.int64)
    # a resumed session can't exit before it started
    exit_sec = np.maximum(exit_sec, start_sec + rng.integers(20, 400, n))
    exit_sec = np.minimum(exit_sec, T)
    completed = exit_sec >= credits_start

    device = rng.choice(list(DEVICES), n, p=list(DEVICES.values()))
    region = rng.choice(list(REGIONS), n, p=list(REGIONS.values()))
    cdn = rng.choice(list(CDNS), n, p=list(CDNS.values()))
    autoplay = (rng.random(n) < 0.55).astype(np.int8)
    user_id = rng.integers(1, 2_000_000, n)

    # delivery incident: a slice of one segment quits inside a 90-second window
    inc = behaviour["incident"]
    if inc["episode"] == ep:
        mask = (device == inc["device"]) & (region == inc["region"]) & (cdn == inc["cdn"]) & (start_sec < inc["start_sec"]) & (exit_sec > inc["start_sec"])
        hit = mask & (rng.random(n) < 0.45)
        exit_sec = np.where(hit, rng.integers(inc["start_sec"], inc["end_sec"], n), exit_sec)
        completed = np.where(hit, False, completed)

    # ep8: some of those who "completed" actually stopped at the credits and missed the tag
    pc = behaviour["post_credits"]
    if pc["episode"] == ep:
        credits = [r for r in rows if r["scene_number"] == pc["credits_scene"]][0]
        stop = (exit_sec > credits["end_sec"]) & (rng.random(n) < 0.62)
        exit_sec = np.where(stop, rng.integers(credits["start_sec"], credits["start_sec"] + 40, n), exit_sec)

    started_at = RELEASE + timedelta(days=7 * (ep - 1))
    offsets = rng.exponential(3.0, n) * 86400 + rng.random(n) * 86400  # most views in the first days
    started = np.datetime64(started_at, "s") + offsets.astype("timedelta64[s]")
    return dict(
        start_sec=start_sec,
        end_sec=exit_sec.astype(np.int64),
        completed=completed.astype(np.int8),
        device=device,
        region=region,
        cdn=cdn,
        autoplay=autoplay,
        user_id=user_id,
        started_at=started,
    )


def build_events(ep: int, sid0: int, s: dict, rng: np.random.Generator, hotspots: dict):
    """Vectorised event generation. Returns column lists for playback_events."""
    n = s["start_sec"].size
    sids = np.arange(sid0, sid0 + n, dtype=np.int64)
    cols = {k: [] for k in ("session_id", "ts", "position_sec", "event", "seek_to_sec")}

    def add(sid, ts, pos, ev, seek_to=None):
        cols["session_id"].append(sid)
        cols["ts"].append(ts)
        cols["position_sec"].append(pos)
        cols["event"].append(ev)
        cols["seek_to_sec"].append(seek_to)

    # heartbeats
    nbeats = ((s["end_sec"] - s["start_sec"]) // HEARTBEAT).astype(np.int64)
    rep_sid = np.repeat(sids, nbeats)
    rep_start = np.repeat(s["start_sec"], nbeats)
    rep_t0 = np.repeat(s["started_at"], nbeats)
    k = np.concatenate([np.arange(1, b + 1) for b in nbeats]) if nbeats.sum() else np.array([], dtype=np.int64)
    pos = rep_start + k * HEARTBEAT
    ts = rep_t0 + (pos - rep_start).astype("timedelta64[s]")

    add(sids, s["started_at"], s["start_sec"], np.full(n, "start"), np.full(n, None))
    add(rep_sid, ts, pos, np.full(pos.size, "heartbeat"), np.full(pos.size, None))

    # seeks: ~35% of sessions seek at least once; backward seeks favour hotspots
    ep_hot = {sec: w for (e, sec), w in hotspots.items() if e == ep}
    hot_secs = np.array(list(ep_hot.keys())) if ep_hot else np.array([])
    hot_w = np.array(list(ep_hot.values())) if ep_hot else np.array([])
    nseeks = rng.poisson(0.5, n)
    sk_sid = np.repeat(sids, nseeks)
    sk_start = np.repeat(s["start_sec"], nseeks)
    sk_end = np.repeat(s["end_sec"], nseeks)
    sk_t0 = np.repeat(s["started_at"], nseeks)
    m = sk_sid.size
    if m:
        span = np.maximum(sk_end - sk_start, 1)
        at = sk_start + (rng.random(m) * span).astype(np.int64)
        back = rng.random(m) < 0.58
        # backward: 65% land on a hotspot that lies before `at`, otherwise a random earlier point
        to = np.where(back, np.maximum(sk_start, at - rng.integers(5, 240, m)), np.minimum(sk_end, at + rng.integers(10, 600, m)))
        if hot_secs.size:
            use_hot = back & (rng.random(m) < 0.65)
            pick = rng.choice(hot_secs.size, m, p=hot_w / hot_w.sum())
            cand = hot_secs[pick] + rng.integers(-8, 8, m)
            ok = use_hot & (cand < at) & (cand >= sk_start)
            to = np.where(ok, cand, to)
        add(sk_sid, sk_t0 + (at - sk_start).astype("timedelta64[s]"), at, np.full(m, "seek"), to.astype(object))

    # rebuffers: low base rate; heavy inside the incident window for the affected segment
    inc = behaviour["incident"]
    base_rb = rng.poisson(0.12, n)
    rb_sid = np.repeat(sids, base_rb)
    rb_start = np.repeat(s["start_sec"], base_rb)
    rb_end = np.repeat(s["end_sec"], base_rb)
    rb_t0 = np.repeat(s["started_at"], base_rb)
    mm = rb_sid.size
    if mm:
        at = rb_start + (rng.random(mm) * np.maximum(rb_end - rb_start, 1)).astype(np.int64)
        add(rb_sid, rb_t0 + (at - rb_start).astype("timedelta64[s]"), at, np.full(mm, "rebuffer"), np.full(mm, None))
    if inc["episode"] == ep:
        aff = (s["device"] == inc["device"]) & (s["region"] == inc["region"]) & (s["cdn"] == inc["cdn"]) & (s["start_sec"] < inc["start_sec"]) & (s["end_sec"] > inc["start_sec"])
        idx = np.nonzero(aff)[0]
        cnt = rng.poisson(inc["rebuffer_rate"] * 6, idx.size)
        rsid = np.repeat(sids[idx], cnt)
        rt0 = np.repeat(s["started_at"][idx], cnt)
        rstart = np.repeat(s["start_sec"][idx], cnt)
        q = rsid.size
        if q:
            at = rng.integers(inc["start_sec"], inc["end_sec"], q)
            add(rsid, rt0 + (at - rstart).astype("timedelta64[s]"), at, np.full(q, "rebuffer"), np.full(q, None))

    # exits
    add(sids, s["started_at"] + (s["end_sec"] - s["start_sec"]).astype("timedelta64[s]"), s["end_sec"], np.where(s["completed"] == 1, "complete", "exit"), np.full(n, None))

    out = {k: np.concatenate([np.asarray(v, dtype=object) for v in cols[k]]) for k in cols if k != "ts"}
    out["ts"] = np.concatenate([np.asarray(v).astype("datetime64[s]") for v in cols["ts"]])
    # per-event device/region/cdn come from the session
    lookup = {sid: i for i, sid in enumerate(sids)}
    order = np.array([lookup[x] for x in out["session_id"]])
    out["device"] = s["device"][order]
    out["region"] = s["region"][order]
    out["cdn"] = s["cdn"][order]
    return sids, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--drop", action="store_true")
    ap.add_argument("--sessions", type=int, default=int(os.environ.get("SESSIONS_PER_EPISODE", "60000")))
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--dry-run", action="store_true", help="simulate and print stats without a database")
    args = ap.parse_args()

    rng = np.random.default_rng(args.seed)
    rows_all = scene_rows()
    hotspots = resolve_hotspots()
    client = None if args.dry_run else ch_client()
    if client:
        apply_schema(client, args.drop)
        client.command(f"TRUNCATE TABLE {DB}.scenes")
        client.insert(
            f"{DB}.scenes",
            [[r[k] for k in ("episode", "scene_number", "start_sec", "end_sec", "slugline", "characters", "summary", "script_excerpt", "act", "kind")] for r in rows_all],
            column_names=["episode", "scene_number", "start_sec", "end_sec", "slugline", "characters", "summary", "script_excerpt", "act", "kind"],
        )
        print(f"scenes: {len(rows_all)} rows")

    sid0 = 1
    total_events = 0
    t_start = time.time()
    for ep in EPISODES:
        rows = [r for r in rows_all if r["episode"] == ep]
        n = args.sessions
        # audience decays over the season, then grows again for the finale
        n = int(n * {1: 1.0, 2: 0.86, 3: 0.74, 4: 0.68, 5: 0.63, 6: 0.61, 7: 0.60, 8: 0.66}[ep])
        s = sample_sessions(ep, n, rng, rows)
        sids, ev = build_events(ep, sid0, s, rng, hotspots)
        sid0 += n
        total_events += ev["session_id"].size
        comp = s["completed"].mean()
        print(f"ep{ep} {EPISODES[ep]['title']:<18} sessions={n:>7,} completion={comp:5.1%} events={ev['session_id'].size:>10,}")
        if not client:
            continue
        client.insert(
            f"{DB}.sessions",
            column_oriented=True,
            data=[
                sids.tolist(), s["user_id"].tolist(), [ep] * n, s["started_at"].astype("datetime64[s]").tolist(),
                s["start_sec"].tolist(), s["end_sec"].tolist(), s["completed"].tolist(), s["device"].tolist(), s["region"].tolist(), s["cdn"].tolist(), s["autoplay"].tolist(),
            ],
            column_names=["session_id", "user_id", "episode", "started_at", "start_sec", "end_sec", "completed", "device", "region", "cdn", "autoplay"],
        )
        CH = 500_000
        m = ev["session_id"].size
        for i in range(0, m, CH):
            sl = slice(i, i + CH)
            client.insert(
                f"{DB}.playback_events",
                column_oriented=True,
                data=[
                    ev["session_id"][sl].tolist(), [ep] * min(CH, m - i), ev["ts"][sl].tolist(),
                    ev["position_sec"][sl].tolist(), ev["event"][sl].tolist(), ev["seek_to_sec"][sl].tolist(),
                    ev["device"][sl].tolist(), ev["region"][sl].tolist(), ev["cdn"][sl].tolist(),
                ],
                column_names=["session_id", "episode", "ts", "position_sec", "event", "seek_to_sec", "device", "region", "cdn"],
            )
            print(f"   inserted {min(i+CH, m):,}/{m:,}", end="\r")
        print()
    print(f"done: {total_events:,} events in {time.time()-t_start:.0f}s")


if __name__ == "__main__":
    main()
