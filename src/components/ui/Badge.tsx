import React from 'react';
import { cn } from '../../lib/utils';
import { type Priority } from '../../types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  priority?: Priority;
  variant?: 'default' | 'outline';
}

export const Badge = ({ className, priority, variant = 'default', ...props }: BadgeProps) => {
  const priorityStyles = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Constant: 'bg-purple-100 text-purple-700 border-purple-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Low: 'bg-green-100 text-green-700 border-green-200',
  };

  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border';
  
  const styles = priority 
    ? priorityStyles[priority]
    : 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span
      className={cn(baseStyles, styles, className)}
      {...props}
    />
  );
};
