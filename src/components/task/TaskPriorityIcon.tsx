import { memo } from 'react';
import {
  RiArrowDownLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiAlertLine,
} from 'react-icons/ri';
import { Tooltip } from '@/components/common/Tooltip';
import { priorityToLabel } from '@/utils/priorityUtils';
import { cn } from '@/utils/cn';
import type { Priority } from '@/types/common.types';

interface TaskPriorityIconProps {
  priority: Priority;
  size?: number;
  showTooltip?: boolean;
  className?: string;
}

const iconMap: Record<Priority, React.ComponentType<{ size?: number; className?: string }>> = {
  low: RiArrowDownLine,
  medium: RiArrowRightLine,
  high: RiArrowUpLine,
  urgent: RiAlertLine,
};

const colorMap: Record<Priority, string> = {
  low: 'text-green-500',
  medium: 'text-amber-500',
  high: 'text-red-500',
  urgent: 'text-violet-600',
};

export const TaskPriorityIcon = memo(function TaskPriorityIcon({
  priority,
  size = 13,
  showTooltip = true,
  className,
}: TaskPriorityIconProps) {
  const Icon = iconMap[priority];
  const icon = (
    <Icon size={size} className={cn(colorMap[priority], 'shrink-0', className)} aria-hidden="true" />
  );

  if (!showTooltip) return icon;

  return (
    <Tooltip content={priorityToLabel(priority)} side="top">
      <span className="inline-flex items-center" aria-label={`Priority: ${priorityToLabel(priority)}`}>
        {icon}
      </span>
    </Tooltip>
  );
});
