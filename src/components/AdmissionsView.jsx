import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, FileText, Check, ChevronDown, ArrowRight, 
  MapPin, Phone, Mail, Users, BookOpen, GraduationCap, 
  Award, Target, Sparkles, Star, Shield, Globe, Heart,
  Building, Clock, DollarSign, Trophy,
  Camera, Zap, Users2, ChevronRight, Loader,
  CheckCircle, ChevronLeft, Download, Printer,
  Award as AwardIcon, TrendingUp,
  School, Home, ExternalLink, Search, X,
  Copy, MessageSquare, AlertCircle, RefreshCw,
  Grid, List, BookmarkCheck, BookmarkPlus,
  Facebook, Twitter, Linkedin, Mail as MailIcon,
  Info, HelpCircle, Bell, Volume2
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Enhanced Step Card Component
const StepCard = ({ step, index, isActive, onClick }) => (
  <div 
    onClick={onClick}
    className={`group relative bg-white rounded-3xl shadow-2xl border-2 cursor-pointer transition-all duration-500 transform hover:-translate-y-3 ${
      isActive 
        ? 'border-emerald-500 shadow-3xl ring-4 ring-emerald-100/50 scale-105' 
        : 'border-gray-100 hover:shadow-3xl hover:border-emerald-200'
    }`}
  >
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
    </div>
    
    <div className="relative z-10 p-10">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-8">
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-500 ${
          isActive 
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 scale-110 rotate-3' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-emerald-50 group-hover:to-emerald-100'
        }`}>
          <div className="relative">
            <span className={`text-3xl font-bold ${
              isActive ? 'text-white' : 'text-gray-700 group-hover:text-emerald-700'
            }`}>
              {index + 1}
            </span>
            {isActive && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Star className="w-3 h-3 text-yellow-800" />
              </div>
            )}
          </div>
        </div>
        
        {/* Active Indicator */}
        {isActive && (
          <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-full shadow-lg border border-emerald-200">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold text-emerald-800">Current Step</span>
          </div>
        )}
      </div>
      
      {/* Step Content */}
      <div className="space-y-6">
        <div>
          <h4 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
            {step.title}
          </h4>
          <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
        </div>
        
        {/* Step Timeline & Action */}
        <div className="pt-6 border-t border-gray-100/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Deadline</p>
                <p className="text-xl font-bold text-gray-900">{step.month}</p>
              </div>
            </div>
            
            <div className={`px-8 py-3 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 ${
              isActive
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg'
                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 group-hover:from-emerald-50 group-hover:to-emerald-100 group-hover:text-emerald-700'
            }`}>
              {step.action}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Decorative Corner */}
    <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-20 transform transition-transform duration-500 ${
      isActive ? 'scale-100 bg-emerald-500' : 'scale-0 bg-gray-400 group-hover:scale-100'
    }`}></div>
    
    {/* Hover Effect Border */}
    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-emerald-200/50 transition-all duration-500"></div>
  </div>
);

// Enhanced FAQ Item Component
const FAQItem = ({ question, answer, isOpen, onClick, index }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`border-2 rounded-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-1 ${
        isOpen 
          ? 'border-emerald-200 shadow-xl bg-gradient-to-r from-emerald-50/50 to-emerald-100/30' 
          : 'border-gray-100 hover:shadow-lg hover:border-emerald-100 bg-white'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className="w-full p-8 text-left transition-all duration-300 hover:bg-white/50"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-300 ${
              isOpen 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 scale-110' 
                : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-emerald-100 group-hover:to-emerald-200'
            }`}>
              <div className="relative">
              <HelpCircle className={`w-7 h-7 ${isOpen ? 'text-white' : 'text-gray-600 group-hover:text-emerald-600'}`} />
                <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
                  isOpen ? 'bg-yellow-400' : 'bg-gray-300'
                } flex items-center justify-center`}>
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
              </div>
            </div>
            <div className="text-left">
              <h4 className="text-xl font-bold text-gray-900 mb-3">{question}</h4>
              <div className={`flex items-center gap-2 transition-all duration-300 ${
                isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}>
                <span className="text-sm text-emerald-600 font-medium">Click to {isOpen ? 'collapse' : 'expand'}</span>
                <ChevronDown className={`w-4 h-4 text-emerald-600 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`} />
              </div>
            </div>
          </div>
          <div className={`transform transition-transform duration-500 ${
            isOpen ? 'rotate-180 scale-110' : isHovered ? 'scale-110' : ''
          }`}>
            <ChevronDown className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-500 ${
        isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="p-8 pt-0">
          <div className="pl-20">
            <div className="relative">
              <div className="absolute -left-12 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 to-emerald-300"></div>
              <p className="text-gray-600 leading-relaxed text-lg pl-6">{answer}</p>
              {isOpen && (
                <div className="mt-6 flex items-center gap-4">
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium group/contact"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Contact Admissions</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover/contact:opacity-100 group-hover/contact:translate-x-1 transition-all" />
                  </Link>
                  <Link
                    to="/resources"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium group/resources"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>View Resources</span>
                    <ExternalLink className="w-4 h-4 opacity-0 group-hover/resources:opacity-100 group-hover/resources:translate-x-1 transition-all" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Document Checklist Item
const DocumentItem = ({ text, checked, index, onToggle }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`flex items-center gap-6 p-6 rounded-2xl border-2 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
        checked 
          ? 'bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-emerald-200 shadow-lg' 
          : 'bg-white border-gray-100 hover:border-emerald-100 hover:shadow-lg'
      }`}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
        checked 
          ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 scale-110' 
          : 'bg-gradient-to-br from-gray-100 to-gray-200'
      }`}>
        {checked ? (
          <div className="relative">
            <Check className="w-6 h-6 text-white" />
            <div className="absolute -inset-2 bg-emerald-500/20 rounded-full animate-ping"></div>
          </div>
        ) : (
          <div className="relative">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            {isHovered && (
              <div className="absolute -inset-2 bg-emerald-500/10 rounded-full animate-pulse"></div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1">
        <span className={`text-lg font-medium transition-all duration-300 ${
          checked ? 'text-gray-500 line-through' : 'text-gray-900'
        }`}>
          {text}
        </span>
      </div>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-600">{index + 1}</span>
      </div>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ value, label, description, icon: Icon, color, trend }) => (
  <div className="group relative bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-5">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-current to-transparent rounded-full -translate-y-12 translate-x-12"></div>
    </div>
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-6">
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-500`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        {trend && (
          <div className={`px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 ${
            trend > 0 
              ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
          }`}>
            {trend > 0 ? <ArrowRight className="w-4 h-4 rotate-45" /> : <ArrowRight className="w-4 h-4 rotate-[-135deg]" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-4xl font-bold text-gray-900">{value}</div>
        <div className="text-lg font-semibold text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
    </div>
    
    {/* Hover Effect Border */}
    <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-emerald-200/50 transition-all duration-500"></div>
  </div>
);

// Deadline Card Component
const DeadlineCard = ({ title, date, icon: Icon, color, description }) => (
  <div className="group relative bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3">
    {/* Animated Background */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${color.replace('from-', 'from-').replace('to-', 'to-')}`} />
    
    <div className="relative z-10">
      <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-6 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
        <Icon className="w-8 h-8 text-white" />
      </div>
      
      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
        {title}
      </h4>
      
      <div className="text-3xl font-bold text-gray-900 mb-2">{date}</div>
      
      <p className="text-gray-600 text-sm">{description}</p>
      
      {/* Countdown Timer (Simulated) */}
      <div className="mt-6 pt-6 border-t border-gray-100">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Submit all required documents</span>
        </div>
      </div>
    </div>
    
    {/* Corner Decoration */}
    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
  </div>
);

const AdmissionsView = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [documentsChecked, setDocumentsChecked] = useState([false, false, false, false, false, false, false, false]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStatsTab, setActiveStatsTab] = useState('overview');

  // Simulate loading for demo purposes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const toggleDocument = (index) => {
    setDocumentsChecked(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  const steps = [
    {
      id: 1,
      title: "Explore & Inquire",
      description: "Begin your journey by attending an open house or scheduling a private tour to experience our campus and meet our faculty.",
      month: "September - December",
      action: "Schedule Tour",
      icon: <Building className="w-8 h-8" />,
      details: "Visit our state-of-the-art facilities, observe classes in session, and speak directly with teachers and current students.",
      cta: () => setShowTourModal(true),
      duration: "1-2 hours",
      requirements: ["Tour registration", "Parent/Guardian presence", "Student participation"]
    },
    {
      id: 2,
      title: "Submit Application",
      description: "Complete and submit the online application form along with required documents including transcripts and teacher recommendations.",
      month: "By January 15th",
      action: "Start Application",
      icon: <FileText className="w-8 h-8" />,
      details: "Our online portal guides you through each step. You can save progress and return anytime before the deadline.",
      cta: () => setShowApplyModal(true),
      duration: "2-3 weeks",
      requirements: ["Online application", "Academic records", "Recommendation letters"]
    },
    {
      id: 3,
      title: "Assessment & Interview",
      description: "Applicants complete a short standardized test followed by a personal interview with our admissions committee.",
      month: "February",
      action: "Prepare for Assessment",
      icon: <Target className="w-8 h-8" />,
      details: "The interview is an opportunity for us to get to know you better and for you to ask questions about our program.",
      cta: () => window.open('/resources/assessment-prep', '_blank'),
      duration: "1 day",
      requirements: ["Standardized test", "Student interview", "Parent meeting"]
    },
    {
      id: 4,
      title: "Decision & Enrollment",
      description: "Receive your admission decision and complete enrollment with contract signing and tuition deposit.",
      month: "March - April",
      action: "Review Decision",
      icon: <Award className="w-8 h-8" />,
      details: "Welcome packets and orientation schedules are sent to newly enrolled families in April.",
      cta: () => window.location.href = '/admissions/status',
      duration: "2-4 weeks",
      requirements: ["Decision review", "Contract signing", "Tuition deposit"]
    }
  ];

  const deadlines = [
    { 
      title: "Application Deadline", 
      date: "January 15", 
      icon: CalendarDays, 
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      description: "Final date to submit complete application"
    },
    { 
      title: "Financial Aid Deadline", 
      date: "February 1", 
      icon: DollarSign, 
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      description: "Submit financial aid applications"
    },
    { 
      title: "Decision Notification", 
      date: "March 10", 
      icon: AwardIcon, 
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      description: "Admission decisions released"
    },
    { 
      title: "Enrollment Deadline", 
      date: "April 1", 
      icon: CheckCircle, 
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      description: "Secure your spot with enrollment deposit"
    }
  ];

  const documents = [
    "Completed online application form",
    "Official school transcripts (last 2 years)",
    "Two teacher recommendations",
    "Standardized test scores (optional)",
    "Student essay/personal statement",
    "Parent/Guardian statement",
    "Recent student photograph",
    "Application fee ($75) or waiver"
  ];

  const faqs = [
    {
      question: "What are the age requirements for admission?",
      answer: "We accept students from ages 4-18, with specific grade-level requirements. Kindergarten applicants must be 4 years old by September 1st. Grade placement is determined by age, previous academic records, and developmental readiness."
    },
    {
      question: "Is financial aid available?",
      answer: "Yes, we offer need-based financial aid to approximately 30% of our student body. Applications for financial aid are due by February 1st. Our financial aid committee reviews each application individually to determine need-based awards. We are committed to making an Evergreen education accessible to all qualified students."
    },
    {
      question: "Do you accept international students?",
      answer: "Yes, we welcome international students and provide dedicated support for visa applications, housing arrangements, and English language assistance. International applicants must demonstrate English proficiency and provide additional documentation for visa processing. Our International Student Office offers comprehensive support throughout the application and transition process."
    },
    {
      question: "What is the application fee?",
      answer: "The non-refundable application fee is $75. Fee waivers are available for families demonstrating financial need. Please contact our admissions office if you believe you qualify for a fee waiver. We never want financial constraints to prevent a qualified student from applying."
    },
    {
      question: "What is your average class size?",
      answer: "Our average class size is 18 students, with a student-teacher ratio of 12:1. This allows for personalized attention, meaningful interactions between students and faculty, and tailored learning experiences. Our small class sizes are a cornerstone of our educational philosophy."
    },
    {
      question: "Do you offer campus tours?",
      answer: "Yes, we offer both in-person and virtual tours throughout the year. You can schedule a tour through our admissions portal or by contacting our admissions office directly. Tours include classroom visits, facilities exploration, and meetings with current students and faculty members."
    }
  ];

  const stats = [
    { 
      value: "98%", 
      label: "College Acceptance Rate", 
      description: "Class of 2024 university placement", 
      icon: GraduationCap, 
      color: "bg-gradient-to-br from-emerald-500 to-emerald-600",
      trend: 2
    },
    { 
      value: "12:1", 
      label: "Student-Teacher Ratio", 
      description: "Optimal learning environment", 
      icon: Users, 
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      trend: 0
    },
    { 
      value: "$3.2M", 
      label: "Financial Aid Awarded", 
      description: "Annual assistance provided", 
      icon: DollarSign, 
      color: "bg-gradient-to-br from-yellow-500 to-yellow-600",
      trend: 5
    },
    { 
      value: "50+", 
      label: "Nationalities", 
      description: "Diverse student community", 
      icon: Globe, 
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      trend: 3
    }
  ];

  const admissionStats = [
    { label: "Applications Received", value: "1,250", change: "+15%" },
    { label: "Acceptance Rate", value: "18%", change: "-2%" },
    { label: "Enrollment Yield", value: "87%", change: "+5%" },
    { label: "Financial Aid Recipients", value: "32%", change: "+3%" }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Hero Section with Parallax */}
      <div className="relative min-h-[600px] lg:min-h-[700px] xl:min-h-[800px] overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center transform scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=2000&auto=format&fit=crop&q=80')`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-blue-900/75 to-purple-900/65"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>
        
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="py-16 lg:py-24 xl:py-32">
              <div className="lg:max-w-2xl">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
                  <span className="text-white font-bold tracking-wider">ADMISSIONS 2026-2027</span>
                </div>
                <h1 className="text-5xl tracking-tight font-extrabold text-white sm:text-6xl md:text-7xl lg:text-8xl">
                  <span className="block bg-gradient-to-r from-white via-white to-emerald-200 bg-clip-text text-transparent">
                    Your Journey
                  </span>
                  <span className="block text-yellow-300 mt-4 bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                    Begins Here
                  </span>
                </h1>
                <p className="mt-8 text-xl text-white/90 sm:text-2xl md:text-3xl max-w-2xl leading-relaxed">
                  Join our community of curious minds and future leaders. Applications for the 2026-2027 academic year are now open.
                </p>
                <div className="mt-12 flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="group relative px-12 py-5 bg-gradient-to-r from-white to-white/90 text-emerald-600 font-bold rounded-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 flex items-center gap-3 text-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10">Start Your Application</span>
                    <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
                    <div className="absolute inset-0 border-2 border-white/30 rounded-xl group-hover:border-white/50 transition-all duration-500"></div>
                  </button>
                  <button
                    onClick={() => setShowTourModal(true)}
                    className="group relative px-12 py-5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:border-white/50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl flex items-center gap-3 text-lg overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <Camera className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">Schedule Virtual Tour</span>
                    <ExternalLink className="w-5 h-5 relative z-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
                
                {/* Quick Stats */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {admissionStats.map((stat, index) => (
                    <div key={index} className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                      <div className="text-sm text-white/80">{stat.label}</div>
                      <div className={`text-xs mt-1 ${stat.change.startsWith('+') ? 'text-emerald-300' : 'text-red-300'}`}>
                        {stat.change} from last year
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full animate-scroll"></div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-white/20 border-t-emerald-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-white text-xl font-bold">Loading...</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Banner */}
      <div className="py-16 bg-gradient-to-r from-emerald-50 via-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 rounded-full mb-8 shadow-lg">
              <Target className="w-6 h-6" />
              <span className="font-bold text-lg">ADMISSIONS ROADMAP</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8">
              Your 4-Step Journey to Evergreen
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A transparent, supportive process designed to help you showcase your unique potential
            </p>
          </div>

          {/* Interactive Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
            {steps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                isActive={currentStep === step.id}
                onClick={() => setCurrentStep(step.id)}
              />
            ))}
          </div>

          {/* Current Step Details - Enhanced */}
          <div className="mb-20">
            {steps.map((step) => (
              currentStep === step.id && (
                <div key={step.id} className="bg-gradient-to-r from-emerald-50/50 via-blue-50/50 to-purple-50/50 rounded-3xl p-10 border-2 border-emerald-100 shadow-2xl">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                    <div className="lg:w-2/3">
                      <div className="flex items-center gap-6 mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                          {step.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-4 mb-3">
                            <h3 className="text-3xl font-bold text-gray-900">Step {step.id}: {step.title}</h3>
                            <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
                              {step.month}
                            </div>
                          </div>
                          <p className="text-gray-700 text-lg leading-relaxed">{step.details}</p>
                        </div>
                      </div>
                      
                      {/* Step Requirements */}
                      <div className="mb-10">
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                          Requirements & Timeline
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <Clock className="w-5 h-5 text-blue-500" />
                              <div className="text-lg font-bold text-gray-900">Duration</div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{step.duration}</div>
                          </div>
                          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <CalendarDays className="w-5 h-5 text-purple-500" />
                              <div className="text-lg font-bold text-gray-900">Best Time to Start</div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">Now</div>
                          </div>
                          <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                              <CheckCircle className="w-5 h-5 text-emerald-500" />
                              <div className="text-lg font-bold text-gray-900">Items Required</div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{step.requirements.length}</div>
                          </div>
                        </div>
                        
                        {/* Requirements List */}
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                          {step.requirements.map((req, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-600" />
                              </div>
                              <span className="text-gray-700">{req}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={step.cta}
                        className="group relative px-10 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-105 flex items-center gap-3"
                      >
                        <span>{step.action}</span>
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                        <div className="absolute inset-0 border-2 border-emerald-400/30 rounded-xl group-hover:border-emerald-400/50 transition-all duration-500"></div>
                      </button>
                    </div>
                    
                    {/* Sidebar Info */}
                    <div className="lg:w-1/3">
                      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                        <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <Info className="w-6 h-6 text-blue-500" />
                          What to Expect
                        </h4>
                        <ul className="space-y-5">
                          <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/30 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Personalized guidance from admissions counselor</span>
                          </li>
                          <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Timely communication at every step</span>
                          </li>
                          <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100/30 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Dedicated support throughout the process</span>
                          </li>
                          <li className="flex items-start gap-3 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/30 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700">Flexible scheduling options available</span>
                          </li>
                        </ul>
                        
                        <div className="mt-8 pt-8 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">Need help?</div>
                            <Link
                              to="/contact"
                              className="text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-2 group/help"
                            >
                              <span>Contact Us</span>
                              <MessageSquare className="w-4 h-4 group-hover/help:translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>

          {/* Key Deadlines - Enhanced */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full mb-8 shadow-lg">
                <CalendarDays className="w-6 h-6" />
                <span className="font-bold text-lg">CRITICAL DATES & DEADLINES</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Mark Your Calendar</h3>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">Stay on track with these essential dates in the admissions timeline</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {deadlines.map((deadline, index) => (
                <DeadlineCard key={index} {...deadline} />
              ))}
            </div>
            
            {/* Countdown Banner */}
            <div className="mt-12 bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-3xl p-10 text-center text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-left">
                  <h4 className="text-2xl font-bold mb-3">Early Decision Advantage</h4>
                  <p className="text-emerald-100">Submit by November 15th for priority consideration</p>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold">45</div>
                    <div className="text-sm opacity-90">Days Left</div>
                  </div>
                  <button
                    onClick={() => setShowApplyModal(true)}
                    className="px-8 py-4 bg-white text-emerald-600 font-bold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    Apply Early
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout - Enhanced */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Required Documents - Enhanced */}
            <div>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl">
                  <FileText className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Application Checklist</h3>
                  <p className="text-gray-600 text-lg">Everything you need for a complete application</p>
                </div>
              </div>
              
              <div className="space-y-4 mb-8">
                {documents.map((doc, index) => (
                  <DocumentItem 
                    key={index}
                    text={doc} 
                    checked={documentsChecked[index]}
                    index={index}
                    onToggle={() => toggleDocument(index)}
                  />
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">Application Progress</span>
                  <span className="text-2xl font-bold text-emerald-600">
                    {Math.round((documentsChecked.filter(Boolean).length / documents.length) * 100)}%
                  </span>
                </div>
                <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${(documentsChecked.filter(Boolean).length / documents.length) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-sm text-gray-500">
                  <span>{documentsChecked.filter(Boolean).length} of {documents.length} completed</span>
                  <span>{documents.length - documentsChecked.filter(Boolean).length} remaining</span>
                </div>
              </div>
              
              {/* Tips & Resources */}
              <div className="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-100 shadow-lg">
                <div className="flex items-start gap-4">
                  <Zap className="w-8 h-8 text-yellow-600 flex-shrink-0" />
                  <div>
                    <h5 className="text-lg font-bold text-yellow-800 mb-3">Pro Tips for Success</h5>
                    <ul className="space-y-3 text-yellow-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Start gathering documents 4-6 weeks before deadlines</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Request teacher recommendations early</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Keep digital copies of all documents</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>Review essays with teachers or mentors</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section - Enhanced */}
            <div>
              <div className="flex items-center gap-6 mb-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h3>
                  <p className="text-gray-600 text-lg">Get answers to common admissions questions</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <FAQItem
                    key={index}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFAQ === index}
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                    index={index}
                  />
                ))}
              </div>
              
              {/* Additional Resources */}
              <div className="mt-12 p-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-100 shadow-lg">
                <h5 className="text-xl font-bold text-gray-900 mb-6">Additional Resources</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Link
                    to="/admissions/resources"
                    className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          Application Guide
                        </div>
                        <div className="text-sm text-gray-500">Complete step-by-step instructions</div>
                      </div>
                    </div>
                  </Link>
                  <Link
                    to="/financial-aid"
                    className="group p-6 bg-white rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                          Financial Aid
                        </div>
                        <div className="text-sm text-gray-500">Scholarships and assistance</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Evergreen - Enhanced */}
      <div className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center transform scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=2000&auto=format&fit=crop&q=80')`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-blue-900/85 to-purple-900/80"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full mb-8">
                <Star className="w-6 h-6 text-yellow-300" />
                <span className="font-bold text-lg">THE EVERGREEN ADVANTAGE</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-8">
                Why Students Thrive at Evergreen
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                Discover what sets our community apart and how we prepare students for success
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              <div className="group relative bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-2 border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 pr-16">College & Career Success</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">98% college acceptance rate</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">Dedicated college counseling from year one</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700">Career mentorship programs</span>
                  </li>
                </ul>
              </div>
              
              <div className="group relative bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-2 border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 pr-16">Personalized Support</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">12:1 student-teacher ratio</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">Individual academic advisors</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-gray-700">Comprehensive wellness programs</span>
                  </li>
                </ul>
              </div>
              
              <div className="group relative bg-white/95 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border-2 border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-3 hover:scale-105">
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6 pr-16">Global Opportunities</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="text-gray-700">International exchange programs</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="text-gray-700">Diverse student body from 50+ countries</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="text-gray-700">Global leadership initiatives</span>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Testimonial Section */}
            <div className="mt-20 p-12 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-white/20">
              <div className="text-center mb-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">Hear From Our Community</h3>
                <p className="text-gray-600 max-w-2xl mx-auto">What students and parents say about their Evergreen experience</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="p-8 bg-gradient-to-r from-emerald-50 to-emerald-100/30 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">Sarah Chen, Class of 2024</div>
                      <div className="text-emerald-600">Stanford University '28</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">
                    "Evergreen prepared me not just for college, but for life. The personalized attention and challenging curriculum gave me the confidence to pursue my dreams."
                  </p>
                </div>
                <div className="p-8 bg-gradient-to-r from-blue-50 to-blue-100/30 rounded-2xl">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">The Rodriguez Family</div>
                      <div className="text-blue-600">Parents of 9th & 11th graders</div>
                    </div>
                  </div>
                  <p className="text-gray-700 italic leading-relaxed">
                    "The admissions process was transparent and supportive. The community welcomed us from day one, and we've seen tremendous growth in our children."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA - Enhanced */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full -translate-x-48 -translate-y-48"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-full translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 rounded-full mb-8 shadow-lg">
                <Sparkles className="w-6 h-6 animate-pulse" />
                <span className="font-bold text-lg">READY TO BEGIN YOUR JOURNEY?</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-8">
                Take the First Step Today
              </h2>
              <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join our community of innovators, leaders, and lifelong learners. Our admissions team is here to guide you every step of the way.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="group relative px-14 py-6 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-2xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 flex items-center justify-center gap-4 text-xl"
                >
                  <div className="absolute inset-0 border-2 border-emerald-400/30 rounded-2xl group-hover:border-emerald-400/50 transition-all duration-500"></div>
                  <span>Start Your Application</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
                <button
                  onClick={() => setShowTourModal(true)}
                  className="group relative px-14 py-6 bg-white text-emerald-600 font-bold rounded-2xl border-3 border-emerald-600 hover:bg-emerald-50 transition-all duration-500 transform hover:-translate-y-2 hover:shadow-2xl flex items-center justify-center gap-4 text-xl"
                >
                  <span>Schedule Campus Tour</span>
                  <CalendarDays className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </button>
                <Link
                  to="/contact"
                  className="group relative px-14 py-6 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 font-bold rounded-2xl hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 flex items-center justify-center gap-4 text-xl"
                >
                  <span>Contact Admissions</span>
                  <Phone className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-500" />
                    <div className="text-lg font-bold text-gray-900">No Application Fee</div>
                  </div>
                  <p className="text-gray-600">For early decision applications</p>
                </div>
                <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <CalendarDays className="w-8 h-8 text-blue-500" />
                    <div className="text-lg font-bold text-gray-900">Rolling Admissions</div>
                  </div>
                  <p className="text-gray-600">Apply anytime, space permitting</p>
                </div>
                <div className="p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <DollarSign className="w-8 h-8 text-yellow-500" />
                    <div className="text-lg font-bold text-gray-900">Financial Aid</div>
                  </div>
                  <p className="text-gray-600">Personalized consultations available</p>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="mt-20 pt-20 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Phone className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">(555) 123-4567</div>
                    <div className="text-gray-600">Admissions Office</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Mail className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">admissions@evergreen.edu</div>
                    <div className="text-gray-600">Email Response: 24 hours</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                      <Clock className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-2">Mon-Fri, 8AM-6PM</div>
                    <div className="text-gray-600">Office Hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes scroll {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(20px);
            opacity: 0;
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-scroll {
          animation: scroll 2s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
};

export default AdmissionsView;