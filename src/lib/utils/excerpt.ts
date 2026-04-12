/**
 * Extract plain text from TipTap JSON content
 */
export function extractTextFromTipTap(content: Record<string, unknown> | null): string {
  if (!content) return '';
  
  // Standardize content to ensure no Proxies or hidden properties 
  // interfere with server-side processing (Next.js 15+ safety)
  let safeContent;
  try {
    safeContent = typeof content === 'string' ? JSON.parse(content) : JSON.parse(JSON.stringify(content));
  } catch (e) {
    return '';
  }

  const extract = (node: any): string => {
    if (!node) return '';

    // Standard Text
    if (node.type === 'text' && typeof node.text === 'string') {
      return node.text;
    }

    // Mention Nodes (Critical for LUMEN interlinking)
    if (node.type === 'mention' && node.attrs && node.attrs.label) {
      return `@${node.attrs.label}`;
    }

    // Handle nested content recursively
    if (Array.isArray(node.content)) {
      return node.content
        .map(extract)
        .join(node.type === 'paragraph' ? '\n' : ' ');
    }
    
    return '';
  };
  
  return extract(safeContent).trim();
}


/**
 * Create a short excerpt from TipTap content
 */
export function createExcerpt(content: Record<string, unknown> | null, maxLen = 160): string {
  const text = extractTextFromTipTap(content);
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, '') + '…';
}
