import React, { useState } from 'react';
import { X, Calendar, Tag, AlertCircle } from 'lucide-react';

const PostForm = ({ onClose, onSave, initialData = {} }) => {
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    summary: initialData.summary || '',
    content: initialData.content || '',
    category: initialData.category || 'announcement',
    priority: initialData.priority || 'normal',
    tags: initialData.tags?.join(', ') || '',
    // Newsletter-specific
    isMonthly: initialData.isMonthly || false,
    issue: initialData.issue || '',
    // Event-specific
    eventDate: initialData.eventDate || '',
    location: initialData.location || '',
    ...initialData
  });

  const categories = [
    { value: 'announcement', label: 'Announcement', icon: '📢' },
    { value: 'newsletter', label: 'Newsletter', icon: '📰' },
    { value: 'event', label: 'Event', icon: '📅' },
    { value: 'achievement', label: 'Achievement', icon: '🏆' }
  ];

  const priorities = [
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' },
    { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-800' },
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const postData = {
      title: formData.title.trim(),
      summary: formData.summary.trim(),
      content: formData.content.trim(),
      category: formData.category,
      priority: formData.priority,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      date: new Date(),
      // Category-specific fields
      ...(formData.category === 'newsletter' && {
        isMonthly: formData.isMonthly,
        issue: formData.issue
      }),
      ...(formData.category === 'event' && {
        eventDate: formData.eventDate,
        location: formData.location
      })
    };

    const success = await onSave(postData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData.id ? 'Edit Post' : 'Create New Post'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      type="button"
                      key={cat.value}
                      onClick={() => setFormData({...formData, category: cat.value})}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        formData.category === cat.value
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-medium">{cat.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <div className="flex gap-2">
                  {priorities.map(pri => (
                    <button
                      type="button"
                      key={pri.value}
                      onClick={() => setFormData({...formData, priority: pri.value})}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.priority === pri.value
                          ? `${pri.color} border-2 border-current`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Newsletter-specific fields */}
            {formData.category === 'newsletter' && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Newsletter Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isMonthly"
                      checked={formData.isMonthly}
                      onChange={(e) => setFormData({...formData, isMonthly: e.target.checked})}
                      className="rounded"
                    />
                    <label htmlFor="isMonthly" className="text-sm text-gray-700">
                      Monthly Newsletter
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issue/Volume
                    </label>
                    <input
                      type="text"
                      value={formData.issue}
                      onChange={(e) => setFormData({...formData, issue: e.target.value})}
                      placeholder="e.g., March 2024, Vol. 3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Event-specific fields */}
            {formData.category === 'event' && (
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Event Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) => setFormData({...formData, eventDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="e.g., School Auditorium"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg"
                placeholder="Enter post title..."
                required
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary *
                <span className="text-gray-500 text-sm font-normal ml-2">
                  Brief preview shown in cards
                </span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData({...formData, summary: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                rows="3"
                placeholder="Brief summary..."
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
                <span className="text-gray-500 text-sm font-normal">
                  (comma separated)
                </span>
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                placeholder="sports, academics, event, etc."
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono"
                rows="10"
                placeholder="Full content here..."
                required
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
              >
                {initialData.id ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostForm;