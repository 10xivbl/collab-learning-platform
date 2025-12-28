import { apiCall } from './utils/api.js';
import { getStorage, setStorage, removeStorage, clearStorage } from './utils/storage.js';

let currentUser = null;
let classrooms = [];
let assignments = [];
let submissions = [];

// DOM
const DOM = {
  userNameEl: null,
  userRoleEl: null,
  logoutBtn: null,
  teacherElements: null,
  studentElements: null,
  
  // classroom
  classroomsList: null,
  createClassroomBtn: null,
  createClassroomModal: null,
  createClassroomForm: null,
  joinClassroomBtn: null,
  joinClassroomModal: null,
  joinClassroomForm: null,
  
  // assignment
  assignmentsList: null,
  createAssignmentBtn: null,
  createAssignmentModal: null,
  createAssignmentForm: null,
  assignmentClassroomSelect: null,
  
  // submission
  submissionsList: null,
  submitAssignmentModal: null,
  submitAssignmentForm: null,
  submissionAssignmentId: null,
  submissionContent: null,
  submissionFile: null,
  submissionIsDraft: null,
  
  // profile
  profileCard: null,
  profileCardHeader: null,
  headerProfileArea: null,
  headerProfileName: null,
  headerProfileRole: null,
  profilePopup: null,
  popupProfileName: null,
  popupProfileRole: null,
  popupProfileEmail: null,
  popupProfileId: null,
  
  // toast noti
  toast: null,
  
  init() {
    this.userNameEl = document.getElementById('userName');
    this.userRoleEl = document.getElementById('userRole');
    this.logoutBtn = document.getElementById('btnLogout');
    this.teacherElements = document.querySelectorAll('[data-role="teacher"]');
    this.studentElements = document.querySelectorAll('[data-role="student"]');
    
    this.classroomsList = document.getElementById('classroomList');
    this.createClassroomBtn = document.getElementById('btnNewClassroom');
    this.createClassroomModal = document.getElementById('modalCreateClassroom');
    this.createClassroomForm = document.getElementById('formCreateClassroom');
    this.joinClassroomBtn = document.getElementById('btnJoinClassroom');
    this.joinClassroomModal = document.getElementById('modalJoinClassroom');
    this.joinClassroomForm = document.getElementById('formJoinClassroom');
    
    this.assignmentsList = document.getElementById('assignmentList');
    this.createAssignmentBtn = document.getElementById('btnNewAssignment');
    this.createAssignmentModal = document.getElementById('modalCreateAssignment');
    this.createAssignmentForm = document.getElementById('formCreateAssignment');
    this.assignmentClassroomSelect = document.getElementById('assignmentClassroom');
    
    this.submissionsList = document.getElementById('submissionsList');
    this.submitAssignmentModal = document.getElementById('modalSubmitAssignment');
    this.submitAssignmentForm = document.getElementById('formSubmitAssignment');
    this.submissionAssignmentId = document.getElementById('submissionAssignmentId');
    this.submissionContent = document.getElementById('submissionContent');
    this.submissionFile = document.getElementById('submissionFile');
    this.submissionIsDraft = document.getElementById('submissionIsDraft');
    
  this.profileCard = document.getElementById('profileCard');
  this.profileCardHeader = document.getElementById('profileCardHeader');
  this.headerProfileArea = document.getElementById('headerProfileArea');
  this.headerProfileName = document.getElementById('headerProfileName');
  this.headerProfileRole = document.getElementById('headerProfileRole');
  this.profilePopup = document.getElementById('profilePopup');
  this.popupProfileName = document.getElementById('popupProfileName');
  this.popupProfileRole = document.getElementById('popupProfileRole');
  this.popupProfileEmail = document.getElementById('popupProfileEmail');
  this.popupProfileId = document.getElementById('popupProfileId');
    
    this.toast = document.getElementById('toast');
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  DOM.init();
  
  // Check authentication
  const token = getStorage('token');
  if (!token) {
    window.location.href = '/auth.html';
    return;
  }
  
  try {
    // Fetch current user
    const response = await apiCall('/api/auth/me');
    currentUser = response.user || response;
    
    console.log('Current user:', currentUser); // Debug log
    
    // Setup UI
    setupUI();
    attachEventListeners();
    
    // Load initial data
    await loadDashboardData();
  } catch (error) {
    console.error('Initialization error:', error);
    showToast('Failed to load dashboard. Please try logging in again.', 'error');
    setTimeout(() => {
      logout();
    }, 2000);
  }
});

function setupUI() {
  if (!currentUser) return;
  
  // Render profile
  renderProfile();
  
  // Show/hide role-specific elements
  const isTeacher = currentUser.role === 'teacher';
  
  DOM.teacherElements.forEach(el => {
    el.classList.toggle('hidden', !isTeacher);
  });
  
  DOM.studentElements.forEach(el => {
    el.classList.toggle('hidden', isTeacher);
  });
}

function attachEventListeners() {
  // Logout
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener('click', logout);
  }
  
  // Create Classroom (Teacher only)
  if (DOM.createClassroomBtn) {
    DOM.createClassroomBtn.addEventListener('click', () => {
      openModal(DOM.createClassroomModal);
    });
  }
  
  if (DOM.createClassroomForm) {
    DOM.createClassroomForm.addEventListener('submit', handleCreateClassroom);
  }
  
  // Join Classroom (Student only)
  if (DOM.joinClassroomBtn) {
    DOM.joinClassroomBtn.addEventListener('click', () => {
      openModal(DOM.joinClassroomModal);
    });
  }
  
  if (DOM.joinClassroomForm) {
    DOM.joinClassroomForm.addEventListener('submit', handleJoinClassroom);
  }
  
  // Create Assignment (Teacher only)
  if (DOM.createAssignmentBtn) {
    DOM.createAssignmentBtn.addEventListener('click', () => {
      openModal(DOM.createAssignmentModal);
      populateClassroomSelect();
    });
  }
  
  if (DOM.createAssignmentForm) {
    DOM.createAssignmentForm.addEventListener('submit', handleCreateAssignment);
  }
  
  // Submit Assignment (Student only)
  if (DOM.submitAssignmentForm) {
    DOM.submitAssignmentForm.addEventListener('submit', handleSubmitAssignment);
  }
  
  // Modal cancel buttons
  document.querySelectorAll('.btn-cancel').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalOverlay = e.target.closest('.modal-overlay');
      closeModal(modalOverlay);
    });
  });
  
  // Close modal on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(modalOverlay => {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal(modalOverlay);
      }
    });
  });

  // Profile popup logic (moved from submitAssignment)
  if (DOM.headerProfileArea && DOM.profilePopup) {
    let popupOpen = false;
    DOM.headerProfileArea.addEventListener('click', (e) => {
      e.stopPropagation();
      popupOpen = !popupOpen;
      if (popupOpen) {
        DOM.profilePopup.classList.add('show');
      } else {
        DOM.profilePopup.classList.remove('show');
      }
    });
    // Hide popup when clicking outside
    document.addEventListener('click', (e) => {
      if (popupOpen && !DOM.profilePopup.contains(e.target) && !DOM.headerProfileArea.contains(e.target)) {
        DOM.profilePopup.classList.remove('show');
        popupOpen = false;
      }
    });
  }
}

async function loadDashboardData() {
  try {
    // Load data sequentially since assignments depend on classrooms, 
    // and submissions depend on assignments
    if (currentUser.role === 'teacher') {
      await loadClassrooms();
      await loadAssignments();
      await loadSubmissions();
    } else {
      await loadEnrolledClassrooms();
      await loadStudentAssignments();
      await loadMySubmissions();
    }
    
    // Load announcements
    await loadDashboardAnnouncements();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    showToast('Failed to load some data', 'error');
  }
}

async function loadClassrooms() {
  try {
    const response = await apiCall('/api/classrooms');
    classrooms = response.classrooms || [];
    renderClassrooms();
  } catch (error) {
    console.error('Error loading classrooms:', error);
    showToast('Failed to load classrooms', 'error');
  }
}

async function loadEnrolledClassrooms() {
  try {
    // Backend getClassrooms already returns enrolled classrooms for students
    const response = await apiCall('/api/classrooms');
    classrooms = response.classrooms || [];
    renderClassrooms();
  } catch (error) {
    console.error('Error loading enrolled classrooms:', error);
    showToast('Failed to load classrooms', 'error');
  }
}

async function loadAssignments() {
  try {
    // Get assignments from all classrooms
    const allAssignments = [];
    for (const classroom of classrooms) {
      const response = await apiCall(`/api/assignments/classroom/${classroom._id}`);
      if (response.assignments) {
        allAssignments.push(...response.assignments);
      }
    }
    assignments = allAssignments;
    renderAssignments();
  } catch (error) {
    console.error('Error loading assignments:', error);
    showToast('Failed to load assignments', 'error');
  }
}

async function loadStudentAssignments() {
  try {
    const allAssignments = [];
    for (const classroom of classrooms) {
      const response = await apiCall(`/api/assignments/classroom/${classroom._id}`);
      if (response.assignments) {
        allAssignments.push(...response.assignments);
      }
    }
    assignments = allAssignments;
    renderAssignments();
  } catch (error) {
    console.error('Error loading assignments:', error);
    showToast('Failed to load assignments', 'error');
  }
}

async function loadSubmissions() {
  try {
    // For teachers, get submissions from all assignments
    const allSubmissions = [];
    for (const assignment of assignments) {
      try {
        const response = await apiCall(`/api/submissions/assignment/${assignment._id}`);
        if (response.submissions) {
          allSubmissions.push(...response.submissions);
        }
      } catch (error) {
        console.log(`No submissions for assignment ${assignment._id}`);
      }
    }
    submissions = allSubmissions;
    renderSubmissions();
  } catch (error) {
    console.error('Error loading submissions:', error);
    showToast('Failed to load submissions', 'error');
  }
}

async function loadMySubmissions() {
  try {
    // For students, get their submissions for each assignment
    const allSubmissions = [];
    for (const assignment of assignments) {
      try {
        const response = await apiCall(`/api/submissions/assignment/${assignment._id}/my-submission`);
        if (response.submission) {
          allSubmissions.push(response.submission);
        }
      } catch (error) {
        console.log(`No submission for assignment ${assignment._id}`);
      }
    }
    submissions = allSubmissions;
    renderSubmissions();
  } catch (error) {
    console.error('Error loading submissions:', error);
    showToast('Failed to load submissions', 'error');
  }
}

function renderProfile() {
  if (!currentUser) return;
  const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || currentUser.username || 'N/A';
  const profileHtml = `
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #666; font-size: 14px;">Name:</span>
        <strong style="font-size: 15px;">${fullName}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #666; font-size: 14px;">Status:</span>
        <strong style="font-size: 15px;">${currentUser.role}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #666; font-size: 14px;">Email:</span>
        <strong style="font-size: 14px;">${currentUser.email || 'N/A'}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #666; font-size: 14px;">User ID:</span>
        <strong style="font-family: monospace; font-size: 12px; color: #555;">${currentUser.id || currentUser._id || 'N/A'}</strong>
      </div>
    </div>
  `;
  renderProfileCard(profileHtml);
  // Render name and role in header
  if (DOM.headerProfileName) {
    DOM.headerProfileName.textContent = fullName;
  }
  if (DOM.headerProfileRole) {
    DOM.headerProfileRole.textContent = currentUser.role;
    DOM.headerProfileRole.className = 'role-badge ' + (currentUser.role || '');
  }
  // Render popup details
  if (DOM.popupProfileName) DOM.popupProfileName.textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.name || currentUser.username || 'N/A';
  if (DOM.popupProfileRole) DOM.popupProfileRole.textContent = currentUser.role;
  if (DOM.popupProfileEmail) DOM.popupProfileEmail.textContent = currentUser.email || 'N/A';
  if (DOM.popupProfileId) DOM.popupProfileId.textContent = currentUser.id || currentUser._id || 'N/A';
}

function renderClassrooms() {
  if (!DOM.classroomsList) return;
  
  if (classrooms.length === 0) {
    DOM.classroomsList.innerHTML = '<p class="empty-state">No classrooms yet</p>';
    return;
  }
  
  DOM.classroomsList.innerHTML = classrooms.map(classroom => `
    <div class="card classroom-card" data-id="${classroom._id}" onclick="viewClassroom('${classroom._id}')" style="cursor: pointer;">
      <h3>${classroom.name}</h3>
      <p class="muted">${classroom.description || 'No description'}</p>
      <div class="classroom-info">
        <span>Code: <strong>${classroom.classCode || classroom.code || 'N/A'}</strong></span>
        <span>${classroom.students?.length || 0} students</span>
      </div>
    </div>
  `).join('');
}

function renderAssignments() {
  if (!DOM.assignmentsList) return;
  
  if (assignments.length === 0) {
    DOM.assignmentsList.innerHTML = '<p class="empty-state">No assignments yet</p>';
    return;
  }
  
  DOM.assignmentsList.innerHTML = assignments.map(assignment => {
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = dueDate < new Date();
    const isPublished = assignment.status === 'published';
    
    // Get classroom name
    const classroomName = assignment.classroom?.name || 'Unknown Classroom';
    const classroomCode = assignment.classroom?.classCode || assignment.classroom?.code || '';
    
    // For students, check if they have a submission for this assignment
    let submissionStatus = null;
    if (currentUser.role === 'student') {
      const submission = submissions.find(s => 
        (s.assignment._id === assignment._id || s.assignment === assignment._id)
      );
      submissionStatus = submission ? submission.status : null;
    }
    
    return `
      <div class="card assignment-card" data-id="${assignment._id}" onclick="viewAssignment('${assignment._id}')" style="cursor: pointer;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h3 style="margin: 0;">${assignment.title}</h3>
          <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; margin-left: 8px;">
            ${classroomName}
          </span>
        </div>
        <p class="muted">${assignment.description}</p>
        <div class="assignment-info">
          <span>Due: ${dueDate.toLocaleDateString()}</span>
          <span>${assignment.totalPoints || assignment.points || 100} points</span>
          ${isOverdue ? '<span class="badge-error">Overdue</span>' : ''}
          ${currentUser.role === 'teacher' ? `
            <span class="badge-${isPublished ? 'success' : 'warning'}">${isPublished ? 'Published' : 'Draft'}</span>
          ` : ''}
          ${submissionStatus ? `<span class="badge-${submissionStatus === 'submitted' ? 'success' : submissionStatus === 'draft' ? 'warning' : 'info'}">${submissionStatus}</span>` : ''}
        </div>
        <div style="margin-top: 12px; display: flex; gap: 8px;">
          ${currentUser.role === 'teacher' && !isPublished ? `
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); publishAssignment('${assignment._id}')">
              Publish
            </button>
          ` : ''}
          ${currentUser.role === 'teacher' ? `
            <button class="btn btn-sm" style="background: #f44336; color: white;" onclick="event.stopPropagation(); deleteAssignment('${assignment._id}')">
              Delete
            </button>
          ` : ''}
          ${currentUser.role === 'student' ? `
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); submitAssignment('${assignment._id}')">
              ${submissionStatus ? 'Edit Submission' : 'Submit Work'}
            </button>
          ` : ''}
          <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation(); viewAssignment('${assignment._id}')">
            View Details
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSubmissions() {
  if (!DOM.submissionsList) return;
  
  if (submissions.length === 0) {
    DOM.submissionsList.innerHTML = '<p class="empty-state">No submissions yet</p>';
    return;
  }
  
  DOM.submissionsList.innerHTML = submissions.map(submission => `
    <div class="card submission-card" data-id="${submission._id}">
      <h4>${submission.assignment?.title || 'Assignment'}</h4>
      <p class="muted">Submitted by: ${submission.student?.name || submission.student?.username || 'Unknown'}</p>
      <div class="submission-info">
        <span>Status: <strong>${submission.status}</strong></span>
        ${submission.grade !== undefined ? `<span>Grade: ${submission.grade}/${submission.assignment?.totalPoints || submission.assignment?.points || 100}</span>` : ''}
      </div>
      ${currentUser.role === 'teacher' && submission.status === 'submitted' ? `
        <button class="btn btn-primary btn-sm" onclick="gradeSubmission('${submission._id}')">
          Grade
        </button>
      ` : ''}
    </div>
  `).join('');
}

// ===== Bulletin/Announcement Dashboard Logic =====
async function loadDashboardAnnouncements() {
  const bulletinList = document.getElementById('bulletinList');
  if (!bulletinList) return;
  bulletinList.innerHTML = '<p class="muted">Loading announcements...</p>';
  try {
    const res = await apiCall('/api/announcements/my');
    if (res.announcements && res.announcements.length > 0) {
      bulletinList.innerHTML = res.announcements.map(a => {
        const classroomName = a.classroom?.name || 'Unknown Classroom';
        const createdAt = new Date(a.createdAt);
        const day = String(createdAt.getDate()).padStart(2, '0');
        const month = String(createdAt.getMonth() + 1).padStart(2, '0');
        const year = createdAt.getFullYear();
        const dateStr = `${day}/${month}/${year}`;
        return `
          <div class="card assignment-card announcement-card" style="cursor: default;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
              <h3 style="margin: 0;">${a.title || 'Announcement'}</h3>
                 <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; margin-left: 8px;">
                   ${classroomName}
              </span>
            </div>
            <div class="muted" style="font-size: 13px; margin-bottom: 6px;">
              by ${a.createdBy?.firstName || ''} ${a.createdBy?.lastName || a.createdBy?.username || ''} • ${dateStr}
            </div>
            <div class="announcement-content">${a.content}</div>
          </div>
        `;
      }).join('');
    } else {
      bulletinList.innerHTML = '<p class="muted">No announcements yet.</p>';
    }
  } catch (err) {
    bulletinList.innerHTML = '<p class="muted">Failed to load announcements.</p>';
  }
}

window.addEventListener('DOMContentLoaded', loadDashboardAnnouncements);

async function handleCreateClassroom(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const classroomData = {
    name: formData.get('classroomName'),
    subject: formData.get('classroomSubject'),
    description: formData.get('classroomDescription')
  };
  
  try {
    const response = await apiCall('/api/classrooms', 'POST', classroomData);
    showToast('Classroom created successfully!', 'success');
    closeModal(DOM.createClassroomModal);
    e.target.reset();
    await loadClassrooms();
  } catch (error) {
    console.error('Error creating classroom:', error);
    showToast(error.message || 'Failed to create classroom', 'error');
  }
}

async function handleJoinClassroom(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const classCode = formData.get('classroomCode');
  
  if (!classCode || classCode.trim() === '') {
    showToast('Please enter a classroom code', 'error');
    return;
  }
  
  try {
    const response = await apiCall('/api/classrooms/join', 'POST', { 
      classCode: classCode.trim().toUpperCase() 
    });
    
    showToast('Successfully joined classroom!', 'success');
    closeModal(DOM.joinClassroomModal);
    e.target.reset();
    await loadEnrolledClassrooms();
  } catch (error) {
    console.error('Error joining classroom:', error);
    showToast(error.message || 'Failed to join classroom', 'error');
  }
}

async function handleCreateAssignment(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const assignmentData = {
    classroom: formData.get('assignmentClassroom'),
    title: formData.get('assignmentTitle'),
    description: formData.get('assignmentDescription'),
    dueDate: formData.get('assignmentDueDate'),
    totalPoints: parseInt(formData.get('assignmentPoints')),
    attachments: []
  };
  
  try {
    // Upload files if provided
    const files = formData.getAll('files');
    if (files && files.length > 0 && files[0].size > 0) {
      showToast('Uploading materials...', 'info');
      
      for (const file of files) {
        if (file.size > 0) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          
          try {
            const uploadResponse = await apiCall('/api/upload/assignment', 'POST', uploadFormData, true);
            
            if (uploadResponse.file) {
              assignmentData.attachments.push({
                fileName: uploadResponse.file.fileName,
                fileUrl: uploadResponse.file.fileUrl,
                fileType: uploadResponse.file.fileType,
                fileSize: uploadResponse.file.fileSize
              });
            }
          } catch (uploadError) {
            console.error('Error uploading file:', uploadError);
            showToast(`Failed to upload ${file.name}`, 'error');
          }
        }
      }
    }
    
    const response = await apiCall('/api/assignments', 'POST', assignmentData);
    showToast('Assignment created successfully!', 'success');
    closeModal(DOM.createAssignmentModal);
    e.target.reset();
    await loadAssignments();
  } catch (error) {
    console.error('Error creating assignment:', error);
    showToast(error.message || 'Failed to create assignment', 'error');
  }
}

async function handleSubmitAssignment(e) {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const assignmentId = formData.get('assignmentId');
  const content = formData.get('content');
  const file = formData.get('file');
  
  try {
    let attachments = [];
    
    // Upload file if provided
    if (file && file.size > 0) {
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
        }
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        showToast('Failed to upload file, submitting without attachment', 'error');
      }
    }
    
    // Create submission data
    const submissionData = {
      assignment: assignmentId,
      content: content,
      attachments: attachments,
      status: 'submitted'
    };
    
    // Submit the assignment
    const response = await apiCall('/api/submissions', 'POST', submissionData);
    
    showToast('Assignment submitted successfully!', 'success');
    
    closeModal(DOM.submitAssignmentModal);
    e.target.reset();
    
    // Reload submissions
    await loadMySubmissions();
  } catch (error) {
    console.error('Error submitting assignment:', error);
    showToast(error.message || 'Failed to submit assignment', 'error');
  }
}

function populateClassroomSelect() {
  if (!DOM.assignmentClassroomSelect) return;
  
  const options = classrooms.map(classroom => 
    `<option value="${classroom._id}">${classroom.name}</option>`
  ).join('');
  
  DOM.assignmentClassroomSelect.innerHTML = 
    '<option value="">-- Choose a classroom --</option>' + options;
}

function openModal(modal) {
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modal) {
  if (modal) {
    modal.style.display = 'none';
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

window.submitAssignment = async function(assignmentId) {
  console.log('Submit assignment:', assignmentId);
  
  // Find the assignment
  const assignment = assignments.find(a => a._id === assignmentId);
  
  if (!assignment) {
    showToast('Assignment not found', 'error');
    return;
  }
  
  // Check if there's an existing submission
  const existingSubmission = submissions.find(s => s.assignment._id === assignmentId || s.assignment === assignmentId);
  
  // Set the assignment ID in the hidden field
  if (DOM.submissionAssignmentId) {
    DOM.submissionAssignmentId.value = assignmentId;
  }
  
  // Pre-fill form if editing existing submission
  if (existingSubmission && DOM.submissionContent) {
  // ...existing code...
    DOM.submissionContent.value = existingSubmission.content || '';
    
    if (DOM.submissionIsDraft) {
      DOM.submissionIsDraft.checked = existingSubmission.status === 'draft';
    }
  } else if (DOM.submissionContent) {
    DOM.submissionContent.value = '';
    if (DOM.submissionIsDraft) {
      DOM.submissionIsDraft.checked = false;
    }
  }
  
  // Open the modal
  openModal(DOM.submitAssignmentModal);
};

window.gradeSubmission = function(submissionId) {
  console.log('Grade submission:', submissionId);
  showToast('Grade submission feature coming soon!', 'info');
};

window.viewClassroom = function(classroomId) {
  window.location.href = `/classroom.html?id=${classroomId}`;
};

window.viewAssignment = function(assignmentId) {
  window.location.href = `/assignment.html?id=${assignmentId}`;
};

window.publishAssignment = async function(assignmentId) {
  if (!confirm('Are you sure you want to publish this assignment? Students will be able to see and submit to it.')) {
    return;
  }
  
  try {
    await apiCall(`/api/assignments/${assignmentId}/publish`, 'PUT');
    showToast('Assignment published successfully!', 'success');
    
    await loadAssignments();
  } catch (error) {
    console.error('Error publishing assignment:', error);
    showToast(error.message || 'Failed to publish assignment', 'error');
  }
};

window.deleteAssignment = async function(assignmentId) {
  if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone. All submissions will also be deleted.')) {
    return;
  }
  
  try {
    await apiCall(`/api/assignments/${assignmentId}`, 'DELETE');
    showToast('Assignment deleted successfully!', 'success');
    
    // Reload assignments to update the list
    await loadAssignments();
  } catch (error) {
    console.error('Error deleting assignment:', error);
    showToast(error.message || 'Failed to delete assignment', 'error');
  }
};


// Render profile card in both header and main if present
function renderProfileCard(profileHtml) {
  if (DOM.profileCard) DOM.profileCard.innerHTML = profileHtml;
  if (DOM.profileCardHeader) DOM.profileCardHeader.innerHTML = profileHtml;
}

// Example usage: replace your existing profile rendering logic with renderProfileCard(profileHtml)

export {
  currentUser,
  classrooms,
  assignments,
  submissions,
  loadDashboardData,
  renderProfileCard
};
