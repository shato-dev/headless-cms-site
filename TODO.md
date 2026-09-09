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

## いま → 次(M2: microCMS)

- [ ] Plan Mode で M2 の詳細手順を作る
- [ ] microCMS アカウント / サービス作成(Free プラン、カード登録不要)
- [ ] コンテンツモデル設計(title / body / description / publishedAt / tags)
- [ ] API キー取得 → `.env`(gitignore 済みを確認)/ `.env.example` にキー名だけ commit
- [ ] `feat/content-from-microcms` ブランチで実装 → PR → セルフレビュー → squash マージ

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare(Pages / Workers)の無料枠 — M3 / M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
- Docker Desktop の起動確認 — M4
