import 'server-only';
import { ChatResponse } from './chat_response';

declare global {
    var globalInstance: Global | undefined;
}

class Global {
    responses: Record<string, ChatResponse> = {};
    recent_responses: ChatResponse[] = [];
}

if (!globalThis.globalInstance) {
    globalThis.globalInstance = new Global();
}
export const global = globalThis.globalInstance;