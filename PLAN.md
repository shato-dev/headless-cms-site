# PLAN — my-web-project(本番)

ヘッドレス CMS・API・全文検索・PostgreSQL/JSONB・Cloudflare といった、ウェブ開発の実務で扱う
技術領域を、**実際に動くものを作りながら**学ぶ学習プロジェクト。完成度より理解を優先する。

> 準備運動 `../astro-warmup` で Astro とローカル開発 + Git/GitHub の流れは一周済み(2026-08-30 完了)。
> 本番でも同じ進め方を踏襲する。**各マイルストーンに Git / GitHub の操作を意図的に混ぜる**
> (コミット・ブランチ・push・Pull Request・CI)。

---

## 進捗(現在地) — 2026-09-09 時点

| M | マイルストーン | 状態 | メモ |
|---|---|---|---|
| **M1** | GitHubリポジトリ作成 + Astroプロジェクト初期化(+ 最小 CI) | 🚧 作業中 | `npm create astro`(minimal + TS strict)。repo 名 `headless-cms-site`(public)。build のみの CI + main ブランチ保護 |
| **M2** | microCMS でコンテンツモデル設計 → Astro から取得 → 一覧/個別/タグページ | ⬜ 未着手 | **最初の PR 練習**。microCMS Free プラン(カード不要) |
| **M3** | GitHub Actions で Cloudflare Pages へ自動デプロイ | ⬜ 未着手 | 「push → 本番更新」の CI/CD 体験。要 Cloudflare アカウント(無料枠 / カード要否を着手前に確認) |
| **M4** | Docker Compose で PostgreSQL + Meilisearch をローカル起動 | ⬜ 未着手 | ローカル開発基盤。Docker Desktop 起動確認が要る |
| **M5** | PostgreSQL + JSONB でメタデータ保存・API 化 | ⬜ 未着手 | M4 のコンテナを使う。可変・半構造データを JSONB で持つ |
| **M6** | Meilisearch で検索実装 + Cloudflare Workers で検索 API 公開 | ⬜ 未着手 | 日本語のタイプミス許容検索まで。`../astro-warmup/src/components/Search.astro` が骨組み |
| **M7** | OpenSearch の仕組みをローカル Docker で概念理解 | ⬜ 未着手 | **運用しない**。仕組みの理解のみ |

継続タスク(番号なし): Claude Code の実践的な使い方に慣れる(CLAUDE.md 構成 / カスタムコマンド /
サブエージェント / Hook)。各マイルストーンの中で都度触れる。

**スコープ外**: AWS / AWS CDK。別途学習する。

### 引き継ぎ用メモ(新チャットはまず読む)

- **作業ディレクトリ**: リポジトリのルート(`my-web-project/`)。ブランチ `main`。
- **Node は nvm 管理**(`v24.20.0`)。Bash ツールの各コマンド冒頭で `source ~/.nvm/nvm.sh` が必要
  (非対話シェルは PATH を読まない)。通常のターミナル操作では不要。
- **`gh` は `/opt/homebrew/bin/gh`**。PATH に無いことがあるので `export PATH="/opt/homebrew/bin:$PATH"` を付ける。
  認証済み(`shato-dev` / SSH)。
- **git のコミットメール**は GitHub の noreply(`shato-dev` の users.noreply アドレス)。
  最初のコミット前に `git config user.email` を確認し、実アドレスの混入を毎回点検する。
- **public リポジトリ**。絶対パス `/Users/<name>/...`(OS ユーザー名を露出)・メール・実名・
  API キー / トークン / 秘密鍵・社内/非公開 URL を成果物・ドキュメント・コード・コメント・設定ファイルに残さない。
  外部に出す操作(push / PR / Pages 公開 / 外部サービス送信)の前に必ず点検し「これは公開されます」と一言添える。
- **課金ブロック Hook**(`.claude/settings.json`): コマンド文字列が `aws ` / `terraform apply` /
  `cdk deploy` / `cdk bootstrap` / `wrangler ...--yes` にマッチすると exit 2 で停止。
  `permissions.deny` にも `Bash(aws:*)` 等。**ブロックされたら回避策を書かず、まず相談する**。
- **予算方針**: 従量課金のサービス・プランは使わない。無料枠・無料プラン中心、有料でも安価な月額固定 / 買い切りに限る。
  新サービス提案時は「カード登録の要否」「料金体系(固定/従量/トライアル後自動課金)」を先に明記してから選択肢を出す。
- **dev サーバー**: `.claude/launch.json` に `astro-dev`(port 4321, autoPort)を定義済み。
  Browser プレビューの `preview_start({name:"astro-dev"})` で起動。`astro dev` は 1 フォルダ 1 プロセス(ロックあり)。
  別セッションが dev 中なら `npm run build` → `npm run preview -- --port <別>` で確認。
- **ドキュメント役割分担**:
  - `PLAN.md` = 計画 + 進捗表 + この引き継ぎメモ + 短い定義。相対日付は絶対日付で書く。
  - `KNOWLEDGE.md` = 用語・概念の理解メモ。新しい語が出たら「何を解決するか」を一言添えて追記。
    基礎用語(Node/npm/ビルド/content collection/Git 基本など)は `../astro-warmup/KNOWLEDGE.md` にある。
  - `TODO.md` = 直近タスク。`/clear` する前に更新。
- **学習ノート**は読むだけでなく、分かったこと・ハマりどころを都度追記していく(詳細な連携先は `CLAUDE.local.md`)。
- **学習の区切り**では KNOWLEDGE.md の要点をスライド形式資料にまとめる(astro-warmup で機能したやり方)。

---

## astro-warmup ↔ 本番 の対応(なぜ準備運動をしたか)

| astro-warmup(縮小版) | 本番 my-web-project | マイルストーン |
|---|---|---|
| Markdown + content collection | microCMS(ヘッドレスCMS)から取得 | M2 |
| クライアント検索(`search.json` + `filter()`) | Meilisearch + Cloudflare Workers の検索 API | M6 |
| GitHub Pages 公開 | Cloudflare Pages 自動デプロイ | M3 |
| `ci.yml`(build チェックのみ) | 同じ + Cloudflare Pages への deploy ジョブ | M1 → M3 |
| (なし) | Docker Compose で PostgreSQL + Meilisearch をローカル起動 | M4 |
| (なし) | PostgreSQL + JSONB でメタデータ保存・API 化 | M5 |
| (なし) | OpenSearch はローカル Docker で「仕組みの理解」だけ(運用しない) | M7 |

**`base` / `import.meta.env.BASE_URL` の扱い**: astro-warmup では GitHub Pages が
`/<repo>/` サブパス配信のため苦労した。Cloudflare Pages は公開 URL が `*.pages.dev` か
独自ドメインの**ルート**になるので `base` は不要(デフォルトのまま)。`site`(絶対 URL の材料 =
sitemap 等)だけ M3 で設定する。原理(Astro は自分が生成する asset URL にしか `base` を足さない、
自分で書いた `<a href>` は直さない)は覚えておく。

---

## マイルストーン詳細

各マイルストーンに「**何をするか** / **なぜ・何を学ぶか** / **Git・GitHub でやること**」。
コミットメッセージは英語・命令形(例: `Add microCMS content schema`)。末尾に
`Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`。
M2 以降の細部は着手時に Plan Mode で詰める(ここには方針まで)。

### M1 — GitHubリポジトリ作成 + Astroプロジェクト初期化(+ 最小 CI)

- **何をするか**:
  1. `npm create astro@latest`(minimal テンプレート + TypeScript strict)で雛形。カレント非空
     (`CLAUDE.md` / `.claude/`)なのでサブフォルダに生成 → 直下へ移動。
  2. `package.json` の name を `headless-cms-site` に。`.gitignore` 確認。`.claude/launch.json` 追加。
  3. `PLAN.md` / `KNOWLEDGE.md` / `TODO.md` / `README.md`(公開用に短く)を用意。
  4. `.github/workflows/ci.yml` = push / PR で `npm ci` → `npm run build`(**build チェックのみ**。
     deploy ジョブは M3 で足す)。
  5. `git init` → main に直コミット → `gh repo create headless-cms-site --public --source=. --push`。
  6. main ブランチ保護(required status check = `build`、`strict:false`、`enforce_admins:false`)。
- **なぜ / 何を学ぶか**: astro-warmup Step 0-1 + 8 の再演。空ディレクトリからの `git init`、
  非空ディレクトリでの雛形作成、CI をプロジェクト初日から入れておく意味(壊れた状態の push にすぐ気づく)。
- **Git・GitHub**: 初回コミット群は main に直接。PR 練習は M2 から。
  公開前にコンテンツ点検(メール / 絶対パス / 秘密情報 / 非公開 URL)。

### M2 — microCMS でコンテンツモデル設計 → Astro から取得 → 一覧/個別/タグページ

- **何をするか**:
  - microCMS(Free プラン、カード登録不要)でサービスを作り、記事のコンテンツモデルを設計
    (title / body(リッチエディタ or Markdown) / description / publishedAt / tags など)。
  - Astro 側で microCMS の REST API を叩いて記事を取得。レスポンスの形を **Zod スキーマで縛る**
    (`../astro-warmup/src/content.config.ts` の glob loader + Zod と同じ考え方。ローダーを
    `glob` から microCMS fetch に置き換えるイメージ。content collection の Loader API を使うか、
    `src/lib/` の関数で取得するかは着手時に判断)。
  - `src/layouts/BaseLayout.astro` / `src/pages/index.astro`(一覧)/ `posts/[slug].astro`(本文)/
    `tags/[tag].astro`(タグ別)/ `src/lib/posts.ts`(絞り込み・並べ替え・`href()` ヘルパー)。
    astro-warmup の該当ファイルが下敷き。
  - API キーは `.env`(gitignore 済み)。`.env.example` にキー名だけ commit。
- **なぜ / 何を学ぶか**: ヘッドレス CMS = 「編集画面」と「表示」を分離し、コンテンツを API で配る仕組み。
  「記事データをどこから取るか」の層(warmup では Markdown)が外部サービスに変わる。
  ビルド時 fetch(SSG)と実行時 fetch の違い、API キーの秘匿。
- **Git・GitHub(PR 練習の本番)**:
  1. `git switch -c feat/content-from-microcms`。
  2. 小さくコミット(スキーマ取得層 → レイアウト → 各ページ)。
  3. `git push -u origin feat/content-from-microcms` → `gh pr create --fill`。
  4. GitHub で差分をセルフレビュー(何が変わったか自分の言葉で)。
  5. `gh pr merge --squash --delete-branch` → `git switch main && git pull`。
  6. CI(build)が緑でないとマージできないことを体験。

### M3 — GitHub Actions で Cloudflare Pages へ自動デプロイ

- **何をするか**:
  - Cloudflare アカウント作成(**着手前に無料枠 / カード要否を整理して報告**)。Pages プロジェクトを作る。
  - `astro.config.mjs` に `site: 'https://<project>.pages.dev'`(sitemap 用。`base` は不要)。
  - `ci.yml` に `deploy` ジョブを追加(main のみ)。Cloudflare Pages への公開は
    `wrangler pages deploy` か Cloudflare 公式の GitHub 連携。トークンは GitHub Secrets に置く。
    **`wrangler ...--yes` は課金ブロック Hook に当たるので使わない**。非対話フラグの付け方を確認する。
  - microCMS の Webhook で「記事更新 → GitHub Actions を再実行」も検討(SSG の再ビルド)。
- **なぜ / 何を学ぶか**: 「push すると本番サイトが自動更新される」CI/CD の最小形。
  astro-warmup の GitHub Pages デプロイとほぼ同じ絵。Secrets の扱い、環境変数の注入。
- **Git・GitHub**: `ci.yml` 変更を PR で。「PR を出す → CI が回る → マージ → deploy が走る」を体験。

### M4 — Docker Compose で PostgreSQL + Meilisearch をローカル起動

- **何をするか**: `docker-compose.yml` に `postgres` と `meilisearch` の 2 サービス。
  ボリューム永続化、ポート公開、`.env`(パスワード等)。`docker compose up -d` / `down` / `logs`。
  Docker Desktop の起動確認。
- **なぜ / 何を学ぶか**: コンテナ = 「アプリと依存を丸ごと箱に入れて、どの PC でも同じに動かす」仕組み。
  Compose = 複数コンテナをまとめて宣言・起動。DB とサーチエンジンをローカルに立てて以降のマイルストーンで使う。
- **Git・GitHub**: `docker-compose.yml` + `.env.example` を 1 コミット。実 `.env` は gitignore。

### M5 — PostgreSQL + JSONB でメタデータ保存・API 化

- **何をするか**: M4 の Postgres に、記事メタデータや解析用データを格納するテーブルを作る。
  可変・半構造なデータは `JSONB` カラムに入れ、`->>` / `@>` / GIN インデックスで検索。
  取得用の小さな API(Cloudflare Workers か、まずはローカルの Node/Astro エンドポイント)を作る。
  本番 DB は Supabase か Neon の無料プラン(**着手前にカード要否 / 無料枠を整理**)。
- **なぜ / 何を学ぶか**: 「PostgreSQL + JSON」は実務で扱う中心的なテーマ。
  JSONB = 「スキーマを固めきれないデータを、正規化せず 1 カラムに入れて後からクエリできる」型。
  いつ列に分け、いつ JSONB にするかの判断。
- **Git・GitHub**: スキーマ SQL(マイグレーション)/ API を小さくコミット。余力で PR。

### M6 — Meilisearch で検索実装 + Cloudflare Workers で検索 API 公開

- **何をするか**: M4 の Meilisearch に記事をインデックス投入(ビルド時 or Webhook)。
  Cloudflare Workers に検索 API を置き、フロントから叩く。
  `../astro-warmup/src/components/Search.astro`(クライアントで `search.json` を fetch して `filter()`)
  の `<script>` を、Workers の検索エンドポイント呼び出しに置き換える。
  日本語のタイプミス許容(typo tolerance)まで試す。
- **なぜ / 何を学ぶか**: 全文検索エンジン = 「転置インデックスを作って部分一致・あいまい一致・
  ランキングを高速に返す」専用ミドルウェア。素の `includes()` との違い(語の正規化、スコアリング、
  タイプミス許容)。Workers = エッジで動く小さなサーバー関数。
- **Git・GitHub**: Worker は別ディレクトリ(`workers/search/` など)。PR + CI。

### M7 — OpenSearch の仕組みをローカル Docker で概念理解(運用しない)

- **何をするか**: OpenSearch を単体コンテナで起動し、インデックス作成・ドキュメント投入・
  `_search` クエリ(match / bool / analyzer)を手で叩いて挙動を見る。**本番では使わない**。
- **なぜ / 何を学ぶか**: Meilisearch との比較で「全文検索の一般的な仕組み(analyzer / inverted index /
  クエリ DSL / スコアリング)」を掴む。Elasticsearch 系の語彙に触れておく。
- **Git・GitHub**: 学習メモ中心。KNOWLEDGE.md に追記。コードは最小(compose の一部 or 使い捨てスクリプト)。

---

## 最終的なフォルダ構成(予定)

```
my-web-project/
├─ .github/workflows/ci.yml   … build(全マイルストーン)+ deploy(M3〜)
├─ .claude/                    … settings.json(課金ブロック Hook)/ launch.json(dev プレビュー)
├─ astro.config.mjs            … site を M3 で設定(base は不要)
├─ docker-compose.yml          … M4: postgres + meilisearch
├─ .env.example                … 必要な環境変数のキー名だけ(実 .env は gitignore)
├─ PLAN.md / KNOWLEDGE.md / TODO.md
├─ src/
│  ├─ lib/                     … microCMS 取得 / posts.ts(絞り込み・href())
│  ├─ layouts/BaseLayout.astro
│  ├─ components/              … PostCard.astro / Search.astro
│  ├─ pages/                   … index / posts/[slug] / tags/[tag] / tags/index
│  └─ ...
├─ db/                         … M5: マイグレーション SQL
├─ workers/                    … M6: Cloudflare Workers(検索 API)
└─ public/
```

## やらないこと(意図的に)

- AWS / AWS CDK(スコープ外)。
- 従量課金プラン、カード登録が要る有料サービス。
- 過度な抽象化・将来拡張の先取り。まず動く最小限を作る。
- 凝ったスタイリング。読める程度で十分。

## 進め方

1. 複雑なマイルストーンは Plan Mode で計画を提示してから実装。
2. 各マイルストーンで Git 操作(コミット / ブランチ / PR / CI)を意図的に混ぜる。
3. 重い調査はサブエージェントに任せ、メインの会話を軽く保つ。
4. 作業の区切りで `/clear` する前提。再開に必要な情報は `PLAN.md`(引き継ぎメモ)/ `TODO.md` に残す。
5. 新しい用語はその場で 1〜2 行の説明を添え、`KNOWLEDGE.md` に「何を解決するか」を追記。
6. 外部公開・外部送信の前にコンテンツ点検 +「これは公開されます」の一言。
7. 繰り返す定型作業は Skill として切り出して育てる。
8. 学習ノートに、分かったこと・ハマりどころを追記する(連携先は `CLAUDE.local.md`)。
