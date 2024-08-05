package secured.storage.cipher

import android.content.Context
import android.os.Build
import android.security.keystore.KeyProperties
import android.util.Log
import com.satimoto.notification.SatimotoFcmService
import secured.storage.cipher.CipherStorage.Companion.CHARSET_NAME
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.IOException
import java.nio.charset.Charset
import java.security.Key
import java.security.KeyStore
import java.security.KeyStoreException
import java.security.NoSuchAlgorithmException
import java.security.UnrecoverableKeyException
import java.security.cert.CertificateException
import javax.crypto.Cipher
import javax.crypto.CipherInputStream
import javax.crypto.spec.IvParameterSpec


class CipherStorageKeystoreAesCbc : CipherStorage {
    companion object {
        const val TAG = "CipherStorageKeystoreAesCbc"
        const val CIPHER_STORAGE_NAME = "KeystoreAESCBC"
        const val DEFAULT_SERVICE = "RN_SECURE_STORAGE_DEFAULT_ALIAS"
        const val KEYSTORE_TYPE = "AndroidKeyStore"
        private const val ENCRYPTION_ALGORITHM = KeyProperties.KEY_ALGORITHM_AES
        private const val ENCRYPTION_BLOCK_MODE = KeyProperties.BLOCK_MODE_CBC
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
        val serviceWithDefault = getDefaultServiceIfEmpty(service)
        Log.d(TAG, "serviceWithDefault: $serviceWithDefault")
        return try {
            val keyStore = getKeyStoreAndLoad()
            val keyStoreKey = keyStore.getKey(serviceWithDefault, null)
            decryptBytes(keyStoreKey, valueBytes)
        } catch (e: KeyStoreException) {
            throw Exception("Could not get key from Keystore", e)
        } catch (e: UnrecoverableKeyException) {
            throw Exception("Could not get key from Keystore", e)
        } catch (e: NoSuchAlgorithmException) {
            throw Exception("Could not get key from Keystore", e)
        }
    }

    override val cipherStorageName: String
        get() = CIPHER_STORAGE_NAME

    override val minSupportedApiLevel: Int
        get() = Build.VERSION_CODES.M

    @Throws(Exception::class)
    private fun decryptBytes(key: Key, bytes: ByteArray): String {
        return try {
            val cipher = Cipher.getInstance(ENCRYPTION_TRANSFORMATION)
            val inputStream = ByteArrayInputStream(bytes)
            val ivParams = readIvFromStream(inputStream)
            cipher.init(Cipher.DECRYPT_MODE, key, ivParams)

            val cipherInputStream = CipherInputStream(inputStream, cipher)
            val output = ByteArrayOutputStream()
            val buffer = ByteArray(1024)
            while (true) {
                val n = cipherInputStream.read(buffer, 0, buffer.size)
                if (n <= 0) {
                    break
                }
                output.write(buffer, 0, n)
            }
            output.toByteArray().toString(Charset.forName(CHARSET_NAME))
        } catch (e: Exception) {
            throw Exception("Could not decrypt bytes", e)
        }
    }

    private fun readIvFromStream(inputStream: ByteArrayInputStream): IvParameterSpec {
        val iv = ByteArray(16)
        inputStream.read(iv, 0, iv.size)
        return IvParameterSpec(iv)
    }

    @Throws(Exception::class)
    private fun getKeyStoreAndLoad(): KeyStore {
        return try {
            Log.d(TAG, "KEYSTORE_TYPE: $KEYSTORE_TYPE")
            val keyStore = KeyStore.getInstance(KEYSTORE_TYPE)
            keyStore.load(null)
            keyStore
        } catch (e: NoSuchAlgorithmException) {
            throw Exception("Could not access Keystore", e)
        } catch (e: CertificateException) {
            throw Exception("Could not access Keystore", e)
        } catch (e: IOException) {
            throw Exception("Could not access Keystore", e)
        }
    }

    private fun getDefaultServiceIfEmpty(service: String): String {
        return service.ifEmpty { DEFAULT_SERVICE }
    }
}