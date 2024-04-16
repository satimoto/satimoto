package secured.storage.cipher

import android.R.id.input
import android.content.Context
import android.os.Build
import android.security.keystore.KeyProperties
import android.util.Base64
import java.nio.charset.Charset
import java.security.Key
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec


class CipherStorageFlutterRsa : CipherStorage {
    companion object {
        const val CIPHER_STORAGE_NAME = "KeystoreFlutterRSA"
        const val IV_SIZE = 16
        private const val AES_PREFERENCES_KEY =
            "VGhpcyBpcyB0aGUga2V5IGZvciBhIHNlY3VyZSBzdG9yYWdlIEFFUyBLZXkK"
        private const val ENCRYPTION_ALGORITHM = KeyProperties.KEY_ALGORITHM_RSA
        private const val ENCRYPTION_BLOCK_MODE = KeyProperties.BLOCK_MODE_ECB
        private const val ENCRYPTION_PADDING = KeyProperties.ENCRYPTION_PADDING_PKCS7
        const val ENCRYPTION_TRANSFORMATION = ENCRYPTION_ALGORITHM + "/" +
                ENCRYPTION_BLOCK_MODE + "/" +
                ENCRYPTION_PADDING
    }

    @Throws(Exception::class)
    override fun decrypt(
        appContext: Context,
        service: String,
        key: String,
        valueBytes: ByteArray
    ): String? {
        getKey(appContext, service)?.let { return decryptBytes(it, valueBytes) }
        return null
    }

    override val cipherStorageName: String
        get() = CIPHER_STORAGE_NAME

    override val minSupportedApiLevel: Int
        get() = Build.VERSION_CODES.M

    @Throws(Exception::class)
    private fun decryptBytes(key: Key, bytes: ByteArray): String {
        val iv = ByteArray(IV_SIZE)
        System.arraycopy(bytes, 0, iv, 0, iv.size)
        val ivParameterSpec = IvParameterSpec(iv)

        val payloadSize: Int = bytes.size - IV_SIZE
        val payload = ByteArray(payloadSize)
        System.arraycopy(input, iv.size, payload, 0, payloadSize)

        val cipher = Cipher.getInstance(ENCRYPTION_TRANSFORMATION);
        cipher.init(Cipher.DECRYPT_MODE, key, ivParameterSpec)

        return cipher.doFinal(payload).toString(Charset.forName(CipherStorage.CHARSET_NAME))
    }

    private fun getKey(appContext: Context, service: String): Key? {
        val rsaCipher = RSACipher18Implementation(appContext)
        val preferences = appContext.getSharedPreferences(service, Context.MODE_PRIVATE)

        preferences.getString(AES_PREFERENCES_KEY, null)?.let {
            try {
                val encrypted = Base64.decode(it, Base64.DEFAULT)
                return rsaCipher.unwrap(encrypted, KeyProperties.KEY_ALGORITHM_AES)
            } catch (_: Exception) {}
        }

        return null
    }
}