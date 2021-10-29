package com.satimoto;

import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;

import lndmobile.RecvStream;

public class LndRecvStream implements RecvStream {
    String streamId;
    RCTDeviceEventEmitter emitter;

    private static final String streamEventName = "streamEvent";

    LndRecvStream(String id, RCTDeviceEventEmitter emitter) {
        this.streamId = id;
        this.emitter = emitter;
    }

    @Override
    public void onError(Exception e) {
        String type = e.getLocalizedMessage().contains("EOF") ? "end" : "error";
        WritableMap params = Arguments.createMap();
        params.putString("streamId", streamId);
        params.putString("type", type);
        params.putString("error", e.getLocalizedMessage());
        emitter.emit(LndRecvStream.streamEventName, params);
    }

    @Override
    public void onResponse(byte[] bytes) {
        String base64Data = "";
        if (bytes != null && bytes.length > 0) {
            base64Data = Base64.encodeToString(bytes, Base64.NO_WRAP);
        }

        WritableMap params = Arguments.createMap();
        params.putString("streamId", streamId);
        params.putString("type", "data");
        params.putString("data", base64Data);
        emitter.emit(LndRecvStream.streamEventName, params);
    }
}