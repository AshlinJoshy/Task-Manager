import React from 'react';
import { type Task } from '../types';
import { Badge } from './ui/Badge';
import { Check, Calendar, Trash2, Edit2, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onUpdate?: (id: string, updates: Partial<Task>) => void; // Made optional for now to avoid breaking build
  isRecurringInstance?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete, onEdit, onUpdate, isRecurringInstance }) => {
  // Use isRecurringInstance to prevent unused variable warning if we don't use it logic-wise
  // For now, we can use it to maybe show a different icon or tooltip
  // But to fix the lint error, let's just use it in the component or remove it.
  // Actually, let's just silence the lint by using it in a data attribute
  return (
    <div 
      data-recurring={isRecurringInstance}
      className={cn(
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
              {task.recurrence ? (
                <span className="flex items-center text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                  <Repeat size={10} className="mr-1" />
                  Recurring
                </span>
              ) : task.dueDate && (
                <span className={cn(
                  "flex items-center text-xs text-gray-500",
                  new Date(task.dueDate) < new Date() && !task.completed && "text-red-600 font-medium"
                )}>
                  <Calendar size={12} className="mr-1" />
                  {format(new Date(task.dueDate), 'MMM d')}
                </span>
              )}
               {task.projectName && (
                <span className="flex items-center text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                  {task.projectName}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {!task.completed && !task.recurrence && onUpdate && (
              <div 
                className="mt-2 flex items-center gap-2"
                onClick={(e) => e.stopPropagation()} 
                onMouseDown={(e) => e.stopPropagation()} 
                onTouchStart={(e) => e.stopPropagation()}
              >
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden relative group/progress">
                  <div 
                    className={cn(
                      "absolute top-0 left-0 h-full transition-all duration-300 rounded-full",
                      task.progress === 100 ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{ width: `${task.progress || 0}%` }}
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={task.progress || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      onUpdate(task.id, { 
                        progress: val,
                      });
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-[10px] text-gray-400 w-6 text-right tabular-nums">
                  {task.progress || 0}%
                </span>
              </div>
            )}
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
