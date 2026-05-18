# ALTA — JSTQB AL TA 模擬試験クイズアプリ

JSTQB Advanced Level Test Analyst の自習用クイズアプリ。家ではPC、外出先ではスマホのブラウザから同じURLで利用できる、シンプルな静的SPAです。

## 機能

- **模擬試験モード**: 全問題からランダムに 40 問を抽出、180 分の制限時間付き
- **分野別練習モード**: シラバスの章を選び、即時フィードバックで演習
- **誤答復習モード**: 過去に間違えた問題を集中復習
- **学習履歴**: 過去セッションのスコア、章ごとの累積誤答数を確認
- 成績はブラウザの localStorage に保存（端末ごとに保存）

## ローカル開発

```bash
npm install
npm run dev       # http://localhost:5173/alta/ で起動
npm run build     # 型チェック + 本番ビルド (dist/)
npm run preview   # ビルド成果物をローカルで確認
```

## 問題データの追加方法

問題は `src/data/chapters/chN.json`（N は章番号）に JSON 配列として格納されています。各章ファイルに 1 件追加するだけで自動的に出題プールに含まれます。

スキーマ：

```jsonc
{
  "id": "ch1-004",            // "ch<章>-<連番>" の形式
  "chapter": "1",             // 章番号
  "chapterName": "テスト分析プロセス",
  "kLevel": "K3",             // K2 / K3 / K4（任意）
  "question": "問題文…",
  "choices": ["選択肢A", "選択肢B", "選択肢C", "選択肢D"],
  "correctAnswers": [1],      // 0始まりインデックス、複数正解は配列で
  "explanation": "解説…"
}
```

新しい章を追加したい場合：

1. `src/data/chapters/chN.json` を新規作成
2. `src/data/chapters.ts` の `CHAPTERS` と `import` に追加

## GitHub Pages へのデプロイ

1. リポジトリの **Settings → Pages → Build and deployment → Source** を **GitHub Actions** に変更
2. `main` ブランチに push すると `.github/workflows/deploy.yml` が走り、`https://krnrqrye53.github.io/alta/` に自動デプロイ

## ライセンス / 著作権

本リポジトリに含まれる問題はすべて**学習用に書き起こしたオリジナル**であり、JSTQB 公式の試験問題ではありません。
