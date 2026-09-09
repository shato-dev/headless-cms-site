# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま(M1: リポジトリ作成 + Astro 初期化)

- [x] Astro 雛形を scaffold(minimal + TS strict)
- [x] `.gitignore` 確認 / `package.json` name = `headless-cms-site`
- [x] `.claude/launch.json` 追加
- [x] `PLAN.md` / `KNOWLEDGE.md` / `TODO.md` / `README.md` 追加
- [ ] build のみの `.github/workflows/ci.yml` 追加
- [ ] ローカル `npm run build` 確認
- [ ] コンテンツ点検(public 公開前 — メール / 絶対パス / 秘密情報 / 非公開 URL)
- [ ] `gh repo create headless-cms-site --public --source=. --push`
- [ ] 初回 CI が緑を確認
- [ ] main ブランチ保護(required status check = `build`、`strict:false`、`enforce_admins:false`)
- [ ] PLAN.md 進捗表 M1 を ✅、外部の学習ノートの該当項目を更新(`CLAUDE.local.md` 参照)

## 次(M2: microCMS)

- [ ] Plan Mode で M2 の詳細手順を作る
- [ ] microCMS アカウント / サービス作成(Free プラン、カード登録不要)
- [ ] コンテンツモデル設計(title / body / description / publishedAt / tags)
- [ ] API キー取得 → `.env`(gitignore 済みを確認)/ `.env.example` にキー名だけ commit
- [ ] `feat/content-from-microcms` ブランチで実装 → PR → セルフレビュー → squash マージ

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare(Pages / Workers)の無料枠 — M3 / M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
- Docker Desktop の起動確認 — M4
