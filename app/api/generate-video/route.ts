import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type SoraVideoResponse = {
  data?: Array<{ url?: string | null } | null> | null;
  url?: string | null;
};

type SoraVideoClient = {
  videos: {
    create: (params: {
      model: string;
      prompt: string;
      duration: number;
      resolution: string;
    }) => Promise<SoraVideoResponse>;
  };
};

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    console.info("[generate-video] prompt:", prompt);

    const soraClient = openai as OpenAI & SoraVideoClient;

    const response = await soraClient.videos.create({
      model: "sora-2-preview",
      prompt,
      duration: 30,
      resolution: "720p",
    });

    const videoUrl =
      response?.data?.find((item) => item?.url)?.url ?? response?.url ?? undefined;

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
