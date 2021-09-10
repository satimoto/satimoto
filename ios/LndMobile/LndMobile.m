#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(LndMobile, NSObject)

RCT_EXTERN_METHOD(
  sendCommand: (NSString*)method
  body: (NSString*)msg
  resolver: (RCTPromiseResolveBlock)resolve
  rejecter: (RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  sendStreamCommand:(NSString*)method
  streamId:(NSString*)streamId
  body:(NSString*)msg
)

RCT_EXTERN_METHOD(
  sendStreamWrite:(NSString*)streamId
  body:(NSString*)msg
)

@end
