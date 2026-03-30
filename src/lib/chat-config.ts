export interface ChatConfig {
	studyModeEnabled: boolean;
	enhancedReasoning: boolean;
	webSearch: boolean;
}

export const defaultChatConfig: ChatConfig = {
	studyModeEnabled: false,
	enhancedReasoning: false,
	webSearch: false
};

export function normalizeChatConfig(config: Partial<ChatConfig> | null | undefined): ChatConfig {
	return {
		studyModeEnabled: Boolean(config?.studyModeEnabled),
		enhancedReasoning: Boolean(config?.enhancedReasoning),
		webSearch: Boolean(config?.webSearch)
	};
}
