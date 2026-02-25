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
  // onTaskMove handled by parent DndContext now
  selectedDate: Date;
}

const DAYS_OF_WEEK = 7;

// Draggable and Droppable Wrapper for reordering
const DraggableTask = ({ task, children }: { task: Task; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !!task.recurrence || !!task.completed, // Disable for recurring or completed tasks
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `task-${task.id}`,
    data: { type: 'task', task },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'none', // Crucial for mobile dragging
  };

  const setRefs = (node: HTMLElement | null) => {
    setDraggableRef(node);
    setDroppableRef(node);
  };

  return (
    <div 
      ref={setRefs} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={cn(isOver && "ring-2 ring-blue-400 ring-offset-1 rounded-lg transition-all")}
    >
      {children}
    </div>
  );
};

// Droppable Wrapper
const DroppableDay = ({ id, isToday, children, className }: { id: string; isToday: boolean; children: React.ReactNode; className?: string }) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: 'day', dateStr: id.split('|')[0] },
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-2 p-2 rounded-lg border min-h-[120px] transition-colors",
        isToday ? "bg-blue-50/30 border-blue-200" : "bg-gray-50/50 border-gray-200",
        isOver && "bg-blue-100 border-blue-300 ring-2 ring-blue-200",
        className
      )}
    >
      {children}
    </div>
  );
};

export const WeekView: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onEdit, selectedDate }) => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday start

  const weekDays = useMemo(() => {
    return Array.from({ length: DAYS_OF_WEEK }).map((_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date,
        label: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        isToday: isSameDay(date, today), // Still checks against actual today
        dayIndex: getDay(date), // 0-6 (Sun-Sat)
        dateStr: date.toISOString(), 
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
      // 1. Handle One-time Tasks with Due Date
      if (task.dueDate && !task.recurrence && !task.completed) {
        const dueDate = parseISO(task.dueDate);
        if (isValid(dueDate)) {
          const key = dueDate.toDateString();
          if (map.has(key)) {
            map.get(key)?.push(task);
          }
        }
      }

      // 2. Handle Recurring Tasks
      if (task.recurrence) {
        weekDays.forEach(day => {
          if (task.recurrence!.days.includes(day.dayIndex)) {
             const dateStr = format(day.date, 'yyyy-MM-dd');
             // Robust check: look for any completion that starts with this date string
             const isCompletedForDay = task.completions?.some((c: string) => c.startsWith(dateStr));
             
             if (!isCompletedForDay) {
               const instanceTask = {
                 ...task,
                 _virtualDate: dateStr 
               };
               const key = day.date.toDateString();
               map.get(key)?.push(instanceTask as Task);
             }
          }
        });
      }
    });

    return map;
  }, [tasks, weekDays]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full min-w-[300px]"> 
      {weekDays.map((day) => {
        const dayTasks = tasksByDate.get(day.date.toDateString()) || [];
        dayTasks.sort((a, b) => {
          const durationA = a.duration === 'Time Consuming' ? 1 : 0;
          const durationB = b.duration === 'Time Consuming' ? 1 : 0;
          if (durationA !== durationB) return durationA - durationB;

          const priorities = { Constant: 0, High: 1, Medium: 2, Low: 3 };
          if (priorities[a.priority] !== priorities[b.priority]) {
            return priorities[a.priority] - priorities[b.priority];
          }
          return (a.order || 0) - (b.order || 0);
        });

        const shortTasks = dayTasks.filter(t => t.duration === 'Short Task' || !t.duration);
        const timeConsumingTasks = dayTasks.filter(t => t.duration === 'Time Consuming');

        const renderTasks = (tasksToRender: Task[]) => {
          if (tasksToRender.length === 0) return null;
          
          return tasksToRender.map((task: any) => {
             const isRecurring = !!task.recurrence;
             const card = (
                <TaskCard
                  key={`${task.id}-${task._virtualDate || 'single'}`}
                  task={task}
                  onToggle={(id) => onToggle(id, task._virtualDate)}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  isRecurringInstance={!!task._virtualDate}
                />
             );

             // Only wrap non-recurring tasks in draggable
             if (isRecurring) return card;
             
             return (
               <DraggableTask key={task.id} task={task}>
                 {card}
               </DraggableTask>
             );
          });
        };

        return (
          <div key={day.dateStr} className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <div className="text-center p-2 border-b border-gray-100 bg-gray-50/50">
              <div className={cn("font-semibold", day.isToday ? "text-blue-700" : "text-gray-700")}>
                {day.label}
              </div>
              <div className="text-xs text-gray-500">{day.fullDate}</div>
            </div>

            <div className="flex flex-col flex-1 p-2 gap-3 overflow-y-auto">
              <DroppableDay 
                id={`${day.dateStr}|Short Task`} 
                isToday={day.isToday}
                className="flex-1 min-h-[150px]"
              >
                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 px-1 sticky top-0 bg-inherit z-10">Short Tasks</div>
                {renderTasks(shortTasks)}
                {shortTasks.length === 0 && (
                  <div className="text-xs text-gray-300 italic px-2">No short tasks</div>
                )}
              </DroppableDay>
              
              <DroppableDay 
                id={`${day.dateStr}|Time Consuming`} 
                isToday={day.isToday}
                className="flex-1 min-h-[150px]"
              >
                <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1 px-1 sticky top-0 bg-inherit z-10">Time Consuming</div>
                {renderTasks(timeConsumingTasks)}
                {timeConsumingTasks.length === 0 && (
                  <div className="text-xs text-gray-300 italic px-2">No time consuming tasks</div>
                )}
              </DroppableDay>
            </div>
          </div>
        );
      })}
    </div>
  );
};
