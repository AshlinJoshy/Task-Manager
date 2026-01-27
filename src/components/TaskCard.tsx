import React from 'react';
import { type Task } from '../types';
import { Badge } from './ui/Badge';
import { Check, Calendar, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit }) => {
  return (
    <div className={cn(
      "group relative flex flex-col gap-2 rounded-lg border bg-white p-3 shadow-sm transition-all hover:shadow-md",
      task.completed && "opacity-75 bg-gray-50"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggle(task.id)}
            className={cn(
              "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
              task.completed 
                ? "bg-blue-600 border-blue-600 text-white" 
                : "border-gray-300 bg-white hover:border-blue-500"
            )}
          >
            {task.completed && <Check size={12} strokeWidth={3} />}
          </button>
          
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className={cn(
              "font-medium text-sm text-gray-900 truncate",
              task.completed && "line-through text-gray-500"
            )}>
              {task.title}
            </span>
            {task.description && (
              <p className="text-xs text-gray-500 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge priority={task.priority}>{task.priority}</Badge>
              {task.dueDate && (
                <span className={cn(
                  "flex items-center text-xs text-gray-500",
                  new Date(task.dueDate) < new Date() && !task.completed && "text-red-600 font-medium"
                )}>
                  <Calendar size={12} className="mr-1" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/80 backdrop-blur-sm rounded-md p-0.5">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => onEdit(task)}>
          <Edit2 size={14} className="text-gray-600" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:text-red-600" onClick={() => onDelete(task.id)}>
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
};
