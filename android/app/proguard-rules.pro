# ============================================================
# EVDƏN — R8/ProGuard qaydaları (release build)
# Capacitor plugin-ləri reflection/annotation ilə yüklənir,
# ona görə onları minify-dan qorumalıyıq, yoxsa app crash olar.
# ============================================================

# --- Capacitor core + bütün pluginlər ---
-keep public class * extends com.getcapacitor.Plugin
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }
-keep class com.getcapacitor.** { *; }
-keep interface com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }

# Capacitor annotation-ları (plugin registration üçün şərt)
-keepattributes *Annotation*
-keep class com.getcapacitor.annotation.** { *; }

# --- WebView JS interface metodları (@JavascriptInterface) ---
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# --- Cordova plugin-ləri (Capacitor cordova bridge) ---
-keep class org.apache.cordova.** { *; }
-keep public class * extends org.apache.cordova.CordovaPlugin

# --- Firebase + Google Play Services (Auth, Messaging/FCM) ---
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# --- Stack trace oxuna bilsin deyə sətir nömrələrini saxla ---
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# --- Ümumi: JS bridge ilə işləyən model class-ları (JSON) ---
-keepclassmembers class * {
    @com.getcapacitor.annotation.Permission <fields>;
}
