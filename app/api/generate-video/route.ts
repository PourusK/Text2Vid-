const API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes of polling time

class GeminiApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GeminiApiError";
    this.status = status;
  }
}

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

    const modelId = await resolveModelId(apiKey);

    const requestBody = {
      instances: [
        {
          prompt: {
            text: prompt,
          },
        },
      ],
      parameters: {
        sampleCount: 1,
      },
    } satisfies Record<string, unknown>;

    const startResponse = await fetch(
      `${API_BASE_URL}/models/${modelId}:predictLongRunning?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!startResponse.ok) {
      const errorBody = await safeJson(startResponse);
      const baseMessage =
        errorBody?.error?.message ||
        `Gemini returned HTTP ${startResponse.status} when starting video generation.`;

      const message =
        errorBody?.error?.status === "NOT_FOUND"
          ? `${baseMessage} The configured model "${modelId}" is unavailable for predictLongRunning. Set GEMINI_VIDEO_MODEL to a supported Gemini video model available to your API key (use the ListModels API to confirm access).`
          : baseMessage;

      throw new GeminiApiError(message, startResponse.status);
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
    const status = error instanceof GeminiApiError ? error.status : 500;
    return Response.json({ error: message }, { status });
  }
}

async function resolveModelId(apiKey: string): Promise<string> {
  const configuredModel = normalizeModelId(
    process.env.GEMINI_VIDEO_MODEL ?? process.env.GOOGLE_VIDEO_MODEL ?? ""
  );

  if (configuredModel) {
    return configuredModel;
  }

  try {
    const listedModel = await discoverVideoModel(apiKey);
    if (listedModel) {
      return listedModel;
    }
  } catch (error) {
    console.warn("[generate-video] Unable to auto-detect Gemini video model", error);
  }

  throw new GeminiApiError(
    "No Gemini video models supporting predictLongRunning are available for this API key. Set GEMINI_VIDEO_MODEL to a supported model.",
    500
  );
}

function normalizeModelId(model: string): string {
  const trimmed = model.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.startsWith("models/") ? trimmed.slice("models/".length) : trimmed;
}

async function discoverVideoModel(apiKey: string): Promise<string | null> {
  let pageToken: string | undefined;

  do {
    const params = new URLSearchParams({
      key: apiKey,
      view: "FULL",
      pageSize: "100",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const listResponse = await fetch(`${API_BASE_URL}/models?${params.toString()}`);

    if (!listResponse.ok) {
      return null;
    }

    const payload: {
      models?: Array<{
        name?: string;
        supportedGenerationMethods?: string[];
      }>;
      nextPageToken?: string;
    } = await listResponse.json();

    const candidates = payload.models ?? [];

    const match = candidates.find((model) => {
      const methods = model.supportedGenerationMethods ?? [];
      return methods.includes("predictLongRunning") || methods.includes("generateVideo");
    });

    if (match?.name) {
      return normalizeModelId(match.name);
    }

    pageToken = payload.nextPageToken;
  } while (pageToken);

  return null;
}

async function pollForVideo(operationName: string, apiKey: string, attempts = 0): Promise<string> {
  if (attempts >= MAX_POLLS) {
    throw new GeminiApiError("Video generation timed out before completion.", 504);
  }

  const normalizedName = operationName.replace(/^\//, "");

  const operationResponse = await fetch(
    `${API_BASE_URL}/${normalizedName}?key=${apiKey}`
  );

  if (!operationResponse.ok) {
    const errorBody = await safeJson(operationResponse);
    throw new GeminiApiError(
      errorBody?.error?.message ||
        `Gemini returned HTTP ${operationResponse.status} while polling video generation.`,
      operationResponse.status
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
    throw new GeminiApiError(
      payload.error.message || "Gemini returned an error while generating the video.",
      500
    );
  }

  if (!payload.done) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    return pollForVideo(operationName, apiKey, attempts + 1);
  }

  const videoUrl = extractVideoUrl(payload.response) || null;

  if (!videoUrl) {
    throw new GeminiApiError(
      "Gemini completed the request but did not return a video URL.",
      502
    );
  }

  return videoUrl;
}

function extractVideoUrl(response: unknown): string | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const candidateSources: Array<unknown> = [];

  // Handle the documented generateVideoResponse shape first.
  const generateVideoResponse = (response as {
    generateVideoResponse?: { generatedSamples?: Array<{ video?: { uri?: string } }> };
  }).generateVideoResponse;

  if (generateVideoResponse?.generatedSamples) {
    candidateSources.push(...generateVideoResponse.generatedSamples);
  }

  // Some responses may embed predictions arrays similar to other predict endpoints.
  const predictions = (response as { predictions?: unknown[] }).predictions;
  if (Array.isArray(predictions)) {
    candidateSources.push(...predictions);
  }

  // Flat video/url fields on the response itself.
  candidateSources.push(response);

  for (const candidate of candidateSources) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }

    const maybeUrl = readVideoUrl(candidate);
    if (maybeUrl) {
      return maybeUrl;
    }
  }

  return null;
}

function readVideoUrl(source: unknown): string | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const candidate = source as Record<string, unknown>;

  const directUri = candidate["uri"];
  if (typeof directUri === "string" && directUri.startsWith("http")) {
    return directUri;
  }

  const video = candidate["video"] as Record<string, unknown> | undefined;
  if (video) {
    const uri = video["uri"];
    if (typeof uri === "string" && uri.startsWith("http")) {
      return uri;
    }
    const downloadUri = video["downloadUri"];
    if (typeof downloadUri === "string" && downloadUri.startsWith("http")) {
      return downloadUri;
    }
  }

  const media = candidate["media"] as Record<string, unknown> | undefined;
  if (media) {
    const url = media["url"];
    if (typeof url === "string" && url.startsWith("http")) {
      return url;
    }
    const downloadUri = media["downloadUri"];
    if (typeof downloadUri === "string" && downloadUri.startsWith("http")) {
      return downloadUri;
    }
  }

  const output = candidate["output"];
  if (Array.isArray(output)) {
    for (const entry of output) {
      const nested = readVideoUrl(entry);
      if (nested) {
        return nested;
      }
    }
  }

  const generatedSamples = candidate["generatedSamples"];
  if (Array.isArray(generatedSamples)) {
    for (const sample of generatedSamples) {
      const nested = readVideoUrl(sample);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
