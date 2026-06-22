import React, { useState, useEffect } from 'react';
import { 
  Users, Edit, Trash2, Search, Filter, UserPlus, 
  Award, Mail, Phone, Briefcase, Calendar, Shield,
  CheckCircle, XCircle, MoreVertical, Eye, Download,
  ChevronLeft, ChevronRight, Loader, Info, ExternalLink, Star
} from 'lucide-react';
import { db } from '../firebase/config';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, orderBy, where } from 'firebase/firestore';

const LeadersList = ({ refreshTrigger, onAddLeader }) => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLeader, setSelectedLeader] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [sortBy, setSortBy] = useState('order');
  const [sortOrder, setSortOrder] = useState('asc');
  const itemsPerPage = 8;

  const fetchLeaders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'schoolLeaders'), orderBy(sortBy, sortOrder));
      const snapshot = await getDocs(q);
      const leadersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaders(leadersData);
    } catch (error) {
      console.error('Error fetching leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
  }, [refreshTrigger, sortBy, sortOrder]);

  const handleDelete = async (leaderId) => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'schoolLeaders', leaderId));
      await fetchLeaders();
      setShowDeleteModal(false);
      setSelectedLeader(null);
    } catch (error) {
      console.error('Error deleting leader:', error);
      alert('Failed to delete leader: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusToggle = async (leaderId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const newIsActive = newStatus === 'active';
      await updateDoc(doc(db, 'schoolLeaders', leaderId), {
        status: newStatus,
        isActive: newIsActive,
        updatedAt: new Date().toISOString()
      });
      await fetchLeaders();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status: ' + error.message);
    }
  };

  // Filter leaders based on search and status
  const filteredLeaders = leaders.filter(leader => {
    const matchesSearch = 
      leader.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      leader.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && leader.isActive) ||
      (filterStatus === 'inactive' && !leader.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLeaders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeaders = filteredLeaders.slice(startIndex, startIndex + itemsPerPage);

  const getStatusColor = (isActive) => {
    return isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (title) => {
    const lowerTitle = title?.toLowerCase() || '';
    if (lowerTitle.includes('principal')) return 'bg-purple-100 text-purple-800';
    if (lowerTitle.includes('director')) return 'bg-blue-100 text-blue-800';
    if (lowerTitle.includes('head')) return 'bg-indigo-100 text-indigo-800';
    if (lowerTitle.includes('coordinator')) return 'bg-amber-100 text-amber-800';
    if (lowerTitle.includes('dean')) return 'bg-teal-100 text-teal-800';
    return 'bg-gray-100 text-gray-800';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const exportLeaders = () => {
    const csvContent = [
      ['Name', 'Title', 'Email', 'Phone', 'Department', 'Status', 'Order'],
      ...filteredLeaders.map(leader => [
        leader.name,
        leader.title,
        leader.email,
        leader.phone,
        leader.department,
        leader.isActive ? 'Active' : 'Inactive',
        leader.order
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school-leaders-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">School Leaders Management</h2>
            <p className="text-white/90 mt-1">Manage school administrators and leadership team</p>
          </div>
          <button
            onClick={() => onAddLeader(null)}
            className="px-6 py-3 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            Add New Leader
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Leaders</p>
              <p className="text-2xl font-bold text-gray-900">{leaders.length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-emerald-600">
                {leaders.filter(l => l.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-gray-600">
                {leaders.filter(l => !l.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-purple-600">
                {leaders.filter(l => l.order && l.order <= 5).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search leaders by name, email, title, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 hover:border-emerald-400 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-3">
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:border-emerald-400 transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white hover:border-emerald-400 transition-colors cursor-pointer"
                >
                  <option value="order">Sort by Order</option>
                  <option value="name">Sort by Name</option>
                  <option value="title">Sort by Title</option>
                  <option value="createdAt">Sort by Date Added</option>
                </select>
                <ChevronRight className="absolute right-3 top-1/2 transform -translate-y-1/2 rotate-90 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={exportLeaders}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-emerald-300 transition-colors flex items-center gap-2"
                title="Export to CSV"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <button 
                onClick={() => fetchLeaders()}
                className="px-4 py-3 border border-emerald-300 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                title="Refresh"
              >
                <Loader className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Active Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {searchQuery && (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center gap-2">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="text-blue-600 hover:text-blue-800">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm rounded-full flex items-center gap-2">
              Status: {filterStatus}
              <button onClick={() => setFilterStatus('all')} className="text-emerald-600 hover:text-emerald-800">
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Leaders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center">
            <Loader className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading leaders...</p>
            <p className="text-sm text-gray-500 mt-2">Fetching from schoolLeaders collection...</p>
          </div>
        ) : paginatedLeaders.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                      <button onClick={() => handleSort('order')} className="flex items-center gap-1 hover:text-emerald-700">
                        Order
                        {sortBy === 'order' && (
                          <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Leader</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Position & Department</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLeaders.map((leader) => (
                    <tr key={leader.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <span className="inline-block w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 font-medium">
                            {leader.order || '–'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {leader.imageUrl ? (
                            <img 
                              src={leader.imageUrl} 
                              alt={leader.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                              {leader.name?.charAt(0) || 'L'}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 group-hover:text-emerald-700">{leader.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[150px]">
                              ID: {leader.id.substring(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{leader.title}</div>
                          <div className="text-sm text-gray-500">{leader.department || 'General Administration'}</div>
                          {leader.experience && (
                            <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">
                              Exp: {leader.experience}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="truncate max-w-[180px]">{leader.email || 'No email'}</span>
                          </div>
                          {leader.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Phone className="w-4 h-4 text-gray-400" />
                              <span>{leader.phone}</span>
                            </div>
                          )}
                          {leader.officeLocation && (
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span className="truncate max-w-[180px]">{leader.officeLocation}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(leader.isActive)}`}>
                            {leader.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <button
                            onClick={() => handleStatusToggle(leader.id, leader.isActive ? 'active' : 'inactive')}
                            className={`p-1.5 rounded-full transition-colors ${
                              leader.isActive 
                                ? 'text-emerald-600 hover:bg-emerald-100 hover:text-emerald-800' 
                                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                            }`}
                            title={leader.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {leader.isActive ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onAddLeader(leader)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group/tooltip relative"
                            title="Edit Leader"
                          >
                            <Edit className="w-5 h-5" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Edit
                            </span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLeader(leader);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors group/tooltip relative"
                            title="Delete Leader"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Delete
                            </span>
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors group/tooltip relative"
                            title="View Details"
                            onClick={() => {
                              // You can implement a detailed view modal here
                              alert(`View details for ${leader.name}`);
                            }}
                          >
                            <Eye className="w-5 h-5" />
                            <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              View
                            </span>
                          </button>
                          {leader.bio && (
                            <button
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors group/tooltip relative"
                              title="View Bio"
                              onClick={() => {
                                alert(`Bio: ${leader.bio}`);
                              }}
                            >
                              <Info className="w-5 h-5" />
                              <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                Bio
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLeaders.length)} of {filteredLeaders.length} leaders
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'text-gray-700 hover:bg-gray-100 hover:text-emerald-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">No Leaders Found</h4>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              {searchQuery || filterStatus !== 'all'
                ? "No leaders match your search criteria. Try changing your search or filter."
                : "No school leaders have been added yet. Click 'Add New Leader' to get started."}
            </p>
            <button
              onClick={() => onAddLeader(null)}
              className="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
            >
              <UserPlus className="inline-block w-5 h-5 mr-2" />
              Add Your First Leader
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedLeader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Leader</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{selectedLeader.name}</span>?
                This action cannot be undone.
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <Info className="w-4 h-4 inline-block mr-2" />
                This will permanently remove the leader from the system.
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedLeader(null);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(selectedLeader.id)}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete Leader'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadersList;