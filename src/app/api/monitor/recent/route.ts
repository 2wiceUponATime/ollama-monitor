import { globals } from "@/utils/globals";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const recentIds = globals.recent_responses.map(r => r.id);
        return NextResponse.json(recentIds);
    } catch (error) {
        console.error('Error fetching recent responses:', error);
        return NextResponse.json(
            { error: 'Failed to fetch recent responses' },
            { status: 500 }
        );
    }
}