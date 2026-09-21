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
- **全文検索エンジン**: 「大量の文章から、部分一致・あいまい一致・関連度順の並べ替えを高速に返す」専用ミドルウェア。
  `includes()` で全件を舐める方式は、件数が増えると遅く、語の正規化・順位づけ・誤字対応も自前になる。
- **転置インデックス(inverted index)**: 「語 → その語を含む文書の一覧」の索引(本の巻末索引と同じ向き)。
  検索時は文書を読まず、語の一覧を引いて集合演算するだけなので速い。文書の登録時に語へ分解して作る。
- **トークナイザ(tokenizer)**: 文章を「語」に分ける処理。英語は空白で切れるが、日本語は空白が無いので辞書
  (Meilisearch では Charabia が lindera の IPA 辞書を使う)で分かち書きする。検索の質はここでほぼ決まる。
- **typo tolerance(誤字許容)**: 綴りが 1〜2 文字違っても(挿入・削除・置換・入れ替え)ヒットさせる仕組み
  (Levenshtein 距離)。誤字を許すほど誤ヒットも増えるので、Meilisearch は既定で「5 文字以上なら 1 typo、9 文字以上なら 2 typo」と
  語の長さに制限をかけている。短い語が多い日本語ではこの制限が効いて、ほとんど発動しない(下の M6 の節)。
- **`matchingStrategy`**: 複数の語を含むクエリをどう扱うか。既定の `last` は「全部の語に合う文書が足りなければ、後ろの語から
  外して探す」。`all` は全部の語を要求する。`last` だと typo が効いていなくても「語を落として当たった」だけの
  ことがあり、typo の検証には `all` が要る。
- **`_rankingScoreDetails`**: 検索時に `showRankingScoreDetails: true` を付けると、各ヒットの点数の内訳(何個 typo を許したか等)が返る。
  「なぜこの順位か」を確かめるためのデバッグ機能。
- **master key と検索専用キー**: master key は何でもできる鍵(サーバーの環境変数にだけ置く)。検索専用キーは
  「特定のインデックスへの search だけ」に絞った子キー。ブラウザ側に近い場所に置く鍵は、漏れても書き込み・削除ができないようにする。
  Meilisearch は子キーの値を「uid + master key」から計算するので、同じ uid で作り直せば同じ値になる。
- **Render Free のスピンダウンと揮発ディスク**: 無料のWeb Service は 15 分アクセスが無いと停止し、次のアクセスで約 1 分かけて再起動する。
  ディスクは再起動で消える。データをファイルとしてイメージに同梱し、起動のたびにインデックスを作り直す設計で吸収する。
- **graceful degradation(縮退運転)**: 主機能(API 検索)が使えないとき、機能を落として(ブラウザ内の簡易検索で)動き続けること。
  無料枠のサービスは遅い・止まることがある前提で作る。

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
- **Phase 2(読み取り専用 Worker API、2026-09-21)**: `workers/events-api/`。`GET /stats/daily`・`/stats/top-works`・
  `/events` の 3 本。`pg` を Hyperdrive の接続文字列で使う(`nodejs_compat` フラグが要る。`pg` は 8.16.3 以上)。
  リクエストごとに `new Client` して `finally` で `end()` するのが公式の書き方(実際のプールは Hyperdrive が持つ)。
- **SQL インジェクション対策は 2 段構え**: ① 値は `$1` `$2` のパラメータで SQL 文と別送する(値が SQL として
  解釈されない)、② その前に入力を検証(`type` は許可リスト、`limit` / `days` は整数 + 範囲)。
  実際に `type=work_viewed'; DROP TABLE events;--` を送って 400 で弾かれることを確認した。
  `session_id` は匿名でも API に出さない(返す列を SELECT で明示する)。
- **検証してから接続する**: 不正なリクエストで DB 接続を開かないよう、「SQL を組み立てる(検証を含む)」と
  「実行する」を分けた。最初は接続後に検証していて、コメントの内容と実装が食い違っていた(見直しで発見)。
- **`pg` の型の癖**: `count(*)` の bigint は文字列、`date` は JS の `Date` で返る。JSON にそのまま出すと
  `"401"` や日付オブジェクトになるので、SQL 側で `::int` / `to_char` にキャストした。
- **ローカル開発**: `wrangler dev` では Hyperdrive を使わず、`CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_<BINDING>`
  という環境変数(または `localConnectionString`)で DB に直接つなぐ。環境変数なら認証情報を設定ファイルに書かずに済む。
  変数名は計画時に別の名前で覚えていたが、公式ドキュメントで確認して直した。
- **ハマりどころ: `id` が必須**: `wrangler.jsonc` の hyperdrive には、ローカル開発でも `id` が要る
  (無いと起動時にエラー)。ローカルでは使われないので 0 埋めのダミーを置き、コメントで明記した。
  本物の ID は本番の Hyperdrive 設定を作る Phase 3 で入れる。ダミーのままデプロイしても失敗するだけで安全。
- **seed のバグを API 経由で発見**: `/events` の最新が現在時刻より未来だった。seed が「今日の夜」のイベントも
  作っていたのが原因(68 件)。セッション開始と各イベントを現在時刻以下に収めて修正。集計 SQL だけ見ていたら
  気づきにくかった(API で「最新 1 件」を見て発覚)。
- **`npx tsc` は本物の TypeScript ではない**: プロジェクトに typescript が無い状態で `npx tsc` を実行すると、
  別の非推奨パッケージ(`tsc`)を取ってきてしまう。`npx --package typescript tsc ...` のようにパッケージを明示する。
  なお Astro の build は esbuild で TS を型チェックなしに変換するので、型エラーは build では検出されない。
- **Phase 3(本番 DB + 認証、2026-09-21)**: 本番 DB は Neon Free(Postgres 17、シンガポール)。手順は
  `workers/events-api/README.md` の「Production setup」。Neon のプロジェクト作成・Hyperdrive 設定の作成・
  `wrangler login` はユーザー自身が実施(アカウント作成・認証情報の入力は AI がやらない方針)。
- **Hyperdrive には「プーリング無し(direct)」の接続文字列を使う**: Hyperdrive 自体が接続プールを持つので、
  Neon 側のプーラー(`-pooler` ホスト)を挟むと二重になる。公式ドキュメントの指示。Neon のサーバーレスドライバも使わず、
  `pg` で直接つなぐ。
- **読み取り専用ロール(最小権限)**: 公開 API 用に `events_reader`(`SELECT` のみ + `default_transaction_read_only`)を
  作り、Hyperdrive にはそれを登録した。API にバグがあっても書き込めない。`has_table_privilege()` で権限を確認できる。
  Neon のダッシュボードで作るロールは強い権限を持つことがあるため、SQL の `CREATE ROLE` で作った。
- **Bearer トークン認証**: `Authorization: Bearer <token>` を Worker の Secret(`API_TOKEN`)と比較する。
  認証を最初に行うので、未認証は全パスで 401(DB に触れない)。トークン未設定なら全拒否(fail closed。
  未設定を「認証なし」と解釈しない)。クエリ文字列のトークンは受け付けない(URL はログに残りやすい)。
  比較は SHA-256 のダイジェスト同士を全バイト XOR して定数時間にする(不一致の位置が処理時間に出ない)。
  ローカルは `.dev.vars`(gitignore 済み)、本番は `wrangler secret put API_TOKEN`。
- **認証のデメリット(承知の上で採用)**: ブラウザの公開ページから直接呼べない(トークンが見える)/ Worker への大量アクセス
  自体は防げない(Workers の 1 日 10 万リクエストには数えられる)/ 共有の合言葉なので利用者ごとの失効ができない。
- **テストで見つけたバグ: `client.end()` でハングする**: DB に接続できないとき、`finally` の `await client.end()` が
  永遠に待ち、Worker が「ハングした」というランタイムエラーを返していた(こちらの JSON 500 にならない)。
  接続に成功した場合だけ `end()` を呼ぶ形に修正。正常系だけのテストでは見つからず、DB をわざと届かない
  接続先にして初めて分かった。あわせて `connectionTimeoutMillis` / `query_timeout`(10 秒)も付けた。
- **`wrangler dev` の自動再読み込みで落ちることがある**: ローカル状態(SQLite)のロック競合
  (`SQLITE_BUSY`)で起動し直しになった。コードの問題ではなく、作り直せば直る。
- **`pg` の SSL 警告**: `sslmode=require` は現状 `verify-full` 扱いで、将来のメジャー版で libpq 準拠(弱い)に変わる予告。
  今は安全側なので放置。
- **デプロイと公開後の検証(2026-09-21)**: `wrangler deploy` は手動(`workers/events-api` で実行)。順序は
  「デプロイ → `wrangler secret put API_TOKEN`」にした。コードが fail closed なので、Secret を入れるまでの間は
  全リクエストが 500 で、認証なしで開いている時間が生じない。公開 URL で 18 ケース(未認証 401 / 認証あり 200 /
  400・404・405 / `session_id` 非露出)を確認し、API 経由の日次件数の合計が Neon の 2,341 件と一致した。
- **Neon の復帰レイテンシ(実測)**: 6.5 分アイドル後の最初のリクエストが約 0.9 秒、続く 2 回が約 0.15〜0.2 秒
  (手元 Mac → Worker → Hyperdrive → シンガポールの Neon)。直接接続で最初にテストしたときは約 2.3 秒
  (TLS ハンドシェイク込み)だった。0.9 秒の内訳(Worker のコールドスタート / Hyperdrive の接続確立 / Neon の起動)は
  分けて測っていない。2 回目以降の速さが「Hyperdrive のキャッシュ」か「DB が温まっている」だけかも、
  レイテンシからは区別できなかった(キャッシュの効果は未検証。ダッシュボードの Hyperdrive メトリクスで見られるはず)。
- **Cloudflare ダッシュボードの罠**: Hyperdrive の画面には「PlanetScale データベースを作成」という目立つ黒いボタンが
  あるが、これは Cloudflare 経由の従量課金になる(Hyperdrive の料金ページに記載)。押すのは青い「データベースを接続」
  →「パブリック データベースに接続する」。従量課金は使わない方針なので避けた。
- **Hyperdrive の ID の調べ方**: ダッシュボードの「設定」タブには 32 桁の ID が出なかった。`wrangler login` の
  あと `npx wrangler hyperdrive list` で id / 名前 / ユーザー / ホストが表で出る(パスワードは出ない)。
  `wrangler login` は OAuth(ブラウザで Allow)で、トークンは PC のローカルに保存される。`wrangler logout` で解除できる。
- **秘密を私(AI)に見せずに検証する方法**: 検証用トークンはローカルの `.env`(gitignore 済み)に置き、AI は値を
  表示せず curl の引数に渡すだけにした。Secret の登録・接続文字列の入力・アカウント作成はユーザー自身が実施した。
- **`psql` の実行**: ホストに psql を入れず `docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" ...'`
  で実行する。`$POSTGRES_USER` はコンテナ内の環境変数なので、パスワードをホスト側のコマンドラインに出さずに済む。
  `-T` は擬似端末を割り当てない指定(`< file` で標準入力を渡すときに必要)。

### M6: Meilisearch + Cloudflare Workers
- **置き場所の決定(2026-09-22)**: Workers からはローカルの Docker に届かないので、本番用の Meilisearch が要る。
  候補を公式ページで比べた(料金 / カード要否)。Meilisearch Cloud は 14 日無料トライアル(カード不要)の後 $23/月〜(恒久の無料プランなし、
  usage-based は従量)。Fly.io はカード必須 + 従量。Cloudflare Containers は Workers Paid($5/月)+ 従量で Free 不可、ディスクも一時的。
  Oracle Always Free は無料だが登録にカードが必要。**Render Free**(Docker の Web Service)は $0・カード不要で、
  支払い方法を登録しなければ課金の代わりに停止する(公式 FAQ)ので採用。制約は 15 分でスリープ・復帰に約 1 分・ディスクが揮発。
  参考にした note 記事は「AI が調べたレポートの整理」という二次情報だったので、数字は公式の pricing / docs と突き合わせた。
- **日本語 typo tolerance の実測(2026-09-22、ローカルの Meilisearch v1.53.2、100 作品)**:
  `matchingStrategy: all` で「語が全部そろうことを要求」+ `_rankingScoreDetails` で typo 数を見て測った。
  最初に既定(`last`)で測ったら、漢字の誤字(「羅生問」「太宰冶」など)も rank 1 で当たって見えたが、これは typo 許容ではなく
  「後ろの語を落として当たった」だけだった(`all` にすると全部 MISS)。**測り方で結論が逆になる**例。
  - 完全一致・前方一致・部分一致(「メロス」「走れメロ」「太宰」)は問題なく効く。
  - **漢字の 1 文字違い(「人間失客」「羅生問」「太宰冶」「注文の多い料里店」)は、どの設定でも救えなかった**。語が 2〜4 文字で、
    `minWordSizeForTypos` を 2 まで下げても効かなかった(原因は未調査。語が短い・分かち書きの粒度のどちらかと推測しているが、
    トークナイザの出力は確認していない)。
  - ひらがな・カタカナの誤字は、閾値を下げると一部だけ効く(「走れメロズ」は `oneTypo: 3` で当たる。「にこりえ」(濁点抜け)は
    `oneTypo: 2, twoTypos: 4` まで下げないと当たらず、そのとき typo 3 個扱いだった)。「走メロス」(1 文字抜け)はどれも MISS。
  - 閾値を下げるほどノイズが増える(`last` 戦略の「人間失格」で 20 件 → 36 件、`all` 戦略の「だざい」で 6 件 → 18 件)。
  - `authorReading`(ひらがなの読み)を検索対象に入れると、「だざい」「だざいおさむ」で太宰治の作品に届く。
    読みの誤字(「だざいおさぬ」)は救えない。カタカナ(「ダザイ」)は 1 typo 扱いで当たった。
  - `localizedAttributes`(`jpn`)を付けると、`last` 戦略でのノイズが減った(「人間失格」28 件 → 20 件)。全部日本語なので付ける。
  - **採用した設定**(`search/settings.json`): `jpn` 固定 + `oneTypo: 3 / twoTypos: 6` + `summary` は typo 無効。
    かなの 1 文字違いは一部救い、ノイズは「人間失格」の 1 例では `jpn` 固定だけの場合と同じ(20 件。他のクエリでは未比較)。
    漢字の誤字は諦め、部分一致(語を落として探す)に頼る。
  - 結論: 日本語の typo tolerance は「英語のように何でも効く」ものではない。効くのは、ある程度長いかな列の 1 文字違いくらい。
    漢字の誤字対策には、読み仮名フィールドや、変換候補(誤変換辞書)のような別の仕掛けが要る。
- **Docker イメージの検証(512 MB / 0.25 CPU)**: 約 2〜3 秒でインデックス構築が終わり、メモリは約 58 MiB。検索専用キーで
  検索は 200、書き込み・削除・キー一覧・他インデックスは 403。再起動してもキーの値は同じ。master key 未設定ならメッセージを出して起動しない。

### M7: OpenSearch(概念理解のみ)

---

## 3. astro-warmup から変わった点・つまずき

---

## 4. まだ理解が浅い / あとで戻る
