import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json(
        { error: "Prompt is required." },
        { status: 400 }
      );
    }

    console.log("[generate-video] prompt:", prompt);

    if (!process.env.GEMINI_API_KEY) {
      return Response.json(
        { error: "Missing GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "veo-3-fast" });

    const result = await model.generateVideo({ prompt });
    const videoUrl = result.video?.uri ?? result.output?.[0]?.url ?? null;

    if (!videoUrl) {
      console.error("[generate-video] Missing video URL in response", result);
      return Response.json(
        { error: "Video generation did not return a URL." },
        { status: 502 }
      );
    }

    return Response.json({ type: "video", url: videoUrl });
  } catch (err: unknown) {
    console.error("[generate-video] error:", err);

    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
