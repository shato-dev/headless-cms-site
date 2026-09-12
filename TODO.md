# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## M1: リポジトリ作成 + Astro 初期化 — ✅ 完了(2026-09-09)

- [x] Astro 雛形を scaffold(minimal + TS strict)
- [x] `.gitignore` 確認 / `package.json` name = `headless-cms-site`
- [x] `.claude/launch.json` 追加 / `.claude/settings.local.json` を追跡解除
- [x] `PLAN.md` / `KNOWLEDGE.md` / `TODO.md` / `README.md` 追加
- [x] build のみの `.github/workflows/ci.yml` 追加
- [x] ローカル `npm run build` 確認
- [x] コンテンツ点検 + 私的文脈を `CLAUDE.local.md`(git 管理外)へ分離
- [x] `gh repo create headless-cms-site --public --source=. --push` → <https://github.com/shato-dev/headless-cms-site>
- [x] 初回 CI 緑
- [x] main ブランチ保護(required status check = `build`、`strict:false`、`enforce_admins:false`)
- [ ] 外部の学習ノートの該当項目を「完了」に更新(`CLAUDE.local.md` 参照)

## いま → 次(M2: 青空文庫100作品サイト)

- [x] 題材確定(青空文庫100選+要約)、著作権チェックリストで全100件監査・17件修正
- [x] `~/.claude/CLAUDE.md` に「公開物の著作権・法令遵守」を恒久ルール化
- [x] `feat/content-from-microcms` ブランチ作成、`src/content/works.json` / `docs/` 配置 → 内容確認済み
- [x] `content.config.ts`(`file()` ローダー + Zod)、`src/lib/works.ts`
- [x] `BaseLayout.astro` / `WorkCard.astro` / `global.css`
- [x] ページ: `index` / `works/[id]` / `authors/*` / `genres/*`
- [x] キーワード検索(astro-warmup の `Search.astro` 方式)
- [x] ローカル `npm run build`(144ページ、エラーなし)+ `preview_start` で目視確認
- [x] `scripts/import-to-microcms.mjs` + `.env.example`(**未実行**)
- [ ] PLAN.md 進捗更新 → push → PR → セルフレビュー → squash マージ
- [ ] **ここで停止**: microCMS アカウント / サービス作成の手順を提示して待つ

## サイト機能バックログ(次の追加 PR、詳細は PLAN.md)

- [ ] ランダムおすすめ(「今日の一冊」)
- [ ] 診断式おすすめ(ジャンル等の質問 → 1冊提案)
- [ ] 関連作品(同じ著者・同じジャンル)
- [ ] (余力)既読チェック・お気に入り、文学史年表、ガチャ風演出

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- microCMS アカウント / サービス作成(Free プラン、カード登録不要) — M2 後半
- Cloudflare(Pages / Workers)の無料枠 — M3 / M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
- Docker Desktop の起動確認 — M4
