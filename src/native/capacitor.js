// Native (Capacitor) entegrasyon katmani — webde no-op, telefonda native API.
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { PushNotifications } from '@capacitor/push-notifications';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

const safe = async (fn) => { try { return await fn(); } catch { /* sessiz */ } };

export async function initNative() {
  if (!isNative) return;

  document.body.classList.add('native-app');
  document.body.classList.add(`platform-${platform}`);

  await safe(() => StatusBar.setOverlaysWebView({ overlay: false }));
  // EVDƏN: status bar her zaman navy (brand), icon'lar acik (Style.Light = light foreground)
  await safe(() => StatusBar.setStyle({ style: Style.Light }));
  await safe(() => StatusBar.setBackgroundColor({ color: '#14224F' }));

  await safe(() => Keyboard.addListener('keyboardWillShow', () => {
    document.body.classList.add('keyboard-open');
  }));
  await safe(() => Keyboard.addListener('keyboardWillHide', () => {
    document.body.classList.remove('keyboard-open');
  }));

  await safe(() => Network.addListener('networkStatusChange', (s) => {
    document.body.classList.toggle('offline', !s.connected);
    window.dispatchEvent(new CustomEvent('app:networkChange', { detail: s }));
  }));

  // Splash kapali olarak baslattik (launchAutoHide=false). Ilk render hazir oldugunda kapatiyoruz.
  setTimeout(() => { safe(() => SplashScreen.hide({ fadeOutDuration: 200 })); }, 350);

  // EVDƏN: status bar her tema'da navy kalir, dark mode degisikligini takip etmeyiz.
  const observer = new MutationObserver(() => {
    safe(() => StatusBar.setStyle({ style: Style.Light }));
    safe(() => StatusBar.setBackgroundColor({ color: '#14224F' }));
  });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  // Global haptic + Material ripple — buton/link/kart tiklamalarinda
  document.addEventListener('pointerdown', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    const target = t.closest('button, a, [role="button"], .haptic, .evden-card, .evden-service-card, .evden-cat-chip, .mobile-menu-item');
    if (!target) return;
    if (t.closest('[data-no-haptic]')) return;

    // Hafif titresim
    safe(() => Haptics.impact({ style: ImpactStyle.Light }));

    // Material ripple
    try {
      if (target.closest('[data-no-ripple]')) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const cs = getComputedStyle(target);
      if (cs.position === 'static') target.style.position = 'relative';
      if (cs.overflow === 'visible') target.style.overflow = 'hidden';
      const ripple = document.createElement('span');
      ripple.className = 'rn-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      target.appendChild(ripple);
      setTimeout(() => ripple.remove(), 520);
    } catch {}
  }, { passive: true });
}

// Geri tusu davranisi — React Router ile entegre
export function attachBackButton(navigate) {
  if (!isNative) return () => {};
  let lastBackPress = 0;
  const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
    const openModal = document.querySelector('.custom-modal-overlay, [data-modal-open="true"]');
    if (openModal) {
      const closeBtn = openModal.querySelector('[data-modal-close], .btn-modal-cancel, [aria-label="close"]');
      if (closeBtn) { closeBtn.click(); return; }
    }

    if (canGoBack && window.history.length > 1) {
      navigate(-1);
    } else {
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        safe(() => CapApp.exitApp());
      } else {
        lastBackPress = now;
        window.dispatchEvent(new CustomEvent('app:doubleBackHint'));
      }
    }
  });
  return () => { sub.then(s => s.remove()).catch(() => {}); };
}

// Haptic helpers — sade API
export const hapticLight   = () => isNative && safe(() => Haptics.impact({ style: ImpactStyle.Light }));
export const hapticMedium  = () => isNative && safe(() => Haptics.impact({ style: ImpactStyle.Medium }));
export const hapticHeavy   = () => isNative && safe(() => Haptics.impact({ style: ImpactStyle.Heavy }));
export const hapticSuccess = () => isNative && safe(() => Haptics.notification({ type: NotificationType.Success }));
export const hapticWarning = () => isNative && safe(() => Haptics.notification({ type: NotificationType.Warning }));
export const hapticError   = () => isNative && safe(() => Haptics.notification({ type: NotificationType.Error }));
export const hapticSelect  = () => isNative && safe(() => Haptics.selectionStart().then(() => Haptics.selectionEnd()));

// ===== Google giriş — YALNIZ Firebase Authentication =====
// Capgo Social Login silindi (Firebase ilə Credential Manager toqquşması
// DEVELOPER_ERROR-a səbəb olurdu). İndi yalnız bir Google provider var.
export async function firebaseGoogleSignIn() {
  if (!isNative) throw new Error('Native deyil');
  // Əvvəlki sessiyanı təmizlə (köhnə state DEVELOPER_ERROR verə bilər)
  await safe(() => FirebaseAuthentication.signOut());
  const result = await FirebaseAuthentication.signInWithGoogle();
  const idToken = result?.credential?.idToken;
  if (!idToken) throw new Error('Google ID token alınmadı');
  return { idToken, user: result?.user };
}

export async function firebaseSignOut() {
  if (!isNative) return;
  await safe(() => FirebaseAuthentication.signOut());
}

// ===== Zəng səs marşrutu (spiker / qulaq üstü dinamik) =====
// Həqiqi earpiece↔speaker keçidi və proximity Android-də native AudioManager tələb edir.
// Native plugin (EvdenAudio) qeydiyyatdadırsa onu işlədirik; yoxdursa graceful no-op.
function _audioPlugin() {
  return (typeof Capacitor !== 'undefined' && Capacitor.Plugins && Capacitor.Plugins.EvdenAudio) || null;
}

// Zəng rejimini başlat/bitir (Android MODE_IN_COMMUNICATION — earpiece marşrutu üçün şərt).
export async function startCallAudio() {
  const p = _audioPlugin();
  if (p && p.startCall) await safe(() => p.startCall());
}
export async function stopCallAudio() {
  const p = _audioPlugin();
  if (p && p.stopCall) await safe(() => p.stopCall());
}

// Spiker on=ana (ucadan) dinamik, off=qulaq üstü dinamik (earpiece).
export async function setSpeakerphone(on) {
  const p = _audioPlugin();
  if (p && p.setSpeakerphone) await safe(() => p.setSpeakerphone({ on: !!on }));
}

// Native full-screen gələn zəng ekranı (kilid ekranında, başqa app-dayken).
export async function showIncomingCall(caller, kind) {
  const p = _audioPlugin();
  if (p && p.showIncomingCall) await safe(() => p.showIncomingCall({ caller: caller || 'EVDƏN zəng', kind: kind || 'audio' }));
}
export async function dismissIncomingCall() {
  const p = _audioPlugin();
  if (p && p.dismissIncomingCall) await safe(() => p.dismissIncomingCall());
}
// Native ekrandakı Cavabla/Rədd et → callback(action: 'accept'|'decline')
export function onCallAction(cb) {
  const p = _audioPlugin();
  if (p && p.addListener) {
    let handle;
    safe(() => { handle = p.addListener('callAction', (e) => { try { cb(e && e.action); } catch {} }); });
    return () => { if (handle) safe(() => handle.remove && handle.remove()); };
  }
  return () => {};
}

// Gələn zəngdə telefonun ƏSL default ringtone-unu çal/dayandır (native RingtoneManager).
export async function playNativeRingtone() {
  const p = _audioPlugin();
  if (p && p.playRingtone) { await safe(() => p.playRingtone()); return true; }
  return false;
}
export async function stopNativeRingtone() {
  const p = _audioPlugin();
  if (p && p.stopRingtone) await safe(() => p.stopRingtone());
}

// Proximity sensoru: telefon qulağa yaxınlaşanda onNear(true), uzaqlaşanda onNear(false).
// Native plugin varsa hadisəni dinləyir; yoxdursa heç nə (graceful).
export function startProximity(onNear) {
  const p = _audioPlugin();
  if (p && p.addListener) {
    let handle;
    safe(() => { handle = p.addListener('proximity', (e) => { try { onNear(!!(e && e.near)); } catch {} }); });
    safe(() => p.startProximity && p.startProximity());
    return () => { safe(() => p.stopProximity && p.stopProximity()); if (handle) safe(() => handle.remove && handle.remove()); };
  }
  return () => {};
}

// ===== Push bildiriş (FCM) =====
// Login-dən sonra çağırılmalıdır (token-i backend-ə yazmaq üçün auth lazımdır).
let _pushInited = false;
export async function initPush(apiUrl, getAuthToken) {
  if (!isNative || _pushInited) return;
  _pushInited = true;

  let perm = await safe(() => PushNotifications.checkPermissions());
  if (!perm || perm.receive !== 'granted') {
    perm = await safe(() => PushNotifications.requestPermissions());
  }
  if (!perm || perm.receive !== 'granted') { _pushInited = false; return; }

  await safe(() => PushNotifications.register());

  // FCM token alındıqda backend-ə qeydiyyat
  await safe(() => PushNotifications.addListener('registration', async (t) => {
    try {
      const authToken = getAuthToken && getAuthToken();
      if (!authToken || !t?.value) return;
      await fetch(`${apiUrl}/api/push/register-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ token: t.value }),
      });
    } catch {}
  }));

  // Bildirişə toxunulduqda ilgili səhifəyə yönləndir
  await safe(() => PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    const data = action?.notification?.data || {};
    if (data.type === 'message') window.location.href = '/mesajlar';
    else if (data.type === 'call') window.location.href = '/mesajlar';
    else window.location.href = '/bildirisler';
  }));

  // App açıkkən bildiriş gəldikdə — istəsən in-app toast göstərə bilərsən
  await safe(() => PushNotifications.addListener('pushNotificationReceived', (notif) => {
    window.dispatchEvent(new CustomEvent('app:pushReceived', { detail: notif }));
  }));
}
