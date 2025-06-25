import { globals } from "@/utils/globals";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        
        if (!id) {
            return NextResponse.json(
                { error: 'No id provided' },
                { status: 400 }
            );
        }
        
        const response = globals.getResponse(id);
        if (!response) {
            return NextResponse.json(
                { error: 'Response not found' },
                { status: 404 }
            );
        }
        
        return response.respond(true, true);
    } catch (error) {
        console.error('Error streaming chat response:', error);
        return NextResponse.json(
            { error: 'Failed to stream chat response' },
            { status: 500 }
        );
    }
}