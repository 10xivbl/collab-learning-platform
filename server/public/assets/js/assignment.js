/**
 * Assignment Details Page
 * Collab Learning Platform
 */

import { apiCall } from './utils/api.js';
import { getStorage, clearStorage } from './utils/storage.js';

// ===== Global State =====
let currentUser = null;
let assignment = null;
let submissions = [];
let assignmentId = null;

// ===== DOM Elements =====
const DOM = {
  loadingState: null,
  assignmentContent: null,
  assignmentTitle: null,
  assignmentDescription: null,
  dueDate: null,
  totalPoints: null,
  submissionCount: null,
  submissionsList: null,
  mySubmissionContent: null,
  btnLogout: null,
  toast: null,
  teacherElements: null,
  studentElements: null,
  
  init() {
    this.loadingState = document.getElementById('loadingState');
    this.assignmentContent = document.getElementById('assignmentContent');
    this.assignmentTitle = document.getElementById('assignmentTitle');
    this.assignmentDescription = document.getElementById('assignmentDescription');
    this.dueDate = document.getElementById('dueDate');
    this.totalPoints = document.getElementById('totalPoints');
    this.submissionCount = document.getElementById('submissionCount');
    this.submissionsList = document.getElementById('submissionsList');
    this.mySubmissionContent = document.getElementById('mySubmissionContent');
    this.btnLogout = document.getElementById('btnLogout');
    this.toast = document.getElementById('toast');
    this.teacherElements = document.querySelectorAll('[data-role="teacher"]');
    this.studentElements = document.querySelectorAll('[data-role="student"]');
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
  
  // Get assignment ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  assignmentId = urlParams.get('id');
  
  if (!assignmentId) {
    showToast('No assignment ID provided', 'error');
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
    
    // Load assignment data
    await loadAssignment();
    
    // Load submissions based on role
    if (currentUser.role === 'teacher') {
      await loadAllSubmissions();
    } else {
      await loadMySubmission();
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to load assignment details', 'error');
    setTimeout(() => {
      window.location.href = '/index.html';
    }, 2000);
  }
});

// ===== UI Setup =====
function setupUI() {
  if (!currentUser) return;
  
  // Show/hide role-specific elements
  const isTeacher = currentUser.role === 'teacher';
  DOM.teacherElements.forEach(el => {
    el.classList.toggle('hidden', !isTeacher);
  });
  DOM.studentElements.forEach(el => {
    el.classList.toggle('hidden', isTeacher);
  });
}

// ===== Event Listeners =====
function attachEventListeners() {
  // Logout
  if (DOM.btnLogout) {
    DOM.btnLogout.addEventListener('click', logout);
  }
}

// ===== Data Loading =====
async function loadAssignment() {
  try {
    const response = await apiCall(`/api/assignments/${assignmentId}`);
    assignment = response.assignment;
    
    console.log('Assignment data:', assignment);
    
    renderAssignment();
  } catch (error) {
    console.error('Error loading assignment:', error);
    showToast(error.message || 'Failed to load assignment', 'error');
    throw error;
  }
}

async function loadAllSubmissions() {
  try {
    const response = await apiCall(`/api/submissions/assignment/${assignmentId}`);
    submissions = response.submissions || [];
    
    console.log('Submissions data:', submissions);
    
    renderSubmissions();
    
    DOM.loadingState.style.display = 'none';
    DOM.assignmentContent.style.display = 'block';
  } catch (error) {
    console.error('Error loading submissions:', error);
    DOM.submissionsList.innerHTML = '<p class="empty-state">No submissions yet</p>';
    
    DOM.loadingState.style.display = 'none';
    DOM.assignmentContent.style.display = 'block';
  }
}

async function loadMySubmission() {
  try {
    const response = await apiCall(`/api/submissions/assignment/${assignmentId}/my-submission`);
    const mySubmission = response.submission;
    
    console.log('My submission data:', mySubmission);
    
    renderMySubmission(mySubmission);
    
    DOM.loadingState.style.display = 'none';
    DOM.assignmentContent.style.display = 'block';
  } catch (error) {
    console.error('Error loading my submission:', error);
    DOM.mySubmissionContent.innerHTML = `
      <p class="empty-state">
        You haven't submitted this assignment yet.<br>
        <a href="/index.html" style="color: #2196f3; text-decoration: none;">Go to dashboard to submit</a>
      </p>
    `;
    
    DOM.loadingState.style.display = 'none';
    DOM.assignmentContent.style.display = 'block';
  }
}

// ===== Rendering Functions =====
function renderAssignment() {
  if (!assignment) return;
  
  if (DOM.assignmentTitle) {
    DOM.assignmentTitle.textContent = assignment.title || 'Untitled Assignment';
  }
  
  if (DOM.assignmentDescription) {
    DOM.assignmentDescription.textContent = assignment.description || 'No description provided';
  }
  
  if (DOM.dueDate) {
    const date = new Date(assignment.dueDate);
    const now = new Date();
    const isOverdue = date < now;
    
    DOM.dueDate.innerHTML = `
      ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      ${isOverdue ? '<span class="badge overdue">Overdue</span>' : '<span class="badge upcoming">Upcoming</span>'}
    `;
  }
  
  if (DOM.totalPoints) {
    DOM.totalPoints.textContent = assignment.totalPoints || assignment.points || 100;
  }
}

function renderSubmissions() {
  if (!DOM.submissionsList) return;
  
  if (DOM.submissionCount) {
    DOM.submissionCount.textContent = submissions.length;
  }
  
  if (submissions.length === 0) {
    DOM.submissionsList.innerHTML = '<p class="empty-state">No submissions yet</p>';
    return;
  }
  
  DOM.submissionsList.innerHTML = submissions.map(submission => {
    const student = submission.student;
    const studentName = getFullName(student);
    const studentInitial = studentName.charAt(0).toUpperCase();
    const submittedDate = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Not submitted';
    
    return `
      <div class="submission-item" data-id="${submission._id}">
        <div class="submission-header">
          <div class="student-info">
            <div class="student-avatar">${studentInitial}</div>
            <div>
              <div class="student-name">${studentName}</div>
              <div style="font-size: 12px; color: #666;">${student.email || ''}</div>
            </div>
          </div>
          <span class="submission-status ${submission.status}">${submission.status}</span>
        </div>
        
        ${submission.content ? `
          <div class="submission-content">
            ${submission.content}
          </div>
        ` : ''}
        
        ${submission.attachments && submission.attachments.length > 0 ? `
          <div class="submission-attachments">
            <strong style="font-size: 13px; color: #666;">Attachments:</strong><br>
            ${submission.attachments.map(att => `
              <a href="${att.fileUrl}" target="_blank" class="attachment-link">
                📎 ${att.fileName}
              </a>
            `).join(' ')}
          </div>
        ` : ''}
        
        <div class="submission-footer">
          <div class="submission-info">
            <strong>Submitted:</strong> ${submittedDate}
          </div>
          ${submission.status === 'graded' ? `
            <div class="grade-display">${submission.grade}/${assignment.totalPoints || 100}</div>
          ` : ''}
        </div>
        
        ${submission.status === 'graded' && submission.feedback ? `
          <div style="margin-top: 12px; padding: 12px; background: #f0f8ff; border-radius: 6px;">
            <strong style="font-size: 13px; color: #1976d2;">Feedback:</strong>
            <div style="margin-top: 6px; font-size: 14px; color: #333;">${submission.feedback}</div>
          </div>
        ` : ''}
        
        ${submission.status === 'submitted' || submission.status === 'graded' ? `
          <div class="grade-form" id="gradeForm-${submission._id}">
            <div class="grade-input-group">
              <label>Grade</label>
              <input type="number" id="grade-${submission._id}" min="0" max="${assignment.totalPoints || 100}" 
                     placeholder="0" value="${submission.grade || ''}" />
            </div>
            <div class="grade-input-group" style="flex: 1;">
              <label>Feedback</label>
              <textarea id="feedback-${submission._id}" placeholder="Add feedback for the student...">${submission.feedback || ''}</textarea>
            </div>
            <button class="btn-grade" onclick="gradeSubmission('${submission._id}')">
              ${submission.status === 'graded' ? 'Update Grade' : 'Submit Grade'}
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function renderMySubmission(submission) {
  if (!DOM.mySubmissionContent) return;
  
  if (!submission) {
    DOM.mySubmissionContent.innerHTML = `
      <p class="empty-state">
        You haven't submitted this assignment yet.<br>
        <a href="/index.html" style="color: #2196f3; text-decoration: none;">Go to dashboard to submit</a>
      </p>
    `;
    return;
  }
  
  const submittedDate = submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'Not submitted';
  
  DOM.mySubmissionContent.innerHTML = `
    <div class="my-submission-card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h3 style="margin: 0;">Your Submission</h3>
        <span class="submission-status ${submission.status}">${submission.status}</span>
      </div>
      
      ${submission.content ? `
        <div class="submission-content">
          ${submission.content}
        </div>
      ` : ''}
      
      ${submission.attachments && submission.attachments.length > 0 ? `
        <div class="submission-attachments" style="margin-top: 16px;">
          <strong style="font-size: 13px; color: #666;">Attachments:</strong><br>
          ${submission.attachments.map(att => `
            <a href="${att.fileUrl}" target="_blank" class="attachment-link" style="margin-top: 8px;">
              📎 ${att.fileName}
            </a>
          `).join(' ')}
        </div>
      ` : ''}
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e0e0e0; font-size: 13px; color: #666;">
        <strong>Submitted:</strong> ${submittedDate}
      </div>
      
      ${submission.status === 'graded' ? `
        <div class="submission-grade-card">
          <div class="grade-info">
            <h3 style="margin: 0; font-size: 18px; color: #2e7d32;">Your Grade</h3>
            <div class="grade-display" style="font-size: 32px;">${submission.grade}/${assignment.totalPoints || 100}</div>
          </div>
          
          ${submission.feedback ? `
            <div class="feedback-section">
              <h4>Teacher's Feedback</h4>
              <div class="feedback-text">${submission.feedback}</div>
            </div>
          ` : ''}
          
          ${submission.gradedBy ? `
            <div style="margin-top: 12px; font-size: 12px; color: #666;">
              Graded by ${submission.gradedBy.firstName || submission.gradedBy.username || 'Teacher'}
            </div>
          ` : ''}
        </div>
      ` : submission.status === 'submitted' ? `
        <div style="margin-top: 16px; padding: 12px; background: #e3f2fd; border-radius: 6px; text-align: center; color: #1976d2;">
          ⏳ Your submission is pending review
        </div>
      ` : ''}
    </div>
  `;
}

// ===== Helper Functions =====
function getFullName(user) {
  if (!user) return 'Unknown';
  
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || user.name || user.username || 'Unknown';
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
window.gradeSubmission = async function(submissionId) {
  const gradeInput = document.getElementById(`grade-${submissionId}`);
  const feedbackInput = document.getElementById(`feedback-${submissionId}`);
  
  if (!gradeInput) {
    showToast('Grade input not found', 'error');
    return;
  }
  
  const grade = parseFloat(gradeInput.value);
  const feedback = feedbackInput ? feedbackInput.value : '';
  
  if (isNaN(grade) || grade < 0 || grade > (assignment.totalPoints || 100)) {
    showToast(`Grade must be between 0 and ${assignment.totalPoints || 100}`, 'error');
    return;
  }
  
  try {
    await apiCall(`/api/submissions/${submissionId}/grade`, 'PUT', {
      grade,
      feedback
    });
    
    showToast('Submission graded successfully!', 'success');
    
    // Reload submissions
    await loadAllSubmissions();
  } catch (error) {
    console.error('Error grading submission:', error);
    showToast(error.message || 'Failed to grade submission', 'error');
  }
};

// Export for debugging
export {
  currentUser,
  assignment,
  submissions,
  loadAssignment
};
