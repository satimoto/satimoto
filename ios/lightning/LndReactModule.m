//
//  LndReactModule.m
//  lightning
//
//  Created by Johan Torås Halseth on 05/11/2018.
//

#import "LndReactModule.h"
#import <React/RCTLog.h>
#import <React/RCTConvert.h>
#import <Lndmobile/Lndmobile.h>

static NSString* const streamEventName = @"streamEvent";
static NSString* const streamIdKey = @"streamId";
static NSString* const respB64DataKey = @"data";
static NSString* const respErrorKey = @"error";
static NSString* const respEventTypeKey = @"event";
static NSString* const respEventTypeData = @"data";
static NSString* const respEventTypeError = @"error";
static NSString* const logEventName = @"logs";

@interface NativeCallback:NSObject<LndmobileCallback>
@property (nonatomic) RCTPromiseResolveBlock resolve;
@property (nonatomic) RCTPromiseRejectBlock reject;

@end

@implementation NativeCallback

- (instancetype)initWithResolver: (RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject
{
  self = [super init];
  if (self) {
    self.resolve = resolve;
    self.reject = reject;
  }
  return self;
}

- (void)onError:(NSError *)p0 {
  self.reject(@"error", [p0 localizedDescription], p0);
}

- (void)onResponse:(NSData *)p0 {
  NSString* b64 = [p0 base64EncodedStringWithOptions:0];
  if (b64 == nil) {
    b64 = @"";
  }
  self.resolve(@{respB64DataKey: b64});
}

@end

@interface RecvStream:NSObject<LndmobileRecvStream>
@property (nonatomic) NSString* streamId;
@property (nonatomic) RCTEventEmitter* eventEmitter;

@end

@implementation RecvStream

- (instancetype)initWithStreamId: (NSString*)streamId emitter: (RCTEventEmitter*)e
{
  self = [super init];
  if (self) {
    self.streamId = streamId;
    self.eventEmitter = e;
  }
  return self;
}

- (void)onError:(NSError *)p0 {
  [self.eventEmitter sendEventWithName:streamEventName
                                  body:@{
                                    streamIdKey: self.streamId,
                                    respEventTypeKey: respEventTypeError,
                                    respErrorKey: [p0 localizedDescription],
                                  }
   ];
}

- (void)onResponse:(NSData *)p0 {
  NSString* b64 = [p0 base64EncodedStringWithOptions:0];
  if (b64 == nil) {
    b64 = @"";
  }
  [self.eventEmitter sendEventWithName:streamEventName
                                  body:@{
                                    streamIdKey: self.streamId,
                                    respEventTypeKey: respEventTypeData,
                                    respB64DataKey: b64,
                                  }
   ];
}

@end

@implementation LndReactModule

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[streamEventName, logEventName];
}


typedef void (^SyncHandler)(NSData*, NativeCallback*);
typedef void (^RecvStreamHandler)(NSData* req, RecvStream* respStream);
typedef id<LndmobileSendStream> (^BiStreamHandler)(NSData* req, RecvStream* respStream, NSError** err);

RCT_EXPORT_METHOD(start: (RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Avoid crash on socket close.
  signal(SIGPIPE, SIG_IGN);
  
  self.syncMethods = @{
    @"AbandonChannel" : ^(NSData* bytes, NativeCallback* cb) { LndmobileAbandonChannel(bytes, cb); },
    @"AddInvoice" : ^(NSData* bytes, NativeCallback* cb) { LndmobileAddInvoice(bytes, cb); },
    @"AutopilotModifyStatus" : ^(NSData* bytes, NativeCallback* cb) { LndmobileAutopilotModifyStatus(bytes, cb); },
    @"AutopilotQueryScores" : ^(NSData* bytes, NativeCallback* cb) { LndmobileAutopilotQueryScores(bytes, cb); },
    @"AutopilotSetScores" : ^(NSData* bytes, NativeCallback* cb) { LndmobileAutopilotSetScores(bytes, cb); },
    @"AutopilotStatus" : ^(NSData* bytes, NativeCallback* cb) { LndmobileAutopilotStatus(bytes, cb); },
    @"BakeMacaroon" : ^(NSData* bytes, NativeCallback* cb) { LndmobileBakeMacaroon(bytes, cb); },
    @"ChangePassword" : ^(NSData* bytes, NativeCallback* cb) { LndmobileChangePassword(bytes, cb); },
    @"ChannelBalance" : ^(NSData* bytes, NativeCallback* cb) { LndmobileChannelBalance(bytes, cb); },
    @"ClosedChannels" : ^(NSData* bytes, NativeCallback* cb) { LndmobileClosedChannels(bytes, cb); },
    @"ConnectPeer" : ^(NSData* bytes, NativeCallback* cb) { LndmobileConnectPeer(bytes, cb); },
    @"DebugLevel" : ^(NSData* bytes, NativeCallback* cb) { LndmobileDebugLevel(bytes, cb); },
    @"DecodePayReq" : ^(NSData* bytes, NativeCallback* cb) { LndmobileDecodePayReq(bytes, cb); },
    @"DeleteAllPayments" : ^(NSData* bytes, NativeCallback* cb) { LndmobileDeleteAllPayments(bytes, cb); },
    @"DeleteMacaroonID" : ^(NSData* bytes, NativeCallback* cb) { LndmobileDeleteMacaroonID(bytes, cb); },
    @"DescribeGraph" : ^(NSData* bytes, NativeCallback* cb) { LndmobileDescribeGraph(bytes, cb); },
    @"DisconnectPeer" : ^(NSData* bytes, NativeCallback* cb) { LndmobileDisconnectPeer(bytes, cb); },
    @"EstimateFee" : ^(NSData* bytes, NativeCallback* cb) { LndmobileEstimateFee(bytes, cb); },
    @"ExportAllChannelBackups" : ^(NSData* bytes, NativeCallback* cb) { LndmobileExportAllChannelBackups(bytes, cb); },
    @"ExportChannelBackup" : ^(NSData* bytes, NativeCallback* cb) { LndmobileExportChannelBackup(bytes, cb); },
    @"FeeReport" : ^(NSData* bytes, NativeCallback* cb) { LndmobileFeeReport(bytes, cb); },
    @"ForwardingHistory" : ^(NSData* bytes, NativeCallback* cb) { LndmobileForwardingHistory(bytes, cb); },
    @"FundingStateStep" : ^(NSData* bytes, NativeCallback* cb) { LndmobileFundingStateStep(bytes, cb); },
    @"GenSeed" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGenSeed(bytes, cb); },
    @"GetChanInfo" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetChanInfo(bytes, cb); },
    @"GetInfo" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetInfo(bytes, cb); },
    @"GetNetworkInfo" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetNetworkInfo(bytes, cb); },
    @"GetNodeInfo" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetNodeInfo(bytes, cb); },
    @"GetNodeMetrics" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetNodeMetrics(bytes, cb); },
    @"GetRecoveryInfo" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetRecoveryInfo(bytes, cb); },
    @"GetState" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetState(bytes, cb); },
    @"GetTransactions" : ^(NSData* bytes, NativeCallback* cb) { LndmobileGetTransactions(bytes, cb); },
    @"InitWallet" : ^(NSData* bytes, NativeCallback* cb) { LndmobileInitWallet(bytes, cb); },
    @"ListChannels" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListChannels(bytes, cb); },
    @"ListInvoices" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListInvoices(bytes, cb); },
    @"ListMacaroonIDs" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListMacaroonIDs(bytes, cb); },
    @"ListPayments" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListPayments(bytes, cb); },
    @"ListPeers" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListPeers(bytes, cb); },
    @"ListPermissions" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListPermissions(bytes, cb); },
    @"ListUnspent" : ^(NSData* bytes, NativeCallback* cb) { LndmobileListUnspent(bytes, cb); },
    @"LookupInvoice" : ^(NSData* bytes, NativeCallback* cb) { LndmobileLookupInvoice(bytes, cb); },
    @"NewAddress" : ^(NSData* bytes, NativeCallback* cb) { LndmobileNewAddress(bytes, cb); },
    @"OpenChannelSync" : ^(NSData* bytes, NativeCallback* cb) { LndmobileOpenChannelSync(bytes, cb); },
    @"PendingChannels" : ^(NSData* bytes, NativeCallback* cb) { LndmobilePendingChannels(bytes, cb); },
    @"QueryRoutes" : ^(NSData* bytes, NativeCallback* cb) { LndmobileQueryRoutes(bytes, cb); },
    @"RecreateListeners" : ^(void) { LndmobileRecreateListeners(); },
    @"RestoreChannelBackups" : ^(NSData* bytes, NativeCallback* cb) { LndmobileRestoreChannelBackups(bytes, cb); },
    @"SendCoins" : ^(NSData* bytes, NativeCallback* cb) { LndmobileSendCoins(bytes, cb); },
    @"SendMany" : ^(NSData* bytes, NativeCallback* cb) { LndmobileSendMany(bytes, cb); },
    @"SendPaymentSync" : ^(NSData* bytes, NativeCallback* cb) { LndmobileSendPaymentSync(bytes, cb); },
    @"SendToRouteSync" : ^(NSData* bytes, NativeCallback* cb) { LndmobileSendToRouteSync(bytes, cb); },
    @"SignMessage" : ^(NSData* bytes, NativeCallback* cb) { LndmobileSignMessage(bytes, cb); },
    @"Start" : ^(NSString* args, NativeCallback* cb) { LndmobileStart(args, cb); },
    @"StopDaemon" : ^(NSData* bytes, NativeCallback* cb) { LndmobileStopDaemon(bytes, cb); },
    @"UnlockWallet" : ^(NSData* bytes, NativeCallback* cb) { LndmobileUnlockWallet(bytes, cb); },
    @"UpdateChannelPolicy" : ^(NSData* bytes, NativeCallback* cb) { LndmobileUpdateChannelPolicy(bytes, cb); },
    @"VerifyChanBackup" : ^(NSData* bytes, NativeCallback* cb) { LndmobileVerifyChanBackup(bytes, cb); },
    @"VerifyMessage" : ^(NSData* bytes, NativeCallback* cb) { LndmobileVerifyMessage(bytes, cb); },
    @"WalletBalance" : ^(NSData* bytes, NativeCallback* cb) { LndmobileWalletBalance(bytes, cb); },
  };
  
  self.recvStreamMethods = @{
    @"CloseChannel" : ^(NSData* req, RecvStream* cb) { return LndmobileCloseChannel(req, cb); },
    @"OpenChannel" : ^(NSData* req, RecvStream* cb) { return LndmobileOpenChannel(req, cb); },
    @"SubscribeChannelBackups" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribeChannelBackups(req, cb); },
    @"SubscribeChannelEvents" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribeChannelEvents(req, cb); },
    @"SubscribeChannelGraph" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribeChannelGraph(req, cb); },
    @"SubscribeInvoices" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribeInvoices(req, cb); },
    @"SubscribePeerEvents" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribePeerEvents(req, cb); },
    @"SubscribeState" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribeState(req, cb); },
    @"SubscribeTransactions" : ^(NSData* req, RecvStream* cb) { return LndmobileSubscribeTransactions(req, cb); },
  };
  
  self.biStreamMethods = @{
    @"ChannelAcceptor" : (id<LndmobileSendStream>)^(NSData* req, RecvStream* cb, NSError** err) { return LndmobileChannelAcceptor(cb, err); },
    @"SendPayment" : (id<LndmobileSendStream>)^(NSData* req, RecvStream* cb, NSError** err) { return LndmobileSendPayment(cb, err); },
    @"SendToRoute" : (id<LndmobileSendStream>)^(NSData* req, RecvStream* cb, NSError** err) { return LndmobileSendToRoute(cb, err); },
  };
  
  self.activeStreams = [NSMutableDictionary dictionary];
  
  NSFileManager *fileMgr = [NSFileManager defaultManager];
  NSURL *dir = [[fileMgr URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
  
  self.appDir = dir.path;
  RCTLogInfo(@"lnd dir: %@", self.appDir);
  
  NSString *lndConf = [[NSBundle mainBundle] pathForResource:@"lnd" ofType:@"conf"];
  NSString *confTarget = [self.appDir stringByAppendingString:@"/lnd.conf"];
  
  [fileMgr removeItemAtPath:confTarget error:nil];
  [fileMgr copyItemAtPath:lndConf toPath: confTarget error:nil];
  
  NSString *logFile = [self.appDir stringByAppendingString:@"/logs/bitcoin/testnet/lnd.log"];
  NSFileHandle *fileHandle = [NSFileHandle fileHandleForReadingAtPath:logFile];
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [[NSNotificationCenter defaultCenter] addObserverForName:NSFileHandleReadCompletionNotification
                                                      object:fileHandle
                                                       queue:[NSOperationQueue mainQueue]
                                                  usingBlock:^(NSNotification *n) {
      NSData *data = [n.userInfo objectForKey:NSFileHandleNotificationDataItem];
      if (data != nil && [data length] > 0) {
        NSString *s = [[NSString alloc]initWithBytes:[data bytes] length:[data length] encoding:NSUTF8StringEncoding];
        if (s != nil) {
          [self sendEventWithName:logEventName body:s];
        }
      }
      [fileHandle readInBackgroundAndNotify];
    }];
    [fileHandle seekToEndOfFile];
    [fileHandle readInBackgroundAndNotify];
  });
  
  NSString *args = [NSString stringWithFormat:@"--lnddir=%@", self.appDir];
  
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^(void){
    RCTLogInfo(@"Starting lnd");
    NativeCallback* cb = [[NativeCallback alloc] initWithResolver:resolve rejecter:reject];
    LndmobileStart(args, cb);
  });
  
}

RCT_EXPORT_METHOD(sendCommand:(NSString*)method body:(NSString*)msg
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  SyncHandler block = [self.syncMethods objectForKey:method];
  if (block == nil) {
    RCTLogError(@"method %@ not found", method);
    return;
  }
  
  NSData* bytes = [[NSData alloc]initWithBase64EncodedString:msg options:0];
  block(bytes, [[NativeCallback alloc] initWithResolver:resolve rejecter:reject]);
}

RCT_EXPORT_METHOD(sendStreamCommand:(NSString*)method streamId:(NSString*)streamId body:(NSString*)msg)
{
  RecvStream* respStream = [[RecvStream alloc] initWithStreamId:streamId emitter:self];
  NSData* bytes = [[NSData alloc]initWithBase64EncodedString:msg options:0];
  
  // Check if the method is among the receive-only stream methods.
  RecvStreamHandler recvStr = self.recvStreamMethods[method];
  if (recvStr != nil) {
    recvStr(bytes, respStream);
    return;
  }
  
  // Otherwise check whether this method has a bidirectional stream.
  BiStreamHandler biStr = self.biStreamMethods[method];
  if (biStr != nil) {
    NSError *err = nil;
    id<LndmobileSendStream> sendStream = biStr(bytes, respStream, &err);
    if (err != nil) {
      RCTLogError(@"got init error %@", err);
      return;
    }
    
    // This method must have a non-nil send stream.
    if (sendStream == nil) {
      RCTLogError(@"Got nil send stream for method %@", method);
      return;
    }
    
    // TODO: clean up on stream close.
    self.activeStreams[streamId] = sendStream;
    return;
  }
  
  RCTLogError(@"Stream method %@ not found", method);
  return;
}

RCT_EXPORT_METHOD(sendStreamWrite:(NSString*)streamId body:(NSString*)msg)
{
  // TODO: clean up on stream close.
  id<LndmobileSendStream> sendStream = self.activeStreams[streamId];
  if (sendStream == nil) {
    RCTLogError(@"StreamId %@ not found", streamId);
    return;
  }
  
  NSData* bytes = [[NSData alloc]initWithBase64EncodedString:msg options:0];
  
  NSError* err = nil;
  [sendStream send:bytes error:&err];
  if (err != nil) {
    NSLog(@"send stream error %@", err);
    return;
  }
}

@end

