import Foundation

@objc(LndUtils)
class LndUtils: RCTEventEmitter {
  
  static let logEventName: String = "logEvent"
  
  var logEventsStarted: Bool = false
  
  static var lndDirectory: URL {
    let applicationDirectory = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
    let lndDirectory = applicationDirectory.appendingPathComponent("lnd", isDirectory: true)
    
    if !FileManager.default.fileExists(atPath: lndDirectory.path) {
      try! FileManager.default.createDirectory(atPath: lndDirectory.path, withIntermediateDirectories: true)
    }
    
    return lndDirectory
  }
  
  static var confFile: URL {
    return lndDirectory.appendingPathComponent("lnd_v5.conf", isDirectory: false)
  }
  
  static private var logFile: URL {
    let network = Bundle.main.object(forInfoDictionaryKey: "NETWORK") as? String
    return lndDirectory.appendingPathComponent("logs", isDirectory: true)
      .appendingPathComponent("bitcoin", isDirectory: true)
      .appendingPathComponent(network ?? "mainnet", isDirectory: true)
      .appendingPathComponent("lnd.log", isDirectory: false)
  }
  
  @objc
  override static func moduleName() -> String! {
    "LndUtils"
  }
  
  override func supportedEvents() -> [String]! {
    return [LndUtils.logEventName]
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  func writeConf(_ content: String) throws {
    try content.write(to: LndUtils.confFile, atomically: true, encoding: .utf8)
  }
  
  @objc(writeConf:resolver:rejecter:)
  func writeConf(_ content: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      try self.writeConf(content)
      RCTLogInfo("conf file written")
      resolve("conf file written")
    } catch let err {
      RCTLogError("error writing conf: \(err.localizedDescription)")
      reject("error", err.localizedDescription, err)
    }
  }
  
  func writeDefaultConf() throws {
    let network = Bundle.main.object(forInfoDictionaryKey: "NETWORK") as? String
    var content = ""
    
    if network == "mainnet" {
      content =
        """
[Application Options]
debuglevel=warn
maxbackoff=2s
nobootstrap=1
nolisten=1
norest=1
sync-freelist=1
accept-keysend=1
feeurl=https://nodes.lightning.computer/fees/v1/btc-fee-estimates.json
gc-canceled-invoices-on-startup=1
gc-canceled-invoices-on-the-fly=1
ignore-historical-gossip-filters=1

[Bitcoin]
bitcoin.active=1
bitcoin.mainnet=1
bitcoin.node=neutrino

[Neutrino]
neutrino.addpeer=btcd-mainnet.lightning.computer
neutrino.addpeer=mainnet1-btcd.zaphq.io
neutrino.addpeer=mainnet2-btcd.zaphq.io
neutrino.addpeer=mainnet3-btcd.zaphq.io
neutrino.addpeer=mainnet4-btcd.zaphq.io
neutrino.addpeer=bb2.breez.technology
neutrino.validatechannels=false

[protocol]
protocol.option-scid-alias=true
protocol.zero-conf=true

[autopilot]
autopilot.active=0
autopilot.private=0
autopilot.minconfs=0
autopilot.conftarget=30
autopilot.allocation=1.0
autopilot.heuristic=externalscore:0.95
autopilot.heuristic=preferential:0.05
"""
    } else if (network == "testnet") {
      content =
        """
[Application Options]
debuglevel=info
maxbackoff=2s
nobootstrap=1
nolisten=1
norest=1
sync-freelist=1
accept-keysend=1
feeurl=https://nodes.lightning.computer/fees/v1/btc-fee-estimates.json
gc-canceled-invoices-on-startup=1
gc-canceled-invoices-on-the-fly=1
ignore-historical-gossip-filters=1

[Bitcoin]
bitcoin.active=1
bitcoin.testnet=1
bitcoin.node=neutrino

[Neutrino]
neutrino.connect=faucet.lightning.community
neutrino.validatechannels=false

[protocol]
protocol.option-scid-alias=true
protocol.zero-conf=true

[autopilot]
autopilot.active=0
autopilot.private=0
autopilot.minconfs=0
autopilot.conftarget=30
autopilot.allocation=1.0
autopilot.heuristic=externalscore:0.95
autopilot.heuristic=preferential:0.05
"""
    } else if (network == "regtest") {
      content =
        """
[Application Options]
debuglevel=info
maxbackoff=2s
nobootstrap=1
nolisten=1
norest=1
sync-freelist=1
accept-keysend=1
gc-canceled-invoices-on-startup=1
gc-canceled-invoices-on-the-fly=1
ignore-historical-gossip-filters=1

[Bitcoin]
bitcoin.active=1
bitcoin.regtest=1
bitcoin.node=bitcoind

[Bitcoind]
bitcoind.rpchost=127.0.0.1:18449
bitcoind.rpcuser=polaruser
bitcoind.rpcpass=polarpass
bitcoind.zmqpubrawblock=tcp://127.0.0.1:28340
bitcoind.zmqpubrawtx=tcp://127.0.0.1:29341

[protocol]
protocol.option-scid-alias=true
protocol.zero-conf=true

[autopilot]
autopilot.active=0
autopilot.private=0
autopilot.minconfs=0
autopilot.conftarget=30
autopilot.allocation=1.0
autopilot.heuristic=externalscore:0.95
autopilot.heuristic=preferential:0.05
"""
    }
    
    try self.writeConf(content)
  }
  
  @objc(writeDefaultConf:rejecter:)
  func writeDefaultConf(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      try self.writeDefaultConf()
      RCTLogInfo("conf file written")
      resolve("conf file written")
    } catch let err {
      RCTLogError("error writing conf: \(err.localizedDescription)")
      reject("error", err.localizedDescription, err)
    }
  }

  func deleteLog() {
    do {
      let fileManager = FileManager.default
      if fileManager.fileExists(atPath: LndUtils.logFile.path) {
        try fileManager.removeItem(atPath: LndUtils.logFile.path)
      }
    } catch let err {
      RCTLogError("Error deleting log: \(err.localizedDescription)")
    }
  }
  
  @objc(startLogEvents:rejecter:)
  func startLogEvents(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    if !self.logEventsStarted {
      let fileHandle = FileHandle(forReadingAtPath: LndUtils.logFile.path)
      
      DispatchQueue.main.async(
        execute: { [self] in
          NotificationCenter.default.addObserver(
            forName: FileHandle.readCompletionNotification,
            object: fileHandle,
            queue: OperationQueue.main,
            using:{ [self] notification in
              if self.bridge != nil {
                let data = notification.userInfo?[NSFileHandleNotificationDataItem] as? Data
                if data != nil && (data?.count ?? 0) > 0 {
                  let body = String(bytes: data!, encoding: .utf8)
                  self.sendEvent(withName: LndUtils.logEventName, body: body)
                }
                fileHandle?.readInBackgroundAndNotify()
              }
            })
          fileHandle?.seekToEndOfFile()
          fileHandle?.readInBackgroundAndNotify()
          self.logEventsStarted = true
          RCTLogInfo("log events started")
        }
      )
    }
    
    resolve("log events started")
  }
}
