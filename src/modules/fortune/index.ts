import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';
import * as seedrandom from 'seedrandom';
import { genItem } from '@/vocabulary';
import * as loki from 'lokijs';
import config from '../../config';

export const blessing = [
	'犬吉',
	'ギガ吉',
	'メガ吉',
	'ナノ吉',
	'超吉',
	'大大吉',
	'大吉',
	'吉',
	'中吉',
	'小吉',
	'凶',
	'大凶',
];

export default class extends Module {
	public readonly name = 'fortune';

	private learnedKeywords?: loki.Collection<{
		keyword: string;
		learnedAt: number;
	}>;

	@autobind
	public install() {
		if (config.keywordEnabled) {
			this.learnedKeywords = this.ai.getCollection('_keyword_learnedKeywords', {
				indices: ['userId']
			});
		}

		return {
			mentionHook: this.mentionHook
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		if (msg.includes(['占', 'うらな', '運勢', 'おみくじ'])) {
			const getKeyword = (rng: () => number) => {
				if (!this.learnedKeywords) return null;
	
				const count = this.learnedKeywords.count();
				const offset = Math.floor(rng() * count);
		
				const x = this.learnedKeywords.chain().find().offset(offset).limit(1).data();
				const keyword = x[0]?.keyword || null;
				return keyword;
			};

			const date = new Date();
			const seed = `${date.getFullYear()}/${date.getMonth()}/${date.getDate()}@${msg.userId}@${this.ai.account.id}`;
			const rng = seedrandom(seed);
			const omikuji = blessing[Math.floor(rng() * blessing.length)];
			const item = genItem(rng, getKeyword);
			msg.reply(`**${omikuji}🎉**\nラッキーアイテム: ${item}`, {
				cw: serifs.fortune.cw(msg.friend.name)
			});
			return true;
		} else {
			return false;
		}
	}
}
