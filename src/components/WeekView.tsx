import React, { useMemo } from 'react';
import { type Task } from '../types';
import { TaskCard } from './TaskCard';
import { format, isSameDay, startOfWeek, addDays, parseISO, isValid, getDay } from 'date-fns';
import { cn } from '../lib/utils';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string, dateStr?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  selectedDate: Date;
  // onTaskMove is not needed here as dragging is handled by parent context
}

const DAYS_OF_WEEK = 7;

// Draggable Wrapper
const DraggableTask = ({ task, children }: { task: Task; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !!task.recurrence || !!task.completed,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

// Droppable Zone within a Day
const DroppableZone = ({ children, type, isOver }: { children: React.ReactNode; type: 'short' | 'time-consuming'; isOver: boolean }) => {
  return (
    <div 
      className={cn(
        "flex flex-col gap-2 flex-1 rounded-md p-1 min-h-[100px] transition-colors",
        type === 'short' ? "bg-blue-50/30" : "bg-purple-50/30",
        isOver && (type === 'short' ? "bg-blue-100 ring-2 ring-blue-200" : "bg-purple-100 ring-2 ring-purple-200")
      )}
    >
      <div className={cn(
        "text-[10px] uppercase font-semibold tracking-wider mb-1 px-1",
        type === 'short' ? "text-blue-400" : "text-purple-400"
      )}>
        {type === 'short' ? 'Short Tasks' : 'Time Consuming'}
      </div>
      {children}
    </div>
  );
};

// Zone Component that connects to DnD
const Zone = ({ id, type, children }: { id: string; type: 'short' | 'time-consuming'; children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { type: 'day-zone', dateStr: id.split(':')[0], category: type },
  });

  return (
    <div ref={setNodeRef} className="flex-1 flex flex-col">
      <DroppableZone type={type} isOver={isOver}>
        {children}
      </DroppableZone>
    </div>
  );
};

interface TaskWithVirtual extends Task {
  _virtualDate?: string;
}

export const WeekView: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onEdit, onUpdate, selectedDate }) => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const weekDays = useMemo(() => {
    return Array.from({ length: DAYS_OF_WEEK }).map((_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date,
        label: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        isToday: isSameDay(date, today),
        dayIndex: getDay(date),
        dateStr: format(date, 'yyyy-MM-dd'),
      };
    });
  }, [startOfCurrentWeek, today]);

  const tasksByDate = useMemo(() => {
    const map = new Map<string, { short: TaskWithVirtual[], long: TaskWithVirtual[] }>();
    
    weekDays.forEach(day => {
      map.set(day.dateStr, { short: [], long: [] });
    });

    tasks.forEach(task => {
      let dateKey: string | null = null;

      if (task.dueDate && !task.recurrence && !task.completed) {
        const parsed = parseISO(task.dueDate);
        if (isValid(parsed)) {
          dateKey = format(parsed, 'yyyy-MM-dd');
        }
      }

      if (task.recurrence) {
        weekDays.forEach(day => {
          if (task.recurrence!.days.includes(day.dayIndex)) {
             const dStr = day.dateStr;
             const completedForDay = task.completions?.some(c => c.startsWith(dStr));
             
             if (!completedForDay) {
               const inst: TaskWithVirtual = { ...task, _virtualDate: dStr };
               const dayBucket = map.get(dStr);
               if (dayBucket) {
                 if (task.durationCategory === 'time-consuming') {
                   dayBucket.long.push(inst);
                 } else {
                   dayBucket.short.push(inst);
                 }
               }
             }
          }
        });
        return; 
      }

      if (dateKey && map.has(dateKey)) {
        const dayBucket = map.get(dateKey)!;
        if (task.durationCategory === 'time-consuming') {
          dayBucket.long.push(task);
        } else {
          dayBucket.short.push(task);
        }
      }
    });

    return map;
  }, [tasks, weekDays]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full min-w-[300px]"> 
      {weekDays.map((day) => {
        const buckets = tasksByDate.get(day.dateStr) || { short: [], long: [] };
        
        const sortFn = (a: Task, b: Task) => {
          const priorities = { Constant: 0, High: 1, Medium: 2, Low: 3 };
          return priorities[a.priority] - priorities[b.priority];
        };
        buckets.short.sort(sortFn);
        buckets.long.sort(sortFn);

        return (
          <div 
            key={day.dateStr}
            className={cn(
              "flex flex-col gap-2 p-2 rounded-lg border min-h-[300px] transition-colors",
              day.isToday ? "bg-blue-50/50 border-blue-200" : "bg-gray-50/50 border-gray-200"
            )}
          >
            <div className="text-center pb-1 border-b border-gray-200/60 mb-1">
              <div className={cn("font-semibold", day.isToday ? "text-blue-700" : "text-gray-700")}>
                {day.label}
              </div>
              <div className="text-xs text-gray-500">{day.fullDate}</div>
            </div>

            <div className="flex flex-col flex-1 gap-2">
              <Zone id={`${day.dateStr}:short`} type="short">
                {buckets.short.map((task) => {
                   const isRecurring = !!task.recurrence;
                   const card = (
                      <TaskCard
                        key={`${task.id}-${task._virtualDate || 'single'}`}
                        task={task}
                        onToggle={(id) => onToggle(id, task._virtualDate)}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onUpdate={onUpdate}
                        isRecurringInstance={!!task._virtualDate}
                      />
                   );
                   if (isRecurring) return card;
                   return (
                     <DraggableTask key={task.id} task={task}>
                       {card}
                     </DraggableTask>
                   );
                })}
              </Zone>

              <Zone id={`${day.dateStr}:time-consuming`} type="time-consuming">
                {buckets.long.map((task) => {
                   const isRecurring = !!task.recurrence;
                   const card = (
                      <TaskCard
                        key={`${task.id}-${task._virtualDate || 'single'}`}
                        task={task}
                        onToggle={(id) => onToggle(id, task._virtualDate)}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onUpdate={onUpdate}
                        isRecurringInstance={!!task._virtualDate}
                      />
                   );
                   if (isRecurring) return card;
                   return (
                     <DraggableTask key={task.id} task={task}>
                       {card}
                     </DraggableTask>
                   );
                })}
              </Zone>
            </div>
          </div>
        );
      })}
    </div>
  );
};
