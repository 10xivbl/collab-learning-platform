function setStorage(key, value) {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

//Get data from localStorage

function getStorage(key, parse = false) {
  try {
    const value = localStorage.getItem(key);
    if (value === null) return null;
    
    if (parse) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    
    return value;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}

// Remove data from localStorage

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

// Clear all localStorage
function clearStorage() {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Check if user is authenticated

function isAuthenticated() {
  const token = getStorage('token');
  const user = getStorage('user', true);
  return !!(token && user);
}

// Get current user data

function getCurrentUser() {
  return getStorage('user', true);
}

// Save authentication data

function saveAuth(token, user) {
  setStorage('token', token);
  setStorage('user', user);
}

//Clear authentication data
function clearAuth() {
  removeStorage('token');
  removeStorage('user');
}

// Export functions for ES6 modules
export {
  setStorage,
  getStorage,
  removeStorage,
  clearStorage,
  isAuthenticated,
  getCurrentUser,
  saveAuth,
  clearAuth
};
