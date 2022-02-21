//
//  LndMobile.swift
//  Satimoto
//
//  Created by Ross Savage on 08.09.21.
//

import Foundation
import Lndmobile

typealias LndMobileSyncMethod = (Data?, LndCallback) -> Void
typealias LndMobileRecvStreamMethod = (Data?, LndRecvStream) -> Void
typealias LndMobileBiStreamMethod = (LndRecvStream, inout NSError?) -> LndmobileSendStreamProtocol?

@objc(LndMobile)
class LndMobile: RCTEventEmitter, LndStreamEventProtocol {
  
  var activeStreams: [String:LndmobileSendStreamProtocol] = [:]
    
  static let syncMethods: [String:LndMobileSyncMethod] = [
    "AbandonChannel": { (msg: Data?, cb: LndCallback) in LndmobileAbandonChannel(msg, cb) },
    "AddInvoice": { (msg: Data?, cb: LndCallback) in LndmobileAddInvoice(msg, cb) },
    "BakeMacaroon": { (msg: Data?, cb: LndCallback) in LndmobileBakeMacaroon(msg, cb) },
    "ChangePassword": { (msg: Data?, cb: LndCallback) in LndmobileChangePassword(msg, cb) },
    "ChannelBalance": { (msg: Data?, cb: LndCallback) in LndmobileChannelBalance(msg, cb) },
    "ClosedChannels": { (msg: Data?, cb: LndCallback) in LndmobileClosedChannels(msg, cb) },
    "ConnectPeer": { (msg: Data?, cb: LndCallback) in LndmobileConnectPeer(msg, cb) },
    "DebugLevel": { (msg: Data?, cb: LndCallback) in LndmobileDebugLevel(msg, cb) },
    "DecodePayReq": { (msg: Data?, cb: LndCallback) in LndmobileDecodePayReq(msg, cb) },
    "DeleteAllPayments": { (msg: Data?, cb: LndCallback) in LndmobileDeleteAllPayments(msg, cb) },
    "DeleteMacaroonID": { (msg: Data?, cb: LndCallback) in LndmobileDeleteMacaroonID(msg, cb) },
    "DescribeGraph": { (msg: Data?, cb: LndCallback) in LndmobileDescribeGraph(msg, cb) },
    "DisconnectPeer": { (msg: Data?, cb: LndCallback) in LndmobileDisconnectPeer(msg, cb) },
    "EstimateFee": { (msg: Data?, cb: LndCallback) in LndmobileEstimateFee(msg, cb) },
    "ExportAllChannelBackups": { (msg: Data?, cb: LndCallback) in LndmobileExportAllChannelBackups(msg, cb) },
    "ExportChannelBackup": { (msg: Data?, cb: LndCallback) in LndmobileExportChannelBackup(msg, cb) },
    "FeeReport": { (msg: Data?, cb: LndCallback) in LndmobileFeeReport(msg, cb) },
    "ForwardingHistory": { (msg: Data?, cb: LndCallback) in LndmobileForwardingHistory(msg, cb) },
    "FundingStateStep": { (msg: Data?, cb: LndCallback) in LndmobileFundingStateStep(msg, cb) },
    "GenSeed": { (msg: Data?, cb: LndCallback) in LndmobileGenSeed(msg, cb) },
    "GetChanInfo": { (msg: Data?, cb: LndCallback) in LndmobileGetChanInfo(msg, cb) },
    "GetInfo": { (msg: Data?, cb: LndCallback) in LndmobileGetInfo(msg, cb) },
    "GetNetworkInfo": { (msg: Data?, cb: LndCallback) in LndmobileGetNetworkInfo(msg, cb) },
    "GetNodeInfo": { (msg: Data?, cb: LndCallback) in LndmobileGetNodeInfo(msg, cb) },
    "GetNodeMetrics": { (msg: Data?, cb: LndCallback) in LndmobileGetNodeMetrics(msg, cb) },
    "GetRecoveryInfo": { (msg: Data?, cb: LndCallback) in LndmobileGetRecoveryInfo(msg, cb) },
    "GetState": { (msg: Data?, cb: LndCallback) in LndmobileGetState(msg, cb) },
    "GetTransactions": { (msg: Data?, cb: LndCallback) in LndmobileGetTransactions(msg, cb) },
    "InitWallet": { (msg: Data?, cb: LndCallback) in LndmobileInitWallet(msg, cb) },
    "ListChannels": { (msg: Data?, cb: LndCallback) in LndmobileListChannels(msg, cb) },
    "ListInvoices": { (msg: Data?, cb: LndCallback) in LndmobileListInvoices(msg, cb) },
    "ListMacaroonIDs": { (msg: Data?, cb: LndCallback) in LndmobileListMacaroonIDs(msg, cb) },
    "ListPayments": { (msg: Data?, cb: LndCallback) in LndmobileListPayments(msg, cb) },
    "ListPeers": { (msg: Data?, cb: LndCallback) in LndmobileListPeers(msg, cb) },
    "ListPermissions": { (msg: Data?, cb: LndCallback) in LndmobileListPermissions(msg, cb) },
    "LookupInvoice": { (msg: Data?, cb: LndCallback) in LndmobileLookupInvoice(msg, cb) },
    "NewAddress": { (msg: Data?, cb: LndCallback) in LndmobileNewAddress(msg, cb) },
    "OpenChannelSync": { (msg: Data?, cb: LndCallback) in LndmobileOpenChannelSync(msg, cb) },
    "PendingChannels": { (msg: Data?, cb: LndCallback) in LndmobilePendingChannels(msg, cb) },
    "QueryRoutes": { (msg: Data?, cb: LndCallback) in LndmobileQueryRoutes(msg, cb) },
    "RestoreChannelBackups": { (msg: Data?, cb: LndCallback) in LndmobileRestoreChannelBackups(msg, cb) },
    "SendCoins": { (msg: Data?, cb: LndCallback) in LndmobileSendCoins(msg, cb) },
    "SendMany": { (msg: Data?, cb: LndCallback) in LndmobileSendMany(msg, cb) },
    "SendPaymentSync": { (msg: Data?, cb: LndCallback) in LndmobileSendPaymentSync(msg, cb) },
    "SendToRouteSync": { (msg: Data?, cb: LndCallback) in LndmobileSendToRouteSync(msg, cb) },
    "SignMessage": { (msg: Data?, cb: LndCallback) in LndmobileSignMessage(msg, cb) },
    "StopDaemon": { (msg: Data?, cb: LndCallback) in LndmobileStopDaemon(msg, cb) },
    "UnlockWallet": { (msg: Data?, cb: LndCallback) in LndmobileUnlockWallet(msg, cb) },
    "UpdateChannelPolicy": { (msg: Data?, cb: LndCallback) in LndmobileUpdateChannelPolicy(msg, cb) },
    "VerifyChanBackup": { (msg: Data?, cb: LndCallback) in LndmobileVerifyChanBackup(msg, cb) },
    "VerifyMessage": { (msg: Data?, cb: LndCallback) in LndmobileVerifyMessage(msg, cb) },
    "WalletBalance": { (msg: Data?, cb: LndCallback) in LndmobileWalletBalance(msg, cb) },
    // Autopilot RPC
    "AutopilotModifyStatus": { (msg: Data?, cb: LndCallback) in LndmobileAutopilotModifyStatus(msg, cb) },
    "AutopilotQueryScores": { (msg: Data?, cb: LndCallback) in LndmobileAutopilotQueryScores(msg, cb) },
    "AutopilotSetScores": { (msg: Data?, cb: LndCallback) in LndmobileAutopilotSetScores(msg, cb) },
    "AutopilotStatus": { (msg: Data?, cb: LndCallback) in LndmobileAutopilotStatus(msg, cb) },
    // Invoice RPC
    "InvoicesAddHoldInvoice": { (msg: Data?, cb: LndCallback) in LndmobileInvoicesAddHoldInvoice(msg, cb) },
    "InvoicesCancelInvoice": { (msg: Data?, cb: LndCallback) in LndmobileInvoicesCancelInvoice(msg, cb) },
    "InvoicesSettleInvoice": { (msg: Data?, cb: LndCallback) in LndmobileInvoicesSettleInvoice(msg, cb) },
    // Router RPC
    "RouterBuildRoute": { (msg: Data?, cb: LndCallback) in LndmobileRouterBuildRoute(msg, cb) },
    "RouterEstimateRouteFee": { (msg: Data?, cb: LndCallback) in LndmobileRouterEstimateRouteFee(msg, cb) },
    "RouterGetMissionControlConfig": { (msg: Data?, cb: LndCallback) in LndmobileRouterGetMissionControlConfig(msg, cb) },
    "RouterQueryMissionControl": { (msg: Data?, cb: LndCallback) in LndmobileRouterQueryMissionControl(msg, cb) },
    "RouterQueryProbability": { (msg: Data?, cb: LndCallback) in LndmobileRouterQueryProbability(msg, cb) },
    "RouterResetMissionControl": { (msg: Data?, cb: LndCallback) in LndmobileRouterResetMissionControl(msg, cb) },
    "RouterSendToRoute": { (msg: Data?, cb: LndCallback) in LndmobileRouterSendToRoute(msg, cb) },
    "RouterSendToRouteV2": { (msg: Data?, cb: LndCallback) in LndmobileRouterSendToRouteV2(msg, cb) },
    "RouterSetMissionControlConfig": { (msg: Data?, cb: LndCallback) in LndmobileRouterSetMissionControlConfig(msg, cb) },
    "RouterUpdateChanStatus": { (msg: Data?, cb: LndCallback) in LndmobileRouterUpdateChanStatus(msg, cb) },
    "RouterXImportMissionControl": { (msg: Data?, cb: LndCallback) in LndmobileRouterXImportMissionControl(msg, cb) },
    // Signer RPC
    "SignerComputeInputScript": { (msg: Data?, cb: LndCallback) in LndmobileSignerComputeInputScript(msg, cb) },
    "SignerDeriveSharedKey": { (msg: Data?, cb: LndCallback) in LndmobileSignerDeriveSharedKey(msg, cb) },
    "SignerSignMessage": { (msg: Data?, cb: LndCallback) in LndmobileSignerSignMessage(msg, cb) },
    "SignOutputRaw": { (msg: Data?, cb: LndCallback) in LndmobileSignerSignOutputRaw(msg, cb) },
    "SignerVerifyMessage": { (msg: Data?, cb: LndCallback) in LndmobileSignerVerifyMessage(msg, cb) },
    // Wallet RPC
    "WalletKitBumpFee": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitBumpFee(msg, cb) },
    "WalletKitDeriveKey": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitDeriveKey(msg, cb) },
    "WalletKitDeriveNextKey": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitDeriveNextKey(msg, cb) },
    "WalletKitEstimateFee": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitEstimateFee(msg, cb) },
    "WalletKitFinalizePsbt": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitFinalizePsbt(msg, cb) },
    "WalletKitFundPsbt": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitFundPsbt(msg, cb) },
    "WalletKitImportAccount": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitImportAccount(msg, cb) },
    "WalletKitImportPublicKey": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitImportPublicKey(msg, cb) },
    "WalletKitLabelTransaction": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitLabelTransaction(msg, cb) },
    "WalletKitLeaseOutput": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitLeaseOutput(msg, cb) },
    "WalletKitListAccounts": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitListAccounts(msg, cb) },
    "WalletKitListLeases": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitListLeases(msg, cb) },
    "WalletKitListSweeps": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitListSweeps(msg, cb) },
    "WalletKitListUnspent": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitListUnspent(msg, cb) },
    "WalletKitNextAddr": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitNextAddr(msg, cb) },
    "WalletKitPendingSweeps": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitPendingSweeps(msg, cb) },
    "WalletKitPublishTransaction": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitPublishTransaction(msg, cb) },
    "WalletKitReleaseOutput": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitReleaseOutput(msg, cb) },
    "WalletKitSendOutputs": { (msg: Data?, cb: LndCallback) in LndmobileWalletKitSendOutputs(msg, cb) },
]
  
  static let recvStreamMethods: [String:LndMobileRecvStreamMethod] = [
    "CloseChannel": { (msg: Data?, cb: LndRecvStream) in LndmobileCloseChannel(msg, cb) },
    "OpenChannel": { (msg: Data?, cb: LndRecvStream) in LndmobileOpenChannel(msg, cb) },
    "SubscribeChannelBackups": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribeChannelBackups(msg, cb) },
    "SubscribeChannelEvents": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribeChannelEvents(msg, cb) },
    "SubscribeChannelGraph": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribeChannelGraph(msg, cb) },
    "SubscribeInvoices": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribeInvoices(msg, cb) },
    "SubscribePeerEvents": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribePeerEvents(msg, cb) },
    "SubscribeState": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribeState(msg, cb) },
    "SubscribeTransactions": { (msg: Data?, cb: LndRecvStream) in LndmobileSubscribeTransactions(msg, cb) },
    // Chain RPC
    "ChainNotifierRegisterBlockEpochNtfn": { (msg: Data?, cb: LndRecvStream) in LndmobileChainNotifierRegisterBlockEpochNtfn(msg, cb) },
    "ChainNotifierRegisterConfirmationsNtfn": { (msg: Data?, cb: LndRecvStream) in LndmobileChainNotifierRegisterConfirmationsNtfn(msg, cb) },
    "ChainNotifierRegisterSpendNtfn": { (msg: Data?, cb: LndRecvStream) in LndmobileChainNotifierRegisterSpendNtfn(msg, cb) },
    // Invoice RPC
    "InvoicesSubscribeSingleInvoice": { (msg: Data?, cb: LndRecvStream) in LndmobileInvoicesSubscribeSingleInvoice(msg, cb) },
    // Router RPC
    "RouterSendPayment": { (msg: Data?, cb: LndRecvStream) in LndmobileRouterSendPayment(msg, cb) },
    "RouterSendPaymentV2": { (msg: Data?, cb: LndRecvStream) in LndmobileRouterSendPaymentV2(msg, cb) },
    "RouterSubscribeHtlcEvents": { (msg: Data?, cb: LndRecvStream) in LndmobileRouterSubscribeHtlcEvents(msg, cb) },
    "RouterTrackPayment": { (msg: Data?, cb: LndRecvStream) in LndmobileRouterTrackPayment(msg, cb) },
    "RouterTrackPaymentV2": { (msg: Data?, cb: LndRecvStream) in LndmobileRouterTrackPaymentV2(msg, cb) },
  ]
  
  static let biStreamMethods: [String:LndMobileBiStreamMethod] = [
    "ChannelAcceptor": { (cb: LndRecvStream, err: inout NSError?) in return LndmobileChannelAcceptor(cb, &err) },
    "SendPayment": { (cb: LndRecvStream, err: inout NSError?) in return LndmobileSendPayment(cb, &err) },
    "SendToRoute": { (cb: LndRecvStream, err: inout NSError?) in return LndmobileSendToRoute(cb, &err) },
    // Router RPC
    "RouterHtlcInterceptor": { (cb: LndRecvStream, err: inout NSError?) in return LndmobileRouterHtlcInterceptor(cb, &err) },
]
  
  @objc
  override static func moduleName() -> String! {
    "LndMobile"
  }
  
  override func supportedEvents() -> [String]! {
    return [LndRecvStream.streamEventName]
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  func onStreamClose(streamId: String) {
    RCTLog("stream closed: \(streamId)")
    self.activeStreams.removeValue(forKey: streamId)
  }
  
  @objc(start:rejecter:)
  func start(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let args = "--lnddir=\"\(LndUtils.lndDirectory.path)\""

    if !FileManager.default.fileExists(atPath: LndUtils.confFile.path) {
      do {
        let lndUtils = LndUtils()
        try lndUtils.writeDefaultConf()
      } catch let err {
        RCTLogError("error writing conf: \(err.localizedDescription)")
        reject("error", err.localizedDescription, err)
        return
      }
    }

    LndmobileStart(args, StartLndCallback(resolver: resolve, rejecter: reject))
  }
  
  @objc(initWallet:password:recoveryWindow:resolver:rejecter:)
  func initWallet(_ seed: [String], password: String, recoveryWindow: Int32, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      var initWallet = Lnrpc_InitWalletRequest()
      initWallet.cipherSeedMnemonic = seed
      
      if password.count < 8 {
        RCTLogError("password too short: \(password.replacingOccurrences(of: ".", with: "*", options: .regularExpression))")
        reject("error", "password too short", NSError())
      }
        
      initWallet.walletPassword = password.data(using: .utf8)!
      
      if recoveryWindow != 0 {
        initWallet.recoveryWindow = recoveryWindow
      }
      
      let msg = try initWallet.serializedData()
      LndmobileInitWallet(msg, LndCallback(resolver: resolve, rejecter: reject))
    } catch let err {
      RCTLogError("got initWallet error: \(err.localizedDescription)")
      reject("error", err.localizedDescription, err)
    }
  }
  
  @objc(unlockWallet:resolver:rejecter:)
  func unlockWallet(_ password: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      var unlockWallet = Lnrpc_UnlockWalletRequest()
      unlockWallet.walletPassword = password.data(using: .utf8)!
      
      let msg = try unlockWallet.serializedData()
      LndmobileUnlockWallet(msg, LndCallback(resolver: resolve, rejecter: reject))
    } catch let err {
      RCTLogError("got unlockWallet error: \(err.localizedDescription)")
      reject("error", err.localizedDescription, err)
    }
  }
  
  @objc(stop:rejecter:)
  func stop(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    do {
      let stopRequest = Lnrpc_StopRequest()
      let msg = try stopRequest.serializedData()
      
      LndmobileStopDaemon(msg, LndCallback(resolver: resolve, rejecter: reject))
    } catch let err {
      RCTLogError("got stop error: \(err.localizedDescription)")
      reject("error", err.localizedDescription, err)
    }
  }
  
  @objc(sendCommand:body:resolver:rejecter:)
  func sendCommand(_ method: String, body msg: String, resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    let block = LndMobile.syncMethods[method]
    
    if block == nil {
      RCTLogError("method \(method) not found")
      return
    }
    
    let bytes = Data(base64Encoded: msg, options: [])
    block?(bytes, LndCallback(resolver: resolve, rejecter: reject))
  }
  
  @objc(sendStreamCommand:streamId:body:)
  func sendStreamCommand(_ method: String, streamId: String, body msg: String) {
    let recvStream = LndRecvStream(streamId: streamId, emitter: self, callback: self)
    let bytes = Data(base64Encoded: msg, options: [])
    let recvStreamBlock = LndMobile.recvStreamMethods[method]
    
    if recvStreamBlock != nil {
      recvStreamBlock!(bytes, recvStream)
      return
    }
    
    let biStreamBlock = LndMobile.biStreamMethods[method]
    if biStreamBlock != nil {
      var err: NSError?
      let sendStream = biStreamBlock?(recvStream, &err)
      
      if (err != nil) {
        let errStr = err?.localizedDescription ?? "unknown"
        RCTLogError("got init error: \(errStr)")
        return
      }
      
      if (sendStream == nil) {
        RCTLogError("no send stream for method \(method)")
        return
      }
      
      self.activeStreams[streamId] = sendStream;
      do {
        try sendStream?.send(bytes)
      } catch let err {
        RCTLogError("got send error: \(err.localizedDescription)")
      }
      return
    }
    
    RCTLogError("stream method \(method) not found")
    return
  }
  
  @objc(sendStreamWrite:body:)
  func sendStreamWrite(_ streamId: String, body msg: String) {
    let sendStream = self.activeStreams[streamId]
    
    if(sendStream == nil) {
      RCTLogError("stream \(streamId) not found")
      return
    }
    
    let bytes = Data(base64Encoded: msg, options: [])
    
    do {
      try sendStream?.send(bytes)
    } catch let err {
      RCTLogError("got send error: \(err.localizedDescription)")
    }
  }
}
