import React, { useState } from 'react';
import { type Task, type Priority, type DurationCategory } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { X, Repeat, Clock, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { ProjectSelect } from './ui/ProjectSelect';
import { useTasks } from '../hooks/useTasks';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const DAYS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const { projects, addProject } = useTasks();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'Medium');
  const [durationCategory, setDurationCategory] = useState<DurationCategory>(initialData?.durationCategory || 'short');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [projectName, setProjectName] = useState(initialData?.projectName || '');
  
  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(!!initialData?.recurrence);
  const [recurringDays, setRecurringDays] = useState<number[]>(initialData?.recurrence?.days || []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add project if it's new (handled by hook, but good for UX to ensure)
    if (projectName && !projects.includes(projectName)) {
      addProject(projectName);
    }

    const data: any = {
      title,
      description,
      priority,
      durationCategory,
      projectName: projectName || undefined,
    };

    if (isRecurring) {
      data.recurrence = {
        type: 'weekly',
        days: recurringDays.sort(),
      };
      // Recurring tasks don't have a single due date usually, but we keep structure flexible
      data.dueDate = undefined;
    } else {
      data.dueDate = dueDate || undefined;
      data.recurrence = undefined;
    }

    onSubmit(data);
  };

  const toggleDay = (day: number) => {
    setRecurringDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day) 
        : [...prev, day]
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white rounded-lg border shadow-sm max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">{initialData ? 'Edit Task' : 'New Task'}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <X size={16} />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <Input 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Task title" 
            required 
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
          <div className="flex gap-2 bg-gray-50 p-1 rounded-md border border-gray-200">
            <button
              type="button"
              onClick={() => setDurationCategory('short')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-sm font-medium transition-all",
                durationCategory === 'short'
                  ? "bg-white text-blue-600 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Zap size={14} /> Short Task
            </button>
            <button
              type="button"
              onClick={() => setDurationCategory('time-consuming')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded text-sm font-medium transition-all",
                durationCategory === 'time-consuming'
                  ? "bg-white text-purple-600 shadow-sm border border-gray-200"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Clock size={14} /> Time Consuming
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select 
              value={priority} 
              onChange={(e) => {
                const newPriority = e.target.value as Priority;
                setPriority(newPriority);
                // Auto-enable recurrence for Constant tasks if not set
                if (newPriority === 'Constant' && !isRecurring && !initialData) {
                  setIsRecurring(true);
                }
              }}
            >
              <option value="Constant">Constant</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <ProjectSelect 
              value={projectName} 
              onChange={setProjectName} 
            />
          </div>
        </div>

        {/* Recurrence Toggle */}
        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsRecurring(!isRecurring)}
            className={cn(
              "flex items-center gap-2 text-sm font-medium transition-colors",
              isRecurring ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Repeat size={16} />
            {isRecurring ? "Recurring Task" : "Set as Recurring"}
          </button>
        </div>

        {isRecurring ? (
          <div className="bg-blue-50/50 p-3 rounded-md border border-blue-100 space-y-2">
            <label className="block text-xs font-medium text-blue-800 uppercase tracking-wide">
              Repeat On
            </label>
            <div className="flex justify-between gap-1">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={cn(
                    "w-8 h-8 rounded-full text-xs font-medium transition-all flex items-center justify-center",
                    recurringDays.includes(day.value)
                      ? "bg-blue-600 text-white shadow-sm scale-105"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300"
                  )}
                >
                  {day.label}
                </button>
              ))}
            </div>
            {priority === 'Constant' && (
               <p className="text-xs text-blue-600 mt-2">
                 Constant tasks are great for building habits.
               </p>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
            />
          </div>
        )}

      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update Task' : 'Create Task'}</Button>
      </div>
    </form>
  );
};
