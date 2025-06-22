import { global } from "@/utils/global";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id === null) {
        return new Response('No id provided', { status: 400 });
    }
    const response = global.responses[id];
    if (response === undefined) {
        return new Response('No response found', { status: 404 });
    }
    return response.respond();
}