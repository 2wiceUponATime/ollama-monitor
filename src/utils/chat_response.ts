import { ChatChunk, ChatMessage, ChatRequest, MonitorChunk, Status, ToolCall } from "./types";
import { globals } from "./globals";

export class ChatResponse {
    private controllers: {
        monitor: boolean;
        initialized: boolean;
        controller: ReadableStreamDefaultController<string>;
    }[] = [];
    private lastChunk: ChatChunk | null = null;

    request: ChatRequest;
    id: string;
    model: string;
    status: Status;
    thinking: string;
    xmlThought: boolean = false;
    response: string;
    toolCalls: ToolCall[] = [];
    input: ReadableStream<Uint8Array>;
    done: Promise<void>;
    
    constructor(request: ChatRequest, input: ReadableStream<Uint8Array>) {
        this.request = request;
        this.id = crypto.randomUUID();
        this.model = '';
        this.status = 'thinking';
        this.thinking = '';
        this.response = '';
        this.input = input;
        globals.addResponse(this);
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
            const monitor: MonitorChunk = {
                ...json,
                status: this.status,
            }
            const message = json.message;
            if (!this.lastChunk) {
                console.log(this.request);
                if (message.content == '<think>') {
                    this.xmlThought = true;
                    this.status = 'thinking';
                    message.content = '';
                }
            }
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
            const newChunk = JSON.stringify({
                ...json,
            }) + '\n';
            const monitorChunk = JSON.stringify(monitor) + '\n';
            monitor.request = this.request;
            const monitorChunkWithRequest = JSON.stringify(monitor) + '\n';
            for (const controller of this.controllers) {
                try {
                    if (controller.monitor) {
                        if (!controller.initialized) {
                            controller.controller.enqueue(controller.initialized ? monitorChunk : monitorChunkWithRequest);
                        }
                        controller.controller.enqueue(monitorChunk);
                    } else {
                        controller.controller.enqueue(newChunk);
                    }
                    controller.initialized = true;
                } catch (error) {
                    if (String(error).includes("Controller is already closed")) {
                        this.controllers.splice(this.controllers.indexOf(controller), 1);
                    } else {
                        console.error("Error enqueuing chunk: ", newChunk);
                        controller.controller.error(error);
                    }
                }
            }
            this.lastChunk = json;
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
                controller.controller.close();
            }
        } catch (error) {
            console.error(error);
            for (const controller of this.controllers) {
                controller.controller.error(error);
            }
        }
    }

    private headers(stream: boolean = true) {
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

    async respond(stream: boolean = true, monitor: boolean = false): Promise<Response> {
        if (!stream) {
            await this.done;
        }
        if (this.status === 'done') {
            if (!this.lastChunk) {
                throw new Error("No last chunk");
            }
            const result: ChatChunk | MonitorChunk = monitor ? {
                ...this.lastChunk,
                message: this.message(),
                status: this.status,
                request: this.request,
            } : {
                ...this.lastChunk,
                message: this.message(),
            };
            return Response.json(result, {
                headers: this.headers(false),
            });
        }
        return new Response(this.stream(monitor), {
            headers: this.headers(),
        });
    }

    stream(monitor: boolean = false) {
        return new ReadableStream({
            start: (controller) => {
                //controller.enqueue(JSON.stringify({ request: this.request }) + '\n');
                if (this.lastChunk) {
                    controller.enqueue(JSON.stringify({
                        ...this.lastChunk,
                        message: this.message(),
                    }) + '\n');
                    if (this.lastChunk.done) {
                        controller.close();
                        return;
                    }
                }
                this.controllers.push({
                    monitor,
                    initialized: false,
                    controller,
                });
            }
        });
    }
}