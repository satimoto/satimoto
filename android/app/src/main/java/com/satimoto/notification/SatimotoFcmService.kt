package com.satimoto.notification

import android.annotation.SuppressLint
import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import breez_sdk_notification.Constants
import breez_sdk_notification.Message
import breez_sdk_notification.MessagingService
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
class SatimotoFcmService : MessagingService, FirebaseMessagingService() {
    companion object {
        private const val TAG = "FcmService"
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "FCM message received!")

        if (remoteMessage.priority == RemoteMessage.PRIORITY_HIGH) {
            Log.d(TAG, "onMessageReceived from: ${remoteMessage.from}")
            Log.d(TAG, "onMessageReceived data: ${remoteMessage.data}")
            remoteMessage.asMessage()
                ?.also { message -> startServiceIfNeeded(applicationContext, message) }
        } else {
            Log.d(TAG, "Ignoring FCM message")
        }
    }

    private fun RemoteMessage.asMessage(): Message? {
        return data[Constants.MESSAGE_DATA_TYPE]?.let {
            Message(
                data[Constants.MESSAGE_DATA_TYPE], data[Constants.MESSAGE_DATA_PAYLOAD]
            )
        }
    }

    override fun startForegroundService(message: Message) {
        Log.d(TAG, "Starting foreground service w/ message ${message.type}: ${message.payload}")
        val intent = Intent(applicationContext, SatimotoForegroundService::class.java)
        intent.putExtra(Constants.EXTRA_REMOTE_MESSAGE, message)
        ContextCompat.startForegroundService(applicationContext, intent)
    }
}