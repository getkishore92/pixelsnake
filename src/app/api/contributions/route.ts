import { NextResponse } from "next/server";
import { getGithubContributions } from "@/lib/github-contributions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(user)) {
    return NextResponse.json(
      { error: "Invalid or missing user parameter" },
      { status: 400 }
    );
  }

  const data = await getGithubContributions(user);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
