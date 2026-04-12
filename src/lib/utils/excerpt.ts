/**
 * Extract plain text from TipTap JSON content
 */
export function extractTextFromTipTap(content: Record<string, unknown> | null): string {
  if (!content) return '';
  
  const extract = (node: Record<string, unknown>): string => {
    // Standard Text
    if (node.type === 'text' && typeof node.text === 'string') {
      return node.text;
    }

    // Mention Nodes (Critical for LUMEN interlinking)
    if (node.type === 'mention' && node.attrs && (node.attrs as any).label) {
      return `@${(node.attrs as any).label}`;
    }

    // Handle nested content recursively
    if (Array.isArray(node.content)) {
      return (node.content as Record<string, unknown>[])
        .map(extract)
        .join(node.type === 'paragraph' ? '\n' : ' ');
    }
    
    return '';
  };
  
  return extract(content).trim();
}

/**
 * Create a short excerpt from TipTap content
 */
export function createExcerpt(content: Record<string, unknown> | null, maxLen = 160): string {
  const text = extractTextFromTipTap(content);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}
