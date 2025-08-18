# /Lo Quick Ref — 1分チートシート

使い方（毎回これだけ）

- Lookup: loc_getByKey or loc_fuzzySearch（上位3件を記録）
- Partial: 語幹検索（例: Altar）で系列の既存表記を揃える
- Normalize: 用語正規化を適用（下記）
- Placeholders: parityチェック（missing/extraを記録）
- Audit: loc_auditText/loc_auditFile の件数を記録（構造由来T-1はstructural-only）

必須正規化（Fail if not applied）

- True [Name] → 真・[Name]
- ichor → 霊液
- midas → 強欲
- Altar → アルター / Corruption → 不浄 / Copper → 銅
- Pouch（Endless）→ 無限の〜ポーチ
- Projectile系 表示名末尾 → （発射体）/（保持発射体）/（爆発）/（レーザー）

スタイル（Items/Tooltips）

- 常体・句点なし / 引用は「…」 / {0},{Name}はASCIIの{}

禁止トークン（出力に含めない）

- トゥルー* / ichor / midas（未訳のまま）

TRACE（最小テンプレ）

- Lookup: [query] → [top1]/[top2]/[top3]
- Partial: [stem] → [top1]/[top2]/[top3]
- Normalize: True→真・, ichor→霊液, midas→強欲 ほか適用一覧
- Placeholders: missing=[n], extra=[n]
- QA: T-1/T-2/T-2b/T-3/Q-2 件数（構造T-1はstructural-only）

注記

- 迷ったら P1 バニラ優先 → P2 ガイド → P3 自然さ
- 先頭が {}, [], {0}, {Name} の値は必ず "..."（T-1/T-2/T-2b）
