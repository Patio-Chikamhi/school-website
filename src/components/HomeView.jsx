// src/components/HomeView.jsx
import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Users, GraduationCap, ChevronRight, 
  Loader, Megaphone, Newspaper, CalendarDays, Trophy,
  Eye, Printer, ChevronDown, Camera, Heart, Music, Building,
  Target, Award, CheckCircle, School, Globe, Clock, Users2, MapPin,
  Sparkles, Star, Target as TargetIcon, ArrowRight, ChevronLeft,
  Zap, Shield, Globe as GlobeIcon, Heart as HeartIcon
} from 'lucide-react';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  doc, updateDoc, increment, getDocs, startAfter, where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import ApplyModal from './ApplyModal';
import VirtualTour from './VirtualTour';

// Enhanced gallery images with 5 rotating images
const rotatingImages = [
  { 
    id: 1, 
    src: 'https://firebasestorage.googleapis.com/v0/b/school-website-db.firebasestorage.app/o/gallery%2F1766437176705_low-rise-building.jpg?alt=media&token=2026603c-b015-4d14-ad10-3dc94fedc584', 
    alt: 'School Building', 
    title: 'Main Campus',
    description: 'State-of-the-art facilities for modern learning'
  },
  { 
    id: 2, 
    // Changed to a more reliable image source
    src: 'https://images.pexels.com/photos/256490/pexels-photo-256490.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2', 
    alt: 'Students in Classroom', 
    title: 'Interactive Learning',
    description: 'Engaging classroom environment'
  },
  { 
    id: 3, 
    // Using Pexels instead of Unsplash for reliability
    src: 'https://images.pexels.com/photos/863988/pexels-photo-863988.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2', 
    alt: 'Sports Field', 
    title: 'Athletics Excellence',
    description: 'Championship-winning sports programs'
  },
  { 
    id: 4, 
    // Reliable music performance image
    src: 'https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2', 
    alt: 'Music Performance', 
    title: 'Arts Program',
    description: 'Creative expression through arts'
  },
  { 
    id: 5, 
    // Science lab image from Pexels
    src: 'https://images.pexels.com/photos/256541/pexels-photo-256541.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=2', 
    alt: 'Science Lab', 
    title: 'STEM Innovation',
    description: 'Hands-on scientific exploration'
  }
];

// Gallery images data for gallery section
const galleryImages = {
  campus: [
    { id: 1, src: 'https://firebasestorage.googleapis.com/v0/b/school-website-db.firebasestorage.app/o/gallery%2F1766437176705_low-rise-building.jpg?alt=media&token=2026603c-b015-4d14-ad10-3dc94fedc584', alt: 'School Building', title: 'Main Campus' },
    { id: 2, src: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600', alt: 'Library', title: 'Learning Resource Center' },
    { id: 3, src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600', alt: 'Science Lab', title: 'Science Laboratory' },
  ],
  sports: [
    { id: 4, src: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600', alt: 'Basketball', title: 'Varsity Basketball' },
    { id: 5, src: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600', alt: 'Soccer', title: 'Championship Soccer' },
    { id: 6, src: 'https://images.unsplash.com/photo-1526676037774-2c2d0e5c195f?w=600', alt: 'Track', title: 'Track & Field' },
  ],
  arts: [
    { id: 7, src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600', alt: 'Theater', title: 'Drama Production' },
    { id: 8, src: 'https://images.unsplash.com/photo-1567942712661-82b9b407abbf?w=600', alt: 'Art Studio', title: 'Art Exhibition' },
    { id: 9, src: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600', alt: 'Music', title: 'Orchestra Performance' },
  ],
  community: [
    { id: 10, src: 'https://images.unsplash.com/photo-1524178234883-043d5c3f3cf4?w=600', alt: 'Volunteering', title: 'Community Service' },
    { id: 11, src: 'https://images.unsplash.com/photo-1542744095-fcf48d80b0fd?w=600', alt: 'Club Meeting', title: 'Student Clubs' },
    { id: 12, src: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=600', alt: 'Parent Meeting', title: 'Family Engagement' },
  ]
};

// Stats animation component
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

const HomeView = () => {
  
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);
  
  // Stats state with animated numbers
  const [studentCount, setStudentCount] = useState(1250);
  const [facultyCount, setFacultyCount] = useState(85);
  const [collegeAcceptance] = useState(95);
  const [studentTeacherRatio] = useState(15);
  const [targetStudentCount] = useState(2000);
  const [targetFacultyCount] = useState(100);
  
  // Gallery state
  const [activeGalleryTab, setActiveGalleryTab] = useState('campus');
  
  // Image carousel state
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Pagination states
  const [lastVisiblePost, setLastVisiblePost] = useState(null);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const [visiblePostsCount, setVisiblePostsCount] = useState(6);

  // Section pagination
  const [visibleAnnouncements, setVisibleAnnouncements] = useState(3);
  const [visibleNewsletters, setVisibleNewsletters] = useState(3);
  const [visibleEvents, setVisibleEvents] = useState(3);
  const [visibleAchievements, setVisibleAchievements] = useState(3);

  // References
  const loadMoreRef = useRef();
  const carouselRef = useRef();

  // Image carousel auto-rotation
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 5000);
     
    return () => clearInterval(interval);
  }, [currentImageIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array means this runs once on mount
  
  useEffect(() => {
    const interval = setInterval(() => {
      nextImage();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentImageIndex]);

  // Image transition function
  const nextImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === rotatingImages.length - 1 ? 0 : prevIndex + 1
      );
      setIsTransitioning(false);
    }, 300);
  };

  const prevImage = () => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? rotatingImages.length - 1 : prevIndex - 1
      );
      setIsTransitioning(false);
    }, 300);
  };

  // Fetch posts
  useEffect(() => {
    if (!db) {
      setPostsLoading(false);
      setPostsError("Database not connected");
      return;
    }

    const loadInitialPosts = async () => {
      try {
        const postsRef = collection(db, 'posts');
        const q = query(
          postsRef, 
          orderBy('date', 'desc'),
          limit(50)
        );

        setPostsLoading(true);

        const unsubscribe = onSnapshot(q,
          (snapshot) => {
            const postsList = [];
            snapshot.forEach(doc => {
              const data = doc.data();
              postsList.push({
                id: doc.id,
                ...data,
                date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now()),
                views: data.views || 0,
                isMonthly: data.isMonthly || false,
                issue: data.issue || null,
                author: data.author || 'Admin',
                eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : data.eventDate,
                location: data.location || null
              });
            });
            
            setPosts(postsList);
            setLastVisiblePost(snapshot.docs[snapshot.docs.length - 1]);
            setHasMorePosts(postsList.length === 50);
            setPostsLoading(false);
            setPostsError(null);
          },
          (error) => {
            console.error("Error fetching posts:", error);
            setPostsError("Failed to load updates. Please try again later.");
            setPostsLoading(false);
          }
        );

        return () => unsubscribe();
      } catch (error) {
        console.error("Error loading posts:", error);
        setPostsError("Failed to load updates.");
        setPostsLoading(false);
      }
    };

    loadInitialPosts();
  }, []);

  // Setup intersection observer
  useEffect(() => {
    if (!hasMorePosts || loadingMorePosts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 0.5, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observer && loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMorePosts, loadingMorePosts]);

  const loadMorePosts = async () => {
    if (!lastVisiblePost || !hasMorePosts || loadingMorePosts) return;
    
    setLoadingMorePosts(true);
    
    try {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef, 
        orderBy('date', 'desc'),
        startAfter(lastVisiblePost),
        limit(10)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHasMorePosts(false);
        setLoadingMorePosts(false);
        return;
      }

      const newPosts = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        newPosts.push({
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now()),
          views: data.views || 0,
          isMonthly: data.isMonthly || false,
          issue: data.issue || null,
          author: data.author || 'Admin',
          eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : data.eventDate,
          location: data.location || null
        });
      });

      setPosts(prev => [...prev, ...newPosts]);
      setLastVisiblePost(snapshot.docs[snapshot.docs.length - 1]);
      setHasMorePosts(newPosts.length === 10);
      setVisiblePostsCount(prev => Math.min(prev + 6, posts.length + newPosts.length));
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  // Filter posts by category
  const announcements = useMemo(() => 
    posts.filter(post => post.category === 'announcement'),
    [posts]
  );

  const newsletters = useMemo(() => 
    posts.filter(post => post.category === 'newsletter'),
    [posts]
  );

  const events = useMemo(() => 
    posts.filter(post => post.category === 'event'),
    [posts]
  );

  const achievements = useMemo(() => 
    posts.filter(post => post.category === 'achievement'),
    [posts]
  );

  const displayedPosts = useMemo(() => 
    posts.slice(0, visiblePostsCount),
    [posts, visiblePostsCount]
  );

  const displayedAnnouncements = useMemo(() => 
    announcements.slice(0, visibleAnnouncements),
    [announcements, visibleAnnouncements]
  );

  const displayedNewsletters = useMemo(() => 
    newsletters.slice(0, visibleNewsletters),
    [newsletters, visibleNewsletters]
  );

  const displayedEvents = useMemo(() => 
    events.slice(0, visibleEvents),
    [events, visibleEvents]
  );

  const displayedAchievements = useMemo(() => 
    achievements.slice(0, visibleAchievements),
    [achievements, visibleAchievements]
  );

  // Post functions
  const incrementViews = async (postId) => {
    try {
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? { ...post, views: (post.views || 0) + 1 }
            : post
        )
      );

      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        views: increment(1),
        updatedAt: new Date()
      });
    } catch (error) {RefreshCw, Info
      console.error('Error incrementing views:', error);
    }
  };

  const handleOpenPost = async (post) => {
    await incrementViews(post.id);
    setSelectedPost(post);
    setShowPostModal(true);
  };

  // Load more functions
  const loadMoreAnnouncements = () => setVisibleAnnouncements(prev => prev + 3);
  const loadMoreNewsletters = () => setVisibleNewsletters(prev => prev + 3);
  const loadMoreEvents = () => setVisibleEvents(prev => prev + 3);
  const loadMoreAchievements = () => setVisibleAchievements(prev => prev + 3);

  const handlePrint = () => {
    window.print();
  };

  const formatFullDate = (date) => {
    if (!date) return 'Date not available';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Post Card Component - Updated to match your image structure
  const NewsCard = ({ post, featured = false }) => {
    const getCategoryColor = (category) => {
      switch(category) {
        case 'STUDENT LIFE': return 'bg-emerald-100 text-emerald-800';
        case 'ACADEMICS': return 'bg-blue-100 text-blue-800';
        case 'SPORTS': return 'bg-orange-100 text-orange-800';
        case 'EVENTS': return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div 
        className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border cursor-pointer overflow-hidden group ${
          featured ? 'md:col-span-2 lg:col-span-3' : ''
        }`}
        onClick={() => handleOpenPost(post)}
      >
        <div className="p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags?.map((tag, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>
          
          <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
            {post.title}
          </h4>
          
          {post.summary && !featured && (
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {post.summary}
            </p>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <CalendarDays className="w-4 h-4" />
              <span>{post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            
            <button 
              className="inline-flex items-center text-emerald-600 hover:text-emerald-800 text-sm font-medium group"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPost(post);
              }}
            >
              Read More 
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLatestPosts = () => {
    if (postsLoading) {
      return (
        <div className="flex justify-center items-center py-10">
          <Loader className="w-8 h-8 animate-spin text-emerald-600 mr-3" />
          <p className="text-lg">Loading latest updates...</p>
        </div>
      );
    }

    if (postsError) {
      return (
        <div className="text-center py-10 text-red-600">
          <p>{postsError}</p>
        </div>
      );
    }

    if (displayedPosts.length === 0) {
      return (
        <div className="text-center py-10 text-gray-500">
          <p>No updates available right now. Check back soon!</p>
        </div>
      );
    }

    return (
      <>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedPosts.map(post => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
        
        {hasMorePosts && displayedPosts.length < posts.length && (
          <div ref={loadMoreRef} className="mt-10 text-center">
            {loadingMorePosts ? (
              <div className="inline-flex items-center gap-2 px-8 py-3 text-emerald-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Loading more posts...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                <p>Scroll down to load more posts</p>
                <p className="text-xs mt-1">Showing {displayedPosts.length} of {posts.length} posts</p>
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section with Image Carousel  */}
<div className="relative overflow-hidden min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]">
  {/* Image Carousel */}
  <div className="absolute inset-0">
    {rotatingImages.map((image, index) => (
      <div
        key={image.id}
        className={`absolute inset-0 transition-all duration-700 ease-in-out ${
          index === currentImageIndex
            ? 'opacity-100 scale-105'
            : 'opacity-0 scale-100'
        }`}
      >
        <img
          className="w-full h-full object-cover"
          src={image.src}
          alt={image.alt}
          onError={(e) => {
            // Fallback to gradient backgrounds
            const fallbackColors = [
              'bg-gradient-to-r from-emerald-600 to-emerald-800',
              'bg-gradient-to-r from-blue-600 to-blue-800',
              'bg-gradient-to-r from-purple-600 to-purple-800',
              'bg-gradient-to-r from-yellow-600 to-yellow-800',
              'bg-gradient-to-r from-red-600 to-red-800'
            ];
            e.target.parentElement.innerHTML = `
              <div class="w-full h-full ${fallbackColors[index]} flex items-center justify-center">
                <div class="text-center text-white p-8">
                  <div class="text-4xl mb-4">${image.title}</div>
                  <div class="text-xl opacity-80">${image.description}</div>
                </div>
              </div>
            `;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/70 to-blue-900/60"></div>
      </div>
    ))}
  </div>

  {/* REMOVED ARROW CONTROLS HERE */}
  
  {/* Carousel Indicators - Moved to bottom right */}
  <div className="absolute bottom-6 right-4 z-20 flex gap-2">
    {rotatingImages.map((_, index) => (
      <button
        key={index}
        onClick={() => setCurrentImageIndex(index)}
        className={`w-2 h-2 rounded-full transition-all ${
          index === currentImageIndex
            ? 'bg-white w-6'
            : 'bg-white/50 hover:bg-white/80'
        }`}
      />
    ))}
  </div>

  <div className="relative z-10 h-full flex items-center">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="py-12 sm:py-16 lg:py-24 xl:py-32">
        <div className="lg:max-w-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <span className="text-white font-semibold tracking-wider">WELCOME TO EVERGREEN ACADEMY</span>
          </div>
          <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="block">Igniting Potential.</span>
            <span className="block text-yellow-300 mt-2">Inspiring Futures.</span>
          </h1>
          <p className="mt-6 text-lg text-white sm:text-xl md:text-2xl max-w-xl">
            Welcome to Evergreen Academy, where rigorous academics meet compassionate community. We prepare students for excellence in a rapidly changing world.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-100 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-2"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowVirtualTour(true)}
              className="px-8 py-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl border-2 border-emerald-500 hover:border-emerald-600 flex items-center gap-2"
            >
              <span>Virtual Tour</span>
              <Camera className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

      {/* Animated Stats Section - BY THE NUMBERS */}
      <div className="py-6 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-100 text-emerald-700 rounded-full mb-4">
              <TargetIcon className="w-5 h-5" />
              <span className="font-semibold">BY THE NUMBERS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Excellence in Education
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-emerald-100 group">
              <div className="text-4xl font-bold text-emerald-700 mb-2 h-16 flex items-center justify-center">
                <AnimatedNumber value="1250" suffix="+" />
              </div>
              <div className="text-sm text-gray-600 font-medium">Students</div>
              <div className="mt-4 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(studentCount / targetStudentCount) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 group">
              <div className="text-4xl font-bold text-blue-700 mb-2 h-16 flex items-center justify-center">
                <AnimatedNumber value="85" suffix="+" />
              </div>
              <div className="text-sm text-gray-600 font-medium">Faculty</div>
              <div className="mt-4 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                  style={{ width: `${(facultyCount / targetFacultyCount) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-purple-100 group">
              <div className="text-4xl font-bold text-purple-700 mb-2 h-16 flex items-center justify-center">
                <AnimatedNumber value="95" suffix="%" />
              </div>
              <div className="text-sm text-gray-600 font-medium">College Acceptance</div>
              <div className="mt-4 h-2 bg-purple-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                  style={{ width: `${collegeAcceptance}%` }}
                />
              </div>
            </div>
            
            <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-yellow-100 group">
              <div className="text-4xl font-bold text-yellow-700 mb-2 h-16 flex items-center justify-center">
                <AnimatedNumber value="15" suffix=":1" />
              </div>
              <div className="text-sm text-gray-600 font-medium">Student-Teacher Ratio</div>
              <div className="mt-4 h-2 bg-yellow-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admissions Process with Background */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=2000&auto=format&fit=crop&q=80"
            alt="Admissions background"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://placehold.co/2000x800/0f766e/ffffff?text=Admissions+Process";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 to-blue-900/70"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                Admissions Process 2026
              </h2>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                Discover how to join our vibrant community. Our admissions process is designed to identify students who will thrive in our challenging yet supportive environment.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  number: 1,
                  title: "Inquiry & Tour",
                  description: "Begin your journey by requesting information and scheduling a campus tour. Meet our faculty and see our facilities firsthand.",
                  icon: <CalendarDays className="w-8 h-8" />,
                  action: () => setShowVirtualTour(true),
                  actionText: "Schedule Tour"
                },
                {
                  number: 2,
                  title: "Application",
                  description: "Submit your online application along with required documents. Our team reviews applications on a rolling basis.",
                  icon: <BookOpen className="w-8 h-8" />,
                  action: () => setShowApplyModal(true),
                  actionText: "Start Application"
                },
                {
                  number: 3,
                  title: "Decision & Enrollment",
                  description: "Receive your admission decision and complete enrollment. Welcome to the Evergreen Academy family!",
                  icon: <Award className="w-8 h-8" />,
                  action: () => window.location.href = "/admissions",
                  actionText: "Learn More"
                }
              ].map((step, index) => (
                <div 
                  key={index}
                  className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                      <span className="text-3xl font-bold text-emerald-600">{step.number}</span>
                    </div>
                    <div className="text-emerald-600">{step.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 mb-6">{step.description}</p>
                  <button
                    onClick={step.action}
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium group"
                  >
                    {step.actionText}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Evergreen - WITH BACKGROUND IMAGE */}
      <div className="py-24 relative overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1519681393784-d120267933ba?w=2000&auto=format&fit=crop&q=80')`,
            backgroundAttachment: 'fixed',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-blue-900/75 to-purple-900/65"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full mb-4">
                <Star className="w-5 h-5" />
                <span className="font-semibold">WHY CHOOSE US</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-6">
                Why Choose Evergreen Academy?
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                  <BookOpen className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Rigorous Curriculum</h3>
                <p className="text-gray-600">Our advanced placement and honors programs challenge students to think critically and solve complex problems with innovative teaching methods.</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Small Class Sizes</h3>
                <p className="text-gray-600">A low student-to-teacher ratio ensures personalized attention and strong mentorship for every learner's unique journey.</p>
              </div>
              
              <div className="bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-6">
                  <GraduationCap className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">College Readiness</h3>
                <p className="text-gray-600">100% college acceptance rate with dedicated guidance counseling starting from freshman year and comprehensive support.</p>
              </div>
            </div>
            
            <div className="mt-12 text-center">
              <Link
                to="/about"
                className="inline-flex items-center px-8 py-3 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <span>Learn More About Us</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Gallery */}
      <div className="py-16 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-6">
              Campus Gallery
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Explore life at Evergreen Academy through our vibrant community
            </p>
          </div>
          
          {/* Gallery Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {[
              { id: 'campus', label: 'Campus', icon: <Building className="w-5 h-5" /> },
              { id: 'sports', label: 'Sports', icon: <Trophy className="w-5 h-5" /> },
              { id: 'arts', label: 'Arts', icon: <Music className="w-5 h-5" /> },
              { id: 'community', label: 'Community', icon: <Heart className="w-5 h-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveGalleryTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                  activeGalleryTab === tab.id
                    ? 'bg-emerald-600 text-white shadow-lg transform scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border hover:shadow-md'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Gallery Images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages[activeGalleryTab].map(image => (
              <div 
                key={image.id}
                className="relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 group"
              >
                <div className="aspect-w-4 aspect-h-3 overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = "https://placehold.co/600x400/0f766e/ffffff?text=Campus+Image";
                    }}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="text-lg font-bold mb-2">{image.title}</h4>
                    <p className="text-sm opacity-90">Click to view larger</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 transform translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                  <Camera className="w-5 h-5 text-gray-700" />
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link
              to="/gallery"
              className="inline-flex items-center px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
            >
              <span>View Full Gallery</span>
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Latest News - WITH IMAGES */}
<div className="py-20 bg-gradient-to-r from-emerald-50/50 via-blue-50/50 to-purple-50/50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-12">
      <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
        Latest News
      </h2>
      <p className="text-lg text-gray-600 max-w-3xl mx-auto">
        What's happening at Evergreen Academy. Discover the achievements, events, and community spirit that shape our environment.
      </p>
    </div>

    {/* Student Life Section */}
    <div className="mb-16">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <HeartIcon className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900">STUDENT LIFE</h3>
          <p className="text-gray-600">Definitely Feeling Inspired</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Sample News Items with Images */}
        <div className="group bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop&q=80" 
              alt="Rugby Championship"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-medium">
                STUDENT LIFE
              </span>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
              The Tiger Triumph at National Rugby Championships
            </h4>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              Our varsity rugby team secured first place in the national championships, showcasing exceptional teamwork and sportsmanship.
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
              <span>admin — March 17, 2025</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80" 
              alt="Science Fair"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-medium">
                STUDENT LIFE
              </span>
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                ACADEMICS
              </span>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
              Students Shine in National Science Fair
            </h4>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              Our students showcased innovative projects at the national science fair, winning multiple awards for their groundbreaking research.
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
              <span>January 25, 2025</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
          <div className="relative h-48 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80" 
              alt="Math Competition"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-medium">
                ACADEMICS
              </span>
            </div>
          </div>
          <div className="p-6">
            <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
              Math Team Wins Regional Competition
            </h4>
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              Our mathematics team clinched victory at the regional math Olympiad, demonstrating exceptional problem-solving skills.
            </p>
            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
              <span>February 14, 2025</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Dynamic Posts from Firestore - With Image Support */}
    {posts.length > 0 && (
      <div className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900"></h3>
          <Link 
            to="/posts" 
            className="inline-flex items-center px-6 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors duration-200"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
        
        {/* Enhanced PostCard with Image Support */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedPosts.map(post => {
            // Determine image based on post data
            const getPostImage = () => {
              // If post has image field, use it
              if (post.imageUrl) return post.imageUrl;
              
              // Otherwise use category-based fallback images
              const categoryImages = {
                'announcement': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80',
                'newsletter': 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&auto=format&fit=crop&q=80',
                'event': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
                'achievement': 'https://images.unsplash.com/photo-1561489396-888724a1543d?w=800&auto=format&fit=crop&q=80'
              };
              
              return categoryImages[post.category] || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80';
            };

            const getCategoryColor = (category) => {
              switch(category) {
                case 'announcement': return 'bg-blue-600 text-white';
                case 'newsletter': return 'bg-emerald-600 text-white';
                case 'event': return 'bg-purple-600 text-white';
                case 'achievement': return 'bg-yellow-600 text-white';
                default: return 'bg-gray-600 text-white';
              }
            };

            return (
              <div 
                key={post.id}
                className="group bg-white rounded-2xl shadow-lg border overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onClick={() => handleOpenPost(post)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={getPostImage()}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(post.category)}`}>
                      {post.category.toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-xs text-white/90 bg-black/30 backdrop-blur-sm px-2 py-1 rounded">
                      {post.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {post.title}
                  </h4>
                  {post.summary && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {post.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span>{post.views || 0} views</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 group-hover:text-emerald-800">
                      <span className="font-medium">Read More</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {hasMorePosts && displayedPosts.length < posts.length && (
          <div ref={loadMoreRef} className="mt-10 text-center">
            {loadingMorePosts ? (
              <div className="inline-flex items-center gap-2 px-8 py-3 text-emerald-600">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Loading more posts...</span>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                <p>Scroll down to load more posts</p>
                <p className="text-xs mt-1">Showing {displayedPosts.length} of {posts.length} posts</p>
              </div>
            )}
          </div>
        )}
      </div>
    )}
  </div>
</div>

      {/* Final Call to Action */}
      <div className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=2000&auto=format&fit=crop&q=80"
            alt="CTA background"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://placehold.co/2000x800/0f766e/ffffff?text=Join+Our+Community";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-blue-900/70 to-purple-900/60"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">LIMITED SPOTS AVAILABLE</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
              Ready to Join Our Community?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Schedule a visit or start your application today. Our admissions team is here to help you every step of the way.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Start Application</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowVirtualTour(true)}
                className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Schedule Virtual Tour</span>
                <Camera className="w-5 h-5" />
              </button>
            </div>
            
            <p className="mt-8 text-sm text-white/70">
              Admissions for 2026 are now open. Apply before March 31st for early decision.
            </p>
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      {showPostModal && selectedPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowPostModal(false)}
          />
          
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
              <div className="sticky top-0 z-10 bg-gradient-to-r from-emerald-600 to-blue-600 text-white px-8 py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedPost.title}</h2>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-white/90">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Category:</span>
                        <span className="capitalize">{selectedPost.category}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        <span>{formatFullDate(selectedPost.date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{selectedPost.views || 0} views</span>
                      </div>
                      {selectedPost.isMonthly && (
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-medium">
                          Monthly Newsletter
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrint}
                      className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-colors duration-150"
                    >
                      <Printer className="w-5 h-5" />
                      Print
                    </button>
                    
                    <button
                      onClick={() => setShowPostModal(false)}
                      className="text-white hover:bg-white/20 p-2 rounded-full transition-colors duration-150"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="overflow-y-auto p-8">
                {selectedPost.summary && (
                  <div className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <h3 className="font-semibold text-emerald-800 mb-2 text-lg">Summary</h3>
                    <p className="text-emerald-700">{selectedPost.summary}</p>
                  </div>
                )}
                
                <div className="prose prose-lg max-w-none">
                  <div className="whitespace-pre-line text-gray-800 leading-relaxed">
                    {selectedPost.content || 'No content available.'}
                  </div>
                </div>

                {selectedPost.eventDate && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl border border-emerald-100">
                    <h4 className="font-semibold text-gray-900 mb-4 text-lg">Event Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="w-5 h-5 text-emerald-600" />
                        <span className="text-gray-700">
                          {new Date(selectedPost.eventDate).toLocaleDateString('en-US', { 
                            weekday: 'long',
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {selectedPost.location && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-emerald-600" />
                          <span className="text-gray-700">{selectedPost.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="sticky bottom-0 border-t border-gray-200 bg-white px-8 py-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {selectedPost.author && (
                      <span>Posted by: <span className="font-medium">{selectedPost.author}</span></span>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPostModal(false)}
                      className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-150 transform hover:-translate-y-0.5"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ApplyModal 
        isOpen={showApplyModal} 
        onClose={() => setShowApplyModal(false)} 
      />
      <VirtualTour 
        isOpen={showVirtualTour} 
        onClose={() => setShowVirtualTour(false)} 
      />
    </main>
  );
};

export default HomeView;