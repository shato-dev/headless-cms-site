# KNOWLEDGE — my-web-project で学んだこと

学習中に出てきた用語・概念のメモ。新しい語が出たら「**何を解決するか**」を一言添えて追記する。
PLAN.md との役割分担: PLAN = 計画と短い定義 / KNOWLEDGE = 理解のためのメモ。

基礎用語(Node.js / npm / nvm / dev サーバー / ビルド / SSG / frontmatter / スキーマ /
content collection / コンポーネント / ルーティング / Git・GitHub の基本 / `.astro` の 2 領域 /
`getStaticPaths()` / CI の基本 / ブランチ保護 / `site` と `base`)は
`../astro-warmup/KNOWLEDGE.md` にある。ここには本番プロジェクト固有の内容を足していく。

---

## 1. 用語集(本番プロジェクト固有)

### ヘッドレスCMS まわり
<!-- microCMS, コンテンツモデル, API キー, 下書き/公開, Webhook, ビルド時 fetch vs 実行時 fetch -->

### PostgreSQL / JSONB まわり
- **JSONB**: JSON を分解済みのバイナリ形式で持つ列型。スキーマを固めきれない・種別ごとに形が違うデータを、
  正規化せず 1 列に入れて後から SQL でクエリできる。(`JSON` 型は文字列のまま保存するので検索が遅く、通常は JSONB を使う)
- **`->` / `->>` / `#>>`**: JSONB から値を取り出す演算子。`->` は JSONB のまま(文字列なら `"list"` と引用符付き)、
  `->>` はテキストで返す。`GROUP BY` や比較には `->>`。深い階層は `->` を連鎖するか `#>> '{a,b}'` でパス指定。
- **`@>`(包含)**: 「左の JSONB が右の断片を含むか」。`payload @> '{"referrer":"search"}'`。GIN インデックスが効く演算子。
- **GIN インデックス**: 「値 → それを含む行」の転置索引(全文検索と同じ発想)。JSONB の中身での絞り込みを速くする。
  `jsonb_path_ops` は `@>` 専用で小さく速い。`->>` の等値比較(`payload->>'x' = 'y'`)には**効かない**(式の結果は別物扱い)。
- **列にするか JSONB にするか**: 毎回 `WHERE` / `GROUP BY` に使う共通項目は列(型・制約・インデックスが素直)、
  種別ごとに形が違う詳細は JSONB。全レコード共通の項目(生没年など)を JSONB に入れる理由は薄い。
- **マイグレーション**: スキーマ変更を「番号付きの SQL ファイル」として履歴に残し、順に適用する運用。
  `IF NOT EXISTS` で冪等(何度流しても壊れない)にしておくと安全。
- **scale to zero(Neon)**: 一定時間アクセスが無いと compute を自動停止し、次のアクセスで数百 ms で再開する。
  停止中は計算時間を消費しないので無料枠が持つ。Supabase Free の「1 週間無活動で pause(手動復旧)」とは別物。
- **Hyperdrive(Cloudflare)**: Workers から外部 DB へ TCP 接続するための、接続プール + クエリキャッシュ。
  Workers は毎回別の場所・別のプロセスで動くため、素朴に接続するとリクエストごとに DB 接続を張り直してしまうのを避ける。

### 全文検索(Meilisearch / OpenSearch)まわり
<!-- 転置インデックス, analyzer, typo tolerance, ランキング/スコアリング, インデックス投入 -->

### Cloudflare(Workers)まわり
- **Workers**: 「世界中の Cloudflare の拠点(エッジ)で動く小さなサーバー関数」。自前サーバーを持たずに
  API を置ける。M6 の検索 API で使う。
- **Workers static assets**: 「スクリプトを持たない Worker が、フォルダ内の静的ファイル(`dist/`)だけを配信する」
  使い方。Astro の静的サイトの公開先になる。静的ファイルへのリクエストは無料。
- **Cloudflare Pages との関係**: Pages は静的サイト専用のホスティングだったが、Cloudflare は新規には Workers を
  推奨し、機能も Workers 側に集約する方向(Astro 公式ドキュメントの記述)。コマンドは
  `wrangler pages deploy` → `wrangler deploy`、URL は `*.pages.dev` → `*.workers.dev` に変わる。
- **wrangler / `wrangler.jsonc`**: wrangler は Cloudflare の CLI(ビルド結果のアップロード・ローカル確認)。
  `wrangler.jsonc` は「Worker の名前・配信するフォルダ」などを書く設定ファイル(`package.json` に近い役割)。
  `npx wrangler dev` でローカルで本番と同じ配信を試せる。
- **`workers.dev` サブドメイン**: アカウントごとに 1 つ決まる公開ドメインの一部
  (`<worker名>.<サブドメイン>.workers.dev`)。公開 URL に載るので、実名を入れない。
- **API トークンと最小権限**: 「パスワードの代わりに CI に渡す、権限を絞った合鍵」。Workers の編集だけを許可し、
  漏れても被害を小さくする。値は GitHub Secrets にだけ置き、コードやチャットには出さない。
  `account_id` も `wrangler.jsonc` に書かず Secrets(`CLOUDFLARE_ACCOUNT_ID`)で渡した(public リポジトリのため)。
- **artifact(GitHub Actions)**: ジョブは別々のマシンで動くので、`build` ジョブが作った `dist/` を
  `upload-artifact` で保存 → `deploy` ジョブが `download-artifact` で受け取る。「CI で確認したものがそのまま公開される」
  ことと、microCMS への fetch が 1 回で済むことが利点。
- **`concurrency`(GitHub Actions)**: 同じ group のジョブを同時に 1 つに制限する。連続 push でデプロイが競合しない。
- **`if:` で deploy を main の push に限定**: PR では `deploy` が skipped になり、PR から Cloudflare トークンに
  触れない。

### Docker / Docker Compose まわり
- **イメージ / コンテナ**: イメージは「アプリ + 依存を固めた設計図(読み取り専用)」、コンテナはそれを実行した
  「動いている実体」。Python でいうクラスとインスタンスに近い。`docker compose down` でコンテナは消えるが、
  イメージは残る。
- **Docker Compose**: 複数コンテナ(ここでは postgres + meilisearch)の構成を `docker-compose.yml` に宣言し、
  `up -d` の 1 コマンドで再現する仕組み。「手順書」ではなく「宣言」なので、誰の PC でも同じ状態になる。
  `-d` はバックグラウンド起動(detached)。
- **ボリューム(named volume)**: コンテナの中のデータはコンテナを消すと一緒に消える。DB のようにデータを
  残したいものは、コンテナの外にあるボリュームに保存する。`down` はボリュームを残し、`down -v` は消す
  (実データが入った後は `-v` を付けない)。
- **ポート公開 `127.0.0.1:5432:5432`**: 「Mac の 5432 番 → コンテナの 5432 番」の転送。先頭の `127.0.0.1:` を
  付けないと `0.0.0.0`(LAN 全体)に公開され、同じ Wi-Fi の他の端末から DB に届いてしまう。付けると自分の Mac
  からだけ接続できる(LAN 側 IP から届かないことを確認済み)。
- **`.env` と `${VAR:?メッセージ}`**: Compose は同じフォルダの `.env` を自動で読んで `${...}` に展開する。
  `:?` を付けると、値が無いときに起動せずエラーで止まる(Python の `os.environ["X"]` が KeyError になるのに近い。
  `os.environ.get("X")` のように空で通してしまうのを防ぐ)。パスワードは `.env`(git 管理外)にだけ置き、
  `.env.example` にはキー名だけ。
- **healthcheck**: 「プロセスが起動した」ではなく「実際に応答できる」ことを Compose が定期確認する仕組み。
  `docker compose ps` の `(healthy)` がそれ。Postgres は `pg_isready`、Meilisearch は `GET /health`。
  M5 / M6 で「DB が準備できるまで待つ」ときの目印になる。
- **タグ固定の理由**: `latest` は pull し直すたびに中身が変わりうる。特に DB / 検索エンジンは、保存データの
  形式がバージョンに依存するため、意図せず上がると既存ボリュームが読めなくなる恐れがある。`postgres:17-alpine` と
  `getmeili/meilisearch:v1.53`(マイナーまで)に固定した。Meilisearch は原則として別バージョンのデータを
  そのまま読めず、更新にはダンプ経由の移行が要る。
- **alpine**: 軽量な Linux ディストリビューションをベースにしたイメージの版。サイズが小さく pull が速い。
- **Meilisearch の master key**: 管理系 API を守る鍵。`MEILI_ENV=development` でもキーを設定しておくと、
  無キーの `/indexes` は 401、キー付きは 200 になる(本番と同じ挙動を練習できる)。M6 では検索専用の
  権限を絞ったキーを別に発行し、フロントには master key を渡さない。
- **`MEILI_NO_ANALYTICS`**: Meilisearch は既定で匿名の利用統計を送信する。学習環境でも外部送信は最小にしたいので無効化。

---

## 2. マイルストーンごとの補足

### M1: リポジトリ作成 + Astro 初期化

- **非空ディレクトリでの `npm create astro`**: カレントに `CLAUDE.md` / `.claude/` があると
  雛形 CLI が同じ場所に展開できない。サブフォルダ(`_scaffold/`)に生成し、`src/` `public/`
  `package.json` `astro.config.mjs` `tsconfig.json` `.gitignore` `README.md` などを手で直下へ移動した。
  雛形が置く `CLAUDE.md`(= Astro の汎用ガイド、`AGENTS.md` と同内容)は既存の本物を守るため移動しなかった。
- **`git init` からの最初のコミット**: `my-web-project/` は git 未管理だったので `git init`。
  デフォルトブランチは `main`。最初のコミット前に `git config user.email` が GitHub の noreply か確認
  (astro-warmup で実アドレス混入 → 作り直しの教訓)。
- **`.claude/settings.local.json`**: Claude Code が許可リストをローカルに書き出すファイル。
  共有すべきでないので `.gitignore` に足して `git rm --cached` で追跡解除。個人的文脈は
  `CLAUDE.local.md`(同じく gitignore)に分離した。
- **build のみの CI**: `.github/workflows/ci.yml` は `npm ci` → `npm run build` だけ。
  deploy は M3。`push`(main)と `pull_request` の両方でトリガー。プロジェクト初日から入れておくと
  「壊れた状態を push したらすぐ赤くなる」。
- **main ブランチ保護(API 経由)**: `gh api -X PUT repos/<owner>/<repo>/branches/main/protection`。
  `required_status_checks.contexts=["build"]`(= ci.yml の job 名)/ `strict:false`(PR の最新化を強制しない)
  / `enforce_admins:false`(管理者は直 push 可、PR マージ時は CI 必須)。

### M2: microCMS(青空文庫100作品サイト)

- **公開物の著作権チェックリスト**: 「何を解決するか」= 要約サイトのような二次的コンテンツを
  公開する際、①素材が本当にパブリックドメインか(翻訳者の保護期間も含む)、②要約が原文の
  言い回し・構成をなぞっていないか、③引用が捏造でないか、④事実(結末・関係性)が原文と
  食い違っていないか、を一般知識に頼らず機械的に確認するための手順。今回、一般知識だけで
  書いた要約100件中17件に事実誤認・捏造引用が見つかった(例: 因果関係の逆転、原文に無い引用)。
  以後の公開物すべてに適用する恒久ルールとして `~/.claude/CLAUDE.md` に昇格させた。
- **Content Layer API のローダー抽象化**: 「何を解決するか」= 「データがどこから来るか」と
  「表示側のコード」を分離する仕組み。`file()` ローダー(ローカル JSON/YAML を読む)で
  まず動くサイトを作り、後で microCMS 取得のカスタムローダーに差し替えても、ページ・
  コンポーネント側のコードは変更不要になる。astro-warmup の `glob()` ローダーと同じ抽象化。
- **upsert の冪等性**: 「何を解決するか」= 取り込みスクリプトを何度実行しても重複データが
  増えない設計。青空文庫の作品番号(URLの `card789.html` の `789`)を、ローカルデータの `id` と
  microCMS の `contentId` の両方に使い回すことで実現する。
- **`file()` ローダーの実装メモ**: エントリごとに一意な `id` フィールドが必須(`glob()` は
  ファイル名から自動で id を作るが、`file()` は明示的に用意する必要がある)。日本語の著者名・
  ジャンル名を動的ルートの `params`(`/authors/[author].astro` 等)に使う場合、リンクは
  `encodeURIComponent()` で組み立てる必要があるが、`getStaticPaths()` の `params` 自体は
  元の文字列(未エンコード)のままでよい(Astro がマッチング時にデコードしてくれる)。
- **カスタムローダーの書き方**(`src/lib/microcms-loader.ts`): `astro/loaders` の `Loader` 型は
  `{ name, load({ store, parseData, logger }) }` という最小限の形。`load()` の中で好きな方法で
  データを取得し(今回は microCMS の List API を `offset`/`limit` でページング)、
  `parseData({ id, data })` でスキーマ検証・変換してから `store.set({ id, data })` で登録する。
  `file()` / `glob()` と全く同じインターフェースなので、呼び出し側(`content.config.ts` の
  `defineCollection({ loader: ... })`)もページ側のコードも一切変更不要だった。
- **`.env` は `import.meta.env` で読める**: `content.config.ts` はビルド時に Vite 経由で読み込まれるため、
  プロジェクト直下の `.env` の変数がそのまま `import.meta.env.MICROCMS_API_KEY` のように参照できる。
  取り込みスクリプト(素の Node スクリプト、Vite を通さない)は `node --env-file=.env` を使う必要が
  あったのと対照的(Node 20.6+ の機能。Vite を通らないスクリプトはこちらが必要)。
- **microCMS のページング**: List API は1回のリクエストで最大100件(`limit` の上限)。
  100件を超えるコンテンツを全件取得するには `offset` を増やしながら複数回リクエストする必要がある。

### M3: Cloudflare(Workers static assets)自動デプロイ

- **計画の変更を調べて判断した**: PLAN は Pages だったが、Astro 公式ドキュメントに「Cloudflare は新規プロジェクトに
  Workers を推奨」とあったので、Workers static assets を選んだ。Pages の廃止日は公式ページで確認できず、
  「非推奨寄り」までしか言えない。
- **流れ**: PR → `build` のみ(`deploy` は skipped)→ マージ → main の push で `build` → `deploy`。
  初回デプロイで Worker `headless-cms-site` が自動作成された。
- **静的サイトに `@astrojs/cloudflare` アダプタは不要**: アダプタはサーバー側で動的に描画するとき用。
  `dist/` をそのまま配信するだけなら `wrangler.jsonc` の `assets.directory` で足りる。
- **404**: `src/pages/404.astro` が無いと、存在しない URL は既定の素の 404 になる(`wrangler dev` と本番で確認)。
- **`wrangler deploy` は CI では非対話**: `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` を環境変数で渡すだけで
  動き、`--yes` は不要。課金ブロック Hook(`wrangler.*--yes`)にも当たらない。
- **ローカルの `.wrangler/`** は dev 用のキャッシュなので `.gitignore` に追加した。
- **microCMS の更新は自動では反映されない**: SSG はビルド時にデータを取るので、記事を更新しても再ビルドするまで
  サイトは古いまま。Webhook で再ビルドを起こす仕組みを作れば自動化できるが、今は後回しにしている。

### M4: Docker Compose でローカル基盤

- **やったこと**: `docker-compose.yml`(postgres + meilisearch)、`.env.example` にキー名追加、`.env` に乱数の
  パスワード / master key。起動・接続・認証・永続化(`down` → `up` でデータが残る)まで確認した(2026-09-20)。
- **料金**: 両イメージとも無料・カード不要。Docker Hub の匿名 pull で足りた。
- **PostgreSQL 17 を選んだ理由**: M5 で使う本番 DB(Supabase / Neon の無料プラン)と世代を揃えるため。
  なお 18 は Docker 公式イメージでデータの置き場所の構成が変わったとされ、マウント先が
  `/var/lib/postgresql` になる(未検証。18 に上げるときは公式イメージの README で確認する)。
  17 の書き方をそのままコピペすると落とし穴になりうる。
- **ハマりどころ: healthcheck の `$$`**: `docker-compose.yml` の中で `${VAR}` と書くと、Compose が `.env` から
  先に展開する。コンテナの中のシェルに展開させたいときは `$${VAR}` とエスケープする(Postgres の
  `pg_isready` で使った)。
- **ハマりかけ: 出力にパスワードが載る**: `docker compose config` は展開後の値をそのまま表示するので、
  ログや PR に貼らない。検証では `--quiet` で正しさだけ確認した。
- **`docker info` は出力が長い**: 冒頭の Client 情報だけでは daemon が動いているか分からない。
  `Server:` 部分が出るか、`docker info --format '{{.ServerVersion}}'` の終了コードで判断する。

### M5: PostgreSQL + JSONB

- **用途の決め方(2026-09-21)**: 「何を入れるか」を先に決めてから設計・DB 選定に進んだ。候補のうち
  イベントログ(閲覧・おすすめ・診断の記録)を選択。理由は、種別ごとに詳細の形が違い JSONB が自然に効くこと、
  SQL 集計の経験を活かせること。PLAN.md の初期案(生没年などの拡張メタデータ)は全作品共通の項目で、
  普通の列で足りる=JSONB の題材として弱いと判断して見送った。
- **microCMS との役割分担**: 作品の正本は microCMS、Postgres は派生データ(イベント)だけ。`work_id` は
  microCMS の id を文字列で持つだけで、外部キーは張らない(works テーブルが無い)。
- **Phase 1 でやったこと**: `db/migrations/001_create_events.sql`(冪等)、`scripts/seed-events.mjs`(疑似データ
  約 2,300 件、`source='seed'`)、`db/queries/events-jsonb.sql`(学習用クエリ)。
- **seed の設計**: `source='seed'` の行だけを消して入れ直す(1 トランザクション)ので何度でも実行でき、
  実データ(`source='app'`)には触れない。`down -v`(ボリューム全消し)を使わずに済む。乱数は種付きの PRNG で
  再現可能に。全件を 1 本の JSONB パラメータで渡し `jsonb_to_recordset` で展開する(SQL 文字列を組み立てない)。
- **Node と Python の違い**: DB 接続を開いたままだとプロセスが終了しない(Python はコード末尾で終わる)。
  `client.end()` を `finally` で必ず呼ぶ。
- **`EXPLAIN` の予想が外れた**: 「2,000 行程度なら Seq Scan を選ぶはず」と予想したが、`@>` は最初から
  GIN(Bitmap Index Scan)を選んだ。一方、同じ結果を返す `payload->>'referrer' = 'search'` は Seq Scan。
  インデックスが効くかは「行数」より「クエリの書き方(演算子)」で決まる、が今回の収穫。
- **`psql` の実行**: ホストに psql を入れず `docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" ...'`
  で実行する。`$POSTGRES_USER` はコンテナ内の環境変数なので、パスワードをホスト側のコマンドラインに出さずに済む。
  `-T` は擬似端末を割り当てない指定(`< file` で標準入力を渡すときに必要)。

### M6: Meilisearch + Cloudflare Workers

### M7: OpenSearch(概念理解のみ)

---

## 3. astro-warmup から変わった点・つまずき

---

## 4. まだ理解が浅い / あとで戻る
