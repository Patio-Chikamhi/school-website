// src/components/admin/TimetableManagement.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Save, Plus, X, Loader, BookOpen, User } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00'];

const TimetableManagement = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // The schedule state
  const [schedule, setSchedule] = useState({});
  
  // Modal state for assigning a slot
  const [activeSlot, setActiveSlot] = useState(null); // { day: 'Monday', time: '08:00 - 09:00' }
  const [selectedCourse, setSelectedCourse] = useState('');

  // 1. Fetch available classes and courses
  useEffect(() => {
    const fetchClasses = async () => {
      const q = query(collection(db, 'courses'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const uniqueClasses = new Set();
      snap.forEach(doc => {
        if (doc.data().grade) uniqueClasses.add(doc.data().grade);
      });
      setClasses(Array.from(uniqueClasses).sort());
    };
    fetchClasses();
  }, []);

  // 2. Fetch courses for the selected class + load existing timetable
  useEffect(() => {
    if (!selectedClass) return;
    
    const fetchTimetableData = async () => {
      setLoading(true);
      try {
        // A. Fetch courses taught in this class
        const q = query(collection(db, 'courses'), where('grade', '==', selectedClass));
        const snap = await getDocs(q);
        const courseList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setCourses(courseList);

        // B. Fetch existing timetable doc
        const timetableRef = doc(db, 'timetables', selectedClass.replace(/\s+/g, '-'));
        const timetableDoc = await getDoc(timetableRef);
        
        if (timetableDoc.exists()) {
          setSchedule(timetableDoc.data().schedule || {});
        } else {
          setSchedule({});
        }
      } catch (error) {
        console.error("Error fetching timetable:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimetableData();
  }, [selectedClass]);

  // 3. Handle saving a slot
  const handleAssignSlot = () => {
    if (!selectedCourse) return;
    const course = courses.find(c => c.id === selectedCourse);
    if (!course) return;

    const teacherName = course.teacherNames?.[0] || course.teacherName || 'Unassigned';
    const teacherId = course.teacherIds?.[0] || course.teacherId || '';

    setSchedule(prev => ({
      ...prev,
      [activeSlot.day]: {
        ...(prev[activeSlot.day] || {}),
        [activeSlot.time]: {
          courseId: course.id,
          subject: course.subject || course.courseName,
          teacherId: teacherId,
          teacherName: teacherName,
          room: course.schedule?.room || 'TBD'
        }
      }
    }));
    
    setActiveSlot(null);
    setSelectedCourse('');
  };

  // 4. Handle removing a slot
  const handleRemoveSlot = (day, time) => {
    setSchedule(prev => {
      const newDay = { ...(prev[day] || {}) };
      delete newDay[time];
      return { ...prev, [day]: newDay };
    });
  };

  // 5. Save to Firestore
  const saveTimetable = async () => {
    setSaving(true);
    try {
      const docId = selectedClass.replace(/\s+/g, '-');
      await setDoc(doc(db, 'timetables', docId), {
        className: selectedClass,
        grade: selectedClass,
        schedule: schedule,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      alert('✅ Timetable saved successfully!');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save timetable.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable Scheduler</h1>
          <p className="text-gray-600 mt-1">Map teachers and subjects to specific time slots.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-medium bg-white"
          >
            <option value="">Select a Class...</option>
            {classes.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          
          <button
            onClick={saveTimetable}
            disabled={saving || !selectedClass}
            className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Timetable
          </button>
        </div>
      </div>

      {!selectedClass ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Select a Class</h3>
          <p className="text-gray-500">Choose a class above to build or edit its weekly schedule.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12"><Loader className="w-8 h-8 animate-spin text-emerald-600" /></div>
      ) : (
        /* THE GRID */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse">
            <thead>
              <tr>
                <th className="w-32 bg-gray-50 border-b border-r border-gray-200 p-4 text-sm font-semibold text-gray-600">Time</th>
                {DAYS.map(day => (
                  <th key={day} className="bg-gray-50 border-b border-gray-200 p-4 text-sm font-semibold text-gray-900 text-center">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map(time => (
                <tr key={time}>
                  <td className="bg-gray-50 border-r border-b border-gray-200 p-3 text-xs font-medium text-gray-600 text-center whitespace-nowrap">
                    {time}
                  </td>
                  {DAYS.map(day => {
                    const slotData = schedule[day]?.[time];
                    return (
                      <td key={`${day}-${time}`} className="border-b border-gray-200 p-1 h-24 align-top">
                        {slotData ? (
                          <div className="h-full bg-emerald-50 border border-emerald-100 rounded-lg p-2 relative group flex flex-col justify-center items-center text-center">
                            <span className="font-bold text-emerald-800 text-sm">{slotData.subject}</span>
                            <span className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                              <User className="w-3 h-3" /> {slotData.teacherName}
                            </span>
                            <button
                              onClick={() => handleRemoveSlot(day, time)}
                              className="absolute top-1 right-1 p-1 bg-white text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setActiveSlot({ day, time })}
                            className="w-full h-full rounded-lg border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 flex items-center justify-center transition-colors text-gray-400 hover:text-emerald-600"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGN MODAL */}
      {activeSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Assign Lesson</h3>
            <p className="text-sm text-gray-500 mb-4">
              {activeSlot.day} at {activeSlot.time} for {selectedClass}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">Select Subject & Teacher</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 mb-6"
            >
              <option value="">Choose a subject...</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.courseName} ({course.teacherNames?.[0] || 'No teacher'})
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button onClick={() => setActiveSlot(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleAssignSlot} disabled={!selectedCourse} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                Assign Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableManagement;