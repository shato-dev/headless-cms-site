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

### M2: microCMS

### M3: Cloudflare Pages 自動デプロイ

### M4: Docker Compose でローカル基盤

### M5: PostgreSQL + JSONB

### M6: Meilisearch + Cloudflare Workers

### M7: OpenSearch(概念理解のみ)

---

## 3. astro-warmup から変わった点・つまずき

---

## 4. まだ理解が浅い / あとで戻る
