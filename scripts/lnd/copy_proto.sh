#!/bin/sh
REACT_MOBILE_DIR=$(pwd)

cd $GOPATH/src/github.com/lightningnetwork/lnd

cp lnrpc/*.proto ${REACT_MOBILE_DIR}/proto
cp lnrpc/autopilotrpc/*.proto ${REACT_MOBILE_DIR}/proto/autopilotrpc
cp lnrpc/chainrpc/*.proto ${REACT_MOBILE_DIR}/proto/chainrpc
cp lnrpc/devrpc/*.proto ${REACT_MOBILE_DIR}/proto/devrpc
cp lnrpc/invoicesrpc/*.proto ${REACT_MOBILE_DIR}/proto/invoicesrpc
cp lnrpc/lnclipb/*.proto ${REACT_MOBILE_DIR}/proto/lnclipb
cp lnrpc/neutrinorpc/*.proto ${REACT_MOBILE_DIR}/proto/neutrinorpc
cp lnrpc/peersrpc/*.proto ${REACT_MOBILE_DIR}/proto/peersrpc
cp lnrpc/routerrpc/*.proto ${REACT_MOBILE_DIR}/proto/routerrpc
cp lnrpc/signrpc/*.proto ${REACT_MOBILE_DIR}/proto/signrpc
cp lnrpc/verrpc/*.proto ${REACT_MOBILE_DIR}/proto/verrpc
cp lnrpc/walletrpc/*.proto ${REACT_MOBILE_DIR}/proto/walletrpc
cp lnrpc/watchtowerrpc/*.proto ${REACT_MOBILE_DIR}/proto/watchtowerrpc
cp lnrpc/wtclientrpc/*.proto ${REACT_MOBILE_DIR}/proto/wtclientrpc
