let runtimeAiThreshold: number | undefined;
let runtimeDuplicateDistance: number | undefined;

function threshold(name: string, fallback: number, maximum: number, integer = false) {
  const raw = Bun.env[name]?.trim();
  if (!raw) return fallback;

  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || value > maximum ||
      (integer && !Number.isInteger(value))) {
    throw new RangeError(`Invalid ${name}`);
  }
  return value;
}

export function aiProbabilityThreshold() {
  if (runtimeAiThreshold !== undefined) return runtimeAiThreshold;
  return threshold("AI_GENERATED_FLAG_THRESHOLD", 0.75, 1);
}

export function duplicateDistanceThreshold() {
  if (runtimeDuplicateDistance !== undefined) return runtimeDuplicateDistance;
  return threshold("AI_DUPLICATE_MAX_PHASH_DISTANCE", 5, 64, true);
}

export function getAiThresholds() {
  return {
    aiGeneratedFlagThreshold: aiProbabilityThreshold(),
    duplicateMaxPhashDistance: duplicateDistanceThreshold(),
  };
}

export function updateAiThresholds(input: {
  aiGeneratedFlagThreshold?: number;
  duplicateMaxPhashDistance?: number;
}) {
  if (input.aiGeneratedFlagThreshold !== undefined) {
    if (
      typeof input.aiGeneratedFlagThreshold !== "number" ||
      !Number.isFinite(input.aiGeneratedFlagThreshold) ||
      input.aiGeneratedFlagThreshold < 0 ||
      input.aiGeneratedFlagThreshold > 1
    ) {
      throw new RangeError("aiGeneratedFlagThreshold must be between 0 and 1");
    }
    runtimeAiThreshold = input.aiGeneratedFlagThreshold;
  }

  if (input.duplicateMaxPhashDistance !== undefined) {
    if (
      typeof input.duplicateMaxPhashDistance !== "number" ||
      !Number.isInteger(input.duplicateMaxPhashDistance) ||
      input.duplicateMaxPhashDistance < 0 ||
      input.duplicateMaxPhashDistance > 64
    ) {
      throw new RangeError("duplicateMaxPhashDistance must be an integer between 0 and 64");
    }
    runtimeDuplicateDistance = input.duplicateMaxPhashDistance;
  }

  return getAiThresholds();
}
