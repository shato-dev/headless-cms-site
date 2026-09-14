# TODO — 直近タスク

`/clear` する前に更新する。全体像と背景は PLAN.md。

## いま → 次(M3: Cloudflare Pages 自動デプロイ)

- [ ] Cloudflare アカウント作成(**着手前に無料枠 / カード要否を整理して報告**)
- [ ] Pages プロジェクト作成
- [ ] `astro.config.mjs` に `site: 'https://<project>.pages.dev'` を設定(`base` は不要)
- [ ] `.github/workflows/ci.yml` に `deploy` ジョブを追加(main のみ)
- [ ] デプロイ用のトークンを GitHub Secrets に登録(**`wrangler ...--yes` は課金ブロック Hook に
      当たるので使わない**。非対話フラグの付け方を確認する)
- [ ] PR → CI 緑 → マージ → deploy が走ることを確認
- [ ] 公開 URL で一覧・詳細・著者・ジャンル・検索が動くことを確認

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

## 保留・要相談(着手前に料金体系 + カード要否を整理)

- Cloudflare(Pages / Workers)の無料枠 — M3(次)/ M6
- Supabase または Neon の PostgreSQL 無料プラン — M5
- Docker Desktop の起動確認 — M4
