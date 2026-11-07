
import { expect, test } from "bun:test";
import { getR2SignedReadUrl } from "../src/r2";

test("FPC-54: Từ chối đường dẫn ảnh R2 không hợp lệ", async () => {
  await expect(
    getR2SignedReadUrl("other/image.jpg"),
  ).rejects.toThrow("Invalid submission image key");
});

test("FPC-54: Từ chối thời hạn URL không hợp lệ", async () => {
  await expect(
    getR2SignedReadUrl("submissions/test.jpg", 0),
  ).rejects.toThrow("Invalid URL expiration");
});

test("FPC-54: Từ chối thời hạn URL vượt quá 3600 giây", async () => {
  await expect(
    getR2SignedReadUrl("submissions/test.jpg", 3601),
  ).rejects.toThrow("Invalid URL expiration");
});
