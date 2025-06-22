import { NextRequest } from "next/server";
import { ChatResponse } from "@/utils/chat_response";

export async function POST(request: NextRequest) {
    const body = await request.json();
    const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...body,
            stream: true,
        }),
    });
    
    if (!response.body) {
        return new Response('No response body', { status: 500 });
    }

    const chatResponse = new ChatResponse(body, response.body);
    return chatResponse.respond(!!(body.stream ?? true));
}