//
//  LndMobileResponse.swift
//  Satimoto
//
//  Created by Ross Savage on 08.09.21.
//

import Foundation
import Lndmobile

protocol LndStreamEventProtocol {
  func onStreamClose(streamId: String)
}

class LndCallback: NSObject, LndmobileCallbackProtocol {
  var resolve: RCTPromiseResolveBlock
  var reject: RCTPromiseRejectBlock
  
  init(resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.resolve = resolve
    self.reject = reject
  }
  
  func onError(_ p0: Error?) {
    self.reject("error", p0?.localizedDescription, p0)
  }
  
  func onResponse(_ p0: Data?) {
    let base64Data = p0?.base64EncodedString(options: []) ?? ""
    self.resolve(["data": base64Data])
  }
}

class StartLndCallback: LndCallback {
  override func onError(_ p0: Error?) {
    if ((p0?.localizedDescription.contains("lnd already started")) != nil) {
      self.resolve("lnd already started")
    } else {
      self.reject("error", p0?.localizedDescription, p0)
    }
  }
  
  override func onResponse(_ p0: Data?) {
    let base64Data = p0?.base64EncodedString(options: []) ?? ""
    self.resolve(base64Data)
  }
}

class LndRecvStream: NSObject, LndmobileRecvStreamProtocol {
  var streamId: String
  var eventEmitter: RCTEventEmitter
  var callback: LndStreamEventProtocol
  
  static let streamEventName: String = "streamEvent";
  
  init(streamId: String, emitter eventEmitter: RCTEventEmitter, callback: LndStreamEventProtocol) {
    self.streamId = streamId
    self.eventEmitter = eventEmitter
    self.callback = callback
  }
  
  func onError(_ p0: Error?) {
    let error = p0 != nil ? p0!.localizedDescription : "EOF"
    let type = error.contains("EOF") || error.contains("shutting down") ? "end" : "error"
    self.eventEmitter.sendEvent(withName: LndRecvStream.streamEventName,
                                body: [
                                  "streamId": self.streamId,
                                  "type": type,
                                  "error": error,
                                ])
    self.callback.onStreamClose(streamId: self.streamId)
  }
  
  func onResponse(_ p0: Data?) {
    let base64Data = p0?.base64EncodedString(options: []) ?? ""
    self.eventEmitter.sendEvent(withName: LndRecvStream.streamEventName,
                                body: [
                                  "streamId": self.streamId,
                                  "type": "data",
                                  "data": base64Data
                                ])
  }
}
