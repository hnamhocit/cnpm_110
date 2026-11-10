
import { getR2SignedReadUrl } from "../r2";
import {
  detectAiGeneratedImage,
  type AiModelResult,
} from "./ai-model-client";

export async function analyzeSubmissionImage(
  imageOriginalPath: string,
): Promise<AiModelResult> {
  // Generate a temporary read URL for the R2 image.
  const imageUrl = await getR2SignedReadUrl(
    imageOriginalPath,
    300,
  );

  // Send the image URL to the configured AI Model API.
  return await detectAiGeneratedImage(imageUrl);
}
