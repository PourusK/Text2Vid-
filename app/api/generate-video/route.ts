import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
      const result = await openai.videos.create({
        model: "sora-2-preview",
        prompt,
        duration: 5,
        resolution: "720p",
      });

      console.log("[generate-video] SORA success:", result);
      return Response.json({ type: "video", url: result.data[0].url });
    } catch (err: any) {
      // --- Fallback if SORA isn't available ---
      console.warn("[generate-video] SORA failed, using image fallback:", err.message);

      const fallback = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `${prompt}. cinematic still frame.`,
        size: "1024x1024",
      });

      return Response.json({
        type: "image",
        url: fallback.data[0].url,
        note: "SORA not available; generated fallback image instead.",
      });
    }
  } catch (error: any) {
    console.error("[generate-video] error:", error);
    return Response.json(
      { error: error.message, details: error.response?.data || null },
      { status: 500 }
    );
  }
}
