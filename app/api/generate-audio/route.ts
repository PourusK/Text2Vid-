import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    console.info("[generate-audio] text:", text);

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
      format: "mp3",
    });

    const audioUrl = response?.url ?? response?.data?.[0]?.url;

    if (!audioUrl) {
      console.error("[generate-audio] Missing URL in response", response);
      return NextResponse.json(
        { error: "Failed to retrieve an audio URL from OpenAI." },
        { status: 502 }
      );
    }

    console.info("[generate-audio] success url:", audioUrl);

    return NextResponse.json({ url: audioUrl });
  } catch (error) {
    console.error("[generate-audio] error:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the audio." },
      { status: 500 }
    );
  }
}
