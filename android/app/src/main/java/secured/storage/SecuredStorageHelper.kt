package secured.storage

import android.content.Context
import android.util.Base64
import secured.storage.cipher.CipherStorage
import secured.storage.cipher.CipherStorageFacebookConceal
import secured.storage.cipher.CipherStorageFlutterRsa
import secured.storage.cipher.CipherStorageKeystoreAesCbc


class SecuredStorageHelper {
    companion object {
        const val DEFAULT_SERVICE = "shared_preferences"
        const val FLUTTER_SERVICE = "FlutterSecureStorage"
        const val FLUTTER_KEY_PREFIX = "VGhpcyBpcyB0aGUgcHJlZml4IGZvciBhIHNlY3VyZSBzdG9yYWdlCg"
        const val REACT_NATIVE_SECURED_STORAGE_SERVICE_PREFIX = "RN_SECURE_STORAGE"

        private var cipherStorageMap = HashMap<String, CipherStorage>()

        init {
            addCipherStorageToMap(CipherStorageFacebookConceal())
            addCipherStorageToMap(CipherStorageKeystoreAesCbc())
        }

        fun readSecuredValue(appContext: Context, key: String): String? {
            return readSecuredValue(appContext, DEFAULT_SERVICE, key)
        }

        fun readSecuredValue(appContext: Context, service: String, key: String): String? {
            val serviceWithPrefix =
                if (service == FLUTTER_SERVICE) service else "${REACT_NATIVE_SECURED_STORAGE_SERVICE_PREFIX}_${service}"
            val keyWithPrefix =
                if (service == FLUTTER_SERVICE) "${FLUTTER_KEY_PREFIX}_${key}" else key
            val preferences =
                appContext.getSharedPreferences(serviceWithPrefix, Context.MODE_PRIVATE)

            return preferences.getString(keyWithPrefix, null)
                ?.let { decodeRawValue(appContext, service, keyWithPrefix, it) }
        }

        private fun decodeRawValue(
            appContext: Context,
            service: String,
            key: String,
            value: String
        ): String? {
            if (service == FLUTTER_SERVICE) {
                val cipherStorage = CipherStorageFlutterRsa()
                val valueBytes = Base64.decode(value, Base64.DEFAULT)
                return cipherStorage.decrypt(appContext, service, key, valueBytes)
            } else {
                val splitValue = value.split(":")
                if (splitValue.size == 2) {
                    val cipherStorageName = splitValue[0].takeUnless { it.isEmpty() }
                        ?: run { CipherStorageFacebookConceal.CIPHER_STORAGE_NAME }
                    val valueBytes = Base64.decode(splitValue[1], Base64.DEFAULT)
                    return getCipherStorageByName(cipherStorageName)?.let {
                        it.decrypt(appContext, service, key, valueBytes)
                    }
                }
            }

            return null
        }

        private fun addCipherStorageToMap(cipherStorage: CipherStorage) {
            cipherStorageMap[cipherStorage.cipherStorageName] = cipherStorage
        }

        private fun getCipherStorageByName(cipherStorageName: String): CipherStorage? {
            return cipherStorageMap[cipherStorageName]
        }
    }
}