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

## 公開(GitHub Pages)
`docs/index.html` が公開用の単一HTMLです(`build.py` が自動で更新)。
リポジトリの Settings → Pages で Source を `main` / `/docs` に設定すると、URLを知っていれば誰でも遊べます(無料プランでは公開リポジトリが必要)。

## 動作確認(スモークテスト)
キャラ追加などの変更後は、`src/` で `python3 build.py` を実行してから次を流してください。
```
node ../tests/smoke_all.js      # 全画面・全ステージ戦闘(時間がかかります)
node ../tests/smoke_gacha.js    # ガチャ1連/10連
node ../tests/smoke_battle.js   # 実戦闘を最後まで
node ../tests/smoke_mobile.js   # スマホ幅の横はみ出し確認
node ../tests/steal.js          # マッチ奪い(速度奪取)の決定的テスト
node ../tests/pred.js           # マッチ予測と実際の戦闘結果の一致率
node ../tests/steal_ui.js       # 戦闘画面でのドラッグ奪取(スクショ steal_*.png)
```
