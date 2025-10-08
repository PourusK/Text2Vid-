import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    console.info("[generate-video] prompt:", prompt);

    const response = await openai.videos.create({
      model: "sora-2-preview",
      prompt,
      duration: 30,
      resolution: "720p",
    });

    const videoUrl = response?.data?.[0]?.url ?? response?.url;

    if (!videoUrl) {
      console.error("[generate-video] Missing URL in response", response);
      return NextResponse.json(
        { error: "Failed to retrieve a video URL from OpenAI." },
        { status: 502 }
      );
    }

    console.info("[generate-video] success url:", videoUrl);

    return NextResponse.json({ url: videoUrl });
  } catch (error) {
    console.error("[generate-video] error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the video." },
      { status: 500 }
    );
  }
}
