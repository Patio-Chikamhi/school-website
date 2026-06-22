import React, { useState } from 'react';
import { Download, FileDown, Users, BookOpen, GraduationCap, Mail } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const CSVExport = ({ userRole }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState('students');

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    // Convert data to CSV format
    const headers = Object.keys(data[0]);
    const csvRows = [];
    
    // Add header row
    csvRows.push(headers.join(','));
    
    // Add data rows
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Handle special cases
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value)}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStudents = async () => {
    setIsExporting(true);
    try {
      const studentsSnapshot = await getDocs(collection(db, 'students'));
      const studentsData = studentsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          StudentID: data.studentId,
          FullName: data.fullName || data.name,
          FirstName: data.firstName,
          LastName: data.lastName,
          Grade: data.grade,
          Class: data.class || data.section,
          Email: data.email,
          ParentEmail: data.parentEmail,
          ParentPhone: data.parentPhone,
          DateOfBirth: data.dateOfBirth,
          Gender: data.gender,
          AdmissionYear: data.admissionYear,
          Status: data.enrollmentStatus || 'active',
          EnrollmentDate: data.enrollmentDate,
          CreatedAt: data.createdAt?.toDate?.().toISOString() || '',
          UpdatedAt: data.updatedAt?.toDate?.().toISOString() || ''
        };
      });
      
      exportToCSV(studentsData, 'students');
    } catch (error) {
      console.error('Error exporting students:', error);
      alert('Error exporting students data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportTeachers = async () => {
    setIsExporting(true);
    try {
      const teachersSnapshot = await getDocs(collection(db, 'users'));
      const teachersData = teachersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.role === 'teacher' || user.role === 'pending_teacher')
        .map(teacher => ({
          TeacherID: teacher.teacherId,
          FullName: teacher.name,
          Email: teacher.email,
          Role: teacher.role,
          Status: teacher.status,
          Department: teacher.department,
          Subjects: Array.isArray(teacher.subjects) ? teacher.subjects.join('; ') : teacher.subjects,
          CreatedAt: teacher.createdAt?.toDate?.().toISOString() || '',
          UpdatedAt: teacher.updatedAt?.toDate?.().toISOString() || ''
        }));
      
      exportToCSV(teachersData, 'teachers');
    } catch (error) {
      console.error('Error exporting teachers:', error);
      alert('Error exporting teachers data');
    } finally {
      setIsExporting(false);
    }
  };

  const exportCourses = async () => {
    setIsExporting(true);
    try {
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const coursesData = coursesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          CourseID: data.courseId,
          CourseName: data.courseName,
          Description: data.description,
          TeacherName: data.teacherName,
          TeacherID: data.teacherId,
          Grade: data.grade,
          Sections: Array.isArray(data.sections) ? data.sections.join('; ') : data.sections,
          Schedule: data.schedule ? `${data.schedule.days} ${data.schedule.time}` : '',
          Room: data.schedule?.room || '',
          Credits: data.credits,
          AcademicYear: data.academicYear,
          Status: data.isActive ? 'Active' : 'Inactive'
        };
      });
      
      exportToCSV(coursesData, 'courses');
    } catch (error) {
      console.error('Error exporting courses:', error);
      alert('Error exporting courses data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    switch (exportType) {
      case 'students':
        await exportStudents();
        break;
      case 'teachers':
        await exportTeachers();
        break;
      case 'courses':
        await exportCourses();
        break;
      default:
        alert('Please select an export type');
    }
  };

  if (userRole !== 'admin') {
    return null; // Only show for admins
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Download className="w-5 h-5" /> Data Export
        </h2>
        <span className="text-sm text-gray-500">Export system data to CSV</span>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <button
            onClick={() => setExportType('students')}
            className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${
              exportType === 'students' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Users className={`w-8 h-8 mb-2 ${
              exportType === 'students' ? 'text-blue-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Students</span>
            <span className="text-sm text-gray-500">Export all student records</span>
          </button>
          
          <button
            onClick={() => setExportType('teachers')}
            className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${
              exportType === 'teachers' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <GraduationCap className={`w-8 h-8 mb-2 ${
              exportType === 'teachers' ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Teachers</span>
            <span className="text-sm text-gray-500">Export teacher information</span>
          </button>
          
          <button
            onClick={() => setExportType('courses')}
            className={`p-4 border rounded-lg flex flex-col items-center justify-center transition-all ${
              exportType === 'courses' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <BookOpen className={`w-8 h-8 mb-2 ${
              exportType === 'courses' ? 'text-purple-600' : 'text-gray-400'
            }`} />
            <span className="font-medium">Courses</span>
            <span className="text-sm text-gray-500">Export course catalog</span>
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="flex items-center gap-2">
              <FileDown className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700">CSV (Compatible with Excel)</span>
            </div>
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Export {exportType}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CSVExport;