package secured.storage.cipher

import android.annotation.SuppressLint
import android.content.Context
import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.security.keystore.StrongBoxUnavailableException
import java.math.BigInteger
import java.security.Key
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.util.Calendar
import javax.crypto.Cipher
import javax.security.auth.x500.X500Principal

internal class RSACipher18Implementation(context: Context) {
    companion object {
        private const val KEYSTORE_PROVIDER_ANDROID = "AndroidKeyStore"
        private const val TYPE_RSA = "RSA"
        private const val ENCRYPTION_ALGORITHM = KeyProperties.KEY_ALGORITHM_RSA
        private const val ENCRYPTION_BLOCK_MODE = KeyProperties.BLOCK_MODE_ECB
        private const val ENCRYPTION_PADDING = KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1
        const val ENCRYPTION_TRANSFORMATION = ENCRYPTION_ALGORITHM + "/" +
                ENCRYPTION_BLOCK_MODE + "/" +
                ENCRYPTION_PADDING
    }

    private val keyAlias: String

    init {
        keyAlias = context.packageName + ".FlutterSecureStoragePluginKey"
        createRSAKeysIfNeeded(context)
    }

    @Throws(Exception::class)
    fun unwrap(wrappedKey: ByteArray?, algorithm: String?): Key {
        val privateKey = privateKey
        val cipher = rsaCipher
        cipher.init(Cipher.UNWRAP_MODE, privateKey)
        return cipher.unwrap(wrappedKey, algorithm, Cipher.SECRET_KEY)
    }

    @get:Throws(Exception::class)
    private val privateKey: PrivateKey
        get() {
            val ks = KeyStore.getInstance(KEYSTORE_PROVIDER_ANDROID)
            ks.load(null)
            return (ks.getKey(keyAlias, null)
                ?: throw Exception("No key found under alias: $keyAlias")) as? PrivateKey
                ?: throw Exception("Not an instance of a PrivateKey")
        }

    @get:Throws(Exception::class)
    private val rsaCipher: Cipher
        @SuppressLint("ObsoleteSdkInt")
        get() = if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
            Cipher.getInstance(
                ENCRYPTION_TRANSFORMATION,
                "AndroidOpenSSL"
            ) // error in android 6: InvalidKeyException: Need RSA private or public key
        } else {
            Cipher.getInstance(
                ENCRYPTION_TRANSFORMATION,
                "AndroidKeyStoreBCWorkaround"
            ) // error in android 5: NoSuchProviderException: Provider not available: AndroidKeyStoreBCWorkaround
        }

    @Throws(Exception::class)
    private fun createRSAKeysIfNeeded(context: Context) {
        val ks = KeyStore.getInstance(KEYSTORE_PROVIDER_ANDROID)
        ks.load(null)
        val privateKey = ks.getKey(keyAlias, null)
        if (privateKey == null) {
            createKeys(context)
        }
    }

    @Throws(Exception::class)
    private fun createKeys(context: Context) {
        val start = Calendar.getInstance()
        val end = Calendar.getInstance()
        end.add(Calendar.YEAR, 25)
        val builder = KeyGenParameterSpec.Builder(
            keyAlias,
            KeyProperties.PURPOSE_DECRYPT or KeyProperties.PURPOSE_ENCRYPT
        )
            .setCertificateSubject(X500Principal("CN=$keyAlias"))
            .setDigests(KeyProperties.DIGEST_SHA256)
            .setBlockModes(KeyProperties.BLOCK_MODE_ECB)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1)
            .setCertificateSerialNumber(BigInteger.valueOf(1))
            .setCertificateNotBefore(start.time)
            .setCertificateNotAfter(end.time)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            builder.setIsStrongBoxBacked(true)
        }

        var spec = builder.build()
        val kpGenerator = KeyPairGenerator.getInstance(TYPE_RSA, KEYSTORE_PROVIDER_ANDROID)
        try {
            kpGenerator.initialize(spec)
            kpGenerator.generateKeyPair()
        } catch (e: Exception) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                when (e) {
                    is StrongBoxUnavailableException -> {
                        spec = KeyGenParameterSpec.Builder(
                            keyAlias,
                            KeyProperties.PURPOSE_DECRYPT or KeyProperties.PURPOSE_ENCRYPT
                        )
                            .setCertificateSubject(X500Principal("CN=$keyAlias"))
                            .setDigests(KeyProperties.DIGEST_SHA256)
                            .setBlockModes(KeyProperties.BLOCK_MODE_ECB)
                            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1)
                            .setCertificateSerialNumber(BigInteger.valueOf(1))
                            .setCertificateNotBefore(start.time)
                            .setCertificateNotAfter(end.time)
                            .build()
                        kpGenerator.initialize(spec)
                        kpGenerator.generateKeyPair()
                    }
                }
            }

        }
    }
}