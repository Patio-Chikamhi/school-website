import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader, Users, GraduationCap, BookOpen, Award, 
  Target, Globe, Heart, Sparkles, Star, ArrowRight,
  Shield, Zap, Building, CalendarDays, ChevronRight,
  Mail, Phone, MapPin, Clock, Users2, Target as TargetIcon,
  Camera, Trophy, Medal, Award as AwardIcon, Image, X,
  ChevronLeft, ChevronRight as ChevronRightIcon, ChevronDown,
  Globe as GlobeIcon, School, Lightbulb, Brain, Rocket
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';

// Animated Number Component with Intersection Observer - UPDATED
const AnimatedNumber = ({ value, suffix = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const targetValue = parseInt(value.replace(/[^\d]/g, '')) || 0;
  const duration = 2000;
  const steps = 60;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: '0px 0px -50px 0px' // Trigger 50px before entering viewport
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let current = 0;
    const increment = targetValue / steps;
    const stepTime = Math.floor(duration / steps);

    const timer = setInterval(() => {
      current += increment;
      if (current > targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [isVisible, targetValue]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}{suffix}
    </span>
  );
};
// Enhanced Gallery Modal Component
const GalleryModal = ({ isOpen, images, currentIndex, onClose, onNext, onPrev }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 w-full max-w-6xl max-h-[90vh] mx-4">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-emerald-300 transition-colors duration-200 z-20 p-2 bg-black/50 rounded-full backdrop-blur-sm hover:bg-black/70"
        >
          <X className="w-6 h-6" />
        </button>
        
        {/* Navigation Arrows */}
        <button
          onClick={onPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 group z-20"
        >
          <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        </button>
        
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all duration-200 group z-20"
        >
          <ChevronRightIcon className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
        
        {/* Image Display */}
        <div className="relative w-full h-full">
          <img
            src={images[currentIndex].src}
            alt={images[currentIndex].title}
            className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop&q=80";
            }}
          />
          
          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-8 rounded-b-2xl">
            <h3 className="text-2xl font-bold text-white mb-3">{images[currentIndex].title}</h3>
            <p className="text-gray-200 text-lg mb-4">{images[currentIndex].description}</p>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-300">
              <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full">
                <Camera className="w-4 h-4" />
                <span>{images[currentIndex].category}</span>
              </div>
              <div className="flex items-center gap-2">
                {images[currentIndex].tags?.map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Thumbnail Strip */}
        <div className="flex gap-3 mt-6 overflow-x-auto pb-2 px-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => {
                document.getElementById(`image-${idx}`)?.scrollIntoView({
                  behavior: 'smooth',
                  inline: 'center'
                });
              }}
              className={`flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-3 transition-all duration-200 transform hover:scale-105 ${
                idx === currentIndex 
                  ? 'border-emerald-500 scale-105 shadow-lg' 
                  : 'border-transparent hover:border-white/50'
              }`}
            >
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover"
                id={`image-${idx}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=400&fit=crop&q=80";
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Gallery Tab Component
const GalleryTab = ({ isActive, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-8 py-3 rounded-full font-medium transition-all duration-200 transform hover:-translate-y-1 ${
      isActive
        ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg scale-105'
        : 'bg-white text-gray-700 hover:bg-gray-50 border hover:shadow-md hover:border-emerald-200'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

// Enhanced Award Card Component with Images
const AwardCard = ({ award, index }) => (
  <div className="group relative bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
    {/* Award Image Background */}
    <div className="absolute inset-0 opacity-10">
      <img
        src={award.image || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&q=80'}
        alt={award.title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
        }}
      />
    </div>
    
    {/* Award Icon with Background */}
    <div className={`relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${
      award.level === 'National' ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
      award.level === 'State' ? 'bg-gradient-to-br from-blue-500 to-indigo-500' :
      'bg-gradient-to-br from-emerald-500 to-teal-500'
    }`}>
      {award.level === 'National' ? (
        <Trophy className="w-10 h-10 text-white" />
      ) : award.level === 'State' ? (
        <AwardIcon className="w-10 h-10 text-white" />
      ) : (
        <Medal className="w-10 h-10 text-white" />
      )}
    </div>
    
    {/* Award Level Badge */}
    <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-xs font-medium shadow-md ${
      award.level === 'National' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200' :
      award.level === 'State' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
      'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200'
    }`}>
      {award.level} AWARD
    </div>
    
    <h4 className="relative z-10 text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
      {award.title}
    </h4>
    
    <p className="relative z-10 text-gray-600 mb-6 leading-relaxed">{award.description}</p>
    
    {/* Award Details */}
    <div className="relative z-10 pt-6 border-t border-gray-100/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Award Year</p>
            <p className="font-bold text-gray-900">{award.year}</p>
          </div>
        </div>
        
        {award.category && (
          <span className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
            {award.category}
          </span>
        )}
      </div>
      
      {/* Student Recipients */}
      {award.students && award.students.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl">
          <Users className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Awarded to {award.students.length} student{award.students.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-emerald-600 truncate">
              {award.students.join(', ')}
            </p>
          </div>
        </div>
      )}
    </div>
    
    {/* Hover Effect Decoration */}
    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  </div>
);

// Enhanced Gallery Image Card Component
const GalleryImageCard = ({ image, onClick }) => (
  <div 
    className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
    onClick={onClick}
  >
    <div className="relative h-72 overflow-hidden">
      <img
        src={image.src}
        alt={image.title}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop&q=80";
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white transform translate-y-8 group-hover:translate-y-0 transition-transform duration-500">
          <h4 className="text-xl font-bold mb-3">{image.title}</h4>
          <p className="text-gray-200 text-sm mb-4">{image.description}</p>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
              {image.category}
            </span>
            {image.tags?.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-white/10 rounded-full text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* View Icon */}
      <div className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center transform translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
        <Camera className="w-6 h-6 text-gray-700" />
      </div>
    </div>
  </div>
);

// Enhanced LeaderCard Component with better image handling
const LeaderCard = ({ leader }) => {
  const [imgError, setImgError] = useState(false);
  
  return (
    <div className="group bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-y-2">
      {/* Leader Image Container with better positioning */}
      <div className="relative h-60 overflow-hidden">
        <img
          src={imgError ? "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=400&fit=crop&q=80&crop=faces" : leader.imageUrl}
          alt={leader.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          style={{ objectPosition: 'center 25%' }}
          onError={() => setImgError(true)}
          onLoad={(e) => {
            e.target.style.objectPosition = 'center 25%';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
        
        {/* Leader Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h4 className="text-2xl font-bold text-white mb-1">{leader.name}</h4>
          <p className="text-emerald-300 font-medium text-lg">{leader.title}</p>
        </div>
        
        {/* Department Badge */}
        <div className="absolute top-4 left-4">
          <span className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg text-sm font-medium text-gray-700 shadow-sm">
            {leader.department || 'Administration'}
          </span>
        </div>
      </div>
      
      {/* Leader Info */}
      <div className="p-6">
        <p className="text-gray-600 mb-6 leading-relaxed line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
          {leader.bio}
        </p>
        
        <div className="pt-6 border-t border-gray-100">
          <div className="space-y-3">
            <a 
              href={`mailto:${leader.email}`}
              className="flex items-center gap-3 text-emerald-600 hover:text-emerald-800 font-medium group/email"
            >
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover/email:bg-emerald-200 transition-colors">
                <Mail className="w-5 h-5" />
              </div>
              <span className="flex-1">{leader.email}</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover/email:opacity-100 group-hover/email:translate-x-1 transition-all" />
            </a>
            {leader.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{leader.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Timeline Component
const TimelineItem = ({ year, title, description, isLast = false }) => (
  <div className="flex group">
    <div className="flex flex-col items-center mr-6">
      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
        {year}
      </div>
      {!isLast && (
        <div className="w-1 h-full bg-gradient-to-b from-emerald-300 via-blue-300 to-emerald-300 mt-4"></div>
      )}
    </div>
    
    <div className="pb-12 flex-1">
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 group-hover:shadow-xl transition-all duration-300">
        <h4 className="text-xl font-bold text-gray-900 mb-3">{title}</h4>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// Value Card Component
const ValueCard = ({ icon: Icon, title, description, color, index }) => (
  <div className="group relative bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden">
    {/* Animated Background */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${color.replace('bg-', 'bg-')}`} />
    
    <div className={`relative z-10 w-20 h-20 rounded-2xl ${color} flex items-center justify-center mb-6 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
      <Icon className="w-10 h-10 text-white" />
    </div>
    
    <h4 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-colors duration-300">
      {title}
    </h4>
    
    <p className="text-gray-600 leading-relaxed">{description}</p>
    
    {/* Animated Border */}
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
  </div>
);

const AboutView = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Gallery states
  const [activeGalleryTab, setActiveGalleryTab] = useState('campus');
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Awards states
  const [activeAwardTab, setActiveAwardTab] = useState('all');
  
  // Hero Carousel states - REMOVED MANUAL ARROWS
  const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Stats for animated numbers
  const [studentCount] = useState(1250);
  const [targetStudentCount] = useState(1250);
  const [facultyCount] = useState(85);
  const [targetFacultyCount] = useState(85);
  const [collegeAcceptance] = useState(95);
  const [studentTeacherRatio] = useState(15);

  // Hero Rotating Images with better quality - FIXED: No duplicate URLs
  const heroImages = [
    { 
      id: 1, 
      src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&auto=format&fit=crop&q=80', 
      title: 'Campus Life',
      description: 'Vibrant student community at Evergreen Academy'
    },
    { 
      id: 2, 
      src: 'https://images.unsplash.com/photo-1524169358666-79f22534bc6e?w=1920&auto=format&fit=crop&q=80', // CHANGED: Different image URL
      title: 'Learning Environment',
      description: 'Modern classrooms designed for collaboration and innovation'
    },
    { 
      id: 3, 
      src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1920&auto=format&fit=crop&q=80', 
      title: 'Academic Excellence',
      description: 'State-of-the-art facilities for groundbreaking research'
    },
    { 
      id: 4, 
      src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&auto=format&fit=crop&q=80', 
      title: 'Athletics & Wellness',
      description: 'Championship-winning sports and fitness programs'
    },
    { 
      id: 5, 
      src: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1920&auto=format&fit=crop&q=80', 
      title: 'Community Spirit',
      description: 'Building lasting connections and school pride'
    }
  ];

  // Auto-rotate hero images
  useEffect(() => {
    const interval = setInterval(() => {
      nextHeroImage();
    }, 6000);

    return () => clearInterval(interval);
  }, [currentHeroImageIndex]);

  const nextHeroImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentHeroImageIndex((prevIndex) => 
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
      );
      setIsTransitioning(false);
    }, 500);
  };

  // REMOVED: prevHeroImage function since we removed manual arrows

  // Gallery Images Data with better quality
  const galleryImages = {
    campus: [
      { 
        id: 1, 
        src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80', 
        title: 'Main Academic Building', 
        description: 'Our iconic main building featuring modern architecture and sustainable design',
        category: 'Campus',
        tags: ['Architecture', 'Sustainability']
      },
      { 
        id: 2, 
        src: 'https://images.unsplash.com/photo-1524169358666-79f22534bc6e?w=1200&auto=format&fit=crop&q=80', // CHANGED: Different image
        title: 'Digital Library', 
        description: 'State-of-the-art learning resource center with VR capabilities',
        category: 'Campus',
        tags: ['Technology', 'Learning']
      },
      { 
        id: 3, 
        src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&auto=format&fit=crop&q=80', 
        title: 'Research Laboratories', 
        description: 'Advanced science labs with cutting-edge equipment for student research',
        category: 'Campus',
        tags: ['Research', 'Science']
      },
      { 
        id: 4, 
        src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=1200&auto=format&fit=crop&q=80', 
        title: 'Innovation Hub', 
        description: 'Collaborative spaces for creativity and entrepreneurship',
        category: 'Campus',
        tags: ['Innovation', 'Collaboration']
      }
    ],
    sports: [
      { 
        id: 5, 
        src: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop&q=80', 
        title: 'Championship Victory', 
        description: 'Celebrating our national basketball championship win',
        category: 'Sports',
        tags: ['Basketball', 'Championship']
      },
      { 
        id: 6, 
        src: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=1200&auto=format&fit=crop&q=80', 
        title: 'Soccer Excellence', 
        description: 'Varsity team training on our professional-grade field',
        category: 'Sports',
        tags: ['Soccer', 'Training']
      },
      { 
        id: 7, 
        src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop&q=80', 
        title: 'Aquatic Center', 
        description: 'Olympic-sized swimming pool and diving facilities',
        category: 'Sports',
        tags: ['Swimming', 'Aquatics']
      }
    ],
    arts: [
      { 
        id: 8, 
        src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop&q=80', 
        title: 'Theater Production', 
        description: 'Students performing in our annual musical theater showcase',
        category: 'Arts',
        tags: ['Theater', 'Performance']
      },
      { 
        id: 9, 
        src: 'https://images.unsplash.com/photo-1567942712661-82b9b407abbf?w=1200&auto=format&fit=crop&q=80', 
        title: 'Art Gallery Exhibition', 
        description: 'Student artwork featured in our campus gallery',
        category: 'Arts',
        tags: ['Visual Arts', 'Exhibition']
      },
      { 
        id: 10, 
        src: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&auto=format&fit=crop&q=80', 
        title: 'Orchestra Performance', 
        description: 'Symphony orchestra at the annual spring concert',
        category: 'Arts',
        tags: ['Music', 'Orchestra']
      }
    ],
    community: [
      { 
        id: 11, 
        src: 'https://images.unsplash.com/photo-1524178234883-043d5c3f3cf4?w=1200&auto=format&fit=crop&q=80', 
        title: 'Community Service Day', 
        description: 'Students volunteering in local community projects',
        category: 'Community',
        tags: ['Service', 'Volunteering']
      },
      { 
        id: 12, 
        src: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=1200&auto=format&fit=crop&q=80', 
        title: 'Robotics Club', 
        description: 'Students working on award-winning robotics projects',
        category: 'Community',
        tags: ['STEM', 'Clubs']
      },
      { 
        id: 13, 
        src: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=1200&auto=format&fit=crop&q=80', 
        title: 'Family Engagement', 
        description: 'Parents and students participating in campus events',
        category: 'Community',
        tags: ['Family', 'Engagement']
      }
    ]
  };

  // Enhanced Awards Data with images
  const awardsData = {
    all: [
      {
        id: 1,
        title: 'National Blue Ribbon School of Excellence',
        description: 'Highest recognition from the U.S. Department of Education for overall academic excellence and student achievement',
        year: '2024',
        level: 'National',
        category: 'Academic Excellence',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop&q=80',
        students: ['Class of 2024']
      },
      {
        id: 2,
        title: 'STEM Innovation Award',
        description: 'National recognition for outstanding STEM program and groundbreaking student research projects',
        year: '2023',
        level: 'National',
        category: 'STEM',
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop&q=80',
        students: ['Sarah Chen', 'Michael Rodriguez', 'Robotics Team']
      },
      {
        id: 3,
        title: 'National Rugby Championship',
        description: 'Varsity rugby team wins national championship for third consecutive year, showcasing exceptional teamwork',
        year: '2024',
        level: 'National',
        category: 'Sports',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop&q=80'
      },
      {
        id: 4,
        title: 'Environmental Leadership Gold Certification',
        description: 'National recognition for sustainability initiatives and environmental education leadership',
        year: '2023',
        level: 'National',
        category: 'Sustainability',
        image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&h=600&fit=crop&q=80'
      },
      {
        id: 5,
        title: 'Mathematics Olympiad State Champions',
        description: 'Team wins first place in state mathematics competition, solving complex problems under time pressure',
        year: '2024',
        level: 'State',
        category: 'Mathematics',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&q=80',
        students: ['James Wilson', 'Emma Davis', 'Alex Thompson']
      },
      {
        id: 6,
        title: 'National Music Excellence Award',
        description: 'Orchestra receives superior rating at national music festival, recognized for exceptional musicianship',
        year: '2023',
        level: 'National',
        category: 'Arts',
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop&q=80'
      }
    ],
    academic: [
      {
        id: 1,
        title: 'National Blue Ribbon School of Excellence',
        description: 'Highest recognition from the U.S. Department of Education for overall academic excellence',
        year: '2024',
        level: 'National',
        category: 'Academic Excellence',
        image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop&q=80'
      },
      {
        id: 2,
        title: 'STEM Innovation Award',
        description: 'National recognition for outstanding STEM program and groundbreaking student research',
        year: '2023',
        level: 'National',
        category: 'STEM',
        image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=600&fit=crop&q=80',
        students: ['Sarah Chen', 'Michael Rodriguez']
      },
      {
        id: 5,
        title: 'Mathematics Olympiad State Champions',
        description: 'Team wins first place in state mathematics competition',
        year: '2024',
        level: 'State',
        category: 'Mathematics',
        image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&h=600&fit=crop&q=80',
        students: ['James Wilson', 'Emma Davis', 'Alex Thompson']
      }
    ],
    sports: [
      {
        id: 3,
        title: 'National Rugby Championship',
        description: 'Varsity rugby team wins national championship for third consecutive year',
        year: '2024',
        level: 'National',
        category: 'Sports',
        image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop&q=80'
      }
    ],
    arts: [
      {
        id: 6,
        title: 'National Music Excellence Award',
        description: 'Orchestra receives superior rating at national music festival',
        year: '2023',
        level: 'National',
        category: 'Arts',
        image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=600&fit=crop&q=80'
      }
    ]
  };

  // Timeline data
  const timelineData = [
    { 
      year: '1985', 
      title: 'Foundation of Excellence', 
      description: 'Evergreen Academy founded with 120 students and a visionary commitment to holistic education and character development' 
    },
    { 
      year: '1995', 
      title: 'Academic Expansion', 
      description: 'Added state-of-the-art science and arts wings, doubling campus capacity and establishing specialized programs' 
    },
    { 
      year: '2005', 
      title: 'National Recognition', 
      description: 'Ranked among top 100 schools nationally, receiving first Blue Ribbon award for academic excellence' 
    },
    { 
      year: '2015', 
      title: 'Global Leadership', 
      description: 'Established international exchange programs with institutions in 15+ countries, fostering global citizenship' 
    },
    { 
      year: '2025', 
      title: 'Future-Ready Innovation', 
      description: 'Launched AI research labs, robotics engineering programs, and sustainable campus initiatives' 
    }
  ];

  // Values data with better icons and descriptions
  const values = [
    { 
      icon: GraduationCap, 
      title: 'Academic Excellence', 
      description: 'Challenging curriculum that inspires intellectual curiosity and prepares students for higher education success', 
      color: 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
    },
    { 
      icon: Heart, 
      title: 'Compassionate Community', 
      description: 'Fostering empathy, respect, and strong relationships that create a supportive learning environment', 
      color: 'bg-gradient-to-br from-pink-500 to-rose-600' 
    },
    { 
      icon: GlobeIcon, 
      title: 'Global Citizenship', 
      description: 'Developing culturally aware leaders prepared to contribute positively to an interconnected world', 
      color: 'bg-gradient-to-br from-blue-500 to-indigo-600' 
    },
    { 
      icon: Shield, 
      title: 'Integrity & Character', 
      description: 'Cultivating ethical leadership, moral courage, and personal responsibility in all endeavors', 
      color: 'bg-gradient-to-br from-purple-500 to-purple-600' 
    },
    { 
      icon: Lightbulb, 
      title: 'Innovation & Creativity', 
      description: 'Encouraging creative problem-solving, entrepreneurial thinking, and adaptability in a changing world', 
      color: 'bg-gradient-to-br from-yellow-500 to-orange-600' 
    },
    { 
      icon: Users2, 
      title: 'Collaborative Excellence', 
      description: 'Learning through teamwork, diverse perspectives, and shared achievements that build community', 
      color: 'bg-gradient-to-br from-cyan-500 to-teal-600' 
    }
  ];

  // Gallery functions
  const openGalleryModal = (index) => {
    setCurrentImageIndex(index);
    setGalleryModalOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === galleryImages[activeGalleryTab].length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? galleryImages[activeGalleryTab].length - 1 : prev - 1
    );
  };

  // Filtered awards based on active tab
  const filteredAwards = awardsData[activeAwardTab] || awardsData.all;

  // Fetch school leaders
  useEffect(() => {
    if (!db) {
      setLoading(false);
      setError("Database not connected");
      return;
    }

    try {
      const leadersCollectionRef = collection(db, 'schoolLeaders');
      const leadersQuery = query(
        leadersCollectionRef,
        where('isActive', '==', true),
        orderBy('order', 'asc')
      );

      setLoading(true);

      const unsubscribe = onSnapshot(leadersQuery,
        (snapshot) => {
          if (snapshot.empty) {
            setLeaders([]);
          } else {
            const fetchedLeaders = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setLeaders(fetchedLeaders);
          }

          setLoading(false);
          setError(null);
        },
        (error) => {
          console.error("Error fetching leaders:", error);
          setError(`Failed to load leadership team: ${error.message}`);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error("Setup error:", error);
      setError(`Setup error: ${error.message}`);
      setLoading(false);
    }
  }, []);

  const renderLeadersContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-24 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl">
          <div className="relative">
            <Loader className="w-16 h-16 animate-spin text-emerald-600 mb-6" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-xl"></div>
          </div>
          <p className="text-xl text-gray-700 font-medium">Loading our leadership team...</p>
          <p className="text-gray-500 mt-2">Connecting with our dedicated educators</p>
        </div>
      );
    }

    if (error || leaders.length === 0) {
      return (
        <>
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-8 rounded-2xl mb-10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-amber-900 mb-2">
                  {error || "Leadership data temporarily unavailable"}
                </h4>
                <p className="text-amber-800">
                  Displaying sample leadership profiles to showcase our team structure and expertise.
                </p>
              </div>
            </div>
          </div>
          {renderSampleLeaders()}
        </>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {leaders.map(leader => (
          <LeaderCard key={leader.id} leader={leader} />
        ))}
      </div>
    );
  };

  const renderSampleLeaders = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <LeaderCard
        leader={{
          id: "sample-1",
          name: "Dr. Penelope Sterling",
          title: "Head of School",
          bio: "20+ years of educational leadership, specializing in innovative curriculum development and student-centered learning approaches. PhD in Educational Leadership from Stanford University.",
          department: "Executive Leadership",
          imageUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=800&h=1000&fit=crop&q=80&crop=faces",
          email: "p.sterling@evergreen.edu",
          phone: "+1 (555) 123-4567"
        }}
      />
      <LeaderCard
        leader={{
          id: "sample-2",
          name: "Mr. Jonathan Chen",
          title: "Dean of Students",
          bio: "15+ years in student counseling and academic advising, focused on holistic student development and wellbeing. Former university admissions officer with expertise in student success.",
          department: "Student Affairs",
          imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=1000&fit=crop&q=80&crop=faces",
          email: "j.chen@evergreen.edu",
          phone: "+1 (555) 123-4568"
        }}
      />
      <LeaderCard
        leader={{
          id: "sample-3",
          name: "Ms. Maria Rodriguez",
          title: "Head Counselor",
          bio: "Expert in college admissions and career guidance with a track record of 98% college acceptance rate for graduates. 12+ years experience in educational counseling.",
          department: "Guidance & Counseling",
          imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=1000&fit=crop&q=80&crop=faces",
          email: "m.rodriguez@evergreen.edu",
          phone: "+1 (555) 123-4569"
        }}
      />
      <LeaderCard
        leader={{
          id: "sample-4",
          name: "Dr. Robert Kim",
          title: "Academic Dean",
          bio: "Former university professor with expertise in curriculum design and educational technology. Leading our academic innovation initiatives and faculty development programs.",
          department: "Academic Affairs",
          imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1000&fit=crop&q=80&crop=faces",
          email: "r.kim@evergreen.edu",
          phone: "+1 (555) 123-4570"
        }}
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Enhanced Hero Section - REMOVED MANUAL ARROWS */}
      <div className="relative overflow-hidden min-h-[600px] lg:min-h-[700px] xl:min-h-[800px]">
        {/* Rotating Images Background with Parallax */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <div
              key={image.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                index === currentHeroImageIndex
                  ? 'opacity-100 scale-105 translate-y-0'
                  : 'opacity-0 scale-100 translate-y-4'
              }`}
            >
              <img
                className="w-full h-full object-cover"
                src={image.src}
                alt={image.title}
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite loop
                  const fallbackColors = [
                    'bg-gradient-to-br from-emerald-600 to-emerald-800',
                    'bg-gradient-to-br from-blue-600 to-blue-800',
                    'bg-gradient-to-br from-purple-600 to-purple-800',
                    'bg-gradient-to-br from-amber-600 to-amber-800',
                    'bg-gradient-to-br from-cyan-600 to-cyan-800'
                  ];
                  e.target.parentElement.innerHTML = `
                    <div class="w-full h-full ${fallbackColors[index]} flex items-center justify-center">
                      <div class="text-center text-white p-8">
                        <div class="text-4xl mb-4 font-bold">${image.title}</div>
                        <div class="text-xl opacity-90">${image.description}</div>
                      </div>
                    </div>
                  `;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-blue-900/70 to-purple-900/60"></div>
            </div>
          ))}
        </div>

        {/* Enhanced Carousel Controls - DOTS ONLY, NO ARROWS */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
          {heroImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentHeroImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125 ${
                index === currentHeroImageIndex
                  ? 'bg-white w-10 scale-125'
                  : 'bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>

        {/* REMOVED: Manual Navigation Buttons (arrows) */}

        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="py-16 sm:py-24 lg:py-32">
              <div className="lg:max-w-2xl">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-6">
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span className="text-white font-semibold tracking-wider">LEGACY OF EXCELLENCE</span>
                </div>
                <h1 className="text-5xl tracking-tight font-extrabold text-white sm:text-6xl md:text-7xl lg:text-8xl">
                  <span className="block">40 Years of</span>
                  <span className="block text-yellow-300 mt-4 bg-gradient-to-r from-yellow-300 to-yellow-400 bg-clip-text text-transparent">
                    Educational Excellence
                  </span>
                </h1>
                <p className="mt-8 text-xl text-white sm:text-2xl md:text-3xl max-w-2xl leading-relaxed">
                  Since 1985, Evergreen Academy has been shaping future leaders through innovative education and character development.
                </p>
                <div className="mt-12 flex flex-wrap gap-4">
                  <a 
                    href="#history" 
                    className="inline-flex items-center px-10 py-5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl hover:from-emerald-600 hover:to-emerald-700 md:py-5 md:text-xl md:px-12 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span>Explore Our Journey</span>
                    <ArrowRight className="w-6 h-6 ml-3" />
                  </a>
                  <Link
                    to="/admissions"
                    className="inline-flex items-center px-10 py-5 bg-white/20 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/30 hover:bg-white/30 md:py-5 md:text-xl md:px-12 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl"
                  >
                    <span>Join Our Community</span>
                    <GraduationCap className="w-6 h-6 ml-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animated Stats Section - BY THE NUMBERS - Matching HomeView Size */}
      

      {/* Our History & Timeline - Enhanced */}
      <div id="history" className="py-24 relative overflow-hidden bg-gradient-to-b from-white to-emerald-50">
        <div className="absolute inset-0 opacity-5">
          <img
            src='https://images.unsplash.com/photo-1524169358666-79f22534bc6e?w=1920&auto=format&fit=crop&q=80'
            alt="History background"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-100 text-emerald-700 rounded-full mb-6 shadow-sm">
                <CalendarDays className="w-5 h-5" />
                <span className="font-semibold">OUR JOURNEY</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
                A Legacy of Innovation & Growth
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Four decades of commitment to educational excellence, innovation, and community building
              </p>
            </div>
            
            <div className="relative max-w-4xl mx-auto">
              {/* Timeline Center Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-300 via-blue-300 to-emerald-300"></div>
              
              <div className="space-y-4">
                {timelineData.map((item, index) => (
                  <TimelineItem
                    key={item.year}
                    {...item}
                    isLast={index === timelineData.length - 1}
                  />
                ))}
              </div>
            </div>
            
            {/* Timeline Stats - UPDATED with Intersection Observer */}
<div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8">
  <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300">
    <div className="text-4xl font-bold text-emerald-600 mb-2">
      <AnimatedNumber value="40" suffix="+" />
    </div>
    <div className="text-lg font-semibold text-gray-900 mb-1">Years of Excellence</div>
    <div className="text-gray-600 text-sm">Established 1985</div>
  </div>
  
  <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
    <div className="text-4xl font-bold text-blue-600 mb-2">
      <AnimatedNumber value="5000" suffix="+" />
    </div>
    <div className="text-lg font-semibold text-gray-900 mb-1">Graduates</div>
    <div className="text-gray-600 text-sm">Successful alumni worldwide</div>
  </div>
  
  <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-purple-100 hover:shadow-xl transition-all duration-300">
    <div className="text-4xl font-bold text-purple-600 mb-2">
      <AnimatedNumber value="200" suffix="+" />
    </div>
    <div className="text-lg font-semibold text-gray-900 mb-1">Faculty Members</div>
    <div className="text-gray-600 text-sm">Expert educators</div>
  </div>
  
  <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-yellow-100 hover:shadow-xl transition-all duration-300">
    <div className="text-4xl font-bold text-yellow-600 mb-2">
      <AnimatedNumber value="98" suffix="%" />
    </div>
    <div className="text-lg font-semibold text-gray-900 mb-1">College Acceptance</div>
    <div className="text-gray-600 text-sm">University placement rate</div>
  </div>
</div>
          </div>
        </div>
      </div>

      {/* Mission & Values - Enhanced */}
      <div className="py-24 bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full translate-x-48 translate-y-48"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Mission Statement */}
            <div className="mb-24">
              <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 rounded-3xl shadow-2xl p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-48 translate-x-48"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-32 -translate-x-32"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto text-center">
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full mb-8">
                    <Star className="w-6 h-6 text-yellow-300" />
                    <span className="font-bold text-lg">OUR MISSION</span>
                  </div>
                  <p className="text-3xl md:text-4xl italic mb-10 leading-relaxed font-light">
                    "To empower students to become resilient, compassionate, and lifelong learners
                    prepared to contribute positively to the global society."
                  </p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['Academic Excellence', 'Character Development', 'Global Citizenship', 'Innovation', 'Community', 'Leadership'].map((tag, idx) => (
                      <span key={idx} className="px-5 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium hover:bg-white/30 transition-colors">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Core Values */}
            <div>
              <div className="text-center mb-20">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-100 to-blue-100 text-emerald-700 rounded-full mb-6 shadow-sm">
                  <Heart className="w-5 h-5" />
                  <span className="font-semibold">OUR CORE VALUES</span>
                </div>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
                  The Pillars of Our Community
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Fundamental principles that guide our educational philosophy and community culture
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {values.map((value, index) => (
                  <ValueCard key={index} {...value} index={index} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Awards & Recognition - Enhanced with Images */}
      <div className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 rounded-full mb-6 shadow-sm">
              <Trophy className="w-5 h-5" />
              <span className="font-semibold">AWARDS & RECOGNITION</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Celebrating Excellence & Achievement
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              National and state recognitions that showcase our commitment to educational excellence
            </p>
          </div>

          {/* Award Tabs - Enhanced */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {[
              { id: 'all', label: 'All Awards', icon: Trophy },
              { id: 'academic', label: 'Academic', icon: GraduationCap },
              { id: 'sports', label: 'Sports', icon: Target },
              { id: 'arts', label: 'Arts', icon: AwardIcon }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveAwardTab(tab.id)}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-medium transition-all duration-300 transform hover:-translate-y-1 ${
                  activeAwardTab === tab.id
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-xl scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-lg border border-gray-200'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Awards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {filteredAwards.map((award, index) => (
              <AwardCard key={award.id} award={award} index={index} />
            ))}
          </div>

          {/* Awards Summary - Enhanced */}
          <div className="mt-20 p-10 bg-gradient-to-r from-yellow-50 via-orange-50 to-amber-50 rounded-3xl border-2 border-yellow-100 shadow-xl">
            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Awards by the Numbers</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Our commitment to excellence recognized through prestigious awards and honors
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-yellow-100">
                <div className="text-5xl font-bold text-yellow-600 mb-3">
                  {filteredAwards.length}
                </div>
                <p className="text-lg font-semibold text-gray-900">Total Awards</p>
                <p className="text-gray-600 mt-2">Since 1985</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-blue-100">
                <div className="text-5xl font-bold text-blue-600 mb-3">
                  {filteredAwards.filter(a => a.level === 'National').length}
                </div>
                <p className="text-lg font-semibold text-gray-900">National Awards</p>
                <p className="text-gray-600 mt-2">Highest honors nationwide</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-emerald-100">
                <div className="text-5xl font-bold text-emerald-600 mb-3">
                  {filteredAwards.filter(a => a.level === 'State').length}
                </div>
                <p className="text-lg font-semibold text-gray-900">State Awards</p>
                <p className="text-gray-600 mt-2">Regional excellence</p>
              </div>
              
              <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-purple-100">
                <div className="text-5xl font-bold text-purple-600 mb-3">
                  {filteredAwards.filter(a => a.category === 'Academic' || a.category === 'STEM' || a.category === 'Mathematics').length}
                </div>
                <p className="text-lg font-semibold text-gray-900">Academic Honors</p>
                <p className="text-gray-600 mt-2">Educational achievements</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Gallery - Enhanced */}
      <div className="py-24 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full mb-6 shadow-sm">
              <Camera className="w-5 h-5" />
              <span className="font-semibold">CAMPUS LIFE GALLERY</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Experience Life at Evergreen
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our vibrant campus through moments captured by students and faculty
            </p>
          </div>
          
          {/* Gallery Tabs - Enhanced */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {[
              { id: 'campus', label: 'Campus', icon: Building },
              { id: 'sports', label: 'Sports', icon: Trophy },
              { id: 'arts', label: 'Arts', icon: AwardIcon },
              { id: 'community', label: 'Community', icon: Users }
            ].map(tab => (
              <GalleryTab
                key={tab.id}
                isActive={activeGalleryTab === tab.id}
                onClick={() => {
                  setActiveGalleryTab(tab.id);
                  setCurrentImageIndex(0);
                }}
                icon={tab.icon}
                label={tab.label}
              />
            ))}
          </div>
          
          {/* Gallery Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {galleryImages[activeGalleryTab].map((image, index) => (
              <GalleryImageCard
                key={image.id}
                image={image}
                onClick={() => openGalleryModal(index)}
              />
            ))}
          </div>
          
          <div className="text-center">
            <Link
              to="/gallery"
              className="inline-flex items-center px-12 py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl group"
            >
              <span>Explore Full Gallery</span>
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Leadership Team - Enhanced */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full mb-6 shadow-sm">
              <Users className="w-5 h-5" />
              <span className="font-semibold">LEADERSHIP TEAM</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              Meet Our Visionary Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Guided by experienced educators and administrators committed to student success and innovation
            </p>
          </div>

          {renderLeadersContent()}

          {/* Leadership Stats - Enhanced */}
          <div className="mt-24 p-12 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 rounded-3xl border-2 border-blue-100 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="text-6xl font-bold text-blue-600 mb-4">
                  {leaders.length > 0 ? leaders.length : '4+'}
                </div>
                <p className="text-2xl font-bold text-gray-900">Dedicated Leaders</p>
                <p className="text-gray-600 mt-3">Average experience: 15+ years in education</p>
              </div>
              
              <div className="lg:col-span-2">
                <h4 className="text-3xl font-bold text-gray-900 mb-6">Our Leadership Philosophy</h4>
                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                  Our leadership team embraces a student-centered approach, focusing on creating an environment where every student can thrive. 
                  With diverse backgrounds in education, administration, and community building, our leaders work collaboratively to ensure 
                  Evergreen Academy remains at the forefront of innovative education.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-gray-900">Student-Centered Approach</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                    <Rocket className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-gray-900">Innovation Focused</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                    <Heart className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-gray-900">Community Building</span>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-white/50 rounded-xl">
                    <GlobeIcon className="w-6 h-6 text-blue-600" />
                    <span className="font-medium text-gray-900">Global Perspective</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Information - Enhanced */}
      <div className="py-24 bg-gradient-to-b from-white to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-6">
              State-of-the-Art Campus
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern facilities designed to inspire learning, creativity, and personal growth
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div className="space-y-8">
              {[
                {
                  icon: Building,
                  title: 'Smart Classrooms',
                  description: '50+ technology-integrated classrooms with interactive displays and collaborative learning spaces',
                  color: 'from-emerald-500 to-emerald-600'
                },
                {
                  icon: BookOpen,
                  title: 'Digital Learning Hub',
                  description: 'Extensive library with digital resources, VR learning stations, and quiet study zones',
                  color: 'from-blue-500 to-blue-600'
                },
                {
                  icon: Target,
                  title: 'Athletics Complex',
                  description: 'Olympic-sized pool, full-sized gymnasium, fitness center, and multiple professional playing fields',
                  color: 'from-orange-500 to-orange-600'
                },
                {
                  icon: GraduationCap,
                  title: 'Arts & Innovation Center',
                  description: 'Professional theater, music recording studios, art galleries, and maker spaces',
                  color: 'from-purple-500 to-purple-600'
                }
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-6 p-8 bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 transform group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="rounded-3xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-700">
                <img
                  src="https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=800&fit=crop&q=80"
                  alt="Evergreen Academy Campus"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/1200x800/0f766e/ffffff?text=Campus+View";
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -right-6 bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 max-w-sm transform hover:-translate-y-2 transition-transform duration-300">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-2xl text-gray-900">Visit Our Campus</p>
                    <p className="text-gray-600 mt-2">123 Education Avenue, Greenville, CA 94000</p>
                  </div>
                </div>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-between w-full px-6 py-4 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 font-bold rounded-xl hover:from-emerald-100 hover:to-emerald-200 group"
                >
                  <span>Schedule a Campus Tour</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced CTA Section */}
      <div className="py-32 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=2000&auto=format&fit=crop&q=80')`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-blue-900/80 to-purple-900/70"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full mb-8">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <span className="font-bold text-lg">DISCOVER THE EVERGREEN DIFFERENCE</span>
            </div>
            
            <h2 className="text-4xl sm:text-6xl font-extrabold text-white mb-8 leading-tight">
              Join Our Legacy of Excellence
            </h2>
            <p className="text-xl text-white/90 mb-10 max-w-3xl mx-auto leading-relaxed">
              Schedule a visit or speak with our admissions team to learn how Evergreen Academy can help your student achieve their full potential and become a future leader.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                to="/admissions"
                className="px-12 py-5 bg-white text-emerald-600 font-bold rounded-xl hover:bg-emerald-50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                <span>Admissions Process</span>
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to="/contact"
                className="px-12 py-5 bg-transparent text-white font-bold rounded-xl border-3 border-white hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                <span>Schedule a Tour</span>
                <CalendarDays className="w-6 h-6" />
              </Link>
            </div>
            
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-lg text-white/80 max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <CalendarDays className="w-5 h-5" />
                <span>Personalized Campus Tours</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <Users className="w-5 h-5" />
                <span>Meet Faculty & Students</span>
              </div>
              <div className="flex items-center justify-center gap-3 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                <GraduationCap className="w-5 h-5" />
                <span>Program Demonstrations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={galleryModalOpen}
        images={galleryImages[activeGalleryTab]}
        currentIndex={currentImageIndex}
        onClose={() => setGalleryModalOpen(false)}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </main>
  );
};

export default AboutView;