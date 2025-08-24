/**
 * API helper functions for the polling application
 */

// Get API base URL from environment variable or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
console.log(`Using API base URL: ${API_BASE_URL || '(default)'}`);

/**
 * Helper function to build API URLs with the correct base
 */
function apiUrl(path) {
  // If path already starts with http/https, return as is (absolute URL)
  if (path.startsWith('http')) return path;
  // Otherwise, join with API base URL
  return `${API_BASE_URL}${path}`;
}

// Generate a client fingerprint for tracking votes
export const generateFingerprint = (pollId) => {
  // Base fingerprint on a combination of factors
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const screenSize = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const storageKey = `poll-seed-${pollId}`;
  
  // Get or create a persistent seed in localStorage
  let seed = localStorage.getItem(storageKey);
  if (!seed) {
    seed = Math.random().toString(36).substring(2, 12);
    localStorage.setItem(storageKey, seed);
  }
  
  // Create fingerprint string and hash it
  const fingerprintSource = `${userAgent}|${language}|${screenSize}|${timezone}|${seed}|${pollId}`;
  return hashString(fingerprintSource);
};

// Simple hash function to create fingerprint
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `fp-${Math.abs(hash).toString(16)}`;
}

// Subscribe to real-time poll updates using Server-Sent Events
export const subscribeToResults = (pollId, onUpdate) => {
  const eventSource = new EventSource(apiUrl(`/api/polls/${pollId}/sse`));
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("SSE update received:", data);
      onUpdate(data);
    } catch (error) {
      console.error('Error parsing SSE data:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    
    // Try to reconnect after a short delay rather than closing
    setTimeout(() => {
      console.log("Attempting to reconnect SSE...");
      // The browser will attempt to reconnect automatically
    }, 2000);
  };

  console.log(`SSE connection established for poll ${pollId}`);
  
  return () => {
    console.log(`Closing SSE connection for poll ${pollId}`);
    eventSource.close();
  };
};

// Create a new poll
export const createPoll = async (pollData) => {
  const response = await fetch(apiUrl('/api/polls'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pollData),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create poll');
  }
  
  return response.json();
};

// Get poll details
export const getPoll = async (pollId) => {
  const response = await fetch(apiUrl(`/api/polls/${pollId}`));
  
  if (response.status === 404) {
    throw new Error('Poll not found');
  }
  
  if (!response.ok) {
    throw new Error('Failed to load poll');
  }
  
  return response.json();
};

// Get poll results
export const getResults = async (pollId, secret = null) => {
  const path = secret 
    ? `/api/polls/${pollId}/results?secret=${encodeURIComponent(secret)}`
    : `/api/polls/${pollId}/results`;
    
  const response = await fetch(apiUrl(path));
  
  if (!response.ok) {
    throw new Error('Failed to load results');
  }
  
  return response.json();
};

// Submit a vote
export const submitVote = async (pollId, optionId) => {
  const fingerprint = generateFingerprint(pollId);
  
  const response = await fetch(apiUrl(`/api/polls/${pollId}/vote`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      option_id: optionId,
      fingerprint: fingerprint,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to submit vote');
  }
  
  // Mark this poll as voted in localStorage
  localStorage.setItem(`voted-${pollId}`, fingerprint);
  
  return response.json();
};

// Check if the user has already voted
export const hasVoted = (pollId) => {
  return localStorage.getItem(`voted-${pollId}`) !== null;
};

// Get the stored fingerprint for a poll
export const getStoredFingerprint = (pollId) => {
  return localStorage.getItem(`voted-${pollId}`);
};
