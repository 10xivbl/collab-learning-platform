package com.collablearn

import android.content.Intent
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

class MainActivity : AppCompatActivity() {

    private lateinit var welcomeText: TextView
    private lateinit var statusText: TextView
    private lateinit var loadClassroomsButton: Button
    private lateinit var logoutButton: Button
    // Removed announcementButton
    private lateinit var classroomsList: LinearLayout
    private lateinit var progressBar: ProgressBar
    private var token: String = ""
    // Removed selectedClassroomId

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize views
        welcomeText = findViewById(R.id.welcomeText)
        statusText = findViewById(R.id.statusText)
        loadClassroomsButton = findViewById(R.id.loadClassroomsButton)
        logoutButton = findViewById(R.id.logoutButton)
            // Removed announcementButton initialization
        classroomsList = findViewById(R.id.classroomsList)
        progressBar = findViewById(R.id.progressBar)

        // Get token and user info
        val prefs = getSharedPreferences("auth", MODE_PRIVATE)
        token = prefs.getString("token", "") ?: ""
        val userName = prefs.getString("userName", "User") ?: "User"
        val userRole = prefs.getString("userRole", "student") ?: "student"

        welcomeText.text = "Welcome, $userName! ($userRole)"

        // Button clicks
        loadClassroomsButton.setOnClickListener { loadClassrooms() }
        logoutButton.setOnClickListener {logout()}
            // Removed announcementButton click logic
    }

    private fun loadClassrooms() {
        progressBar.visibility = View.VISIBLE
        loadClassroomsButton.isEnabled = false
        statusText.text = "Loading classrooms..."
        classroomsList.removeAllViews()

        ApiClient.apiService.getClassrooms("Bearer $token")
            .enqueue(object : Callback<ClassroomResponse> {
                override fun onResponse(
                    call: Call<ClassroomResponse>,
                    response: Response<ClassroomResponse>
                ) {
                    progressBar.visibility = View.GONE
                    loadClassroomsButton.isEnabled = true

                    if (response.isSuccessful && response.body() != null) {
                        val classroomResponse = response.body()!!
                        if (classroomResponse.success && classroomResponse.classrooms.isNotEmpty()) {
                            statusText.text = "Found ${classroomResponse.count} classroom(s)"
                            classroomResponse.classrooms.forEach { classroom ->
                                addClassroomCard(classroom)
                            }
                        } else {
                            statusText.text = "No classrooms found"
                        }
                    } else {
                        statusText.text = "Error: ${response.message()}"
                        Toast.makeText(
                            this@MainActivity,
                            "Failed to load classrooms",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onFailure(call: Call<ClassroomResponse>, t: Throwable) {
                    progressBar.visibility = View.GONE
                    loadClassroomsButton.isEnabled = true
                    statusText.text = "Error: ${t.message}"
                    Toast.makeText(
                        this@MainActivity,
                        "Network error: ${t.message}",
                        Toast.LENGTH_LONG
                    ).show()
                }
            })
    }


    private fun addClassroomCard(classroomData: Classroom) {
        runOnUiThread {
            // Create card
            val card = CardView(this)
            val params = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
            params.setMargins(16, 16, 16, 16)
            card.layoutParams = params
            card.cardElevation = 8f
            card.radius = 16f
            card.setCardBackgroundColor(Color.WHITE)
            runOnUiThread {
                // Create card
                val card = CardView(this)
                val params = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                params.setMargins(16, 16, 16, 16)
                card.layoutParams = params
                card.cardElevation = 8f
                card.radius = 16f
                card.setCardBackgroundColor(Color.WHITE)
                card.setContentPadding(48, 48, 48, 48)

                // Make card clickable
                card.isClickable = true
                card.isFocusable = true
                card.setOnClickListener {
                    val intent = Intent(this, ClassroomDetailActivity::class.java)
                    intent.putExtra("classroomId", classroomData._id)
                    startActivity(intent)
                }

                // Create content
                val content = LinearLayout(this)
                content.orientation = LinearLayout.VERTICAL
                content.layoutParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )

                // Title
                val title = TextView(this)
                title.text = classroomData.name
                title.textSize = 22f
                title.setTextColor(Color.parseColor("#000000"))
                title.setTypeface(null, android.graphics.Typeface.BOLD)
                val titleParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                titleParams.setMargins(0, 0, 0, 24)
                title.layoutParams = titleParams
                content.addView(title)

                // Description
                val description = TextView(this)
                description.text = classroomData.description
                description.textSize = 16f
                description.setTextColor(Color.parseColor("#666666"))
                val descParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                descParams.setMargins(0, 0, 0, 16)
                description.layoutParams = descParams
                content.addView(description)

                // Subject
                val subject = TextView(this)
                subject.text = "Subject: ${classroomData.subject}"
                subject.textSize = 14f
                subject.setTextColor(Color.parseColor("#888888"))
                val subjectParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                subjectParams.setMargins(0, 0, 0, 12)
                subject.layoutParams = subjectParams
                content.addView(subject)

                // Teacher info
                val teacher = TextView(this)
                teacher.text = "Teacher: ${classroomData.teacher.firstName} ${classroomData.teacher.lastName}"
                teacher.textSize = 14f
                teacher.setTextColor(Color.parseColor("#16a34a"))
                teacher.setTypeface(null, android.graphics.Typeface.BOLD)
                val teacherParams = LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
                teacherParams.setMargins(0, 0, 0, 12)
                teacher.layoutParams = teacherParams
                content.addView(teacher)

                // Class code
                val code = TextView(this)
                code.text = "Class Code: ${classroomData.classCode}"
                code.textSize = 14f
                code.setTextColor(Color.parseColor("#667eea"))
                code.setTypeface(null, android.graphics.Typeface.BOLD)
                content.addView(code)

                // Announcements (fetch and show latest)
                val announcementText = TextView(this)
                announcementText.text = "Loading announcements..."
                announcementText.textSize = 14f
                announcementText.setTextColor(Color.parseColor("#333333"))
                content.addView(announcementText)

                // Fetch latest announcement for this classroom
                ApiClient.apiService.getClassroomAnnouncements("Bearer $token", classroomData._id)
                    .enqueue(object : retrofit2.Callback<AnnouncementResponse> {
                        override fun onResponse(
                            call: retrofit2.Call<AnnouncementResponse>,
                            response: retrofit2.Response<AnnouncementResponse>
                        ) {
                            if (response.isSuccessful && response.body() != null && response.body()!!.announcements.isNotEmpty()) {
                                val latest = response.body()!!.announcements[0]
                                val authorName = latest.createdBy?.let {
                                    listOfNotNull(it.firstName, it.lastName).joinToString(" ").ifBlank { it.username ?: "Unknown" }
                                } ?: "Unknown"
                                announcementText.text = "Announcement: ${latest.title}\n${latest.content}\nBy: $authorName"
                            } else {
                                announcementText.text = "No announcements yet."
                            }
                        }
                        override fun onFailure(call: retrofit2.Call<AnnouncementResponse>, t: Throwable) {
                            announcementText.text = "Failed to load announcements."
                        }
                    })

                card.addView(content)
                classroomsList.addView(card)

                // Debug log
                Toast.makeText(this, "Added classroom: ${classroomData.name}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun logout() {
        val prefs = getSharedPreferences("auth", MODE_PRIVATE)
        prefs.edit().clear().apply()
        Toast.makeText(this, "Logged out", Toast.LENGTH_SHORT).show()
        val intent = Intent(this, LoginActivity::class.java)
        startActivity(intent)
        finish()
    }
}