# Satimoto
Satimoto mobile application using react native


## Build Requirements

_Required for iOS_
* Xcode
* cocoapods 1.7.2 (`brew install cocoapods`)

_Required for Android_
* Java OpenJDK 11 
* [Android Studio](https://developer.android.com/studio)
* [Android NDK](https://developer.android.com/ndk/guides)


## Building LND mobile binaries
Before running the app, the mobile binaries need to be built for LND so GRPC calls can be made during runtime.

Switch go module aware build mode to auto
```bash
go env -w GO111MODULE=auto
```
Install protobuf
```bash
brew install protobuf
```
Go get gomobile prerequisites 
```bash
go get golang.org/x/tools/go/packages
go get golang.org/x/tools/cmd/goimports
go get golang.org/x/mobile/cmd/gomobile
```
Initialize gomobile
```bash
gomobile init
```
Go get protoc modules and falafel
```bash
GO111MODULE=on go get github.com/golang/protobuf/protoc-gen-go@v1.3.2
GO111MODULE=on go get github.com/grpc-ecosystem/grpc-gateway/protoc-gen-grpc-gateway@v1.14.3
GO111MODULE=on go get github.com/grpc-ecosystem/grpc-gateway/protoc-gen-swagger@v1.14.3
GO111MODULE=on go get -u -v github.com/lightninglabs/falafel
```
Go get LND
```bash
go get -d github.com/lightningnetwork/lnd
cd $GOPATH/src/github.com/lightningnetwork/lnd
```
Change lnd remote
```bash
git remote add satimoto https://github.com/satimoto/lnd
git fetch satimoto
```
Checkout branch to build (Reset staged/unstaged changes if you need to)
```bash
git reset --hard HEAD
git checkout -b v0-15-0-beta-rc6 satimoto/v0-15-0-beta-rc6
```
Build for iOS platform (`Lndmobile.xcframework`)
```bash
make ios prefix="1" tags="chainrpc invoicesrpc routerrpc signrpc walletrpc"
cp -r $GOPATH/src/github.com/lightningnetwork/lnd/mobile/build/ios/Lndmobile.xcframework <path/to>/react-mobile/ios/LndMobile
```
Build for android platform (`Lndmobile.aar`)
```bash
make android prefix="1" tags="chainrpc invoicesrpc routerrpc signrpc walletrpc"
cp $GOPATH/src/github.com/lightningnetwork/lnd/mobile/build/android/Lndmobile.aar <path/to>/react-mobile/android/Lndmobile
```
