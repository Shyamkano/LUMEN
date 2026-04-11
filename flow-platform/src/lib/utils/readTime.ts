import { extractTextFromTipTap } from './excerpt';

/**
 * Calculate estimated read time in minutes
 */
export function calculateReadTime(content: Record<string, unknown> | null): number {
  const text = extractTextFromTipTap(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  const WPM = 200;
  return Math.max(1, Math.ceil(words / WPM));
}
