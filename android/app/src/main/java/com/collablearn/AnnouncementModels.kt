package com.collablearn

data class AnnouncementResponse(
    val success: Boolean,
    val count: Int,
    val announcements: List<Announcement>
)

data class SingleAnnouncementResponse(
    val success: Boolean,
    val announcement: Announcement
)

data class CreateAnnouncementRequest(
    val title: String,
    val content: String,
    val classroom: String // classroom ID
)

data class UpdateAnnouncementRequest(
    val title: String?,
    val content: String?
)
