package com.collablearn

import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.cardview.widget.CardView
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import java.text.SimpleDateFormat
import java.util.*

class ClassroomDetailActivity : AppCompatActivity() {

    private lateinit var backButton: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var classroomName: TextView
    private lateinit var classroomDescription: TextView
    private lateinit var classroomSubject: TextView
    private lateinit var teacherName: TextView
    private lateinit var classCode: TextView
    private lateinit var createdDate: TextView
    private lateinit var membersStatus: TextView
    private lateinit var membersList: LinearLayout
    
    private var token: String = ""
    private var classroomId: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_classroom_detail)

        // Initialize views
        backButton = findViewById(R.id.backButton)
        progressBar = findViewById(R.id.progressBar)
        classroomName = findViewById(R.id.classroomName)
        classroomDescription = findViewById(R.id.classroomDescription)
        classroomSubject = findViewById(R.id.classroomSubject)
        teacherName = findViewById(R.id.teacherName)
        classCode = findViewById(R.id.classCode)
        createdDate = findViewById(R.id.createdDate)
        membersStatus = findViewById(R.id.membersStatus)
        membersList = findViewById(R.id.membersList)

        // Get data from intent
        val prefs = getSharedPreferences("auth", MODE_PRIVATE)
        token = prefs.getString("token", "") ?: ""
        classroomId = intent.getStringExtra("classroomId") ?: ""

        if (classroomId.isEmpty()) {
            Toast.makeText(this, "Error: No classroom ID", Toast.LENGTH_SHORT).show()
            finish()
            return
        }

        // Set click listeners
        backButton.setOnClickListener { finish() }

        // Load classroom details
        loadClassroomDetails()
    }

    private fun loadClassroomDetails() {
        progressBar.visibility = View.VISIBLE
        
        ApiClient.apiService.getClassroom("Bearer $token", classroomId)
            .enqueue(object : Callback<SingleClassroomResponse> {
                override fun onResponse(
                    call: Call<SingleClassroomResponse>,
                    response: Response<SingleClassroomResponse>
                ) {
                    progressBar.visibility = View.GONE
                    
                    if (response.isSuccessful && response.body() != null) {
                        val classroom = response.body()!!.classroom
                        displayClassroomInfo(classroom)
                        loadMembers()
                    } else {
                        Toast.makeText(
                            this@ClassroomDetailActivity,
                            "Failed to load classroom details",
                            Toast.LENGTH_SHORT
                        ).show()
                        finish()
                    }
                }

                override fun onFailure(call: Call<SingleClassroomResponse>, t: Throwable) {
                    progressBar.visibility = View.GONE
                    Toast.makeText(
                        this@ClassroomDetailActivity,
                        "Network error: ${t.message}",
                        Toast.LENGTH_LONG
                    ).show()
                    finish()
                }
            })
    }

    private fun displayClassroomInfo(classroom: Classroom) {
        classroomName.text = classroom.name
        classroomDescription.text = classroom.description
        classroomSubject.text = "Subject: ${classroom.subject}"
        teacherName.text = "Teacher: ${classroom.teacher.firstName} ${classroom.teacher.lastName}"
        classCode.text = "Class Code: ${classroom.classCode}"
        
        // Format date
        try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
            val date = sdf.parse(classroom.createdAt.substring(0, 19))
            val displayFormat = SimpleDateFormat("MMM dd, yyyy", Locale.US)
            createdDate.text = if (date != null) {
                "Created: ${displayFormat.format(date)}"
            } else {
                "Created: ${classroom.createdAt}"
            }
        } catch (e: Exception) {
            createdDate.text = "Created: ${classroom.createdAt}"
        }
    }

    private fun loadMembers() {
        membersStatus.text = "Loading members..."
        
        ApiClient.apiService.getClassroomMembers("Bearer $token", classroomId)
            .enqueue(object : Callback<ClassroomMembersResponse> {
                override fun onResponse(
                    call: Call<ClassroomMembersResponse>,
                    response: Response<ClassroomMembersResponse>
                ) {
                    if (response.isSuccessful && response.body() != null) {
                        val membersData = response.body()!!.members
                        
                        // Combine teacher and students into one list
                        val allMembers = mutableListOf<Student>()
                        
                        // Add teacher with role set
                        val teacher = membersData.teacher.copy(role = "teacher")
                        allMembers.add(teacher)
                        
                        // Add students with role set
                        membersData.students.forEach { student ->
                            allMembers.add(student.copy(role = "student"))
                        }
                        
                        membersStatus.text = "Total Members: ${allMembers.size} (1 teacher, ${membersData.students.size} students)"
                        displayMembers(allMembers)
                    } else {
                        membersStatus.text = "Failed to load members: ${response.message()}"
                    }
                }

                override fun onFailure(call: Call<ClassroomMembersResponse>, t: Throwable) {
                    membersStatus.text = "Error loading members: ${t.message}"
                }
            })
    }

    private fun displayMembers(members: List<Student>) {
        membersList.removeAllViews()
        
        members.forEach { member ->
            val card = CardView(this)
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.setMargins(0, 0, 0, 16)
            card.layoutParams = params
            card.cardElevation = 4f
            card.radius = 8f
            card.setCardBackgroundColor(Color.WHITE)
            card.setContentPadding(24, 24, 24, 24)

            val content = LinearLayout(this)
            content.orientation = LinearLayout.HORIZONTAL
            content.layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )

            // Avatar icon
            val avatar = TextView(this)
            avatar.text = when (member.role) {
                "teacher" -> "👨‍🏫"
                else -> "👨‍🎓"
            }
            avatar.textSize = 32f
            val avatarParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            avatarParams.setMargins(0, 0, 24, 0)
            avatar.layoutParams = avatarParams
            content.addView(avatar)

            // Member info
            val info = LinearLayout(this)
            info.orientation = LinearLayout.VERTICAL
            info.layoutParams = LinearLayout.LayoutParams(
                0,
                LinearLayout.LayoutParams.WRAP_CONTENT,
                1f
            )

            // Name
            val name = TextView(this)
            name.text = "${member.firstName} ${member.lastName}"
            name.textSize = 16f
            name.setTextColor(Color.BLACK)
            name.setTypeface(null, android.graphics.Typeface.BOLD)
            info.addView(name)

            // Email
            val email = TextView(this)
            email.text = member.email
            email.textSize = 14f
            email.setTextColor(Color.parseColor("#666666"))
            info.addView(email)

            // Role badge
            val role = member.role ?: "student"
            if (role == "teacher") {
                val badge = TextView(this)
                badge.text = "Teacher"
                badge.textSize = 12f
                badge.setTextColor(Color.parseColor("#16a34a"))
                badge.setTypeface(null, android.graphics.Typeface.BOLD)
                badge.setPadding(12, 6, 12, 6)
                badge.setBackgroundColor(Color.parseColor("#dcfce7"))
                val badgeParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                badgeParams.setMargins(0, 8, 0, 0)
                badge.layoutParams = badgeParams
                info.addView(badge)
            }

            content.addView(info)
            card.addView(content)
            membersList.addView(card)
        }
    }
}
