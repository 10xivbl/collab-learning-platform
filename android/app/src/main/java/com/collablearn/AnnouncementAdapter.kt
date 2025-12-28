package com.collablearn

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView

class AnnouncementAdapter(private val announcements: List<Announcement>) : RecyclerView.Adapter<AnnouncementAdapter.AnnouncementViewHolder>() {
    class AnnouncementViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val title: TextView = itemView.findViewById(R.id.announcementTitle)
        val content: TextView = itemView.findViewById(R.id.announcementContent)
        val author: TextView = itemView.findViewById(R.id.announcementAuthor)
        val createdAt: TextView = itemView.findViewById(R.id.announcementCreatedAt)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AnnouncementViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_announcement, parent, false)
        return AnnouncementViewHolder(view)
    }

    override fun onBindViewHolder(holder: AnnouncementViewHolder, position: Int) {
        val announcement = announcements[position]
        holder.title.text = announcement.title
        holder.content.text = announcement.content
        val authorName = announcement.createdBy?.let {
            listOfNotNull(it.firstName, it.lastName).joinToString(" ").ifBlank { it.username ?: "Unknown" }
        } ?: "Unknown"
        holder.author.text = "By: $authorName"
        holder.createdAt.text = announcement.createdAt
    }

    override fun getItemCount(): Int = announcements.size
}
