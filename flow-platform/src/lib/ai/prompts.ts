/**
 * Prompt templates for all AI features
 */

export const PROMPTS = {
  GENERATE_TITLES: (content: string) =>
    `Given this blog post content, suggest 5 compelling, SEO-friendly titles. Return them as a JSON array of strings.\n\nContent:\n${content}`,

  SUGGEST_TAGS: (title: string, content: string) =>
    `Given this blog post title and content, suggest 5-8 relevant tags. Return them as a JSON array of strings.\n\nTitle: ${title}\nContent: ${content}`,

  SUMMARIZE: (content: string) =>
    `Summarize this content in 2-3 concise sentences for a preview card. Be direct and informative.\n\nContent:\n${content}`,

  EXPLAIN_CODE: (code: string, language: string) =>
    `Explain this ${language} code in simple, beginner-friendly terms. Use short paragraphs. Highlight what the code does, any patterns used, and potential improvements.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``,

  DETECT_LANGUAGE: (code: string) =>
    `Detect the programming language of this code. Return only the language name in lowercase (e.g., "javascript", "python", "rust").\n\nCode:\n${code}`,

  IMPROVE_MICRO: (content: string) =>
    `Improve the clarity of this short post while keeping it under 500 characters. Make it more engaging and polished. Return only the improved text.\n\nOriginal:\n${content}`,

  EXPAND_MICRO: (content: string) =>
    `Expand this short post into a longer, more detailed version (1-2 paragraphs) while preserving the original meaning. Return only the expanded text.\n\nOriginal:\n${content}`,

  GRAMMAR_FIX: (content: string) =>
    `Fix any grammar, spelling, and punctuation errors in this text. Return a JSON object with "corrected" (the fixed text) and "changes" (an array of strings describing each change made).\n\nText:\n${content}`,

  ENHANCE_CONTENT: (content: string) =>
    `Enhance this content by improving vocabulary, flow, and readability. Keep the author's voice. Return only the enhanced text.\n\nContent:\n${content}`,

  SMART_SUGGESTION: (context: string) =>
    `Given the following writing context, suggest the next 1-2 sentences the author might write. Be creative but stay on topic. Return only the suggested text.\n\nContext:\n${context}`,

  TRANSCRIBE_SUMMARY: (transcript: string) =>
    `Summarize this audio transcript into clear, readable text. Remove filler words and organize the ideas into coherent paragraphs.\n\nTranscript:\n${transcript}`,
};
