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
<!-- JSONB, ->/->>/@>, GIN インデックス, いつ列に分けるか, マイグレーション, Supabase/Neon -->

### 全文検索(Meilisearch / OpenSearch)まわり
<!-- 転置インデックス, analyzer, typo tolerance, ランキング/スコアリング, インデックス投入 -->

### Cloudflare(Pages / Workers)まわり
<!-- Pages(静的配信 + ビルド), Workers(エッジ関数), wrangler, Secrets, pages.dev -->

### Docker / Docker Compose まわり
<!-- イメージ/コンテナ, Compose のサービス定義, ボリューム永続化, ポート公開, .env -->

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

### M3: Cloudflare Pages 自動デプロイ

### M4: Docker Compose でローカル基盤

### M5: PostgreSQL + JSONB

### M6: Meilisearch + Cloudflare Workers

### M7: OpenSearch(概念理解のみ)

---

## 3. astro-warmup から変わった点・つまずき

---

## 4. まだ理解が浅い / あとで戻る
