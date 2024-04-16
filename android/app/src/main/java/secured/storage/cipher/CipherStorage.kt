package secured.storage.cipher

import android.content.Context
import java.lang.Exception

interface CipherStorage {
    companion object {
        const val CHARSET_NAME = "UTF-8"
    }

    @Throws(Exception::class)
    fun decrypt(appContext: Context, service: String, key: String, valueBytes: ByteArray): String?

    val cipherStorageName: String
    val minSupportedApiLevel: Int
}