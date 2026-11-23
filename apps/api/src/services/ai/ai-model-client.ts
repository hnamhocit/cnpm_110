
export interface AiModelResult {
  aiGeneratedProbability: number;
}

export async function detectAiGeneratedImage(
  imageUrl: string,
): Promise<AiModelResult> {
  const apiUrl = process.env.AI_MODEL_URL;
  const apiKey = process.env.AI_MODEL_API_KEY;

  if (!apiUrl) {
    throw new Error("AI_MODEL_URL is not configured");
  }

  if (!imageUrl || !imageUrl.trim()) {
    throw new Error("Image URL is required");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120_000);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey
          ? { Authorization: `Bearer ${apiKey}` }
          : {}),
      },
      body: JSON.stringify({
        imageUrl,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `AI Model API returned status ${response.status}`,
      );
    }

    const data: unknown = await response.json();

    if (
      !data ||
      typeof data !== "object" ||
      !("aiGeneratedProbability" in data) ||
      typeof data.aiGeneratedProbability !== "number" ||
      !Number.isFinite(data.aiGeneratedProbability) ||
      data.aiGeneratedProbability < 0 ||
      data.aiGeneratedProbability > 1
    ) {
      throw new Error("Invalid AI Model response");
    }

    return {
      aiGeneratedProbability: data.aiGeneratedProbability,
    };
  } finally {
    clearTimeout(timeout);
  }
}
