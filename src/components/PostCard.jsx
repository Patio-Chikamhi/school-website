import React from 'react';
import { 
  Calendar, User, Eye, ChevronRight, 
  Megaphone, Newspaper, CalendarDays, Trophy 
} from 'lucide-react';

const PostCard = ({ post, onView, onDelete, canDelete = false }) => {
  const getCategoryInfo = (category) => {
    switch(category) {
      case 'announcement':
        return { icon: <Megaphone className="w-4 h-4" />, color: 'bg-blue-100 text-blue-800' };
      case 'newsletter':
        return { icon: <Newspaper className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-800' };
      case 'event':
        return { icon: <CalendarDays className="w-4 h-4" />, color: 'bg-purple-100 text-purple-800' };
      case 'achievement':
        return { icon: <Trophy className="w-4 h-4" />, color: 'bg-yellow-100 text-yellow-800' };
      default:
        return { icon: null, color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'urgent':
        return 'border-red-500';
      case 'normal':
        return 'border-gray-300';
      case 'low':
        return 'border-gray-200';
      default:
        return 'border-gray-300';
    }
  };

  const categoryInfo = getCategoryInfo(post.category);
  const priorityColor = getPriorityColor(post.priority);

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const d = date?.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 ${priorityColor}`}>
      <div className="p-6">
        {/* Header with category and date */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
              {categoryInfo.icon}
              {post.category.charAt(0).toUpperCase() + post.category.slice(1)}
            </span>
            
            {post.priority === 'urgent' && (
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                URGENT
              </span>
            )}
            
            {post.isMonthly && post.category === 'newsletter' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                Monthly
              </span>
            )}
          </div>
          
          <span className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(post.date)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {post.title}
        </h3>

        {/* Summary */}
        {post.summary && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.summary}
          </p>
        )}

        {/* Event info (if applicable) */}
        {post.category === 'event' && post.eventDate && (
          <div className="mb-4 p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 text-purple-700">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {new Date(post.eventDate).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              {post.location && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>{post.location}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{post.author || 'Admin'}</span>
            </div>
            
            {post.views !== undefined && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.views} views</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {canDelete && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this post?')) {
                    onDelete(post.id);
                  }
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            )}
            
            <button
              onClick={() => onView && onView(post)}
              className="flex items-center text-emerald-600 hover:text-emerald-800 font-medium text-sm"
            >
              Read More
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostCard;