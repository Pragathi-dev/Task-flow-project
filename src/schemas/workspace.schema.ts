import { z } from 'zod';
import { APP_LIMITS } from '@/config/constants';

export const CreateWorkspaceSchema = z.object({
  name: z
    .string()
    .min(1, 'Workspace name is required')
    .max(
      APP_LIMITS.MAX_WORKSPACE_NAME_LENGTH,
      `Name must be ${APP_LIMITS.MAX_WORKSPACE_NAME_LENGTH} characters or less`,
    ),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a valid hex colour (e.g. #3b82f6)'),
  icon: z.string().max(10).optional(),
});

export const UpdateWorkspaceSchema = CreateWorkspaceSchema.partial();

export type CreateWorkspaceFormData = z.infer<typeof CreateWorkspaceSchema>;
export type UpdateWorkspaceFormData = z.infer<typeof UpdateWorkspaceSchema>;
