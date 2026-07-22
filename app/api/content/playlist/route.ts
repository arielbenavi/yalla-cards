import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?playlist_id=${id}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json({ error: "youtube fetch failed" }, { status: 502 });

    const xml = await res.text();

    // Parse <entry> blocks
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    const videos = entries.map((m) => {
      const block = m[1];
      const videoId = block.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? "";
      const title = block.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
      return {
        name: title.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        url: `https://youtu.be/${videoId}`,
      };
    }).filter((v) => v.url !== "https://youtu.be/");

    return NextResponse.json({ videos });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
