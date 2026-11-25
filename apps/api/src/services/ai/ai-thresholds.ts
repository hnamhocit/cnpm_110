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
  return threshold("AI_GENERATED_FLAG_THRESHOLD", 0.75, 1);
}

export function duplicateDistanceThreshold() {
  return threshold("AI_DUPLICATE_MAX_PHASH_DISTANCE", 5, 64, true);
}
