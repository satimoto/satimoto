package com.satimoto;

import android.os.FileObserver;

import android.util.Log;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintWriter;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class LndUtils extends ReactContextBaseJavaModule {
    final String TAG = "LndUtils";
    private static final String logEventName = "logs";

    private FileObserver logObserver;
    final String lndDirectory;
    final String confFile;
    final String logFile;

    public LndUtils(ReactApplicationContext reactContext) {
        super(reactContext);

        lndDirectory = getReactApplicationContext().getFilesDir().toString();
        confFile = lndDirectory + "/lnd.conf";
        logFile = lndDirectory + "/logs/bitcoin/" + BuildConfig.NETWORK + "/lnd.log";

        prepareFileDirectory(logFile);
    }

    @Override
    public String getName() {
        return TAG;
    }

    private void prepareFileDirectory(String filename) {
        new File(filename).getParentFile().mkdirs();
    }

    private PrintWriter getPrintWriter(String filename) throws Exception {
        prepareFileDirectory(filename);
        return new PrintWriter(filename);
    }

    void writeConf(String content) throws Exception {
        PrintWriter writer = getPrintWriter(confFile);
        writer.println(content);
        writer.close();
    }

    @ReactMethod
    void writeConf(String content, Promise promise) {
        try {
            this.writeConf(content);
            Log.d(TAG, "Saved LND conf to: " + confFile);
        } catch (Exception e) {
            Log.e(TAG, "Could not write to " + confFile, e);
            promise.reject("Could not write to : " + confFile, e);
            return;
        }

        promise.resolve("Saved LND conf to: " + confFile);
    }

    void writeDefaultConf() throws Exception {
        PrintWriter writer = getPrintWriter(confFile);

        if (BuildConfig.NETWORK.equals("mainnet")) {
            writer.println(
                    "[Application Options]\n" +
                            "debuglevel=info\n" +
                            "maxbackoff=2s\n" +
                            "nolisten=1\n" +
                            "norest=1\n" +
                            "sync-freelist=1\n" +
                            "accept-keysend=1\n" +
                            "feeurl=https://nodes.lightning.computer/fees/v1/btc-fee-estimates.json\n" +
                            "\n" +
                            "[Bitcoin]\n" +
                            "bitcoin.active=1\n" +
                            "bitcoin.mainnet=1\n" +
                            "bitcoin.node=neutrino\n" +
                            "\n" +
                            "[Neutrino]\n" +
                            "neutrino.connect=btcd-mainnet.lightning.computer\n" +
                            "\n" +
                            "[autopilot]\n" +
                            "autopilot.active=0\n" +
                            "autopilot.private=0\n" +
                            "autopilot.minconfs=0\n" +
                            "autopilot.conftarget=30\n" +
                            "autopilot.allocation=1.0\n" +
                            "autopilot.heuristic=externalscore:0.95\n" +
                            "autopilot.heuristic=preferential:0.05\n"
            );
        } else if (BuildConfig.NETWORK.equals("testnet")) {
            writer.println(
                    "[Application Options]\n" +
                            "debuglevel=info\n" +
                            "maxbackoff=2s\n" +
                            "nolisten=1\n" +
                            "norest=1\n" +
                            "sync-freelist=1\n" +
                            "accept-keysend=1\n" +
                            "feeurl=https://nodes.lightning.computer/fees/v1/btc-fee-estimates.json\n" +
                            "\n" +
                            "[Bitcoin]\n" +
                            "bitcoin.active=1\n" +
                            "bitcoin.testnet=1\n" +
                            "bitcoin.node=neutrino\n" +
                            "\n" +
                            "[Neutrino]\n" +
                            "neutrino.connect=btcd-testnet.lightning.computer\n" +
                            "\n" +
                            "[autopilot]\n" +
                            "autopilot.active=0\n" +
                            "autopilot.private=0\n" +
                            "autopilot.minconfs=0\n" +
                            "autopilot.conftarget=30\n" +
                            "autopilot.allocation=1.0\n" +
                            "autopilot.heuristic=externalscore:0.95\n" +
                            "autopilot.heuristic=preferential:0.05\n"
            );
        } else if (BuildConfig.NETWORK.equals("regtest")) {
            writer.println(
                    "[Application Options]\n" +
                            "debuglevel=info\n" +
                            "maxbackoff=2s\n" +
                            "nolisten=1\n" +
                            "norest=1\n" +
                            "sync-freelist=1\n" +
                            "accept-keysend=1\n" +
                            "\n" +
                            "[Bitcoin]\n" +
                            "bitcoin.active=1\n" +
                            "bitcoin.regtest=1\n" +
                            "bitcoin.node=bitcoind\n" +
                            "\n" +
                            "[Bitcoind]\n" +
                            "bitcoind.rpchost=127.0.0.1:18443\n" +
                            "bitcoind.rpcuser=polaruser\n" +
                            "bitcoind.rpcpass=polarpass\n" +
                            "bitcoind.zmqpubrawblock=127.0.0.1:28334\n" +
                            "bitcoind.zmqpubrawtx=127.0.0.1:29335\n" +
                            "\n" +
                            "[autopilot]\n" +
                            "autopilot.active=0\n" +
                            "autopilot.private=0\n" +
                            "autopilot.minconfs=0\n" +
                            "autopilot.conftarget=30\n" +
                            "autopilot.allocation=1.0\n" +
                            "autopilot.heuristic=externalscore:0.95\n" +
                            "autopilot.heuristic=preferential:0.05\n"
            );
        }

        writer.close();
    }

    @ReactMethod
    void writeDefaultConf(Promise promise) {
        try {
            this.writeDefaultConf();
            Log.d(TAG, "Saved LND conf to: " + confFile);
        } catch (Exception e) {
            Log.e(TAG, "Could not write to " + confFile, e);
            promise.reject("Could not write to : " + confFile, e);
            return;
        }

        promise.resolve("Saved LND conf to: " + confFile);
    }

    @ReactMethod
    void startLogEvents(String content, Promise promise) {
        if (logObserver == null) {
            FileInputStream fileInputStream = null;

            try {
                fileInputStream = new FileInputStream(logFile);
            } catch (FileNotFoundException fnfe) {
                Log.e(TAG, "Error initializing log events: " + logFile, fnfe);
                promise.reject("Error initializing log events: " + logFile, fnfe);
                return;
            }

            InputStreamReader inputStreamReader = new InputStreamReader(fileInputStream);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);

            logObserver = new FileObserver(logFile) {
                @Override
                public void onEvent(int event, String file) {
                    if (event != FileObserver.MODIFY) {
                        return;
                    }

                    try {
                        emitLogEvent(bufferedReader);
                    } catch (IOException ioe) {
                        Log.e(TAG, "Error emitting log event", ioe);
                    }
                }
            };

            Log.i(TAG, "Log events started");
            logObserver.startWatching();
        }

        promise.resolve("Log events started");
    }

    private void emitLogEvent(BufferedReader bufferedReader) throws IOException {
        String lines = "";
        while ((lines = bufferedReader.readLine()) != null) {
            getReactApplicationContext()
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit(logEventName, lines);
        }
    }


}