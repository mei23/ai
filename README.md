<h1><p align="center"><img src="./ai.svg" alt="藍" height="200"></p></h1>
<p align="center">An Ai for Misskey. <a href="./torisetu.md">About Ai</a></p>

## これなに
Misskey用の日本語Botです。

## インストール
> Node.js と npm と MeCab (オプション) がインストールされている必要があります。

まず適当なディレクトリに `git clone` します。
次にそのディレクトリに `config.json` を作成します。中身は次のようにします:
``` json
{
	"host": "https:// + あなたのインスタンスのURL (末尾の / は除く)",
	"i": "藍として動かしたいアカウントのアクセストークン",
	"master": "管理者のユーザー名(オプション)",
	"notingEnabled": "ランダムにノートを投稿する機能を無効にする場合は false を入れる",
	"keywordEnabled": "キーワードを覚える機能 (MeCab が必要) を有効にする場合は true を入れる (無効にする場合は false)",
	"keywordInterval": "キーワードを覚える間隔 (分, デフォルト60分)",
	"chartEnabled": "チャート機能を無効化する場合は false を入れてください",
	"reversiEnabled": "藍とリバーシで対局できる機能を有効にする場合は true を入れる (無効にする場合は false)",
	"serverMonitoring": "サーバー監視の機能を有効にする場合は true を入れる (無効にする場合は false)",
	"mecab": "MeCab のインストールパス (オプション、PATHが通ってれば指定不要)",
	"mecabDic": "MeCab の辞書ファイルパス (オプション、たいてい /usr/lib/x86_64-linux-gnu/mecab/dic/mecab-ipadic-neologd)",
	"mecabNeologd": "MeCabの辞書に mecab-ipadic-NEologd を使用している場合は true にすると良いかも"
}
```
`yarn install` して `yarn build` して `yarn start` すれば起動できます

Dockerの場合は最初に `memory/memory.json` に空ファイルを作っておく必要がある

Dockerイメージはここにある https://hub.docker.com/r/mei23/ia/

現状、Node v22ではチャートと迷路が動きません。

## フォント
一部の機能にはフォントが必要です。  

おそらくLinux環境などではフォントをインストールすればそれなりに使用してくれるはずです。  
Debian/Ubuntu系ディストリの場合
```
apt-get install -y fonts-noto
```
その際、フォントのグリフは環境変数で調整出来る可能性があります。
```shell
FC_LANG: ja
:
```

ご自身でフォントをインストールディレクトリに`font.ttf`という名前で設置することにより、特定のフォントファイルを使用することもできます。

## 時刻
定時動作系のタイムゾーンがずれる場合、サーバーの設定を変更するか環境変数などでも対処出来ます。
```shell
TZ: Asia/Tokyo
:
```

## 記憶
藍は記憶の保持にインメモリデータベースを使用しており、藍のインストールディレクトリに `memory.json` という名前で永続化されます。

## ライセンス
MIT

## Awards
<img src="./WorksOnMyMachine.png" alt="Works on my machine" height="120">
