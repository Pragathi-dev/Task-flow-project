import { z } from 'zod';
import { APP_LIMITS } from '@/config/constants';

export const CreateBoardSchema = z.object({
  name: z
    .string()
    .min(1, 'Board name is required')
    .max(
      APP_LIMITS.MAX_BOARD_NAME_LENGTH,
      `Name must be ${APP_LIMITS.MAX_BOARD_NAME_LENGTH} characters or less`,
    ),
  workspaceId: z.string().min(1, 'Workspace is required'),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex colour')
    .optional(),
  icon: z.string().max(2).optional(),
});

export const UpdateBoardSchema = CreateBoardSchema.omit({ workspaceId: true }).partial();

export type CreateBoardFormData = z.infer<typeof CreateBoardSchema>;
export type UpdateBoardFormData = z.infer<typeof UpdateBoardSchema>;
