package com.collablearn

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class AnnouncementActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: AnnouncementAdapter
    private val announcements = mutableListOf<Announcement>()

    private lateinit var titleInput: EditText
    private lateinit var contentInput: EditText
    private lateinit var createButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_announcement)

        recyclerView = findViewById(R.id.announcementRecyclerView)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = AnnouncementAdapter(announcements)
        recyclerView.adapter = adapter

        titleInput = findViewById(R.id.announcementTitleInput)
        contentInput = findViewById(R.id.announcementContentInput)
        createButton = findViewById(R.id.createAnnouncementButton)

    val classroomId = intent.getStringExtra("CLASSROOM_ID") ?: ""
    val token = "Bearer " + (intent.getStringExtra("TOKEN") ?: "")

        fetchAnnouncements(token, classroomId)

        createButton.setOnClickListener {
            val title = titleInput.text.toString()
            val content = contentInput.text.toString()
            if (title.isNotBlank() && content.isNotBlank()) {
                createAnnouncement(token, classroomId, title, content)
            } else {
                Toast.makeText(this, "Title and content required", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun fetchAnnouncements(token: String, classroomId: String) {
        val api = ApiClient.apiService
        api.getClassroomAnnouncements(token, classroomId).enqueue(object : Callback<AnnouncementResponse> {
            override fun onResponse(call: Call<AnnouncementResponse>, response: Response<AnnouncementResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    announcements.clear()
                    announcements.addAll(response.body()!!.announcements)
                    adapter.notifyDataSetChanged()
                }
            }
            override fun onFailure(call: Call<AnnouncementResponse>, t: Throwable) {
                Toast.makeText(this@AnnouncementActivity, "Failed to load announcements", Toast.LENGTH_SHORT).show()
            }
        })
    }

    private fun createAnnouncement(token: String, classroomId: String, title: String, content: String) {
        val api = ApiClient.apiService
        val request = CreateAnnouncementRequest(title, content, classroomId)
        api.createAnnouncement(token, request).enqueue(object : Callback<SingleAnnouncementResponse> {
            override fun onResponse(call: Call<SingleAnnouncementResponse>, response: Response<SingleAnnouncementResponse>) {
                if (response.isSuccessful && response.body() != null) {
                    announcements.add(0, response.body()!!.announcement)
                    adapter.notifyItemInserted(0)
                    recyclerView.scrollToPosition(0)
                    titleInput.text.clear()
                    contentInput.text.clear()
                    Toast.makeText(this@AnnouncementActivity, "Announcement created", Toast.LENGTH_SHORT).show()
                } else {
                    Toast.makeText(this@AnnouncementActivity, "Failed to create announcement", Toast.LENGTH_SHORT).show()
                }
            }
            override fun onFailure(call: Call<SingleAnnouncementResponse>, t: Throwable) {
                Toast.makeText(this@AnnouncementActivity, "Error creating announcement", Toast.LENGTH_SHORT).show()
            }
        })
    }
}
