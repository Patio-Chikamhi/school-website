import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  Bell,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  BookOpen,
  Home,
  School,
  Award,
  FileText,
  User
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const CalendarView = ({ userType, userId, showActions = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'academic', 'exam', 'holiday', 'event'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    type: 'academic',
    color: '#3b82f6', // blue
    location: '',
    participants: '',
    reminder: false,
    reminderTime: '15',
    attachments: [],
    recurring: 'none', // 'none', 'daily', 'weekly', 'monthly', 'yearly'
    courseId: '',
    teacherId: '',
    gradeLevel: '',
    importance: 'medium' // 'low', 'medium', 'high'
  });

  // Fetch events based on user type
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        let eventsQuery;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Base query for all events in current month
        eventsQuery = query(
          collection(db, 'calendarEvents'),
          where('startDate', '>=', startOfMonth),
          where('startDate', '<=', endOfMonth),
          orderBy('startDate', 'asc')
        );
        
        // Apply user-specific filters
        if (userType === 'student') {
          // Students see events for their grade level and general events
          eventsQuery = query(
            collection(db, 'calendarEvents'),
            where('startDate', '>=', startOfMonth),
            where('startDate', '<=', endOfMonth),
            orderBy('startDate', 'asc')
          );
        } else if (userType === 'teacher') {
          // Teachers see their own events and general events
          eventsQuery = query(
            collection(db, 'calendarEvents'),
            where('startDate', '>=', startOfMonth),
            where('startDate', '<=', endOfMonth),
            orderBy('startDate', 'asc')
          );
        }
        
        const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
          const eventsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              startDate: data.startDate?.toDate?.() || new Date(data.startDate),
              endDate: data.endDate?.toDate?.() || new Date(data.endDate),
              createdAt: data.createdAt?.toDate?.() || new Date()
            };
          });
          
          setEvents(eventsData);
          setLoading(false);
        });
        
        return () => unsubscribe();
        
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [userType, userId, currentDate]);

  // Navigation functions
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    // Filter by type
    if (filter !== 'all' && event.type !== filter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !event.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Get events for current month
  const getMonthEvents = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.getDate() === day && 
               eventDate.getMonth() === month && 
               eventDate.getFullYear() === year;
      });
      
      days.push({
        date,
        day,
        events: dayEvents,
        isToday: date.toDateString() === new Date().toDateString(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6
      });
    }
    
    return days;
  };

  // Get upcoming events (next 7 days)
  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return filteredEvents
      .filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, 5);
  };

  // Event type colors
  const getEventColor = (type) => {
    const colors = {
      academic: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
      exam: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      holiday: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
      event: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
      meeting: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
      deadline: { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
      default: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' }
    };
    
    return colors[type] || colors.default;
  };

  // Handle add event
  const handleAddEvent = async () => {
    try {
      const eventData = {
        ...formData,
        startDate: Timestamp.fromDate(new Date(formData.startDate + 'T' + formData.startTime)),
        endDate: Timestamp.fromDate(new Date(formData.endDate + 'T' + formData.endTime)),
        createdBy: userId,
        userType: userType,
        createdAt: Timestamp.now(),
        participants: formData.participants ? formData.participants.split(',').map(p => p.trim()) : [],
        attachments: [],
        status: 'active'
      };
      
      await addDoc(collection(db, 'calendarEvents'), eventData);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        type: 'academic',
        color: '#3b82f6',
        location: '',
        participants: '',
        reminder: false,
        reminderTime: '15',
        attachments: [],
        recurring: 'none',
        courseId: '',
        teacherId: '',
        gradeLevel: '',
        importance: 'medium'
      });
      
      setShowAddModal(false);
      alert('Event added successfully!');
      
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteDoc(doc(db, 'calendarEvents', eventId));
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event.');
    }
  };

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">School Calendar</h1>
          <p className="text-gray-600 mt-1">
            View academic events, exams, holidays, and important dates
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-gray-300 rounded-lg">
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 border-r"
            >
              Today
            </button>
            <button
              onClick={goToPrevious}
              className="p-2 hover:bg-gray-100 border-r"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToNext}
              className="p-2 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <select
              value={view}
              onChange={(e) => setView(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50"
            >
              <option value="month">Month View</option>
              <option value="week">Week View</option>
              <option value="day">Day View</option>
            </select>
          </div>
          
          {showActions && userType === 'admin' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:bg-gray-50"
              >
                <option value="all">All Events</option>
                <option value="academic">Academic</option>
                <option value="exam">Exams</option>
                <option value="holiday">Holidays</option>
                <option value="event">Events</option>
                <option value="meeting">Meetings</option>
                <option value="deadline">Deadlines</option>
              </select>
              <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            
            <button className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Calendar View */}
        {view === 'month' ? (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {/* Month Header */}
            <div className="bg-gray-50 border-b border-gray-200 p-4">
              <h2 className="text-xl font-bold text-gray-900 text-center">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
            </div>
            
            {/* Days of Week */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7">
              {getMonthEvents().map((dayData, index) => (
                <div 
                  key={index}
                  className={`min-h-32 border border-gray-100 p-2 ${
                    dayData.isWeekend ? 'bg-gray-50' : 'bg-white'
                  } ${dayData.isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium text-sm ${
                      dayData.isToday 
                        ? 'bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                        : dayData.isWeekend 
                          ? 'text-gray-500' 
                          : 'text-gray-900'
                    }`}>
                      {dayData.day}
                    </span>
                    {dayData.isToday && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    {dayData.events.slice(0, 3).map((event, idx) => {
                      const color = getEventColor(event.type);
                      return (
                        <div 
                          key={idx}
                          className={`text-xs p-1.5 rounded border ${color.bg} ${color.text} ${color.border} truncate cursor-pointer hover:opacity-90`}
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEditModal(true);
                          }}
                          title={`${event.title} - ${formatTime(new Date(event.startDate))}`}
                        >
                          <div className="flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${color.text.replace('text-', 'bg-')}`}></div>
                            <span className="truncate">{event.title}</span>
                          </div>
                          {event.startTime && (
                            <div className="text-xs opacity-75 mt-0.5">
                              {formatTime(new Date(event.startDate))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {dayData.events.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayData.events.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === 'week' ? (
          <div className="text-center p-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Week view coming soon...</p>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-500">
            <CalendarIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Day view coming soon...</p>
          </div>
        )}

        {/* Upcoming Events Sidebar */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Events for {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            {filteredEvents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No events found for this month</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredEvents.slice(0, 10).map(event => {
                  const color = getEventColor(event.type);
                  return (
                    <div 
                      key={event.id}
                      className="border border-gray-200 rounded-xl p-4 hover:border-emerald-300 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEditModal(true);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${color.bg} ${color.text} ${color.border}`}>
                              {event.type}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(new Date(event.startDate))}
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-gray-900">{event.title}</h4>
                          {event.description && (
                            <p className="text-gray-600 mt-1 text-sm">{event.description}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                            {event.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(new Date(event.startDate))}
                                {event.endTime && ` - ${formatTime(new Date(event.endDate))}`}
                              </span>
                            )}
                            
                            {event.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {event.location}
                              </span>
                            )}
                            
                            {event.participants && event.participants.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {event.participants.length} participants
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {showActions && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEvent(event);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            
            {getUpcomingEvents().length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-gray-500">No upcoming events</p>
                <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {getUpcomingEvents().map(event => {
                  const color = getEventColor(event.type);
                  const eventDate = new Date(event.startDate);
                  const today = new Date();
                  const diffDays = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={event.id} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg}`}>
                          <CalendarIcon className={`w-5 h-5 ${color.text}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-sm truncate">{event.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {eventDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            {event.startTime && (
                              <span className="text-xs text-gray-500">
                                • {formatTime(eventDate)}
                              </span>
                            )}
                          </div>
                          <div className="mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                              {diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `In ${diffDays} days`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Event Type Legend */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Event Types</h4>
              <div className="space-y-2">
                {[
                  { type: 'academic', label: 'Academic' },
                  { type: 'exam', label: 'Exams' },
                  { type: 'holiday', label: 'Holidays' },
                  { type: 'event', label: 'Events' },
                  { type: 'meeting', label: 'Meetings' },
                  { type: 'deadline', label: 'Deadlines' }
                ].map(item => {
                  const color = getEventColor(item.type);
                  return (
                    <div key={item.type} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color.text.replace('text-', 'bg-')}`}></div>
                      <span className="text-sm text-gray-600">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal (Admin only) */}
      {showAddModal && userType === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Event</h2>
                <p className="text-sm text-gray-500">Schedule a new calendar event</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Midterm Exams, Parent-Teacher Conference"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Brief description of the event..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type *
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="academic">Academic</option>
                      <option value="exam">Exam</option>
                      <option value="holiday">Holiday</option>
                      <option value="event">Event</option>
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Importance Level
                    </label>
                    <select
                      value={formData.importance}
                      onChange={(e) => setFormData({...formData, importance: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Main Auditorium, Room 101"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.participants}
                    onChange={(e) => setFormData({...formData, participants: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="e.g., Grade 12 Students, Teachers, Parents"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="reminder"
                    checked={formData.reminder}
                    onChange={(e) => setFormData({...formData, reminder: e.target.checked})}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="reminder" className="ml-2 text-sm text-gray-700">
                    Send reminder notifications
                  </label>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddEvent}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                <p className="text-sm text-gray-500">
                  {formatDate(new Date(selectedEvent.startDate))}
                </p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XCircle className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventColor(selectedEvent.type).bg} ${getEventColor(selectedEvent.type).text}`}>
                    {selectedEvent.type}
                  </span>
                  {selectedEvent.importance === 'high' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      High Priority
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900">{selectedEvent.title}</h3>
                
                {selectedEvent.description && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Clock className="w-5 h-5 text-gray-600" />
                    <div>
                      <div className="text-sm text-gray-500">Date & Time</div>
                      <div className="font-medium text-gray-900">
                        {formatDate(new Date(selectedEvent.startDate))}
                        {selectedEvent.startTime && ` • ${formatTime(new Date(selectedEvent.startDate))}`}
                        {selectedEvent.endTime && ` - ${formatTime(new Date(selectedEvent.endDate))}`}
                      </div>
                    </div>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="text-sm text-gray-500">Location</div>
                        <div className="font-medium text-gray-900">{selectedEvent.location}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedEvent.participants && selectedEvent.participants.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-2">Participants</div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.participants.map((participant, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white text-gray-700 rounded-full text-sm">
                          {participant}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-500">Created By</div>
                    <div className="font-medium text-gray-900">
                      {selectedEvent.createdBy || 'Administrator'}
                    </div>
                  </div>
                </div>
              </div>
              
              {showActions && userType === 'admin' && (
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEvent(null);
                    }}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Handle edit
                      console.log('Edit event:', selectedEvent.id);
                    }}
                    className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Event
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(selectedEvent.id)}
                    className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Event
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;