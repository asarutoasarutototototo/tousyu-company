# 灯守カンパニー / LAMPWARDEN COMPANY

オリジナルのターン制コイン勝負バトルRPG。ビルドすると単一HTMLファイルになります。

## 構成
- `src/` … ゲーム本体のソース(JS モジュール群 + `style.css`)と `build.py`
  - `img_data.js` / `img_mina.js` は画像(data URI)で容量が大きいファイルです
- `tests/` … Playwright 用の検証スクリプト(`src/test_full.html` を開いて実行)

## ビルド
```
cd src
python3 build.py      # -> src/lampwarden.html (公開用) と src/test_full.html (テスト用)
```
`lampwarden.html` をブラウザで開くとそのまま遊べます。

## テスト例
```
cd src && python3 build.py && node ../tests/sim2.js
```
(スクリプトは実行時のカレントディレクトリの `test_full.html` を読みます)
