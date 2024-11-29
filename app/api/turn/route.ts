import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = await fetch(`https://${process.env.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY}`);
        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch TURN credentials" }, { status: 500 });
    }
}
