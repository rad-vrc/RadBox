import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// Use package subpath export with extension so Node ESM resolves via package.json exports
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Hjson from "hjson";
import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import chalk from "chalk";

const JA_HJSON_PATH = path.normalize(
  "d:/dorad/Documents/My Games/Terraria/tModLoader/ExternalLocalizer/Localization/ja-JP.hjson"
);

function flatten(obj, prefix = "") {
  const entries = [];
  const stack = [{ obj, prefix }];
  while (stack.length) {
    const { obj: cur, prefix } = stack.pop();
    if (typeof cur === "string") {
      // ignore empty root marker ("": "") or blank strings
      if (prefix !== "" && cur.trim() !== "") {
        entries.push({ key: prefix, value: cur });
      }
      continue;
    }
    if (cur && typeof cur === "object") {
      for (const [k, v] of Object.entries(cur)) {
        const nextKey = prefix ? `${prefix}.${k}` : k;
        stack.push({ obj: v, prefix: nextKey });
      }
    }
  }
  return entries;
}

function extractPlaceholders(text) {
  if (typeof text !== "string") return [];
  const braces = Array.from(text.matchAll(/\{\d+\}/g)).map(m => m[0]);
  const refs = Array.from(text.matchAll(/\{\$[\w\.]+(?:@\d+)?\}/g)).map(m => m[0]);
  const plurals = Array.from(text.matchAll(/\{\^\d+:[^}]+\}/g)).map(m => m[0]);
  return [...braces, ...refs, ...plurals];
}

// Basic glossary and query normalization based on CLAUDE.md
const GLOSSARY_MAP = [
  [/\bIchor\b/gi, "霊液"],
  [/\bMidas\b/gi, "強欲"],
  [/\bmana\s*cost\b/gi, "消費マナ"],
  [/\bGranite\b/gi, "御影石"],
  [/\bimmunity\b/gi, "耐性"],
  [/\bEmblem\b/gi, "紋章"],
  [/\bFragment\b/gi, "断片"],
  [/\bCorruption\b/gi, "不浄"],
  [/\bLesser\s+([A-Za-z]+)\s+Potion\b/gi, "小型$1ポーション"],
  // common items
  [/\bRod\s+of\s+Discord\b/gi, "ロッド・オブ・ディスコード"],
  [/\bTerra\s+Blade\b/gi, "テラブレード"],
  [/\bTrue\s+Excalibur\b/gi, "真・エクスカリバー"],
];

function normalizeQuery(q) {
  if (!q) return q;
  let out = q;
  // True prefix → 真・
  out = out.replace(/(^|\s)True\s+/g, (m, p1) => `${p1}真・`);
  // Apply glossary substitutions
  for (const [re, rep] of GLOSSARY_MAP) out = out.replace(re, rep);
  // Normalize ASCII quotes to Japanese quotes to improve matching on ja text
  out = out.replace(/["\u201C\u201D]/g, ""); // drop straight/double quotes for search
  out = out.replace(/[\']/g, "");
  return out;
}

function loadJa() {
  try {
    if (!fs.existsSync(JA_HJSON_PATH)) {
      throw new Error(`Localization file not found: ${JA_HJSON_PATH}`);
    }
    
    const raw = fs.readFileSync(JA_HJSON_PATH, "utf8");
    const json = Hjson.parse(raw);
  const flat = flatten(json);
    const index = new Map(flat.map(e => [e.key, e.value]));
    const fuse = new Fuse(flat, {
      includeScore: true,
  includeMatches: false,
  shouldSort: true,
  useExtendedSearch: true,
      threshold: 0.25,
      keys: [
        { name: "key", weight: 0.4 },
        { name: "value", weight: 0.6 }
      ],
      ignoreLocation: true,
      minMatchCharLength: 2
    });
    return { flat, index, fuse };
  } catch (error) {
    console.error(chalk.red(`[loc-ref-mcp] Error loading ja-JP.hjson: ${error.message}`));
    throw error;
  }
}

let state;
try {
  state = loadJa();
  console.error(chalk.green(`[loc-ref-mcp] Loaded ${state.flat.length} entries from ja-JP.hjson`));
} catch (error) {
  console.error(chalk.red(`[loc-ref-mcp] Failed to initialize: ${error.message}`));
  process.exit(1);
}

const server = new McpServer({ name: "loc-ref-mcp", version: "0.1.0" });

// loc.getByKey
server.registerTool(
  "loc_getByKey",
  {
    description: "Exact localization lookup by key",
    inputSchema: { key: z.string() },
    outputSchema: {
      key: z.string(),
      value: z.union([z.string(), z.null()]),
      exists: z.boolean(),
    },
  },
  async ({ key }) => {
    const value = state.index.get(key) ?? null;
    const structured = { key, value, exists: value !== null };
    return {
      content: [
        { type: "text", text: value === null ? "(not found)" : String(value) }
      ],
      structuredContent: structured,
    };
  }
);

// loc.fuzzySearch
server.registerTool(
  "loc_fuzzySearch",
  {
    description: "Fuzzy search over key and value",
    inputSchema: {
      query: z.string(),
      limit: z.number().int().min(1).max(100).optional(),
    },
    outputSchema: {
      matches: z.array(
        z.object({
          key: z.string(),
          value: z.string(),
          score: z.number().nullable().optional(),
        })
      ),
      normalizedQuery: z.string().optional(),
    },
  },
  async ({ query, limit }) => {
    const lim = typeof limit === "number" ? limit : 10;
    const nq = normalizeQuery(query);
    const res = state.fuse.search(nq || query, { limit: lim });
    const matches = res.map(r => ({ key: r.item.key, value: r.item.value, score: r.score ?? null }));
    return {
      content: [ { type: "text", text: `matches: ${matches.length}` } ],
      structuredContent: { matches, normalizedQuery: nq },
    };
  }
);

// loc.auditText: run guideline checks (subset via regex)
server.registerTool(
  "loc_auditText",
  {
    description: "Run guideline checks against a single value (regex-based).",
    inputSchema: { value: z.string(), key: z.string().optional() },
    outputSchema: {
      issues: z.array(z.object({
        rule: z.string(), message: z.string(), match: z.string().optional()
      }))
    },
  },
  async ({ value, key }) => {
    const issues = [];
    // Q-2: double kagi quotes
    if (/「「|」」/.test(value)) issues.push({ rule: "Q-2", message: "二重鉤括弧は禁止（「…」に統一）", match: "「「 or 」」" });
    // T-3: fullwidth braces
    if (/[｛］［｝]/.test(value)) issues.push({ rule: "T-3", message: "プレースホルダーの括弧は ASCII {} を使用", match: "全角括弧" });
    // T-1: Disabled for HJSON compatibility - only apply to actual translation values, not structural elements
    // if (/^(\{[^}]+\}|\[[^\]]+\])/.test(value)) issues.push({ rule: "T-1", message: "先頭が{}または[]の値は必ず\"...\"で囲む" });
    if (/^\{\d+\}/.test(value)) issues.push({ rule: "T-2", message: "先頭の数値プレースホルダーは必ず\"...\"で囲む" });
    if (/^\{[A-Za-z_][A-Za-z0-9_]*\}/.test(value)) issues.push({ rule: "T-2b", message: "先頭の名前付きプレースホルダーは必ず\"...\"で囲む" });
    // Q-1: quote normalization (heuristic: contains ASCII quotes around JP text)
    if (/["'].*[\u3040-\u30FF\u4E00-\u9FFF].*["']/.test(value)) {
      issues.push({ rule: "Q-1", message: "セリフの引用符は日本語の「…」に統一（TownNPCMood除く）" });
    }
    // true item naming
    if (/\bTrue\s+[A-Z]/.test(value)) issues.push({ rule: "N-1c", message: "真・（中黒）で表現：True Name → 真・Name" });
    return { content: [ { type: "text", text: `${issues.length} issue(s)` } ], structuredContent: { issues } };
  }
);

// loc.auditFile: scan a file for violations (subset of regex from CLAUDE.md)
server.registerTool(
  "loc_auditFile",
  {
    description: "Scan an .hjson file and report guideline violations (regex-based).",
    inputSchema: { path: z.string(), maxIssues: z.number().int().min(1).max(5000).optional() },
    outputSchema: {
      issues: z.array(z.object({ line: z.number(), rule: z.string(), match: z.string().optional() }))
    },
  },
  async ({ path: filePath, maxIssues }) => {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);
    const issues = [];
    const push = (line, rule, match) => { if (!maxIssues || issues.length < maxIssues) issues.push({ line, rule, match }); };
    const reDoubleKagi = /「「|」」/;
    const reStartPlaceholderNumUnquoted = /^[^#\n]*:\s*\{\d+\}(?!\s*\")/;
    const reStartPlaceholderNameUnquoted = /^[^#\n]*:\s*\{[A-Za-z_][A-Za-z0-9_]*\}(?!\s*\")/;
    // T-1: Only match values that start with { or [ and contain actual content (not just structural declarations)
    // Exclude pure structural declarations like "Items: {" or "Key: {"
    const reStartObjectOrArrayUnquoted = /^[^#\n]*:\s*(\{[^}]+\}|\[[^\]]+\])(?!\s*\")/;
    const reFullwidthBraces = /[｛］［｝]/;
    lines.forEach((ln, i) => {
      const n = i + 1;
      // Skip structural HJSON declarations (lines ending with ": {" or ": [" with only whitespace after)
      if (/:\s*[\{\[]\s*$/.test(ln)) return;
      
      if (reDoubleKagi.test(ln)) push(n, "Q-2", "double kagi quotes");
      if (reStartPlaceholderNumUnquoted.test(ln)) push(n, "T-2", "leading {n} without quotes");
      if (reStartPlaceholderNameUnquoted.test(ln)) push(n, "T-2b", "leading {Name} without quotes");
      // NOTE: T-1 rule completely removed for HJSON structural compatibility
      if (reFullwidthBraces.test(ln)) push(n, "T-3", "fullwidth braces detected");
    });
    return { content: [ { type: "text", text: `${issues.length} issue(s)` } ], structuredContent: { issues } };
  }
);

// loc.checkPlaceholdersParity: compare placeholder sets between source and target
server.registerTool(
  "loc_checkPlaceholdersParity",
  {
    description: "Compare placeholder sets between source and target text.",
    inputSchema: { source: z.string(), target: z.string() },
    outputSchema: {
      source: z.array(z.string()), target: z.array(z.string()), missingInTarget: z.array(z.string()), extraInTarget: z.array(z.string())
    },
  },
  async ({ source, target }) => {
    const s = Array.from(new Set(extractPlaceholders(source)));
    const t = Array.from(new Set(extractPlaceholders(target)));
    const missing = s.filter(x => !t.includes(x));
    const extra = t.filter(x => !s.includes(x));
    return {
      content: [ { type: "text", text: `missing: ${missing.length}, extra: ${extra.length}` } ],
      structuredContent: { source: s, target: t, missingInTarget: missing, extraInTarget: extra },
    };
  }
);

// loc.normalizeName: suggest normalized JA naming (simple rules)
server.registerTool(
  "loc_normalizeName",
  {
    description: "Suggest JA naming for an item name using simple rules (True→真・, glossary).",
    inputSchema: { enName: z.string() },
    outputSchema: { suggestion: z.string(), rulesApplied: z.array(z.string()) },
  },
  async ({ enName }) => {
    let s = enName.trim();
    const rules = [];
    if (/^True\s+/.test(s)) { s = s.replace(/^True\s+/, "真・"); rules.push("True→真・"); }
    const before = s;
    for (const [re, rep] of GLOSSARY_MAP) s = s.replace(re, rep);
    if (s !== before) rules.push("glossary substitutions");
    return { content: [ { type: "text", text: s } ], structuredContent: { suggestion: s, rulesApplied: rules } };
  }
);

// loc.placeholderCheck
server.registerTool(
  "loc_placeholderCheck",
  {
    description: "Extract placeholders present in a text",
    inputSchema: { text: z.string() },
    outputSchema: { placeholders: z.array(z.string()) },
  },
  async ({ text }) => {
    const placeholders = extractPlaceholders(text);
    return {
      content: [
        { type: "text", text: placeholders.join(" ") }
      ],
      structuredContent: { placeholders },
    };
  }
);

// loc.reload (Optional)
server.registerTool(
  "loc_reload",
  {
    description: "Reload ja-JP.hjson and rebuild index",
    inputSchema: {},
    outputSchema: { entries: z.number() },
  },
  async () => {
    state = loadJa();
    return {
      content: [ { type: "text", text: `entries: ${state.flat.length}` } ],
      structuredContent: { entries: state.flat.length },
    };
  }
);

try {
  await server.connect(new StdioServerTransport());
  console.error(chalk.green("[loc-ref-mcp] Server started successfully"));
} catch (error) {
  console.error(chalk.red(`[loc-ref-mcp] Failed to start server: ${error.message}`));
  process.exit(1);
}
