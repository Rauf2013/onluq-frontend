package az.evden.mobile;

import android.Manifest;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Native zəng səs marşrutu plugin-i (earpiece/speaker + proximity) — super.onCreate-dən ƏVVƏL
        registerPlugin(EvdenAudio.class);
        super.onCreate(savedInstanceState);

        handleCallIntent(getIntent());

        // WebRTC səsli/görüntülü zəng üçün mikrofon + kamera icazəsi
        String[] perms = {
            Manifest.permission.CAMERA,
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.MODIFY_AUDIO_SETTINGS,
        };
        boolean need = false;
        for (String p : perms) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                need = true;
                break;
            }
        }
        if (need) {
            ActivityCompat.requestPermissions(this, perms, 1001);
        }
    }

    // Bildirişdəki "Cavabla" → bu Activity açılır. Pending-accept qoy + zəng bildirişini bağla;
    // web GlobalCall socket-ə qoşulub re-invite gələndə zəngi avtomatik qəbul edir.
    @Override
    public void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCallIntent(intent);
    }

    private void handleCallIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("evden_call_accept", false)) {
            showOverLockScreen();   // kilid ekranında ilişməsin
            EvdenAudio.markPendingAccept();
            EvdenAudio.dismiss(this);
        }
    }

    // Zəng qəbul ediləndə app kilid ekranının ÜSTÜNDƏ görünsün + ekranı oyat.
    // PIN/şifrə SORUŞMURUQ (WhatsApp kimi) — istifadəçi kilid üstündə birbaşa danışır.
    // (Yalnız zəng halında; zəng bitəndə allowLockAgain ilə geri sönür → təhlükəsizlik.)
    private void showOverLockScreen() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
                setShowWhenLocked(true);
                setTurnScreenOn(true);
            } else {
                getWindow().addFlags(
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                );
            }
        } catch (Exception ignored) {}
    }
}
