package com.satimoto;

import android.util.Base64;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;

public class StartLndCallback extends LndCallback {
    StartLndCallback(Promise promise) {
        super(promise);
    }

    @Override
    public void onError(Exception e) {
        if (e.getLocalizedMessage().contains("lnd already started")) {
            WritableMap params = Arguments.createMap();
            params.putString("data", null);
            promise.resolve(Arguments.createMap());
        } else {
            promise.reject("error", e);
        }
    }
}
