// src/components/dashboard/StatsCard.jsx
import React, { useState } from 'react';
import { ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend = null, 
  subtitle, 
  color = 'from-emerald-500 to-emerald-600',
  details = [],
  onClick
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  return (
    <div 
      className={`bg-gradient-to-br ${color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${onClick ? 'hover:shadow-2xl' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          
          {trend !== null && (
            <div className="flex items-center mt-3">
              {trend > 0 ? (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <span className="text-sm">+{trend}% from last month</span>
                </>
              ) : trend < 0 ? (
                <>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  <span className="text-sm">{trend}% from last month</span>
                </>
              ) : (
                <span className="text-sm opacity-80">No change</span>
              )}
            </div>
          )}
          
          {subtitle && (
            <p className="text-sm opacity-80 mt-2">{subtitle}</p>
          )}
        </div>
        
        <div className="relative">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8" />
          </div>
          
          {details.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetails(!showDetails);
              }}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <ChevronDown className={`w-4 h-4 text-gray-700 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>
      
      {showDetails && details.length > 0 && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <div className="space-y-3">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="opacity-90">{detail.label}</span>
                <span className="font-semibold">{detail.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};