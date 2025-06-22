import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

export function relay(
  request: NextRequest
): Promise<Response> | NextResponse {
    try {
        const url = new URL(request.url);
        const pathname = url.pathname + url.search;
        const ollamaUrl = `${OLLAMA_BASE_URL}${pathname}`;

        return fetch(ollamaUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            duplex: 'half',
        } as RequestInit);
    } catch (error) {
        console.error('Error relaying request to Ollama:', error);
        return NextResponse.json(
            { error: 'Failed to relay request to Ollama' },
            { status: 500 }
        );
    }
}