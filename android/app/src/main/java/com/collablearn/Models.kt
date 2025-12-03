package com.collablearn

data class LoginRequest(
    val email: String,
    val password: String
)

data class LoginResponse(
    val success: Boolean,
    val message: String,
    val token: String?,
    val user: User?
)

data class User(
    val id: String,
    val username: String,
    val email: String,
    val role: String,
    val firstName: String,
    val lastName: String
)

data class ClassroomResponse(
    val success: Boolean,
    val count: Int,
    val classrooms: List<Classroom>
)

data class Classroom(
    val _id: String,
    val name: String,
    val description: String,
    val subject: String,
    val teacher: Teacher,
    val students: List<String>,
    val assignments: List<String>,
    val isActive: Boolean,
    val classCode: String,
    val createdAt: String,
    val updatedAt: String
)

data class Teacher(
    val _id: String,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String
)
