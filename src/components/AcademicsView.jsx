// src/components/AcademicsView.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Calculator, Palette, Globe, Cpu, Music, 
  FlaskRound, Code, Users, Target, Award, Clock, Calendar,
  ChevronRight, GraduationCap, CheckCircle, ArrowRight,
  Sparkles, Star, Shield, Zap, Building, Heart, Users2,
  BarChart, TrendingUp, Target as TargetIcon, Camera,
  ChevronLeft, ChevronRight as ChevronRightIcon, Download,
  Printer, Award as AwardIcon, School, Globe as GlobeIcon,
  Heart as HeartIcon, Sparkles as SparklesIcon, Eye,
  Video, Headphones, MapPin, Phone, Mail, Target as TargetIcon2
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Animated Number Component
const AnimatedNumber = ({ value, suffix = '', duration = 2000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const end = parseInt(value.toString().replace(/[^0-9]/g, ''));
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [isVisible, value, duration]);

  return (
    <span ref={ref} className="animated-number">
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
};

// Course Card Component
// Update the CourseCard component in AcademicsView.jsx

const CourseCard = ({ course }) => {
  const getSubjectColor = (subject) => {
    switch(subject) {
      case 'Mathematics': return 'from-blue-500 to-blue-600';
      case 'Science': return 'from-emerald-500 to-emerald-600';
      case 'English': return 'from-red-500 to-red-600';
      case 'Arts': return 'from-purple-500 to-purple-600';
      case 'Technology': return 'from-yellow-500 to-yellow-600';
      case 'Languages': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getSubjectIcon = (subject) => {
    switch(subject) {
      case 'Mathematics': return <Calculator className="w-6 h-6" />;
      case 'Science': return <FlaskRound className="w-6 h-6" />;
      case 'English': return <BookOpen className="w-6 h-6" />;
      case 'Arts': return <Palette className="w-6 h-6" />;
      case 'Technology': return <Code className="w-6 h-6" />;
      case 'Languages': return <Globe className="w-6 h-6" />;
      default: return <BookOpen className="w-6 h-6" />;
    }
  };

  // Helper function to format schedule
  const formatSchedule = (schedule) => {
    if (!schedule) return 'Schedule TBD';
    
    // If schedule is a string, return it
    if (typeof schedule === 'string') return schedule;
    
    // If schedule is an object, format it
    if (typeof schedule === 'object') {
      if (schedule.days && schedule.time) {
        return `${schedule.days} • ${schedule.time}`;
      } else if (schedule.days) {
        return schedule.days;
      } else if (schedule.time) {
        return schedule.time;
      } else if (schedule.room) {
        return `Room: ${schedule.room}`;
      }
    }
    
    return 'Schedule TBD';
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-2">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getSubjectColor(course.subject)} flex items-center justify-center`}>
              <div className="text-white">
                {getSubjectIcon(course.subject || 'General')}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {course.code || course.courseId || 'COURSE-001'}
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-1 group-hover:text-emerald-600 transition-colors">
                {course.title || course.courseName || 'Course Title'}
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
            Grade {course.grade || '9-12'}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description || 'Course description not available.'}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 text-sm">
            <Users className="w-4 h-4 mr-2" />
            <span>Teacher: {course.teacher || course.teacherName || 'TBD'}</span>
          </div>
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            <span>{formatSchedule(course.schedule)}</span>
          </div>
          {course.credits && (
            <div className="flex items-center text-gray-600 text-sm">
              <Award className="w-4 h-4 mr-2" />
              <span>{course.credits} credit{parseInt(course.credits) !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        
        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {course.ap && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                AP
              </span>
            )}
            {course.honors && (
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                Honors
              </span>
            )}
          </div>
          <button className="inline-flex items-center text-emerald-600 hover:text-emerald-800 text-sm font-medium group">
            <span>Course Details</span>
            <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Pathway Card Component
const PathwayCard = ({ pathway }) => (
  <div className="group bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${pathway.color} flex items-center justify-center mb-6`}>
      {pathway.icon}
    </div>
    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
      {pathway.title}
    </h3>
    <p className="text-gray-600 mb-4">{pathway.description}</p>
    
    <div className="space-y-2">
      <h4 className="font-medium text-gray-900 text-sm">Featured Courses:</h4>
      <div className="flex flex-wrap gap-2">
        {pathway.courses.map((course, idx) => (
          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {course}
          </span>
        ))}
      </div>
    </div>
    
    <div className="mt-6 pt-6 border-t border-gray-100">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {pathway.students} students enrolled
        </div>
        <Link to={pathway.link} className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium text-sm group">
          Explore Pathway
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  </div>
);

// Program Card Component
const ProgramCard = ({ program }) => (
  <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
    <div className="absolute top-0 right-0 w-24 h-24 opacity-20">
      <div className="absolute bg-white rounded-full w-24 h-24 -translate-y-12 translate-x-12"></div>
    </div>
    
    <div className="relative z-10">
      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
        <div className="text-white">
          {program.icon}
        </div>
      </div>
      <h4 className="font-bold text-white mb-2">{program.title}</h4>
      <p className="text-white/80 text-sm">{program.description}</p>
      
      <div className="mt-4 flex items-center text-white/60 text-sm">
        <Calendar className="w-4 h-4 mr-1" />
        <span>{program.duration}</span>
      </div>
    </div>
  </div>
);

const AcademicsView = ({ courses, coursesLoading, coursesError }) => {
  const [activePathway, setActivePathway] = useState('stem');
  const [statsInView, setStatsInView] = useState(false);
  const statsRef = useRef(null);

  // Sample data for demonstration
  const sampleCourses = [
    {
      id: 1,
      code: 'AP CALC BC',
      title: 'AP Calculus BC',
      subject: 'Mathematics',
      grade: '11-12',
      description: 'Advanced placement calculus covering both AB and BC curriculum with emphasis on theoretical concepts and practical applications.',
      teacher: 'Dr. Maria Rodriguez',
      schedule: 'Mon/Wed/Fri 9:00 AM',
      credits: 1.0,
      ap: true,
      honors: true
    },
    {
      id: 2,
      code: 'AP PHYSICS C',
      title: 'AP Physics C: Mechanics',
      subject: 'Science',
      grade: '11-12',
      description: 'Calculus-based physics covering mechanics, energy, momentum, and rotational motion with laboratory experiments.',
      teacher: 'Prof. James Wilson',
      schedule: 'Tue/Thu 10:30 AM',
      credits: 1.0,
      ap: true,
      honors: false
    },
    {
      id: 3,
      code: 'AP LIT',
      title: 'AP English Literature',
      subject: 'English',
      grade: '11-12',
      description: 'Advanced literary analysis and critical writing focusing on major works of world literature.',
      teacher: 'Ms. Sarah Chen',
      schedule: 'Mon/Wed/Fri 1:00 PM',
      credits: 1.0,
      ap: true,
      honors: true
    },
    {
      id: 4,
      code: 'AP CS A',
      title: 'AP Computer Science A',
      subject: 'Technology',
      grade: '10-12',
      description: 'Java-based programming course covering object-oriented design, data structures, and algorithms.',
      teacher: 'Mr. Alex Thompson',
      schedule: 'Tue/Thu 2:00 PM',
      credits: 1.0,
      ap: true,
      honors: false
    },
    {
      id: 5,
      code: 'AP BIO',
      title: 'AP Biology',
      subject: 'Science',
      grade: '11-12',
      description: 'Comprehensive study of biological concepts including molecular biology, genetics, and ecology.',
      teacher: 'Dr. Emily Davis',
      schedule: 'Mon/Wed/Fri 11:00 AM',
      credits: 1.0,
      ap: true,
      honors: false
    },
    {
      id: 6,
      code: 'AP ART',
      title: 'AP Studio Art',
      subject: 'Arts',
      grade: '11-12',
      description: 'Advanced studio art course focusing on portfolio development and creative expression.',
      teacher: 'Ms. Olivia Parker',
      schedule: 'Tue/Thu 3:30 PM',
      credits: 1.0,
      ap: true,
      honors: true
    }
  ];

  const pathways = [
    {
      id: 'stem',
      title: 'STEM Excellence',
      description: 'Advanced mathematics, sciences, and engineering with research opportunities and lab work.',
      color: 'from-blue-500 to-blue-600',
      icon: <Calculator className="w-8 h-8 text-white" />,
      courses: ['AP Calculus', 'AP Physics', 'Engineering Design', 'Biotechnology'],
      students: 245,
      link: '/academics/pathways/stem'
    },
    {
      id: 'arts',
      title: 'Humanities & Arts',
      description: 'Literature, history, languages, and creative arts exploration with performance opportunities.',
      color: 'from-purple-500 to-purple-600',
      icon: <Palette className="w-8 h-8 text-white" />,
      courses: ['World Literature', 'AP History', 'Studio Arts', 'Theatre Arts'],
      students: 180,
      link: '/academics/pathways/arts'
    },
    {
      id: 'global',
      title: 'Global Studies',
      description: 'International relations, world languages, cultural studies, and exchange programs.',
      color: 'from-emerald-500 to-emerald-600',
      icon: <Globe className="w-8 h-8 text-white" />,
      courses: ['International Relations', 'Spanish/French', 'Cultural Studies', 'Global Economics'],
      students: 120,
      link: '/academics/pathways/global'
    },
    {
      id: 'tech',
      title: 'Technology & Innovation',
      description: 'Cutting-edge technology, programming, digital media, and entrepreneurship.',
      color: 'from-yellow-500 to-yellow-600',
      icon: <Cpu className="w-8 h-8 text-white" />,
      courses: ['AI & ML', 'Game Development', 'Web Design', 'Cybersecurity'],
      students: 195,
      link: '/academics/pathways/tech'
    }
  ];

  const programs = [
    {
      title: 'Coding Academy',
      description: 'Intensive programming and software development with industry certifications.',
      icon: <Code className="w-6 h-6" />,
      duration: 'Year-round'
    },
    {
      title: 'Performing Arts',
      description: 'Theatre productions, orchestra, choir, and dance performances.',
      icon: <Music className="w-6 h-6" />,
      duration: 'Semester-based'
    },
    {
      title: 'Study Abroad',
      description: 'International exchange programs and cultural immersion experiences.',
      icon: <GlobeIcon className="w-6 h-6" />,
      duration: 'Summer/Winter'
    },
    {
      title: 'Research Internships',
      description: 'University partnerships and industry research opportunities.',
      icon: <FlaskRound className="w-6 h-6" />,
      duration: 'Summer'
    }
  ];

  // Intersection Observer for stats animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsInView(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  return (
    <main className="min-h-screen">
      {/* Hero Section with Background Image */}
      <div className="relative min-h-[500px] lg:min-h-[600px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?w=2000&auto=compress&cs=tinysrgb&dpr=2')`,
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-blue-900/70 to-purple-900/60"></div>
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="py-12 lg:py-24">
              <div className="lg:max-w-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                  <span className="text-white font-semibold tracking-wider">ACADEMIC EXCELLENCE</span>
                </div>
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  <span className="block">Igniting Minds.</span>
                  <span className="block text-yellow-300 mt-2">Shaping Futures.</span>
                </h1>
                <p className="mt-6 text-lg text-white sm:text-xl md:text-2xl max-w-xl">
                  A rigorous curriculum designed to inspire innovation, foster critical thinking, and prepare students for success in college and beyond.
                </p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.scrollTo({ top: document.getElementById('courses').offsetTop, behavior: 'smooth' })}
                    className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-100 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-2"
                  >
                    <span>Explore Courses</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => window.open('/academics/catalog', '_blank')}
                    className="px-8 py-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl border-2 border-emerald-500 hover:border-emerald-600 flex items-center gap-2"
                  >
                    <span>View Catalog</span>
                    <BookOpen className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Stats */}
      <div ref={statsRef} className="py-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full mb-4">
              <TargetIcon className="w-5 h-5" />
              <span className="font-semibold">BY THE NUMBERS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Academic Excellence
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-100 group">
              <div className="text-4xl font-bold text-emerald-700 mb-2 h-16 flex items-center justify-center">
                {statsInView ? <AnimatedNumber value="98" suffix="%" /> : "0%"}
              </div>
              <div className="text-sm text-gray-600 font-medium">College Acceptance</div>
              <div className="mt-4 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: statsInView ? '98%' : '0%' }}
                />
              </div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 group">
              <div className="text-4xl font-bold text-blue-700 mb-2 h-16 flex items-center justify-center">
                {statsInView ? <AnimatedNumber value="24" /> : "0"}
              </div>
              <div className="text-sm text-gray-600 font-medium">AP Courses</div>
              <div className="mt-4 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: statsInView ? '100%' : '0%' }}
                />
              </div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 group">
              <div className="text-4xl font-bold text-purple-700 mb-2 h-16 flex items-center justify-center">
                {statsInView ? <AnimatedNumber value="15" suffix=":1" /> : "0:1"}
              </div>
              <div className="text-sm text-gray-600 font-medium">Student-Teacher Ratio</div>
              <div className="mt-4 h-2 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: statsInView ? '100%' : '0%' }}
                />
              </div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-yellow-100 group">
              <div className="text-4xl font-bold text-yellow-700 mb-2 h-16 flex items-center justify-center">
                {statsInView ? <AnimatedNumber value="95" suffix="%" /> : "0%"}
              </div>
              <div className="text-sm text-gray-600 font-medium">AP Exam Pass Rate</div>
              <div className="mt-4 h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                  style={{ width: statsInView ? '95%' : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Philosophy */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-full mb-4">
              <GraduationCap className="w-5 h-5" />
              <span className="font-semibold">OUR APPROACH</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Educational Philosophy
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We believe in nurturing well-rounded individuals through a balanced approach that combines academic rigor with creative expression and practical application.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              {[
                {
                  icon: <Target className="w-8 h-8 text-emerald-600" />,
                  title: "Critical Thinking",
                  description: "Developing advanced problem-solving skills through inquiry-based learning and real-world applications."
                },
                {
                  icon: <Users2 className="w-8 h-8 text-blue-600" />,
                  title: "Collaboration",
                  description: "Fostering teamwork and communication through group projects and peer learning opportunities."
                },
                {
                  icon: <Zap className="w-8 h-8 text-yellow-600" />,
                  title: "Innovation",
                  description: "Encouraging creative thinking and entrepreneurial mindset through hands-on projects."
                },
                {
                  icon: <Globe className="w-8 h-8 text-purple-600" />,
                  title: "Global Awareness",
                  description: "Building cultural competency and global citizenship through diverse perspectives and exchange programs."
                }
              ].map((value, index) => (
                <div key={index} className="flex items-start gap-4 p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    {value.icon}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h4>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 p-8 rounded-2xl shadow-lg border border-blue-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Learning Outcomes</h3>
                <ul className="space-y-4">
                  {[
                    "Master core academic subjects with depth and understanding",
                    "Develop digital literacy and technological proficiency",
                    "Cultivate effective communication and presentation skills",
                    "Build research skills and independent learning habits",
                    "Understand ethical considerations in modern society",
                    "Prepare for college-level academic challenges"
                  ].map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-8 p-4 bg-white rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-700">
                    <span className="font-semibold">Note:</span> Our curriculum aligns with national standards while incorporating innovative teaching methodologies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Pathways */}
      <div className="py-24 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-full mb-4">
              <TargetIcon className="w-5 h-5" />
              <span className="font-semibold">ACADEMIC PATHWAYS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Choose Your Academic Journey
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Tailored pathways that allow students to explore their passions while building a strong academic foundation.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pathways.map((pathway) => (
              <PathwayCard key={pathway.id} pathway={pathway} />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      <div id="courses" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-full mb-4">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">FEATURED COURSES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Explore Our Course Catalog
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Comprehensive offerings designed to challenge and inspire students at every level.
            </p>
          </div>

          {coursesLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading course catalog...</p>
            </div>
          ) : coursesError ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-6 rounded-r-xl mb-8">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">{coursesError}</p>
                  <p className="text-yellow-700 text-sm mt-1">Displaying sample course data for demonstration.</p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(courses && courses.length > 0 ? courses.slice(0, 6) : sampleCourses).map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          
          {(courses && courses.length > 6) || sampleCourses.length > 6 ? (
            <div className="text-center mt-12">
              <Link
                to="/academics/courses"
                className="inline-flex items-center px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl"
              >
                <span>View All Courses</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {/* Special Programs */}
      <div className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/5905715/pexels-photo-5905715.jpeg?w=2000&auto=compress&cs=tinysrgb&dpr=2')`,
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-indigo-900/80 to-purple-900/70"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full mb-4">
                <Award className="w-5 h-5" />
                <span className="font-semibold">SPECIAL PROGRAMS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                Beyond the Classroom
              </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                Unique opportunities that provide hands-on learning experiences and prepare students for future success.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {programs.map((program, index) => (
                <ProgramCard key={index} program={program} />
              ))}
            </div>
            
            <div className="mt-12 text-center">
              <Link
                to="/academics/programs"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl"
              >
                <span>Explore All Programs</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">START YOUR JOURNEY</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Ready to Excel Academically?
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Discover how Evergreen Academy's rigorous academic program can help your student achieve their full potential.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.open('/academics/catalog', '_blank')}
                className="px-8 py-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Download Catalog</span>
                <Download className="w-5 h-5" />
              </button>
              <Link
                to="/contact"
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg border-2 border-emerald-600 hover:bg-emerald-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Contact Academic Office</span>
                <Mail className="w-5 h-5" />
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="px-8 py-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Back to Top</span>
                <ArrowRight className="w-5 h-5 rotate-90" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default AcademicsView;