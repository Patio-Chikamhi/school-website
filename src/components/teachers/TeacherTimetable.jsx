// src/components/teachers/TeacherTimetable.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Loader, BookOpen } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '14:00 - 15:00', '15:00 - 16:00'];

const TeacherTimetable = ({ teacherId, teacherCourses }) => {
  const [loading, setLoading] = useState(true);
  const [teacherSchedule, setTeacherSchedule] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    const buildTeacherSchedule = async () => {
      if (!teacherId || !teacherCourses || teacherCourses.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Get unique classes this teacher teaches
        const teacherGrades = [...new Set(teacherCourses.map(c => c.grade).filter(Boolean))];
        
        if (teacherGrades.length === 0) {
          setLoading(false);
          return;
        }

        // 2. Fetch the timetable for each class
        const scheduleData = {};
        
        for (const grade of teacherGrades) {
          const docId = grade.replace(/\s+/g, '-');
          const timetableRef = doc(db, 'timetables', docId);
          const timetableSnap = await getDoc(timetableRef);

          if (timetableSnap.exists()) {
            const data = timetableSnap.data();
            const classSchedule = data.schedule || {};

            // 3. Loop through the class schedule and extract only THIS teacher's slots
            Object.entries(classSchedule).forEach(([day, times]) => {
              Object.entries(times).forEach(([time, slot]) => {
                // If the teacher ID matches, add to their personal schedule
                if (slot.teacherId === teacherId) {
                  if (!scheduleData[day]) scheduleData[day] = {};
                  scheduleData[day][time] = {
                    ...slot,
                    className: grade // Add the class name so they know where to go
                  };
                }
              });
            });
          }
        }

        setTeacherSchedule(scheduleData);
      } catch (error) {
        console.error('Error building teacher schedule:', error);
      } finally {
        setLoading(false);
      }
    };

    buildTeacherSchedule();
  }, [teacherId, teacherCourses]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (teacherCourses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Courses Assigned</h3>
        <p className="text-gray-500">You need to be assigned to courses before your timetable can be generated.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Timetable</h1>
          <p className="text-gray-600 mt-1">Your weekly teaching schedule.</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {Object.keys(teacherSchedule).length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Timetable Set</h3>
          <p className="text-gray-500">The admin hasn't scheduled your classes yet.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
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
                    const slot = teacherSchedule[day]?.[time];
                    return (
                      <td key={`${day}-${time}`} className="border-b border-gray-200 p-1 h-24 align-top">
                        {slot ? (
                          <div className="h-full bg-blue-50 border border-blue-100 rounded-lg p-2 flex flex-col justify-center items-center text-center">
                            <span className="font-bold text-blue-900 text-sm">{slot.subject}</span>
                            <span className="text-xs text-blue-700 font-medium mt-1">{slot.className}</span>
                            <span className="text-[10px] text-blue-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {slot.room}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-50/50 rounded-lg flex items-center justify-center">
                            <span className="text-xs text-gray-300">Free</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="space-y-4">
          {DAYS.map(day => {
            const daySchedule = teacherSchedule[day];
            if (!daySchedule || Object.keys(daySchedule).length === 0) return null;

            return (
              <div key={day} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <h3 className="font-bold text-gray-900">{day}</h3>
                </div>
                <div className="divide-y divide-gray-100">
                  {Object.entries(daySchedule)
                    .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
                    .map(([time, slot]) => (
                      <div key={time} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50">
                        <div className="flex items-center gap-4">
                          <div className="w-24 flex items-center gap-1.5 text-sm font-medium text-gray-600">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {time.split(' - ')[0]}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{slot.subject}</div>
                            <div className="text-sm text-gray-500">{slot.className}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg w-fit">
                          <MapPin className="w-4 h-4" />
                          {slot.room}
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;