package com.satimoto;

import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;

import lndmobile.Callback;

public class LndCallback implements Callback {
    Promise promise;

    LndCallback(Promise promise) {
        this.promise = promise;
    }

    @Override
    public void onError(Exception e) {
        promise.reject("error", e);
    }

    @Override
    public void onResponse(byte[] bytes) {
        String base64Data = "";
        if (bytes != null && bytes.length > 0) {
            base64Data = Base64.encodeToString(bytes, Base64.NO_WRAP);
        }

        WritableMap params = Arguments.createMap();
        params.putString("data", base64Data);
        promise.resolve(params);
    }
}
