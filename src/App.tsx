import { useState } from 'react';
import { useTasks } from './hooks/useTasks';
import { WeekView } from './components/WeekView';
import { TaskCard } from './components/TaskCard';
import { TaskForm } from './components/TaskForm';
import { Button } from './components/ui/Button';
import { Plus, LayoutGrid, List, CheckSquare } from 'lucide-react';
import { type Task } from './types';
import { cn } from './lib/utils';
import { ScrollArea } from './components/ui/ScrollArea';

function App() {
  const { tasks, addTask, toggleTask, updateTask, deleteTask } = useTasks();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [view, setView] = useState<'week' | 'list'>('week');

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  
  const unscheduledTasks = activeTasks.filter(t => !t.dueDate && !t.recurrence);
  const scheduledTasks = tasks.filter(t => (t.dueDate || t.recurrence) && !t.completed);

  // Sort unscheduled by priority
  unscheduledTasks.sort((a, b) => {
    const priorities = { Constant: 0, High: 1, Medium: 2, Low: 3 };
    return priorities[a.priority] - priorities[b.priority];
  });
  
  // Sort completed by completed date (desc)
  completedTasks.sort((a, b) => {
    return new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime();
  });

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
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

  const handleTaskMove = (taskId: string, newDate: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (task && !task.recurrence) {
      // Adjust date to preserve time or just set to date part?
      // Our dates are usually YYYY-MM-DD strings or ISO.
      // The current system uses strings effectively as dates.
      // Let's assume newDate is set to the correct day.
      const dateStr = newDate.toISOString();
      updateTask(taskId, { dueDate: dateStr });
    }
  };

  return (
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

      <main className="flex-1 w-full px-4 py-4 sm:py-6 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-6 overflow-hidden min-w-0">
            {view === 'week' ? (
              <ScrollArea className="flex-1 pb-4">
                 <WeekView 
                  tasks={scheduledTasks}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onEdit={handleEdit}
                  onTaskMove={handleTaskMove}
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
          <div className="hidden lg:flex flex-col gap-6 w-80 shrink-0 overflow-hidden">
             
            {/* Unscheduled Tasks */}
            <div className="flex flex-col gap-3 min-h-[300px] flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400"/>
                  Unscheduled
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{unscheduledTasks.length}</span>
                </h2>
              </div>
              
              <ScrollArea className="flex-1 bg-gray-100/50 rounded-lg p-2 border border-gray-200">
                <div className="flex flex-col gap-2">
                  {unscheduledTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={handleEdit}
                    />
                  ))}
                  {unscheduledTasks.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      No unscheduled tasks
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Completed Tasks */}
            <div className="flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-green-500"/>
                   Completed
                   <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">{completedTasks.length}</span>
                </h2>
              </div>
              
              <ScrollArea className="flex-1 bg-gray-100/50 rounded-lg p-2 border border-gray-200">
                <div className="flex flex-col gap-2">
                  {completedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onEdit={handleEdit}
                    />
                  ))}
                  {completedTasks.length === 0 && (
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
    </div>
  );
}

export default App;
