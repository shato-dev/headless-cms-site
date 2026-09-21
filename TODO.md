# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま(M5: PostgreSQL + JSONB、用途 = イベントログに決定 2026-09-21)

新チャットはまず `CLAUDE.md` / `CLAUDE.local.md` / `PLAN.md`(引き継ぎ用メモ + M5 節「M5 の設計と進め方」)を読む。

### Phase 1: ローカル DB + スキーマ + seed + JSONB クエリ ✅(PR #8 マージ済み)
- [x] 用途を決める(B. 閲覧・操作イベント)
- [x] `docker compose up -d` でローカル Postgres 起動
- [x] `db/migrations/001_create_events.sql`(冪等・2 回適用で確認)
- [x] `scripts/seed-events.mjs`(seed 行だけ入れ直し、app 行に触れないこと・`down`→`up` で残ることを確認)
- [x] `db/queries/events-jsonb.sql`(`->>` / `@>` / 配列展開 / 日次集計 / `EXPLAIN`)
- [x] KNOWLEDGE.md / PLAN.md / `.env.example` 更新
- [x] コミット → push → PR #8 → CI 緑 → squash マージ(2026-09-21)

### Phase 2: 読み取り専用 API(PR 2、ブランチ `feat/m5-events-api`)
- [x] `workers/events-api/`(Worker、GET のみ: `/stats/daily` / `/stats/top-works` / `/events`)
- [x] `wrangler dev` + ローカル接続で確認(正常系・不正な type / limit / SQL インジェクション試行・405 / 404)
- [x] seed の未来日時バグを修正(API 経由で発見)
- [x] `npm run build` が通ること、型チェック(一回限り)
- [ ] コミット → push → PR → CI 緑 → マージ(push 前にユーザーの確認)

### Phase 3: 本番 DB + デプロイ(PR 3、**着手前にユーザーの承認**)
- [ ] Neon Free(推奨)でプロジェクト作成 — アカウント作成・接続文字列の登録はユーザー自身が行う
- [ ] Hyperdrive 設定、Worker のデプロイ方法(CI か手動か)を決める
- [ ] 公開前点検(接続文字列・絶対パス・メールが無いこと)→「これは公開されます」の確認

## 保留(必要になったら)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch`。今は microCMS を更新しても
      main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)。詳細は PLAN.md の M3 節
- [ ] Notion「学習まとめ」への M5 の学び追記(区切りで内容を示してから確認のうえ実施)

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

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare Workers(検索 API)の無料枠 — M6
