package az.evden.mobile;

import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

// FCM mesajlarını qarşılayır. type=call olan push → APP BAĞLI OLSA DA native full-screen
// gələn zəng bildirişini göstərir (arxa planda işləmək məcburi deyil). Digər push-lar
// Capacitor-un öz servisinə (super) ötürülür → adi bildiriş/token işləməyə davam edir.
public class EvdenFcmService extends MessagingService {
    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        if (data != null) {
            String type = data.get("type");
            // Zəng ləğv edildi (qarşı tərəf bağladı/rədd etdi) → native bildiriş + zəng səsini söndür.
            if ("call_cancel".equals(type)) {
                EvdenAudio.dismiss(getApplicationContext());
                return;
            }
            if ("call".equals(type)) {
                EvdenAudio.showIncomingCallNotification(
                    getApplicationContext(),
                    data.get("callerName"),
                    data.get("kind"),
                    data.get("callerId")
                );
                return;
            }
        }
        super.onMessageReceived(remoteMessage);
    }
}
