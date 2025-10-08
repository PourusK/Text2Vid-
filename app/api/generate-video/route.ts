import {
  GoogleGenerativeAI,
  type GenerateContentResult,
  BlockReason,
} from "@google/generative-ai";

const MODEL_NAME = "models/veo-3-fast";

type CandidatePart = {
  fileData?: { fileUri?: string | null; mimeType?: string | null } | null;
  inlineData?: { data?: string | null; mimeType?: string | null } | null;
};

function extractVideoUrl(result: GenerateContentResult): string | null {
  const candidates = result.response.candidates ?? [];

  for (const candidate of candidates) {
    const parts = (candidate.content?.parts ?? []) as CandidatePart[];

    for (const part of parts) {
      const fileUri = part.fileData?.fileUri;
      const fileMime = part.fileData?.mimeType ?? "";

      if (fileUri && fileMime.startsWith("video/")) {
        return fileUri;
      }

      const inlineMime = part.inlineData?.mimeType ?? "";
      const inlineData = part.inlineData?.data;

      if (inlineData && inlineMime.startsWith("video/")) {
        return `data:${inlineMime};base64,${inlineData}`;
      }
    }
  }

  return null;
}

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
    const model = genAI.getGenerativeModel({ model: MODEL_NAME }, { apiVersion: "v1beta" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt.trim() }],
        },
      ],
    });

    const blockReason = result.response.promptFeedback?.blockReason;
    if (blockReason && blockReason !== BlockReason.BLOCKED_REASON_UNSPECIFIED) {
      const reasonMessage =
        result.response.promptFeedback?.blockReasonMessage ||
        `Prompt was blocked by Gemini (${blockReason}).`;
      return Response.json({ error: reasonMessage }, { status: 400 });
    }

    const videoUrl = extractVideoUrl(result);

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
