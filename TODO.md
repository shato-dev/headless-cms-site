# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま(M6 完了 2026-09-22 → 次はサイト機能バックログ)

M6(Meilisearch + Cloudflare Workers の検索 API)は完了。次は **M7 より先にサイト機能バックログに着手**する
と決定(2026-09-22。「まずウェブサイトを完成させたい」ため)。新チャットはまず `CLAUDE.md` / `CLAUDE.local.md` /
`PLAN.md`(引き継ぎ用メモ)を読み、下記「サイト機能バックログ」から何を・どの順でやるかを Plan Mode で決める。

- [ ] **次にやること**: サイト機能バックログ(下記)のどれから着手するか Plan Mode で決める。ランダムおすすめ・
      診断式おすすめは、実装時に M5 の `events` テーブルへイベントを送る接続も検討する

## 保留(必要になったら)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch`。今は microCMS を更新しても
      main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)。詳細は PLAN.md の M3 節
- [ ] M7: OpenSearch の仕組みをローカル Docker で概念理解(運用しない)。サイト機能バックログの後に着手

## その後(サイト機能バックログ、詳細は PLAN.md)

- [ ] ランダムおすすめ(「今日の一冊」)— 実装時にイベント(`random_pick`)を Postgres に送る接続を検討
- [ ] 診断式おすすめ(ジャンル等の質問 → 1冊提案)— 同上(`quiz_completed`)
- [ ] 関連作品(同じ著者・同じジャンル)
- [ ] (余力)既読チェック・お気に入り、文学史年表、ガチャ風演出

## 見送り

- 専用 404 ページ(2026-09-19 決定。404 応答自体は返る)
- `ubuntu-latest` → `ubuntu-24.04` 固定(2026-09-19 決定。2026-10-19 の切り替えは、CI が赤くなったら対処)
- Postgres 18(2026-09-20 決定。17 で開始。18 はデータ置き場の構成が変わるので、必要になったら確認)
- 書き込み API の公開(2026-09-21 決定。認証・レート制限が要るので M5 のスコープ外)

## 完了した直近マイルストーン

- **M1**(2026-09-09): リポジトリ作成 + Astro 初期化 + 最小 CI + ブランチ保護
- **M2**(2026-09-14): 青空文庫100作品サイト。著作権チェックリストで全100件監査・17件修正
  (`docs/aozora-100-audit-report.md`)。ローカル JSON → microCMS へ2段階で移行(PR #1, #2)。
  一覧・詳細・著者・ジャンル・検索まで実装済み
- **M3**(2026-09-19): Cloudflare へ自動デプロイ(PR #3, #4)。Pages ではなく Workers static assets を採用。
  公開 URL: <https://headless-cms-site.shato-dev.workers.dev>。`ci.yml` = `build` → `deploy`(main のみ)
- **M4**(2026-09-20): Docker Compose で PostgreSQL 17 + Meilisearch v1.53 をローカル起動。
  `127.0.0.1` のみ公開・named volume で永続化・healthcheck。無料・カード不要
- **M5**(2026-09-21): PostgreSQL + JSONB のイベントログ(用途 = 閲覧・操作イベント)。読み取り専用の
  Bearer 認証付き Worker API を Neon Free + Hyperdrive で公開(PR #8, #9, #10)。
  公開 URL: <https://events-api.shato-dev.workers.dev>(要トークン)
- **M6**(2026-09-22): Meilisearch(Render Free)+ Cloudflare Workers の検索 API(PR #14〜#17)。
  公開サイトの検索を本番 API 化し、Render スリープ時は簡易検索にフォールバック。
  公開 URL: <https://search-api.shato-dev.workers.dev>(認証なし・CORS 制限)
- **Notion 記録**(2026-09-22): M4・M6 の学習ノートを `my-web-project` 配下に追記、TODO データベースも更新(PR #19)

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- なし(現時点)
