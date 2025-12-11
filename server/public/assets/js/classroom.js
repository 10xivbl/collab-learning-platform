/**
 * Classroom Details Page
 * Collab Learning Platform
 */

import { apiCall } from './utils/api.js';
import { getStorage, clearStorage } from './utils/storage.js';

// ===== Global State =====
let currentUser = null;
let classroom = null;
let classroomId = null;

// ===== DOM Elements =====
const DOM = {
  loadingState: null,
  classroomContent: null,
  classroomName: null,
  classroomSubject: null,
  classroomDescription: null,
  classroomCode: null,
  memberCount: null,
  createdDate: null,
  teacherAvatar: null,
  teacherName: null,
  teacherEmail: null,
  studentCount: null,
  studentsList: null,
  btnDeleteClassroom: null,
  btnBack: null,
  modalDeleteConfirm: null,
  btnCancelDelete: null,
  btnConfirmDelete: null,
  btnLogout: null,
  toast: null,
  teacherElements: null,
  
  init() {
    this.loadingState = document.getElementById('loadingState');
    this.classroomContent = document.getElementById('classroomContent');
    this.classroomName = document.getElementById('classroomName');
    this.classroomSubject = document.getElementById('classroomSubject');
    this.classroomDescription = document.getElementById('classroomDescription');
    this.classroomCode = document.getElementById('classroomCode');
    this.memberCount = document.getElementById('memberCount');
    this.createdDate = document.getElementById('createdDate');
    this.teacherAvatar = document.getElementById('teacherAvatar');
    this.teacherName = document.getElementById('teacherName');
    this.teacherEmail = document.getElementById('teacherEmail');
    this.studentCount = document.getElementById('studentCount');
    this.studentsList = document.getElementById('studentsList');
    this.btnDeleteClassroom = document.getElementById('btnDeleteClassroom');
    this.btnBack = document.getElementById('btnBack');
    this.modalDeleteConfirm = document.getElementById('modalDeleteConfirm');
    this.btnCancelDelete = document.getElementById('btnCancelDelete');
    this.btnConfirmDelete = document.getElementById('btnConfirmDelete');
    this.btnLogout = document.getElementById('btnLogout');
    this.toast = document.getElementById('toast');
    this.teacherElements = document.querySelectorAll('[data-role="teacher"]');
  }
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize DOM references
  DOM.init();
  
  // Check authentication
  const token = getStorage('token');
  if (!token) {
    window.location.href = '/auth.html';
    return;
  }
  
  // Get classroom ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  classroomId = urlParams.get('id');
  
  if (!classroomId) {
    showToast('No classroom ID provided', 'error');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
    return;
  }
  
  try {
    // Fetch current user
    const userResponse = await apiCall('/api/auth/me');
    currentUser = userResponse.user || userResponse;
    
    // Setup UI based on role
    setupUI();
    
    // Attach event listeners
    attachEventListeners();
    
    // Load classroom data
    await loadClassroom();
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to load classroom details', 'error');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
  }
});

// ===== UI Setup =====
function setupUI() {
  if (!currentUser) return;
  
  // Show/hide teacher-specific elements
  const isTeacher = currentUser.role === 'teacher';
  DOM.teacherElements.forEach(el => {
    el.classList.toggle('hidden', !isTeacher);
  });
}

// ===== Event Listeners =====
function attachEventListeners() {
  // Logout
  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', logout);
  }
  
  // Back button
  if (DOM.btnBack) {
    DOM.btnBack.addEventListener('click', () => {
      window.location.href = '/index.html';
    });
  }
  
  // Delete classroom
  if (DOM.btnDeleteClassroom) {
    DOM.btnDeleteClassroom.addEventListener('click', () => {
      openModal(DOM.modalDeleteConfirm);
    });
  }
  
  // Cancel delete
  if (DOM.btnCancelDelete) {
    DOM.btnCancelDelete.addEventListener('click', () => {
      closeModal(DOM.modalDeleteConfirm);
    });
  }
  
  // Confirm delete
  if (DOM.btnConfirmDelete) {
    DOM.btnConfirmDelete.addEventListener('click', handleDeleteClassroom);
  }
  
  // Close modal on backdrop click
  if (DOM.modalDeleteConfirm) {
    DOM.modalDeleteConfirm.addEventListener('click', (e) => {
      if (e.target === DOM.modalDeleteConfirm) {
        closeModal(DOM.modalDeleteConfirm);
      }
    });
  }
}

// ===== Data Loading =====
async function loadClassroom() {
  try {
    DOM.loadingState.style.display = 'block';
    DOM.classroomContent.style.display = 'none';
    
    const response = await apiCall(`/api/classrooms/${classroomId}`);
    classroom = response.classroom;
    
    console.log('Classroom data:', classroom);
    
    renderClassroom();
    
    DOM.loadingState.style.display = 'none';
    DOM.classroomContent.style.display = 'block';
  } catch (error) {
    console.error('Error loading classroom:', error);
    showToast(error.message || 'Failed to load classroom', 'error');
    DOM.loadingState.innerHTML = '<p class="empty-state">Failed to load classroom details</p>';
  }
}

// ===== Rendering Functions =====
function renderClassroom() {
  if (!classroom) return;
  
  // Classroom header
  if (DOM.classroomName) {
    DOM.classroomName.textContent = classroom.name || 'Untitled Classroom';
  }
  
  if (DOM.classroomSubject) {
    DOM.classroomSubject.textContent = classroom.subject || 'No Subject';
  }
  
  if (DOM.classroomDescription) {
    DOM.classroomDescription.textContent = classroom.description || 'No description provided';
  }
  
  if (DOM.classroomCode) {
    DOM.classroomCode.textContent = classroom.classCode || classroom.code || '------';
  }
  
  const totalMembers = 1 + (classroom.students?.length || 0); // Teacher + students
  if (DOM.memberCount) {
    DOM.memberCount.textContent = totalMembers;
  }
  
  if (DOM.createdDate) {
    const date = new Date(classroom.createdAt);
    DOM.createdDate.textContent = date.toLocaleDateString();
  }
  
  // Render teacher
  renderTeacher();
  
  // Render students
  renderStudents();
}

function renderTeacher() {
  const teacher = classroom.teacher;
  
  if (!teacher) return;
  
  const teacherName = getFullName(teacher);
  const teacherInitial = teacherName.charAt(0).toUpperCase();
  
  if (DOM.teacherAvatar) {
    DOM.teacherAvatar.textContent = teacherInitial;
  }
  
  if (DOM.teacherName) {
    DOM.teacherName.textContent = teacherName;
  }
  
  if (DOM.teacherEmail) {
    DOM.teacherEmail.textContent = teacher.email || 'No email';
  }
}

function renderStudents() {
  const students = classroom.students || [];
  
  if (DOM.studentCount) {
    DOM.studentCount.textContent = students.length;
  }
  
  if (!DOM.studentsList) return;
  
  if (students.length === 0) {
    DOM.studentsList.innerHTML = '<p class="empty-state">No students enrolled yet</p>';
    return;
  }
  
  DOM.studentsList.innerHTML = students.map(student => {
    const studentName = getFullName(student);
    const studentInitial = studentName.charAt(0).toUpperCase();
    
    return `
      <div class="member-card">
        <div class="member-avatar" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          ${studentInitial}
        </div>
        <div class="member-info">
          <div class="member-name">${studentName}</div>
          <div class="member-email">${student.email || 'No email'}</div>
        </div>
        <span class="member-role student">Student</span>
      </div>
    `;
  }).join('');
}

// ===== Helper Functions =====
function getFullName(user) {
  if (!user) return 'Unknown';
  
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || user.name || user.username || 'Unknown';
}

function openModal(modal) {
  if (modal) {
    modal.classList.add('show');
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.remove('show');
  }
}

function showToast(message, type = 'info') {
  if (!DOM.toast) return;
  
  DOM.toast.textContent = message;
  DOM.toast.className = `toast ${type}`;
  DOM.toast.classList.add('show');
  
  setTimeout(() => {
    DOM.toast.classList.remove('show');
  }, 3000);
}

function logout() {
  clearStorage();
  window.location.href = '/auth.html';
}

// ===== Action Handlers =====
async function handleDeleteClassroom() {
  try {
    // Disable button to prevent double clicks
    DOM.btnConfirmDelete.disabled = true;
    DOM.btnConfirmDelete.textContent = 'Deleting...';
    
    await apiCall(`/api/classrooms/${classroomId}`, 'DELETE');
    
    showToast('Classroom deleted successfully', 'success');
    closeModal(DOM.modalDeleteConfirm);
    
    // Redirect to dashboard after short delay
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1500);
  } catch (error) {
    console.error('Error deleting classroom:', error);
    showToast(error.message || 'Failed to delete classroom', 'error');
    
    // Re-enable button
    DOM.btnConfirmDelete.disabled = false;
    DOM.btnConfirmDelete.textContent = 'Delete Classroom';
  }
}

// Export for debugging
export {
  currentUser,
  classroom,
  loadClassroom
};
