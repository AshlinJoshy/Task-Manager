import { useState, useEffect } from 'react';
import { type Task } from '../types';
import { v4 as uuidv4 } from 'uuid';

const TASKS_STORAGE_KEY = 'task-manager-data';
const PROJECTS_STORAGE_KEY = 'task-manager-projects';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem(TASKS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  const [projects, setProjects] = useState<string[]>(() => {
    const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed' | 'completedDate'>) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      completed: false,
      completions: [],
      progress: 0,
    };
    setTasks((prev) => [...prev, newTask]);

    // Add project if it doesn't exist
    if (taskData.projectName && !projects.includes(taskData.projectName)) {
      setProjects(prev => [...prev, taskData.projectName!]);
    }
  };

  const toggleTask = (id: string, dateStr?: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;

        // If it's a recurring task and we have a specific date
        if (task.recurrence && dateStr) {
          const completions = task.completions || [];
          
          // Check if completion exists for this day (comparing just the date part YYYY-MM-DD)
          const datePart = dateStr.split('T')[0]; 
          
          const existingCompletionIndex = completions.findIndex(c => c.startsWith(datePart));
          
          let newCompletions;
          if (existingCompletionIndex >= 0) {
            // Remove it
            newCompletions = [...completions];
            newCompletions.splice(existingCompletionIndex, 1);
          } else {
            // Add new completion with current time
            const now = new Date();
            // dateStr from WeekView is YYYY-MM-DD
            // We want to store the completion date as YYYY-MM-DDTHH:mm:ss.sssZ
            // But we must ensure the DATE part matches dateStr.
            
            // If dateStr is just YYYY-MM-DD, we can use it to construct the date
            // If it is ISO, we extract date part.
            
            const completionDate = new Date(datePart);
            // Set time to now
            completionDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
            
            newCompletions = [...completions, completionDate.toISOString()];
          }

          return {
            ...task,
            completions: newCompletions,
          };
        }

        // Regular task toggle
        const isCompleted = !task.completed;
        return {
          ...task,
          completed: isCompleted,
          completedDate: isCompleted ? new Date().toISOString() : undefined,
          progress: isCompleted ? 100 : task.progress, // Max out progress if completed
        };
      })
    );
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
    
    // Add project if updated to a new one
    if (updates.projectName && !projects.includes(updates.projectName)) {
      setProjects(prev => [...prev, updates.projectName!]);
    }
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const addProject = (name: string) => {
    if (name && !projects.includes(name)) {
      setProjects(prev => [...prev, name]);
    }
  };
  
  const deleteProject = (name: string) => {
    setProjects(prev => prev.filter(p => p !== name));
  };

  return { 
    tasks, 
    projects,
    addTask, 
    toggleTask, 
    updateTask, 
    deleteTask,
    addProject,
    deleteProject
  };
}
