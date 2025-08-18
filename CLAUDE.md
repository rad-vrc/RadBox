##############################################
# Terraria Mod 翻訳ガイドライン (LLM最適化版)
# Version: 2025-08-08
# Scope: hjsonローカライズ（ja-JP/en-US 等）
##############################################

== 優先順位 (Higher wins) ==
P1. バニラ ja-JP.hjson の既存表現
P2. 本ガイドライン（Hard Rules > Soft Rules）
P3. 文脈に応じた自然な日本語

== loc-ref（MCP）活用ガイド ==
目的: バニラの `Localization/ja-JP.hjson` を唯一の基準（P1）として参照し、ブレない訳語・表記で翻訳する。

・利用サーバー: #loc-ref（stdio）
・主なツール（underscore 名称）

- loc_getByKey(key): キーを完全一致で取得（基準訳の確認）
- loc_fuzzySearch(query, opts?): キー名/値の両方に対するあいまい検索（True→真・などの正規化込み）
- loc_placeholderCheck(text): 文字列中のプレースホルダー抽出
- loc_reload(): 基準 hjson の再読み込み（変更を反映）
- loc_auditText(value): ガイドライン違反の単体チェック（T-1/T-2/T-2b/T-3/Q-2 等）
- loc_auditFile(path): hjson 1ファイル全体の違反スキャン（行番号付き）
- loc_checkPlaceholdersParity(source, target): 置換パラメータの不足/過剰比較
- loc_normalizeName(name): 名称の正規化候補（例: True → 真・）

・代表的な使い方（チャット欄で #loc-ref を付けて呼び出し）

1. 基準キーの確認: Terra Blade の訳

  Call:

  ```json
  { "tool": "loc_getByKey", "args": { "key": "TerraBlade" } }
  ```

  Result:

  ```json
  { "key": "TerraBlade", "value": "テラブレード", "exists": true }
  ```

1. 類似語検索（キー不明時/揺れ吸収）

  Call:

  ```json
  { "tool": "loc_fuzzySearch", "args": { "query": "Rod of Discord", "opts": { "limit": 5 } } }
  ```

  Note: matches[] から該当キー/表記を特定

1. 名称正規化の提案（True 系など）

  Call:

  ```json
  { "tool": "loc_normalizeName", "args": { "name": "True Excalibur" } }
  ```

  Result:

  ```json
  { "suggestion": "真・エクスカリバー" }
  ```

1. プレースホルダー検査（書く前/書いた後）

  Call:

  ```json
  { "tool": "loc_placeholderCheck", "args": { "text": "{0} レベル…" } }
  ```

  Result:

  ```json
  { "placeholders": ["{0}"] }
  ```

  Parity:

  ```json
  { "tool": "loc_checkPlaceholdersParity", "args": { "source": "{0}…", "target": "{0}…" } }
  ```

  Note: missing/extra の有無を確認

1. ガイドライン違反検出（保存前）

  Call (Text):

  ```json
  { "tool": "loc_auditText", "args": { "value": "{0}レベルの王たちの庇護を得る" } }
  ```

  Expect:

  ```json
  { "issues": [] }
  ```

  Call (File):

  ```json
  { "tool": "loc_auditFile", "args": { "path": "d:/.../ja-JP_Mods.Example.hjson" } }
  ```

  Use: 全行を静的チェック（T-1/T-2/T-2b/T-3/Q-2 など）

1. 基準の更新反映（必要時）

  Call:

  ```json
  { "tool": "loc_reload", "args": {} }
  ```

  Result:

  ```json
  { "ok": true, "entries": 17000 }
  ```

・ワークフロー（推奨）

1. まず loc_getByKey か loc_fuzzySearch で「バニラ基準の表記」を確定（P1）
1. 固有名詞は loc_normalizeName でルールを再確認（True→真・、Rod of … など）
1. 翻訳を書く。書式は HARD RULES を順守（先頭{} / [] / {0} は必ず "…"）
1. 置換や参照のプレースホルダーを loc_placeholderCheck / loc_checkPlaceholdersParity で整合確認
1. 保存前に loc_auditText / loc_auditFile で違反ゼロを確認
1. 迷ったら P1→P2→P3。P2 の語法は E-1/E-2/E-3 で統一

== HARD RULES（絶対遵守） ==
[T-2] プレースホルダーが先頭の値（{0},{1},…）は必ず "..." で囲む
  OK: KingsTooltip: "{0}レベルの王たちの庇護を得る"
  NG: KingsTooltip: {0}レベルの王たちの庇護を得る
[T-2b] 名前付きプレースホルダーが先頭の値（{Keybind},{NPCName},…）も必ず "..." で囲む
  OK: KeybindTooltip: "{Keybind} でダッシュ"
  NG: KeybindTooltip: {Keybind} でダッシュ
[T-3] プレースホルダー名は英数波括弧のまま。日本語括弧にしない
  OK: {NPCName}
  NG: ｛NPCName｝ / ［NPCName］
[Q-1] セリフ調 'text' / "text" は「text」に統一（日本語は一重の鉤括弧のみ）
[Q-1a] 例外: TownNPCMood の台詞は、見た目の引用符としてダブルクォート（"…"）を用いる。値は "…" のみでOK（外側の単引用は不要）。
  例: Content: "満足しています"
[Q-2] 二重鉤括弧「「…」」は禁止。常に一重「…」
[S-1] Items の Tooltip/Description は常体・句点なし
[S-1a] Items の Tooltip 内での引用は原則「…」を用いる（英語の "…" は日本語に合わせて「…」に変換）。
[S-2] NPC/Config 等の説明文は丁寧語を許可（句点は文脈に応じて）

== SOFT RULES（推奨） ==
[N-1] アイテム名の訳語パターン
  a) 日本語変換: Iron Sword → 鉄の剣
  b) カタカナ保持: Terra Blade → テラブレード
  c) 進化によるTrueの扱い: True Excalibur → 真・エクスカリバー（必須・例外なし。トゥルー*は禁止）
  c) 前置詞保持: Rod of Discord → ロッド・オブ・ディスコード
[E-1] 数値効果の動詞統一
  増加: damage/knockback/immunity/jump height/mana usage → 「増加」
  上昇: crit chance/drop chance/spawn rate/speed → 「上昇」
  増進: life/mana regeneration → 「増進」
  luck（運）: 「増加/減少」を用いる（例: 「運が{0}増加」「運が{0}減少」）
[E-2] 複合効果は文末側の属性に合わせる
  例: 「ローグダメージと速度が10%上昇」/「速度とローグダメージが10%増加」
[E-3] 数値付き効果の語順統一
  {数値}%{属性}が{動詞} → {属性}が{数値}％{動詞}
  例: {0}%近接攻撃速度が上昇 → 近接攻撃速度が{0}％上昇
[X-1] 定型表現
  ○% chance to not consume X → 「○%の確率でXを消費しない」
  ミニオン/セントリー数 → 「召喚できる…の数がX体増える」
  防御貫通（曖昧）→ 「防御無視値が増加/減少」（数値不明時）
  防御貫通（明確）→ 「敵の防御力をX無視する」（「ポイント」を付けない）
  用語統一（ムチ）→
    ムチ速度 → 「鞭の攻撃速度」
    ムチの射程 → 「鞭の攻撃範囲」

== QUICK CHEATSHEET（参照用） ==
・弾薬節約: 「{P}%の確率で弾薬を消費しない」
・ロケット等の弾種指定: 「{P}%の確率で{弾種}を消費しない」
・防御無視（数値あり）: 「敵の防御力を{N}無視する」
・防御無視（数値不明）: 「防御無視値が増加」
・ムチ関連: 「鞭の攻撃速度」「鞭の攻撃範囲」
・Luck（運）の増減: 「運が{N}増加」「運が{N}減少」

== 専門用語対訳（Glossary） ==
Ichor: 霊液
Midas: 強欲
mana cost: 消費マナ
true (item): 真・(アイテム)
molten: 溶岩
Granite: 御影石
immunity: 耐性
Emblem: 紋章
Fragment: 断片
Lesser [X] Potion: 小型[X]ポーション
  例: Lesser Healing Potion → 小型回復ポーション
      Lesser Mana Potion → 小型マナポーション
luck: 運（数値変化の表現は「増加/減少」を用いる）
Corruption: 不浄

== 例（Before → After） ==

1. 引用符変換
  'Rainbow effects!' → 「レインボー効果！」
  "Who said..." → 「誰が…」
1. 先頭プレースホルダー
  Key: {0} bonus → Key: "{0} ボーナス"
1. 構造
  Tooltip: 『…』 → Tooltip: 「…」

== チェックリスト（1回だけ使用） ==

- [ ] S-Style: 文体統一（常体/丁寧語）
- [ ] G-Glossary: 用語対訳の一致
- [ ] V-Vanilla: バニラ表現と整合
- [ ] J-JSON: 先頭{} / [] / {0} の値は "..." で囲まれている（T-1/T-2）
- [ ] Q-Quotes: 二重鉤括弧禁止（Q-2）、セリフは「…」（Q-1）
- [ ] P-Placeholder: {Name} の括弧は英数の{}のまま（T-3）
- [ ] R-Ref: #loc-ref を用いて key/表記/用語/プレースホルダー整合を確認（getByKey / fuzzy / normalize / parity / audit）

== 自動検出用（参考・正規表現） ==

- 二重鉤括弧検出（NG）

  ```regex
  「「|」」
  ```

- 先頭プレースホルダーの未引用（NG・行頭～コロンまで任意）

  ```regex
  ^[^#\n]*:\s*\{\d+\}(?!\s*\")
  ```

- 先頭が名前付きプレースホルダーの未引用（NG）

  ```regex
  ^[^#\n]*:\s*\{[A-Za-z_][A-Za-z0-9_]*\}(?!\s*\")
  ```

- 日本語括弧でのプレースホルダー（NG）

  ```regex
  [｛］［｝]
  ```

- TownNPCMood のダブルクォート未付与検出（任意）

  ```regex
  TownNPCMood:[\s\S]*?:\s*[^'\"]
  ```

  （要目視確認）

== 運用メモ ==

- hjsonでは基本的に値の文字列化は必須ではないが、T-1/T-2ケースは必ず "..." で囲む。
- 迷ったら P1→P2→P3 の順で決定。Hard Rules を優先。

-- END --
