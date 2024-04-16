#import "AppDelegate.h"
#import "RNBootSplash.h"
#import "RNFBMessagingModule.h"

#import <Firebase.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

#import <TSBackgroundFetch/TSBackgroundFetch.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"Satimoto";
  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};
  
  NSString *firebaseConfig;
  #if RELEASE
  firebaseConfig = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info" ofType:@"plist"];
  #else
  firebaseConfig = [[NSBundle mainBundle] pathForResource:@"GoogleService-Info-Debug" ofType:@"plist"];
  #endif

  if (firebaseConfig != nil) {
      FIROptions *options = [[FIROptions alloc] initWithContentsOfFile:firebaseConfig];
      if (options != nil) {
          [FIRApp configureWithOptions:options];
      }
  }
  
  if ([FIRApp defaultApp] == nil) {
    [FIRApp configure];
  }
  
  [[TSBackgroundFetch sharedInstance] didFinishLaunching];
  
  return [super application:application didFinishLaunchingWithOptions:launchOptions];
}

- (void)applicationDidEnterBackground:(UIApplication *)application{
  NSLog(@"BackgroundTaskIdentifier begin");
  __block UIBackgroundTaskIdentifier taskId = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
    NSLog(@"BackgroundTaskIdentifier expire");
    [[UIApplication sharedApplication] endBackgroundTask:taskId];
  }];
}

- (void)applicationWillTerminate:(UIApplication *)application{
  NSLog(@"BackgroundTaskIdentifier begin");
  __block UIBackgroundTaskIdentifier taskId = [[UIApplication sharedApplication] beginBackgroundTaskWithExpirationHandler:^{
    NSLog(@"BackgroundTaskIdentifier expire");
    [[UIApplication sharedApplication] endBackgroundTask:taskId];
  }];
}

- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

/// This method controls whether the `concurrentRoot`feature of React18 is turned on or off.
///
/// @see: https://reactjs.org/blog/2022/03/29/react-v18.html
/// @note: This requires to be rendering on Fabric (i.e. on the New Architecture).
/// @return: `true` if the `concurrentRoot` feature is enabled. Otherwise, it returns `false`.
- (BOOL)concurrentRootEnabled
{
  return true;
}

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps {
  UIView *rootView = [super createRootViewWithBridge:bridge moduleName:moduleName initProps:initProps];
  [RNBootSplash initWithStoryboard:@"LaunchScreen" rootView:rootView]; 
  return rootView;
}

@end
