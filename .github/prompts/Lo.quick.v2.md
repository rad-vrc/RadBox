# /Lo クイックリファレンス — 1分チートシート

## 基本ワークフロー（毎回必須）

1. **Lookup**: loc_getByKey または loc_fuzzySearch（上位3件記録）
2. **Partial**: 語幹検索（例: Altar）で系列の既存表記を統一
3. **Normalize**: 用語正規化を適用
4. **Placeholders**: parityチェック（missing/extraを記録）
5. **Audit**: loc_auditText/loc_auditFile の件数を記録

## 必須正規化（適用しないとFail）

- **True [Name]** → **真・[Name]**
- **ichor** → **霊液**
- **midas** → **強欲**
- **Altar** → **アルター** / **Corruption** → **不浄** / **Copper** → **銅**
- **Endless Pouch** → **無限の〜ポーチ**
- **Projectile表示名末尾** → **（発射体）/（保持発射体）/（爆発）/（レーザー）**

## スタイル（Items/Tooltips）

- **文体**: 常体・句点なし
- **引用**: 英語 'text'/"text" → 日本語「…」
- **プレースホルダー**: {0}, {Name} はASCIIの{}維持

## 禁止トークン（出力に含めない）

- **トゥルー***（未訳のTrue）
- **ichor**（未訳）
- **midas**（未訳）

## TRACEテンプレート（最小形式）

```
- Lookup: [query] → [top1]/[top2]/[top3]
- Partial: [stem] → [top1]/[top2]/[top3]
- Normalize: True→真・, ichor→霊液, midas→強欲 ほか適用一覧
- Placeholders: missing=[n], extra=[n]
- QA: T-2/T-2b/Q-1/Q-2/S-1 件数
```

## ルール優先順位

1. **P1**: バニラ ja-JP.hjson 既存表現
2. **P2**: ガイドライン（Hard Rules > Soft Rules）
3. **P3**: 自然な日本語

## 重要な引用符ルール

- **値が {0}, {Name}, [], {} で始まる** → 必ず "..." で囲む（T-2/T-2b）
- **構造記号**（`Items: {`など）は引用符不要
