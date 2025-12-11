/**
 * API Client Utility
 * Handles all HTTP requests with authentication
 */

const API_BASE_URL = '';

/**
 * Make an authenticated API call
 * @param {string} endpoint - API endpoint path
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object|FormData} body - Request body for POST/PUT
 * @param {boolean} isFormData - Whether body is FormData (for file uploads)
 * @returns {Promise<Object>} - API response data
 */
async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};

  // Don't set Content-Type for FormData - browser will set it with boundary
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = isFormData ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

/**
 * Authentication API calls
 */
const authAPI = {
  login: (email, password) => apiCall('/api/auth/login', 'POST', { email, password }),
  register: (name, email, password, role) => apiCall('/api/auth/register', 'POST', { name, email, password, role }),
};

/**
 * Classroom API calls
 */
const classroomAPI = {
  getAll: () => apiCall('/api/classroom', 'GET'),
  create: (classroomName, subject) => apiCall('/api/classroom', 'POST', { classroomName, subject }),
  join: (classCode) => apiCall('/api/classroom/join', 'POST', { classCode }),
};

/**
 * Assignment API calls
 */
const assignmentAPI = {
  getByClassroom: (classroomId) => apiCall(`/api/assignment/classroom/${classroomId}`, 'GET'),
  create: (assignmentData) => apiCall('/api/assignment', 'POST', assignmentData),
};

/**
 * Submission API calls
 */
const submissionAPI = {
  submit: (submissionData) => apiCall('/api/submission', 'POST', submissionData),
  getByAssignment: (assignmentId) => apiCall(`/api/submission/assignment/${assignmentId}`, 'GET'),
};

// Export functions for ES6 modules
export {
  apiCall,
  authAPI,
  classroomAPI,
  assignmentAPI,
  submissionAPI
};
