package com.njarrar.autostrad;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    // a phone call or another app's sound pauses the game's sound, and it comes back after
    private final AudioManager.OnAudioFocusChangeListener focusListener = (focusChange) -> {
        boolean active = focusChange == AudioManager.AUDIOFOCUS_GAIN;
        WebView wv = getBridge() != null ? getBridge().getWebView() : null;
        if (wv != null) wv.post(() -> wv.evaluateJavascript("window.autostradAudioActive && window.autostradAudioActive(" + active + ")", null));
    };

    // the page keeps the screen on while you drive, and lets it sleep in the menus
    private class NativeBridge {
        @JavascriptInterface
        public void setKeepAwake(boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        WebView web = getBridge() != null ? getBridge().getWebView() : null;
        if (web != null) {
            web.setOverScrollMode(View.OVER_SCROLL_NEVER);
            // no pinch zoom, and the phone's font size setting can't stretch the game's text
            WebSettings settings = web.getSettings();
            settings.setSupportZoom(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setTextZoom(100);
            web.addJavascriptInterface(new NativeBridge(), "autostradAndroid");
        }

        // the back button closes menus and pauses a drive, like Escape on a keyboard;
        // only on the plain menu does the app step aside
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView wv = getBridge() != null ? getBridge().getWebView() : null;
                if (wv == null) { moveTaskToBack(true); return; }
                wv.evaluateJavascript("window.autostradBack ? autostradBack() : false", (res) -> {
                    if (!"true".equals(res)) moveTaskToBack(true);
                });
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        requestAudioFocus();
    }

    @Override
    public void onPause() {
        abandonAudioFocus();
        super.onPause();
    }

    private void requestAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_GAME)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(focusListener)
                .build();
            audioManager.requestAudioFocus(focusRequest);
        } else {
            audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    private void abandonAudioFocus() {
        if (audioManager == null) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
        else audioManager.abandonAudioFocus(focusListener);
    }

    // full screen while driving; a swipe from the edge shows the bars for a moment
    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (!hasFocus) return;
        WindowInsetsControllerCompat bars = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        bars.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
        bars.hide(WindowInsetsCompat.Type.systemBars());
    }
}
