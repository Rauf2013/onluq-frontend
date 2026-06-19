package az.evden.mobile;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.media.AudioManager;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Zəng səs marşrutu: earpiece (qulaq üstü) ↔ speaker (ucadan) + proximity sensoru.
// JS tərəfdən capacitor.js → Capacitor.Plugins.EvdenAudio çağırır.
@CapacitorPlugin(name = "EvdenAudio")
public class EvdenAudio extends Plugin implements SensorEventListener {

    private AudioManager audioManager;
    private SensorManager sensorManager;
    private Sensor proximitySensor;

    @Override
    public void load() {
        audioManager = (AudioManager) getContext().getSystemService(Context.AUDIO_SERVICE);
        sensorManager = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
        if (sensorManager != null) {
            proximitySensor = sensorManager.getDefaultSensor(Sensor.TYPE_PROXIMITY);
        }
    }

    // Zəng başlayanda: MODE_IN_COMMUNICATION (earpiece marşrutu üçün şərt), default earpiece.
    @PluginMethod
    public void startCall(PluginCall call) {
        if (audioManager != null) {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(false);
        }
        call.resolve();
    }

    // Zəng bitəndə: normal rejimə qaytar.
    @PluginMethod
    public void stopCall(PluginCall call) {
        if (audioManager != null) {
            try { audioManager.setSpeakerphoneOn(false); } catch (Exception ignored) {}
            audioManager.setMode(AudioManager.MODE_NORMAL);
        }
        call.resolve();
    }

    // on=true → ucadan dinamik (speaker), on=false → qulaq üstü dinamik (earpiece).
    @PluginMethod
    public void setSpeakerphone(PluginCall call) {
        boolean on = Boolean.TRUE.equals(call.getBoolean("on", false));
        if (audioManager != null) {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(on);
        }
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
