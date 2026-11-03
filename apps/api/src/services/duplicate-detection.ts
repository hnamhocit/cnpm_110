
import sharp from "sharp";

const HASH_SIZE = 8;
const DCT_SIZE = 32;

// Tính pHash 64-bit từ dữ liệu ảnh
export async function calculatePHash(
  imageBuffer: Buffer | Uint8Array,
): Promise<string> {
  const { data } = await sharp(imageBuffer)
    .greyscale()
    .resize(DCT_SIZE, DCT_SIZE, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Array.from(data);
  const coefficients: number[] = [];

  // Lấy 8x8 hệ số tần số thấp của DCT 2D
  for (let u = 0; u < HASH_SIZE; u++) {
    for (let v = 0; v < HASH_SIZE; v++) {
      let sum = 0;

      for (let x = 0; x < DCT_SIZE; x++) {
        for (let y = 0; y < DCT_SIZE; y++) {
          sum +=
            pixels[y * DCT_SIZE + x] *
            Math.cos(((2 * x + 1) * u * Math.PI) / (2 * DCT_SIZE)) *
            Math.cos(((2 * y + 1) * v * Math.PI) / (2 * DCT_SIZE));
        }
      }

      coefficients.push(sum);
    }
  }

  // Tính median, bỏ hệ số DC đầu tiên
  const sorted = coefficients.slice(1).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted[middle];

  const bits = coefficients
    .map((value) => (value > median ? "1" : "0"))
    .join("");

  return BigInt("0b" + bits).toString(16).padStart(16, "0");
}

// Đếm số bit khác nhau giữa hai pHash
export function hammingDistance(
  hash1: string,
  hash2: string,
): number {
  const hexRegex = /^[0-9a-fA-F]{16}$/;

  if (!hexRegex.test(hash1) || !hexRegex.test(hash2)) {
    throw new Error("Invalid 64-bit pHash");
  }

  let xor = BigInt("0x" + hash1) ^ BigInt("0x" + hash2);
  let distance = 0;

  while (xor > 0n) {
    distance += Number(xor & 1n);
    xor >>= 1n;
  }

  return distance;
}

// Kiểm tra hai ảnh có nghi ngờ trùng nhau không
export function isDuplicate(
  hash1: string,
  hash2: string,
  threshold = 5,
): boolean {
  return hammingDistance(hash1, hash2) <= threshold;
}

export interface DuplicateCandidate {
  submissionId: string;
  phashHex: string;
}

export interface DuplicateMatch {
  submissionId: string;
  hammingDistance: number;
  similarityScore: number;
}

export function findClosestDuplicate(
  currentHash: string,
  candidates: DuplicateCandidate[],
  threshold = 5,
): DuplicateMatch | null {
  let closest: DuplicateMatch | null = null;

  for (const candidate of candidates) {
    const distance = hammingDistance(
      currentHash,
      candidate.phashHex,
    );

    if (distance > threshold) {
      continue;
    }

    if (
      closest === null ||
      distance < closest.hammingDistance
    ) {
      closest = {
        submissionId: candidate.submissionId,
        hammingDistance: distance,
        similarityScore: 1 - distance / 64,
      };
    }
  }

  return closest;
}