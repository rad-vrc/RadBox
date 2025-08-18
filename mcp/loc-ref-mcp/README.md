# loc-ref-mcp

Localization reference MCP server for Terraria/tModLoader ExternalLocalizer.

Goals:

- Treat `Localization/ja-JP.hjson` as the canonical source of truth
- Provide exact key lookup and fuzzy text lookup APIs via MCP tools
- Validate placeholders and style hints (basic guards)

## Features

- loadHjson: parse and flatten HJSON to key-value pairs (keeps object boundaries for category hints)
- loc_getByKey: exact lookup by localization key
  - input: { "key": "TerraBlade" }
  - output: { "key": "TerraBlade", "value": "テラブレード", "exists": true }
- loc_fuzzySearch: fuzzy match over key names and values (query is normalized, e.g., True→真・)
  - input: { "query": "Terra Blade", "opts": { "limit": 5 } }
  - output: { "normalizedQuery": "Terra Blade", "matches": [ { "key": "TerraBlade", "value": "テラブレード", "score": 0.02 }, ... ] }
- loc_placeholderCheck: extract placeholders in a text
  - input: { "text": "Use {0} with {$ref[@1]} and {^plural}" }
  - output: { "placeholders": ["{0}", "{$ref[@1]}", "{^plural}"] }
- loc_reload: reloads `Localization/ja-JP.hjson` and rebuilds the index
  - input: {}
  - output: { "ok": true, "entries": 12345 }
- Advanced (optional):
  - loc_auditText: guideline checks on a single text value (returns issue list)
    - input: { "value": "string" }
    - output: { "issues": [ { "code": "T-1", "message": "..." }, ... ] }
  - loc_auditFile: run guideline checks across an HJSON file (line numbers included)
    - input: { "path": "d:/.../file.hjson" }
    - output: { "issues": [ { "line": 123, "code": "T-2", "message": "..." }, ... ] }
  - loc_checkPlaceholdersParity: compare placeholder sets between source and target
    - input: { "source": "...", "target": "..." }
    - output: { "missing": ["{0}"], "extra": ["{$ref[@1]}"] }
  - loc_normalizeName: suggest JA naming normalization (e.g., glossary, True→真・)
    - input: { "name": "True Excalibur" }
    - output: { "suggestion": "真・エクスカリバー", "appliedRules": ["True→真・"] }

## Install & Run

- Ensure Node.js 18+
- From this folder:

```bash
npm install
npm run start
```

## VS Code mcp.json example

```json
{
  "mcpServers": {
    "loc-ref": {
      "command": "node",
      "args": [
        "d:/dorad/Documents/My Games/Terraria/tModLoader/ExternalLocalizer/mcp/loc-ref-mcp/src/server.improved.js"
      ]
    }
  }
}
```

## Tools exposed

- loc_getByKey(key: string) → { key, value, exists }
- loc_fuzzySearch(query: string, opts?: { limit?: number }) → { normalizedQuery, matches[] }
- loc_placeholderCheck(text: string) → { placeholders: string[] }
- loc_reload() → { ok: boolean, entries: number }
- loc_auditText(value: string) → { issues: Issue[] }
- loc_auditFile(path: string) → { issues: FileIssue[] }
- loc_checkPlaceholdersParity(source: string, target: string) → { missing: string[], extra: string[] }
- loc_normalizeName(name: string) → { suggestion: string, appliedRules: string[] }

## Notes

- The server reads: `d:/dorad/Documents/My Games/Terraria/tModLoader/ExternalLocalizer/Localization/ja-JP.hjson`
- For large files, it builds an index at startup; restarts needed on file changes in this MVP.
