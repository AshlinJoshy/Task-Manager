import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { Plus, Trash2, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../hooks/useTasks';

interface ProjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProjectSelect: React.FC<ProjectSelectProps> = ({ value, onChange }) => {
  const { projects, addProject, deleteProject } = useTasks();
  const [isOpen, setIsOpen] = useState(false);
  const [newProject, setNewProject] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddProject = () => {
    if (newProject.trim()) {
      addProject(newProject.trim());
      onChange(newProject.trim());
      setNewProject('');
    }
  };

  const handleDeleteProject = (e: React.MouseEvent, project: string) => {
    e.stopPropagation();
    deleteProject(project);
    if (value === project) {
      onChange('');
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer",
          isOpen && "ring-2 ring-blue-500 ring-offset-2 border-blue-500"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || "Select project..."}
        </span>
        <ChevronDown size={16} className="text-gray-500" />
      </div>

      {isOpen && (
        <div 
          className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-2 border-b border-gray-100 flex gap-1">
            <Input
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              placeholder="New project..."
              className="h-8 text-sm text-gray-900"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddProject();
                }
              }}
              autoFocus
            />
            <Button size="sm" onClick={handleAddProject} disabled={!newProject.trim()} className="px-2">
              <Plus size={16} />
            </Button>
          </div>
          
          <div className="max-h-60 overflow-y-auto py-1">
            <div
              className={cn(
                "flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer",
                value === '' && "bg-blue-50 text-blue-700"
              )}
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              <span>No Project</span>
              {value === '' && <Check size={14} />}
            </div>
            
            {projects.map((project) => (
              <div
                key={project}
                className={cn(
                  "group flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer",
                  value === project && "bg-blue-50 text-blue-700"
                )}
                onClick={() => {
                  onChange(project);
                  setIsOpen(false);
                }}
              >
                <span>{project}</span>
                <div className="flex items-center gap-2">
                   {value === project && <Check size={14} />}
                   <button 
                     onClick={(e) => handleDeleteProject(e, project)}
                     className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded"
                   >
                     <Trash2 size={14} />
                   </button>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="px-3 py-4 text-xs text-center text-gray-500 italic">
                No projects created yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
