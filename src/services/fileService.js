// services/fileService.js - FIREBASE-ONLY VERSION
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import { addDoc, collection, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class FileService {
  // Upload assignment submission
  async uploadAssignmentSubmission(studentId, assignmentId, file, metadata = {}) {
    try {
      // Upload to Firebase Storage
      const storagePath = `submissions/${studentId}/${assignmentId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = await uploadBytes(storageRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          studentId,
          assignmentId,
          ...metadata
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(uploadTask.ref);

      // Create submission record
      await addDoc(collection(db, 'submissions'), {
        studentId,
        assignmentId,
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        fileType: this.getFileType(file),
        storagePath,
        submittedAt: serverTimestamp(),
        status: 'submitted',
        graded: false,
        ...metadata
      });

      // Update assignment status
      await updateDoc(doc(db, 'assignments', assignmentId), {
        lastSubmission: serverTimestamp()
      });

      return {
        success: true,
        downloadURL,
        fileName: file.name
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Download file
  async downloadFile(fileUrl, fileName) {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get file type
  getFileType(file) {
    if (file.type.includes('pdf')) return 'pdf';
    if (file.type.includes('video')) return 'video';
    if (file.type.includes('image')) return 'image';
    if (file.type.includes('audio')) return 'audio';
    if (file.name.match(/\.(doc|docx|txt|rtf)$/i)) return 'document';
    if (file.name.match(/\.(ppt|pptx)$/i)) return 'presentation';
    if (file.name.match(/\.(xls|xlsx|csv)$/i)) return 'spreadsheet';
    return 'other';
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const fileService = new FileService();