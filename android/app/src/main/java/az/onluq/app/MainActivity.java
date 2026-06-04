package az.onluq.app;

import com.getcapacitor.BridgeActivity;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // Marker — Capgo Social Login plugin'in interface checkini kecmek ucun.
        // Plugin scopes/offline mode istifade etsek bu marker tek basina yetir.
    }
}
