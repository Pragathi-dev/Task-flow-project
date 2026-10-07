import { z } from 'zod';
import { APP_LIMITS } from '@/config/constants';

export const CreateColumnSchema = z.object({
  name: z
    .string()
    .min(1, 'Column name is required')
    .max(
      APP_LIMITS.MAX_COLUMN_NAME_LENGTH,
      `Name must be ${APP_LIMITS.MAX_COLUMN_NAME_LENGTH} characters or less`,
    ),
  boardId: z.string().min(1, 'Board is required'),
});

export const UpdateColumnSchema = z.object({
  name: z
    .string()
    .min(1, 'Column name is required')
    .max(APP_LIMITS.MAX_COLUMN_NAME_LENGTH),
});

export type CreateColumnFormData = z.infer<typeof CreateColumnSchema>;
export type UpdateColumnFormData = z.infer<typeof UpdateColumnSchema>;
