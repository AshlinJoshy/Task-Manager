export type Priority = 'High' | 'Constant' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate?: string; // ISO date string YYYY-MM-DD
  completed: boolean;
  completedDate?: string; // ISO date string
  createdAt: string; // ISO date string
  projectName?: string;
}
