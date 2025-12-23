const API_BASE_URL = '';

async function apiCall(endpoint, method = 'GET', body = null, isFormData = false) {
  const token = localStorage.getItem('token');
  const headers = {};

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


const authAPI = {
  login: (email, password) => apiCall('/api/auth/login', 'POST', { email, password }),
  register: (name, email, password, role) => apiCall('/api/auth/register', 'POST', { name, email, password, role }),
};


const classroomAPI = {
  getAll: () => apiCall('/api/classroom', 'GET'),
  create: (classroomName, subject) => apiCall('/api/classroom', 'POST', { classroomName, subject }),
  join: (classCode) => apiCall('/api/classroom/join', 'POST', { classCode }),
};


const assignmentAPI = {
  getByClassroom: (classroomId) => apiCall(`/api/assignment/classroom/${classroomId}`, 'GET'),
  create: (assignmentData) => apiCall('/api/assignment', 'POST', assignmentData),
};


const submissionAPI = {
  submit: (submissionData) => apiCall('/api/submission', 'POST', submissionData),
  getByAssignment: (assignmentId) => apiCall(`/api/submission/assignment/${assignmentId}`, 'GET'),
};

export {
  apiCall,
  authAPI,
  classroomAPI,
  assignmentAPI,
  submissionAPI
};
