# /Lo — Localize with loc-ref

Quick Reference (read first):
- Canonical lookup: use loc_getByKey or loc_fuzzySearch; record top-3; do a stem search for families (e.g., Altar)
- Hard normalization (must):
	- True <Name> → 真・<Name>
	- midas → 強欲
	- ichor → 霊液
	- Altar → アルター / Corruption → 不浄 / Copper → 銅
	- Pouches: 無限の〜ポーチ
	- Projectile suffixes: （発射体）/（保持発射体）/（爆発）/（レーザー）
- Style: tooltips are plain, no trailing 。; quotes use 「…」; keep placeholders {0} {Name}
- Fail if output contains: トゥルー*, midas, ichor (untranslated)
- Output: edit file in place; reply with brief summary + minimal TRACE

Command: /Lo

Goal: Translate given HJSON (or snippet) into Japanese, strictly following CLAUDE.md and CLAUDE.xml, and using #loc-ref tools for canonical references.

Requirements:
- Read and obey `CLAUDE.md` (human guide) and `CLAUDE.xml` (machine rules)
- Prefer vanilla `Localization/ja-JP.hjson` terms via #loc-ref
- Enforce HARD RULES (T-1/T-2/T-2b/T-3/Q-1/Q-2/S-1/S-1a/S-2)
- Keep placeholders intact and quoted where required
- Keep style: Items tooltips = plain style without period; quotes = 「…」
- Normalize naming: "True <Name>" must become "真・<Name>"; also normalize midas→強欲, ichor→霊液, Altar→アルター, Corruption→不浄, Copper→銅 (use loc_normalizeName)

MUST use loc-ref tools:
- Always call `loc_getByKey` or `loc_fuzzySearch` first and record the top-3 candidates (normalizedQuery included)
- For compound terms, also perform a stem partial-match fuzzy search (e.g., query "Altar") and adopt existing vanilla naming (e.g., デーモンアルター/クリムゾンアルター)
- Use `loc_normalizeName` for True→真・ and glossary normalization; record suggestion (fail if kept as トゥルー*)
- Verify placeholders with `loc_placeholderCheck` and `loc_checkPlaceholdersParity`; record missing/extra
- Run `loc_auditText` (and `loc_auditFile` for file path) and summarize issues; mark object/array-leading T-1 from structure as "structural-only"

loc-ref usage (implicit during task):
- loc_getByKey, loc_fuzzySearch for canonical terms
- loc_placeholderCheck and loc_checkPlaceholdersParity for placeholders
- loc_auditText/loc_auditFile before finalizing

Input format:
```hjson
<your hjson snippet or a path to .hjson>
```

Output format:
- When input is a file path, directly edit that file in place and save changes
- In chat, return a brief summary with a minimal TRACE block (no full content)
- When input is a snippet, reply with only the translated HJSON snippet, preserving structure and indentation
- Do not add comments unless asked

TRACE (include when path input):
- Lookup: key or normalizedQuery and top-3 matches
- Partial: stem query (e.g., "Altar") and top-3 matches for consistency
- Normalize: rule suggestions applied (e.g., True Excalibur → 真・エクスカリバー; midas → 強欲; ichor → 霊液)
- Placeholders: missing/extra
- QA: audit counts by rule (note structural-only for structural T-1)

Examples:
- Canonical lookup: TerraBlade → テラブレード
- True Excalibur → 真・エクスカリバー (via normalize rule)

Edge cases:
- If value starts with {0}/{Name}/[]/{} → wrap whole value with "..." per T-1/T-2
- If unsure of a term → use loc_fuzzySearch, then align to closest vanilla

Notes:
- Use half-width ASCII for placeholders {0} {Name}
- Avoid double nested quotes; use single Japanese kagi-brackets 「…」
