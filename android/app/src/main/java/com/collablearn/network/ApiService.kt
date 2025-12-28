package com.collablearn.network

import com.collablearn.LoginRequest
import com.collablearn.LoginResponse
import com.collablearn.RegisterRequest
import com.collablearn.RegisterResponse
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface ApiService {
    @POST("/api/auth/register")
    fun register(@Body request: RegisterRequest): Call<RegisterResponse>

    @POST("/api/auth/login")
    fun login(@Body request: LoginRequest): Call<LoginResponse>
}
