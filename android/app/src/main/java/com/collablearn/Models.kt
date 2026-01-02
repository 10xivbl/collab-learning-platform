package com.collablearn

// ==================== AUTH MODELS ====================
data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val firstName: String,
    val lastName: String,
    val role: String // "teacher" or "student"
)

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

data class RegisterResponse(
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

data class UserResponse(
    val success: Boolean,
    val user: User
)

data class LogoutResponse(
    val success: Boolean,
    val message: String
)

// ==================== CLASSROOM MODELS ====================
data class ClassroomResponse(
    val success: Boolean,
    val count: Int,
    val classrooms: List<Classroom>
)

data class SingleClassroomResponse(
    val success: Boolean,
    val classroom: Classroom
)

data class Classroom(
    val _id: String,
    val name: String,
    val description: String,
    val subject: String,
    val teacher: Teacher,
    // Students can be either List<String> (IDs) or List<Student> (populated objects)
    // We'll ignore it for now to avoid parsing errors
    // val students: List<Student>? = null,
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

data class CreateClassroomRequest(
    val name: String,
    val description: String,
    val subject: String
)

data class UpdateClassroomRequest(
    val name: String?,
    val description: String?,
    val subject: String?,
    val isActive: Boolean?
)

data class JoinClassroomRequest(
    val classCode: String
)

data class ClassroomMembersResponse(
    val success: Boolean,
    val members: ClassroomMembers
)

data class ClassroomMembers(
    val teacher: Student,
    val students: List<Student>
)

data class Student(
    val _id: String? = null,
    val id: String? = null,
    val username: String,
    val email: String,
    val firstName: String,
    val lastName: String,
    val role: String? = null
)

// ==================== ASSIGNMENT MODELS ====================
data class AssignmentResponse(
    val success: Boolean,
    val count: Int,
    val assignments: List<Assignment>
)

data class SingleAssignmentResponse(
    val success: Boolean,
    val assignment: Assignment
)

data class Assignment(
    val _id: String,
    val title: String,
    val description: String,
    val classroom: String,
    val teacher: String,
    val dueDate: String,
    val maxScore: Int,
    val attachments: List<Attachment>,
    val isPublished: Boolean,
    val createdAt: String,
    val updatedAt: String
)

data class Attachment(
    val url: String,
    val publicId: String,
    val fileName: String,
    val fileType: String,
    val fileSize: Long
)

data class CreateAssignmentRequest(
    val title: String,
    val description: String,
    val classroom: String,
    val dueDate: String,
    val maxScore: Int,
    val attachments: List<Attachment>?
)

data class UpdateAssignmentRequest(
    val title: String?,
    val description: String?,
    val dueDate: String?,
    val maxScore: Int?,
    val attachments: List<Attachment>?
)

// ==================== SUBMISSION MODELS ====================
data class SubmissionResponse(
    val success: Boolean,
    val count: Int,
    val submissions: List<Submission>
)

data class SingleSubmissionResponse(
    val success: Boolean,
    val submission: Submission
)

data class Submission(
    val _id: String,
    val assignment: String,
    val student: Student,
    val classroom: String,
    val content: String,
    val attachments: List<Attachment>,
    val score: Int?,
    val feedback: String?,
    val isGraded: Boolean,
    val submittedAt: String,
    val gradedAt: String?,
    val createdAt: String,
    val updatedAt: String
)

data class CreateSubmissionRequest(
    val assignment: String,
    val classroom: String,
    val content: String,
    val attachments: List<Attachment>?
)

data class GradeSubmissionRequest(
    val score: Int,
    val feedback: String?
)

// ==================== UPLOAD MODELS ====================
data class UploadResponse(
    val success: Boolean,
    val message: String,
    val file: FileInfo?
)

data class MultipleUploadResponse(
    val success: Boolean,
    val message: String,
    val files: List<FileInfo>
)

data class FileInfo(
    val url: String,
    val publicId: String,
    val fileName: String,
    val fileType: String,
    val fileSize: Long
)

data class DeleteFileResponse(
    val success: Boolean,
    val message: String
)

// ==================== GENERIC RESPONSE ====================
data class GenericResponse(
    val success: Boolean,
    val message: String
)

// ==================== NOTIFICATION MODELS ====================
data class Notification(
    val _id: String,
    val user: String,
    val type: String, // "announcement", "assignment", "submission", "grade", "general"
    val title: String,
    val message: String,
    val relatedId: String?,
    val relatedModel: String?,
    val classroom: ClassroomInfo?,
    val isRead: Boolean,
    val createdAt: String
)

data class ClassroomInfo(
    val _id: String,
    val name: String
)

data class NotificationsResponse(
    val success: Boolean,
    val notifications: List<Notification>,
    val unreadCount: Int
)

data class NotificationResponse(
    val success: Boolean,
    val notification: Notification
)

data class UnreadCountResponse(
    val success: Boolean,
    val count: Int
)
