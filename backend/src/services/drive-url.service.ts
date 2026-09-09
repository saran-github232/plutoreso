/**
 * Google Drive folder URL validation + extraction service (Phase 5 / Master Guide §4–§5).
 *
 * Pure server-side service — no Google Drive API calls, no authentication,
 * no content fetching. Validates that a URL is a Google Drive folder URL and
 * extracts the folder ID to store in products.drive_folder_id.
 *
 * The raw URL is NEVER stored in the database — only the extracted folder ID.
 */

/** Common Google Drive folder URL patterns. */
const DRIVE_FOLDER_PATTERNS = [
  // https://drive.google.com/drive/folders/FOLDER_ID
  /^https?:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/,
  // https://drive.google.com/folders/FOLDER_ID
  /^https?:\/\/drive\.google\.com\/folders\/([a-zA-Z0-9_-]+)/,
  // https://drive.google.com/open?id=FOLDER_ID
  /^https?:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  // https://docs.google.com/folders/FOLDER_ID (less common but valid)
  /^https?:\/\/docs\.google\.com\/folders\/([a-zA-Z0-9_-]+)/,
];

export interface DriveUrlResult {
  /** Extracted folder ID, or null if no URL provided. */
  folderId: string | null;
  /** Whether the input was valid (empty is valid; malformed is not). */
  valid: boolean;
  /** Error message when invalid (safe to return to client). */
  error?: string;
}

/**
 * Validate a Google Drive folder URL and extract the folder ID.
 *
 * - Empty/null/whitespace input → valid with null folderId (no folder set).
 * - Valid Drive folder URL → valid with extracted folderId.
 * - Any other URL or malformed input → invalid with error message.
 */
export function validateAndExtractDriveFolderId(
  url: string | null | undefined
): DriveUrlResult {
  if (url == null || url.trim() === "") {
    return { folderId: null, valid: true };
  }

  const trimmed = url.trim();

  // Reject non-HTTP(S) URLs and obviously non-Drive domains early.
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return {
      folderId: null,
      valid: false,
      error: "Invalid Google Drive folder URL format.",
    };
  }

  for (const pattern of DRIVE_FOLDER_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return { folderId: match[1], valid: true };
    }
  }

  return {
    folderId: null,
    valid: false,
    error: "Invalid Google Drive folder URL format.",
  };
}
