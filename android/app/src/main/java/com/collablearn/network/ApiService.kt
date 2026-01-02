package com.collablearn.network

import com.collablearn.AnnouncementResponse
import com.collablearn.ClassroomMembersResponse
import com.collablearn.ClassroomResponse
import com.collablearn.CreateAnnouncementRequest
import com.collablearn.GenericResponse
import com.collablearn.LoginRequest
import com.collablearn.LoginResponse
import com.collablearn.NotificationResponse
import com.collablearn.NotificationsResponse
import com.collablearn.RegisterRequest
import com.collablearn.RegisterResponse
import com.collablearn.SingleAnnouncementResponse
import com.collablearn.SingleClassroomResponse
import com.collablearn.UnreadCountResponse
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @POST("/api/auth/register")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>

    @POST("/api/auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>

    // Notification endpoints
    @GET("/api/notifications")
    fun getNotifications(
        @Header("Authorization") token: String,
        @Query("limit") limit: Int = 20,
        @Query("skip") skip: Int = 0,
        @Query("unreadOnly") unreadOnly: Boolean = false
    ): Call<NotificationsResponse>

    @GET("/api/notifications/unread-count")
    fun getUnreadCount(
        @Header("Authorization") token: String
    ): Call<UnreadCountResponse>

    @PUT("/api/notifications/{notificationId}/read")
    fun markAsRead(
        @Header("Authorization") token: String,
        @Path("notificationId") notificationId: String
    ): Call<NotificationResponse>

    @PUT("/api/notifications/mark-all-read")
    fun markAllAsRead(
        @Header("Authorization") token: String
    ): Call<GenericResponse>

    @DELETE("/api/notifications/{notificationId}")
    fun deleteNotification(
        @Header("Authorization") token: String,
        @Path("notificationId") notificationId: String
    ): Call<GenericResponse>

    // Announcement endpoints
    @GET("/api/announcements/classroom/{classroomId}")
    fun getClassroomAnnouncements(
        @Header("Authorization") token: String,
        @Path("classroomId") classroomId: String
    ): Call<AnnouncementResponse>

    @POST("/api/announcements")
    fun createAnnouncement(
        @Header("Authorization") token: String,
        @Body request: CreateAnnouncementRequest
    ): Call<SingleAnnouncementResponse>

    // Classroom endpoints
    @GET("/api/classrooms")
    fun getClassrooms(
        @Header("Authorization") token: String
    ): Call<ClassroomResponse>

    @GET("/api/classrooms/{classroomId}")
    fun getClassroom(
        @Header("Authorization") token: String,
        @Path("classroomId") classroomId: String
    ): Call<SingleClassroomResponse>

    @GET("/api/classrooms/{classroomId}/members")
    fun getClassroomMembers(
        @Header("Authorization") token: String,
        @Path("classroomId") classroomId: String
    ): Call<ClassroomMembersResponse>
}
