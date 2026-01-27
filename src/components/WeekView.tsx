import React, { useMemo } from 'react';
import { type Task } from '../types';
import { TaskCard } from './TaskCard';
import { format, isSameDay, startOfWeek, addDays, parseISO, isValid, getDay } from 'date-fns';
import { cn } from '../lib/utils';
import { DndContext, useDraggable, useDroppable, type DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string, dateStr?: string) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
  onTaskMove: (id: string, date: Date) => void;
}

const DAYS_OF_WEEK = 7;

// Draggable Wrapper
const DraggableTask = ({ task, children }: { task: Task; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !!task.recurrence || !!task.completed, // Disable for recurring or completed tasks
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
      {children}
    </div>
  );
};

// Droppable Wrapper
const DroppableDay = ({ dateStr, children, isToday }: { dateStr: string; children: React.ReactNode; isToday: boolean }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dateStr,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex flex-col gap-3 p-3 rounded-lg border min-h-[300px] transition-colors",
        isToday ? "bg-blue-50/50 border-blue-200" : "bg-gray-50/50 border-gray-200",
        isOver && "bg-blue-100 border-blue-300 ring-2 ring-blue-200"
      )}
    >
      {children}
    </div>
  );
};

export const WeekView: React.FC<TaskListProps> = ({ tasks, onToggle, onDelete, onEdit, onTaskMove }) => {
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday start

  // Sensors for better touch/mouse handling
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts to prevent accidental drags on click
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // Slight delay for touch to differentiate from scroll
        tolerance: 5,
      },
    })
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: DAYS_OF_WEEK }).map((_, i) => {
      const date = addDays(startOfCurrentWeek, i);
      return {
        date,
        label: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        isToday: isSameDay(date, today),
        dayIndex: getDay(date), // 0-6 (Sun-Sat)
        dateStr: date.toISOString(), // Use ISO string as ID for consistency
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
             const isCompletedForDay = task.completions?.includes(dateStr);
             
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

  const [activeTask, setActiveTask] = React.useState<Task | null>(null);

  const handleDragStart = (event: any) => {
    setActiveTask(event.active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (over && active.id !== over.id) {
      // over.id is the dateStr of the dropped column
      // active.id is the task id
      const newDateStr = over.id as string;
      const newDate = parseISO(newDateStr);
      
      if (isValid(newDate)) {
        onTaskMove(active.id as string, newDate);
      }
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 h-full min-w-[300px]"> 
        {/* Adjusted min-w to prevent breaking on very small screens, but scrolling might be handled by parent */}
        {weekDays.map((day) => {
          const dayTasks = tasksByDate.get(day.date.toDateString()) || [];
          dayTasks.sort((a, b) => {
            const priorities = { Constant: 0, High: 1, Medium: 2, Low: 3 };
            return priorities[a.priority] - priorities[b.priority];
          });

          return (
            <DroppableDay 
              key={day.dateStr} 
              dateStr={day.dateStr}
              isToday={day.isToday}
            >
              <div className="text-center pb-2 border-b border-gray-200/60">
                <div className={cn("font-semibold", day.isToday ? "text-blue-700" : "text-gray-700")}>
                  {day.label}
                </div>
                <div className="text-xs text-gray-500">{day.fullDate}</div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {dayTasks.map((task: any) => {
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
                })}
                {dayTasks.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-xs text-gray-400 italic">
                    No tasks
                  </div>
                )}
              </div>
            </DroppableDay>
          );
        })}
      </div>

      {createPortal(
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80 rotate-2 cursor-grabbing">
               <TaskCard
                  task={activeTask}
                  onToggle={() => {}}
                  onDelete={() => {}}
                  onEdit={() => {}}
                />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
};
