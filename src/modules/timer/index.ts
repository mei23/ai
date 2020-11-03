import autobind from 'autobind-decorator';
import Module from '@/module';
import Message from '@/message';
import serifs from '@/serifs';

export default class extends Module {
	public readonly name = 'timer';

	@autobind
	public install() {
		return {
			mentionHook: this.mentionHook,
			timeoutCallback: this.timeoutCallback,
		};
	}

	@autobind
	private async mentionHook(msg: Message) {
		const secondsQuery = (msg.text || '').match(/([0-9]+)秒/);
		const minutesQuery = (msg.text || '').match(/([0-9]+)分/);
		const hoursQuery = (msg.text || '').match(/([0-9]+)時間/);

		const seconds = secondsQuery ? parseInt(secondsQuery[1], 10) : 0;
		const minutes = minutesQuery ? parseInt(minutesQuery[1], 10) : 0;
		const hours = hoursQuery ? parseInt(hoursQuery[1], 10) : 0;

		if (!(secondsQuery || minutesQuery || hoursQuery)) return false;

		if ((seconds + minutes + hours) == 0) {
			msg.reply(serifs.timer.invalid);
			return true;
		}

		const time =
			(1000 * seconds) +
			(1000 * 60 * minutes) +
			(1000 * 60 * 60 * hours);

		if (time > 86400000) {
			msg.reply(serifs.timer.tooLong);
			return true;
		}

		const pre = time == 300 * 1000 && /カレーメシ/.test(msg.text) ? 'カレーメシ私にも食べさせてください' : '';

		msg.reply(pre + serifs.timer.set);

		const str = `${hours ? hoursQuery![0] : ''}${minutes ? minutesQuery![0] : ''}${seconds ? secondsQuery![0] : ''}`;

		// タイマーセット
		this.setTimeoutWithPersistence(time + 2000, {
			isDm: msg.isDm,
			msgId: msg.id,
			userId: msg.friend.userId,
			time: str,
			request: msg.text,
		});

		return true;
	}

	@autobind
	private timeoutCallback(data) {
		const friend = this.ai.lookupFriend(data.userId);
		if (friend == null) return; // 処理の流れ上、実際にnullになることは無さそうだけど一応

		let text = serifs.timer.notify(data.time, friend.name);

		if (typeof data.request === 'string') {
			if (data.request.match(/赤いきつね/)) text += '\n七味入れるの忘れないでくださいね';
			if (data.request.match(/蒙古タンメン/)) text += '\n辛味オイル全部入れるとお腹壊しちゃいますよ';
			if (data.request.match(/カレーメシ/)) text += '\n数分待つかいっぱいかき混ぜるとおいしいですよ';
		}

		if (data.isDm) {
			this.ai.sendMessage(friend.userId, {
				text: text
			});
		} else {
			this.ai.post({
				replyId: data.msgId,
				text: text
			});
		}
	}
}
