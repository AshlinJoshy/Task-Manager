import React, { useMemo } from 'react';
import { type Task } from '../types';
import { TaskCard } from './TaskCard';
import { format, isSameDay, startOfWeek, addDays, parseISO, isValid } from 'date-fns';
import { cn } from '../lib/utils';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

const DAYS_OF_WEEK = 7;

export const WeekView: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onEdit }) => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  const weekDays = useMemo(() => {
    return Array.from({ length: DAYS_OF_WEEK }).map((_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date,
        label: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        isToday: isSameDay(date, today),
      };
    });
  }, [startOfCurrentWeek, today]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    
    // Initialize map for all week days
    weekDays.forEach(day => {
      map.set(day.date.toDateString(), []);
    });

    // Add tasks to corresponding days
    tasks.forEach(task => {
      if (task.dueDate && !task.completed) {
        const dueDate = parseISO(task.dueDate);
        if (isValid(dueDate)) {
          const key = dueDate.toDateString();
          if (map.has(key)) {
            map.get(key)?.push(task);
          }
        }
      }
    });

    return map;
  }, [tasks, weekDays]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full min-w-[1000px]">
      {weekDays.map((day) => {
        const dayTasks = tasksByDate.get(day.date.toDateString()) || [];
        // Sort by priority
        dayTasks.sort((a, b) => {
          const priorities = { Constant: 0, High: 1, Medium: 2, Low: 3 };
          return priorities[a.priority] - priorities[b.priority];
        });

        return (
          <div 
            key={day.date.toISOString()} 
            className={cn(
              "flex flex-col gap-3 p-3 rounded-lg border min-h-[300px]",
              day.isToday ? "bg-blue-50/50 border-blue-200" : "bg-gray-50/50 border-gray-200"
            )}
          >
            <div className="text-center pb-2 border-b border-gray-200/60">
              <div className={cn("font-semibold", day.isToday ? "text-blue-700" : "text-gray-700")}>
                {day.label}
              </div>
              <div className="text-xs text-gray-500">{day.fullDate}</div>
            </div>

            <div className="flex flex-col gap-2 flex-1">
              {dayTasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onDelete={onDelete}
                  onEdit={onEdit}
                />
              ))}
              {dayTasks.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic">
                  No tasks
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
