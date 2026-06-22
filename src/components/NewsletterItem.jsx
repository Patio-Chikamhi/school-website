// components/NewsletterItem.jsx - FIXED VIEW INCREMENT
import { useState, useRef, useEffect } from 'react';
import { Newspaper, ExternalLink, ChevronDown, ChevronUp, Trash2, Eye } from 'lucide-react';

const NewsletterItem = ({ 
  item, 
  isExpanded, 
  onToggle, 
  onViewFull, 
  onDelete,
  onIncrementViews 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [localViews, setLocalViews] = useState(item.views || 0);
  const [hasViewedSummary, setHasViewedSummary] = useState(false);
  const [isUpdatingViews, setIsUpdatingViews] = useState(false);
  const [isContentClipped, setIsContentClipped] = useState(false);
  const contentRef = useRef(null);

  // Update local views when item.views prop changes
  useEffect(() => {
    setLocalViews(item.views || 0);
  }, [item.views]);

  // Check if content is actually being clipped
  useEffect(() => {
    if (contentRef.current && !isExpanded) {
      const element = contentRef.current;
      const isClipped = element.scrollHeight > element.clientHeight;
      setIsContentClipped(isClipped);
    } else {
      setIsContentClipped(false);
    }
  }, [isExpanded, item.summary, item.content]);

  // Handler functions
  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!onDelete || !window.confirm('Delete this newsletter?')) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFullNewsletter = async (e) => {
    e.stopPropagation();
    await incrementViews('full');
    onViewFull?.();
  };

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (!isExpanded && !hasViewedSummary) {
      // Only increment when expanding and hasn't viewed summary yet
      await incrementViews('summary');
    }
    onToggle?.();
  };

  const incrementViews = async (type = 'summary') => {
    // Prevent duplicate increments
    if (type === 'summary' && hasViewedSummary) {
      console.log('Already viewed summary, skipping increment');
      return;
    }
    
    // Immediate UI feedback
    const newViews = localViews + 1;
    setLocalViews(newViews);
    setIsUpdatingViews(true);
    
    if (type === 'summary') {
      setHasViewedSummary(true);
    }
    
    try {
      // Call parent to update database
      if (onIncrementViews) {
        await onIncrementViews(type, newViews);
      }
    } catch (error) {
      console.error('Failed to increment views:', error);
      // Rollback on error
      setLocalViews(localViews);
      if (type === 'summary') setHasViewedSummary(false);
    } finally {
      setIsUpdatingViews(false);
    }
    
    console.log(`Incremented views for ${type}, new count: ${newViews}`);
  };

  const formatDate = (date) => {
    if (!date) return 'Date not available';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return dateObj.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Content handling
  const summary = item.summary || '';
  const fullContent = item.content || item.summary || 'No content available';
  const hasMoreContent = fullContent && fullContent.length > summary.length;

  const renderContent = (content) => {
    if (!content) return <p className="text-gray-400 italic">No content available</p>;
    
    if (/<[a-z][\s\S]*>/i.test(content)) {
      return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
    
    return content.split('\n').map((line, i) => (
      <p key={i} className="mb-2 last:mb-0">{line || <br />}</p>
    ));
  };

  return (
    <div className="bg-white border border-emerald-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header */}
      <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Newsletter
            </span>
            {/*item.issue && (
              <span className="ml-auto text-xs text-emerald-600 bg-white px-2 py-1 rounded border border-emerald-200">
                Issue #{item.issue}
              </span>
            )*/}
          </div>
          
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-1 text-red-500 transition-colors rounded-full hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              title="Delete newsletter"
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="mb-1 text-xs font-medium text-gray-500">
          {formatDate(item.publishDate || item.date)}
        </p>

        <h4 className="mb-3 text-lg font-bold text-gray-900">{item.title}</h4>

        {/* Newsletter Content */}
        <div className="relative mb-4 text-sm text-gray-600">
          <div className="max-w-none prose prose-sm">
            <div 
              ref={contentRef}
              className={`transition-all duration-300 ease-in-out ${
                isExpanded ? '' : 'max-h-[72px] overflow-hidden'
              }`}
            >
              {renderContent(isExpanded ? fullContent : summary)}
            </div>
            
            {/* Only show fade if content is actually being clipped */}
            {!isExpanded && isContentClipped && (
              <div className="h-6 -mt-6 relative bg-gradient-to-t from-white via-white/80 to-transparent" />
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            {/* Expand/Collapse Button */}
            {hasMoreContent && (
              <button
                onClick={handleToggle}
                disabled={isUpdatingViews}
                className="flex items-center gap-1 text-sm font-medium transition-colors text-emerald-600 hover:text-emerald-800 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    {isUpdatingViews ? (
                      <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                    )}
                    Read More
                  </>
                )}
              </button>
            )}

            {/* Full Newsletter Link */}
            <button
              onClick={handleFullNewsletter}
              disabled={isUpdatingViews}
              className="flex items-center gap-1 text-sm font-medium transition-colors text-gray-600 hover:text-gray-900 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="w-3 h-3" />
              Full Newsletter
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4">
            {item.pages && (
              <span className="text-xs text-gray-500">
                {item.pages} pages
              </span>
            )}
            
            <span className="flex items-center gap-1 text-xs text-gray-500">
              {isUpdatingViews ? (
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className={`font-medium ${hasViewedSummary ? 'text-emerald-600' : ''}`}>
                {localViews} {localViews === 1 ? 'view' : 'views'}
              </span>
              {hasViewedSummary && !isExpanded && (
                <span className="text-xs text-emerald-500">(viewed)</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsletterItem;