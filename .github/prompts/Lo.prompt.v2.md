````prompt
# /Lo — Localize with loc-ref

## Quick Reference
**Workflow**: lookup → partial → normalize → placeholders → audit → edit
**Must use**: loc_getByKey/fuzzySearch → record top-3 → stem search for families  
**Hard normalize**: True→真・, midas→強欲, ichor→霊液, Altar→アルター, Corruption→不浄, Copper→銅
**Style**: tooltips plain/no period, quotes「…」, placeholders {0}{Name} with quotes when leading
**Fail tokens**: トゥルー*, midas, ichor (untranslated)

## Command: /Lo

Translate HJSON into Japanese using CLAUDE.md/CLAUDE.xml guidelines and #loc-ref tools.

**Requirements:**
- Follow CLAUDE.md (human guide) and CLAUDE.xml (machine rules)
- Use vanilla `Localization/ja-JP.hjson` terms via #loc-ref tools  
- Enforce critical rules: T-2/T-2b (placeholder quotes), Q-1/Q-2 (Japanese quotes), S-1 (tooltip style)
- Keep placeholders intact: {0} {Name} → quote when value-leading
- Normalize: True→真・, midas→強欲, ichor→霊液, Altar→アルター, Corruption→不浄, Copper→銅

**loc-ref tools (required):**
- `loc_getByKey` / `loc_fuzzySearch`: canonical lookup (record top-3)
- `loc_normalizeName`: normalize True→真・ + glossary terms
- `loc_placeholderCheck` + `loc_checkPlaceholdersParity`: verify placeholders
- `loc_auditText` / `loc_auditFile`: validate before save

**Input format:**
```hjson
<hjson snippet or file path>
```

**Output:**
- **File path**: edit in-place, reply with brief summary + TRACE
- **Snippet**: translated HJSON only, preserve structure/indentation

**TRACE format (file input only):**
```
- Lookup: [query] → [top3 matches]
- Partial: [stem] → [vanilla consistency]  
- Normalize: [applied rules]
- Placeholders: missing=[n] extra=[n]
- QA: [rule violations count]
```

**Key rules:**
- Value starts with {0}/{Name}/[] → wrap in "..." (T-2/T-2b)
- Tooltip style: plain, no period (S-1)
- Quotes: 'text'/"text" → 「text」(Q-1)
- No double brackets: 「「」」→「」(Q-2)
- ASCII placeholders: {Name} not ｛Name｝ (T-3)

**Examples:**
- `True Excalibur` → `真・エクスカリバー`
- `Tooltip: Increases damage` → `Tooltip: ダメージ増加`
- `Value: {0} level` → `Value: "{0} レベル"`

````
