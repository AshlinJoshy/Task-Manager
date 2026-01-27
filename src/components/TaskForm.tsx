import React, { useState } from 'react';
import { type Task, type Priority } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { X } from 'lucide-react';

interface TaskFormProps {
  initialData?: Task;
  onSubmit: (data: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedDate'>) => void;
  onCancel: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [priority, setPriority] = useState<Priority>(initialData?.priority || 'Medium');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [projectName, setProjectName] = useState(initialData?.projectName || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      projectName: projectName || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 bg-white rounded-lg border shadow-sm">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <Select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="Constant">Constant</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <Input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
          <Input 
            value={projectName} 
            onChange={(e) => setProjectName(e.target.value)} 
            placeholder="e.g. Website Redesign" 
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update Task' : 'Create Task'}</Button>
      </div>
    </form>
  );
};
