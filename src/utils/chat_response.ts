import { ChatChunk, ChatMessage, ToolCall } from "./types";
import { global } from "./global";

export class ChatResponse {
    private controllers: ReadableStreamDefaultController<string>[] = [];
    private last_chunk: ChatChunk | null = null;

    request: Record<string, unknown>;
    id: string;
    model: string;
    status: 'thinking' | 'responding' | 'done';
    thinking: string;
    xmlThought: boolean = false;
    response: string;
    toolCalls: ToolCall[] = [];
    input: ReadableStream<Uint8Array>;
    done: Promise<void>;
    
    constructor(request: Record<string, unknown>, input: ReadableStream<Uint8Array>) {
        this.request = request;
        this.id = crypto.randomUUID();
        this.model = '';
        this.status = 'thinking';
        this.thinking = '';
        this.response = '';
        this.input = input;
        global.responses[this.id] = this;
        global.recent_responses.unshift(this);
        this.done = this.read();
    }

    private async read() {
        const reader = this.input.getReader();
        const decoder = new TextDecoder();
        let input = "";
        const process = (chunk: string) => {
            let json: ChatChunk;
            try {
                json = JSON.parse(chunk);
            } catch {
                throw new Error("Error parsing chunk: " + chunk);
            }
            const message = 'message' in json ? json.message : null;
            if (!this.last_chunk) {
                if (message && message.content == '<think>') {
                    this.xmlThought = true;
                    this.status = 'thinking';
                    message.content = '';
                }
            }
            if (message) {
                if (message.tool_calls) {
                    this.toolCalls.push(...message.tool_calls);
                }
                if (message.content == '</think>' && this.xmlThought) {
                    this.xmlThought = false;
                    this.status = 'responding';
                    message.content = '';
                }
                if (this.xmlThought) {
                    message.thinking = message.content;
                    message.content = '';
                }
            }
            const newChunk = JSON.stringify(json) + '\n';
            for (const controller of this.controllers) {
                try {
                    controller.enqueue(newChunk);
                } catch (error) {
                    if (String(error).includes("Controller is already closed")) {
                        this.controllers.splice(this.controllers.indexOf(controller), 1);
                    } else {
                        console.error("Error enqueuing chunk: ", newChunk);
                        controller.error(error);
                    }
                }
            }
            this.last_chunk = json;
            if (json.done) {
                this.status = 'done';
            } else if (message) {
                this.response += message.content;
                if ('thinking' in message) {
                    this.thinking += message.thinking;
                }
            }
        }
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (value === undefined) {
                    break;
                }
                input += decoder.decode(value, { stream: true });
                for (const chunk of input.split('\n').slice(0, -1)) {
                    input = input.slice(chunk.length + 1);
                    process(chunk);
                }
                if (done) {
                    break;
                }
            }
            this.status = 'done';
            for (const controller of this.controllers) {
                controller.close();
            }
        } catch (error) {
            console.error(error);
            for (const controller of this.controllers) {
                controller.error(error);
            }
        }
    }

    private headers(stream: boolean = true) {
        console.log("Headers: ", stream);
        return {
            'Content-Type': stream ? 'application/x-ndjson' : 'application/json',
            Date: new Date().toUTCString(),
            'Transfer-Encoding': 'chunked',
        };
    }


    private message() {
        const message: ChatMessage = {
            role: 'assistant',
            content: this.response,
        }
        if (this.thinking) {
            message.thinking = this.thinking;
        }
        if (this.toolCalls) {
            message.tool_calls = this.toolCalls;
        }
        return message;
    }

    async respond(stream: boolean = true): Promise<Response> {
        if (!stream) {
            await this.done;
        }
        if (this.status === 'done') {
            return Response.json({
                request: this.request,
                ...this.last_chunk,
                message: this.message(),
            }, {
                headers: this.headers(false),
            });
        }
        return new Response(this.stream(), {
            headers: this.headers(),
        });
    }

    stream() {
        return new ReadableStream({
            start: (controller) => {
                controller.enqueue(JSON.stringify({ request: this.request }) + '\n');
                if (this.last_chunk) {
                    controller.enqueue(JSON.stringify({
                        ...this.last_chunk,
                        message: this.message(),
                    }) + '\n');
                    if (this.last_chunk.done) {
                        controller.close();
                        return;
                    }
                }
                this.controllers.push(controller);
            }
        });
    }
}