package com.collablearn

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.Menu
import android.view.MenuItem
import android.view.View
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class NotificationActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: NotificationAdapter
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var emptyView: TextView
    
    private val notifications = mutableListOf<Notification>()
    private var token: String = ""

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_notification)

        // Setup action bar
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            title = "Notifications"
        }

        // Get token from intent
        token = "Bearer " + (intent.getStringExtra("TOKEN") ?: "")

        // Initialize views
        recyclerView = findViewById(R.id.notificationRecyclerView)
        swipeRefresh = findViewById(R.id.swipeRefresh)
        progressBar = findViewById(R.id.progressBar)
        emptyView = findViewById(R.id.emptyView)

        // Setup RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = NotificationAdapter(
            notifications,
            onNotificationClick = { notification -> handleNotificationClick(notification) },
            onMarkAsRead = { notification -> markNotificationAsRead(notification._id) }
        )
        recyclerView.adapter = adapter

        // Setup swipe to refresh
        swipeRefresh.setOnRefreshListener {
            loadNotifications()
        }

        // Load notifications
        loadNotifications()
    }

    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_notifications, menu)
        return true
    }

    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            R.id.action_mark_all_read -> {
                markAllAsRead()
                true
            }
            R.id.action_refresh -> {
                loadNotifications()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }

    private fun loadNotifications() {
        progressBar.visibility = View.VISIBLE
        emptyView.visibility = View.GONE

        ApiClient.apiService.getNotifications(token, limit = 50, skip = 0, unreadOnly = false)
            .enqueue(object : Callback<NotificationsResponse> {
                override fun onResponse(
                    call: Call<NotificationsResponse>,
                    response: Response<NotificationsResponse>
                ) {
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false

                    if (response.isSuccessful) {
                        val notificationsResponse = response.body()
                        if (notificationsResponse?.success == true) {
                            notifications.clear()
                            notifications.addAll(notificationsResponse.notifications)
                            adapter.notifyDataSetChanged()

                            // Show empty view if no notifications
                            if (notifications.isEmpty()) {
                                emptyView.visibility = View.VISIBLE
                                emptyView.text = "No notifications yet"
                            } else {
                                emptyView.visibility = View.GONE
                            }

                            // Update action bar subtitle with unread count
                            if (notificationsResponse.unreadCount > 0) {
                                supportActionBar?.subtitle = "${notificationsResponse.unreadCount} unread"
                            } else {
                                supportActionBar?.subtitle = null
                            }
                        } else {
                            Toast.makeText(
                                this@NotificationActivity,
                                "Failed to load notifications",
                                Toast.LENGTH_SHORT
                            ).show()
                        }
                    } else {
                        Toast.makeText(
                            this@NotificationActivity,
                            "Error: ${response.code()}",
                            Toast.LENGTH_SHORT
                        ).show()
                    }
                }

                override fun onFailure(call: Call<NotificationsResponse>, t: Throwable) {
                    progressBar.visibility = View.GONE
                    swipeRefresh.isRefreshing = false
                    Log.e("NotificationActivity", "Failed to load notifications", t)
                    Toast.makeText(
                        this@NotificationActivity,
                        "Network error: ${t.message}",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun markNotificationAsRead(notificationId: String) {
        ApiClient.apiService.markAsRead(token, notificationId)
            .enqueue(object : Callback<NotificationResponse> {
                override fun onResponse(
                    call: Call<NotificationResponse>,
                    response: Response<NotificationResponse>
                ) {
                    if (response.isSuccessful && response.body()?.success == true) {
                        adapter.markAsRead(notificationId)
                        // Update unread count
                        updateUnreadCount()
                    }
                }

                override fun onFailure(call: Call<NotificationResponse>, t: Throwable) {
                    Log.e("NotificationActivity", "Failed to mark as read", t)
                }
            })
    }

    private fun markAllAsRead() {
        ApiClient.apiService.markAllAsRead(token)
            .enqueue(object : Callback<GenericResponse> {
                override fun onResponse(
                    call: Call<GenericResponse>,
                    response: Response<GenericResponse>
                ) {
                    if (response.isSuccessful && response.body()?.success == true) {
                        Toast.makeText(
                            this@NotificationActivity,
                            "All notifications marked as read",
                            Toast.LENGTH_SHORT
                        ).show()
                        loadNotifications()
                    }
                }

                override fun onFailure(call: Call<GenericResponse>, t: Throwable) {
                    Log.e("NotificationActivity", "Failed to mark all as read", t)
                    Toast.makeText(
                        this@NotificationActivity,
                        "Failed to mark all as read",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            })
    }

    private fun updateUnreadCount() {
        ApiClient.apiService.getUnreadCount(token)
            .enqueue(object : Callback<UnreadCountResponse> {
                override fun onResponse(
                    call: Call<UnreadCountResponse>,
                    response: Response<UnreadCountResponse>
                ) {
                    if (response.isSuccessful) {
                        val count = response.body()?.count ?: 0
                        if (count > 0) {
                            supportActionBar?.subtitle = "$count unread"
                        } else {
                            supportActionBar?.subtitle = null
                        }
                    }
                }

                override fun onFailure(call: Call<UnreadCountResponse>, t: Throwable) {
                    Log.e("NotificationActivity", "Failed to get unread count", t)
                }
            })
    }

    private fun handleNotificationClick(notification: Notification) {
        // Handle different notification types
        when (notification.type) {
            "announcement" -> {
                // Navigate to announcement or classroom detail
                if (notification.classroom != null) {
                    val intent = Intent(this, ClassroomDetailActivity::class.java)
                    intent.putExtra("CLASSROOM_ID", notification.classroom._id)
                    intent.putExtra("TOKEN", token.removePrefix("Bearer "))
                    startActivity(intent)
                }
            }
            "assignment" -> {
                // Navigate to assignment detail
                Toast.makeText(this, "Navigate to assignment", Toast.LENGTH_SHORT).show()
            }
            "submission" -> {
                // Navigate to submission detail
                Toast.makeText(this, "Navigate to submission", Toast.LENGTH_SHORT).show()
            }
            "grade" -> {
                // Navigate to grade detail
                Toast.makeText(this, "Navigate to grade", Toast.LENGTH_SHORT).show()
            }
            else -> {
                Toast.makeText(this, notification.message, Toast.LENGTH_LONG).show()
            }
        }
    }
}
