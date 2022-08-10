package com.satimoto;

import android.util.Base64;
import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter;
import com.google.protobuf.ByteString;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import lndmobile.Lndmobile;
import lndmobile.SendStream;

public class LndMobile extends ReactContextBaseJavaModule {

    private final String TAG = "LndMobile";

    private Map<String, SendStream> activeStreams = new HashMap<>();
    private Map<String, Method> syncMethods = new HashMap<>();
    private Map<String, Method> streamMethods = new HashMap<>();

    private static boolean isReceiveStream(Method m) {
        return m.toString().contains("RecvStream");
    }

    private static boolean isSendStream(Method m) {
        return m.toString().contains("SendStream");
    }

    private static boolean isStream(Method m) {
        return isReceiveStream(m) || isSendStream(m);
    }

    public LndMobile(ReactApplicationContext reactContext) {
        super(reactContext);

        Method[] methods = Lndmobile.class.getDeclaredMethods();
        for (Method m : methods) {
            String name = m.getName();
            name = name.substring(0, 1).toUpperCase() + name.substring(1);
            if (isStream(m)) {
                streamMethods.put(name, m);
            } else {
                syncMethods.put(name, m);
            }
        }
    }

    @Override
    public String getName() {
        return TAG;
    }

    @Override
    public Map<String, Object> getConstants() {
        final Map<String, Object> constants = new HashMap<>();
        return constants;
    }

    @ReactMethod
    public void addListener(String eventName) {}

    @ReactMethod
    public void removeListeners(Integer count) {}

    @ReactMethod
    public void start(final Promise promise) {
        LndUtils lndUtils = new LndUtils(getReactApplicationContext());
        File confPath = new File(lndUtils.confPath);

        if (!confPath.exists()) {
            try {
                lndUtils.writeDefaultConf();
            } catch (Exception e) {
                Log.e(TAG, "Could not write to " + lndUtils.confPath, e);
                promise.reject("Could not write to : " + lndUtils.confPath, e);
            }
        }

        String args = "--lnddir=" + lndUtils.lndPath + " --configfile=" + lndUtils.confPath;
        Log.i(TAG, "Starting LND with args " + args);
        Runnable startLnd = () -> Lndmobile.start(args, new StartLndCallback(promise));
        new Thread(startLnd).start();
    }

    @ReactMethod
    public void initWallet(ReadableArray seed, String password, Integer recoveryWindow, final Promise promise) {
        lnrpc.Walletunlocker.InitWalletRequest.Builder initWallet = lnrpc.Walletunlocker.InitWalletRequest.newBuilder();

        // Add seed mnemonic
        ArrayList<String> seedMnemonic = new ArrayList<>();

        if (seed != null && seed.size() > 0) {
            for (int i = 0; i < seed.size(); i++) {
                if (seed.getType(i) != ReadableType.String) {
                    Log.e(TAG, "Not a valid seed mnemonic: " + seed.toString());
                    promise.reject(TAG, "Not a valid seed mnemonic");
                    return;
                }

                seedMnemonic.add(seed.getString(i));
            }

            initWallet.addAllCipherSeedMnemonic(seedMnemonic);
        }

        // Add password
        if (password != null) {
            if (password.length() < 8) {
                Log.e(TAG, "Password too short: " + password.replaceAll(".", "*"));
                promise.reject(TAG, "Password too short");
                return;
            }

            initWallet.setWalletPassword(ByteString.copyFromUtf8(password));
        }

        // Add recovery window
        if (recoveryWindow != null && recoveryWindow > 0) {
            initWallet.setRecoveryWindow(recoveryWindow);
        }

        Lndmobile.initWallet(initWallet.build().toByteArray(), new LndCallback(promise));
    }

    @ReactMethod
    public void unlockWallet(String password, final Promise promise) {
        lnrpc.Walletunlocker.UnlockWalletRequest.Builder unlockWallet = lnrpc.Walletunlocker.UnlockWalletRequest.newBuilder();
        unlockWallet.setWalletPassword(ByteString.copyFromUtf8(password));

        Lndmobile.unlockWallet(unlockWallet.build().toByteArray(), new LndCallback(promise));
    }

    @ReactMethod
    public void stop(final Promise promise) {
        lnrpc.LightningOuterClass.StopRequest.Builder builder = lnrpc.LightningOuterClass.StopRequest.newBuilder();

        Lndmobile.stopDaemon(builder.build().toByteArray(), new LndCallback(promise));
    }

    @ReactMethod
    public void sendCommand(String method, String msg, final Promise promise) {
        Method syncMethod = syncMethods.get(method);
        if (syncMethod == null) {
            promise.reject(TAG, "method not found: " + method);
            return;
        }

        byte[] bytes = Base64.decode(msg, Base64.NO_WRAP);

        try {
            syncMethod.invoke(null, bytes, new LndCallback(promise));
        } catch (IllegalAccessException | InvocationTargetException e) {
            e.printStackTrace();
            promise.reject(TAG, e);
        }
    }

    @ReactMethod
    public void sendStreamCommand(String method, String streamId, String msg) {
        Method streamMethod = streamMethods.get(method);

        if (streamMethod == null) {
            return;
        }

        RCTDeviceEventEmitter emitter = getReactApplicationContext()
                .getJSModule(RCTDeviceEventEmitter.class);
        LndRecvStream recvStream = new LndRecvStream(streamId, emitter);

        try {
            if (isSendStream(streamMethod)) {
                Object sendStream = streamMethod.invoke(null, recvStream);
                this.activeStreams.put(streamId, (SendStream) sendStream);
            } else {
                byte[] bytes = Base64.decode(msg, Base64.NO_WRAP);
                streamMethod.invoke(null, bytes, recvStream);
            }
        } catch (IllegalAccessException | InvocationTargetException e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void sendStreamWrite(String streamId, String msg) {
        SendStream stream = activeStreams.get(streamId);
        if (stream == null) {
            return;
        }

        byte[] bytes = Base64.decode(msg, Base64.NO_WRAP);
        try {
            stream.send(bytes);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
