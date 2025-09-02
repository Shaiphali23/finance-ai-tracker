const crypto = require('crypto');

/**
 * Create a consistent hash for transaction duplicate detection
 */
const createTransactionHash = (userId, amount, description, originalText) => {
  try {
    // Normalize all inputs to ensure consistent hashing
    const normalizedUserId = userId.toString().trim();
    const normalizedAmount = parseFloat(amount).toFixed(2);
    const normalizedDescription = (description || '').toLowerCase().trim().replace(/\s+/g, ' ');
    const normalizedOriginalText = (originalText || '').toLowerCase().trim().replace(/\s+/g, ' ');
    
    // Create hashable string
    const data = `${normalizedUserId}-${normalizedAmount}-${normalizedDescription}-${normalizedOriginalText}`;
    
    // Generate MD5 hash
    return crypto.createHash('md5').update(data).digest('hex');
  } catch (error) {
    console.error('Error creating transaction hash:', error);
    // Fallback: return timestamp-based hash
    return crypto.createHash('md5').update(Date.now().toString()).digest('hex');
  }
};

/**
 * Simple duplicate detection using text similarity
 */
const calculateTextSimilarity = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  const str1 = text1.toLowerCase().trim().replace(/\s+/g, ' ');
  const str2 = text2.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Exact match
  if (str1 === str2) return 1.0;
  
  // Contains match
  if (str1.includes(str2) || str2.includes(str1)) return 0.8;
  
  // Word-based similarity
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const commonWords = words1.filter(word => 
    words2.includes(word) && word.length > 2
  );
  
  const totalWords = Math.max(words1.length, words2.length);
  return commonWords.length / totalWords;
};

// CommonJS export
module.exports = {
  createTransactionHash,
  calculateTextSimilarity
};