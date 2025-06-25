'use client';

import { useEffect, useState, useRef } from 'react';
import { ChatMessage, ChatRequest, MonitorChunk, Status } from '@/utils/types';
import Message from './Message';

interface ChatResponseProps {
    id: string;
    onComplete?: (response: ChatMessage) => void;
    onError?: (error: string) => void;
}

interface StreamState {
    status: Status | 'error';
    request: ChatRequest | null;
    message: ChatMessage | null;
    error: string | null;
}

export default function ChatResponse({ id, onComplete, onError }: ChatResponseProps) {
    const [state, setState] = useState<StreamState>({
        status: 'responding',
        request: null,
        message: null,
        error: null
    });
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const stateRef = useRef(state);
    stateRef.current = state;

    useEffect(() => {
        const fetchStream = async () => {
            try {
                abortControllerRef.current = new AbortController();
                
                const response = await fetch(`/api/monitor/chat?id=${id}`, {
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                if (!response.body) {
                    throw new Error('No response body');
                }

                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data: MonitorChunk = JSON.parse(line);
                            const message = data.message;
                            setState(prev => {
                                const prevMessage = prev.message;
                                const content = (prevMessage?.content ?? '') + message.content;
                                const thinking = (prevMessage?.thinking ?? '') + (message.thinking ?? '');
                                const toolCalls = (prevMessage?.tool_calls ?? []).concat(message.tool_calls ?? []);
                                return {
                                    ...prev,
                                    status: data.status,
                                    request: data.request ?? prev.request,
                                    message: {
                                        role: message.role,
                                        content,
                                        thinking,
                                        tool_calls: toolCalls,
                                    },
                                }
                            });

                            if (data.done) {
                                setState(prev => ({ ...prev, status: 'done' }));
                                if (onComplete && stateRef.current.message) {
                                    onComplete(stateRef.current.message);
                                }
                                return;
                            }
                        } catch (error) {
                            console.error('Error parsing chunk:', error);
                        }
                    }
                }
            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    return; // Aborted, don't show error
                }
                
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                setState(prev => ({ 
                    ...prev, 
                    status: 'done', 
                    error: errorMessage 
                }));
                
                if (onError) {
                    onError(errorMessage);
                }
            }
        };

        fetchStream();

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [id, onComplete, onError]);

    if (state.status === 'error') {
        return (
            <div className="p-4 text-red-500 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center space-x-2">
                    <span>Error: {state.error}</span>
                </div>
            </div>
        );
    };

    return (
        <div>
            {state.request?.messages.map((message, index) => (
                <Message key={index} message={message} status="done" />
            ))}
            <Message message={state.message ?? {
                role: 'assistant',
                content: '',
            }} status={state.status} />
        </div>
    );
} 