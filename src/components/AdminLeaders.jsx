// AdminLeaders.jsx
import { useState, useEffect } from 'react';
import { db, storage } from '../firebase/config';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader, Edit, Trash2, Plus } from 'lucide-react';

const AdminLeaders = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLeader, setEditingLeader] = useState(null);
  
  // Load leaders
  useEffect(() => {
    loadLeaders();
  }, []);
  
  const loadLeaders = async () => {
    try {
      const leadersRef = collection(db, 'leaders');
      const querySnapshot = await getDocs(leadersRef);
      const leadersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setLeaders(leadersData);
    } catch (error) {
      console.error('Error loading leaders:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const uploadLeaderImage = async (file) => {
    const storageRef = ref(storage, `leaders/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };
  
  const handleSaveLeader = async (leaderData) => {
    try {
      const leadersRef = collection(db, 'leaders');
      
      if (editingLeader) {
        // Update existing leader
        await updateDoc(doc(db, 'leaders', editingLeader.id), {
          ...leaderData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Add new leader
        await addDoc(leadersRef, {
          ...leaderData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      loadLeaders(); // Refresh list
      setShowForm(false);
      setEditingLeader(null);
    } catch (error) {
      console.error('Error saving leader:', error);
    }
  };
  
  const handleDeleteLeader = async (leaderId) => {
    if (window.confirm('Are you sure you want to delete this leader?')) {
      try {
        await deleteDoc(doc(db, 'leaders', leaderId));
        loadLeaders(); // Refresh list
      } catch (error) {
        console.error('Error deleting leader:', error);
      }
    }
  };
  
  if (loading) return <div>Loading leaders...</div>;
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">School Leadership</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Leader
        </button>
      </div>
      
      {/* Leaders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaders.map((leader) => (
          <div key={leader.id} className="bg-white rounded-lg shadow-md p-6">
            <img 
              src={leader.imageUrl} 
              alt={leader.name}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover"
            />
            <h3 className="text-xl font-bold text-center">{leader.name}</h3>
            <p className="text-emerald-600 text-center font-medium">{leader.position}</p>
            <p className="text-gray-600 mt-4">{leader.bio}</p>
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingLeader(leader);
                  setShowForm(true);
                }}
                className="bg-blue-500 text-white p-2 rounded"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteLeader(leader.id)}
                className="bg-red-500 text-white p-2 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Leader Form Modal */}
      {showForm && (
        <LeaderForm 
          leader={editingLeader}
          onSave={handleSaveLeader}
          onClose={() => {
            setShowForm(false);
            setEditingLeader(null);
          }}
        />
      )}
    </div>
  );
};