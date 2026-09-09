# このプロジェクトについて

データプラットフォームエンジニアからウェブエンジニアへの転職に向けた学習プロジェクト。
転職先の期待役割(データ解析環境の整備・API・ヘッドレスCMS・PostgreSQL+JSON・Cloudflare)に
直結する技術を、実際に動くものを作りながら学ぶことが目的。完成度より理解を優先する。

## 前提
- ソフトウェアエンジニアリング完全初心者ではない(Python/Bashでの分析経験あり)が、Webアプリを一人で構築した経験はまだない
- 新しい概念(全文検索の仕組み、JSONBの使いどころ等)が出てきたら、実装だけでなく簡単に仕組みも説明すること

## 現在地 — 準備運動(astro-warmup)は完了済み

本番に入る前に、別リポジトリ `../astro-warmup` で Astro とローカル開発 + Git/GitHub の流れを一周した(2026-08-30 に全工程完了)。

- 公開サイト: https://shato-dev.github.io/astro-warmup/ / リポジトリ: https://github.com/shato-dev/astro-warmup
- 通した工程: リポジトリ作成 → Astro 雛形(minimal + TS strict) → content collection(glob loader + Zod スキーマ) → 記事(Markdown) → 共通レイアウト + CSS → 一覧/個別/タグページ(`getStaticPaths()` で生成) → クライアント検索(ビルド時に JSON を吐き、ブラウザで `filter()`) → ローカルビルド確認 → GitHub Actions で CI + main のブランチ保護 → GitHub Pages 公開
- 「ブランチ → push → Pull Request → マージ、CI が緑でないと main にマージ不可」という GitHub の基本ワークフローを一度体験済み
- 学んだ内容は `../astro-warmup/KNOWLEDGE.md`(用語集 + セッション補足)と、Notion「学習まとめ / astro-warmup」配下のスライド2ページに集約済み

### astro-warmup ↔ 本番 の対応(なぜ準備運動をしたか)

| astro-warmup(縮小版) | 本番 my-web-project |
|---|---|
| Markdown + content collection | microCMS(ヘッドレスCMS)から取得 |
| クライアント検索(`search.json` + `filter()`) | Meilisearch + Cloudflare Workers の検索API |
| GitHub Pages 公開 | Cloudflare Pages 自動デプロイ |
| `ci.yml`(build チェックのみ) | 同じ + Cloudflare Pages への deploy ジョブ |
| (なし) | Docker Compose で PostgreSQL + Meilisearch をローカル起動 |
| (なし) | PostgreSQL + JSONB でメタデータ保存・API化 |
| (なし) | OpenSearch はローカル Docker で「仕組みの理解」だけ(運用しない) |

移行時の注意: astro-warmup で苦労した `base` / `import.meta.env.BASE_URL` の扱いは、Cloudflare Pages なら公開 URL が `*.pages.dev` か独自ドメインのルートになるため軽くなる。ただし原理(Astro は自分が生成する asset URL にしか `base` を足さない、自分で書いた `<a href>` は直さない)は覚えておく。

### ここから最初にやること

Notion「転職に向けた学習TODOリスト」の先頭タスク =「GitHubリポジトリ作成 + Astroプロジェクト初期化」から着手する。
まず Plan Mode で `PLAN.md` / `TODO.md` を作り、astro-warmup と同じく各ステップに Git 操作(コミット / ブランチ / PR / CI)を意図的に混ぜて進める。

## 技術スタック
- フロントエンド: Astro
- ヘッドレスCMS: microCMS(Freeプラン)
- 全文検索: Meilisearch(学習用にOpenSearchもローカルDockerで併用)
- DB: PostgreSQL(Supabase/Neonの無料プラン、JSONB型を積極活用)
- ホスティング/API: Cloudflare Pages + Workers(無料枠)
- コンテナ: Docker / Docker Compose
- CI/CD: GitHub Actions
- **AWS / AWS CDKはスコープ外。使わない。**

## 予算に関する方針(重要)
- 従量課金のサービス・プランは使わない。月額固定/買い切りで数千円までが上限
- 新しいサービスを提案する際は、カード登録の要否と料金体系(固定/従量/トライアル後自動課金)を明記してから選択肢を示すこと
- **課金が発生しうるコマンドの実行は `.claude/settings.json` のHookで機械的にブロックされている(下記参照)。ブロックされた場合は指示文で回避しようとせず、まず私に相談すること**

### 課金ブロックの実体(`.claude/settings.json`)

- `permissions.deny`: `Bash(aws:*)` / `Bash(terraform apply*)` / `Bash(cdk deploy*)` / `Bash(cdk bootstrap*)`
- `PreToolUse` の Bash フック: コマンド文字列が `aws ` / `terraform apply` / `cdk deploy` / `cdk bootstrap` / `wrangler ...--yes` にマッチすると exit 2 で停止し、確認を促す
- 停止したら回避策を書かず、まず相談する

## 進め方
- 複雑なタスクはPlan Modeでまず計画を提示してから実装に移る
- 重い調査はサブエージェントに任せ、メインの会話を軽く保つ
- 作業の区切りで `/clear` する前提で、再開に必要な情報は `PLAN.md` / `TODO.md` に残す
- 繰り返す定型作業(記事追加、デプロイ前チェック等)は都度説明せず、Skillとして切り出して育てていく

## ドキュメントと補助資料(astro-warmup で機能したやり方を踏襲)

- **`PLAN.md`** = 計画 + 進捗表 + 「引き継ぎ用メモ(新チャットはまず読む)」。相対日付は絶対日付に直して書く
- **`KNOWLEDGE.md`** = 用語・概念メモ。新しい語が出たら「何を解決するか」を一言添えて追記する。PLAN と役割分担(PLAN = 短い定義、KNOWLEDGE = 理解のためのメモ)
- **`TODO.md`** = 直近タスク。`/clear` する前に更新
- 学習の区切りでは、KNOWLEDGE.md の要点や成果物の解説を **スライド形式の資料** にまとめると復習しやすい。astro-warmup では自己完結 HTML で作り、最終的に **同じ内容を Notion に移植** して「学習まとめ」ハブに集約した
  - Notion のコネクタは `<script>` `<style>` `<body>` 等の文字列を弾く / ドメイン風トークンを自動リンク化する癖がある
- **Notion の既存ページを積極的に参照・追記していく**:
  - 「学習まとめ / Claude全体の使い方・学びまとめ」… Claude(API/claude.ai 含む)全般の使い方・気づき
  - 「学習まとめ / ClaudeCodeの使い方まとめ」… Claude Code 固有の Tips(CLAUDE.md 構成、カスタムコマンド、サブエージェント、Hook 等)
  - 「学習まとめ / 転職に向けた学習TODOリスト」… 本番プロジェクト全体の TODO(ステータス管理)
  - これらは読むだけでなく、本番作業で新しく分かったこと・ハマりどころが出たら該当ページに追記する

## 環境メモ

- Node は nvm 管理(`v24.20.0`)。非対話シェルでは PATH に無いため、Bash ツールのコマンド冒頭で `source ~/.nvm/nvm.sh` が必要
- `gh` は Homebrew(`/opt/homebrew/bin/gh`)。PATH に無いことがあるので `export PATH="/opt/homebrew/bin:$PATH"` を付ける。認証済み(`shato-dev` / SSH)
- Docker / Docker Compose は導入済み。Docker Desktop の起動確認が必要
- **最初のコミット前に** `git config user.email` が GitHub の noreply になっているか確認する。astro-warmup では実アドレスが author に混入し、リポジトリを削除して履歴を作り直した
- ローカルの絶対パス(`/Users/<name>/...`)を成果物・ドキュメント・コミットに残さない。public リポジトリ前提で点検する
- Browser プレビュー用に `.claude/launch.json` を用意すると `preview_start` で dev サーバーを起動できる。Astro の `astro dev` は 1 フォルダ 1 プロセスまで(ロックあり)
