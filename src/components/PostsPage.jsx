// PostsPage.jsx - Complete Fixed Version with Integrated Improvements
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  Megaphone, Newspaper, CalendarDays, Trophy, 
  ChevronLeft, User, Calendar, Tag, Loader, ChevronDown, ChevronUp,
  Eye, Clock, Filter, Printer, Download, Share2, Bookmark, Mail,
  ArrowRight, Sparkles, Star, Target, Camera, BookOpen, Users,
  GraduationCap, Award, Heart, Music, Building, MapPin, Zap,
  Globe, Users2, Share, MessageSquare,
  ExternalLink, BookmarkPlus, BookmarkCheck, Search, X,
  TrendingUp, BarChart, Bell, AlertCircle, RefreshCw, Copy,
  Linkedin, Twitter, Facebook, Mail as MailIcon, Home,
  Grid, List, Paperclip, Info, AlertTriangle, HelpCircle,
  Check, FileText, MessageCircle, ThumbsUp
} from 'lucide-react';

// Enhanced Category Badge Component
const CategoryBadge = ({ category }) => {
  const getCategoryConfig = (category) => {
    const configs = {
      'announcement': {
        label: 'Announcement',
        icon: <Megaphone className="w-4 h-4" />,
        gradient: 'from-blue-500 to-indigo-600',
        bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        text: 'text-blue-600',
        border: 'border-blue-200'
      },
      'newsletter': {
        label: 'Newsletter',
        icon: <Newspaper className="w-4 h-4" />,
        gradient: 'from-emerald-500 to-teal-600',
        bg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
        text: 'text-emerald-600',
        border: 'border-emerald-200'
      },
      'event': {
        label: 'Event',
        icon: <CalendarDays className="w-4 h-4" />,
        gradient: 'from-purple-500 to-purple-600',
        bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
        text: 'text-purple-600',
        border: 'border-purple-200'
      },
      'achievement': {
        label: 'Achievement',
        icon: <Trophy className="w-4 h-4" />,
        gradient: 'from-yellow-500 to-orange-600',
        bg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
        text: 'text-yellow-600',
        border: 'border-yellow-200'
      }
    };
    return configs[category] || {
      label: category,
      icon: <Newspaper className="w-4 h-4" />,
      gradient: 'from-gray-500 to-gray-600',
      bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
      text: 'text-gray-600',
      border: 'border-gray-200'
    };
  };

  const config = getCategoryConfig(category);

  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 ${config.bg} text-white rounded-full text-sm font-bold shadow-md`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// Enhanced Post Card Component
const PostCard = ({ post, onClick, isFeatured = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  
  const config = getCategoryConfig(post.category);
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const sharePost = (platform) => {
    const url = `${window.location.origin}/posts/${post.id}`;
    const text = `${post.title} - Evergreen Academy`;
    
    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}\n\n${post.summary}`)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }
    setShowShareMenu(false);
  };

  return (
    <div 
      className={`group relative bg-white rounded-3xl shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 cursor-pointer overflow-hidden ${
        isFeatured ? 'lg:col-span-2' : ''
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Pattern */}
      <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500 ${config.gradient}`} />
      
      {/* Post Image */}
      <div className="relative h-64 overflow-hidden rounded-t-3xl">
        <img
          src={post.imageUrl}
          alt={post.title}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            e.target.src = getFallbackImage(post.category);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        
        {/* Category Badge */}
        <div className="absolute top-6 left-6">
          <CategoryBadge category={post.category} />
        </div>
        
        {/* Featured Badge */}
        {post.isFeatured && (
          <div className="absolute top-6 right-6">
            <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-xs font-bold flex items-center gap-1">
              <Star className="w-3 h-3" />
              Featured
            </span>
          </div>
        )}
        
        {/* Quick Actions Overlay */}
        <div className={`absolute bottom-0 left-0 right-0 p-6 transform transition-all duration-500 ${
          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsBookmarked(!isBookmarked);
              }}
              className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-emerald-600" />
              ) : (
                <BookmarkPlus className="w-5 h-5 text-gray-600" />
              )}
            </button>
            
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowShareMenu(!showShareMenu);
                }}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
              >
                <Share className="w-5 h-5 text-gray-600" />
              </button>
              
              {showShareMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 min-w-[180px] z-50">
                  <div className="text-xs font-bold text-gray-500 px-3 py-2">Share via</div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { icon: <Copy className="w-4 h-4" />, label: 'Copy Link', action: () => sharePost('copy') },
                      { icon: <Twitter className="w-4 h-4 text-blue-400" />, label: 'Twitter', action: () => sharePost('twitter') },
                      { icon: <Facebook className="w-4 h-4 text-blue-600" />, label: 'Facebook', action: () => sharePost('facebook') },
                      { icon: <Linkedin className="w-4 h-4 text-blue-700" />, label: 'LinkedIn', action: () => sharePost('linkedin') },
                      { icon: <MailIcon className="w-4 h-4 text-red-500" />, label: 'Email', action: () => sharePost('email') },
                      { icon: <MessageSquare className="w-4 h-4 text-green-500" />, label: 'Message', action: () => sharePost('message') }
                    ].map((item, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          item.action();
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Post Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:underline">
            {post.title}
          </h3>
          <div className="flex items-center gap-4 text-white/90 text-sm">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(post.date)}
            </span>
            {post.author && (
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="p-6">
        <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
          {post.summary}
        </p>
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-xs">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.views?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{post.comments || 0}</span>
            </div>
            {post.attachments && (
              <div className="flex items-center gap-1">
                <Paperclip className="w-4 h-4" />
                <span>{post.attachments}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              to={`/posts/${post.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md group/button"
              onClick={(e) => e.stopPropagation()}
            >
              <span>Read More</span>
              <ArrowRight className="w-4 h-4 group-hover/button:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-emerald-200/50 transition-all duration-500 pointer-events-none"></div>
    </div>
  );
};

// Helper functions
const getFallbackImage = (category) => {
  const categoryImages = {
    'announcement': 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=1200&auto=format&fit=crop&q=80',
    'newsletter': 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=1200&auto=format&fit=crop&q=80',
    'event': 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    'achievement': 'https://images.unsplash.com/photo-1561489396-888724a1543d?w=1200&auto=format&fit=crop&q=80'
  };
  return categoryImages[category] || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80';
};

const getCategoryConfig = (category) => {
  const configs = {
    'announcement': {
      label: 'Announcement',
      icon: <Megaphone className="w-4 h-4" />,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      text: 'text-blue-600',
      border: 'border-blue-200',
      light: 'bg-blue-50'
    },
    'newsletter': {
      label: 'Newsletter',
      icon: <Newspaper className="w-4 h-4" />,
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      light: 'bg-emerald-50'
    },
    'event': {
      label: 'Event',
      icon: <CalendarDays className="w-4 h-4" />,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
      text: 'text-purple-600',
      border: 'border-purple-200',
      light: 'bg-purple-50'
    },
    'achievement': {
      label: 'Achievement',
      icon: <Trophy className="w-4 h-4" />,
      gradient: 'from-yellow-500 to-orange-600',
      bg: 'bg-gradient-to-r from-yellow-500 to-orange-600',
      text: 'text-yellow-600',
      border: 'border-yellow-200',
      light: 'bg-yellow-50'
    }
  };
  return configs[category] || {
    label: category,
    icon: <Newspaper className="w-4 h-4" />,
    gradient: 'from-gray-500 to-gray-600',
    bg: 'bg-gradient-to-r from-gray-500 to-gray-600',
    text: 'text-gray-600',
    border: 'border-gray-200',
    light: 'bg-gray-50'
  };
};

// Enhanced Filter Chip Component
const FilterChip = ({ category, isActive, onClick }) => {
  const config = getCategoryConfig(category.id);
  
  return (
    <button
      onClick={onClick}
      className={`group relative flex items-center gap-3 px-6 py-3 rounded-full font-medium transition-all duration-500 transform hover:-translate-y-1 ${
        isActive
          ? `bg-gradient-to-r ${config.gradient} text-white shadow-xl scale-105`
          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:shadow-lg'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
      }`}>
        {category.icon}
      </div>
      <div className="text-left">
        <div className="font-bold">{category.label}</div>
        <div className="text-xs opacity-75">{category.count} posts</div>
      </div>
      
      {isActive && (
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
          <Check className="w-3 h-3 text-yellow-800" />
        </div>
      )}
    </button>
  );
};

// Enhanced Search Component
const SearchBar = ({ value, onChange, onClear }) => {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className={`relative max-w-2xl mx-auto transition-all duration-500 ${
      isFocused ? 'scale-105' : ''
    }`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Search news, events, achievements..."
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-6 py-4 pl-14 pr-12 bg-white/90 backdrop-blur-sm border-2 border-emerald-100 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/30 focus:border-emerald-500 text-lg transition-all duration-500"
        />
        <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-emerald-500">
          <Search className="w-6 h-6" />
        </div>
        {value && (
          <button
            onClick={onClear}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {/* Search Suggestions */}
      {isFocused && value && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 z-50">
          <div className="text-sm font-bold text-gray-500 mb-2">Popular searches</div>
          <div className="flex flex-wrap gap-2">
            {['Sports Day', 'Exam Schedule', 'Parent-Teacher Meeting', 'Science Fair', 'Cultural Fest'].map((term, index) => (
              <button
                key={index}
                onClick={() => onChange({ target: { value: term } })}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const PostsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [singlePost, setSinglePost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [bookmarkedPosts, setBookmarkedPosts] = useState(new Set());
  const [stats, setStats] = useState({
    total: 0,
    categories: {},
    monthly: 0,
    featured: 0
  });
  
  // Categories with icons and colors
  const categories = [
    { id: 'all', label: 'All Updates', icon: <Sparkles className="w-5 h-5" />, gradient: 'from-emerald-500 to-blue-500' },
    { id: 'announcement', label: 'Announcements', icon: <Megaphone className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-600' },
    { id: 'newsletter', label: 'Newsletters', icon: <Newspaper className="w-5 h-5" />, gradient: 'from-emerald-500 to-teal-600' },
    { id: 'event', label: 'Events', icon: <CalendarDays className="w-5 h-5" />, gradient: 'from-purple-500 to-purple-600' },
    { id: 'achievement', label: 'Achievements', icon: <Trophy className="w-5 h-5" />, gradient: 'from-yellow-500 to-orange-600' }
  ];

  useEffect(() => {
    if (id) {
      loadSinglePost(id);
    } else {
      loadAllPosts();
    }
  }, [id]);

  const loadAllPosts = async () => {
    try {
      setLoading(true);
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('date', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const postsList = [];
      const categoryCounts = {};
      let monthlyCount = 0;
      let featuredCount = 0;
      
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const post = {
          id: doc.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now()),
          imageUrl: data.imageUrl || getFallbackImage(data.category),
          tags: data.tags || [data.category.charAt(0).toUpperCase() + data.category.slice(1)],
          views: data.views || 0,
          comments: data.comments || 0,
          attachments: data.attachments || 0
        };
        
        postsList.push(post);
        
        // Update stats
        categoryCounts[data.category] = (categoryCounts[data.category] || 0) + 1;
        if (data.isMonthly) monthlyCount++;
        if (data.isFeatured) featuredCount++;
      });
      
      setPosts(postsList);
      setStats({
        total: postsList.length,
        categories: categoryCounts,
        monthly: monthlyCount,
        featured: featuredCount
      });
      setLoading(false);
    } catch (err) {
      console.error("Error loading posts:", err);
      setError("Failed to load posts. Please try again.");
      setLoading(false);
    }
  };

  const loadSinglePost = async (postId) => {
    try {
      setLoading(true);
      const postRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(postRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const post = {
          id: docSnap.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now()),
          imageUrl: data.imageUrl || getFallbackImage(data.category),
          tags: data.tags || [data.category.charAt(0).toUpperCase() + data.category.slice(1)],
          views: data.views || 0,
          comments: data.comments || 0,
          attachments: data.attachments || 0
        };
        
        setSinglePost(post);
        
        // Increment view count
        await updateDoc(postRef, {
          views: increment(1),
          lastViewed: new Date()
        });
      } else {
        setError("Post not found. It may have been removed.");
      }
      setLoading(false);
    } catch (err) {
      console.error("Error loading post:", err);
      setError("Failed to load post. Please try again.");
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = activeCategory === 'all' || post.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.date - a.date;
      case 'oldest':
        return a.date - b.date;
      case 'mostViewed':
        return (b.views || 0) - (a.views || 0);
      case 'mostCommented':
        return (b.comments || 0) - (a.comments || 0);
      default:
        return b.date - a.date;
    }
  });

  const toggleBookmark = (postId) => {
    const newBookmarks = new Set(bookmarkedPosts);
    if (newBookmarks.has(postId)) {
      newBookmarks.delete(postId);
    } else {
      newBookmarks.add(postId);
    }
    setBookmarkedPosts(newBookmarks);
    
    localStorage.setItem('bookmarkedPosts', JSON.stringify([...newBookmarks]));
  };

  useEffect(() => {
    const savedBookmarks = localStorage.getItem('bookmarkedPosts');
    if (savedBookmarks) {
      setBookmarkedPosts(new Set(JSON.parse(savedBookmarks)));
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-blue-50/50 to-purple-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader className="w-16 h-16 animate-spin text-emerald-600 mb-6" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-xl"></div>
          </div>
          <p className="text-xl text-gray-700 font-medium">Loading updates...</p>
          <p className="text-gray-500 mt-2">Fetching the latest news and events</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-blue-50/50 to-purple-50/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-50 text-red-700 rounded-full mb-6">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">Error Loading Content</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{error}</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're having trouble loading the content. Please check your connection and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={loadAllPosts}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              to="/"
              className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (singlePost) {
    return <SinglePostView post={singlePost} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-blue-50/50 to-purple-50/50">
      {/* Fixed Hero Header with Image */}
      <div className="relative py-24 lg:py-32 overflow-hidden">
        {/* Background Image Container - FIXED */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-fixed scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=2000&auto=format&fit=crop&q=80')`,
              backgroundAttachment: 'fixed'
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-blue-900/75 to-purple-900/65"></div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden z-10">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 bg-white/20 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${10 + Math.random() * 20}s`
              }}
            />
          ))}
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-transparent rounded-full blur-3xl"></div>
        
        <div className="relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full mb-6 animate-pulse border border-white/30">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold tracking-wider">SCHOOL UPDATES & NEWS</span>
              </div>
              
              {/* Main Heading with Gradient Text */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6">
                <span className="block">Stay Connected with</span>
                <span className="block mt-4 bg-gradient-to-r from-yellow-300 via-emerald-300 to-blue-300 bg-clip-text text-transparent animate-gradient">
                  Evergreen Academy
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed">
                Latest news, important announcements, upcoming events, and student achievements all in one place
              </p>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-2xl font-bold text-white">{stats.total}</div>
                  <div className="text-sm text-white/80">Total Posts</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-2xl font-bold text-white">{stats.featured}</div>
                  <div className="text-sm text-white/80">Featured</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-2xl font-bold text-white">{stats.monthly}</div>
                  <div className="text-sm text-white/80">Monthly</div>
                </div>
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm text-white/80">Updated</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="mb-8">
            <SearchBar 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Filter className="w-6 h-6 text-emerald-600" />
                Filter by Category
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{filteredPosts.length} posts found</span>
                <button
                  onClick={() => {
                    setActiveCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-emerald-600 hover:text-emerald-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categories.map(category => (
                <FilterChip
                  key={category.id}
                  category={{
                    ...category,
                    count: category.id === 'all' ? stats.total : stats.categories[category.id] || 0
                  }}
                  isActive={activeCategory === category.id}
                  onClick={() => setActiveCategory(category.id)}
                />
              ))}
            </div>
          </div>

          {/* View Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="mostViewed">Most Viewed</option>
                  <option value="mostCommented">Most Commented</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-700 font-medium">View:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'grid' 
                        ? 'bg-emerald-100 text-emerald-600 shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'bg-emerald-100 text-emerald-600 shadow-sm' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <BookmarkCheck className="w-4 h-4" />
                <span>{bookmarkedPosts.size} bookmarked</span>
              </div>
              <button
                onClick={loadAllPosts}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {/* Featured Posts */}
          {sortedPosts.filter(p => p.isFeatured).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Featured Stories
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sortedPosts.filter(p => p.isFeatured).slice(0, 2).map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onClick={() => navigate(`/posts/${post.id}`)}
                    isFeatured
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Posts Grid/List */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200">
            <div className="inline-flex p-6 bg-gradient-to-r from-emerald-100 to-emerald-50 rounded-2xl mb-6">
              <Newspaper className="w-16 h-16 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Updates Found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchQuery 
                ? `No posts found matching "${searchQuery}". Try a different search term or browse all categories.`
                : activeCategory !== 'all'
                ? `No ${activeCategory} posts available at the moment. Check back soon!`
                : 'No posts available at the moment. Check back soon!'
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Clear Search
                </button>
              )}
              {activeCategory !== 'all' && (
                <button
                  onClick={() => setActiveCategory('all')}
                  className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  View All Categories
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
            : 'space-y-6'
          }>
            {(viewMode === 'grid' ? sortedPosts : sortedPosts.slice(0, 10)).map(post => (
              viewMode === 'grid' ? (
                <PostCard
                  key={post.id}
                  post={post}
                  onClick={() => navigate(`/posts/${post.id}`)}
                />
              ) : (
                <div 
                  key={post.id}
                  className="group bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  onClick={() => navigate(`/posts/${post.id}`)}
                >
                  <div className="flex flex-col md:flex-row gap-6 p-6">
                    <div className="md:w-48 flex-shrink-0">
                      <div className="relative h-40 md:h-full rounded-xl overflow-hidden">
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-3 left-3">
                          <CategoryBadge category={post.category} />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-600 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(post.id);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {bookmarkedPosts.has(post.id) ? (
                            <BookmarkCheck className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <BookmarkPlus className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.summary}
                      </p>
                      
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {post.date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                          {post.author && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {post.author}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views?.toLocaleString() || 0}
                          </span>
                        </div>
                        
                        <Link 
                          to={`/posts/${post.id}`}
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Read Full Story
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}

        {/* Load More / Pagination */}
        {filteredPosts.length > 10 && viewMode === 'list' && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setViewMode('grid')}
              className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
            >
              <Grid className="w-5 h-5" />
              Switch to Grid View
            </button>
          </div>
        )}

        {/* Newsletter Subscription */}
        <div className="mt-16 p-8 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-3xl shadow-2xl text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="lg:w-2/3">
              <h3 className="text-2xl font-bold mb-3">Never Miss an Update</h3>
              <p className="text-emerald-100 mb-6">
                Subscribe to our newsletter and get the latest news, events, and achievements delivered directly to your inbox.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-6 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white/30"
                />
                <button className="px-8 py-3 bg-white text-emerald-600 font-bold rounded-lg hover:bg-gray-100 transition-colors">
                  Subscribe
                </button>
              </div>
              <p className="text-sm text-emerald-200 mt-3">
                By subscribing, you agree to our Privacy Policy. You can unsubscribe at any time.
              </p>
            </div>
            <div className="lg:w-1/3 text-center">
              <div className="inline-flex p-6 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Mail className="w-12 h-12" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
    
    </div>
  );
};

// Fixed SinglePostView Component with all improvements
const SinglePostView = ({ post }) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const config = getCategoryConfig(post.category);
  
  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
    setIsBookmarked(savedBookmarks.includes(post.id));
    
    setComments([
      { id: 1, author: 'Parent of Student', content: 'Great news! Looking forward to attending.', date: new Date(Date.now() - 3600000) },
      { id: 2, author: 'Alumni', content: 'Proud to see the school achieving new heights!', date: new Date(Date.now() - 7200000) }
    ]);
  }, [post.id]);
  
  const toggleBookmark = () => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
    let newBookmarks;
    
    if (isBookmarked) {
      newBookmarks = savedBookmarks.filter(id => id !== post.id);
    } else {
      newBookmarks = [...savedBookmarks, post.id];
    }
    
    localStorage.setItem('bookmarkedPosts', JSON.stringify(newBookmarks));
    setIsBookmarked(!isBookmarked);
  };
  
  const handlePrint = () => {
    const printStyles = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          padding: 20px;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
        img {
          max-width: 100% !important;
          height: auto !important;
        }
        @page {
          margin: 1cm;
        }
      }
    `;
    
    const styleSheet = document.createElement("style");
    styleSheet.innerText = printStyles;
    document.head.appendChild(styleSheet);
    
    window.print();
    
    setTimeout(() => {
      document.head.removeChild(styleSheet);
    }, 100);
  };
  
  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `${post.title} - Evergreen Academy`;
    
    switch(platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}\n\n${post.summary}`)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
    }
    setShowShareMenu(false);
  };
  
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const newCommentObj = {
      id: comments.length + 1,
      author: 'Current User',
      content: newComment,
      date: new Date()
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment('');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-blue-50/50 to-purple-50/50 print-area">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 no-print">
        <Link 
          to="/posts" 
          className="group inline-flex items-center gap-3 px-6 py-3 bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-gray-700">Back to All Updates</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Post Header */}
        <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-200 p-8 md:p-12 mb-8">
          {/* Background Pattern */}
          <div className={`absolute inset-0 rounded-3xl opacity-5 ${config.gradient}`} />
          
          <div className="relative z-10">
            {/* Header Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 no-print">
              <div className="flex items-center gap-4">
                <CategoryBadge category={post.category} />
                
                {post.isFeatured && (
                  <span className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full text-sm font-bold flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Featured Story
                  </span>
                )}
                
                {post.isMonthly && (
                  <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full text-sm font-bold">
                    Monthly Newsletter
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleBookmark}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    isBookmarked 
                      ? 'bg-emerald-100 text-emerald-600' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="w-5 h-5" />
                  ) : (
                    <BookmarkPlus className="w-5 h-5" />
                  )}
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-3 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    <Share className="w-5 h-5" />
                  </button>
                  
                  {showShareMenu && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 min-w-[200px] z-50">
                      <div className="text-sm font-bold text-gray-700 mb-3">Share this post</div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { icon: <Copy className="w-5 h-5" />, label: 'Copy', action: () => handleShare('copy') },
                          { icon: <Twitter className="w-5 h-5 text-blue-400" />, label: 'Twitter', action: () => handleShare('twitter') },
                          { icon: <Facebook className="w-5 h-5 text-blue-600" />, label: 'Facebook', action: () => handleShare('facebook') },
                          { icon: <Linkedin className="w-5 h-5 text-blue-700" />, label: 'LinkedIn', action: () => handleShare('linkedin') },
                          { icon: <MailIcon className="w-5 h-5 text-red-500" />, label: 'Email', action: () => handleShare('email') },
                          { icon: <Printer className="w-5 h-5 text-gray-600" />, label: 'Print', action: handlePrint }
                        ].map((item, index) => (
                          <button
                            key={index}
                            onClick={item.action}
                            className="flex flex-col items-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {item.icon}
                            </div>
                            <span className="text-xs font-medium">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2 no-print"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
              </div>
            </div>
            
            {/* Post Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8 leading-tight">
              {post.title}
            </h1>
            
            {/* Post Metadata */}
            <div className="flex flex-wrap items-center gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Published Date</div>
                  <div className="font-bold text-gray-900">
                    {post.date.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
              
              {post.author && (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Author</div>
                    <div className="font-bold text-gray-900">{post.author}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Views</div>
                  <div className="font-bold text-gray-900">{post.views?.toLocaleString() || '0'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.imageUrl && (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-auto max-h-[600px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>
        )}

        {/* Post Content */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-gray-200 p-8 md:p-12 mb-8">
          {/* Summary Box */}
          {post.summary && (
            <div className={`mb-10 p-8 ${config.light} border ${config.border} rounded-2xl`}>
              <div className="flex items-center gap-3 mb-4">
                <Info className="w-6 h-6 text-emerald-600" />
                <h3 className="text-xl font-bold text-gray-900">Summary</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">{post.summary}</p>
            </div>
          )}

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-800 leading-relaxed text-lg whitespace-pre-line">
              {post.content || 'No detailed content available.'}
            </div>
          </div>

          {/* Event Details */}
          {post.eventDate && (
            <div className="mt-10 p-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border-2 border-emerald-100">
              <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <CalendarDays className="w-6 h-6 text-emerald-600" />
                Event Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-6 bg-white rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Date & Time</div>
                      <div className="font-bold text-gray-900 text-lg">
                        {new Date(post.eventDate).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-gray-600">
                        {new Date(post.eventDate).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {post.location && (
                  <div className="p-6 bg-white rounded-xl border border-blue-200">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Location</div>
                        <div className="font-bold text-gray-900 text-lg">{post.location}</div>
                        <div className="text-gray-600">Evergreen Academy Campus</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {post.rsvpLink && (
                <div className="mt-6 text-center no-print">
                  <a
                    href={post.rsvpLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <Calendar className="w-5 h-5" />
                    RSVP for this Event
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 pt-10 border-t border-gray-200">
              <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Tag className="w-5 h-5" />
                Related Topics
              </h4>
              <div className="flex flex-wrap gap-3">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg font-medium hover:from-gray-200 hover:to-gray-300 transition-all duration-300 cursor-pointer no-print"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="mt-10 pt-10 border-t border-gray-200 no-print">
            <h4 className="text-2xl font-bold text-gray-900 mb-6">Comments ({comments.length})</h4>
            
            {/* Add Comment */}
            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200">
              <h5 className="font-bold text-gray-900 mb-4">Add a Comment</h5>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 mb-4"
                rows="3"
              />
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Comments are moderated. Be respectful and on-topic.
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post Comment
                </button>
              </div>
            </div>
            
            {/* Comments List */}
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id} className="p-6 bg-white rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{comment.author}</div>
                      <div className="text-sm text-gray-500">
                        {comment.date.toLocaleDateString()} at{' '}
                        {comment.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Posts */}
        <div className="mb-8 no-print">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Updates</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-sm font-medium text-gray-500">Related Story</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-3 line-clamp-2">
                  Similar content you might be interested in
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Just now</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-8 bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-gray-200 no-print">
          <Link
            to="/posts"
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to All Updates</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Document ID:</span>
            <code className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono">
              {post.id.substring(0, 8)}...
            </code>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print-only print-area">
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Evergreen Academy</h1>
          <p className="text-gray-600">Official Publication</p>
          <p className="text-sm text-gray-500 mt-2">Printed on: {new Date().toLocaleDateString()} | URL: {window.location.href}</p>
        </div>
      </div>
    </div>
  );
};

export default PostsPage;