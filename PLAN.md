# PLAN — my-web-project(本番)

ヘッドレス CMS・API・全文検索・PostgreSQL/JSONB・Cloudflare といった、ウェブ開発の実務で扱う
技術領域を、**実際に動くものを作りながら**学ぶ学習プロジェクト。完成度より理解を優先する。

> 準備運動 `../astro-warmup` で Astro とローカル開発 + Git/GitHub の流れは一周済み(2026-08-30 完了)。
> 本番でも同じ進め方を踏襲する。**各マイルストーンに Git / GitHub の操作を意図的に混ぜる**
> (コミット・ブランチ・push・Pull Request・CI)。

---

## 進捗(現在地) — 2026-09-21 時点

| M | マイルストーン | 状態 | メモ |
|---|---|---|---|
| **M1** | GitHubリポジトリ作成 + Astroプロジェクト初期化(+ 最小 CI) | ✅ 完了(2026-09-09) | `npm create astro`(minimal + TS strict)。repo: <https://github.com/shato-dev/headless-cms-site>(public)。build のみの CI 緑。main ブランチ保護(required check = `build`、`strict:false`、`enforce_admins:false`) |
| **M2** | 青空文庫100作品サイト: microCMS でコンテンツモデル設計 → Astro から取得 → 一覧/個別/著者/ジャンル/検索 | ✅ 完了(2026-09-14) | 題材確定・著作権監査完了(`docs/aozora-100-audit-report.md`)。microCMS に100件投入済み、カスタムローダーで取得。**最初の PR 練習(2回)**。サイト機能バックログは下記参照、継続実装 |
| **M3** | GitHub Actions で Cloudflare(Workers static assets)へ自動デプロイ | ✅ 完了(2026-09-19) | main への push で自動公開: <https://headless-cms-site.shato-dev.workers.dev>(PR #3)。**Pages ではなく Workers を採用**(Astro 公式が新規には Workers 推奨、M6 も Workers のため)。`ci.yml` = `build` → `deploy`(main のみ、`npx wrangler deploy`)。無料・カード不要。microCMS Webhook での自動再デプロイは後回し、404 ページ・ubuntu 固定は見送り(下記) |
| **M4** | Docker Compose で PostgreSQL + Meilisearch をローカル起動 | ✅ 完了(2026-09-20) | `docker-compose.yml`(`postgres:17-alpine` + `getmeili/meilisearch:v1.53`)。無料・カード不要。ポートは `127.0.0.1` のみ公開、named volume で永続化、healthcheck あり。値は `.env`、キー名は `.env.example` |
| **M5** | PostgreSQL + JSONB でメタデータ保存・API 化 | ✅ 完了(2026-09-21) | 用途 = 閲覧・操作イベント。`events` テーブル(共通項目は列、詳細は JSONB + GIN)、seed 2,341 件(疑似データ)、読み取り専用 Worker API `events-api`(PR #8, #9, #10)。本番 DB = **Neon Free**(無料・カード不要、Postgres 17、シンガポール)+ Hyperdrive。**Bearer トークン認証**付きで <https://events-api.shato-dev.workers.dev> に手動デプロイ |
| **M6** | Meilisearch で検索実装 + Cloudflare Workers で検索 API 公開 | ⬜ 未着手 | 日本語のタイプミス許容検索まで。`../astro-warmup/src/components/Search.astro` が骨組み |
| **M7** | OpenSearch の仕組みをローカル Docker で概念理解 | ⬜ 未着手 | **運用しない**。仕組みの理解のみ |

継続タスク(番号なし): Claude Code の実践的な使い方に慣れる(CLAUDE.md 構成 / カスタムコマンド /
サブエージェント / Hook)。各マイルストーンの中で都度触れる。

**スコープ外**: AWS / AWS CDK。別途学習する。

### 引き継ぎ用メモ(新チャットはまず読む)

- **作業ディレクトリ**: リポジトリのルート(`my-web-project/`)。ブランチ `main`、作業ツリークリーン、
  `origin` = `git@github.com:shato-dev/headless-cms-site.git`。M2 完了・マージ済み(PR #1, #2)、M3 完了(PR #3)。
- **Cloudflare(M3 で導入)**: 公開 URL は <https://headless-cms-site.shato-dev.workers.dev>。デプロイ先は
  Pages ではなく **Workers static assets**(`wrangler.jsonc` の `assets.directory = ./dist`)。
  main への push で `ci.yml` の `deploy` ジョブが `npx wrangler deploy` を実行(PR では走らない)。
  GitHub Secrets に `CLOUDFLARE_API_TOKEN`(最小権限のトークン `github-actions-headless-cms-site`)/
  `CLOUDFLARE_ACCOUNT_ID` を登録済み。デプロイが権限不足で落ちたら、トークンの値は変えずに権限だけ追加できる。
  Workers Free プラン(無料・カード不要)。**M3 の残り 3 件の決定(2026-09-19)**:
  ① microCMS Webhook → 自動再デプロイは**後回し**(今は microCMS を更新しても、main に push するまで
  サイトは変わらない。必要になったら `repository_dispatch` で実装)、② 専用 404 ページは**やらない**
  (404 応答自体は返る。素の 404 のまま)、③ `ubuntu-latest` の Ubuntu 26 切り替え(2026-10-19)は
  **何もしない**(CI が赤くなったら対処。固定するなら `ubuntu-24.04`)。
- **次にやること(決定済みの順番)**:
  1. **M5 は完了(2026-09-21)**。設計・経緯は下記 M5 節、運用手順は `workers/events-api/README.md`。
     **events-api の運用メモ**: 公開 URL <https://events-api.shato-dev.workers.dev>(要 Bearer トークン)。
     トークンはパスワードマネージャと、ローカルの `.env`(`EVENTS_API_TOKEN`、curl 用)にある。Worker 側は
     `wrangler secret put API_TOKEN`(再発行は上書き)。デプロイは手動(`workers/events-api` で `npx wrangler deploy`、
     要 `wrangler login`。CI の `deploy` ジョブの対象外)。DB は Neon(オーナー接続文字列は `.env` の `DATABASE_URL`、
     seed / マイグレーションは `--allow-remote` / `docker compose exec -e DATABASE_URL ... psql`)。Hyperdrive の
     ID は `wrangler hyperdrive list` で分かる(ダッシュボードの設定タブには出なかった)。
  2. **次の候補(着手前に Plan Mode で決める)**: **サイト機能バックログ**(下記「サイト機能バックログ」節。ランダムおすすめ・診断式
     おすすめ・関連作品など。著者ページ・検索は M2 で実装済み)、または **M6**(Meilisearch + Workers 検索 API)。
- **ローカル基盤(M4 で導入)**: `docker compose up -d`(起動)/ `docker compose ps`(状態)/
  `docker compose logs -f`(ログ)/ `docker compose down`(停止。データは残る)。**`down -v` はボリュームを消す
  ので、実データが入った後は使わない**。接続先は Postgres = `127.0.0.1:5432`、Meilisearch = `http://127.0.0.1:7700`。
  ユーザー名・DB 名・パスワード・master key は `.env`(git 管理外)にある。`docker compose config` は展開後の
  値(パスワード)を表示するので、ログや PR に貼らず `--quiet` を使う。Docker Desktop が落ちていたら先に起動する。
- **microCMS**: サービス・API(`works`)作成済み、`.env` にキーあり(git 管理外、再発行済みのキー)。
  GitHub Actions の Secrets(`MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY`)にも登録済み — CI の
  `npm run build` は microCMS に実際にアクセスするため、この Secrets が無いと CI が落ちる(M2 で一度
  ハマった)。`node --env-file=.env scripts/import-to-microcms.mjs` は再実行しても安全(upsert)。
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
| GitHub Pages 公開 | Cloudflare Workers(static assets)自動デプロイ | M3 |
| `ci.yml`(build チェックのみ) | 同じ + Cloudflare への deploy ジョブ | M1 → M3 |
| (なし) | Docker Compose で PostgreSQL + Meilisearch をローカル起動 | M4 |
| (なし) | PostgreSQL + JSONB でメタデータ保存・API 化 | M5 |
| (なし) | OpenSearch はローカル Docker で「仕組みの理解」だけ(運用しない) | M7 |

**`base` / `import.meta.env.BASE_URL` の扱い**: astro-warmup では GitHub Pages が
`/<repo>/` サブパス配信のため苦労した。Cloudflare は公開 URL が `*.workers.dev` か
独自ドメインの**ルート**になるので `base` は不要(デフォルトのまま)。`site`(絶対 URL の材料 =
sitemap 等)は M3 で設定済み。原理(Astro は自分が生成する asset URL にしか `base` を足さない、
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

### M2 — 青空文庫100作品サイト

**題材**: 青空文庫の有名作品100選 + オリジナル要約(1エントリ = 1作品)。選定・要約は
著作権チェックリスト(`docs/100作品要約チェックリスト.md`)に基づき全件監査済み
(詳細: `docs/aozora-100-audit-report.md`。17件の事実誤認・捏造引用を発見・修正)。
この監査で得た知見は `~/.claude/CLAUDE.md`「公開物の著作権・法令遵守」に恒久ルール化済み。

- **何をするか(フェーズ A: ローカル JSON、アカウント不要)**:
  - `src/content/works.json`(監査済み100件、`id`=青空文庫の作品番号)を Astro の
    Content Layer API の **`file()` ローダー**で読み込む content collection として定義。
    レスポンスの形を **Zod スキーマで縛る**(`../astro-warmup/src/content.config.ts` の
    glob loader + Zod と同じ考え方)。
  - `src/layouts/BaseLayout.astro` / `src/pages/index.astro`(一覧)/ `works/[id].astro`(詳細)/
    `authors/index.astro`・`authors/[author].astro`(著者一覧・著者別)/
    `genres/index.astro`・`genres/[genre].astro`(ジャンル一覧・ジャンル別)/
    クライアントサイド検索(`../astro-warmup/src/components/Search.astro` と同方式。
    M6 で Meilisearch に置き換える前段)。
  - **何をするか(フェーズ B: microCMS 移行、アカウント作成後)**:
    - microCMS(<https://microcms.io/>)でアカウント作成 → サービス作成 → API 作成(エンドポイント名
      `works`、リスト形式)。フィールドは content.config.ts の Zod スキーマと同じ:
      title(テキスト)/ author(テキスト)/ authorReading(テキスト、任意)/ translator(テキスト、任意)/
      summary(テキストエリア)/ genreTags(セレクト・複数選択可、選択肢: 小説・童話・詩・随筆・戯曲)/
      aozoraCardUrl(テキスト)。
    - API キー(書き込み権限)を発行 → ローカルの `.env` に書く(chat には貼らない。`.env.example` 参照)。
    - `node --env-file=.env scripts/import-to-microcms.mjs` で works.json → microCMS へ upsert。
    - ローダーを `file()` から microCMS fetch のカスタムローダーに差し替え(表示側コードは無変更)。
- **なぜ / 何を学ぶか**: ヘッドレス CMS = 「編集画面」と「表示」を分離し、コンテンツを API で配る仕組み。
  Content Layer API の「ローダー = データがどこから来るかの抽象化」を、ローカル JSON →
  外部 API への差し替えという形で実際に体験する。ビルド時 fetch(SSG)と実行時 fetch の違い、
  API キーの秘匿、外部の公開データを扱う際の著作権・事実確認の重要性。
- **Git・GitHub(PR 練習の本番)**:
  1. `git switch -c feat/content-from-microcms`。
  2. 小さくコミット(シードデータ → コンテンツ定義 → レイアウト/部品 → ページ → 検索 → 移行スクリプト → ドキュメント)。
  3. `git push -u origin feat/content-from-microcms` → `gh pr create --fill`。
  4. GitHub で差分をセルフレビュー(何が変わったか自分の言葉で)。
  5. `gh pr merge --squash --delete-branch` → `git switch main && git pull`。
  6. CI(build)が緑でないとマージできないことを体験。
  7. フェーズ B(microCMS 移行)は、アカウント作成後に別ブランチ・別 PR で行う。

**サイト機能バックログ**(2026-09-12 追加。詳細は次節)は、著者ページ・検索まではこの M2 の
範囲に含め、おすすめ機能等は M2 完了後の追加 PR で順次実装する。

### サイト機能バックログ(2026-09-12 追加)

「もう少し凝ったサイトにしたい」という要望を受けて追加した機能一覧。全件 100 作品という
データ規模を活かせるものを中心に、要望分 + 提案分をまとめた。実装順は目安。

| 機能 | 概要 | 実装メモ | 予定 |
|---|---|---|---|
| 著者一覧 + 著者別作品一覧 | `/authors`、`/authors/[author]` | `genres` と全く同じパターン(著者名で集計・フィルタ) | **M2 本体に含める** |
| キーワード検索 | タイトル・著者・要約の部分一致検索 | astro-warmup の `Search.astro` と同方式(ビルド時に `search.json` を書き出し、ブラウザで `filter()`)。M6 で Meilisearch に置き換える前段として、ここで先に導入する | **M2 本体に含める** |
| ランダムおすすめ(「今日の一冊」) | ボタン1つで100作品からランダムに1冊選び、詳細ページへ | クライアント JS で `id` 配列から抽選 → `location.href` 遷移。サーバー不要 | M2 完了後、追加 PR |
| 診断式おすすめ | 気分・長さ・ジャンルなど数問に答えると1冊を提案 | まずは `genreTags` ベースの簡易スコアリングから開始(全文検索や本格的なレコメンドは将来 M5/M6 と絡めて発展させる余地あり) | M2 完了後、追加 PR(設計は着手時に詰める) |
| 関連作品(提案) | 詳細ページ下部に「同じ著者の他の作品」「同じジャンルの作品」 | `author`/`genreTags` での単純フィルタ、追加データ不要 | 上記と同じ PR でまとめて実装しやすい |
| 既読チェック・お気に入り(提案) | 読んだ本にチェック、お気に入り登録、進捗(◯/100冊)表示 | `localStorage` のみで実現(サーバー・アカウント不要) | 余力があれば |
| 文学史年表(提案) | 著者の生没年・作品発表年で並べたタイムライン | 生没年データは書誌 CSV には存在するが `works.json` には未収録 → データ拡張が必要 | 余力があれば(データ拡張のコストを見て判断) |
| ガチャ風演出(提案) | ランダムおすすめにアニメーション演出をつける | CSS アニメーション程度。お楽しみ要素 | 余力があれば |

新しいアイデアが浮かんだら、都度この表に追記していく。

### M3 — GitHub Actions で Cloudflare(Workers static assets)へ自動デプロイ ✅ 2026-09-19

> **計画からの変更**: 当初は Cloudflare Pages(`wrangler pages deploy`)の想定だったが、Astro 公式が
> 「Cloudflare は新規プロジェクトに Workers を推奨」と明記しており、M6 の検索 API も Workers なので
> **Workers static assets(`wrangler deploy`)に変更**。Pages の廃止日は公式ページで確認できなかった。

- **やったこと**:
  - Cloudflare アカウント作成(Workers Free、カード不要)。`workers.dev` サブドメインは実名を含まない名前に。
  - `wrangler.jsonc`(`assets.directory = ./dist`)+ `wrangler` を devDependency に。`account_id` は書かず Secrets で渡す。
  - `ci.yml` を `build` → `deploy` の 2 ジョブに。`build` が `dist/` を artifact で渡し、`deploy` は
    main への push のみ(PR から Cloudflare トークンに触れさせない)。`concurrency` で同時デプロイを防止。
    `npx wrangler deploy` は API トークン認証で非対話なので `--yes` 不要(課金ブロック Hook に当たらない)。
  - `astro.config.mjs` に `site` を設定(`base` は不要)。
- **見送り・後回し**:
  - microCMS の Webhook で「記事更新 → GitHub Actions を再実行」(SSG の再ビルド)は**後回し**。
    やるなら GitHub の `repository_dispatch` を使う。`ci.yml` にトリガーを足し、microCMS 側の Webhook に
    GitHub の Fine-grained PAT(対象リポジトリ 1 つ・Contents: Read and write のみ)を設定する。
  - 専用 404 ページ(`404.astro` + `wrangler.jsonc` の `assets.not_found_handling = "404-page"`)は見送り。
  - `ubuntu-latest` の切り替えへの対応(`ubuntu-24.04` 固定)は不要と判断。
- **なぜ / 何を学ぶか**: 「push すると本番サイトが自動更新される」CI/CD の最小形。
  astro-warmup の GitHub Pages デプロイとほぼ同じ絵。Secrets の扱い、環境変数の注入。
- **Git・GitHub**: `ci.yml` 変更を PR で。「PR を出す → CI が回る → マージ → deploy が走る」を体験。

### M4 — Docker Compose で PostgreSQL + Meilisearch をローカル起動 ✅ 2026-09-20

- **やったこと**:
  - `docker-compose.yml` に 2 サービス。`postgres:17-alpine`(M5 で使う Supabase / Neon と世代を揃えた)と
    `getmeili/meilisearch:v1.53`(`latest` ではなくマイナーまで固定)。どちらも無料・カード不要。
  - ポートは `127.0.0.1` のみ公開(LAN に出さない)、named volume(`pgdata` / `meili_data`)で永続化、
    healthcheck、`${VAR:?}` で必須変数が無ければ起動しない。`MEILI_NO_ANALYTICS=true` で統計送信を無効化。
  - `.env.example` にキー名だけ追記、`.env` に乱数の値。
  - 検証: 両方 `healthy`、JSONB 演算子が動く、Meilisearch は無キー 401 / キー付き 200、`down` → `up` で
    テストデータが残る、LAN 側 IP からは届かない。テストデータは個別に削除済み(`down -v` は使っていない)。
- **見送り**: Postgres 18(データ置き場の構成が変わる。必要になったら公式 README で確認)。
- **元の方針**: `docker-compose.yml` に `postgres` と `meilisearch` の 2 サービス。
  ボリューム永続化、ポート公開、`.env`(パスワード等)。`docker compose up -d` / `down` / `logs`。
  Docker Desktop の起動確認。
- **なぜ / 何を学ぶか**: コンテナ = 「アプリと依存を丸ごと箱に入れて、どの PC でも同じに動かす」仕組み。
  Compose = 複数コンテナをまとめて宣言・起動。DB とサーチエンジンをローカルに立てて以降のマイルストーンで使う。
- **Git・GitHub**: `docker-compose.yml` + `.env.example` を 1 コミット。実 `.env` は gitignore。

### M5 — PostgreSQL + JSONB でメタデータ保存・API 化

- **決定(2026-09-21): 用途 = B. 閲覧・操作ログ(イベント)**。理由: イベントは種別ごとに詳細(payload)の形が
  違い JSONB が自然に効く / SQL 集計の経験を活かせる / 「解析用データの整備」に近い。設計・フェーズは下の
  「M5 の設計と進め方」。以下の A〜D は検討時の候補として残す。
- **最初に決めること = 用途**(2026-09-20 追記。下記「何をするか」の「記事メタデータや解析用データ」は
  元の方針で曖昧だった)。コンテンツ本体の正本は microCMS なので、Postgres と役割を重複させない。
  用途の候補(たたき台。新チャットで絞り、他に案があれば足す):
  - **A. 作品の拡張メタデータ**: 生没年・発表年・文字数・読了目安など、書誌 CSV にあるが `works.json` /
    microCMS に無い項目。文学史年表(サイト機能バックログ)のデータ拡張と直結。microCMS = 編集する正本、
    Postgres = 派生・補足データ、という切り分け。**(2026-09-21 訂正)** 当初「項目が作品ごとに揃わないので
    JSONB 向き」と書いたが誤り。生没年・発表年・文字数は全作品共通の項目で、普通の列で足りる。JSONB の題材としては弱い。
    書誌 CSV はリポジトリに無く、外部取得 + ライセンス確認も要る。
  - **B. 閲覧・操作ログ(イベント)**: 診断式おすすめの回答、ランダムおすすめの結果、閲覧などを JSONB の
    イベントとして貯める。データ分析経験(SQL / 集計)を活かせ、「解析用データ」「データ解析環境の整備」に近い。
  - **C. 既読・お気に入り**: 現状バックログは `localStorage` のみ。端末をまたぐならユーザー識別(認証)が要り
    スコープが膨らむ。
  - **D. 検索クエリログ**: M6 の Meilisearch と連携(何が検索されたか)。M6 の後に回す手もある。
  - **共通の論点**: 本番 DB を Cloudflare Workers から叩く経路(TCP ソケット直接 / Hyperdrive / HTTP ドライバ /
    DB 側の REST など複数ありそうだが、未調査。各経路の無料枠とカード要否を含めて一次情報で確認する)。
    書き込みを伴う用途は、公開 API の悪用対策(認証・レート制限)も設計に入れる。
- **M5 の設計と進め方(2026-09-21 決定)**: 詳細は Plan Mode で作成・承認済み。
  - スキーマ: `events(id, event_type, work_id, session_id, occurred_at, source, payload jsonb)`。共通項目は列、
    種別ごとの詳細は `payload`。`work_id` は microCMS の id(FK なし)。`session_id` は匿名のランダム ID
    (IP・UA・実名は保存しない)。`source='seed'` で疑似データを区別。索引は `(event_type, occurred_at)` の B-tree
    + `payload` の GIN(`jsonb_path_ops`)。
  - 現状イベントを出す機能が無いので、M5 は seed スクリプトの疑似データ。実イベントとの接続は該当機能
    (診断式おすすめ等)の実装時。書き込み API の公開はスコープ外(認証・レート制限が要る)。
  - **Phase 1(PR 1)**: `db/migrations/001_create_events.sql` + `scripts/seed-events.mjs` + `db/queries/events-jsonb.sql`。
    ローカルで完了・検証済み・PR #8 でマージ済み(2026-09-21)。
  - **Phase 2(PR 2)**: `workers/events-api/`(素の `fetch` ハンドラの Worker、GET のみ、パラメータ化クエリ)。
    `wrangler dev` + Hyperdrive のローカル接続でローカル Postgres に接続。ローカルで完了・検証済み(2026-09-21)。
    起動方法は `workers/events-api/README.md`。`wrangler.jsonc` の Hyperdrive `id` は 0 埋めのダミー(Phase 3 で本物に)。
  - **Phase 3(PR 3、要承認)**: 本番 DB + デプロイ。推奨は Neon Free(2026-09-21 に公式ページで確認: $0/月、
    カード不要と Neon の FAQ に記載、上限超過は課金でなく compute 停止 / 書き込み失敗、5 分アイドルで scale to zero
    し自動再開)。Supabase Free は 1 週間無活動で pause(手動復旧)、Free 登録時のカード要否は Billing FAQ に明記なし。
    Workers からは Hyperdrive(Free プランに含まれる、1 日 10 万クエリ、超過はエラーで課金なし)。
    アカウント作成と接続文字列の登録はユーザー自身が行う。
    **進捗(2026-09-21)**: Neon(Postgres 17、シンガポール)にマイグレーション + seed 済み、読み取り専用ロール
    `events_reader` と Hyperdrive 設定 `events-db` を作成済み(id は `workers/events-api/wrangler.jsonc`)。
    公開 API は **Bearer トークン認証**(`API_TOKEN` Secret、未認証は 401、未設定は全拒否)を付けてからデプロイする。
    デプロイは CI ではなく手動(`wrangler deploy`)。手順は `workers/events-api/README.md` の「Production setup」。
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
├─ docs/                       … 著作権チェックリスト・監査レポート等のプロジェクト文書
├─ scripts/                    … import-to-microcms.mjs 等、ビルドに含めない単発スクリプト
├─ PLAN.md / KNOWLEDGE.md / TODO.md
├─ src/
│  ├─ content/works.json       … M2: 監査済み100作品(フェーズBで microCMS に移行)
│  ├─ content.config.ts        … works コレクション定義(loader を差し替えていく)
│  ├─ lib/                     … works.ts(絞り込み・集計)
│  ├─ layouts/BaseLayout.astro
│  ├─ components/              … WorkCard.astro / Search.astro
│  ├─ pages/                   … index / works/[id] / authors/* / genres/* / search
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
