import { z } from 'zod';
import { APP_LIMITS } from '@/config/constants';

const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const CreateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(
      APP_LIMITS.MAX_TASK_TITLE_LENGTH,
      `Title must be ${APP_LIMITS.MAX_TASK_TITLE_LENGTH} characters or less`,
    ),
  columnId: z.string().min(1, 'Column is required'),
  boardId: z.string().min(1, 'Board is required'),
  workspaceId: z.string().min(1, 'Workspace is required'),
  description: z
    .string()
    .max(APP_LIMITS.MAX_TASK_DESCRIPTION_LENGTH)
    .optional(),
  priority: PrioritySchema.optional().default('medium'),
  labels: z
    .array(z.string())
    .max(APP_LIMITS.MAX_LABELS_PER_TASK)
    .optional()
    .default([]),
  dueDate: z.string().nullable().optional().default(null),
  estimatedHours: z
    .number()
    .min(0)
    .max(APP_LIMITS.MAX_ESTIMATED_HOURS)
    .optional()
    .default(0),
});

export const UpdateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(APP_LIMITS.MAX_TASK_TITLE_LENGTH)
    .optional(),
  description: z
    .string()
    .max(APP_LIMITS.MAX_TASK_DESCRIPTION_LENGTH)
    .optional(),
  priority: PrioritySchema.optional(),
  labels: z.array(z.string()).max(APP_LIMITS.MAX_LABELS_PER_TASK).optional(),
  dueDate: z.string().nullable().optional(),
  estimatedHours: z
    .number()
    .min(0)
    .max(APP_LIMITS.MAX_ESTIMATED_HOURS)
    .optional(),
});

export const ChecklistItemSchema = z.object({
  text: z
    .string()
    .min(1, 'Item text is required')
    .max(APP_LIMITS.MAX_CHECKLIST_ITEM_LENGTH),
});

export const CommentSchema = z.object({
  text: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(APP_LIMITS.MAX_COMMENT_LENGTH, `Comment must be ${APP_LIMITS.MAX_COMMENT_LENGTH} characters or less`),
});

export type CreateTaskFormData = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof UpdateTaskSchema>;
export type ChecklistItemFormData = z.infer<typeof ChecklistItemSchema>;
export type CommentFormData = z.infer<typeof CommentSchema>;
