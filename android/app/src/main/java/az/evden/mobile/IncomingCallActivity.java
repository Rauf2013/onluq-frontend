package az.evden.mobile;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

// Native full-screen gələn zəng ekranı — kilid ekranında, başqa app-dayken də açılır (WhatsApp tipli).
// Proqram ilə UI (XML resurs lazım deyil). Accept/Decline → EvdenAudio plugin-ə ötürülür.
public class IncomingCallActivity extends Activity {

    public static final String EXTRA_CALLER = "caller";
    public static final String EXTRA_KIND = "kind";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ekranı oyat + kilid ekranının üstündə göstər
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }

        String caller = getIntent().getStringExtra(EXTRA_CALLER);
        String kind = getIntent().getStringExtra(EXTRA_KIND);
        if (caller == null || caller.isEmpty()) caller = "EVDƏN zəng";
        boolean isVideo = "video".equals(kind);

        setContentView(buildUi(caller, isVideo));
    }

    private View buildUi(String caller, boolean isVideo) {
        final float d = getResources().getDisplayMetrics().density;

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setBackgroundColor(Color.parseColor("#0F172A"));
        root.setPadding((int) (24 * d), (int) (80 * d), (int) (24 * d), (int) (56 * d));

        TextView brand = new TextView(this);
        brand.setText("EVDƏN");
        brand.setTextColor(Color.parseColor("#FFED00"));
        brand.setTextSize(16);
        brand.setGravity(Gravity.CENTER);
        root.addView(brand);

        TextView sub = new TextView(this);
        sub.setText(isVideo ? "Görüntülü zəng gəlir..." : "Zəng gəlir...");
        sub.setTextColor(Color.parseColor("#9FB0D0"));
        sub.setTextSize(15);
        sub.setGravity(Gravity.CENTER);
        sub.setPadding(0, (int) (10 * d), 0, 0);
        root.addView(sub);

        TextView name = new TextView(this);
        name.setText(caller);
        name.setTextColor(Color.WHITE);
        name.setTextSize(30);
        name.setGravity(Gravity.CENTER);
        name.setPadding(0, (int) (18 * d), 0, 0);
        root.addView(name);

        // Boşluq (yuxarı/aşağı arası)
        View spacer = new View(this);
        LinearLayout.LayoutParams spLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        root.addView(spacer, spLp);

        // Düymələr sırası
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        row.setGravity(Gravity.CENTER);

        Button decline = new Button(this);
        decline.setText("Rədd et");
        decline.setTextColor(Color.WHITE);
        decline.setBackgroundColor(Color.parseColor("#EF4444"));
        decline.setOnClickListener(v -> onDecline());
        LinearLayout.LayoutParams dLp = new LinearLayout.LayoutParams(0, (int) (56 * d), 1f);
        dLp.setMargins((int) (8 * d), 0, (int) (8 * d), 0);
        row.addView(decline, dLp);

        Button accept = new Button(this);
        accept.setText(isVideo ? "Görüntülü cavabla" : "Cavabla");
        accept.setTextColor(Color.WHITE);
        accept.setBackgroundColor(Color.parseColor("#14224F"));
        accept.setOnClickListener(v -> onAccept());
        LinearLayout.LayoutParams aLp = new LinearLayout.LayoutParams(0, (int) (56 * d), 1f);
        aLp.setMargins((int) (8 * d), 0, (int) (8 * d), 0);
        row.addView(accept, aLp);

        root.addView(row);
        return root;
    }

    private void onAccept() {
        EvdenAudio.stopRingtoneStatic();   // zəng səsini DƏRHAL kəs (qulaq dinamikinə sızmasın)
        EvdenAudio.deliverCallAction("accept");
        // App-ı önə gətir (WebView zəngi qəbul etsin) + "accept" extra → MainActivity kilid üstündə açılsın
        Intent i = new Intent(this, MainActivity.class);
        i.putExtra("evden_call_accept", true);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(i);
        finish();
    }

    private void onDecline() {
        EvdenAudio.dismiss(this);          // zəng səsini dayandır + bildirişi sil (DƏRHAL — əvvəl səs qalırdı)
        EvdenAudio.deliverCallAction("decline");  // app açıqdırsa web call:reject göndərir
        finish();
    }

    @Override
    public void onBackPressed() {
        // Geri = rədd et
        onDecline();
    }
}
