// Native (Capacitor) entegrasyon katmani — webde no-op, telefonda native API.
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { Browser } from '@capacitor/browser';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Android OAuth client (Google Console-da yaradılıb) — browser OAuth flow üçün
const GOOGLE_ANDROID_CLIENT_ID = '397810655273-bqqeo6maruf5up3hslpe6hh82s7cbv57.apps.googleusercontent.com';
const GOOGLE_OAUTH_REDIRECT = 'com.googleusercontent.apps.397810655273-bqqeo6maruf5up3hslpe6hh82s7cbv57:/oauth2redirect';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

const safe = async (fn) => { try { return await fn(); } catch { /* sessiz */ } };

export async function initNative() {
  if (!isNative) return;

  document.body.classList.add('native-app');
  document.body.classList.add(`platform-${platform}`);

  // Google native sign-in init
  if (GOOGLE_CLIENT_ID) {
    await safe(() => SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_CLIENT_ID,
        mode: 'online',
      },
    }));
  }

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

  // Global haptic-on-tap — buton/link/role=button tiklamalarina hafif titresim
  document.addEventListener('pointerdown', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('button, a, [role="button"], .haptic')) {
      if (t.closest('[data-no-haptic]')) return;
      safe(() => Haptics.impact({ style: ImpactStyle.Light }));
    }
  }, { passive: true });
}

// Geri tusu davranisi — React Router ile entegre
export function attachBackButton(navigate) {
  if (!isNative) return () => {};
  let lastBackPress = 0;
  const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
    // Modal acik mi? Acik bir modal varsa onu kapat
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

// Google native sign-in — returns ID token (backend /api/auth/google bunu kabul ediyor)
// style:'bottom' + forcePrompt:true → GetGoogleIdOption flow (Credential Manager bottom sheet,
// filterByAuthorizedAccounts=false, hər dəfə hesab seçimi). Bu, "cancelled by user"
// xətasını həll edir — çünki standart GetSignInWithGoogleOption bəzi cihazlarda credential
// dönmür və cancel kimi görünür.
export async function nativeGoogleSignIn() {
  if (!isNative) throw new Error('Native deyil');
  const res = await SocialLogin.login({
    provider: 'google',
    options: { style: 'bottom', forcePrompt: true },
  });
  const idToken = res?.result?.idToken;
  if (!idToken) throw new Error('Google ID token alinmadi');
  return { idToken, profile: res?.result?.profile };
}

export async function nativeGoogleSignOut() {
  if (!isNative) return;
  await safe(() => SocialLogin.logout({ provider: 'google' }));
}

// ===== B PLANI: Google OAuth sistem brauzeri ilə (PKCE) =====
// Credential Manager-dən asılı deyil — hər cihazda işləyir.
function _b64url(bytes) {
  let s = '';
  const arr = new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function _rand(len) {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return _b64url(arr).slice(0, len);
}
async function _sha256b64(str) {
  const data = new TextEncoder().encode(str);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return _b64url(digest);
}

export async function googleOAuthBrowser() {
  if (!isNative) throw new Error('Native deyil');

  const verifier = _rand(64);
  const challenge = await _sha256b64(verifier);
  const nonce = _rand(16);
  const state = _rand(16);

  const authUrl =
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${encodeURIComponent(GOOGLE_ANDROID_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_REDIRECT)}` +
    '&response_type=code' +
    `&scope=${encodeURIComponent('openid email profile')}` +
    `&code_challenge=${challenge}&code_challenge_method=S256` +
    `&nonce=${nonce}&state=${state}&prompt=select_account`;

  return new Promise((resolve, reject) => {
    let finished = false;
    let listenerHandle = null;

    const cleanup = async () => {
      if (listenerHandle) { try { (await listenerHandle).remove(); } catch {} }
      try { await Browser.close(); } catch {}
    };

    listenerHandle = CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (!url || url.indexOf('oauth2redirect') === -1) return;
      finished = true;
      try {
        const u = new URL(url);
        const code = u.searchParams.get('code');
        const err = u.searchParams.get('error');
        await cleanup();
        if (err) return reject(new Error(`Google: ${err}`));
        if (!code) return reject(new Error('Authorization code alınmadı'));

        // Token exchange (PKCE — client_secret lazım deyil, Android client)
        const body = new URLSearchParams({
          code,
          client_id: GOOGLE_ANDROID_CLIENT_ID,
          redirect_uri: GOOGLE_OAUTH_REDIRECT,
          grant_type: 'authorization_code',
          code_verifier: verifier,
        });
        const r = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });
        const d = await r.json();
        if (!d.id_token) return reject(new Error(d.error_description || d.error || 'id_token alınmadı'));
        resolve({ idToken: d.id_token });
      } catch (e) {
        await cleanup();
        reject(e);
      }
    });

    safe(() => Browser.open({ url: authUrl, presentationStyle: 'fullscreen' }));

    setTimeout(() => {
      if (!finished) { cleanup(); reject(new Error('Vaxt bitdi — yenidən cəhd et')); }
    }, 180000);
  });
}
