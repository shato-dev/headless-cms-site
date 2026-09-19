# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま → 次(M4: Docker Compose でローカル基盤)

新チャットはまず `CLAUDE.md` / `CLAUDE.local.md` / `PLAN.md`(引き継ぎ用メモ)を読み、Plan Mode で M4 の手順を作る。

- [ ] Docker Desktop の起動確認
- [ ] `docker-compose.yml` に `postgres` と `meilisearch` の 2 サービス(ボリューム永続化・ポート公開)
- [ ] `.env.example` にパスワード等のキー名を追加(実 `.env` は gitignore 済み)
- [ ] `docker compose up -d` / `down` / `logs` で起動・停止・ログ確認
- [ ] ブランチ → PR → CI 緑 → マージ(M4 も Git 操作を混ぜる)

## 保留(必要になったら)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch`。今は microCMS を更新しても
      main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)。詳細は PLAN.md の M3 節

## その後(サイト機能バックログ、詳細は PLAN.md)

- [ ] ランダムおすすめ(「今日の一冊」)
- [ ] 診断式おすすめ(ジャンル等の質問 → 1冊提案)
- [ ] 関連作品(同じ著者・同じジャンル)
- [ ] (余力)既読チェック・お気に入り、文学史年表、ガチャ風演出

## 見送り(2026-09-19 に決定)

- 専用 404 ページ(404 応答自体は返る)
- `ubuntu-latest` → `ubuntu-24.04` 固定(2026-10-19 の切り替えは、CI が赤くなったら対処)

## 完了した直近マイルストーン

- **M1**(2026-09-09): リポジトリ作成 + Astro 初期化 + 最小 CI + ブランチ保護
- **M2**(2026-09-14): 青空文庫100作品サイト。著作権チェックリストで全100件監査・17件修正
  (`docs/aozora-100-audit-report.md`)。ローカル JSON → microCMS へ2段階で移行(PR #1, #2)。
  一覧・詳細・著者・ジャンル・検索まで実装済み
- **M3**(2026-09-19): Cloudflare へ自動デプロイ(PR #3, #4)。Pages ではなく Workers static assets を採用。
  公開 URL: <https://headless-cms-site.shato-dev.workers.dev>。`ci.yml` = `build` → `deploy`(main のみ)

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare Workers(検索 API)の無料枠 — M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
