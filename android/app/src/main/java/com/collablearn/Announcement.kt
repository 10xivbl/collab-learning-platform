package com.collablearn

data class Announcement(
    val _id: String,
    val title: String,
    val content: String,
    val createdAt: String,
    val createdBy: CreatedBy?
)