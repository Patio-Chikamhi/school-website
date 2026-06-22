// src/components/PostDetail.jsx
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ChevronLeft, Calendar, User, Eye, Tag, Info,
  Star, BookmarkCheck, BookmarkPlus, Share, Copy,
  Twitter, Facebook, Linkedin, Mail as MailIcon,
  Printer, ArrowRight, MessageSquare, Check, MapPin,
  Loader, AlertCircle, RefreshCw, Home, Megaphone,
  Newspaper, CalendarDays, Trophy, ExternalLink, 
  Paperclip, Mail, MessageSquare as MessageSquareIcon
} from 'lucide-react';

// Category Badge Component
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

// Share Menu Component
const ShareMenu = ({ show, onClose, onShare, onPrint }) => (
  show && (
    <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 min-w-[200px] z-50">
      <div className="text-sm font-bold text-gray-700 mb-3">Share this post</div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: <Copy className="w-5 h-5" />, label: 'Copy', action: () => onShare('copy') },
          { icon: <Twitter className="w-5 h-5 text-blue-400" />, label: 'Twitter', action: () => onShare('twitter') },
          { icon: <Facebook className="w-5 h-5 text-blue-600" />, label: 'Facebook', action: () => onShare('facebook') },
          { icon: <Linkedin className="w-5 h-5 text-blue-700" />, label: 'LinkedIn', action: () => onShare('linkedin') },
          { icon: <MailIcon className="w-5 h-5 text-red-500" />, label: 'Email', action: () => onShare('email') },
          { icon: <Printer className="w-5 h-5 text-gray-600" />, label: 'Print', action: onPrint }
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
  )
);

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadPost();
    
    // Load bookmarks from localStorage
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
    setIsBookmarked(savedBookmarks.includes(id));
    
    // Load sample comments
    setComments([
      { id: 1, author: 'Parent of Student', content: 'Great news! Looking forward to attending.', date: new Date(Date.now() - 3600000) },
      { id: 2, author: 'Alumni', content: 'Proud to see the school achieving new heights!', date: new Date(Date.now() - 7200000) }
    ]);
  }, [id]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const postRef = doc(db, 'posts', id);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const data = postSnap.data();
        const loadedPost = {
          id: postSnap.id,
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now()),
          eventDate: data.eventDate?.toDate ? data.eventDate.toDate() : data.eventDate ? new Date(data.eventDate) : null,
          imageUrl: data.imageUrl || getFallbackImage(data.category),
          tags: data.tags || [data.category?.charAt(0)?.toUpperCase() + data.category?.slice(1) || 'General'],
          views: data.views || 0,
          comments: data.comments || 0,
          attachments: data.attachments || 0
        };
        
        setPost(loadedPost);
        
        // Increment view count
        await updateDoc(postRef, {
          views: increment(1),
          lastViewed: new Date()
        });
      } else {
        setError("Post not found. It may have been removed.");
      }
    } catch (error) {
      console.error('Error loading post:', error);
      setError("Failed to load post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        gradient: 'from-blue-500 to-indigo-600',
        light: 'bg-blue-50',
        border: 'border-blue-200'
      },
      'newsletter': {
        label: 'Newsletter',
        gradient: 'from-emerald-500 to-teal-600',
        light: 'bg-emerald-50',
        border: 'border-emerald-200'
      },
      'event': {
        label: 'Event',
        gradient: 'from-purple-500 to-purple-600',
        light: 'bg-purple-50',
        border: 'border-purple-200'
      },
      'achievement': {
        label: 'Achievement',
        gradient: 'from-yellow-500 to-orange-600',
        light: 'bg-yellow-50',
        border: 'border-yellow-200'
      }
    };
    return configs[category] || {
      label: category,
      gradient: 'from-gray-500 to-gray-600',
      light: 'bg-gray-50',
      border: 'border-gray-200'
    };
  };

  const toggleBookmark = () => {
    const savedBookmarks = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
    let newBookmarks;
    
    if (isBookmarked) {
      newBookmarks = savedBookmarks.filter(bookmarkId => bookmarkId !== id);
    } else {
      newBookmarks = [...savedBookmarks, id];
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
          background: white;
        }
        .no-print {
          display: none !important;
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
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}\n\n${post.summary || post.content?.substring(0, 200)}`)}`;
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

  const config = post ? getCategoryConfig(post.category) : {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-blue-50/50 to-purple-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader className="w-16 h-16 animate-spin text-emerald-600 mb-6" />
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-full blur-xl"></div>
          </div>
          <p className="text-xl text-gray-700 font-medium">Loading post...</p>
          <p className="text-gray-500 mt-2">Fetching the latest updates</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-blue-50/50 to-purple-50/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-50 text-red-700 rounded-full mb-6">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold">Error Loading Post</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{error || "Post not found"}</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            We're having trouble loading the post. Please check your connection and try again.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={loadPost}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <Link
              to="/posts"
              className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Posts
            </Link>
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
                  
                  <ShareMenu
                    show={showShareMenu}
                    onClose={() => setShowShareMenu(false)}
                    onShare={handleShare}
                    onPrint={handlePrint}
                  />
                </div>
                
                <button
                  onClick={handlePrint}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 flex items-center gap-2"
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
                  <div className="font-bold text-gray-900">{(post.views + 1).toLocaleString()}</div>
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
              onError={(e) => {
                e.target.src = getFallbackImage(post.category);
              }}
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
              <div 
                key={index} 
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/posts/${post.id}`)}
              >
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

      {/* Print Header - Only visible when printing */}
      <div className="hidden print-only print-area">
        <div className="text-center mb-8 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Evergreen Academy</h1>
          <p className="text-gray-600">Official Publication</p>
          <p className="text-sm text-gray-500 mt-2">Printed on: {new Date().toLocaleDateString()} | URL: {window.location.href}</p>
        </div>
      </div>

      {/* Add CSS for animations and print */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .prose {
          color: #374151;
        }
        
        .prose h2 {
          color: #111827;
          font-weight: 700;
          font-size: 1.875rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        
        .prose h3 {
          color: #1f2937;
          font-weight: 600;
          font-size: 1.5rem;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        
        .prose p {
          margin-bottom: 1.25rem;
          line-height: 1.75;
        }
        
        .prose ul, .prose ol {
          margin-bottom: 1.25rem;
          padding-left: 1.625rem;
        }
        
        .prose li {
          margin-bottom: 0.5rem;
        }
        
        .prose a {
          color: #059669;
          text-decoration: underline;
        }
        
        .prose a:hover {
          color: #047857;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
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
            background: white;
            padding: 0;
            margin: 0;
          }
          .print-area .bg-gradient-to-b,
          .print-area .shadow-2xl,
          .print-area .shadow-lg,
          .print-area .hover\\:shadow-xl {
            box-shadow: none !important;
            background: white !important;
          }
          .print-area .rounded-3xl,
          .print-area .rounded-2xl,
          .print-area .rounded-xl {
            border-radius: 0 !important;
            border: 1px solid #e5e7eb !important;
          }
          .print-area .p-8,
          .print-area .p-6,
          .print-area .p-4 {
            padding: 1rem !important;
          }
          .print-area .mb-8,
          .print-area .mb-6,
          .print-area .mb-4 {
            margin-bottom: 1rem !important;
          }
          .print-area img {
            max-width: 100% !important;
            height: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PostDetail;