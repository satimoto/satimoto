package secured.storage.cipher

import android.content.Context
import android.os.Build
import com.facebook.android.crypto.keychain.AndroidConceal
import com.facebook.android.crypto.keychain.SharedPrefsBackedKeyChain
import com.facebook.crypto.CryptoConfig
import com.facebook.crypto.Entity
import java.nio.charset.Charset


class CipherStorageFacebookConceal : CipherStorage {
    companion object {
        const val CIPHER_STORAGE_NAME = "FacebookConceal"
    }

    @Throws(Exception::class)
    override fun decrypt(
        appContext: Context,
        service: String,
        key: String,
        valueBytes: ByteArray
    ): String? {
        val keyChain = SharedPrefsBackedKeyChain(appContext, CryptoConfig.KEY_256)
        val crypto = AndroidConceal.get().createDefaultCrypto(keyChain)

        if (!crypto.isAvailable) {
            throw Exception("Crypto is missing")
        }
        val valueEntity = Entity.create("$service:$key")
        return try {
            val decryptedValue = crypto.decrypt(valueBytes, valueEntity)
            decryptedValue.toString(Charset.forName(CipherStorage.CHARSET_NAME))
        } catch (e: Exception) {
            throw Exception("Decryption failed for service $service", e)
        }
    }

    override val cipherStorageName: String
        get() = CIPHER_STORAGE_NAME

    override val minSupportedApiLevel: Int
        get() = Build.VERSION_CODES.JELLY_BEAN
}