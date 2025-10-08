import { config } from "dotenv";
import OpenAI from "openai";

config({ path: ".env.local" });

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.error("❌ OPENAI_API_KEY is missing. Add it to your .env.local file.");
  process.exit(1);
}

const client = new OpenAI({ apiKey });

async function main() {
  try {
    const response = await client.models.list({ limit: 1 });
    const firstModel = response.data?.[0]?.id;

    console.log("✅ Successfully contacted OpenAI.");
    if (firstModel) {
      console.log(`First available model: ${firstModel}`);
    }
  } catch (error) {
    const status = typeof error?.status === "number" ? error.status : undefined;
    const message =
      error?.error?.message ??
      error?.message ??
      "OpenAI returned an unknown error while verifying the API key.";

    if (status === 401) {
      console.error(
        "❌ OpenAI rejected the request with status 401. Double-check your OPENAI_API_KEY and account access."
      );
    } else {
      console.error("❌ Failed to verify the OpenAI API key.");
    }

    console.error(`Status: ${status ?? "unknown"}`);
    console.error(`Message: ${message}`);
    process.exit(1);
  }
}

main();
