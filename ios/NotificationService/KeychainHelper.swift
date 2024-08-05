import Foundation
import KeychainAccess
import os.log

public class KeychainHelper {
    public static let shared = KeychainHelper()
    
    private init() {/* must use shared instance */}
    
    public func getString(service: String, accessGroup: String, key: String) -> String? {
        let keychain = Keychain(service: service, accessGroup: accessGroup)
        do {
            return try keychain.getString(key)
        } catch let error {
            os_log(.error, "Failed to restore %{public}@ from %{public}@ keychain. Error: %{public}@", key, accessGroup, error.localizedDescription)
        }
        
        return nil
    }
}
