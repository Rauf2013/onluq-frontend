package az.evden.mobile;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import java.util.List;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Zəng səs marşrutu: earpiece (qulaq üstü) ↔ speaker (ucadan) + proximity sensoru
// + gələn zəngdə telefonun ƏSL default ringtone-u (RingtoneManager).
// JS tərəfdən capacitor.js → Capacitor.Plugins.EvdenAudio çağırır.
@CapacitorPlugin(name = "EvdenAudio")
public class EvdenAudio extends Plugin implements SensorEventListener {

    private AudioManager audioManager;
    private SensorManager sensorManager;
    private Sensor proximitySensor;
    private static Ringtone ringtone;

    // Telefonun ƏSL zəng səsini LOOP ilə çal (gələn zəng kimi). Həm app açıq, həm FCM (bağlı) işlədir.
    public static void startRingtone(Context ctx) {
        try {
            if (ringtone != null && ringtone.isPlaying()) return;
            Uri uri = RingtoneManager.getActualDefaultRingtoneUri(ctx, RingtoneManager.TYPE_RINGTONE);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            ringtone = RingtoneManager.getRingtone(ctx, uri);
            if (ringtone != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) ringtone.setLooping(true);
                ringtone.play();
            }
        } catch (Exception ignored) {}
    }
    public static void stopRingtoneStatic() {
        try { if (ringtone != null) { ringtone.stop(); ringtone = null; } } catch (Exception ignored) {}
    }

    private static EvdenAudio instance;
    private static final String CALL_CHANNEL = "evden_calls";
    private static final int CALL_NOTIF_ID = 7711;

    @Override
    public void load() {
        instance = this;
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            proximitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);
        }
    }

    // App bağlı ikən Qəbul edildikdə → app açılanda web zəngi avtomatik qəbul etsin
    private static volatile long pendingAcceptAt = 0;
    public static void markPendingAccept() { pendingAcceptAt = System.currentTimeMillis(); }

    // IncomingCallActivity / bildiriş düyməsindən accept/decline → web GlobalCall-a ötür.
    // App AÇIQdırsa dərhal notifyListeners; bağlıdırsa pendingAccept qoyulur (app açılanda işlənir).
    public static void deliverCallAction(String action) {
        if ("accept".equals(action)) markPendingAccept();
        if (instance != null) {
            JSObject d = new JSObject();
            d.put("action", action);
            instance.notifyListeners("callAction", d);
        }
    }

    // Web GlobalCall ringing-ə düşəndə soruşur: gözləyən "qəbul" var? (app bağlı ikən basılmışdı)
    @PluginMethod
    public void consumePendingAccept(PluginCall call) {
        boolean pending = pendingAcceptAt > 0 && (System.currentTimeMillis() - pendingAcceptAt) < 30000;
        pendingAcceptAt = 0;
        JSObject r = new JSObject();
        r.put("accept", pending);
        call.resolve(r);
    }

    // Native full-screen gələn zəng bildirişi — STATIK (həm plugin-dən, həm FCM servisindən çağrılır).
    // contentIntent + fullScreenIntent → IncomingCallActivity; Qəbul/Rədd action düymələri → CallActionReceiver.
    public static void showIncomingCallNotification(Context ctx, String caller, String kind) {
        try {
            if (caller == null || caller.isEmpty()) caller = "EVDƏN zəng";
            if (kind == null) kind = "audio";
            startRingtone(ctx); // telefonun ƏSL zəng səsi (loop) — bildiriş "ding"i yox
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel ch = new NotificationChannel(CALL_CHANNEL, "Zənglər", NotificationManager.IMPORTANCE_HIGH);
                ch.setDescription("Gələn zənglər");
                ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(ch);
            }

            Intent full = new Intent(ctx, IncomingCallActivity.class);
            full.putExtra(IncomingCallActivity.EXTRA_CALLER, caller);
            full.putExtra(IncomingCallActivity.EXTRA_KIND, kind);
            full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) piFlags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent fullPi = PendingIntent.getActivity(ctx, 100, full, piFlags);

            // CAVABLA → BİRBAŞA MainActivity açır (Android 10+ broadcast-dan Activity aça bilmir!).
            // Tıklananda app önə gəlir + "accept" extra-sı → web zəngi avtomatik qəbul edir.
            Intent acceptI = new Intent(ctx, MainActivity.class)
                .putExtra("evden_call_accept", true)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent acceptPi = PendingIntent.getActivity(ctx, 101, acceptI, piFlags);
            // RƏDD → broadcast (Activity açmağa ehtiyac yox, sadəcə dayandır + dismiss)
            Intent declineI = new Intent(ctx, CallActionReceiver.class).setAction(CallActionReceiver.ACTION_DECLINE);
            PendingIntent declinePi = PendingIntent.getBroadcast(ctx, 102, declineI, piFlags);

            NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CALL_CHANNEL)
                .setSmallIcon(ctx.getApplicationInfo().icon)
                .setContentTitle(caller)
                .setContentText("video".equals(kind) ? "Görüntülü zəng gəlir..." : "Zəng gəlir...")
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(fullPi)
                .setFullScreenIntent(fullPi, true)
                .addAction(0, "Rədd et", declinePi)
                .addAction(0, "Cavabla", acceptPi);

            nm.notify(CALL_NOTIF_ID, b.build());
        } catch (Exception ignored) {}
    }

    public static void dismiss(Context ctx) {
        stopRingtoneStatic();
        try {
            NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
            nm.cancel(CALL_NOTIF_ID);
        } catch (Exception ignored) {}
    }

    @PluginMethod
    public void showIncomingCall(PluginCall call) {
        showIncomingCallNotification(getContext(), call.getString("caller", "EVDƏN zəng"), call.getString("kind", "audio"));
        call.resolve();
    }

    @PluginMethod
    public void dismissIncomingCall(PluginCall call) {
        dismiss(getContext());
        call.resolve();
    }

    // Zəng bitəndə: app artıq kilid ekranının üstündə görünməsin (təhlükəsizlik).
    @PluginMethod
    public void allowLockAgain(PluginCall call) {
        final android.app.Activity act = getActivity();
        if (act != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            act.runOnUiThread(() -> { try { act.setShowWhenLocked(false); act.setTurnScreenOn(false); } catch (Exception ignored) {} });
        }
        call.resolve();
    }

    // Səsi marşrutla: speaker=true → ucadan dinamik, false → qulaq üstü (earpiece).
    // Android 12+ (API 31): MODERN setCommunicationDevice — WebView WebRTC səsini ETİBARLI yönləndirir
    // (köhnə setSpeakerphoneOn yeni telefonlarda işləmir). Köhnə Android-də fallback.
    private void routeAudio(boolean speaker) {
        if (audioManager == null) return;
        audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                int wanted = speaker ? AudioDeviceInfo.TYPE_BUILTIN_SPEAKER : AudioDeviceInfo.TYPE_BUILTIN_EARPIECE;
                AudioDeviceInfo target = null;
                List<AudioDeviceInfo> devices = audioManager.getAvailableCommunicationDevices();
                for (AudioDeviceInfo d : devices) {
                    if (d.getType() == wanted) { target = d; break; }
                }
                audioManager.clearCommunicationDevice();
                if (target != null) {
                    audioManager.setCommunicationDevice(target);
                    return;
                }
            } catch (Exception ignored) {}
        }
        try { audioManager.setSpeakerphoneOn(speaker); } catch (Exception ignored) {}
    }

    // Zəng başlayanda: zəng rejimi + default earpiece (qulaq üstü).
    @PluginMethod
    public void startCall(PluginCall call) {
        routeAudio(false);
        call.resolve();
    }

    // Zəng bitəndə: normal rejimə qaytar.
    @PluginMethod
    public void stopCall(PluginCall call) {
        if (audioManager != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) audioManager.clearCommunicationDevice();
                else audioManager.setSpeakerphoneOn(false);
            } catch (Exception ignored) {}
            audioManager.setMode(AudioManager.MODE_NORMAL);
        }
        call.resolve();
    }

    // on=true → ucadan dinamik (speaker), on=false → qulaq üstü dinamik (earpiece).
    @PluginMethod
    public void setSpeakerphone(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        routeAudio(on);
        call.resolve();
    }

    @PluginMethod
    public void startProximity(PluginCall call) {
        if (sensorManager != null && proximitySensor != null) {
            sensorManager.registerListener(this, proximitySensor, SensorManager.SENSOR_DELAY_NORMAL);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopProximity(PluginCall call) {
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        call.resolve();
    }

    // Gələn zəngdə telefonun ƏSL default ringtone-unu çal.
    @PluginMethod
    public void playRingtone(final PluginCall call) {
        startRingtone(getContext());
        call.resolve();
    }

    @PluginMethod
    public void stopRingtone(PluginCall call) {
        stopRingtoneStatic();
        call.resolve();
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_PROXIMITY) {
            float max = proximitySensor != null ? proximitySensor.getMaximumRange() : 5f;
            boolean near = event.values[0] < max;
            JSObject data = new JSObject();
            data.put("near", near);
            notifyListeners("proximity", data);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}
}
