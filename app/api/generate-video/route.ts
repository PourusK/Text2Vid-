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

    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      console.error(
        "[generate-video] Missing GEMINI_API_KEY/GOOGLE_API_KEY environment variable"
      );
      return Response.json(
        {
          error:
            "GEMINI_API_KEY (or GOOGLE_API_KEY) environment variable is not configured.",
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { apiVersion: "v1beta" });

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
