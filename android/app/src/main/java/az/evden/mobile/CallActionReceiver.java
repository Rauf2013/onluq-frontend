package az.evden.mobile;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

// Bildirişdəki "Cavabla" / "Rədd et" düymələri → web zəngini idarə et.
public class CallActionReceiver extends BroadcastReceiver {
    public static final String ACTION_ACCEPT = "az.evden.mobile.CALL_ACCEPT";
    public static final String ACTION_DECLINE = "az.evden.mobile.CALL_DECLINE";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent.getAction();
        EvdenAudio.dismiss(ctx);
        boolean accept = ACTION_ACCEPT.equals(action);
        // App açıqdırsa dərhal web-ə ötür; bağlıdırsa pendingAccept qoyulur (app açılanda işlənir)
        EvdenAudio.deliverCallAction(accept ? "accept" : "decline");
        if (accept) {
            try {
                Intent i = new Intent(ctx, MainActivity.class);
                i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                ctx.startActivity(i);
            } catch (Exception ignored) {}
        }
    }
}
