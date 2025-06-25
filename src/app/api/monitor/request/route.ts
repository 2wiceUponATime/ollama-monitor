import { NextRequest, NextResponse } from "next/server";
import { globals } from "@/utils/globals";

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
        
        return NextResponse.json({
            id: response.id,
            model: response.model,
            status: response.status,
            messages: response.request.messages,
            options: response.request.options,
            created_at: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching request details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch request details' },
            { status: 500 }
        );
    }
}