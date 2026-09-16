export const PERSON_NAME_MAX = 120;
export const IDEA_TEXT_MAX = 4000;

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
const CONTROL_CHARS_INCLUDING_NEWLINES = /[\u0000-\u001F\u007F-\u009F]/g;
const HTML_TAG = /<[^>]*>/g;
const NAME_ALLOWED = /[^\p{L}\p{M}\s.'’ʻʼ-]/gu;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;",
};

export function stripControlChars(
  value: string,
  options?: { keepNewlines?: boolean },
): string {
  const pattern = options?.keepNewlines
    ? CONTROL_CHARS
    : CONTROL_CHARS_INCLUDING_NEWLINES;
  return value.replace(pattern, "");
}

export function sanitizePlainText(
  value: string,
  options: {
    maxLength: number;
    collapseWhitespace?: boolean;
    keepNewlines?: boolean;
  },
): string {
  let next = stripControlChars(value, {
    keepNewlines: options.keepNewlines,
  });

  if (options.keepNewlines) {
    next = next.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (options.collapseWhitespace) {
      next = next.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n");
    }
    next = next.trim();
  } else {
    next = next.trim();
    if (options.collapseWhitespace !== false) {
      next = next.replace(/\s+/g, " ");
    }
  }

  if (next.length > options.maxLength) {
    return next.slice(0, options.maxLength);
  }
  return next;
}

export function sanitizePersonName(
  value: string,
  maxLength: number = PERSON_NAME_MAX,
): string {
  const nfc = value.normalize("NFC");
  const withoutTags = nfc
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(HTML_TAG, " ");
  const withoutMarkup = withoutTags.replace(/[<>]/g, "");
  const withoutControls = stripControlChars(withoutMarkup);
  const allowed = withoutControls.replace(NAME_ALLOWED, "");
  return allowed.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}
