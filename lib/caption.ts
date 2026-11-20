import { MAX_CAPTION_LENGTH } from "./storage";

export function normalizeCaption(value: unknown): string | null {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return null;
  const caption = value.replace(/\s+/g, " ").trim();
  return caption.length <= MAX_CAPTION_LENGTH ? caption : null;
}
