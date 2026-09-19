# このプロジェクトについて

ヘッドレス CMS・API・全文検索・PostgreSQL/JSONB・Cloudflare といった、ウェブ開発の実務で
扱う技術領域を、**実際に動くものを作りながら**学ぶための学習プロジェクト。完成度より理解を優先する。

## 前提
- ソフトウェアエンジニアリング完全初心者ではない(Python/Bash でのデータ分析経験あり)が、Web アプリを一人で構築した経験はまだない
- 新しい概念(全文検索の仕組み、JSONB の使いどころ等)が出てきたら、実装だけでなく簡単に仕組みも説明すること

## 現在地 — 準備運動(astro-warmup)は完了済み

本番に入る前に、別リポジトリ `../astro-warmup` で Astro とローカル開発 + Git/GitHub の流れを一周した。

- 公開サイト: <https://shato-dev.github.io/astro-warmup/> / リポジトリ: <https://github.com/shato-dev/astro-warmup>
- 通した工程: リポジトリ作成 → Astro 雛形(minimal + TS strict) → content collection(glob loader + Zod スキーマ) → 記事(Markdown) → 共通レイアウト + CSS → 一覧/個別/タグページ(`getStaticPaths()` で生成) → クライアント検索(ビルド時に JSON を吐き、ブラウザで `filter()`) → ローカルビルド確認 → GitHub Actions で CI + main のブランチ保護 → GitHub Pages 公開
- 「ブランチ → push → Pull Request → マージ、CI が緑でないと main にマージ不可」という GitHub の基本ワークフローを一度体験済み
- 学んだ内容は `../astro-warmup/KNOWLEDGE.md`(用語集 + セッション補足)に集約済み

### astro-warmup ↔ 本番 の対応(なぜ準備運動をしたか)

| astro-warmup(縮小版) | 本番 my-web-project |
|---|---|
| Markdown + content collection | microCMS(ヘッドレス CMS)から取得 |
| クライアント検索(`search.json` + `filter()`) | Meilisearch + Cloudflare Workers の検索 API |
| GitHub Pages 公開 | Cloudflare Workers(static assets)自動デプロイ |
| `ci.yml`(build チェックのみ) | 同じ + Cloudflare への deploy ジョブ |
| (なし) | Docker Compose で PostgreSQL + Meilisearch をローカル起動 |
| (なし) | PostgreSQL + JSONB でメタデータ保存・API 化 |
| (なし) | OpenSearch はローカル Docker で「仕組みの理解」だけ(運用しない) |

移行時の注意: astro-warmup で苦労した `base` / `import.meta.env.BASE_URL` の扱いは、Cloudflare なら
公開 URL が `*.workers.dev` か独自ドメインのルートになるため軽くなる。ただし原理(Astro は自分が生成する
asset URL にしか `base` を足さない、自分で書いた `<a href>` は直さない)は覚えておく。

### 現在地と次にやること(2026-09-19 時点)

M1〜M3 は完了(M2: microCMS 連携の 100 作品サイト、M3: Cloudflare Workers への自動デプロイ。
公開 URL は <https://headless-cms-site.shato-dev.workers.dev>)。詳細は `PLAN.md` の進捗表と
「引き継ぎ用メモ」、直近タスクは `TODO.md`。

- 次の M3 残タスク(microCMS Webhook での自動再デプロイ等)を 1 つずつ確認してから、M4 に入る。
- 以降は `PLAN.md` の順(M4 Docker Compose → M5 PostgreSQL/JSONB → M6 Meilisearch + Workers → M7 OpenSearch)。
- 各マイルストーンは Plan Mode で方針を出してから着手し、astro-warmup と同じく各ステップに Git 操作
  (コミット / ブランチ / PR / CI)を意図的に混ぜて進める。

## 技術スタック
- フロントエンド: Astro
- ヘッドレス CMS: microCMS(Free プラン)
- 全文検索: Meilisearch(学習用に OpenSearch もローカル Docker で併用)
- DB: PostgreSQL(Supabase / Neon の無料プラン、JSONB 型を積極活用)
- ホスティング / API: Cloudflare Workers(静的サイトは Workers static assets、検索 API も Workers。無料枠)
  ※ 当初は Pages 想定だったが、Cloudflare が新規プロジェクトに Workers を推奨しているため変更(M3)
- コンテナ: Docker / Docker Compose
- CI/CD: GitHub Actions
- **AWS / AWS CDK はスコープ外。使わない。**

## 予算に関する方針(重要)
- 従量課金のサービス・プランは使わない。無料枠・無料プラン中心で、有料でも月額固定 / 買い切りの安価なものに限る
- 新しいサービスを提案する際は、カード登録の要否と料金体系(固定 / 従量 / トライアル後自動課金)を明記してから選択肢を示すこと
- **課金が発生しうるコマンドの実行は `.claude/settings.json` の Hook で機械的にブロックされている(下記参照)。ブロックされた場合は指示文で回避しようとせず、まず相談すること**

### 課金ブロックの実体(`.claude/settings.json`)

- `permissions.deny`: `Bash(aws:*)` / `Bash(terraform apply*)` / `Bash(cdk deploy*)` / `Bash(cdk bootstrap*)`
- `PreToolUse` の Bash フック: コマンド文字列が `aws ` / `terraform apply` / `cdk deploy` / `cdk bootstrap` / `wrangler ...--yes` にマッチすると exit 2 で停止し、確認を促す
- 停止したら回避策を書かず、まず相談する

## 進め方
- 複雑なタスクは Plan Mode でまず計画を提示してから実装に移る
- 重い調査はサブエージェントに任せ、メインの会話を軽く保つ
- 作業の区切りで `/clear` する前提で、再開に必要な情報は `PLAN.md` / `TODO.md` に残す
- 繰り返す定型作業(記事追加、デプロイ前チェック等)は都度説明せず、Skill として切り出して育てていく

## ドキュメントと補助資料(astro-warmup で機能したやり方を踏襲)

- **`PLAN.md`** = 計画 + 進捗表 + 「引き継ぎ用メモ(新チャットはまず読む)」。相対日付は絶対日付に直して書く
- **`KNOWLEDGE.md`** = 用語・概念メモ。新しい語が出たら「何を解決するか」を一言添えて追記する。PLAN と役割分担(PLAN = 短い定義、KNOWLEDGE = 理解のためのメモ)
- **`TODO.md`** = 直近タスク。`/clear` する前に更新
- 学習の区切りでは、KNOWLEDGE.md の要点や成果物の解説を **スライド形式の資料** にまとめると復習しやすい

## 環境メモ

- Node は nvm 管理(`v24.20.0`)。非対話シェルでは PATH に無いため、Bash ツールのコマンド冒頭で `source ~/.nvm/nvm.sh` が必要
- `gh` は Homebrew(`/opt/homebrew/bin/gh`)。PATH に無いことがあるので `export PATH="/opt/homebrew/bin:$PATH"` を付ける。認証済み(`shato-dev` / SSH)
- Docker / Docker Compose は導入済み。Docker Desktop の起動確認が必要
- **最初のコミット前に** `git config user.email` が GitHub の noreply になっているか確認する
- ローカルの絶対パス(`/Users/<name>/...`)を成果物・ドキュメント・コミットに残さない。public リポジトリ前提で点検する
- Browser プレビュー用に `.claude/launch.json` を用意すると `preview_start` で dev サーバーを起動できる。Astro の `astro dev` は 1 フォルダ 1 プロセスまで(ロックあり)
- セッション固有の私的な文脈は `CLAUDE.local.md`(git 管理外)に置いてある。新チャットはそちらも読む
