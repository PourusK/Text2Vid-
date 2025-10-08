export type OpenAIErrorPayload = {
  status?: number;
  message?: string;
  error?: {
    message?: string;
    type?: string;
  };
};

export function extractOpenAIError(error: unknown): {
  status?: number;
  message: string;
} {
  if (typeof error === "object" && error !== null) {
    const payload = error as OpenAIErrorPayload;
    const status = typeof payload.status === "number" ? payload.status : undefined;
    const detailedMessage =
      payload.error?.message ??
      (typeof payload.message === "string" ? payload.message : undefined);

    if (status === 401) {
      return {
        status,
        message:
          "OpenAI rejected the request with status 401. Confirm that OPENAI_API_KEY is correct and has access to the required models.",
      };
    }

    if (detailedMessage) {
      return {
        status,
        message: detailedMessage,
      };
    }
  }

  return {
    status: undefined,
    message: "An unexpected error occurred while communicating with OpenAI.",
  };
}
