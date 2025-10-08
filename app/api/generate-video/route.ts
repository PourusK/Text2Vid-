import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL_NAME = "veo-3-fast";

type GeminiVideoResponse = {
  video?: { uri?: string | null } | null;
  output?: Array<
    | { url?: string | null }
    | { media?: { url?: string | null } | null }
    | Record<string, unknown>
  >;
};

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result: GeminiVideoResponse = await (model as unknown as {
      generateVideo: (args: { prompt: string }) => Promise<GeminiVideoResponse>;
    }).generateVideo({ prompt });

    const firstOutput = result.output?.[0] as
      | { url?: string | null; media?: { url?: string | null } | null }
      | undefined;

    const videoUrl =
      result.video?.uri || firstOutput?.url || firstOutput?.media?.url || null;

    if (!videoUrl) {
      throw new Error("No video URL returned from Gemini.");
    }

    return Response.json({ type: "video", url: videoUrl });
  } catch (error) {
    console.error("[generate-video] error:", error);
    const message = error instanceof Error ? error.message : "Video generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
