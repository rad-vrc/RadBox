import { createServer, stdio } from "@modelcontextprotocol/sdk/server";
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
      entries.push({ key: prefix, value: cur });
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

function loadJa() {
  const raw = fs.readFileSync(JA_HJSON_PATH, "utf8");
  const json = Hjson.parse(raw);
  const flat = flatten(json);
  const index = new Map(flat.map(e => [e.key, e.value]));
  const fuse = new Fuse(flat, {
    includeScore: true,
    threshold: 0.25,
    keys: [
      { name: "key", weight: 0.4 },
      { name: "value", weight: 0.6 }
    ],
    ignoreLocation: true,
    minMatchCharLength: 2
  });
  return { flat, index, fuse };
}

const state = loadJa();
console.log(chalk.green(`[loc-ref-mcp] Loaded ${state.flat.length} entries from ja-JP.hjson`));

const server = createServer({
  name: "loc-ref-mcp",
  version: "0.1.0",
});

server.tool("loc.getByKey", "Exact localization lookup by key", {
  input: { type: "object", properties: { key: { type: "string" } }, required: ["key"] },
  output: { type: "object", properties: { key: { type: "string" }, value: { type: ["string", "null"] }, exists: { type: "boolean" } } },
  async handler({ key }) {
    const value = state.index.get(key) ?? null;
    return { key, value, exists: value !== null };
  }
});

server.tool("loc.fuzzySearch", "Fuzzy search over key and value", {
  input: { type: "object", properties: { query: { type: "string" }, limit: { type: "number", default: 10 } }, required: ["query"] },
  output: { type: "object", properties: { matches: { type: "array", items: { type: "object" } } } },
  async handler({ query, limit = 10 }) {
    const res = state.fuse.search(query, { limit });
    return { matches: res.map(r => ({ key: r.item.key, value: r.item.value, score: r.score })) };
  }
});

server.tool("loc.placeholderCheck", "Extract placeholders present in a text", {
  input: { type: "object", properties: { text: { type: "string" } }, required: ["text"] },
  output: { type: "object", properties: { placeholders: { type: "array", items: { type: "string" } } } },
  async handler({ text }) {
    return { placeholders: extractPlaceholders(text) };
  }
});

await server.connect(stdio());
