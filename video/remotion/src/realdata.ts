// REAL data only, per the house rules in video/BRIEF.md.
// SQL + result rows: captured verbatim from live agent runs
//   (chat_test.out = ep4 run, chat_prod.out = ep5 run — `run_query` tool calls
//    through the official mcp-clickhouse server).
// Code excerpts: verbatim from sql/schema.sql and agent/pipeline.py.

export type QueryBeat = {
  title: string; // header caption after `run_query · mcp-clickhouse`
  sql: string[];
  rows?: string[][]; // first column tinted `text`
  rowsHeader?: string[];
};

// ep4 "why does this episode lose people?" — the analyst's fixed procedure.
export const EP4_QUERIES: QueryBeat[] = [
  {
    title: 'rank scenes by loss',
    sql: [
      'SELECT scene_number, slugline, kind,',
      '    start_sec, end_sec, loss_per_minute',
      'FROM retention.scene_completion',
      'WHERE episode = 4',
      "    AND kind != 'credits'",
      'ORDER BY loss_per_minute DESC',
      'LIMIT 5',
    ],
    rowsHeader: ['scene', 'slugline', 'loss/min'],
    rows: [
      ['13', "INT. HARBORMASTER'S OFFICE - NIGHT", '0.0243'],
      ['3', 'INT. KELLEHER HOUSE - DAY', '0.0192'],
      ['4', 'INT. BAIT SHOP - DAY', '0.0054'],
    ],
  },
  {
    title: 'steepest 60 seconds',
    sql: [
      'WITH episode_retention AS (',
      '    SELECT second, retention',
      '    FROM retention.retention_curve',
      '    WHERE episode = 4',
      ')',
      'SELECT second, retention',
      '    - lag(retention, 60) OVER (ORDER BY second)',
      '    AS retention_drop',
      'FROM episode_retention',
      'WHERE second BETWEEN 2050 AND 2590',
      'ORDER BY retention_drop',
      'LIMIT 1',
    ],
  },
  {
    title: 'rule out delivery',
    sql: [
      'SELECT device, region, cdn,',
      '    sum(exits) AS total_exits',
      'FROM retention.exits_by_second',
      'WHERE episode = 4',
      '    AND second BETWEEN 2529 AND 2589',
      'GROUP BY device, region, cdn',
      'ORDER BY total_exits DESC',
      'LIMIT 10',
    ],
    rowsHeader: ['device', 'region', 'cdn', 'exits'],
    // EDITOR P2-4: the raw value is `NA` (North America); on screen next to VO
    // saying "the delivery checks are clean" it read as null/missing data.
    rows: [
      ['smart_tv', 'NA · N.America', 'edge-a', '105'],
      ['smart_tv', 'NA · N.America', 'edge-b', '85'],
      ['mobile', 'NA · N.America', 'edge-a', '65'],
      ['smart_tv', 'NA · N.America', 'edge-c', '58'],
    ],
  },
  // EDITOR P1-9: a 4th beat so no query sits motionless for ~10s, and because
  // the VO explicitly ends on "and check for rebuffering". Verbatim from the
  // live ep4 run (chat_test.out, run_query tool call #4).
  {
    title: 'check for rebuffering',
    sql: [
      'SELECT minute, device, region, cdn,',
      '    sum(rebuffers) AS total_rebuffers',
      'FROM retention.rebuffers_by_minute',
      'WHERE episode = 4',
      '    AND minute IN (42, 43)',
      'GROUP BY minute, device, region, cdn',
      'ORDER BY total_rebuffers DESC',
      'LIMIT 10',
    ],
    rowsHeader: ['minute', 'device', 'cdn', 'rebuffers'],
    rows: [
      ['42', 'mobile', 'edge-a', '8'],
      ['42', 'smart_tv', 'edge-a', '6'],
      ['43', 'smart_tv', 'edge-a', '6'],
      ['42', 'smart_tv', 'edge-b', '6'],
    ],
  },
];

// ep5 — the breakdown that exonerates the writing.
export const EP5_QUERY: QueryBeat = {
  title: 'break down exits', // shortened: the long form wrapped the header (P2-3)
  sql: [
    'SELECT device, region, cdn,',
    '    sum(exits) AS total_exits',
    'FROM retention.exits_by_second',
    'WHERE episode = 5',
    '    AND second BETWEEN 719 AND 779',
    'GROUP BY device, region, cdn',
    'ORDER BY total_exits DESC',
    'LIMIT 10',
  ],
  rowsHeader: ['device', 'region', 'cdn', 'exits'],
  rows: [
    ['smart_tv', 'LATAM', 'edge-c', '127'],
    ['smart_tv', 'NA', 'edge-a', '25'],
    ['smart_tv', 'NA', 'edge-b', '13'],
    ['mobile', 'NA', 'edge-a', '12'],
  ],
};

// sql/schema.sql lines 73–81 and 100–117 (verbatim; {db} as in source).
export const SCHEMA_EXCERPT: string[] = [
  'CREATE MATERIALIZED VIEW IF NOT EXISTS',
  '  {db}.mv_exits_by_second TO {db}.exits_by_second AS',
  'SELECT episode, end_sec AS second, device, region,',
  '  cdn, count() AS exits, 0 AS starts',
  'FROM {db}.sessions',
  'GROUP BY episode, second, device, region, cdn;',
  '',
  '-- Rebuffers per minute by device/region/cdn:',
  '-- lets the agent separate a QoE incident',
  '-- from a story problem.',
  'CREATE MATERIALIZED VIEW IF NOT EXISTS',
  '  {db}.mv_rebuffers_by_minute',
  '  TO {db}.rebuffers_by_minute AS',
  'SELECT episode, intDiv(position_sec, 60) AS minute,',
  '  device, region, cdn, count() AS rebuffers',
  "FROM {db}.playback_events WHERE event = 'rebuffer'",
  'GROUP BY episode, minute, device, region, cdn;',
];
export const SCHEMA_HIGHLIGHT = [0, 1]; // mv_exits_by_second lines

// agent/pipeline.py lines 15–16 and 38–48 (verbatim).
export const PIPELINE_EXCERPT: string[] = [
  'from google.adk.agents import LlmAgent, SequentialAgent',
  'from google.adk.tools.mcp_tool import (',
  '    MCPToolset, StdioConnectionParams,',
  ')',
  '',
  'return MCPToolset(',
  '    connection_params=StdioConnectionParams(',
  '        server_params=StdioServerParameters(',
  '            command=os.environ.get(',
  '                "MCP_CLICKHOUSE_BIN", "mcp-clickhouse"),',
  '            args=[],',
  '            env=env,',
  '        ),',
  '        timeout=60,',
  '    ),',
  '    tool_filter=["run_query", "list_tables"],',
  ')',
];
export const PIPELINE_HIGHLIGHT = [5]; // MCPToolset(
