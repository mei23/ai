import autobind from 'autobind-decorator';
import * as loki from 'lokijs';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

type User = {
	id: string;
	username: string;
	host?: string | null;
};

type Game = {
	votes: {
		user: User;
		number: number;
	}[];
	isEnded: boolean;
	startedAt: number;
	postId: string;
};

const limitMinutes = 10;

export default class extends Module {
	public readonly name = 'kazutori';

	private games: loki.Collection<Game>;
	private lock = 0;

	@autobind
	public install() {
		this.games = this.ai.getCollection('kazutori');

		this.crawleGameEnd();
		setInterval(this.crawleGameEnd, 1000);

		return {
			mentionHook: this.mentionHook,
			contextHook: this.contextHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (!msg.includes(['数取り'])) return false;

		if (this.lock && (Date.now() - this.lock < 60 * 1000)) {
			return false
		}
		this.lock = Date.now();

		const games = this.games.find({});

		const recentGame = games.length == 0 ? null : games[games.length - 1];

		if (recentGame) {
			// 現在アクティブなゲームがある場合
			if (!recentGame.isEnded) {
				msg.reply(serifs.kazutori.alreadyStarted, {
					renote: recentGame.postId
				});
				return true;
			}

			// 直近のゲームから時間経ってない場合
			if (Date.now() - recentGame.startedAt < 1000 * 60 * 60) {
				msg.reply(serifs.kazutori.matakondo);
				return true;
			}
		}

		const post = await this.ai.post({
			text: serifs.kazutori.intro(limitMinutes)
		});

		this.games.insertOne({
			votes: [],
			isEnded: false,
			startedAt: Date.now(),
			postId: post.id
		});

		this.lock = 0;

		this.subscribeReply(null, false, post.id);

		this.log('New kazutori game started');

		const game = this.games.findOne({
			isEnded: false
		});

		game!.votes.push({
			user: this.ai.account,
			number: Math.floor(Math.random() * 5) + 1 + 95
		});

		return true;
	}

	@autobind
	private async contextHook(key: any, msg: Message) {
		if (msg.text == null) return {
			reaction: 'hmm'
		};

		const game = this.games.findOne({
			isEnded: false
		});

		// 処理の流れ上、実際にnullになることは無さそうだけど一応
		if (game == null) return;

		const match = msg.extractedText.match(/[0-9]+/);
		if (match == null) return {
			reaction: 'hmm'
		};

		const num = parseInt(match[0], 10);

		// 整数じゃない
		if (!Number.isInteger(num)) return {
			reaction: 'hmm'
		};

		// 範囲外
		if (num < 0 || num > 100) return {
			reaction: 'confused'
		};

		this.log(`Voted ${num} by ${msg.user.id}`);

		// 投票
		game.votes = game.votes.filter(x => x.user.id !== msg.user.id);

		game.votes.push({
			user: {
				id: msg.user.id,
				username: msg.user.username,
				host: msg.user.host
			},
			number: num
		});

		this.games.update(game);

		return {
			reaction: 'like'
		};
	}

	/**
	 * 終了すべきゲームがないかチェック
	 */
	@autobind
	private crawleGameEnd() {
		const game = this.games.findOne({
			isEnded: false
		});

		if (game == null) return;

		// 制限時間が経過していたら
		if (Date.now() - game.startedAt >= 1000 * 60 * limitMinutes) {
			this.finish(game);
		}
	}

	/**
	 * ゲームを終わらせる
	 */
	@autobind
	private finish(game: Game) {
		game.isEnded = true;
		this.games.update(game);

		this.log('Kazutori game finished');

		// お流れ
		if (game.votes.length <= 0) {
			this.ai.post({
				visibility: 'public',
				text: serifs.kazutori.onagare,
				renoteId: game.postId
			});

			return;
		}

		function acct(user: User): string {
			return user.host
				? `:@${user.username}@${user.host}:`
				: `:@${user.username}:`;
		}

		let results: string[] = [];
		let winner: User | null = null;

		for (let i = 100; i >= 0; i--) {
			const users = game.votes
				.filter(x => x.number == i)
				.map(x => x.user);

			if (users.length == 1) {
				if (winner == null) {
					winner = users[0];
					const icon = i == 100 ? '💯' : '🎉';
					results.push(`${icon} **${i}**: (((${acct(users[0])})))`);
				} else {
					results.push(`➖ ${i}: ${acct(users[0])}`);
				}
			} else if (users.length > 1) {
				results.push(`❌ ${i}: ${users.map(u => acct(u)).join(' ')}`);
			}
		}

		const winnerFriend = winner ? this.ai.lookupFriend(winner.id) : null;
		const name = winnerFriend ? winnerFriend.name : null;

		const text = results.join('\n') + '\n\n' + (winner
			? serifs.kazutori.finishWithWinner(acct(winner), name)
			: serifs.kazutori.finishWithNoWinner);

		this.ai.post({
			visibility: 'public',
			text: text,
			cw: serifs.kazutori.finish,
			renoteId: game.postId
		});

		this.unsubscribeReply(null);
	}
}
