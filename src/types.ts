export type Priority = 'High' | 'Constant' | 'Medium' | 'Low';
export type TaskDuration = 'Short Task' | 'Time Consuming';

export interface Recurrence {
  type: 'weekly';
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  duration?: TaskDuration; // Made optional for backward compatibility
  dueDate?: string; // ISO date string YYYY-MM-DD
  completed: boolean; // For single tasks
  completedDate?: string; // ISO date string
  order?: number; // Custom ordering within priority segments
  
  // New fields for recurrence
  recurrence?: Recurrence;
  completions?: string[]; // Array of ISO date strings (YYYY-MM-DD) for recurring task completions
  
  createdAt: string; // ISO date string
  projectName?: string;
}
