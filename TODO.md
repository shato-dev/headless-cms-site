# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま → 次(M5: PostgreSQL + JSONB)

新チャットはまず `CLAUDE.md` / `CLAUDE.local.md` / `PLAN.md`(引き継ぎ用メモ)を読み、Plan Mode で M5 の手順を作る。

- [ ] `docker compose up -d` でローカル Postgres を起動(Docker Desktop の起動確認が先)
- [ ] 本番 DB の選定: Supabase / Neon の無料プランについて、カード要否・無料枠・休止条件を整理してから選ぶ
- [ ] スキーマ設計(可変・半構造データは JSONB、列に分けるものとの線引き)
- [ ] マイグレーション SQL を `db/` に置く。`->>` / `@>` / GIN インデックスを試す
- [ ] 取得用の小さな API(まずローカルの Node / Astro エンドポイント)
- [ ] ブランチ → PR → CI 緑 → マージ

## 保留(必要になったら)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch`。今は microCMS を更新しても
      main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)。詳細は PLAN.md の M3 節

## その後(サイト機能バックログ、詳細は PLAN.md)

- [ ] ランダムおすすめ(「今日の一冊」)
- [ ] 診断式おすすめ(ジャンル等の質問 → 1冊提案)
- [ ] 関連作品(同じ著者・同じジャンル)
- [ ] (余力)既読チェック・お気に入り、文学史年表、ガチャ風演出

## 見送り

- 専用 404 ページ(2026-09-19 決定。404 応答自体は返る)
- `ubuntu-latest` → `ubuntu-24.04` 固定(2026-09-19 決定。2026-10-19 の切り替えは、CI が赤くなったら対処)
- Postgres 18(2026-09-20 決定。17 で開始。18 はデータ置き場の構成が変わるので、必要になったら確認)

## 完了した直近マイルストーン

- **M1**(2026-09-09): リポジトリ作成 + Astro 初期化 + 最小 CI + ブランチ保護
- **M2**(2026-09-14): 青空文庫100作品サイト。著作権チェックリストで全100件監査・17件修正
  (`docs/aozora-100-audit-report.md`)。ローカル JSON → microCMS へ2段階で移行(PR #1, #2)。
  一覧・詳細・著者・ジャンル・検索まで実装済み
- **M3**(2026-09-19): Cloudflare へ自動デプロイ(PR #3, #4)。Pages ではなく Workers static assets を採用。
  公開 URL: <https://headless-cms-site.shato-dev.workers.dev>。`ci.yml` = `build` → `deploy`(main のみ)
- **M4**(2026-09-20): Docker Compose で PostgreSQL 17 + Meilisearch v1.53 をローカル起動。
  `127.0.0.1` のみ公開・named volume で永続化・healthcheck。無料・カード不要

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare Workers(検索 API)の無料枠 — M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
