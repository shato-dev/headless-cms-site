# headless-cms-site

ヘッドレス CMS(microCMS)+ Astro + PostgreSQL/JSONB + Meilisearch + Cloudflare を
題材にした学習用プロジェクト。データプラットフォーム寄りのバックグラウンドから
ウェブ開発の一連の流れ(CMS 連携・API・全文検索・自動デプロイ)を、動くものを作りながら学ぶ。

準備運動リポジトリ: <https://github.com/shato-dev/astro-warmup>

## 技術スタック

- フロントエンド: [Astro](https://astro.build/)(minimal テンプレート + TypeScript strict)
- ヘッドレス CMS: microCMS(Free プラン)
- DB: PostgreSQL(JSONB を活用)
- 全文検索: Meilisearch(学習用に OpenSearch もローカルで併用)
- ホスティング / API: Cloudflare Pages + Workers
- コンテナ: Docker / Docker Compose
- CI/CD: GitHub Actions

進め方と進捗は [PLAN.md](./PLAN.md)、用語・概念メモは [KNOWLEDGE.md](./KNOWLEDGE.md)。

## ローカル開発

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に静的サイトを生成
npm run preview  # ビルド結果をローカル配信
```
