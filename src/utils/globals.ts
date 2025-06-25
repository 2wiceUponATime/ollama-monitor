import 'server-only';
import { ChatResponse } from './chat_response';

declare global {
    var globalInstance: Global | undefined;
}

class Global {
    responses: Record<string, ChatResponse> = {};
    recent_responses: ChatResponse[] = [];
    private readonly MAX_RESPONSES = 100; // Configurable limit
    
    addResponse(response: ChatResponse) {
        this.responses[response.id] = response;
        this.recent_responses.unshift(response);
        
        // Cleanup old responses to prevent memory leaks
        if (this.recent_responses.length > this.MAX_RESPONSES) {
            const removed = this.recent_responses.splice(this.MAX_RESPONSES);
            removed.forEach(r => delete this.responses[r.id]);
        }
    }
    
    getResponse(id: string): ChatResponse | undefined {
        return this.responses[id];
    }
    
    cleanup() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        this.recent_responses = this.recent_responses.filter(r => {
            const shouldKeep = r.status !== 'done' || Date.now() - cutoff < 0;
            if (!shouldKeep) {
                delete this.responses[r.id];
            }
            return shouldKeep;
        });
    }
}

if (!globalThis.globalInstance) {
    globalThis.globalInstance = new Global();
    
    // Cleanup every hour
    setInterval(() => {
        globalThis.globalInstance?.cleanup();
    }, 60 * 60 * 1000);
}

export const globals = globalThis.globalInstance;