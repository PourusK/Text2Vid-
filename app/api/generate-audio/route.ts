import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    console.info("[generate-audio] text:", text);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("[generate-audio] Missing OPENAI_API_KEY environment variable");
      return NextResponse.json(
        { error: "OPENAI_API_KEY environment variable is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text,
    });

    const arrayBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const audioUrl = `data:audio/mp3;base64,${base64Audio}`;

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
