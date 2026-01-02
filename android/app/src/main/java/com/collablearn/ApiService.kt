package com.collablearn

import retrofit2.Call
import retrofit2.http.*

interface ApiService {

    // ==================== AUTH ROUTES ====================
    
    // POST /api/auth/register
    @POST("api/auth/register")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>
    
    // POST /api/auth/login
    @POST("api/auth/login")
    fun login(@Body loginRequest: LoginRequest): Call<LoginResponse>
    
    // POST /api/auth/logout
    @POST("api/auth/logout")
    fun logout(@Header("Authorization") token: String): Call<LogoutResponse>
    
    // GET /api/auth/me
    @GET("api/auth/me")
    fun getMe(@Header("Authorization") token: String): Call<UserResponse>

    // ==================== CLASSROOM ROUTES ====================
    
    // GET /api/classrooms
    @GET("api/classrooms")
    fun getClassrooms(@Header("Authorization") token: String): Call<ClassroomResponse>
    
    // GET /api/classrooms/:id
    @GET("api/classrooms/{id}")
    fun getClassroom(
        @Header("Authorization") token: String,
        @Path("id") classroomId: String
    ): Call<SingleClassroomResponse>
    
    // POST /api/classrooms (teacher only)
    @POST("api/classrooms")
    fun createClassroom(
        @Header("Authorization") token: String,
        @Body request: CreateClassroomRequest
    ): Call<SingleClassroomResponse>
    
    // PUT /api/classrooms/:id (teacher only)
    @PUT("api/classrooms/{id}")
    fun updateClassroom(
        @Header("Authorization") token: String,
        @Path("id") classroomId: String,
        @Body request: UpdateClassroomRequest
    ): Call<SingleClassroomResponse>
    
    // DELETE /api/classrooms/:id (teacher only)
    @DELETE("api/classrooms/{id}")
    fun deleteClassroom(
        @Header("Authorization") token: String,
        @Path("id") classroomId: String
    ): Call<GenericResponse>
    
    // POST /api/classrooms/join (student)
    @POST("api/classrooms/join")
    fun joinClassroom(
        @Header("Authorization") token: String,
        @Body request: JoinClassroomRequest
    ): Call<SingleClassroomResponse>
    
    // POST /api/classrooms/:id/join (student)
    @POST("api/classrooms/{id}/join")
    fun joinClassroomById(
        @Header("Authorization") token: String,
        @Path("id") classroomId: String
    ): Call<SingleClassroomResponse>
    
    // GET /api/classrooms/:id/members
    @GET("api/classrooms/{id}/members")
    fun getClassroomMembers(
        @Header("Authorization") token: String,
        @Path("id") classroomId: String
    ): Call<ClassroomMembersResponse>
    
    // POST /api/classrooms/:id/leave (student)
    @POST("api/classrooms/{id}/leave")
    fun leaveClassroom(
        @Header("Authorization") token: String,
        @Path("id") classroomId: String
    ): Call<GenericResponse>

    // ==================== ASSIGNMENT ROUTES ====================
    
    // GET /api/assignments/classroom/:classroomId
    @GET("api/assignments/classroom/{classroomId}")
    fun getClassroomAssignments(
        @Header("Authorization") token: String,
        @Path("classroomId") classroomId: String
    ): Call<AssignmentResponse>
    
    // GET /api/assignments/:id
    @GET("api/assignments/{id}")
    fun getAssignment(
        @Header("Authorization") token: String,
        @Path("id") assignmentId: String
    ): Call<SingleAssignmentResponse>
    
    // POST /api/assignments (teacher only)
    @POST("api/assignments")
    fun createAssignment(
        @Header("Authorization") token: String,
        @Body request: CreateAssignmentRequest
    ): Call<SingleAssignmentResponse>
    
    // PUT /api/assignments/:id (teacher only)
    @PUT("api/assignments/{id}")
    fun updateAssignment(
        @Header("Authorization") token: String,
        @Path("id") assignmentId: String,
        @Body request: UpdateAssignmentRequest
    ): Call<SingleAssignmentResponse>
    
    // DELETE /api/assignments/:id (teacher only)
    @DELETE("api/assignments/{id}")
    fun deleteAssignment(
        @Header("Authorization") token: String,
        @Path("id") assignmentId: String
    ): Call<GenericResponse>
    
    // PUT /api/assignments/:id/publish (teacher only)
    @PUT("api/assignments/{id}/publish")
    fun publishAssignment(
        @Header("Authorization") token: String,
        @Path("id") assignmentId: String
    ): Call<SingleAssignmentResponse>

    // ==================== SUBMISSION ROUTES ====================
    
    // POST /api/submissions (student only)
    @POST("api/submissions")
    fun createSubmission(
        @Header("Authorization") token: String,
        @Body request: CreateSubmissionRequest
    ): Call<SingleSubmissionResponse>
    
    // GET /api/submissions/assignment/:assignmentId (teacher only)
    @GET("api/submissions/assignment/{assignmentId}")
    fun getAssignmentSubmissions(
        @Header("Authorization") token: String,
        @Path("assignmentId") assignmentId: String
    ): Call<SubmissionResponse>
    
    // GET /api/submissions/assignment/:assignmentId/my-submission (student only)
    @GET("api/submissions/assignment/{assignmentId}/my-submission")
    fun getMySubmission(
        @Header("Authorization") token: String,
        @Path("assignmentId") assignmentId: String
    ): Call<SingleSubmissionResponse>
    
    // PUT /api/submissions/:id/grade (teacher only)
    @PUT("api/submissions/{id}/grade")
    fun gradeSubmission(
        @Header("Authorization") token: String,
        @Path("id") submissionId: String,
        @Body request: GradeSubmissionRequest
    ): Call<SingleSubmissionResponse>
    
    // GET /api/submissions/classroom/:classroomId/student/:studentId
    @GET("api/submissions/classroom/{classroomId}/student/{studentId}")
    fun getStudentSubmissions(
        @Header("Authorization") token: String,
        @Path("classroomId") classroomId: String,
        @Path("studentId") studentId: String
    ): Call<SubmissionResponse>
    
    // DELETE /api/submissions/:id (student only, before grading)
    @DELETE("api/submissions/{id}")
    fun deleteSubmission(
        @Header("Authorization") token: String,
        @Path("id") submissionId: String
    ): Call<GenericResponse>

    // ==================== UPLOAD ROUTES ====================
    // Note: File upload routes require multipart/form-data
    // These would typically use @Multipart and @Part annotations
    // For now, they're commented out as file upload needs special handling
    
    /*
    // POST /api/upload/assignment (teacher only)
    @Multipart
    @POST("api/upload/assignment")
    fun uploadSingleFile(
        @Header("Authorization") token: String,
        @Part file: MultipartBody.Part
    ): Call<UploadResponse>
    
    // POST /api/upload/assignment/multiple (teacher only)
    @Multipart
    @POST("api/upload/assignment/multiple")
    fun uploadMultipleFiles(
        @Header("Authorization") token: String,
        @Part files: List<MultipartBody.Part>
    ): Call<MultipleUploadResponse>
    */
    
    // DELETE /api/upload/:publicId (teacher only)
    @DELETE("api/upload/{publicId}")
    fun deleteFile(
        @Header("Authorization") token: String,
        @Path("publicId") publicId: String
    ): Call<DeleteFileResponse>
    
    // GET /api/upload/info/:publicId
    @GET("api/upload/info/{publicId}")
    fun getFileInfo(
        @Header("Authorization") token: String,
        @Path("publicId") publicId: String
    ): Call<UploadResponse>
    // ==================== ANNOUNCEMENT ROUTES ====================
    // GET /api/announcements/classroom/{classroomId}
    @GET("api/announcements/classroom/{classroomId}")
    fun getClassroomAnnouncements(
        @Header("Authorization") token: String,
        @Path("classroomId") classroomId: String
    ): Call<AnnouncementResponse>

    // GET /api/announcements/{id}
    @GET("api/announcements/{id}")
    fun getAnnouncement(
        @Header("Authorization") token: String,
        @Path("id") announcementId: String
    ): Call<SingleAnnouncementResponse>

    // POST /api/announcements (teacher only)
    @POST("api/announcements")
    fun createAnnouncement(
        @Header("Authorization") token: String,
        @Body request: CreateAnnouncementRequest
    ): Call<SingleAnnouncementResponse>

    // PUT /api/announcements/{id} (teacher only)
    @PUT("api/announcements/{id}")
    fun updateAnnouncement(
        @Header("Authorization") token: String,
        @Path("id") announcementId: String,
        @Body request: UpdateAnnouncementRequest
    ): Call<SingleAnnouncementResponse>

    // DELETE /api/announcements/{id} (teacher only)
    @DELETE("api/announcements/{id}")
    fun deleteAnnouncement(
        @Header("Authorization") token: String,
        @Path("id") announcementId: String
    ): Call<GenericResponse>

    // ==================== NOTIFICATION ROUTES ====================
    
    // GET /api/notifications
    @GET("api/notifications")
    fun getNotifications(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 20,
        @Query("skip") skip: Int = 0,
        @Query("unreadOnly") unreadOnly: Boolean = false
    ): Call<NotificationsResponse>
    
    // GET /api/notifications/unread-count
    @GET("api/notifications/unread-count")
    fun getUnreadCount(
        @Header("Authorization") token: String
    ): Call<UnreadCountResponse>
    
    // PUT /api/notifications/:notificationId/read
    @PUT("api/notifications/{notificationId}/read")
    fun markAsRead(
        @Header("Authorization") token: String,
        @Path("notificationId") notificationId: String
    ): Call<NotificationResponse>
    
    // PUT /api/notifications/mark-all-read
    @PUT("api/notifications/mark-all-read")
    fun markAllAsRead(
        @Header("Authorization") token: String
    ): Call<GenericResponse>
    
    // DELETE /api/notifications/:notificationId
    @DELETE("api/notifications/{notificationId}")
    fun deleteNotification(
        @Header("Authorization") token: String,
        @Path("notificationId") notificationId: String
    ): Call<GenericResponse>
}