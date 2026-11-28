import { describe, expect, it } from "bun:test";
import type { PublicExhibitionItem } from "@/types/exhibition";
import {
  buildArchiveContestInput,
  buildExhibitionQuery,
  buildProcessExhibitionInput,
  getExhibitionErrorMessage,
  isAbortError,
  resolveExhibitionImageUrl,
  toArchiveArtwork,
  toArchiveFilmFormat,
  unwrapApiData,
} from "./exhibition-api";

const publicItem: PublicExhibitionItem = {
  id: "ex-1",
  submissionId: "sub-1",
  contestId: "contest-1",
  contestName: "Cuộc thi 2026",
  categoryName: "Đường phố",
  title: "Nắng Sài Gòn",
  author: "Nguyễn Văn A",
  filmStock: "Kodak Portra 400",
  camera: "Canon AE-1",
  filmFormat: "Medium Format",
  year: 2026,
  award: "GOLD",
  awardTitle: "Giải Nhất",
  rank: 1,
  finalScore: 9.5,
  aiTags: ["street"],
  imageUrl: "/api/v1/exhibitions/ex-1/image",
  watermarked: true,
  copyright: "© 2026 Cuộc thi 2026 — Nguyễn Văn A",
  publishedAt: "2026-01-01T00:00:00.000Z",
};

describe("exhibition-api helpers", () => {
  it("ép WebP và watermark thành true, publish/includeFinalists có default", () => {
    const forced = buildArchiveContestInput({
      submissionIds: ["sub-1"],
      generateWebp: false,
      applyWatermark: false,
      publish: false,
      includeFinalists: false,
    });

    expect(forced.generateWebp).toBe(true);
    expect(forced.applyWatermark).toBe(true);
    expect(forced.submissionIds).toEqual(["sub-1"]);
    expect(forced.publish).toBe(false);
    expect(forced.includeFinalists).toBe(false);

    const defaults = buildArchiveContestInput();
    expect(defaults.publish).toBe(true);
    expect(defaults.includeFinalists).toBe(true);
  });

  it("bỏ filter all/rỗng và giữ page/limit", () => {
    const query = buildExhibitionQuery({
      contestId: "",
      year: "all",
      filmStock: "Portra",
      camera: "   ",
      filmFormat: "all",
      aiTag: undefined,
      award: "GOLD",
      page: 3,
      limit: 50,
    });

    expect(query).toEqual({
      page: 3,
      limit: 50,
      filmStock: "Portra",
      award: "GOLD",
    });
  });

  it("resolve URL ảnh tương đối và tuyệt đối", () => {
    expect(
      resolveExhibitionImageUrl("/api/v1/exhibitions/ex-1/image", "ex-1"),
    ).toMatch(/\/api\/v1\/exhibitions\/ex-1\/image$/);
    expect(
      resolveExhibitionImageUrl("https://cdn.example.com/a.webp", "ex-1"),
    ).toBe("https://cdn.example.com/a.webp");
    expect(resolveExhibitionImageUrl(null, "ex/1")).toMatch(
      /^https?:\/\/.*\/api\/v1\/exhibitions\/ex%2F1\/image$/,
    );
  });

  it("map sang ArchiveArtwork không lộ bản gốc và dùng awardTitle", () => {
    const withPrivateField = {
      ...publicItem,
      master_key: "private/master.jpg",
    } as PublicExhibitionItem & { master_key: string };
    const artwork = toArchiveArtwork(withPrivateField);

    expect(artwork.award).toBe("Giải Nhất");
    expect(artwork.award).not.toBe("GOLD");
    expect(artwork.film_format).toBe("120");
    expect(artwork.image_url).toMatch(/\/api\/v1\/exhibitions\/ex-1\/image$/);
    expect(JSON.stringify(artwork)).not.toContain("master_key");
    expect(JSON.stringify(artwork)).not.toContain("private/master.jpg");
    expect(
      toArchiveArtwork({ ...publicItem, filmFormat: "lạ" }).film_format,
    ).toBe("35mm");
  });

  it("map lỗi 403, 409-proof và 404", () => {
    expect(
      getExhibitionErrorMessage({
        response: { status: 403, data: { message: "denied" } },
      }),
    ).toContain("MSG005");
    expect(
      getExhibitionErrorMessage({
        response: { status: 409, data: { message: "BR-06 proof required" } },
      }),
    ).toContain("MSG026");
    expect(getExhibitionErrorMessage({ response: { status: 404 } })).toContain(
      "Không tìm thấy",
    );
  });

  it("buildProcessExhibitionInput ép WebP/watermark và giữ publish theo input", () => {
    const retry = buildProcessExhibitionInput({
      generateWebp: false,
      applyWatermark: false,
      publish: false,
    });
    expect(retry).toEqual({
      generateWebp: true,
      applyWatermark: true,
      publish: false,
    });

    const published = buildProcessExhibitionInput({ publish: true });
    expect(published.publish).toBe(true);
    expect(buildProcessExhibitionInput().publish).toBe(false);
  });

  it("isAbortError nhận diện lệ hủy", () => {
    expect(isAbortError({ code: "ERR_CANCELED" })).toBe(true);
    expect(isAbortError({ name: "AbortError" })).toBe(true);
    expect(isAbortError({ name: "CanceledError" })).toBe(true);
    expect(isAbortError({ name: "Error", message: "boom" })).toBe(false);
  });

  it("fallback imageUrl rỗng về URL tuyệt đối của API", () => {
    expect(resolveExhibitionImageUrl("", "ex-empty")).toMatch(
      /^https?:\/\/.*\/api\/v1\/exhibitions\/ex-empty\/image$/,
    );
  });

  it("buildExhibitionQuery map filmFormat UI sang mã API", () => {
    expect(buildExhibitionQuery({ filmFormat: "35mm" }).filmFormat).toBe("135");
    expect(buildExhibitionQuery({ filmFormat: "Large Format" }).filmFormat).toBe(
      "4x5",
    );
    expect(buildExhibitionQuery({ filmFormat: "120" }).filmFormat).toBe("120");
    expect(buildExhibitionQuery({ filmFormat: "all" }).filmFormat).toBeUndefined();
  });

  it("toArchiveFilmFormat map ngược mã API sang nhãn UI", () => {
    expect(toArchiveFilmFormat("135")).toBe("35mm");
    expect(toArchiveFilmFormat("4x5")).toBe("Large Format");
    expect(toArchiveFilmFormat("120")).toBe("120");
    expect(toArchiveFilmFormat("không rõ")).toBe("35mm");
  });

  it("toArchiveArtwork xử lý filmFormat 135 và 4x5 từ API", () => {
    expect(
      toArchiveArtwork({ ...publicItem, filmFormat: "135" }).film_format,
    ).toBe("35mm");
    expect(
      toArchiveArtwork({ ...publicItem, filmFormat: "4x5" }).film_format,
    ).toBe("Large Format");
  });

  it("MSG026 chèn mã bài chưa xác minh hoặc ? khi thiếu", () => {
    expect(
      getExhibitionErrorMessage(
        { response: { status: 409, data: { message: "BR-06 proof required" } } },
        "SUB-2026-0001",
      ),
    ).toContain("SUB-2026-0001");
    expect(
      getExhibitionErrorMessage({
        response: { status: 409, data: { message: "BR-06 proof required" } },
      }),
    ).toContain("MSG026: Không thể công bố: Tác phẩm ?");
  });

  it("unwrapApiData bóc dữ liệu chính xác từ API envelope", () => {
    const mockResponse = {
      data: {
        code: 200,
        message: "ok",
        data: { success: true, count: 5 },
        error: null,
      },
    };
    const result = unwrapApiData(mockResponse);
    expect(result).toEqual({ success: true, count: 5 });

    const nullResponse = {
      data: {
        code: 400,
        message: "bad request",
        data: null,
        error: "Not found",
      },
    };
    expect(() => unwrapApiData(nullResponse)).toThrow();
  });
});
