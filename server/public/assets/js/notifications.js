import { apiCall } from './utils/api.js';

let notifications = [];
let unreadCount = 0;
let notificationPollingInterval = null;

// DOM Elements
const notificationBell = document.getElementById('notificationBell');
const notificationBadge = document.getElementById('notificationBadge');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationList = document.getElementById('notificationList');
const markAllReadBtn = document.getElementById('markAllReadBtn');

/**
 * Initialize notification system
 */
export function initNotifications() {
  if (!notificationBell || !notificationDropdown) {
    console.warn('Notification elements not found');
    return;
  }

  // Set up event listeners
  notificationBell.addEventListener('click', toggleNotificationDropdown);
  markAllReadBtn?.addEventListener('click', markAllNotificationsAsRead);

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!notificationBell.contains(e.target) && !notificationDropdown.contains(e.target)) {
      closeNotificationDropdown();
    }
  });

  // Initial fetch
  fetchNotifications();
  
  // Poll for new notifications every 30 seconds
  startNotificationPolling();
}

/**
 * Start polling for new notifications
 */
function startNotificationPolling() {
  if (notificationPollingInterval) {
    clearInterval(notificationPollingInterval);
  }
  
  notificationPollingInterval = setInterval(() => {
    fetchNotifications(true); // Silent fetch (no error toast)
  }, 30000); // 30 seconds
}

/**
 * Stop polling for notifications
 */
export function stopNotificationPolling() {
  if (notificationPollingInterval) {
    clearInterval(notificationPollingInterval);
    notificationPollingInterval = null;
  }
}

/**
 * Fetch notifications from the server
 */
export async function fetchNotifications(silent = false) {
  try {
    const response = await apiCall('/api/notifications');
    notifications = response.notifications || response || [];
    
    // Fetch unread count
    const countResponse = await apiCall('/api/notifications/unread-count');
    unreadCount = countResponse.unreadCount || 0;
    
    // Update UI
    updateNotificationBadge();
    renderNotifications();
  } catch (error) {
    if (!silent) {
      console.error('Error fetching notifications:', error);
    }
  }
}

/**
 * Update the notification badge
 */
function updateNotificationBadge() {
  if (!notificationBadge) return;
  
  if (unreadCount > 0) {
    notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    notificationBadge.classList.remove('hidden');
  } else {
    notificationBadge.classList.add('hidden');
  }
}

/**
 * Toggle notification dropdown
 */
function toggleNotificationDropdown(e) {
  e.stopPropagation();
  
  if (notificationDropdown.classList.contains('show')) {
    closeNotificationDropdown();
  } else {
    openNotificationDropdown();
  }
}

/**
 * Open notification dropdown
 */
function openNotificationDropdown() {
  notificationDropdown.classList.add('show');
}

/**
 * Close notification dropdown
 */
function closeNotificationDropdown() {
  notificationDropdown.classList.remove('show');
}

/**
 * Render notifications in the dropdown
 */
function renderNotifications() {
  if (!notificationList) return;
  
  if (notifications.length === 0) {
    notificationList.innerHTML = `
      <div class="notification-empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
        </svg>
        <p>No notifications yet</p>
      </div>
    `;
    return;
  }
  
  const notificationItems = notifications.map(notification => {
    const isUnread = !notification.isRead;
    const timeAgo = formatTimeAgo(notification.createdAt);
    
    return `
      <div class="notification-item ${isUnread ? 'unread' : ''}" 
           data-id="${notification._id}" 
           onclick="handleNotificationClick('${notification._id}', '${notification.relatedId || ''}', '${notification.relatedModel || ''}')">
        <div class="notification-title">${escapeHtml(notification.title)}</div>
        <div class="notification-message">${escapeHtml(notification.message)}</div>
        <div class="notification-time">${timeAgo}</div>
      </div>
    `;
  }).join('');
  
  notificationList.innerHTML = notificationItems;
}

/**
 * Handle notification click
 */
window.handleNotificationClick = async function(notificationId, relatedId, relatedModel) {
  try {
    // Mark as read
    await markNotificationAsRead(notificationId);
    
    // Navigate to related content if available
    if (relatedId && relatedModel) {
      closeNotificationDropdown();
      
      switch (relatedModel) {
        case 'Classroom':
          window.location.href = `/classroom.html?id=${relatedId}`;
          break;
        case 'Assignment':
          window.location.href = `/assignment.html?id=${relatedId}`;
          break;
        case 'Announcement':
          // Navigate to classroom with announcement highlighted
          const notification = notifications.find(n => n._id === notificationId);
          if (notification && notification.classroom) {
            window.location.href = `/classroom.html?id=${notification.classroom}`;
          }
          break;
        default:
          // Just mark as read, no navigation
          break;
      }
    }
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
};

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    await apiCall(`/api/notifications/${notificationId}/read`, 'PUT');
    
    // Update local state
    const notification = notifications.find(n => n._id === notificationId);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      unreadCount = Math.max(0, unreadCount - 1);
      updateNotificationBadge();
      renderNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
  try {
    await apiCall('/api/notifications/mark-all-read', 'PUT');
    
    // Update local state
    notifications.forEach(n => n.isRead = true);
    unreadCount = 0;
    
    updateNotificationBadge();
    renderNotifications();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Format time ago string
 */
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get current notifications
 */
export function getNotifications() {
  return notifications;
}

/**
 * Get unread count
 */
export function getUnreadCount() {
  return unreadCount;
}
