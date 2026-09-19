# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま → 次(M4: Docker Compose でローカル基盤)

- [ ] Docker Desktop の起動確認
- [ ] `docker-compose.yml` に `postgres` と `meilisearch` の 2 サービス(ボリューム永続化・ポート公開)
- [ ] `.env.example` にパスワード等のキー名を追加(実 `.env` は gitignore 済み)
- [ ] `docker compose up -d` / `down` / `logs` で起動・停止・ログ確認
- [ ] 着手時に Plan Mode で詳細手順を作る

## M3 の残り(任意・M4 と並行可)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch` / `workflow_dispatch`。
      今は microCMS を更新しても main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)
- [ ] (余力)`src/pages/404.astro` を追加して専用の 404 ページにする
- [ ] (余力)`ubuntu-latest` が 2026-10-19 に Ubuntu 26 へ移る件。問題が出たら `ubuntu-24.04` に固定

## その後(サイト機能バックログ、詳細は PLAN.md)

- [ ] ランダムおすすめ(「今日の一冊」)
- [ ] 診断式おすすめ(ジャンル等の質問 → 1冊提案)
- [ ] 関連作品(同じ著者・同じジャンル)
- [ ] (余力)既読チェック・お気に入り、文学史年表、ガチャ風演出

## 完了した直近マイルストーン

- **M1**(2026-09-09): リポジトリ作成 + Astro 初期化 + 最小 CI + ブランチ保護
- **M2**(2026-09-14): 青空文庫100作品サイト。著作権チェックリストで全100件監査・17件修正
  (`docs/aozora-100-audit-report.md`)。ローカル JSON → microCMS へ2段階で移行(PR #1, #2)。
  一覧・詳細・著者・ジャンル・検索まで実装済み
- **M3**(2026-09-19): Cloudflare へ自動デプロイ(PR #3)。Pages ではなく Workers static assets を採用。
  公開 URL: <https://headless-cms-site.shato-dev.workers.dev>。`ci.yml` = `build` → `deploy`(main のみ)

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare Workers(検索 API)の無料枠 — M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
