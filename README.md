# Memento Mori Timer

「死ぬまであと〇日」をカウントダウン表示し、朝と夜に"死の意識"を軸にした問いへ回答を記録できるシンプルなプライベート日記アプリ。

## 🎯 コンセプト

死を意識することで、限られた時間をより意識的に使い、充実した人生を送るためのツールです。

## ✨ 主要機能

### 🕐 カウントダウン表示
- 設定した仮寿命日までの残り日数を常時表示
- 進捗バーで人生の経過を視覚化
- うるう年・日付跨ぎに正しく対応（Asia/Tokyo基準）

### 🌅 朝の記録
- 「この1日を、何に使うか？」
- 「後悔しないか？」
- 自由記入欄

### 🌙 夜の記録
- 「今日、最も命を有効に使ったことは？」
- 「無駄にしたと思うことは？」
- 「明日はどう過ごす？」
- 自由記入欄

### 📊 記録管理
- 日次エントリの一覧表示
- 検索・フィルタ機能（記入済み/未記入）
- データのエクスポート/インポート（JSON）

### ⚙️ 設定
- 仮寿命日の設定・変更
- データ管理（バックアップ・復元・削除）

## 🛠 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **フォーム管理**: React Hook Form + Zod
- **日付処理**: date-fns
- **データ保存**: LocalStorage（将来的にSupabase対応予定）

## 🚀 セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd mementomori-timer

# 依存関係をインストール
npm install

# 環境変数ファイルを設定（任意）
cp .env.example .env.local
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセス

### ビルド

```bash
# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start
```

## 📱 使い方

### 初回セットアップ
1. 設定ページで仮寿命日を設定
2. ホーム画面で残り日数を確認

### 日常の使用
1. 朝：今日の目標と意識を記録
2. 夜：一日の振り返りと明日への改善点を記録
3. 記録一覧で過去の記録を振り返り

### データ管理
- 設定ページでデータのバックアップ・復元が可能
- JSONファイルでのエクスポート/インポート対応

## 🗂 プロジェクト構成

```
/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx        # ホーム画面
│   │   ├── today/          # 今日の記録画面
│   │   ├── log/            # 記録一覧画面
│   │   ├── settings/       # 設定画面
│   │   ├── layout.tsx      # ルートレイアウト
│   │   └── globals.css     # グローバルスタイル
│   └── lib/                # ユーティリティ
│       ├── date.ts         # 日付処理
│       ├── storage.ts      # ストレージ管理
│       ├── schema.ts       # Zodスキーマ
│       └── adapters/       # ストレージアダプタ
│           └── local.ts    # LocalStorageアダプタ
├── public/                 # 静的ファイル
├── package.json
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## 🔧 設定

### 環境変数

`.env.local`で以下の設定が可能：

```bash
# Supabase使用フラグ（将来実装予定）
NEXT_PUBLIC_USE_SUPABASE=false
```

### データ保存

- **デフォルト**: ブラウザのLocalStorage
- **将来対応予定**: Supabase（クラウド保存）

## 📐 データモデル

### 設定 (Settings)
```typescript
{
  targetDate: string      // 仮寿命日 (YYYY-MM-DD)
  passcode?: string       // パスコード（オプション）
}
```

### 日次記録 (DayRecord)
```typescript
{
  date: string           // 日付 (YYYY-MM-DD)
  morning?: {            // 朝の記録
    answers: {
      usage: string      // この1日を、何に使うか？
      regret: string     // 後悔しないか？
      freeText?: string  // 自由記入
    }
    createdAt: string
    updatedAt: string
  }
  evening?: {            // 夜の記録
    answers: {
      mostVital: string  // 最も命を有効に使ったこと
      waste: string      // 無駄にしたこと
      tomorrow: string   // 明日への改善点
      freeText?: string  // 自由記入
    }
    createdAt: string
    updatedAt: string
  }
}
```

## 🔐 セキュリティ

- データは個人のブラウザ内のみに保存
- パスコード機能（将来実装予定）
- 個人用途のためアカウント機能なし

## 🎨 デザイン原則

- **ミニマル**: 死の意識に集中できるシンプルなUI
- **アクセシブル**: キーボードナビゲーション対応
- **レスポンシブ**: モバイル・デスクトップ最適化

## 🚧 今後の拡張予定

- [ ] Supabaseによるクラウド保存
- [ ] パスコードロック機能
- [ ] PWA対応
- [ ] データ可視化（グラフ・統計）
- [ ] リマインダー機能
- [ ] テーマ切り替え（ダークモード）

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

Issues、Pull Requestsを歓迎します。

## ⚠️ 免責事項

このアプリは個人の内省と自己改善を目的としたツールです。医療的・心理的アドバイスを提供するものではありません。