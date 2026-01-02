/**
 * Assignment Details Page
 * Collab Learning Platform
 */

import { apiCall } from './utils/api.js';
import { getStorage, clearStorage } from './utils/storage.js';
import { initNotifications, stopNotificationPolling } from './notifications.js';

// ===== Global State =====
let currentUser = null;
let assignment = null;
let submissions = [];
let mySubmission = null;
let assignmentId = null;

// ===== DOM Elements =====
const DOM = {
  loadingState: null,
  assignmentContent: null,
  assignmentTitle: null,
  assignmentDescription: null,
  assignmentAttachments: null,
  dueDate: null,
  totalPoints: null,
  submissionCount: null,
  submissionsList: null,
  mySubmissionContent: null,
  formSubmitAssignment: null,
  submissionContentInput: null,
  submissionFileInput: null,
  btnSubmitAssignment: null,
  btnClearForm: null,
  submitFormTitle: null,
  currentFileDisplay: null,
  currentFileName: null,
  btnLogout: null,
  toast: null,
  teacherElements: null,
  studentElements: null,
  
  init() {
    this.loadingState = document.getElementById('loadingState');
    this.assignmentContent = document.getElementById('assignmentContent');
    this.assignmentTitle = document.getElementById('assignmentTitle');
    this.assignmentDescription = document.getElementById('assignmentDescription');
    this.assignmentAttachments = document.getElementById('assignmentAttachments');
    this.dueDate = document.getElementById('dueDate');
    this.totalPoints = document.getElementById('totalPoints');
    this.submissionCount = document.getElementById('submissionCount');
    this.submissionsList = document.getElementById('submissionsList');
    this.mySubmissionContent = document.getElementById('mySubmissionContent');
    this.formSubmitAssignment = document.getElementById('formSubmitAssignment');
    this.submissionContentInput = document.getElementById('submissionContent');
    this.submissionFileInput = document.getElementById('submissionFile');
    this.btnSubmitAssignment = document.getElementById('btnSubmitAssignment');
    this.btnClearForm = document.getElementById('btnClearForm');
    this.submitFormTitle = document.getElementById('submitFormTitle');
    this.currentFileDisplay = document.getElementById('currentFileDisplay');
    this.currentFileName = document.getElementById('currentFileName');
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
    
    // Initialize notifications
    initNotifications();
    
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

  // Submit assignment form
  if (DOM.formSubmitAssignment) {
    DOM.formSubmitAssignment.addEventListener('submit', handleSubmitAssignment);
  }

  // Clear form button
  if (DOM.btnClearForm) {
    DOM.btnClearForm.addEventListener('click', clearSubmissionForm);
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
    mySubmission = response.submission;
    
    console.log('My submission data:', mySubmission);
    
    renderMySubmission(mySubmission);
    populateSubmissionForm(mySubmission);
    
    DOM.loadingState.style.display = 'none';
    DOM.assignmentContent.style.display = 'block';
  } catch (error) {
    console.error('Error loading my submission:', error);
    mySubmission = null;
    DOM.mySubmissionContent.innerHTML = `
      <p class="empty-state" style="color: #666;">
        You haven't submitted this assignment yet. Use the form below to submit your work.
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

  // Render assignment attachments
  if (DOM.assignmentAttachments) {
    if (assignment.attachments && assignment.attachments.length > 0) {
      DOM.assignmentAttachments.innerHTML = assignment.attachments.map(att => `
        <a href="${getDownloadUrl(att.fileUrl, att.fileName)}" target="_blank" download="${att.fileName}" class="attachment-link" style="display: inline-flex; margin: 8px 8px 0 0;">
          ${att.fileName}
          ${att.fileSize ? `<span style="color: #999; font-size: 11px; margin-left: 6px;">(${formatFileSize(att.fileSize)})</span>` : ''}
        </a>
      `).join('');
    } else {
      DOM.assignmentAttachments.innerHTML = '<p class="empty-state">No materials attached</p>';
    }
  }
}

function renderSubmissions() {
  if (!DOM.submissionsList) return;
  
  console.log('All submissions:', submissions);
  console.log('First submission attachments:', submissions[0]?.attachments);
  
  if (DOM.submissionCount) {
    DOM.submissionCount.textContent = submissions.length;
  }
  
  if (submissions.length === 0) {
    DOM.submissionsList.innerHTML = '<p class="empty-state">No submissions yet</p>';
    return;
  }
  
  DOM.submissionsList.innerHTML = submissions.map(submission => {
    console.log('Processing submission:', submission._id, 'attachments:', submission.attachments);
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
              <a href="${getDownloadUrl(att.fileUrl, att.fileName)}" target="_blank" download="${att.fileName}" class="attachment-link">
                ${att.fileName}
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
            <a href="${getDownloadUrl(att.fileUrl, att.fileName)}" target="_blank" download="${att.fileName}" class="attachment-link" style="margin-top: 8px;">
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
  stopNotificationPolling();
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

// ===== Submission Form Handlers =====
function populateSubmissionForm(submission) {
  if (!submission) {
    // Clear form for new submission
    if (DOM.submitFormTitle) {
      DOM.submitFormTitle.textContent = '✍️ Submit Your Work';
    }
    if (DOM.btnSubmitAssignment) {
      DOM.btnSubmitAssignment.textContent = 'Submit Assignment';
    }
    return;
  }

  // Populate form with existing submission
  if (DOM.submissionContentInput) {
    DOM.submissionContentInput.value = submission.content || '';
  }

  // Show existing file info
  if (submission.attachments && submission.attachments.length > 0) {
    if (DOM.currentFileDisplay) {
      DOM.currentFileDisplay.style.display = 'block';
    }
    if (DOM.currentFileName) {
      DOM.currentFileName.textContent = submission.attachments[0].fileName;
    }
  }

  // Update form title and button
  if (DOM.submitFormTitle) {
    DOM.submitFormTitle.textContent = '✏️ Update Submission';
  }
  if (DOM.btnSubmitAssignment) {
    DOM.btnSubmitAssignment.textContent = 'Update Submission';
  }
  if (DOM.btnClearForm) {
    DOM.btnClearForm.style.display = 'inline-block';
  }
}

async function handleSubmitAssignment(e) {
  e.preventDefault();

  const content = DOM.submissionContentInput?.value;
  const file = DOM.submissionFileInput?.files[0];

  if (!content || content.trim() === '') {
    showToast('Please enter your submission content', 'error');
    return;
  }

  try {
    let attachments = [];
    let fileUploadFailed = false;

    // Upload file if provided
    if (file) {
      showToast('Uploading file...', 'info');
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      try {
        const uploadResponse = await apiCall('/api/upload/submission', 'POST', uploadFormData, true);
        
        if (uploadResponse.file) {
          attachments.push({
            fileName: uploadResponse.file.fileName,
            fileUrl: uploadResponse.file.fileUrl,
            fileType: uploadResponse.file.fileType,
            fileSize: uploadResponse.file.fileSize
          });
          console.log('File uploaded successfully:', uploadResponse.file);
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        fileUploadFailed = true;
        
        // Ask user if they want to continue without file
        const continueWithoutFile = confirm(
          'Failed to upload file: ' + uploadError.message + 
          '\n\nDo you want to submit without the new file attachment?'
        );
        
        if (!continueWithoutFile) {
          showToast('Submission cancelled', 'info');
          return;
        }
        
        // If updating and user wants to continue, keep old attachments
        if (mySubmission?.attachments) {
          attachments = mySubmission.attachments;
        }
      }
    } else {
      // No new file, preserve existing attachments if updating
      if (mySubmission?.attachments) {
        attachments = mySubmission.attachments;
      }
    }

    // Create or update submission
    const submissionData = {
      assignment: assignmentId,
      content: content.trim(),
      status: 'submitted',
      attachments: attachments
    };

    console.log('Submitting with data:', submissionData);

    let response;
    if (mySubmission) {
      // Update existing submission
      response = await apiCall(`/api/submissions/${mySubmission._id}`, 'PUT', submissionData);
      showToast(fileUploadFailed ? 'Submission updated (file upload failed)' : 'Submission updated successfully!', 
                fileUploadFailed ? 'info' : 'success');
    } else {
      // Create new submission
      response = await apiCall('/api/submissions', 'POST', submissionData);
      showToast(fileUploadFailed ? 'Assignment submitted (file upload failed)' : 'Assignment submitted successfully!', 
                fileUploadFailed ? 'info' : 'success');
    }

    // Clear file input
    if (DOM.submissionFileInput) {
      DOM.submissionFileInput.value = '';
    }

    // Reload submission data
    await loadMySubmission();
  } catch (error) {
    console.error('Error submitting assignment:', error);
    showToast(error.message || 'Failed to submit assignment', 'error');
  }
}

function clearSubmissionForm() {
  if (DOM.submissionContentInput) {
    DOM.submissionContentInput.value = '';
  }
  if (DOM.submissionFileInput) {
    DOM.submissionFileInput.value = '';
  }
  if (DOM.currentFileDisplay) {
    DOM.currentFileDisplay.style.display = 'none';
  }
  if (DOM.btnClearForm) {
    DOM.btnClearForm.style.display = 'none';
  }
  if (DOM.submitFormTitle) {
    DOM.submitFormTitle.textContent = '✍️ Submit Your Work';
  }
  if (DOM.btnSubmitAssignment) {
    DOM.btnSubmitAssignment.textContent = 'Submit Assignment';
  }
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// Helper function to ensure proper download URL
function getDownloadUrl(fileUrl, fileName) {
  if (!fileUrl) return fileUrl;
  
  // Check if it's a Cloudinary URL
  const cloudinaryPattern = /https:\/\/res\.cloudinary\.com\/([^\/]+)\/(raw|image)\/upload\/(.+)/;
  const match = fileUrl.match(cloudinaryPattern);
  
  if (match) {
    const cloudName = match[1];
    const resourceType = match[2];
    const pathAfterUpload = match[3];
    
    // Only detect PDFs by file extension
    const isPdf = pathAfterUpload.toLowerCase().includes('.pdf') || fileName?.toLowerCase().endsWith('.pdf');
    
    // Remove any existing flags from the path
    const cleanPath = pathAfterUpload.replace(/^fl_attachment[^\/]*\//, '');
    
    // Only convert to raw and add attachment flag for PDFs
    if (isPdf) {
      const correctResourceType = resourceType === 'image' ? 'raw' : resourceType;
      return `https://res.cloudinary.com/${cloudName}/${correctResourceType}/upload/fl_attachment/${cleanPath}`;
    } else {
      // For images and other files, return clean URL for viewing
      return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${cleanPath}`;
    }
  }
  
  return fileUrl;
}

// Helper function to download file with proper handling
async function downloadFile(fileUrl, fileName) {
  try {
    // Ensure the URL has proper download flags
    const downloadUrl = getDownloadUrl(fileUrl, fileName);
    
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download error:', error);
    showToast('Failed to download file', 'error');
  }
}

// Make downloadFile available globally
window.downloadFile = downloadFile;

// Export for debugging
export {
  currentUser,
  assignment,
  submissions,
  loadAssignment
};
