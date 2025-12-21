import { PersistedState } from 'runed';
import type { File } from './server/db/schema';

class Attachments {
	private attachments: File[] = $state([]);

	add(file: File) {
		// Avoid identity comparisons on $state proxies; ensure uniqueness by id
		if (!this.attachments.some((a) => a.id === file.id)) {
			this.attachments.push(file);
		}
	}

	get files() {
		return this.attachments;
	}

	isInChat(file: File) {
		return this.attachments.some((a) => a.id === file.id);
	}

	remove(id: string) {
		this.attachments = this.attachments.filter((a) => a.id != id);
	}

	clear() {
		this.attachments = [];
	}
}

export const attachments = new Attachments();

export const chatConfig = new PersistedState('chat-config', {
	studyModeEnabled: false,
	enhancedReasoning: false,
	webSearch: false
});
