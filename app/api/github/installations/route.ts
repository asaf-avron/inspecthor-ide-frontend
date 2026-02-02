import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!accessToken) {
        return NextResponse.json(
            { error: "Not authenticated" },
            { status: 401 }
        );
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/github/installations`, {
            headers: {
                Cookie: `access_token=${accessToken}; refresh_token=${refreshToken}`,
            },
        });

        const data = await response.json();
        return NextResponse.json(data, { status: response.status });
    } catch (error) {
        console.error("Failed to fetch installations:", error);
        return NextResponse.json(
            { error: "Failed to fetch installations" },
            { status: 500 }
        );
    }
}
