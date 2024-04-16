import UserNotifications
import BreezSDK
import os.log

fileprivate let logger = OSLog(
    subsystem: Bundle.main.bundleIdentifier!,
    category: "NotificationService"
)

fileprivate let accessGroup = "group.com.satimoto"
fileprivate let keychainAccessGroup = "F922YVP6UQ.com.satimoto.SharedKeychain"
fileprivate let accountMnemonic: String = "BREEZ_SDK_SEED_MNEMONIC"
fileprivate let accountApiKey: String = "BREEZ_SDK_API_KEY"

class NotificationService: SDKNotificationService {
    override func getConnectRequest() -> ConnectRequest? {
        guard let apiKey = Bundle.main.object(forInfoDictionaryKey: accountApiKey) as? String else {
            os_log(.error, "API key not found")
            return nil
        }
        os_log("API_KEY: %{public}@", log: logger, type: .info, apiKey)
        var config = defaultConfig(envType: EnvironmentType.production, 
                                   apiKey: apiKey,
                                   nodeConfig: NodeConfig.greenlight(
                                    config: GreenlightNodeConfig(partnerCredentials: nil,
                                                                 inviteCode: nil)))
        config.workingDir = FileManager
            .default.containerURL(forSecurityApplicationGroupIdentifier: accessGroup)!
            .appendingPathComponent("breezSdk", isDirectory: true)
            .absoluteString
        os_log("WORKING_DIR: %{public}@", log: logger, type: .info, config.workingDir)

        // Construct the seed
        let service = Bundle.main.bundleIdentifier!.replacingOccurrences(of: ".NotificationService", with: "")
        guard let mnemonic = KeychainHelper.shared.getString(service: service,
                                                             accessGroup: keychainAccessGroup,
                                                             key: accountMnemonic) else {
            os_log(.error, "Mnemonic not found")
            return nil
        }
        guard let seed = try? mnemonicToSeed(phrase: mnemonic) else {
            os_log(.error, "Invalid seed")
            return nil
        }
        return ConnectRequest(config: config, seed: seed)
    }
}
