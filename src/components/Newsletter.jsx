  // components/Newsletter.jsx - FULLY UPDATED FOR UNIFIED POSTS STRUCTURE
  import { useState, useEffect } from 'react';
  import { db, auth } from '../firebase/config';
  import { 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    doc, 
    deleteDoc,
    query,
    orderBy,
    where,
    serverTimestamp,
    Timestamp,
    increment as firestoreIncrement
  } from 'firebase/firestore';
  import NewsletterForm from './NewsletterForm';
  import NewsletterItem from './NewsletterItem';
  import { X, Eye, Calendar, User, Printer } from 'lucide-react';

  const Newsletter = ({ userRole, currentUser }) => {
    const [newsletters, setNewsletters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [expandedItem, setExpandedItem] = useState(null);
    const [selectedNewsletter, setSelectedNewsletter] = useState(null);
    const [authStatus, setAuthStatus] = useState('checking');
    
    // Check auth status
    useEffect(() => {
      if (auth) {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          setAuthStatus(user ? 'authenticated' : 'unauthenticated');
        });
        return () => unsubscribe();
      } else {
        setAuthStatus('no-auth');
      }
    }, []);
    
    // Load newsletters from unified posts collection
    useEffect(() => {
      loadNewsletters();
    }, []);
    
    const loadNewsletters = async () => {
      try {
        console.log('📚 Loading newsletters from unified posts collection...');
        
        // FIRST: Try to load from posts collection (new structure)
        const postsRef = collection(db, "posts");
        const newsletterQuery = query(
          postsRef,
          where("category", "==", "newsletter"),
          orderBy("publishDate", "desc")
        );
        
        const querySnapshot = await getDocs(newsletterQuery);
        
        if (querySnapshot.size > 0) {
          console.log(`✅ Found ${querySnapshot.size} newsletters in posts collection`);
          
          const newsletterData = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            newsletterData.push({ 
              id: doc.id, 
              ...data,
              // Convert Firestore Timestamps to Date objects
              publishDate: data.publishDate?.toDate ? data.publishDate.toDate() : 
                          data.date?.toDate ? data.date.toDate() : new Date(),
              date: data.date?.toDate ? data.date.toDate() : 
                    data.publishDate?.toDate ? data.publishDate.toDate() : new Date(),
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              views: data.views || 0,
              isMonthly: data.isMonthly || false,
              issue: data.issue || null,
              author: data.author || currentUser?.displayName || 'Admin',
              isNewsletter: true // Add this for compatibility
            });
          });
          
          setNewsletters(newsletterData);
          setLoading(false);
          return;
        }
        
        // SECOND: If no posts found, try old newsletters collection (fallback)
        console.log('ℹ️ No newsletters in posts collection, trying old collection...');
        await loadOldNewsletters();
        
      } catch (error) {
        console.error("Error loading newsletters:", error);
        // Fallback to old collection
        await loadOldNewsletters();
      }
    };
    
    // Fallback: Load from old newsletters collection
    const loadOldNewsletters = async () => {
      try {
        const newsletterRef = collection(db, "newsletters");
        const newsletterQuery = query(
          newsletterRef,
          where("isNewsletter", "==", true),
          orderBy("date", "desc")
        );
        
        const querySnapshot = await getDocs(newsletterQuery);
        console.log(`📚 Found ${querySnapshot.size} newsletters in old collection`);
        
        const newsletterData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          newsletterData.push({ 
            id: doc.id, 
            ...data,
            publishDate: data.date ? new Date(data.date) : 
                        data.publishDate ? new Date(data.publishDate) : new Date(),
            date: data.date ? new Date(data.date) : new Date(),
            category: 'newsletter', // Add for consistency
            type: 'post' // Add for consistency
          });
        });
        
        setNewsletters(newsletterData);
      } catch (error) {
        console.error("Error loading old newsletters:", error);
      } finally {
        setLoading(false);
      }
    };
    
    const saveNewsletter = async (newsletterData) => {
      try {
        console.log('💾 Saving newsletter to unified posts collection...');
        
        // Save to unified posts collection
        const docRef = await addDoc(collection(db, "posts"), {
          // Newsletter specific fields
          title: newsletterData.title,
          summary: newsletterData.summary,
          content: newsletterData.content,
          isMonthly: newsletterData.isMonthly || false,
          issue: newsletterData.issue || null,
          
          // Unified post fields
          type: 'post',
          category: 'newsletter',
          author: currentUser?.displayName || 'Admin',
          authorId: currentUser?.uid,
          authorEmail: currentUser?.email,
          
          // Date fields - use Firestore Timestamp
          date: serverTimestamp(),
          publishDate: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          
          // Stats
          views: 0,
          
          // For backward compatibility
          isNewsletter: true
        });
        
        console.log('✅ Newsletter saved with ID:', docRef.id);
        
        // Update local state with the new newsletter
        const newNewsletter = {
          id: docRef.id,
          ...newsletterData,
          category: 'newsletter',
          type: 'post',
          publishDate: new Date(),
          date: new Date(),
          views: 0,
          author: currentUser?.displayName || 'Admin',
          isNewsletter: true
        };
        
        setNewsletters([newNewsletter, ...newsletters]);
        setShowForm(false);
        return true;
        
      } catch (error) {
        console.error("❌ Error saving newsletter to posts collection:", error);
        
        // Fallback to old collection
        console.log('🔄 Trying fallback to old newsletters collection...');
        return await saveToOldCollection(newsletterData);
      }
    };
    
    // Fallback save function for old collection
    const saveToOldCollection = async (newsletterData) => {
      try {
        const docRef = await addDoc(collection(db, "newsletters"), {
          ...newsletterData,
          title: newsletterData.title,
          summary: newsletterData.summary,
          content: newsletterData.content,
          isNewsletter: true,
          isMonthly: newsletterData.isMonthly || false,
          issue: newsletterData.issue || null,
          author: currentUser?.displayName || 'Admin',
          authorId: currentUser?.uid,
          date: new Date().toISOString(),
          publishDate: new Date().toISOString(),
          createdAt: serverTimestamp(),
          views: 0
        });
        
        const newNewsletter = {
          id: docRef.id,
          ...newsletterData,
          publishDate: new Date(),
          date: new Date(),
          views: 0,
          category: 'newsletter' // Add for consistency
        };
        
        setNewsletters([newNewsletter, ...newsletters]);
        setShowForm(false);
        return true;
      } catch (error) {
        console.error("❌ Error saving to old collection:", error);
        alert('Failed to save newsletter: ' + error.message);
        return false;
      }
    };
    
    // Toggle expanded state
    const handleToggle = (id) => {
      if (expandedItem === id) {
        setExpandedItem(null);
      } else {
        setExpandedItem(id);
      }
    };
    
    // Open full newsletter view
    const handleOpenFullNewsletter = async (newsletter) => {
      await incrementViews(newsletter.id);
      setSelectedNewsletter(newsletter);
    };
    
    // Increment views - works with both new and old collections
    const incrementViews = async (newsletterId) => {
      try {
        console.log('👁️ Incrementing views for:', newsletterId);
        
        // Update local state FIRST for instant feedback
        setNewsletters(prevNewsletters => 
          prevNewsletters.map(newsletter => 
            newsletter.id === newsletterId 
              ? { ...newsletter, views: (newsletter.views || 0) + 1 }
              : newsletter
          )
        );
        
        // Try to update in posts collection first (new structure)
        try {
          const postRef = doc(db, "posts", newsletterId);
          await updateDoc(postRef, {
            views: firestoreIncrement(1),
            updatedAt: serverTimestamp()
          });
          console.log('✅ Views incremented in posts collection');
          return;
        } catch (postError) {
          console.log('⚠️ Could not update posts collection:', postError.message);
        }
        
        // If newsletterId starts with 'news_', it's migrated data
        if (newsletterId.startsWith('news_')) {
          const oldId = newsletterId.replace('news_', '');
          const oldRef = doc(db, "newsletters", oldId);
          try {
            await updateDoc(oldRef, {
              views: firestoreIncrement(1)
            });
            console.log('✅ Views incremented in old newsletters collection (migrated data)');
          } catch (oldError) {
            console.error('❌ Could not update migrated data:', oldError.message);
          }
        } else {
          // Try newsletters collection directly (non-migrated data)
          const newsletterRef = doc(db, "newsletters", newsletterId);
          try {
            await updateDoc(newsletterRef, {
              views: firestoreIncrement(1)
            });
            console.log('✅ Views incremented in newsletters collection');
          } catch (newsError) {
            console.error('❌ Could not update any collection:', newsError.message);
          }
        }
        
      } catch (error) {
        console.error('❌ Error in incrementViews:', error);
      }
    };
    
    // Delete newsletter - works with both new and old collections
    const deleteNewsletter = async (newsletterId) => {
      if (!window.confirm('Are you sure you want to delete this newsletter?')) {
        return;
      }
      
      try {
        // Try to delete from posts collection first
        try {
          await deleteDoc(doc(db, "posts", newsletterId));
          console.log('✅ Deleted from posts collection');
        } catch (postError) {
          console.log('⚠️ Could not delete from posts collection:', postError.message);
          
          // If newsletterId starts with 'news_', it's migrated data in posts but old ID in newsletters
          if (newsletterId.startsWith('news_')) {
            const oldId = newsletterId.replace('news_', '');
            try {
              await deleteDoc(doc(db, "newsletters", oldId));
              console.log('✅ Deleted old version from newsletters collection');
            } catch (oldError) {
              console.error('❌ Could not delete old version:', oldError.message);
            }
          } else {
            // Try newsletters collection directly
            try {
              await deleteDoc(doc(db, "newsletters", newsletterId));
              console.log('✅ Deleted from newsletters collection');
            } catch (newsError) {
              console.error('❌ Could not delete from any collection:', newsError.message);
              throw newsError;
            }
          }
        }
        
        // Update local state
        setNewsletters(newsletters.filter(n => n.id !== newsletterId));
        if (selectedNewsletter?.id === newsletterId) {
          setSelectedNewsletter(null);
        }
        alert('Newsletter deleted successfully');
        
      } catch (error) {
        console.error("Error deleting newsletter:", error);
        alert('Error deleting newsletter: ' + error.message);
      }
    };
    
    const canCreate = userRole === 'admin' || userRole === 'teacher';
    
    // Format date for display
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
    
    // Simple date formatting for cards
    const formatCardDate = (date) => {
      if (!date) return '';
      try {
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      } catch {
        return '';
      }
    };
    
    // Print functionality
    const handlePrint = () => {
      window.print();
    };
    
    if (loading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Debug info (can be removed in production) */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Newsletter Source:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                {newsletters.length > 0 && newsletters[0].id?.startsWith('news_') 
                  ? 'Migrated Posts Collection' 
                  : newsletters.length > 0 && newsletters[0].id 
                    ? 'Unified Posts Collection' 
                    : 'Loading...'}
              </span>
              <span className="text-gray-600">
                ({newsletters.length} newsletter{newsletters.length !== 1 ? 's' : ''})
              </span>
            </div>
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">School Newsletters</h1>
            <p className="text-gray-600 text-sm sm:text-base">
              Stay updated with our latest school newsletters and announcements
            </p>
          </div>
          
          {/* Create Button for Admins/Teachers */}
          {canCreate && (
            <div className="mb-8">
              <button 
                onClick={() => setShowForm(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium flex items-center gap-2 transition-colors duration-150 shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Newsletter
              </button>
            </div>
          )}
          
          {/* Newsletter Creation Form */}
          {showForm && (
            <NewsletterForm 
              onClose={() => setShowForm(false)}
              onSave={saveNewsletter}
              currentUser={currentUser}
            />
          )}
          
          {/* Newsletter List using NewsletterItem */}
          {newsletters.length === 0 ? (
            <div className="text-center py-12 sm:py-20 bg-white rounded-xl shadow-sm border border-gray-200 mx-2 sm:mx-0">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">No Newsletters Yet</h3>
              <p className="text-gray-500 mb-6 px-4">Check back soon for updates or create the first newsletter!</p>
              {canCreate && (
                <button 
                  onClick={() => setShowForm(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-colors duration-150"
                >
                  Create First Newsletter
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
              {newsletters.map(item => (
                <NewsletterItem
                  key={item.id}
                  item={{
                    ...item,
                    // Ensure all necessary fields are present
                    date: item.date || item.publishDate || new Date(),
                    publishDate: item.publishDate || item.date || new Date(),
                    author: item.author || 'Admin',
                    isMonthly: item.isMonthly || false,
                    issue: item.issue || null,
                    views: item.views || 0
                  }}
                  isExpanded={expandedItem === item.id}
                  onToggle={() => handleToggle(item.id)}
                  onViewFull={() => handleOpenFullNewsletter(item)}
                  onDelete={canCreate ? () => deleteNewsletter(item.id) : null}
                  formatDate={formatCardDate}
                />
              ))}
            </div>
          )}
          
          {/* Full Newsletter Modal */}
          {selectedNewsletter && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-150"
                onClick={() => setSelectedNewsletter(null)}
              />
              
              {/* Modal */}
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-150 scale-100 opacity-100">
                  {/* Header */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{selectedNewsletter.title}</h2>
                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{selectedNewsletter.author || 'Admin'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatFullDate(selectedNewsletter.date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{selectedNewsletter.views || 0} views</span>
                          </div>
                          {selectedNewsletter.isMonthly && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              Monthly Newsletter
                            </span>
                          )}
                        
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {canCreate && (
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this newsletter?')) {
                                deleteNewsletter(selectedNewsletter.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition-colors duration-150"
                            title="Delete newsletter"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        
                        <button
                          onClick={() => setSelectedNewsletter(null)}
                          className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors duration-150"
                        >
                          <X className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="overflow-y-auto p-6">
                    {selectedNewsletter.summary && (
                      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <h3 className="font-semibold text-emerald-800 mb-2">Summary</h3>
                        <p className="text-emerald-700">{selectedNewsletter.summary}</p>
                      </div>
                    )}
                    
                    <div className="prose prose-lg max-w-none">
                      <div className="whitespace-pre-line text-gray-800">
                        {selectedNewsletter.content || 'No content available.'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        ID: {selectedNewsletter.id}
                        {selectedNewsletter.id?.startsWith('news_') && 
                          <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">Migrated</span>
                        }
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          onClick={handlePrint}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-150"
                        >
                          <Printer className="w-5 h-5" />
                          Print
                        </button>
                        
                        <button
                          onClick={() => setSelectedNewsletter(null)}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors duration-150"
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
        </div>
      </div>
    );
  };

  export default Newsletter;