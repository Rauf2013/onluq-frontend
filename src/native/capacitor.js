// Native (Capacitor) entegrasyon katmani — webde no-op, telefonda native API.
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Keyboard } from '@capacitor/keyboard';
import { App as CapApp } from '@capacitor/app';
import { Network } from '@capacitor/network';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

const safe = async (fn) => { try { return await fn(); } catch { /* sessiz */ } };

export async function initNative() {
  if (!isNative) return;

  document.body.classList.add('native-app');
  document.body.classList.add(`platform-${platform}`);

  await safe(() => StatusBar.setOverlaysWebView({ overlay: false }));
  const dark = document.body.classList.contains('dark-mode');
  await safe(() => StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }));
  await safe(() => StatusBar.setBackgroundColor({ color: dark ? '#0b1220' : '#ffffff' }));

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

  // Status bar temasini calismasini takip et — dark/light degisince guncelle
  const observer = new MutationObserver(() => {
    const isDark = document.body.classList.contains('dark-mode');
    safe(() => StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light }));
    safe(() => StatusBar.setBackgroundColor({ color: isDark ? '#0b1220' : '#ffffff' }));
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
