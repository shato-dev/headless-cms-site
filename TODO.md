# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま(M6 進行中、2026-09-22 着手)

M6 = Meilisearch + Cloudflare Workers の検索 API。置き場所は Render Free に決定(PLAN.md の M6 節)。計画は Plan Mode で承認済み。

- [x] Phase 1: `scripts/build-search-documents.mjs` / `search/`(設定・Docker イメージ)/ 日本語 typo の実測 / 512 MB 制限での検証(PR 1)
- [x] Phase 2: Render に手動デプロイ完了(2026-09-22。サービス名 `aozora-search`、Free プラン、カード未登録。/health 200、無認証検索 401、検索専用キー取得済み)
- [ ] Phase 3: `workers/search-api/`(PR 2)+ 手動デプロイ(`wrangler login` → deploy → `secret put MEILI_SEARCH_KEY` → `wrangler logout`)
- [ ] Phase 4: `Search.astro` を Worker 呼び出し + フォールバックに差し替え(PR 3)
- [ ] 仕上げ: KNOWLEDGE / PLAN / TODO / `.env.example`

## 前の区切り(M5 完了 2026-09-21 → 次の選択)

M5 は完了(用途 = イベントログ。Postgres + JSONB、読み取り専用の認証付き Worker API を Neon 上で公開)。
新チャットはまず `CLAUDE.md` / `CLAUDE.local.md` / `PLAN.md`(引き継ぎ用メモ)を読み、次を Plan Mode で決める。

- [ ] **次に何をやるか決める**: サイト機能バックログ(ランダムおすすめ・診断式おすすめ・関連作品。実装時に
      イベントを Postgres に送る接続も検討)/ M6(Meilisearch + Workers 検索 API)のどちらから着手するか
- [x] Notion「学習まとめ」に M5 の学びを追記(2026-09-21。`my-web-project` 配下に M5 の子ページ、TODO データベースの M4・M5 を完了に更新。M4 の学習ノート用の子ページは未作成)


### Phase 1: ローカル DB + スキーマ + seed + JSONB クエリ ✅(PR #8 マージ済み)
- [x] 用途を決める(B. 閲覧・操作イベント)
- [x] `docker compose up -d` でローカル Postgres 起動
- [x] `db/migrations/001_create_events.sql`(冪等・2 回適用で確認)
- [x] `scripts/seed-events.mjs`(seed 行だけ入れ直し、app 行に触れないこと・`down`→`up` で残ることを確認)
- [x] `db/queries/events-jsonb.sql`(`->>` / `@>` / 配列展開 / 日次集計 / `EXPLAIN`)
- [x] KNOWLEDGE.md / PLAN.md / `.env.example` 更新
- [x] コミット → push → PR #8 → CI 緑 → squash マージ(2026-09-21)

### Phase 2: 読み取り専用 API ✅(PR #9 マージ済み)
- [x] `workers/events-api/`(Worker、GET のみ: `/stats/daily` / `/stats/top-works` / `/events`)
- [x] `wrangler dev` + ローカル接続で確認(正常系・不正な type / limit / SQL インジェクション試行・405 / 404)
- [x] seed の未来日時バグを修正(API 経由で発見)
- [x] `npm run build` が通ること、型チェック(一回限り)
- [x] コミット → push → PR #9 → CI 緑 → マージ(2026-09-21)

### Phase 3: 本番 DB + デプロイ ✅(PR #10 マージ済み、2026-09-21 デプロイ)
- [x] Neon Free(Postgres 17、シンガポール)+ 読み取り専用ロール `events_reader` + Hyperdrive 設定 `events-db`
- [x] Bearer トークン認証を追加、`client.end()` ハングを修正、PR #10 マージ
- [x] main から `wrangler deploy` → <https://events-api.shato-dev.workers.dev>(トークン設定前は全リクエスト 500 = fail closed)
- [x] `API_TOKEN` を Secret に登録(ユーザー自身)、検証用に `.env` へ `EVENTS_API_TOKEN`
- [x] 公開 URL で 18 ケース検証(未認証 401 / 認証あり 200 / 400・404・405 / `session_id` 非露出 / 件数一致)
- [x] Neon の復帰レイテンシを計測(KNOWLEDGE.md の M5 節)
- [x] `npx wrangler logout` でローカルの Cloudflare ログインを解除(2026-09-21。次回のデプロイ前に `npx wrangler login` が要る)

## 保留(必要になったら)

- [ ] microCMS Webhook →「記事更新で自動再デプロイ」(`repository_dispatch`。今は microCMS を更新しても
      main に push するまでサイトは変わらない。GitHub トークンの権限は最小に)。詳細は PLAN.md の M3 節

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
