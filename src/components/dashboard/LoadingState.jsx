// src/components/dashboard/LoadingState.jsx
import React from 'react';
import { Loader } from 'lucide-react';

export const LoadingState = ({ message = 'Loading...', type = 'spinner', size = 'lg' }) => {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-base' },
    md: { icon: 'w-12 h-12', text: 'text-lg' },
    lg: { icon: 'w-16 h-16', text: 'text-xl' }
  };

  if (type === 'skeleton') {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 rounded-2xl mt-6"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <div className={`${sizes[size].icon} border-4 border-emerald-100 rounded-full`}></div>
        <div className={`${sizes[size].icon} border-4 border-emerald-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0`}></div>
      </div>
      <h3 className={`${sizes[size].text} font-semibold text-gray-900 mt-6 mb-2`}>{message}</h3>
      <p className="text-gray-500 text-center max-w-md">
        Please wait while we fetch your data...
      </p>
      <div className="mt-8 flex space-x-2">
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  );
};