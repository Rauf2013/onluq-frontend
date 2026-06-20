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
        if (data != null && "call".equals(data.get("type"))) {
            EvdenAudio.showIncomingCallNotification(
                getApplicationContext(),
                data.get("callerName"),
                data.get("kind")
            );
            return;
        }
        super.onMessageReceived(remoteMessage);
    }
}
