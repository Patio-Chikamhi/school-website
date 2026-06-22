// src/utils/idGenerator.js
import { db } from '../firebase/config';
import { collection, query, orderBy, limit, getDocs, runTransaction } from 'firebase/firestore';

/**
 * Generates a UNIQUE sequential ID with year prefix
 * Format: PREFIX + YEAR + SEQUENTIAL (e.g., STU240001)
 * This method GUARANTEES no duplicates using Firestore transactions
 */

const ID_CONFIG = {
  student: {
    prefix: 'STU',
    collection: 'students',
    idField: 'studentId'
  },
  teacher: {
    prefix: 'TCH',
    collection: 'teachers',
    idField: 'teacherId'
  },
  staff: {
    prefix: 'STF',
    collection: 'schoolLeaders',
    idField: 'staffId'
  },
  parent: {
    prefix: 'PAR',
    collection: 'users',
    idField: 'parentId'
  },
  application: {
    prefix: 'APP',
    collection: 'applications',
    idField: 'applicationId'
  }
};

// Counter collection to track sequences per year
const SEQUENCE_COUNTERS = 'idCounters';

/**
 * Get the next sequential number for a specific type and year
 * Uses Firestore transaction to prevent duplicates
 */
const getNextSequenceNumber = async (type, year) => {
  const counterId = `${type}_${year}`;
  const counterRef = doc(db, SEQUENCE_COUNTERS, counterId);
  
  try {
    // Use transaction to ensure atomic increment
    const result = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let currentCount = 0;
      if (counterDoc.exists()) {
        currentCount = counterDoc.data().count || 0;
      }
      
      const nextCount = currentCount + 1;
      
      // Update or create the counter document
      transaction.set(counterRef, {
        count: nextCount,
        type: type,
        year: year,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return nextCount;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting sequence number:', error);
    throw new Error(`Failed to generate unique ID for ${type}`);
  }
};

/**
 * Generate a UNIQUE sequential ID (Guaranteed no duplicates)
 * Format: PREFIX + YEAR + 4-DIGIT SEQUENTIAL (padded)
 * Example: STU240001, STU240002, TCH240001
 */
export const generateUniqueId = async (type) => {
  const config = ID_CONFIG[type];
  if (!config) throw new Error(`Invalid type: ${type}`);
  
  const year = new Date().getFullYear().toString().slice(-2);
  
  // Get the next sequential number (atomic operation)
  const sequenceNumber = await getNextSequenceNumber(type, year);
  
  // Format: 4-digit number with leading zeros
  const formattedNumber = sequenceNumber.toString().padStart(4, '0');
  const uniqueId = `${config.prefix}${year}${formattedNumber}`;
  
  console.log(`✅ Generated unique ID: ${uniqueId} (Sequence: ${sequenceNumber})`);
  return uniqueId;
};

/**
 * Alternative: Generate ID with more random-looking but still unique
 * Uses timestamp + random + sequence (overkill but safe)
 */
export const generateUniqueIdWithTimestamp = async (type) => {
  const config = ID_CONFIG[type];
  const year = new Date().getFullYear().toString().slice(-2);
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  
  // Still need sequence to guarantee uniqueness
  const sequenceNumber = await getNextSequenceNumber(type, year);
  
  return `${config.prefix}${year}${timestamp}${random}${sequenceNumber}`;
};

/**
 * Batch generate multiple IDs (useful for imports)
 */
export const generateMultipleIds = async (type, count) => {
  const ids = [];
  for (let i = 0; i < count; i++) {
    const id = await generateUniqueId(type);
    ids.push(id);
  }
  return ids;
};

/**
 * Check if an ID already exists (safety check)
 */
export const idExists = async (type, id) => {
  const config = ID_CONFIG[type];
  if (!config) return false;
  
  const q = query(
    collection(db, config.collection),
    where(config.idField, '==', id)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Fallback: Generate random ID (only use if sequential fails)
 * Still checks for duplicates
 */
export const generateRandomIdWithCheck = async (type, maxAttempts = 5) => {
  const config = ID_CONFIG[type];
  const year = new Date().getFullYear().toString().slice(-2);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const candidateId = `${config.prefix}${year}${random}`;
    
    const exists = await idExists(type, candidateId);
    if (!exists) {
      console.log(`✅ Generated random unique ID: ${candidateId} (attempt ${attempt + 1})`);
      return candidateId;
    }
  }
  
  throw new Error(`Failed to generate unique random ID after ${maxAttempts} attempts`);
};

/**
 * Reset counters (useful for testing or new academic year)
 * WARNING: Use carefully!
 */
export const resetYearCounter = async (type, year) => {
  const counterId = `${type}_${year}`;
  const counterRef = doc(db, SEQUENCE_COUNTERS, counterId);
  
  await setDoc(counterRef, {
    count: 0,
    type: type,
    year: year,
    resetAt: new Date().toISOString()
  });
  
  console.log(`✅ Reset counter for ${type}_${year}`);
};

// Export default object
export default {
  generateUniqueId,
  generateUniqueIdWithTimestamp,
  generateMultipleIds,
  generateRandomIdWithCheck,
  idExists,
  resetYearCounter,
  ID_CONFIG
};