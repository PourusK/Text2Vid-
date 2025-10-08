const MODEL_NAME = "veo-3-fast";
const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes of polling time

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

    const startResponse = await fetch(
      `${API_BASE_URL}/models/${MODEL_NAME}:predictLongRunning?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instances: [
            {
              prompt,
            },
          ],
          parameters: {
            sampleCount: 1,
          },
        }),
      }
    );

    if (!startResponse.ok) {
      const errorBody = await safeJson(startResponse);
      throw new Error(
        errorBody?.error?.message ||
          `Gemini returned HTTP ${startResponse.status} when starting video generation.`
      );
    }

    const operation: { name?: string } = await startResponse.json();

    if (!operation?.name) {
      throw new Error("Gemini did not return an operation name for the request.");
    }

    const videoUrl = await pollForVideo(operation.name, apiKey);

    return Response.json({ type: "video", url: videoUrl });
  } catch (error) {
    console.error("[generate-video] error:", error);
    const message = error instanceof Error ? error.message : "Video generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}

async function pollForVideo(operationName: string, apiKey: string, attempts = 0): Promise<string> {
  if (attempts >= MAX_POLLS) {
    throw new Error("Video generation timed out before completion.");
  }

  const normalizedName = operationName.replace(/^\//, "");

  const operationResponse = await fetch(
    `${API_BASE_URL}/${normalizedName}?key=${apiKey}`
  );

  if (!operationResponse.ok) {
    const errorBody = await safeJson(operationResponse);
    throw new Error(
      errorBody?.error?.message ||
        `Gemini returned HTTP ${operationResponse.status} while polling video generation.`
    );
  }

  const payload: {
    done?: boolean;
    error?: { message?: string };
    response?: {
      generateVideoResponse?: {
        generatedSamples?: Array<{ video?: { uri?: string } }>;
      };
    };
  } = await operationResponse.json();

  if (payload.error) {
    throw new Error(payload.error.message || "Gemini returned an error while generating the video.");
  }

  if (!payload.done) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    return pollForVideo(operationName, apiKey, attempts + 1);
  }

  const videoUrl =
    payload.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri || null;

  if (!videoUrl) {
    throw new Error("Gemini completed the request but did not return a video URL.");
  }

  return videoUrl;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
