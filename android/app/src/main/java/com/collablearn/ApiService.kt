package com.collablearn

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface ApiService {

    // Login
    @POST("api/auth/login")
    fun login(@Body loginRequest: LoginRequest): Call<LoginResponse>

    // Get Classrooms
    @GET("api/classrooms")
    fun getClassrooms(@Header("Authorization") token: String): Call<ClassroomResponse>
}