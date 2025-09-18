# Futaba Joint Judicial Scrivener Office Top Image Redesign Plan

## Overview
- **Canvas size**: 1920×1080px (16:9). Place safe margins that respect the existing navigation/office name area.
- **Objective**: Replace the current photo slideshow with a message-driven visual that foregrounds the office strengths.
- **Available assets**: Office logoと既存Webアイコンのみ。写真素材は追加せず、図形やテクスチャで演出。

## Visual Concept
- **Background**: Diagonal gradient from light blue (#8EC5FC) to soft green (#87E5B6) with subtle circular glow overlays to evoke trust and warmth.
- **Typography**: Yu Gothic or Noto Sans JP for Japanese text, 36–42pt for the headline, 28–32pt for subheadlines, 22–24pt for supporting bullets.
- **Icon-driven storytelling**:
  - 既存Webアイコンを単色化（白またはゴールド）し、強調ポイント左に配置。
  - 女性司法書士は曲線的なシルエットアイコン＋ゴールドラインで表現。
  - 弁護士連携は天秤・書類アイコン、渉外登記は地球儀・パスポートアイコンを円形フレームで束ねる。
- **Color accents**:
  - Primary text: Deep navy (#1F4E79) for readability on light gradients.
  - Accent separator lines/icons: Pale gold (#C9A64E) to harmonize with the logo tone.
  - CTA elements (optional): White fill with green stroke (#4BA37A) and rounded corners.
- **Shared elements**: Keep the logo and office name in the upper-left corner and preserve the current navigation spacing on the top edge. Use semi-transparent white panels (70% opacity) behind dense text blocks for contrast.

## Copywriting Priorities
1. **実績訴求** – "相続手続き5,000件以上のご相談実績"
2. **女性司法書士の在籍** – "女性司法書士が丁寧にサポート"
3. **合同事務所の強み** – "弁護士と連携するワンストップ体制"
4. **渉外登記対応** – "海外資産・外国籍の渉外登記もお任せください"

## Layout Options
### Option A: Single Hero Slide（グラフィック集約型）
| 区域 | 構成 | 詳細 |
| --- | --- | --- |
| 左40% | アイコンコラージュ | 女性司法書士アイコンを中心に、書類・バランススケール・地球儀アイコンを重ねたベクターイラスト。円形グローとゴールドラインで立体感を付与。 |
| 右60% | メッセージボード | 半透明ホワイトのパネル内にメインコピーと3つのサブポイントを縦並び。各ポイント左に既存アイコンを単色（白 or ゴールド）で配置し、薄い円形プレートで背景を整える。 |
| 下部帯 | 行動喚起 | 「無料相談受付中／お電話・オンライン対応」などを小さめのテキストで記載。必要に応じCTAボタンを右寄せ。 |

### Option B: 3枚スライドショー（テーマ別アイコン演出）
1. **Slide 1 – 実績訴求**
   - 背景：水色寄りグラデーション＋淡い書類パターン。
   - メインコピー：「相続手続き5,000件以上の実績」
   - ビジュアル：相談書類・判子・家系図アイコンを斜めに並べ、数字「5,000」を中央に大きく配置。
   - 補足：「複雑な案件も迅速・丁寧に対応」
2. **Slide 2 – 女性司法書士×合同体制**
   - 背景：緑寄りグラデーション＋柔らかな円形グロー。
   - 左側：女性司法書士アイコンを大きく配置し、ゴールドラインで囲む。
   - 右側：天秤（弁護士）＋書類（司法書士）アイコンを円形フレームに入れ、ゴールドラインで接続。
   - コピー：「女性司法書士が親身に寄り添い、弁護士と連携してワンストップ支援」
3. **Slide 3 – 渉外登記**
   - 背景：青緑グラデーション＋薄い世界地図シルエット。
   - アイコン：地球儀・パスポート・国旗モチーフアイコンをグリッド状に配置。
   - コピー：「海外資産・外国籍の渉外登記も対応」「英語対応スタッフと豊富な事例」。

> 3枚構成でもロゴ・ナビゲーションの位置は固定し、余白とフォントサイズを統一して一貫性を確保します。

## Production Roadmap

### Week 0（準備）
1. **Current layout audit**（担当：デザイナー） – 計測ツールで既存ページのロゴとナビゲーションの幅・高さを取得し、1920×1080pxアートボードにガイドを設定。スクリーンショット＋寸法メモをNotion等に保存。
2. **Asset inventory**（担当：ディレクター） – 使用可能なロゴデータ・Webアイコンを収集し、SVG/PNG形式で整理。下記アイコンマップに沿ってファイル名を統一。

### Week 1（モックアップ制作）
3. **Wireframe作成**（担当：デザイナー） – Option AをベースにFigmaでレイヤー構造を構築。
   - レイヤーグループ例：`BG`（グラデーション＋グロー）、`Logo/Nav`、`Message Panel`、`Icon Collage`、`Footer CTA`。
   - テキストスタイルを`Headline 40pt / Bold`、`Subhead 30pt / Semibold`、`Body 24pt / Regular`で登録し、再利用可能にする。
4. **Copy lock & 校正**（担当：ライター／司法書士） – 下記「Final Copy」をワイヤー上に反映し、法務観点で表現チェック。必要な場合は語尾・数字表記を確定。

### Week 2（ビジュアル仕上げ）
5. **Icon styling**（担当：デザイナー） – 既存WebアイコンをIllustrator等でアウトライン化し、白／ゴールド／濃紺の3色バリエーションを作成。女性アイコンは柔らかい角丸処理、弁護士・渉外用アイコンは円形バッジ化。
6. **背景・光エフェクト調整** – グラデーション角度（推奨135°）とノイズテクスチャ（不透明度15%）を適用し、視線誘導のゴールドラインを配置。ハイライトは`screen`ブレンド、影は`multiply`で処理。
7. **レビュー①** – PNG書き出しを共有し、レイアウト・色味・文言に対するフィードバックを収集。コメントはFigma上で整理。

### Week 3（最終化と展開）
8. **修正対応** – 収集したコメントを優先度順に反映。必要であればOption B（スライドショー）にも同様のスタイルを派生させる。
9. **アクセシビリティ確認** – 文字と背景のコントラスト比（4.5:1以上）を確認。ボタン風要素にはキーボードフォーカス時の視認性を想定。
10. **最終書き出し** – RGBカラーで高解像度JPG（品質85推奨、100ppi）＋軽量Web版（品質60）を出力し、ファイル名を`hero-main.jpg`、`hero-main-web.jpg`とする。必要に応じてSlideごとに`hero-slide01.jpg`など命名。
11. **実装連携** – 納品ファイルとスタイルガイドを開発担当へ共有。差し替え手順（画像サイズ、altテキスト候補）も添付。

## Icon & Asset Map
| 強み | 推奨アイコン | 補足 |
| --- | --- | --- |
| 5,000件実績 | 数字「5000」＋書類束アイコン | 数字はゴールドアウトライン＋白塗り。背景に淡い放射状グロー。 |
| 女性司法書士 | 女性シルエット／相談中アイコン | 髪型や表情は抽象的にし、親しみやすいカーブで構成。 |
| 弁護士連携 | 天秤＋ペン／契約書アイコン | 2つのアイコンをゴールドラインで接続し、協働感を演出。 |
| 渉外登記 | 地球儀＋パスポート／国旗ピン | 小さめのアイコンを複数並べ、国際対応の広がりを暗示。 |

## Final Copy（確定案）
- **メインコピー**：「相続手続き5,000件以上のご相談実績」
- **サブポイント**：
  1. 「女性司法書士が丁寧にサポート」
  2. 「弁護士と連携するワンストップ体制」
  3. 「海外資産・外国籍の渉外登記にも対応」
- **フッター導線（任意）**：「無料相談受付中｜お電話・オンライン対応」

## Risk & Mitigation Notes
- **アイコンのみ構成による単調さ**: アイコンサイズ・角度・重なりを変化させ、ゴールドの細ラインで視線誘導。背景に極薄ノイズ（不透明度20%以下）を重ね奥行きを確保。
- **文字量過多**: 3ポイント以上のテキストを並べる際は、2段組や折り返しを調整し、14〜16px相当以上を維持。
- **配色差異**: 実機表示で色が沈む場合、緑側の明度を上げる（例：#8EEAC6）か、テキスト色をより濃いネイビーに調整。
- **ナビ領域との干渉**: 既存HTML/CSSで余白が固定されているため、上部安全マージンを80px確保し、ナビの下端と重ならないよう確認。

## Implementation Checklist
- [ ] 既存スライドショーのDOM構造と画像差し替え手順を調査し、レスポンシブ時のトリミング挙動を確認。
- [ ] altテキスト草案を作成（例：「相続手続き5,000件以上の実績を強調したイラストバナー」）。
- [ ] JPG軽量版のファイルサイズが300KB以下になるよう最適化を実施。
- [ ] 最終ファイルをGoogle Driveまたは共有サーバーにアップロードし、クライアントチェックシートと紐付け。

## Next Actions
- ディレクター：Week 0タスクの完了報告と、アイコン不足がある場合の追加制作可否を決定。
- デザイナー：Wireframe完成後、初稿PNGを共有（予定：Week 1末）。
- クライアント：コピー表現・優先順位に問題がなければ承認し、必要なフィードバックをWeek 2初までに提出。

