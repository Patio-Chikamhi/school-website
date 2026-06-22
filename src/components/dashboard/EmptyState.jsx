// src/components/dashboard/EmptyState.jsx
import React from 'react';
import { FolderOpen, Users, BookOpen, FileText, MessageSquare, Plus } from 'lucide-react';

export const EmptyState = ({ 
  title = "No data found",
  message = "There's nothing to display here yet.",
  icon = 'folder',
  action,
  actionText = "Add New",
  size = 'md'
}) => {
  const icons = {
    folder: FolderOpen,
    users: Users,
    book: BookOpen,
    file: FileText,
    message: MessageSquare
  };
  
  const sizes = {
    sm: { icon: 'w-16 h-16', title: 'text-lg', message: 'text-sm' },
    md: { icon: 'w-24 h-24', title: 'text-xl', message: 'text-base' },
    lg: { icon: 'w-32 h-32', title: 'text-2xl', message: 'text-lg' }
  };
  
  const IconComponent = icons[icon] || FolderOpen;
  
  return (
    <div className="text-center py-12 px-4">
      <div className={`${sizes[size].icon} bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6`}>
        <IconComponent className={`${sizes[size].icon === 'w-16 h-16' ? 'w-8 h-8' : sizes[size].icon === 'w-24 h-24' ? 'w-12 h-12' : 'w-16 h-16'} text-gray-400`} />
      </div>
      <h3 className={`${sizes[size].title} font-bold text-gray-900 mb-3`}>{title}</h3>
      <p className={`${sizes[size].message} text-gray-600 max-w-md mx-auto mb-8`}>{message}</p>
      {action && (
        <button
          onClick={action}
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {actionText}
        </button>
      )}
    </div>
  );
};