import { global } from "@/utils/global";

export async function GET() {
    const response = new Response(JSON.stringify(global.recent_responses.map(r => r.id)));
    response.headers.set('Content-Type', 'text/json');
    return response;
}