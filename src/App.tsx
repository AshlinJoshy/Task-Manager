import { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { WeekView } from './components/WeekView';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { Button } from './components/ui/Button';
import { Plus, LayoutGrid, List, CheckSquare, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, AlertCircle, ArrowRight, Trash2 } from 'lucide-react';
import { type Task } from './types';
import { cn } from './lib/utils';
import { ScrollArea } from './components/ui/ScrollArea';
import { DndContext, useDraggable, useDroppable, type DragEndEvent, DragOverlay, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { parseISO, isValid, addWeeks, subWeeks, format, startOfWeek, endOfWeek, isBefore, startOfDay } from 'date-fns';

// Draggable Wrapper for App-level items (Unscheduled)
const DraggableAppTask = ({ task, children }: { task: Task; children: React.ReactNode }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !!task.recurrence || !!task.completed,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 'auto',
    touchAction: 'none', // Crucial for mobile dragging
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

// Droppable Wrapper for Unscheduled List
const DroppableUnscheduled = ({ children }: { children: React.ReactNode }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'unscheduled-zone',
    data: { type: 'unscheduled' }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={cn(
        "flex-1 bg-gray-100/50 rounded-lg p-2 border border-gray-200 transition-colors",
        isOver && "bg-orange-50 border-orange-200 ring-2 ring-orange-100"
      )}
    >
      {children}
    </div>
  );
};

function App() {
  const { tasks, projects, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<'week' | 'list'>('week');
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Sensors for better touch/mouse handling
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for easier pickup
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Reduced delay for faster touch pickup
        tolerance: 5,
      },
    })
  );

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Project Filter
    if (projectFilter !== 'all') {
      if (projectFilter === 'No Project') {
        if (task.projectName) return false;
      } else {
        if (task.projectName !== projectFilter) return false;
      }
    }

    // Priority Filter
    if (priorityFilter !== 'all') {
      if (task.priority !== priorityFilter) return false;
    }

    return true;
  });

  const activeTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);
  
  // For recurring tasks, we need to show individual completions in the "Completed" list
  // We'll create "virtual" tasks for each completion of a recurring task
  const recurringCompletions = filteredTasks
    .filter(t => t.recurrence && t.completions && t.completions.length > 0)
    .flatMap(t => 
      t.completions!.map(completionDateStr => ({
        ...t,
        id: `${t.id}-${completionDateStr}`, // Unique ID for key
        completed: true,
        completedDate: completionDateStr, // Use the specific completion date
        recurrence: undefined, // Hide recurrence badge in completed list to avoid confusion or keep it? Let's hide to look like a done task.
        dueDate: undefined, // Clear due date to avoid showing calendar icon if not needed
      }))
    );

  // Combine regular completed tasks with recurring completions
  const allCompletedTasks = [...completedTasks, ...recurringCompletions];

  const unscheduledTasks = activeTasks.filter(t => !t.dueDate && !t.recurrence);
  const scheduledTasks = filteredTasks.filter(t => (t.dueDate || t.recurrence) && !t.completed);

  // Sort unscheduled by priority
  unscheduledTasks.sort((a, b) => {
    const priorities = { Constant: 0, High: 1, Medium: 2, Low: 3 };
    return priorities[a.priority] - priorities[b.priority];
  });
  
  // Sort completed by completed date (desc)
  allCompletedTasks.sort((a, b) => {
    const dateA = a.completedDate ? new Date(a.completedDate).getTime() : 0;
    const dateB = b.completedDate ? new Date(b.completedDate).getTime() : 0;
    return dateB - dateA;
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleWeekChange = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'prev') setSelectedDate(d => subWeeks(d, 1));
    if (direction === 'next') setSelectedDate(d => addWeeks(d, 1));
    if (direction === 'today') setSelectedDate(new Date());
  };

  const handleFormSubmit = (data: any) => {
    if (editingTask) {
      updateTask(editingTask.id, data);
    } else {
      addTask(data);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleDragStart = (event: any) => {
    setActiveDragTask(event.active.data.current?.task);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task || task.recurrence) return; // Recurring tasks cannot be dragged

    // Drop on Unscheduled Zone
    if (over.id === 'unscheduled-zone') {
       if (task.dueDate) {
         updateTask(taskId, { dueDate: undefined });
       }
       return;
    }

    // Drop on a specific Date
    // over.id should be an ISO date string from WeekView's droppable
    const newDateStr = over.id as string;
    const newDate = parseISO(newDateStr);

    if (isValid(newDate)) {
      // Check if date actually changed to avoid unnecessary updates
      if (task.dueDate !== newDateStr) {
        updateTask(taskId, { dueDate: newDateStr });
      }
    }
  };

  // Identify overdue tasks (only regular scheduled tasks)
  const todayStart = startOfDay(new Date());
  const overdueTasks = filteredTasks.filter(t => 
    t.dueDate && 
    !t.completed && 
    !t.recurrence &&
    isBefore(parseISO(t.dueDate), todayStart)
  );

  const moveOverdueToToday = () => {
    const todayStr = new Date().toISOString();
    overdueTasks.forEach(task => {
      updateTask(task.id, { dueDate: todayStr });
    });
  };

  const clearOverdueTasks = () => {
    if (confirm('Are you sure you want to delete all overdue tasks? This cannot be undone.')) {
      overdueTasks.forEach(task => {
        deleteTask(task.id);
      });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                <CheckSquare size={20} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">Task Manager</h1>
              <h1 className="text-xl font-bold text-gray-900 sm:hidden">Tasks</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setView('week')}
                  className={cn(
                    "p-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                    view === 'week' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <LayoutGrid size={16} /> <span className="hidden sm:inline">Week</span>
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    "p-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5",
                    view === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <List size={16} /> <span className="hidden sm:inline">List</span>
                </button>
              </div>
              
            <Button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="gap-2 hidden sm:flex">
              <Plus size={18} /> New Task
            </Button>
          </div>
        </div>
      </header>

      {/* Overdue Tasks Banner */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle size={16} />
            <span className="font-medium">
              {overdueTasks.length} task{overdueTasks.length !== 1 ? 's' : ''} overdue from previous weeks
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearOverdueTasks}
              className="h-7 text-xs text-red-600 hover:text-red-800 hover:bg-red-100"
            >
              <Trash2 size={12} className="mr-1" /> Clear All
            </Button>
            <Button 
              size="sm" 
              variant="danger" 
              onClick={moveOverdueToToday}
              className="h-7 text-xs bg-red-100 hover:bg-red-200 text-red-700 border-none"
            >
              Move to Today <ArrowRight size={12} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Navigation & Controls */}
      <div className="bg-white border-b px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 relative z-10">
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <Button variant="ghost" size="sm" onClick={() => handleWeekChange('prev')}>
            <ChevronLeft size={20} />
          </Button>
          
          <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
            <CalendarIcon size={16} className="text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline-block font-normal ml-1">
             ({format(selectedDate, 'yyyy')})
            </span>
          </div>

          <Button variant="ghost" size="sm" onClick={() => handleWeekChange('next')}>
            <ChevronRight size={20} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 order-3 sm:order-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
           <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-md border border-gray-100">
             <Filter size={14} className="text-gray-400 ml-1" />
             
             {/* Project Filter */}
             <select 
               className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 font-medium py-1 pr-8 cursor-pointer"
               value={projectFilter}
               onChange={(e) => setProjectFilter(e.target.value)}
             >
               <option value="all">All Projects</option>
               <option value="No Project">No Project</option>
               {projects.map(p => (
                 <option key={p} value={p}>{p}</option>
               ))}
             </select>

             <div className="w-px h-4 bg-gray-300 mx-1" />

             {/* Priority Filter */}
             <select 
               className="bg-transparent text-sm border-none focus:ring-0 text-gray-700 font-medium py-1 pr-8 cursor-pointer"
               value={priorityFilter}
               onChange={(e) => setPriorityFilter(e.target.value)}
             >
               <option value="all">All Priorities</option>
               <option value="High">High</option>
               <option value="Constant">Constant</option>
               <option value="Medium">Medium</option>
               <option value="Low">Low</option>
             </select>
           </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleWeekChange('today')}
          className="order-1 sm:order-3 sm:absolute sm:right-4 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 w-full sm:w-auto"
        >
          Today
        </Button>
      </div>

      <main className="flex-1 w-full px-4 py-4 sm:py-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-11rem)]">
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
              {view === 'week' ? (
                <ScrollArea className="flex-1 pb-4">
                 <WeekView 
                  tasks={scheduledTasks}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onEdit={handleEdit}
                  selectedDate={selectedDate}
                />
                </ScrollArea>
              ) : (
                 <ScrollArea className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scheduledTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onEdit={handleEdit}
                      />
                    ))}
                    {scheduledTasks.length === 0 && (
                      <div className="col-span-full text-center py-12 text-gray-500">
                        No scheduled tasks found.
                      </div>
                    )}
                  </div>
                 </ScrollArea>
              )}
            </div>

            {/* Sidebar - Collapsible or stacked on mobile */}
            <div className="hidden lg:flex flex-col gap-6 w-80 shrink-0 overflow-hidden h-full">
               
              {/* Unscheduled Tasks */}
              <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"/>
                    Unscheduled
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{unscheduledTasks.length}</span>
                  </h2>
                </div>
                
                <ScrollArea className="flex-1 bg-gray-100/50 rounded-lg border border-gray-200">
                  <DroppableUnscheduled>
                    <div className="flex flex-col gap-2 min-h-[100px] p-2">
                      {unscheduledTasks.map(task => (
                        <DraggableAppTask key={task.id} task={task}>
                          <TaskCard
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onEdit={handleEdit}
                          />
                        </DraggableAppTask>
                      ))}
                      {unscheduledTasks.length === 0 && (
                        <div className="text-center py-8 text-sm text-gray-500">
                          No unscheduled tasks
                        </div>
                      )}
                    </div>
                  </DroppableUnscheduled>
                </ScrollArea>
              </div>

              {/* Completed Tasks */}
              <div className="flex flex-col gap-3 flex-1 min-h-0">
                <div className="flex items-center justify-between shrink-0">
                  <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-green-500"/>
                     Completed
                     <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{allCompletedTasks.length}</span>
                  </h2>
                </div>
                
                <ScrollArea className="flex-1 bg-gray-100/50 rounded-lg border border-gray-200">
                  <div className="flex flex-col gap-2 p-2">
                    {allCompletedTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={(id) => {
                           // If it's a virtual recurring completion, we need to toggle the original task
                           // The ID is formatted as `taskId-dateStr`
                           // We use id here to avoid lint warning about unused parameter, though we use task.id
                           const toggleId = id || task.id; // Just to use it
                           if (toggleId.includes('-')) {
                             const [originalId, dateStr] = toggleId.split(/-(.+)/); // Split on first hyphen
                             toggleTask(originalId, dateStr);
                           } else {
                             toggleTask(toggleId);
                           }
                        }}
                        onDelete={(deleteId) => {
                           if (task.id.includes('-')) {
                             const [originalId] = task.id.split('-');
                             deleteTask(originalId);
                           } else {
                             deleteTask(deleteId);
                           }
                        }}
                        onEdit={handleEdit}
                      />
                    ))}
                    {allCompletedTasks.length === 0 && (
                      <div className="text-center py-8 text-sm text-gray-500">
                        No completed tasks yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

            </div>
          </div>
        </main>

        {/* Mobile FAB */}
        <button
          onClick={() => { setEditingTask(null); setIsFormOpen(true); }}
          className="fixed bottom-6 right-6 h-14 w-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center sm:hidden hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 z-20"
        >
          <Plus size={24} />
        </button>

        {/* Modal Overlay */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg animate-in fade-in zoom-in duration-200">
              <TaskForm
                initialData={editingTask || undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => { setIsFormOpen(false); setEditingTask(null); }}
              />
            </div>
          </div>
        )}

        {/* Drag Overlay Portal */}
        {createPortal(
          <DragOverlay>
            {activeDragTask ? (
              <div className="opacity-80 rotate-2 cursor-grabbing w-[300px]">
                 <TaskCard
                    task={activeDragTask}
                    onToggle={() => {}}
                    onDelete={() => {}}
                    onEdit={() => {}}
                  />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </div>
    </DndContext>
  );
}

export default App;
