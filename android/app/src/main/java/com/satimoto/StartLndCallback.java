package com.satimoto;

import android.util.Base64;

import com.facebook.react.bridge.Promise;

public class StartLndCallback extends LndCallback {
    StartLndCallback(Promise promise) {
        super(promise);
    }

    @Override
    public void onError(Exception e) {
        if (e.getLocalizedMessage().contains("already started")) {
            promise.resolve("lnd already started");
        } else {
            promise.reject("error", e);
        }
    }

    @Override
    public void onResponse(byte[] bytes) {
        String base64Data = "";
        if (bytes != null && bytes.length > 0) {
            base64Data = Base64.encodeToString(bytes, Base64.NO_WRAP);
        }

        promise.resolve(base64Data);
    }
}
