import OpenAI from "openai";

type SoraVideoResult = {
  data: Array<{ url: string }>;
};

type OpenAIWithSora = OpenAI & {
  videos: {
    create: (params: {
      model: string;
      prompt: string;
      duration: number;
      resolution: string;
    }) => Promise<SoraVideoResult>;
  };
};

type ImageResult = {
  data?: Array<{ url?: string | null }>;
};

let cachedClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!cachedClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OpenAI API key");
    }

    cachedClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return cachedClient;
}

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    console.log("[generate-video] prompt:", prompt);

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing OpenAI API key" },
        { status: 500 }
      );
    }

    try {
      // --- Try SORA video generation first ---
      const client = getOpenAIClient();
      const soraClient = (client as OpenAIWithSora).videos;

      const result = await soraClient.create({
        model: "sora-2-preview",
        prompt,
        duration: 5,
        resolution: "720p",
      });

      console.log("[generate-video] SORA success:", result);
      return Response.json({ type: "video", url: result.data[0].url });
    } catch (err: unknown) {
      // --- Fallback if SORA isn't available ---
      const message = err instanceof Error ? err.message : String(err);
      console.warn("[generate-video] SORA failed, using image fallback:", message);

      const client = getOpenAIClient();
      const fallback = (await client.images.generate({
        model: "gpt-image-1",
        prompt: `${prompt}. cinematic still frame.`,
        size: "1024x1024",
      })) as ImageResult;

      const fallbackUrl = fallback.data?.[0]?.url ?? null;
      if (!fallbackUrl) {
        console.error("[generate-video] image fallback missing URL", fallback);
        return Response.json(
          { error: "Image fallback did not return a URL" },
          { status: 502 }
        );
      }

      return Response.json({
        type: "image",
        url: fallbackUrl,
        note: "SORA not available; generated fallback image instead.",
      });
    }
  } catch (error: unknown) {
    console.error("[generate-video] error:", error);

    const message = error instanceof Error ? error.message : String(error);
    let details: unknown = null;
    if (typeof error === "object" && error !== null && "response" in error) {
      const response = (error as { response?: { data?: unknown } }).response;
      details = response?.data ?? null;
    }

    return Response.json({ error: message, details }, { status: 500 });
  }
}
