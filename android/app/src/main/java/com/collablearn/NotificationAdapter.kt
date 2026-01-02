package com.collablearn

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class NotificationAdapter(
    private val notifications: MutableList<Notification>,
    private val onNotificationClick: (Notification) -> Unit,
    private val onMarkAsRead: (Notification) -> Unit
) : RecyclerView.Adapter<NotificationAdapter.NotificationViewHolder>() {

    class NotificationViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val typeIcon: ImageView = view.findViewById(R.id.notificationTypeIcon)
        val title: TextView = view.findViewById(R.id.notificationTitle)
        val message: TextView = view.findViewById(R.id.notificationMessage)
        val timestamp: TextView = view.findViewById(R.id.notificationTimestamp)
        val classroomName: TextView = view.findViewById(R.id.notificationClassroom)
        val unreadIndicator: View = view.findViewById(R.id.unreadIndicator)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): NotificationViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_notification, parent, false)
        return NotificationViewHolder(view)
    }

    override fun onBindViewHolder(holder: NotificationViewHolder, position: Int) {
        val notification = notifications[position]

        holder.title.text = notification.title
        holder.message.text = notification.message
        holder.timestamp.text = formatTimestamp(notification.createdAt)

        // Set classroom name if available
        if (notification.classroom != null) {
            holder.classroomName.visibility = View.VISIBLE
            holder.classroomName.text = notification.classroom.name
        } else {
            holder.classroomName.visibility = View.GONE
        }

        // Show/hide unread indicator
        holder.unreadIndicator.visibility = if (notification.isRead) View.GONE else View.VISIBLE

        // Set icon based on type
        when (notification.type) {
            "announcement" -> holder.typeIcon.setImageResource(R.drawable.ic_announcement)
            "assignment" -> holder.typeIcon.setImageResource(R.drawable.ic_assignment)
            "submission" -> holder.typeIcon.setImageResource(R.drawable.ic_submission)
            "grade" -> holder.typeIcon.setImageResource(R.drawable.ic_grade)
            else -> holder.typeIcon.setImageResource(R.drawable.ic_notification)
        }

        // Click listeners
        holder.itemView.setOnClickListener {
            if (!notification.isRead) {
                onMarkAsRead(notification)
            }
            onNotificationClick(notification)
        }
    }

    override fun getItemCount() = notifications.size

    fun updateNotifications(newNotifications: List<Notification>) {
        notifications.clear()
        notifications.addAll(newNotifications)
        notifyDataSetChanged()
    }

    fun markAsRead(notificationId: String) {
        val index = notifications.indexOfFirst { it._id == notificationId }
        if (index != -1) {
            notifications[index] = notifications[index].copy(isRead = true)
            notifyItemChanged(index)
        }
    }

    fun removeNotification(notificationId: String) {
        val index = notifications.indexOfFirst { it._id == notificationId }
        if (index != -1) {
            notifications.removeAt(index)
            notifyItemRemoved(index)
        }
    }

    private fun formatTimestamp(timestamp: String): String {
        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            val date = inputFormat.parse(timestamp)
            val now = Date()
            val diff = now.time - (date?.time ?: 0)

            when {
                diff < 60000 -> "Just now"
                diff < 3600000 -> "${diff / 60000}m ago"
                diff < 86400000 -> "${diff / 3600000}h ago"
                diff < 604800000 -> "${diff / 86400000}d ago"
                else -> {
                    val outputFormat = SimpleDateFormat("MMM dd, yyyy", Locale.US)
                    outputFormat.format(date ?: Date())
                }
            }
        } catch (e: Exception) {
            timestamp
        }
    }
}
