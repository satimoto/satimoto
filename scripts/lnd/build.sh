#!/bin/sh
REACT_MOBILE_DIR=$(pwd)

cd $GOPATH/src/github.com/lightningnetwork/lnd

make mobile prefix="1" tags="chainrpc invoicesrpc routerrpc signrpc walletrpc"
cp -r $GOPATH/src/github.com/lightningnetwork/lnd/mobile/build/ios/Lndmobile.xcframework ${REACT_MOBILE_DIR}/ios/LndMobile
cp $GOPATH/src/github.com/lightningnetwork/lnd/mobile/build/android/Lndmobile.aar ${REACT_MOBILE_DIR}/android/Lndmobile
