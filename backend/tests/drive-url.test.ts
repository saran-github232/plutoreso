import { describe, expect, it } from "vitest";
import { validateAndExtractDriveFolderId } from "../src/services/drive-url.service.js";
import { extractDriveFolderId } from "../src/validation/product.schemas.js";

/**
 * Phase 5 — Google Drive folder URL validation/extraction tests.
 *
 * Pure-logic tests — no network calls, no Google API.
 */

describe("validateAndExtractDriveFolderId", () => {
  describe("empty input handling", () => {
    it("returns null folderId for empty string", () => {
      expect(validateAndExtractDriveFolderId("")).toEqual({
        folderId: null,
        valid: true,
      });
    });

    it("returns null folderId for null", () => {
      expect(validateAndExtractDriveFolderId(null)).toEqual({
        folderId: null,
        valid: true,
      });
    });

    it("returns null folderId for undefined", () => {
      expect(validateAndExtractDriveFolderId(undefined)).toEqual({
        folderId: null,
        valid: true,
      });
    });

    it("returns null folderId for whitespace-only string", () => {
      expect(validateAndExtractDriveFolderId("   ")).toEqual({
        folderId: null,
        valid: true,
      });
    });
  });

  describe("valid Drive folder URLs", () => {
    it("extracts folder ID from drive.google.com/drive/folders/URL", () => {
      const result = validateAndExtractDriveFolderId(
        "https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result).toEqual({
        folderId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
        valid: true,
      });
    });

    it("extracts folder ID from http:// variant", () => {
      const result = validateAndExtractDriveFolderId(
        "http://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result.folderId).toBe(
        "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result.valid).toBe(true);
    });

    it("extracts folder ID from drive.google.com/open?id=URL", () => {
      const result = validateAndExtractDriveFolderId(
        "https://drive.google.com/open?id=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result.folderId).toBe(
        "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result.valid).toBe(true);
    });

    it("extracts folder ID from drive.google.com/folders/URL", () => {
      const result = validateAndExtractDriveFolderId(
        "https://drive.google.com/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result.folderId).toBe(
        "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
      );
      expect(result.valid).toBe(true);
    });

    it("handles URLs with extra query parameters", () => {
      const result = validateAndExtractDriveFolderId(
        "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz?usp=sharing"
      );
      expect(result.folderId).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
      expect(result.valid).toBe(true);
    });

    it("handles URLs with trailing slash", () => {
      const result = validateAndExtractDriveFolderId(
        "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz/"
      );
      expect(result.folderId).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
      expect(result.valid).toBe(true);
    });

    it("trims whitespace from input", () => {
      const result = validateAndExtractDriveFolderId(
        "  https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz  "
      );
      expect(result.folderId).toBe("1AbCdEfGhIjKlMnOpQrStUvWxYz");
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid URLs", () => {
    it("rejects non-Drive URLs (youtube)", () => {
      const result = validateAndExtractDriveFolderId(
        "https://www.youtube.com/watch?v=abc"
      );
      expect(result.valid).toBe(false);
      expect(result.folderId).toBeNull();
      expect(result.error).toBeDefined();
    });

    it("rejects Google Docs (non-Drive) URLs", () => {
      const result = validateAndExtractDriveFolderId(
        "https://docs.google.com/document/d/abc123"
      );
      expect(result.valid).toBe(false);
      expect(result.folderId).toBeNull();
    });

    it("rejects completely invalid input", () => {
      const result = validateAndExtractDriveFolderId("not a url at all");
      expect(result.valid).toBe(false);
      expect(result.folderId).toBeNull();
    });

    it("rejects ftp:// protocol", () => {
      const result = validateAndExtractDriveFolderId(
        "ftp://drive.google.com/drive/folders/abc"
      );
      expect(result.valid).toBe(false);
      expect(result.folderId).toBeNull();
    });

    it("rejects random domain with 'drive' in path", () => {
      const result = validateAndExtractDriveFolderId(
        "https://example.com/drive/folders/abc"
      );
      expect(result.valid).toBe(false);
      expect(result.folderId).toBeNull();
    });
  });
});

describe("extractDriveFolderId (schema helper)", () => {
  it("returns null for empty input", () => {
    expect(extractDriveFolderId("")).toEqual({ folderId: null, valid: true });
    expect(extractDriveFolderId(null)).toEqual({ folderId: null, valid: true });
    expect(extractDriveFolderId(undefined)).toEqual({
      folderId: null,
      valid: true,
    });
  });

  it("extracts folder ID from standard Drive URL", () => {
    const result = extractDriveFolderId(
      "https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOpQrStUvWxYz"
    );
    expect(result).toEqual({
      folderId: "1AbCdEfGhIjKlMnOpQrStUvWxYz",
      valid: true,
    });
  });

  it("rejects non-Drive URLs", () => {
    const result = extractDriveFolderId("https://example.com/folders/abc");
    expect(result.valid).toBe(false);
    expect(result.folderId).toBeNull();
  });
});
