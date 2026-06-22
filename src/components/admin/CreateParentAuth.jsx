import React, { useState } from 'react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { db, auth } from '../../firebase/config';
import { Loader, Check, XCircle, Mail, Lock, User } from 'lucide-react';

const CreateParentAuth = ({ parentDoc, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
  };

  const handleCreateAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        parentDoc.email,
        password || generatePassword()
      );
      
      const user = userCredential.user;
      
      // Update profile
      await updateProfile(user, {
        displayName: parentDoc.name
      });
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', parentDoc.id), {
        uid: user.uid,
        status: 'active',
        mustChangePassword: true,
        updatedAt: new Date(),
        needsAuthSetup: false
      });
      
      setSuccess(true);
      if (onSuccess) onSuccess(user);
      
    } catch (error) {
      console.error('Error creating Auth account:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Create Parent Login</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Mail className="w-5 h-5 text-gray-600" />
          <span className="font-mono text-sm">{parentDoc.email}</span>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-28 py-3 border border-gray-300 rounded-lg"
              placeholder="Enter or generate password"
            />
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <div className="absolute right-3 top-3.5 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={generatePassword}
                className="text-blue-600 hover:text-blue-800"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {success ? (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            Auth account created successfully!
          </div>
        ) : (
          <button
            onClick={handleCreateAuth}
            disabled={loading || !password}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <User className="w-5 h-5" />
                Create Login Account
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateParentAuth;