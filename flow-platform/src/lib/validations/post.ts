import { z } from 'zod';

export const postSchema = z.object({
  title: z.string().max(200, 'Title too long').optional().nullable(),
  content: z.any().refine(val => val !== null && val !== undefined, 'Content is required'),
  type: z.enum(['blog', 'micro', 'code', 'audio']),
  is_anonymous: z.boolean(),
  status: z.enum(['draft', 'published']),
  audio_url: z.string().url().optional().nullable(),
  cover_image: z.string().url().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
}).refine(data => {
  if (data.type !== 'micro') {
    return data.title !== null && data.title !== undefined && data.title.trim().length > 0;
  }
  return true;
}, {
  message: "Title is required for this post type",
  path: ["title"],
});

export type PostFormValues = z.infer<typeof postSchema>;

export const microPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(500, 'Micro posts are limited to 500 characters'),
  is_anonymous: z.boolean(),
});

export type MicroPostFormValues = z.infer<typeof microPostSchema>;

export const codeSnippetSchema = z.object({
  code: z.string().min(1, 'Code content is required'),
  language: z.string().min(1, 'Language is required'),
  title: z.string().max(100).optional().nullable(),
});

export type CodeSnippetFormValues = z.infer<typeof codeSnippetSchema>;
