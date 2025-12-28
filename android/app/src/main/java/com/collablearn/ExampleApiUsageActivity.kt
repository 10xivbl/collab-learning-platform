package com.collablearn

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView

/**
 * Example activity showing how to use the new API mappings
 * This demonstrates various API calls for different user roles
 */
class ExampleApiUsageActivity : AppCompatActivity() {
    
    private lateinit var apiHelper: ApiHelper
    private lateinit var recyclerView: RecyclerView
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize API helper
        apiHelper = ApiHelper(this)
        
        // Example: Get all classrooms
        loadClassrooms()
        
        // Example: Get specific classroom details
        // loadClassroomDetails("classroom_id_here")
        
        // Example: Create classroom (teacher only)
        // createNewClassroom()
        
        // Example: Join classroom (student only)
        // joinClassroomWithCode("ABC123")
        
        // Example: Get assignments
        // loadAssignments("classroom_id_here")
        
        // Example: Submit assignment (student only)
        // submitAssignment()
        
        // Example: Grade submission (teacher only)
        // gradeStudentSubmission("submission_id", 95, "Great work!")
    }
    
    // ==================== CLASSROOM EXAMPLES ====================
    
    private fun loadClassrooms() {
        apiHelper.getClassrooms(
            onSuccess = { response ->
                if (response.success) {
                    val classrooms = response.classrooms
                    Toast.makeText(this, "Found ${classrooms.size} classrooms", Toast.LENGTH_SHORT).show()
                    
                    classrooms.forEach { classroom ->
                        println("Classroom: ${classroom.name}")
                        println("  - Subject: ${classroom.subject}")
                        println("  - Code: ${classroom.classCode}")
                        println("  - Teacher: ${classroom.teacher.firstName} ${classroom.teacher.lastName}")
                        // println("  - Students: ${classroom.students.size}") // Removed - students field not parsed
                    }
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun loadClassroomDetails(classroomId: String) {
        apiHelper.getClassroom(
            classroomId = classroomId,
            onSuccess = { response ->
                if (response.success) {
                    val classroom = response.classroom
                    Toast.makeText(this, "Loaded: ${classroom.name}", Toast.LENGTH_SHORT).show()
                    
                    // Load members
                    loadClassroomMembers(classroomId)
                    
                    // Load assignments
                    loadAssignments(classroomId)
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun createNewClassroom() {
        val request = CreateClassroomRequest(
            name = "Mathematics 101",
            description = "Introduction to Calculus",
            subject = "Mathematics"
        )
        
        apiHelper.createClassroom(
            request = request,
            onSuccess = { response ->
                if (response.success) {
                    val classroom = response.classroom
                    Toast.makeText(
                        this,
                        "Created classroom: ${classroom.name}\nCode: ${classroom.classCode}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun updateClassroom(classroomId: String) {
        val request = UpdateClassroomRequest(
            name = "Mathematics 102",
            description = "Advanced Calculus",
            subject = null,
            isActive = true
        )
        
        apiHelper.updateClassroom(
            classroomId = classroomId,
            request = request,
            onSuccess = { response ->
                if (response.success) {
                    Toast.makeText(this, "Classroom updated", Toast.LENGTH_SHORT).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun joinClassroomWithCode(classCode: String) {
        val request = JoinClassroomRequest(classCode = classCode)
        
        apiHelper.joinClassroom(
            request = request,
            onSuccess = { response ->
                if (response.success) {
                    val classroom = response.classroom
                    Toast.makeText(
                        this,
                        "Joined: ${classroom.name}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun loadClassroomMembers(classroomId: String) {
        apiHelper.getClassroomMembers(
            classroomId = classroomId,
            onSuccess = { response ->
                if (response.success) {
                    val membersData = response.members
                    val totalMembers = 1 + membersData.students.size
                    Toast.makeText(this, "$totalMembers members", Toast.LENGTH_SHORT).show()
                    
                    println("Teacher: ${membersData.teacher.firstName} ${membersData.teacher.lastName}")
                    membersData.students.forEach { student ->
                        println("Student: ${student.firstName} ${student.lastName}")
                    }
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun leaveClassroom(classroomId: String) {
        apiHelper.leaveClassroom(
            classroomId = classroomId,
            onSuccess = { response ->
                if (response.success) {
                    Toast.makeText(this, response.message, Toast.LENGTH_SHORT).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    // ==================== ASSIGNMENT EXAMPLES ====================
    
    private fun loadAssignments(classroomId: String) {
        apiHelper.getClassroomAssignments(
            classroomId = classroomId,
            onSuccess = { response ->
                if (response.success) {
                    val assignments = response.assignments
                    Toast.makeText(this, "${assignments.size} assignments", Toast.LENGTH_SHORT).show()
                    
                    assignments.forEach { assignment ->
                        println("Assignment: ${assignment.title}")
                        println("  - Due: ${assignment.dueDate}")
                        println("  - Max Score: ${assignment.maxScore}")
                        println("  - Published: ${assignment.isPublished}")
                    }
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun createAssignment(classroomId: String) {
        val request = CreateAssignmentRequest(
            title = "Homework 1: Derivatives",
            description = "Complete problems 1-20 in chapter 3",
            classroom = classroomId,
            dueDate = "2025-12-30T23:59:59Z",
            maxScore = 100,
            attachments = null
        )
        
        apiHelper.createAssignment(
            request = request,
            onSuccess = { response ->
                if (response.success) {
                    val assignment = response.assignment
                    Toast.makeText(
                        this,
                        "Created: ${assignment.title}",
                        Toast.LENGTH_SHORT
                    ).show()
                    
                    // Optionally publish it immediately
                    publishAssignment(assignment._id)
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun publishAssignment(assignmentId: String) {
        apiHelper.publishAssignment(
            assignmentId = assignmentId,
            onSuccess = { response ->
                if (response.success) {
                    Toast.makeText(this, "Assignment published", Toast.LENGTH_SHORT).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun deleteAssignment(assignmentId: String) {
        apiHelper.deleteAssignment(
            assignmentId = assignmentId,
            onSuccess = { response ->
                if (response.success) {
                    Toast.makeText(this, response.message, Toast.LENGTH_SHORT).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    // ==================== SUBMISSION EXAMPLES ====================
    
    private fun submitAssignment(assignmentId: String, classroomId: String) {
        val request = CreateSubmissionRequest(
            assignment = assignmentId,
            classroom = classroomId,
            content = "Here is my solution to the homework problems...",
            attachments = null
        )
        
        apiHelper.createSubmission(
            request = request,
            onSuccess = { response ->
                if (response.success) {
                    val submission = response.submission
                    Toast.makeText(
                        this,
                        "Submission created: ${submission._id}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun loadMySubmission(assignmentId: String) {
        apiHelper.getMySubmission(
            assignmentId = assignmentId,
            onSuccess = { response ->
                if (response.success) {
                    val submission = response.submission
                    println("My submission:")
                    println("  - Content: ${submission.content}")
                    println("  - Submitted: ${submission.submittedAt}")
                    println("  - Graded: ${submission.isGraded}")
                    if (submission.isGraded) {
                        println("  - Score: ${submission.score}")
                        println("  - Feedback: ${submission.feedback}")
                    }
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun loadAllSubmissions(assignmentId: String) {
        apiHelper.getAssignmentSubmissions(
            assignmentId = assignmentId,
            onSuccess = { response ->
                if (response.success) {
                    val submissions = response.submissions
                    Toast.makeText(this, "${submissions.size} submissions", Toast.LENGTH_SHORT).show()
                    
                    submissions.forEach { submission ->
                        println("Submission from: ${submission.student.firstName} ${submission.student.lastName}")
                        println("  - Graded: ${submission.isGraded}")
                        if (submission.isGraded) {
                            println("  - Score: ${submission.score}")
                        }
                    }
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun gradeStudentSubmission(submissionId: String, score: Int, feedback: String) {
        val request = GradeSubmissionRequest(
            score = score,
            feedback = feedback
        )
        
        apiHelper.gradeSubmission(
            submissionId = submissionId,
            request = request,
            onSuccess = { response ->
                if (response.success) {
                    Toast.makeText(this, "Submission graded", Toast.LENGTH_SHORT).show()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun loadStudentSubmissions(classroomId: String, studentId: String) {
        apiHelper.getStudentSubmissions(
            classroomId = classroomId,
            studentId = studentId,
            onSuccess = { response ->
                if (response.success) {
                    val submissions = response.submissions
                    println("Student has ${submissions.size} submissions in this classroom")
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    // ==================== USER EXAMPLES ====================
    
    private fun loadCurrentUser() {
        apiHelper.getMe(
            onSuccess = { response ->
                if (response.success) {
                    val user = response.user
                    println("Current user: ${user.firstName} ${user.lastName}")
                    println("  - Email: ${user.email}")
                    println("  - Role: ${user.role}")
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
    
    private fun performLogout() {
        apiHelper.logout(
            onSuccess = { response ->
                if (response.success) {
                    Toast.makeText(this, "Logged out successfully", Toast.LENGTH_SHORT).show()
                    // Clear local storage and navigate to login
                    finish()
                }
            },
            onError = { error ->
                Toast.makeText(this, "Error: $error", Toast.LENGTH_LONG).show()
            }
        )
    }
}
