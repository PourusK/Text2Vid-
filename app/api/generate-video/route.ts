import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  type GenerateContentResult,
  type Part,
} from "@google/generative-ai";

const MODEL_NAME = "veo-3-fast";
const VIDEO_MIME_TYPE = "video/mp4";

const isFileDataPart = (part: Part): part is Extract<Part, { fileData: unknown }> =>
  "fileData" in part && part.fileData !== undefined && part.fileData !== null;

const isInlineDataPart = (
  part: Part
): part is Extract<Part, { inlineData: { data: string; mimeType?: string } }> =>
  "inlineData" in part && part.inlineData !== undefined && part.inlineData !== null;

const extractVideoUrl = (result: GenerateContentResult): string | null => {
  const candidates = result.response.candidates ?? [];

  for (const candidate of candidates) {
    const parts = candidate.content?.parts ?? [];

    for (const part of parts) {
      if (isFileDataPart(part) && typeof part.fileData.fileUri === "string") {
        return part.fileData.fileUri;
      }

      if (isInlineDataPart(part) && typeof part.inlineData.data === "string") {
        const mimeType = part.inlineData.mimeType || VIDEO_MIME_TYPE;
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  return null;
};

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
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const videoUrl = extractVideoUrl(result);

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

    if (err instanceof GoogleGenerativeAIFetchError) {
      const detailMessage =
        err.errorDetails?.map((detail) => detail.message).join("\n") ||
        err.statusText ||
        err.message;

      return Response.json(
        { error: detailMessage },
        { status: err.status ?? 502 }
      );
    }

    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
