package com.satimoto.notification

import android.util.Log
import breez_sdk.ConnectRequest
import breez_sdk.EnvironmentType
import breez_sdk.GreenlightNodeConfig
import breez_sdk.NodeConfig
import breez_sdk.defaultConfig
import breez_sdk.mnemonicToSeed
import breez_sdk_notification.ForegroundService
import breez_sdk_notification.NotificationHelper.Companion.registerNotificationChannels
import breez_sdk_notification.ServiceConfig
import com.satimoto.BuildConfig
import secured.storage.SecuredStorageHelper.Companion.readSecuredValue

class SatimotoForegroundService : ForegroundService() {
    companion object {
        private const val TAG = "ForegroundService"

        private const val ACCOUNT_MNEMONIC = "BREEZ_SDK_SEED_MNEMONIC"
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "Creating foreground service...")
        registerNotificationChannels(applicationContext)
        Log.d(TAG, "Foreground service created.")
    }

    override fun getConnectRequest(): ConnectRequest? {
        val apiKey = BuildConfig.BREEZ_SDK_API_KEY
        Log.v(TAG, "API_KEY: $apiKey")
        val glNodeConf = GreenlightNodeConfig(null, null)
        val nodeConf = NodeConfig.Greenlight(glNodeConf)
        val config = defaultConfig(EnvironmentType.PRODUCTION, apiKey, nodeConf)

        config.workingDir = "${applicationContext.filesDir}/breezSdk"

        return readSecuredValue(applicationContext, ACCOUNT_MNEMONIC)
            ?.let { mnemonic ->
                ConnectRequest(config, mnemonicToSeed(mnemonic))
            } ?: run {
                Log.v(TAG, "Mnemonic not found")
                return null
        }
    }

    override fun getServiceConfig(): ServiceConfig? {
        return ServiceConfig.default()
    }
}