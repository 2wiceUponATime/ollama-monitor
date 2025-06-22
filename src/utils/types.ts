export type ChatChunk = {
    model: string;
    created_at: string;
    message: ChatMessage;
} & {
    done: false;
} | {
    done_reason: string;
    done: true;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}

export type ToolCall = {
    id?: string;
    type?: 'tool_call';
    function: {
        name: string;
        arguments: Record<string, unknown>;
    };
}

export type ChatMessage = {
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    thinking?: string;
    tool_calls?: ToolCall[];
}