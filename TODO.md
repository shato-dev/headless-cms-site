# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま(サイト機能バックログ3機能 完了 2026-09-23 → 次は M7)

サイト機能バックログのうち予定していた3機能(ランダムおすすめ・関連作品・診断式おすすめ)が完了。
本番(<https://headless-cms-site.shato-dev.workers.dev>)で3機能とも動作確認済み(2026-09-23)。
ここで一区切りし、**次のチャットで M7 に着手する**(このチャットではここまで。新チャットはまず
`CLAUDE.md` / `CLAUDE.local.md` / `PLAN.md`(引き継ぎ用メモ)を読む)。

- [x] ランダムおすすめ(「今日の一冊」)(2026-09-23。`feat/random-pick`、PR #21)— `events` テーブルへの
      `random_pick` 送信は検討の結果見送り(M5 で書き込み API 公開をスコープ外にした判断を踏襲。詳細は
      PLAN.md サイト機能バックログ節)
- [x] 関連作品(2026-09-23。`feat/related-works`、PR #22)— 作品詳細ページに「同じ著者の他の作品」
      「同じジャンルの作品」をビルド時の静的フィルタで追加。追加データ・API 不要
- [x] 診断式おすすめ(2026-09-23。`feat/recommend-quiz`、PR #23)— `/quiz` に2問の `genreTags` ベース
      簡易診断。`events` への `quiz_completed` 送信は同じ理由で見送り

- [ ] **次にやること**: M7(OpenSearch をローカル Docker で概念理解、運用しない)。下記「保留」参照

## 保留(必要になったら)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch`。今は microCMS を更新しても
      main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)。詳細は PLAN.md の M3 節

## その後(余力があれば、詳細は PLAN.md サイト機能バックログ節)

- [ ] 既読チェック・お気に入り、文学史年表、ガチャ風演出

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
- **サイト機能バックログ3機能**(2026-09-23): ランダムおすすめ(PR #21)・関連作品(PR #22)・
  診断式おすすめ(PR #23)。3機能とも本番で動作確認済み

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- なし(現時点)
