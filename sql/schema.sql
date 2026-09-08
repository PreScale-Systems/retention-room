-- Retention Room schema. Run with scripts/seed.py (it executes these statements in order).
-- Database name comes from CLICKHOUSE_DATABASE (default: retention).

CREATE DATABASE IF NOT EXISTS {db};

-- One row per scene, produced from the scripts. Timestamps are seconds from episode start.
CREATE TABLE IF NOT EXISTS {db}.scenes
(
    episode        UInt8,
    scene_number   UInt16,
    start_sec      UInt32,
    end_sec        UInt32,
    slugline       String,
    characters     Array(String),
    summary        String,
    script_excerpt String,
    act            UInt8,
    kind           LowCardinality(String)   -- dialogue | action | exposition | reveal | montage | credits
)
ENGINE = MergeTree
ORDER BY (episode, start_sec);

-- One row per viewing session: where it started, where it stopped, and why.
CREATE TABLE IF NOT EXISTS {db}.sessions
(
    session_id   UInt64,
    user_id      UInt32,
    episode      UInt8,
    started_at   DateTime,
    start_sec    UInt32,
    end_sec      UInt32,
    completed    UInt8,                      -- 1 if the viewer reached the credits
    device       LowCardinality(String),     -- smart_tv | mobile | web | tablet | console
    region       LowCardinality(String),     -- NA | EU | LATAM | APAC | MEA
    cdn          LowCardinality(String),     -- edge-a | edge-b | edge-c
    autoplay     UInt8                       -- 1 if the episode started via autoplay
)
ENGINE = MergeTree
PARTITION BY episode
ORDER BY (episode, end_sec, session_id);

-- Raw playback events: heartbeats every 30s, seeks, pauses, exits, rebuffers.
CREATE TABLE IF NOT EXISTS {db}.playback_events
(
    session_id   UInt64,
    episode      UInt8,
    ts           DateTime,
    position_sec UInt32,
    event        LowCardinality(String),     -- start | heartbeat | seek | pause | resume | rebuffer | exit
    seek_to_sec  Nullable(UInt32),           -- for seek events
    device       LowCardinality(String),
    region       LowCardinality(String),
    cdn          LowCardinality(String)
)
ENGINE = MergeTree
PARTITION BY episode
ORDER BY (episode, position_sec, session_id);

-- Exits per second: retention(t) = starts - sum(exits where second <= t). Cheap to fill, cheap to query.
CREATE TABLE IF NOT EXISTS {db}.exits_by_second
(
    episode  UInt8,
    second   UInt32,
    device   LowCardinality(String),
    region   LowCardinality(String),
    cdn      LowCardinality(String),
    exits    UInt64,
    starts   UInt64
)
ENGINE = SummingMergeTree((exits, starts))
ORDER BY (episode, second, device, region, cdn);

CREATE MATERIALIZED VIEW IF NOT EXISTS {db}.mv_exits_by_second TO {db}.exits_by_second AS
SELECT episode, end_sec AS second, device, region, cdn, count() AS exits, 0 AS starts
FROM {db}.sessions
GROUP BY episode, second, device, region, cdn;

CREATE MATERIALIZED VIEW IF NOT EXISTS {db}.mv_starts_by_second TO {db}.exits_by_second AS
SELECT episode, start_sec AS second, device, region, cdn, 0 AS exits, count() AS starts
FROM {db}.sessions
GROUP BY episode, second, device, region, cdn;

-- Seek-back heatmap: where viewers rewind to. Rewatched moments are the show's strongest beats.
CREATE TABLE IF NOT EXISTS {db}.seek_heatmap
(
    episode   UInt8,
    to_bucket UInt32,      -- 10-second bucket the viewer seeks to
    backward  UInt8,       -- 1 if seek_to < position
    seeks     UInt64
)
ENGINE = SummingMergeTree(seeks)
ORDER BY (episode, to_bucket, backward);

CREATE MATERIALIZED VIEW IF NOT EXISTS {db}.mv_seek_heatmap TO {db}.seek_heatmap AS
SELECT episode, intDiv(seek_to_sec, 10) * 10 AS to_bucket, seek_to_sec < position_sec AS backward, count() AS seeks
FROM {db}.playback_events
WHERE event = 'seek'
GROUP BY episode, to_bucket, backward;

-- Rebuffers per minute by device/region/cdn: lets the agent separate a QoE incident from a story problem.
CREATE TABLE IF NOT EXISTS {db}.rebuffers_by_minute
(
    episode  UInt8,
    minute   UInt16,
    device   LowCardinality(String),
    region   LowCardinality(String),
    cdn      LowCardinality(String),
    rebuffers UInt64
)
ENGINE = SummingMergeTree(rebuffers)
ORDER BY (episode, minute, device, region, cdn);

CREATE MATERIALIZED VIEW IF NOT EXISTS {db}.mv_rebuffers_by_minute TO {db}.rebuffers_by_minute AS
SELECT episode, intDiv(position_sec, 60) AS minute, device, region, cdn, count() AS rebuffers
FROM {db}.playback_events
WHERE event = 'rebuffer'
GROUP BY episode, minute, device, region, cdn;

-- Convenience view: retention curve per episode, one row per second of runtime.
CREATE OR REPLACE VIEW {db}.retention_curve AS
WITH agg AS (
    SELECT episode, second, sum(exits) AS exits, sum(starts) AS starts
    FROM {db}.exits_by_second
    GROUP BY episode, second
),
grid AS (
    SELECT episode, toUInt32(second) AS second
    FROM (SELECT episode, max(second) AS m FROM {db}.exits_by_second GROUP BY episode)
    ARRAY JOIN range(toUInt32(m) + 1) AS second
)
SELECT
    grid.episode AS episode,
    grid.second AS second,
    sum(coalesce(agg.starts, 0)) OVER (PARTITION BY grid.episode ORDER BY grid.second)
      - sum(coalesce(agg.exits, 0)) OVER (PARTITION BY grid.episode ORDER BY grid.second) AS viewers,
    sum(coalesce(agg.starts, 0)) OVER (PARTITION BY grid.episode) AS starters,
    viewers / starters AS retention
FROM grid
LEFT JOIN agg ON agg.episode = grid.episode AND agg.second = grid.second
ORDER BY episode, second;

-- Convenience view: per-scene completion (viewers at scene end / viewers at scene start).
CREATE OR REPLACE VIEW {db}.scene_completion AS
SELECT
    s.episode AS episode, s.scene_number AS scene_number, s.slugline AS slugline, s.kind AS kind,
    s.start_sec AS start_sec, s.end_sec AS end_sec,
    rs.viewers AS viewers_at_start,
    re.viewers AS viewers_at_end,
    re.viewers / rs.viewers AS completion,
    (rs.viewers - re.viewers) / rs.viewers / ((s.end_sec - s.start_sec) / 60) AS loss_per_minute
FROM {db}.scenes AS s
LEFT JOIN {db}.retention_curve AS rs ON rs.episode = s.episode AND rs.second = s.start_sec
LEFT JOIN {db}.retention_curve AS re ON re.episode = s.episode AND re.second = s.end_sec
ORDER BY s.episode, s.scene_number;
