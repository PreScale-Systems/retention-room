"""COLD HARBOR — an original eight-episode coastal mystery used as the demo catalogue.

Each episode is a list of scenes: (duration_sec, slugline, kind, characters, summary, excerpt).
`behaviour` seeds the audience simulation so the data tells a story an editor can act on:
exits concentrate on specific scenes, rewinds cluster on the reveals, and one episode has a
delivery incident (rebuffering on one CDN edge) that looks like a story drop but isn't.
"""

TITLE = "Cold Harbor"

CAST = {
    "NORA": "Nora Kelleher, marine biologist who returns to Cold Harbor after her brother Danny drowns",
    "GIL": "Gil Pratt, harbormaster, Danny's oldest friend",
    "JUNE": "June Kelleher, Danny's widow",
    "RAY": "Deputy Ray Osgood, county sheriff's office",
    "MARCUS": "Marcus Bell, owner of Bell Fisheries and the town's largest employer",
    "TESS": "Tess Amaro, seventeen, works the bait shop, saw something the night Danny died",
    "WALT": "Walt Kelleher, Nora and Danny's father, retired lobsterman",
    "DANNY": "Danny Kelleher, seen only in flashback",
}

# kind: dialogue | action | exposition | reveal | montage | credits | flashback
EPISODES = {
    1: dict(
        title="Slack Tide",
        scenes=[
            (150, "EXT. COLD HARBOR - BREAKWATER - DAWN", "action", ["GIL"], "Cold open. Gil finds Danny's skiff drifting empty inside the breakwater, outboard still running.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (200, "INT. WOODS HOLE LAB - DAY", "dialogue", ["NORA"], "Nora gets the call mid-experiment. She doesn't cry; she labels the samples first.", ""),
            (170, "EXT. ROUTE 1 - NORA'S CAR - DAY", "montage", ["NORA"], "Drive north. Radio, rain, the road narrowing to the coast.", ""),
            (240, "INT. KELLEHER HOUSE - KITCHEN - DAY", "dialogue", ["NORA", "WALT", "JUNE"], "Nora arrives. Walt won't discuss it. June is too calm.", ""),
            (180, "EXT. HARBOR - DAY", "dialogue", ["NORA", "GIL"], "Gil walks Nora through what he found. She notices the fuel gauge: full. Danny never left with a full tank.", ""),
            (150, "INT. BAIT SHOP - DAY", "dialogue", ["NORA", "TESS"], "Tess is jumpy. She says she closed early that night. The register tape says otherwise.", ""),
            (130, "INT. SHERIFF'S SUBSTATION - DAY", "dialogue", ["NORA", "RAY"], "Ray calls it an accident. Nora asks for the autopsy. Ray says there isn't one yet.", ""),
            (520, "INT. TOWN HALL - COUNCIL MEETING - NIGHT", "exposition", ["MARCUS", "GIL", "WALT"], "Council debates the Bell Fisheries dredging permit at length. Marcus explains the harbor deepening plan slide by slide.", "MARCUS: Phase one deepens the channel to fourteen feet. Phase two extends the pier. Phase three, and I know some of you have questions about phase three —"),
            (200, "EXT. TOWN HALL - PARKING LOT - NIGHT", "dialogue", ["NORA", "MARCUS"], "Marcus offers condolences and a job. Nora declines both.", ""),
            (170, "INT. DANNY'S SHED - NIGHT", "action", ["NORA"], "Nora searches the shed. A tide chart with dates circled. A second phone, dead.", ""),
            (160, "INT. KELLEHER HOUSE - JUNE'S ROOM - NIGHT", "dialogue", ["JUNE", "NORA"], "June says Danny had been sleeping on the boat for weeks. She doesn't say why.", ""),
            (140, "EXT. BREAKWATER - NIGHT", "reveal", ["NORA"], "Nora charges the second phone. One text, unsent: 'They know about the ledger.'", "ON THE PHONE: a draft message, never sent. 'They know about the ledger.' Nora looks up. Across the water, the lights of Bell Fisheries are still on."),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    2: dict(
        title="The Ledger",
        scenes=[
            (140, "EXT. BELL FISHERIES - PROCESSING FLOOR - DAWN", "action", ["MARCUS"], "Marcus inspects the morning catch. A truck leaves with no manifest.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (210, "INT. KELLEHER HOUSE - KITCHEN - DAY", "dialogue", ["NORA", "WALT"], "Nora asks Walt about the ledger. Walt says every lobsterman keeps a ledger.", ""),
            (190, "INT. BAIT SHOP - DAY", "dialogue", ["NORA", "TESS"], "Tess admits she saw Danny's boat go out at 11pm. There was a second boat.", ""),
            (230, "EXT. HARBOR - GIL'S OFFICE - DAY", "dialogue", ["NORA", "GIL"], "Gil pulls the AIS log. Danny's transponder was off. So was one other boat's: Bell's.", ""),
            (260, "INT. SHERIFF'S SUBSTATION - DAY", "dialogue", ["RAY", "NORA"], "Ray has the autopsy: water in the lungs, bruising on the wrists. He calls it inconclusive.", ""),
            (300, "EXT. COASTAL ROAD - DAY", "montage", ["NORA"], "Nora drives the coast, visiting each cove on Danny's tide chart.", ""),
            (240, "INT. DINER - DAY", "dialogue", ["NORA", "JUNE"], "June admits the mortgage is three months behind. Marcus offered to buy the house.", ""),
            (180, "INT. BELL FISHERIES - OFFICE - DAY", "dialogue", ["NORA", "MARCUS"], "Nora asks Marcus about the second boat. He says his boats don't go out at night.", ""),
            (200, "EXT. BELL FISHERIES - DOCK - NIGHT", "action", ["NORA"], "Nora sneaks onto the dock. A boat with a fresh gouge along the hull.", ""),
            (150, "INT. KELLEHER HOUSE - NIGHT", "dialogue", ["WALT", "NORA"], "Walt finally talks: Danny was keeping a ledger of Bell's night landings. Undeclared catch.", ""),
            (110, "INT. DANNY'S SHED - NIGHT", "reveal", ["NORA"], "Behind the tide chart, taped to the wall: the ledger. Dates, weights, and one initial repeated — 'R'.", "NORA peels back the chart. The ledger. Columns of dates and weights. At the bottom of every page, the same initial. R. She stares at it. Somewhere outside, a truck door slams."),
            (200, "EXT. SHED - NIGHT", "action", ["NORA", "RAY"], "Ray is outside. He says he was checking on her. Nora hides the ledger behind her back.", ""),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    3: dict(
        title="Dead Reckoning",
        scenes=[
            (120, "EXT. OCEAN - DANNY'S SKIFF - NIGHT (FLASHBACK)", "flashback", ["DANNY"], "Danny at the wheel, watching a second boat's wake.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (200, "INT. KELLEHER HOUSE - DAY", "dialogue", ["NORA", "JUNE"], "Nora tells June about the ledger. June asks her to burn it.", ""),
            (220, "EXT. HARBOR - DAY", "dialogue", ["GIL", "NORA"], "Gil warns Nora the town runs on Bell's payroll.", ""),
            (310, "INT. LIBRARY - DAY", "exposition", ["NORA"], "Nora researches the state fisheries quota system and Bell's filings on microfiche.", ""),
            (280, "INT. TOWN HALL - RECORDS ROOM - DAY", "exposition", ["NORA"], "Permit records. Bell's dredging contract was fast-tracked. The signature is the county's.", ""),
            (260, "EXT. COASTAL ROAD - DAY", "montage", ["NORA"], "More coves. More nothing.", ""),
            (240, "INT. DINER - DAY", "dialogue", ["NORA", "TESS"], "Tess says her father works nights for Bell. She's scared of what he'd lose.", ""),
            (200, "INT. SHERIFF'S SUBSTATION - DAY", "dialogue", ["RAY", "NORA"], "Ray asks Nora to hand over anything she found. She says she found nothing.", ""),
            (190, "EXT. KELLEHER HOUSE - PORCH - NIGHT", "dialogue", ["WALT", "NORA"], "Walt tells the story of the 1994 storm and the boats Bell's father 'lost'.", ""),
            (180, "INT. NORA'S ROOM - NIGHT", "action", ["NORA"], "Nora photographs every page of the ledger and mails the phone to Woods Hole.", ""),
            (160, "EXT. BREAKWATER - NIGHT", "reveal", ["NORA", "GIL"], "Gil admits he turned off Danny's transponder. Danny asked him to.", "GIL: He asked me to. Said if the AIS was on they'd know he was following. I said no. He asked again. Nora — I turned it off."),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    4: dict(
        title="Harbor Deepening",
        scenes=[
            (140, "EXT. BELL FISHERIES - NIGHT (FLASHBACK)", "flashback", ["DANNY", "MARCUS"], "Danny confronts Marcus on the dock. We don't hear what they say.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (190, "INT. KELLEHER HOUSE - DAY", "dialogue", ["NORA", "WALT"], "Nora tells Walt what Gil did. Walt says Gil is the only honest man in town.", ""),
            (210, "INT. BAIT SHOP - DAY", "dialogue", ["TESS", "NORA"], "Tess gives Nora a dashcam SD card from her father's truck. She hasn't watched it.", ""),
            (180, "INT. NORA'S ROOM - DAY", "action", ["NORA"], "The dashcam: the truck at the dock at 11:40pm. Two men carrying something to the water.", ""),
            (230, "EXT. HARBOR - DAY", "dialogue", ["NORA", "GIL"], "Gil identifies the truck. It's registered to the sheriff's office.", ""),
            (200, "INT. DINER - DAY", "dialogue", ["NORA", "RAY"], "Nora and Ray, both pretending. Ray asks about Woods Hole. Nora asks about his truck.", ""),
            (170, "INT. BELL FISHERIES - OFFICE - DAY", "dialogue", ["MARCUS", "RAY"], "Marcus tells Ray to fix it. Ray says he's already fixing it.", ""),
            (190, "EXT. KELLEHER HOUSE - DAY", "action", ["JUNE"], "June packs a bag. She leaves it by the door.", ""),
            (200, "INT. KELLEHER HOUSE - KITCHEN - NIGHT", "dialogue", ["JUNE", "NORA"], "June asks what Nora will do with the footage.", ""),
            (160, "EXT. BREAKWATER - NIGHT", "action", ["NORA", "TESS"], "Tess runs to Nora: her father knows the card is gone.", ""),
            (120, "INT. KELLEHER HOUSE - PORCH - NIGHT", "reveal", ["JUNE", "NORA"], "June confesses: she saw the boat that night from the porch. She saw two boats. She went back to bed.", "JUNE: I saw two boats. I saw his and I saw the other one and I went back to bed, Nora. I went back to bed."),
            (540, "INT. HARBORMASTER'S OFFICE - NIGHT", "exposition", ["GIL", "NORA"], "Gil lays out the entire dredging permit history: the 2019 application, the environmental review, the quota transfer clause, who signed what and when.", "GIL: The 2019 application was denied. Then in 2021 it comes back with a quota transfer clause nobody asked for. Now look at the environmental review — see the date? Same week the county changed assessors. And here —"),
            (140, "EXT. HARBOR - NIGHT", "action", ["RAY"], "Ray watches the harbormaster's office from his truck. He makes a call.", ""),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    5: dict(
        title="Edge of the Chart",
        scenes=[
            (130, "EXT. OCEAN - DAWN", "action", ["GIL"], "Gil takes his boat out to the coordinates from Danny's tide chart.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (220, "INT. KELLEHER HOUSE - DAY", "dialogue", ["NORA", "JUNE", "WALT"], "The family, finally, in one room, saying what they know.", ""),
            (240, "EXT. OCEAN - GIL'S BOAT - DAY", "action", ["GIL", "NORA"], "Sonar. Something on the bottom at fourteen feet: a sunken trap line, weighted with something that isn't traps.", ""),
            (200, "INT. SHERIFF'S SUBSTATION - DAY", "dialogue", ["RAY"], "Ray shreds a file. Then stops. Puts half of it in his jacket.", ""),
            (230, "INT. BELL FISHERIES - OFFICE - DAY", "dialogue", ["MARCUS", "NORA"], "Nora confronts Marcus with the ledger photos. He offers her a number.", ""),
            (210, "EXT. COASTAL ROAD - DAY", "montage", ["NORA"], "Nora drives to the state capital.", ""),
            (260, "INT. STATE FISHERIES OFFICE - DAY", "dialogue", ["NORA"], "A state inspector listens, then asks who else knows.", ""),
            (190, "INT. DINER - NIGHT", "dialogue", ["TESS", "GIL"], "Tess tells Gil her father is leaving town tonight.", ""),
            (220, "EXT. HARBOR - NIGHT", "action", ["GIL", "RAY"], "Ray finds Gil at the office. Ray has the half-file. He wants a deal.", ""),
            (200, "INT. KELLEHER HOUSE - NIGHT", "dialogue", ["NORA", "WALT"], "Walt gives Nora Danny's old service pistol. She refuses it. He leaves it on the table.", ""),
            (130, "EXT. BREAKWATER - NIGHT", "reveal", ["NORA"], "The state inspector's car is parked outside Bell Fisheries.", "NORA slows. The grey state sedan. Parked at Bell's. Lights off. She keeps driving."),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    6: dict(
        title="The Other Boat",
        scenes=[
            (140, "EXT. OCEAN - NIGHT (FLASHBACK)", "flashback", ["DANNY", "RAY"], "The other boat. Ray at the wheel. Danny raises a hand — not a wave.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (210, "INT. KELLEHER HOUSE - DAY", "dialogue", ["NORA", "GIL"], "Gil tells Nora about Ray's deal. Nora says there's no deal.", ""),
            (240, "EXT. TESS'S HOUSE - DAY", "action", ["TESS", "NORA"], "Tess's father is gone. His truck is gone. The dashcam mount is empty.", ""),
            (220, "INT. BELL FISHERIES - PROCESSING FLOOR - DAY", "dialogue", ["MARCUS", "RAY"], "Marcus and Ray, no longer pretending to like each other.", ""),
            (200, "INT. STATE FISHERIES OFFICE - DAY", "dialogue", ["NORA"], "The inspector is 'on leave'. His replacement has never heard of Cold Harbor.", ""),
            (230, "EXT. COASTAL ROAD - DAY", "montage", ["NORA"], "Nora drives home. Faster than she should.", ""),
            (260, "INT. KELLEHER HOUSE - KITCHEN - DAY", "dialogue", ["JUNE", "WALT"], "June tells Walt she's selling the house to Marcus. Walt says the house isn't hers to sell.", ""),
            (190, "EXT. HARBOR - NIGHT", "action", ["GIL"], "Gil pulls the sunken trap line. Inside: a waterproof case. Inside that: Danny's phone.", ""),
            (150, "INT. HARBORMASTER'S OFFICE - NIGHT", "reveal", ["GIL", "NORA"], "Danny's phone plays a video: the dock, 11:40pm, Ray and Tess's father loading the boat. Then Danny's voice: 'Ray. Ray, look at me.'", "ON THE PHONE: the dock. Ray. A second man. Danny's voice, close to the mic: 'Ray. Ray, look at me.' Ray turns. The video ends."),
            (210, "EXT. KELLEHER HOUSE - NIGHT", "action", ["NORA", "RAY"], "Ray is waiting in the driveway. He says he only wants to talk.", ""),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    7: dict(
        title="Fourteen Feet",
        scenes=[
            (150, "INT. KELLEHER HOUSE - DRIVEWAY - NIGHT (CONTINUOUS)", "dialogue", ["NORA", "RAY"], "Ray talks. He says Danny fell. He says he tried to pull him out. Nora doesn't believe him. Neither does he.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (200, "INT. KELLEHER HOUSE - NIGHT", "dialogue", ["NORA", "WALT", "JUNE"], "Nora plays the video for the family.", ""),
            (230, "EXT. HARBOR - DAWN", "action", ["GIL", "MARCUS"], "Marcus comes to the office alone. He wants the phone. Gil says it's already gone.", ""),
            (180, "INT. STATE POLICE BARRACKS - DAY", "dialogue", ["NORA"], "Nora bypasses the county entirely.", ""),
            (240, "INT. BELL FISHERIES - OFFICE - DAY", "dialogue", ["MARCUS", "RAY"], "Marcus tells Ray to leave the state. Ray tells Marcus he already gave a statement.", ""),
            (200, "EXT. TESS'S HOUSE - DAY", "dialogue", ["TESS", "NORA"], "Tess's father called from Nova Scotia. He's coming back to testify if Tess asks him to.", ""),
            (190, "INT. DINER - DAY", "dialogue", ["JUNE", "NORA"], "June tears up the sale agreement in front of Nora. It's the first thing they've agreed on.", ""),
            (280, "EXT. BELL FISHERIES - DOCK - NIGHT", "action", ["MARCUS", "GIL", "NORA"], "Marcus tries to take the boat with the gouged hull out to sea. Gil blocks the channel. It ends in the water.", "The BOAT reverses hard. GIL's skiff is already across the channel mouth. MARCUS doesn't slow. Impact. Both hulls. Gil goes into the water. NORA is on the dock, running."),
            (200, "EXT. HARBOR - NIGHT", "action", ["NORA", "GIL"], "Nora pulls Gil out at the same breakwater where he found Danny's skiff.", ""),
            (140, "INT. SHERIFF'S SUBSTATION - NIGHT", "reveal", ["RAY"], "Ray, alone, puts his badge on the desk and starts writing.", "RAY takes the badge off. Sets it on the blotter. Uncaps a pen. Writes: 'On the night of the 14th I was operating Bell Fisheries vessel —'"),
            (170, "END CREDITS", "credits", [], "End credits.", ""),
        ],
    ),
    8: dict(
        title="High Water",
        scenes=[
            (160, "EXT. COLD HARBOR - BREAKWATER - DAWN", "action", ["NORA"], "Nora at the breakwater. State police cruisers on the pier behind her.", ""),
            (60, "TITLES", "credits", [], "Main titles.", ""),
            (220, "INT. STATE POLICE BARRACKS - DAY", "dialogue", ["RAY"], "Ray's full statement. Danny confronted them. There was a struggle. Danny went in. Ray didn't jump.", ""),
            (200, "EXT. BELL FISHERIES - DAY", "action", ["MARCUS"], "Marcus is arrested on the processing floor in front of his workers.", ""),
            (240, "INT. KELLEHER HOUSE - DAY", "dialogue", ["NORA", "JUNE", "WALT"], "The family. What happens to the house. What happens to June.", ""),
            (210, "INT. HOSPITAL - DAY", "dialogue", ["GIL", "NORA"], "Gil, bandaged. Nora tells him he was right about the town. He says he was wrong about Ray.", ""),
            (230, "EXT. TOWN HALL - DAY", "dialogue", ["TESS", "NORA"], "The council meets without Marcus. Tess speaks. Her father sits in the back row.", ""),
            (190, "EXT. CEMETERY - DAY", "dialogue", ["NORA", "WALT"], "Danny's stone. Walt tells Nora to go back to Woods Hole. She says she might not.", ""),
            (200, "EXT. OCEAN - DANNY'S SKIFF - NIGHT (FLASHBACK)", "flashback", ["DANNY"], "The full night, finally, from Danny's side. He knew. He went anyway.", ""),
            (180, "EXT. BREAKWATER - DUSK", "reveal", ["NORA", "GIL"], "Nora takes Danny's skiff out for the first time. Gil watches from the office. He doesn't turn the transponder off.", "The SKIFF clears the breakwater. In the office, GIL watches the AIS screen. A dot, moving. He leaves it on."),
            (140, "END CREDITS", "credits", [], "End credits.", ""),
            (110, "EXT. STATE CAPITAL - PARKING GARAGE - NIGHT (POST-CREDITS)", "reveal", [], "The state inspector gets into a car. The driver hands him an envelope. Bell Fisheries letterhead.", "The INSPECTOR gets in. The DRIVER hands him an envelope. We see the letterhead. It isn't Bell's. It's the county's."),
        ],
    ),
}

DEVICES = {"smart_tv": 0.42, "mobile": 0.28, "web": 0.14, "tablet": 0.10, "console": 0.06}
REGIONS = {"NA": 0.46, "EU": 0.24, "LATAM": 0.13, "APAC": 0.12, "MEA": 0.05}
CDNS = {"edge-a": 0.45, "edge-b": 0.35, "edge-c": 0.20}

# Hazard multipliers by scene kind (relative chance of quitting per second inside that scene).
KIND_HAZARD = {
    "action": 0.55,
    "reveal": 0.35,
    "flashback": 0.8,
    "dialogue": 1.0,
    "montage": 1.6,
    "exposition": 2.2,
    "credits": 9.0,
}

# Story-driven behaviour the agent should discover. Keys are (episode, scene_number) 1-based.
behaviour = dict(
    # extra exit hazard, multiplicative, ramping in over the scene
    exit_boost={
        (1, 9): 2.4,    # long council exposition in the pilot
        (3, 5): 1.6,    # library research
        (3, 6): 1.7,    # records room
        (4, 13): 3.2,   # THE drop: nine minutes of permit history right after June's confession
        (2, 7): 1.5,    # coastal montage
    },
    # rewind hotspots: (episode, scene_number, seconds into scene) → weight of backward seeks landing there
    rewind_hotspots={
        (2, 12, 70): 6.0,    # the ledger reveal ("R")
        (3, 12, 90): 3.0,    # Gil's transponder confession
        (4, 12, 60): 3.5,    # June's confession
        (6, 10, 80): 7.0,    # Danny's video: "Ray, look at me"
        (7, 9, 200): 4.0,    # the dock collision
        (8, 12, 60): 5.0,    # post-credits envelope
    },
    # a delivery incident, not a story problem: rebuffering + exits for one segment only
    incident=dict(episode=5, start_sec=690, end_sec=780, device="smart_tv", region="LATAM", cdn="edge-c", exit_boost=6.0, rebuffer_rate=0.35),
    # viewers who stop at the end-credits of ep8 miss the post-credits scene
    post_credits=dict(episode=8, credits_scene=11),
)


def scene_rows():
    """Flatten EPISODES into rows for the scenes table (start/end seconds computed)."""
    rows = []
    for ep, spec in EPISODES.items():
        t = 0
        n = len(spec["scenes"])
        for i, (dur, slug, kind, chars, summary, excerpt) in enumerate(spec["scenes"], start=1):
            act = 1 if i <= n // 3 else (2 if i <= 2 * n // 3 else 3)
            rows.append(
                dict(
                    episode=ep,
                    scene_number=i,
                    start_sec=t,
                    end_sec=t + dur,
                    slugline=slug,
                    characters=chars,
                    summary=summary,
                    script_excerpt=excerpt,
                    act=act,
                    kind=kind,
                )
            )
            t += dur
    return rows


def runtime(ep: int) -> int:
    return sum(s[0] for s in EPISODES[ep]["scenes"])


def resolve_hotspots():
    """Return {(episode, absolute_second): weight} for the rewind hotspots."""
    idx = {(r["episode"], r["scene_number"]): r for r in scene_rows()}
    return {(ep, idx[(ep, sc)]["start_sec"] + off): w for (ep, sc, off), w in behaviour["rewind_hotspots"].items()}
