# Windows での問題解決方法

## 🔧 今すぐ試してください

### ステップ1: 環境修復
```cmd
quick-fix.bat
```
これで依存関係を再インストールし、環境を修復します。

### ステップ2: 開発サーバー起動
```cmd
start-dev.bat
```
これでReact開発サーバーが起動します。

## 🚨 問題の原因

1. **npx が認識されない** - Windows環境でのPATH問題
2. **文字化け** - バッチファイルの文字エンコーディング問題
3. **パッケージへのパス** - node_modules/.bin が正しく参照されていない

## ✅ 修正した内容

### 新しいバッチファイル
- `quick-fix.bat` - 環境を修復
- `start-dev.bat` - 確実に開発サーバーを起動

### 修正点
- `npx` を `node_modules\.bin\` に変更
- 文字エンコーディングを UTF-8 に設定
- 英語メッセージで文字化け回避

## 🎯 推奨手順

### 初回セットアップ
```cmd
# 1. 環境修復
quick-fix.bat

# 2. 開発サーバー起動
start-dev.bat
```

### 日常の開発
```cmd
start-dev.bat
```

## 📱 動作確認

開発サーバーが起動したら：
1. ブラウザで http://localhost:3000 を開く
2. RSS Reader の UI が表示される
3. ファイルを編集すると自動で再読み込み

## 🔄 代替方法

もし上記でも問題がある場合：

```cmd
# 直接実行
node_modules\.bin\webpack serve --config webpack.renderer.config.js

# または npm 経由
npm run serve
```

## 🛠 トラブルシューティング

### エラーが続く場合
1. Node.js を再インストール
2. プロジェクトフォルダを削除して再クローン
3. 管理者権限でコマンドプロンプトを実行

### ポート3000が使用中
```cmd
netstat -ano | findstr :3000
taskkill /PID [PID番号] /F
```

これで確実に動作するはずです！