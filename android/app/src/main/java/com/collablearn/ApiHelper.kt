package com.collablearn

import android.content.Context
import android.content.SharedPreferences
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

/**
 * Helper class to simplify API calls with automatic token handling
 */
class ApiHelper(context: Context) {
    
    private val prefs: SharedPreferences = 
        context.getSharedPreferences("CollabLearnPrefs", Context.MODE_PRIVATE)
    
    private val apiService = ApiClient.apiService
    
    // Get stored token
    private fun getToken(): String? {
        return prefs.getString("token", null)
    }
    
    // Get authorization header
    private fun getAuthHeader(): String {
        return "Bearer ${getToken()}"
    }
    
    // ==================== AUTH METHODS ====================
    
    fun register(
        request: RegisterRequest,
        onSuccess: (RegisterResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.register(request).enqueue(object : Callback<RegisterResponse> {
            override fun onResponse(call: Call<RegisterResponse>, response: Response<RegisterResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Registration failed: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<RegisterResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun login(
        request: LoginRequest,
        onSuccess: (LoginResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.login(request).enqueue(object : Callback<LoginResponse> {
            override fun onResponse(call: Call<LoginResponse>, response: Response<LoginResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Login failed: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<LoginResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun logout(
        onSuccess: (LogoutResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.logout(getAuthHeader()).enqueue(object : Callback<LogoutResponse> {
            override fun onResponse(call: Call<LogoutResponse>, response: Response<LogoutResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Logout failed: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<LogoutResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getMe(
        onSuccess: (UserResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getMe(getAuthHeader()).enqueue(object : Callback<UserResponse> {
            override fun onResponse(call: Call<UserResponse>, response: Response<UserResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get user: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<UserResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    // ==================== CLASSROOM METHODS ====================
    
    fun getClassrooms(
        onSuccess: (ClassroomResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getClassrooms(getAuthHeader()).enqueue(object : Callback<ClassroomResponse> {
            override fun onResponse(call: Call<ClassroomResponse>, response: Response<ClassroomResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get classrooms: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ClassroomResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getClassroom(
        classroomId: String,
        onSuccess: (SingleClassroomResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getClassroom(getAuthHeader(), classroomId).enqueue(object : Callback<SingleClassroomResponse> {
            override fun onResponse(call: Call<SingleClassroomResponse>, response: Response<SingleClassroomResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleClassroomResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun createClassroom(
        request: CreateClassroomRequest,
        onSuccess: (SingleClassroomResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.createClassroom(getAuthHeader(), request).enqueue(object : Callback<SingleClassroomResponse> {
            override fun onResponse(call: Call<SingleClassroomResponse>, response: Response<SingleClassroomResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to create classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleClassroomResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun updateClassroom(
        classroomId: String,
        request: UpdateClassroomRequest,
        onSuccess: (SingleClassroomResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.updateClassroom(getAuthHeader(), classroomId, request).enqueue(object : Callback<SingleClassroomResponse> {
            override fun onResponse(call: Call<SingleClassroomResponse>, response: Response<SingleClassroomResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to update classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleClassroomResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun deleteClassroom(
        classroomId: String,
        onSuccess: (GenericResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.deleteClassroom(getAuthHeader(), classroomId).enqueue(object : Callback<GenericResponse> {
            override fun onResponse(call: Call<GenericResponse>, response: Response<GenericResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to delete classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<GenericResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun joinClassroom(
        request: JoinClassroomRequest,
        onSuccess: (SingleClassroomResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.joinClassroom(getAuthHeader(), request).enqueue(object : Callback<SingleClassroomResponse> {
            override fun onResponse(call: Call<SingleClassroomResponse>, response: Response<SingleClassroomResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to join classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleClassroomResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun joinClassroomById(
        classroomId: String,
        onSuccess: (SingleClassroomResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.joinClassroomById(getAuthHeader(), classroomId).enqueue(object : Callback<SingleClassroomResponse> {
            override fun onResponse(call: Call<SingleClassroomResponse>, response: Response<SingleClassroomResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to join classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleClassroomResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getClassroomMembers(
        classroomId: String,
        onSuccess: (ClassroomMembersResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getClassroomMembers(getAuthHeader(), classroomId).enqueue(object : Callback<ClassroomMembersResponse> {
            override fun onResponse(call: Call<ClassroomMembersResponse>, response: Response<ClassroomMembersResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get members: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<ClassroomMembersResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun leaveClassroom(
        classroomId: String,
        onSuccess: (GenericResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.leaveClassroom(getAuthHeader(), classroomId).enqueue(object : Callback<GenericResponse> {
            override fun onResponse(call: Call<GenericResponse>, response: Response<GenericResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to leave classroom: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<GenericResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    // ==================== ASSIGNMENT METHODS ====================
    
    fun getClassroomAssignments(
        classroomId: String,
        onSuccess: (AssignmentResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getClassroomAssignments(getAuthHeader(), classroomId).enqueue(object : Callback<AssignmentResponse> {
            override fun onResponse(call: Call<AssignmentResponse>, response: Response<AssignmentResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get assignments: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<AssignmentResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getAssignment(
        assignmentId: String,
        onSuccess: (SingleAssignmentResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getAssignment(getAuthHeader(), assignmentId).enqueue(object : Callback<SingleAssignmentResponse> {
            override fun onResponse(call: Call<SingleAssignmentResponse>, response: Response<SingleAssignmentResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get assignment: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleAssignmentResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun createAssignment(
        request: CreateAssignmentRequest,
        onSuccess: (SingleAssignmentResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.createAssignment(getAuthHeader(), request).enqueue(object : Callback<SingleAssignmentResponse> {
            override fun onResponse(call: Call<SingleAssignmentResponse>, response: Response<SingleAssignmentResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to create assignment: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleAssignmentResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun updateAssignment(
        assignmentId: String,
        request: UpdateAssignmentRequest,
        onSuccess: (SingleAssignmentResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.updateAssignment(getAuthHeader(), assignmentId, request).enqueue(object : Callback<SingleAssignmentResponse> {
            override fun onResponse(call: Call<SingleAssignmentResponse>, response: Response<SingleAssignmentResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to update assignment: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleAssignmentResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun deleteAssignment(
        assignmentId: String,
        onSuccess: (GenericResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.deleteAssignment(getAuthHeader(), assignmentId).enqueue(object : Callback<GenericResponse> {
            override fun onResponse(call: Call<GenericResponse>, response: Response<GenericResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to delete assignment: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<GenericResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun publishAssignment(
        assignmentId: String,
        onSuccess: (SingleAssignmentResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.publishAssignment(getAuthHeader(), assignmentId).enqueue(object : Callback<SingleAssignmentResponse> {
            override fun onResponse(call: Call<SingleAssignmentResponse>, response: Response<SingleAssignmentResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to publish assignment: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleAssignmentResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    // ==================== SUBMISSION METHODS ====================
    
    fun createSubmission(
        request: CreateSubmissionRequest,
        onSuccess: (SingleSubmissionResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.createSubmission(getAuthHeader(), request).enqueue(object : Callback<SingleSubmissionResponse> {
            override fun onResponse(call: Call<SingleSubmissionResponse>, response: Response<SingleSubmissionResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to create submission: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleSubmissionResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getAssignmentSubmissions(
        assignmentId: String,
        onSuccess: (SubmissionResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getAssignmentSubmissions(getAuthHeader(), assignmentId).enqueue(object : Callback<SubmissionResponse> {
            override fun onResponse(call: Call<SubmissionResponse>, response: Response<SubmissionResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get submissions: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SubmissionResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getMySubmission(
        assignmentId: String,
        onSuccess: (SingleSubmissionResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getMySubmission(getAuthHeader(), assignmentId).enqueue(object : Callback<SingleSubmissionResponse> {
            override fun onResponse(call: Call<SingleSubmissionResponse>, response: Response<SingleSubmissionResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get submission: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleSubmissionResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun gradeSubmission(
        submissionId: String,
        request: GradeSubmissionRequest,
        onSuccess: (SingleSubmissionResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.gradeSubmission(getAuthHeader(), submissionId, request).enqueue(object : Callback<SingleSubmissionResponse> {
            override fun onResponse(call: Call<SingleSubmissionResponse>, response: Response<SingleSubmissionResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to grade submission: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SingleSubmissionResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun getStudentSubmissions(
        classroomId: String,
        studentId: String,
        onSuccess: (SubmissionResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.getStudentSubmissions(getAuthHeader(), classroomId, studentId).enqueue(object : Callback<SubmissionResponse> {
            override fun onResponse(call: Call<SubmissionResponse>, response: Response<SubmissionResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to get submissions: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<SubmissionResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
    
    fun deleteSubmission(
        submissionId: String,
        onSuccess: (GenericResponse) -> Unit,
        onError: (String) -> Unit
    ) {
        apiService.deleteSubmission(getAuthHeader(), submissionId).enqueue(object : Callback<GenericResponse> {
            override fun onResponse(call: Call<GenericResponse>, response: Response<GenericResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    onSuccess(response.body()!!)
                } else {
                    onError("Failed to delete submission: ${response.message()}")
                }
            }
            
            override fun onFailure(call: Call<GenericResponse>, t: Throwable) {
                onError("Network error: ${t.message}")
            }
        })
    }
}
