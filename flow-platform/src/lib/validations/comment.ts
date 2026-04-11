import { z } from 'zod';

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  parent_id: z.string().uuid().optional().nullable(),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
