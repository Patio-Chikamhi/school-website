import { useState } from 'react';
import { db, storage } from '../firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import './AdminUpload.css';

const AdminUpload = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Academics'
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const categories = [
    'Academics', 'Sports', 'Events', 
    'Students', 'Campus', 'Holiday'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage({ text: 'Please select an image', type: 'error' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const fileName = `gallery/${timestamp}_${file.name}`;
      const storageRef = ref(storage, fileName);

      // Upload to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setMessage({ text: `Upload failed: ${error.message}`, type: 'error' });
          setIsUploading(false);
        },
        async () => {
          // Get download URL
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Save to Firestore
          const galleryData = {
            ...formData,
            imgUrl: downloadURL,
            fileName: fileName,
            date: new Date().toISOString(),
            priority: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          await addDoc(collection(db, "gallery"), galleryData);

          
          setMessage({ 
            text: 'Image uploaded successfully!', 
            type: 'success' 
          });
          
         
          setFormData({
            title: '',
            description: '',
            category: 'Academics'
          });
          setFile(null);
          setPreview('');
          setUploadProgress(0);
          setIsUploading(false);
        }
      );

    } catch (error) {
      setMessage({ text: `Error: ${error.message}`, type: 'error' });
      setIsUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h1>Upload Gallery Image</h1>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Image Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="e.g., Science Lab Session"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows="3"
            placeholder="Describe the image..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category *</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="imageFile">Select Image *</label>
          <input
            type="file"
            id="imageFile"
            accept="image/*"
            onChange={handleFileChange}
            required
          />
          
          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
            </div>
          )}
        </div>

        {isUploading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>{Math.round(uploadProgress)}% uploaded</p>
          </div>
        )}

        <button 
          type="submit" 
          className="upload-btn"
          disabled={isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload to Gallery'}
        </button>
      </form>
    </div>
  );
};

export default AdminUpload;