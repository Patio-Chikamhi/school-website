// src/components/Gallery.jsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { db } from '../firebase/config';
import { 
  collection, getDocs, query, orderBy, limit, 
  startAfter, where 
} from 'firebase/firestore';
import { 
  Loader, ChevronDown, Camera, Filter, 
  Sparkles, ChevronRight, X, ChevronLeft,
  CalendarDays, MapPin, Users, Heart, 
  Share2, Download, Maximize2, ArrowRight,
  Target as TargetIcon, Image as ImageIcon,
  Award, Trophy, Building, Music
} from 'lucide-react';
import './Gallery.css';

// Modal Component for Full Screen View
const GalleryModal = ({ isOpen, image, onClose, onPrev, onNext }) => {
  if (!isOpen || !image) return null;

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
          className="absolute -top-12 right-0 text-white hover:text-emerald-300 transition-colors duration-200 z-20"
        >
          <X className="w-8 h-8" />
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
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </button>
        
        {/* Image Display */}
        <div className="relative w-full h-full">
          <img
            src={image.imgUrl || image.imageUrl}
            alt={image.title || 'Gallery image'}
            className="w-full h-auto max-h-[70vh] object-contain rounded-2xl"
            onError={(e) => {
              e.target.src = "https://placehold.co/800x600/0f766e/ffffff?text=Image+Not+Found";
            }}
          />
          
          {/* Image Info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{image.title || 'Untitled'}</h3>
                <p className="text-gray-200 mb-3">{image.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-300">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    <span>{new Date(image.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    <span>{image.category || 'Uncategorized'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
                <button className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);
  
  // Modal states
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Pagination state
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalImages, setTotalImages] = useState(0);
  const pageSize = 12;
  
  // Category-specific pagination state
  const [categoryLastVisible, setCategoryLastVisible] = useState({});
  const [categoryHasMore, setCategoryHasMore] = useState({});
  
  // Intersection Observer for infinite scroll
  const loadMoreRef = useRef();

  // Load initial gallery data
  useEffect(() => {
    loadInitialGallery();
  }, []);

  // Setup intersection observer
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreImages();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (observer && loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, loadingMore, selectedCategory]);

  const loadInitialGallery = async () => {
    try {
      setLoading(true);
      const galleryRef = collection(db, "gallery");
      
      // First, get all categories
      const allDocs = await getDocs(galleryRef);
      const uniqueCategories = new Set(['All']);
      
      allDocs.forEach((doc) => {
        const data = doc.data();
        if (data.category) {
          uniqueCategories.add(data.category);
        }
      });
      
      setCategories(Array.from(uniqueCategories));
      
      // Now load first page of images
      await loadCategoryImages(selectedCategory);
      
    } catch (error) {
      console.error("Error loading gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryImages = async (category, reset = true) => {
    try {
      const galleryRef = collection(db, "gallery");
      let q;
      
      if (category === 'All') {
        q = query(
          galleryRef, 
          orderBy("date", "desc"), 
          limit(pageSize)
        );
      } else {
        q = query(
          galleryRef,
          where("category", "==", category),
          orderBy("date", "desc"),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      const galleryData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        galleryData.push({ 
          id: doc.id, 
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
        });
      });
      
      if (reset) {
        setImages(galleryData);
      } else {
        setImages(prev => [...prev, ...galleryData]);
      }
      
      if (!querySnapshot.empty) {
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        
        if (category === 'All') {
          setLastVisible(lastDoc);
        } else {
          setCategoryLastVisible(prev => ({
            ...prev,
            [category]: lastDoc
          }));
        }
      }
      
      const hasMoreImages = galleryData.length === pageSize;
      setHasMore(hasMoreImages);
      setCategoryHasMore(prev => ({
        ...prev,
        [category]: hasMoreImages
      }));
      
      // Update total images count
      const countQuery = category === 'All' 
        ? query(galleryRef)
        : query(galleryRef, where("category", "==", category));
      
      const countSnapshot = await getDocs(countQuery);
      setTotalImages(countSnapshot.size);
      
    } catch (error) {
      console.error("Error loading category images:", error);
    }
  };

  const loadMoreImages = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    
    try {
      const galleryRef = collection(db, "gallery");
      let q;
      const currentLastVisible = selectedCategory === 'All' 
        ? lastVisible 
        : categoryLastVisible[selectedCategory];
      
      if (!currentLastVisible) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }
      
      if (selectedCategory === 'All') {
        q = query(
          galleryRef, 
          orderBy("date", "desc"),
          startAfter(currentLastVisible),
          limit(pageSize)
        );
      } else {
        q = query(
          galleryRef,
          where("category", "==", selectedCategory),
          orderBy("date", "desc"),
          startAfter(currentLastVisible),
          limit(pageSize)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setHasMore(false);
        setCategoryHasMore(prev => ({
          ...prev,
          [selectedCategory]: false
        }));
        setLoadingMore(false);
        return;
      }
      
      const newImages = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newImages.push({ 
          id: doc.id, 
          ...data,
          date: data.date?.toDate ? data.date.toDate() : new Date(data.date || Date.now())
        });
      });
      
      setImages(prev => [...prev, ...newImages]);
      
      const newLastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
      
      if (selectedCategory === 'All') {
        setLastVisible(newLastVisible);
      } else {
        setCategoryLastVisible(prev => ({
          ...prev,
          [selectedCategory]: newLastVisible
        }));
      }
      
      const hasMoreImages = newImages.length === pageSize;
      setHasMore(hasMoreImages);
      setCategoryHasMore(prev => ({
        ...prev,
        [selectedCategory]: hasMoreImages
      }));
      
      setPage(prev => prev + 1);
      
    } catch (error) {
      console.error("Error loading more images:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCategoryChange = useCallback(async (category) => {
    setSelectedCategory(category);
    setPage(1);
    
    // Reset pagination for new category
    if (category === 'All') {
      setLastVisible(null);
    } else {
      setCategoryLastVisible(prev => ({ ...prev, [category]: null }));
    }
    
    // Load images for new category
    await loadCategoryImages(category, true);
  }, []);

  const openImageModal = (image, index) => {
    setSelectedImage(image);
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      setSelectedImage(null);
    }, 300);
  };

  const nextImage = () => {
    const filtered = selectedCategory === 'All' 
      ? images 
      : images.filter(img => img.category === selectedCategory);
    
    const nextIndex = (currentImageIndex + 1) % filtered.length;
    setCurrentImageIndex(nextIndex);
    setSelectedImage(filtered[nextIndex]);
  };

  const prevImage = () => {
    const filtered = selectedCategory === 'All' 
      ? images 
      : images.filter(img => img.category === selectedCategory);
    
    const prevIndex = (currentImageIndex - 1 + filtered.length) % filtered.length;
    setCurrentImageIndex(prevIndex);
    setSelectedImage(filtered[prevIndex]);
  };

  const filteredImages = selectedCategory === 'All' 
    ? images 
    : images.filter(img => img.category === selectedCategory);

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Sports': return <Trophy className="w-4 h-4" />;
      case 'Arts': return <Music className="w-4 h-4" />;
      case 'Campus': return <Building className="w-4 h-4" />;
      case 'Events': return <CalendarDays className="w-4 h-4" />;
      case 'Academics': return <Award className="w-4 h-4" />;
      default: return <Camera className="w-4 h-4" />;
    }
  };

  if (loading && page === 1) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-gray-50">
        <div className="flex flex-col items-center">
          <Loader className="w-12 h-12 animate-spin text-emerald-600 mb-4" />
          <p className="text-lg text-gray-600">Loading gallery...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative min-h-[400px] lg:min-h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?w=2000&auto=compress&cs=tinysrgb&dpr=2')`,
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
                  <span className="text-white font-semibold tracking-wider">SCHOOL GALLERY</span>
                </div>
                <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl lg:text-7xl">
                  <span className="block">Capture the Moments.</span>
                  <span className="block text-yellow-300 mt-2">Share the Memories.</span>
                </h1>
                <p className="mt-6 text-lg text-white sm:text-xl md:text-2xl max-w-xl">
                  Explore life at Evergreen Academy through our vibrant collection of photos and memories.
                </p>
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => window.scrollTo({ top: document.getElementById('gallery-grid').offsetTop, behavior: 'smooth' })}
                    className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-gray-100 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center gap-2"
                  >
                    <span>Explore Gallery</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCategoryChange('Events')}
                    className="px-8 py-4 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 md:py-4 md:text-lg md:px-10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl border-2 border-emerald-500 hover:border-emerald-600 flex items-center gap-2"
                  >
                    <span>View Events</span>
                    <CalendarDays className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="py-8 bg-gradient-to-r from-emerald-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{totalImages}</div>
              <div className="text-sm opacity-90">Total Photos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{categories.length - 1}</div>
              <div className="text-sm opacity-90">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{filteredImages.length}</div>
              <div className="text-sm opacity-90">Currently Viewing</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">{page}</div>
              <div className="text-sm opacity-90">Page</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Gallery Content */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Filter className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
                <p className="text-gray-600">Filter through our collection</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg transform scale-105'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:shadow-md'
                  }`}
                >
                  {category !== 'All' && getCategoryIcon(category)}
                  {category}
                  {selectedCategory === category && (
                    <div className="ml-1 w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gallery Grid */}
          {filteredImages.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50">
              <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Images Found</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                No images found in the {selectedCategory.toLowerCase()} category.
              </p>
              <button 
                onClick={() => handleCategoryChange('All')}
                className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg"
              >
                View All Images
              </button>
            </div>
          ) : (
            <>
              <div id="gallery-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredImages.map((image, index) => (
                  <div 
                    key={`${image.id}-${index}`} 
                    className="group relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                    onClick={() => openImageModal(image, index)}
                  >
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={image.imgUrl || image.imageUrl} 
                        alt={image.title || 'Gallery image'}
                        loading={index < 6 ? "eager" : "lazy"}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/600x400/0f766e/ffffff?text=Image+Not+Found';
                        }}
                      />
                      
                      {/* Image Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(image.category)}
                              <span className="text-sm font-medium">{image.category || 'Uncategorized'}</span>
                            </div>
                            <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Date Badge */}
                      <div className="absolute top-4 left-4">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                          {image.date ? new Date(image.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          }) : 'No Date'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {image.title || 'Untitled'}
                      </h3>
                      {image.description && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                          {image.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-3 h-3" />
                          <span>
                            {image.date ? new Date(image.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            }) : 'No Date'}
                          </span>
                        </div>
                        <button className="text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 group">
                          <span>View</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More Section */}
              {hasMore && (
                <div ref={loadMoreRef} className="mt-12 text-center">
                  {loadingMore ? (
                    <div className="inline-flex items-center gap-2 px-8 py-3 text-emerald-600">
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Loading more images...</span>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p>Scroll down to load more images</p>
                      <p className="text-xs mt-1">
                        Showing {filteredImages.length} of {totalImages} images • Page {page}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* End of results message */}
              {!hasMore && filteredImages.length > 0 && (
                <div className="mt-12 text-center py-8 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl border border-emerald-100">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TargetIcon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">You've reached the end!</h4>
                  <p className="text-gray-600 mb-4">
                    You've viewed all {filteredImages.length} images 
                    {selectedCategory !== 'All' && ` in the ${selectedCategory} category`}.
                  </p>
                  <button
                    onClick={() => handleCategoryChange('All')}
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-800 font-medium group"
                  >
                    <span>Browse All Categories</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-fixed bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg?w=2000&auto=compress&cs=tinysrgb&dpr=2')`,
            backgroundAttachment: 'fixed'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-blue-900/75 to-purple-900/65"></div>
        </div>
        
        <div className="relative z-10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-full mb-6">
              <Camera className="w-5 h-5" />
              <span className="font-semibold">SHARE YOUR MEMORIES</span>
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6">
              Have Photos to Share?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              Submit your photos from school events to be featured in our gallery. Help us build our collection of memories!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.open('/contact', '_blank')}
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-lg hover:bg-emerald-50 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>Submit Photos</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.open('/events', '_blank')}
                className="px-8 py-4 bg-transparent text-white font-semibold rounded-lg border-2 border-white hover:bg-white/10 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl flex items-center justify-center gap-2"
              >
                <span>View Events Calendar</span>
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={modalOpen}
        image={selectedImage}
        onClose={closeImageModal}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </main>
  );
};

export default Gallery;