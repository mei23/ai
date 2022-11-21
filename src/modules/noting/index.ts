import autobind from 'autobind-decorator';
import Module from '@/module';
import serifs from '@/serifs';
import { genItem } from '@/vocabulary';
import config from '@/config';
import * as loki from 'lokijs';
import Stream from '@/stream';
import { Note } from '@/misskey/note';

export default class extends Module {
	public readonly name = 'noting';

	private learnedKeywords?: loki.Collection<{
		keyword: string;
		learnedAt: number;
	}>;

	private tl: ReturnType<Stream['useSharedConnection']>;
	private pendCount = 0;

	@autobind
	public install() {
		if (config.notingEnabled === false) return {};

		if (config.keywordEnabled) {
			this.learnedKeywords = this.ai.getCollection('_keyword_learnedKeywords', {
				indices: ['userId']
			});
		}

		this.tl = this.ai.connection.useSharedConnection('localTimeline');
		this.tl.on('note', this.onNote);
	
		setInterval(() => {
			if (this.pendCount + (Math.random() * 120) > 120) {
				this.pendCount = 0;
				this.post();
			}
		}, 1000 * 60);

		return {};
	}

	@autobind
	private async onNote(note: Note) {
		if (note.reply != null) return;
		if (note.userId === this.ai.account.id) return; // 自分は弾く

		this.pendCount++;
	}

	@autobind
	private post() {
		if (Math.random() * 100 > 50) {
			const getKeyword = (rng: () => number) => {
				if (!this.learnedKeywords) return null;

				const count = this.learnedKeywords.count();
				const offset = Math.floor(rng() * count);

				const x = this.learnedKeywords.chain().find().offset(offset).limit(1).data();
				const keyword = x[0]?.keyword || null;
				return keyword;
			};

			const notes = [
				() => {
					const item = genItem(undefined, getKeyword);
					return serifs.noting.want(item);
				},
				() => {
					const item = genItem(undefined, getKeyword);
					return serifs.noting.see(item);
				},
				() => {
					const item = genItem(undefined, getKeyword);
					return serifs.noting.expire(item);
				},
				() => {
					const item = genItem(undefined, getKeyword);
					return serifs.noting.f1(item);
				},
				() => {
					const item = genItem(undefined, getKeyword);
					return serifs.noting.f2(item);
				},
				() => {
					const item = genItem(undefined, getKeyword);
					return serifs.noting.f3(item);
				},
			];

			const note = notes[Math.floor(Math.random() * notes.length)];
			this.ai.post({ text: note() });
		} else {
			const notes = serifs.noting.notes;
			const note = notes[Math.floor(Math.random() * notes.length)];
			this.ai.post({ text: note });
		}
	}
}
