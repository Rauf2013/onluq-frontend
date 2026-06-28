import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, User, Volume2, Volume1 } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_URL } from '../api';
import { startCallAudio, stopCallAudio, setSpeakerphone, startProximity, playNativeRingtone, stopNativeRingtone, showIncomingCall, dismissIncomingCall, onCallAction, consumePendingAccept, allowLockAgain, isNative } from '../native/capacitor';

// ─────────────────────────────────────────────────────────────────────────────
// ZƏNG MOTORU: Agora (SD-RTN qlobal şəbəkə).
// Köhnə əl-WebRTC (offer/answer/ICE + tək uzaq TURN) atıldı — "bəzən gəlir, bəzən
// gəlmir, tək tərəfli, gecikir" probleminin kökü o idi. İndi media Agora-nın qlobal
// serverlərindən keçir → NAT problemi yox, gecikmə minimum, peşəkar səs motoru.
//
// Socket YALNIZ zəng İDARƏSİ üçün qalır: invite / accept / reject / end.
// Hər iki tərəf "active"-ə çatanda EYNİ Agora kanalına qoşulur (kanal adı 2 user id-dən
// deterministik düzəlir). Media-nı Agora aparır; biz publish/subscribe edirik.
// Kilid ekranı bildirişi + audio marşrutu (earpiece/speaker) əvvəlki kimi native-dir.
// ─────────────────────────────────────────────────────────────────────────────
// Agora SDK böyükdür (~1.5MB) — yalnız İLK zəngdə yüklə (app açılışı yüngül qalsın).
let _agoraPromise = null;
const getAgora = () => {
  if (!_agoraPromise) {
    _agoraPromise = import('agora-rtc-sdk-ng').then((m) => {
      const A = m.default || m;
      try { A.setLogLevel(2); } catch {} // 2 = WARNING (konsol spam-ı azalt)
      return A;
    });
  }
  return _agoraPromise;
};

// Hər iki tərəf üçün eyni kanal adı: id-ləri sırala + birləşdir (Agora charset: hex+_ OK).
const channelFor = (a, b) => [String(a), String(b)].sort().join('_').slice(0, 64);

const authToken = () => localStorage.getItem('token') || sessionStorage.getItem('token') || '';

// state: 'idle' | 'calling' | 'ringing' | 'active'
const CallSystem = forwardRef(({ socket, myId, partnerId, partnerName }, ref) => {
  const [state, setState] = useState('idle');
  const [kind, setKind] = useState('audio');
  const [remoteId, setRemoteId] = useState(null);
  const [remoteName, setRemoteName] = useState('');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  // Səs marşrutu: false = qulaq üstü dinamik (earpiece), true = ana (ucadan) dinamik.
  const [speakerOn, setSpeakerOn] = useState(false);
  const [remoteHasVideo, setRemoteHasVideo] = useState(false);
  const proximityStopRef = useRef(null);
  const [duration, setDuration] = useState(0);

  // Stable refs (event listener-lərdə stale closure-dan qaçmaq üçün)
  const stateRef = useRef(state);
  const kindRef = useRef(kind);
  const remoteIdRef = useRef(remoteId);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { kindRef.current = kind; }, [kind]);
  useEffect(() => { remoteIdRef.current = remoteId; }, [remoteId]);

  // ── Agora refs ──
  const clientRef = useRef(null);      // AgoraRTC client
  const micTrackRef = useRef(null);    // local mikrofon track
  const camTrackRef = useRef(null);    // local kamera track (yalnız video)
  const remoteUserRef = useRef(null);  // qarşı tərəfin Agora user-i (video play üçün)
  const localVideoRef = useRef(null);  // local video konteyner (div — Agora ora render edir)
  const remoteVideoRef = useRef(null); // remote video konteyner (div)

  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);    // ringtone üçün Web Audio context
  const ringRef = useRef(null);        // aktiv ringtone interval-i
  const reInviteRef = useRef(null);    // çıxan zəng: dəvəti təkrar göndərmə
  const noAnswerRef = useRef(null);    // çıxan zəng: cavab yoxdursa avtomatik bitirmə

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Ringtone (Web Audio — fayl lazım deyil) ───
  const stopRing = () => {
    if (ringRef.current) { try { ringRef.current.stop(); } catch {} ringRef.current = null; }
    try { stopNativeRingtone(); } catch {}
    try { if (navigator.vibrate) navigator.vibrate(0); } catch {}
  };
  const playRing = (mode) => {
    stopRing();
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = audioCtxRef.current || new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      const beep = (freq, dur, vol = 0.18) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + dur + 0.03);
      };
      let timer;
      if (mode === 'outgoing') {
        const tick = () => { beep(440, 1.0, 0.13); beep(480, 1.0, 0.11); };
        tick(); timer = setInterval(tick, 3000);
      } else {
        const ring = () => {
          beep(660, 0.4, 0.18);
          setTimeout(() => beep(880, 0.4, 0.18), 300);
          setTimeout(() => beep(660, 0.4, 0.18), 600);
          try { if (navigator.vibrate) navigator.vibrate([400, 200, 400]); } catch {}
        };
        ring(); timer = setInterval(ring, 2000);
      }
      ringRef.current = { stop: () => { clearInterval(timer); } };
    } catch {}
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  // ── Agora kanalını tərk et + bütün track-ləri bağla ──
  const leaveAgora = () => {
    try { if (micTrackRef.current) micTrackRef.current.close(); } catch {}
    try { if (camTrackRef.current) camTrackRef.current.close(); } catch {}
    micTrackRef.current = null;
    camTrackRef.current = null;
    remoteUserRef.current = null;
    const c = clientRef.current;
    clientRef.current = null;
    if (c) {
      try { c.removeAllListeners(); } catch {}
      // unpublish + leave — fire-and-forget (cleanup sinxron olmalıdır)
      Promise.resolve().then(async () => {
        try { await c.unpublish(); } catch {}
        try { await c.leave(); } catch {}
      });
    }
  };

  // === Hard cleanup — bütün resursları azad et ===
  const cleanup = () => {
    stopRing();
    if (isNative) { dismissIncomingCall(); allowLockAgain(); }
    if (reInviteRef.current) { clearInterval(reInviteRef.current); reInviteRef.current = null; }
    if (noAnswerRef.current) { clearTimeout(noAnswerRef.current); noAnswerRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    leaveAgora();
    stopCallAudio();
    if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
    setState('idle');
    setKind('audio');
    setRemoteId(null);
    setRemoteName('');
    setDuration(0);
    setMuted(false);
    setCamOff(false);
    setRemoteHasVideo(false);
  };

  // Komponent unmount-da da hard cleanup
  useEffect(() => () => cleanup(), []);

  // Remote video hazır olanda konteynerə render et
  useEffect(() => {
    if (state === 'active' && kind === 'video' && remoteHasVideo && remoteUserRef.current && remoteUserRef.current.videoTrack && remoteVideoRef.current) {
      try { remoteUserRef.current.videoTrack.play(remoteVideoRef.current); } catch {}
    }
  }, [state, kind, remoteHasVideo]);

  // Ringtone — vəziyyətə görə
  useEffect(() => {
    if (state === 'calling') {
      playRing('outgoing');
    } else if (state === 'ringing') {
      if (isNative) {
        playNativeRingtone().then((ok) => { if (!ok) playRing('incoming'); });
        try { if (navigator.vibrate) navigator.vibrate([600, 400, 600, 400]); } catch {}
      } else {
        playRing('incoming');
      }
    } else {
      stopRing();
      stopNativeRingtone();
      if (isNative) dismissIncomingCall();
    }
  }, [state]);

  // Aktiv zəngdə SƏS MARŞRUTU (native AudioManager — Agora-nın səsi də bu marşrutdan keçir).
  // VİDEO → ana (ucadan) dinamik. SƏSLİ → earpiece + proximity + spiker düyməsi.
  useEffect(() => {
    if (state !== 'active') return;
    startCallAudio(); // MODE_IN_COMMUNICATION

    if (kindRef.current === 'video') {
      setSpeakerOn(true);
      setSpeakerphone(true);
      return () => { stopCallAudio(); };
    }

    setSpeakerOn(false);
    setSpeakerphone(false);
    proximityStopRef.current = startProximity((near) => {
      if (near) { setSpeakerphone(false); setSpeakerOn(false); }
    });
    return () => {
      if (proximityStopRef.current) { proximityStopRef.current(); proximityStopRef.current = null; }
      stopCallAudio();
    };
  }, [state]);

  // Native gələn zəng ekranındakı Cavabla/Rədd et → web zəngini idarə et
  useEffect(() => {
    const off = onCallAction((action) => {
      if (action === 'accept') doAccept();
      else if (action === 'decline') {
        if (socket && remoteIdRef.current) socket.emit('call:reject', { to: remoteIdRef.current });
        cleanup();
      }
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  // ── Agora kanalına qoşul + mikrofon/kamera publish et ──
  const joinAgora = async (callKind, peerId) => {
    // Gələn-zəng səsi/ekranı qəti sönsün (qulağa sızmasın, audio fokusu toqquşmasın)
    if (isNative) { try { stopNativeRingtone(); dismissIncomingCall(); } catch {} }

    const channel = channelFor(myId, peerId);
    let cfg = null;
    try {
      const r = await fetch(`${API_URL}/api/agora/token?channel=${encodeURIComponent(channel)}&uid=0`, {
        headers: { Authorization: `Bearer ${authToken()}` },
      });
      cfg = await r.json().catch(() => ({}));
      if (!r.ok || !cfg.appId || !cfg.token) throw new Error(cfg.message || 'token');
    } catch (e) {
      toast.error('Zəng xidmətinə qoşulmaq alınmadı.');
      cleanup();
      return;
    }

    const AgoraRTC = await getAgora();
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      if (clientRef.current !== client) return;
      try {
        await client.subscribe(user, mediaType);
        if (mediaType === 'audio') {
          try { user.audioTrack && user.audioTrack.play(); } catch {}
        }
        if (mediaType === 'video') {
          remoteUserRef.current = user;
          setRemoteHasVideo(true);
        }
      } catch {}
    });
    client.on('user-unpublished', (user, mediaType) => {
      if (mediaType === 'video') setRemoteHasVideo(false);
    });
    client.on('user-left', () => {
      toast.info('Qarşı tərəf zəngi bitirdi.');
      cleanup();
    });

    try {
      await client.join(cfg.appId, channel, cfg.token, cfg.uid || null);
      const mic = await AgoraRTC.createMicrophoneAudioTrack({ AEC: true, ANS: true, AGC: true });
      micTrackRef.current = mic;
      const toPublish = [mic];
      if (callKind === 'video') {
        const cam = await AgoraRTC.createCameraVideoTrack({ encoderConfig: '480p_1' });
        camTrackRef.current = cam;
        toPublish.push(cam);
        if (localVideoRef.current) { try { cam.play(localVideoRef.current, { mirror: true }); } catch {} }
      }
      await client.publish(toPublish);
    } catch (e) {
      toast.error(callKind === 'video' ? 'Kamera/mikrofon açılmadı.' : 'Mikrofon açılmadı.');
      cleanup();
    }
  };

  // Callee tərəf qəbul edir (UI düyməsi / native ekran / app-bağlı pending accept — hamısı bura)
  const doAccept = () => {
    const peerId = remoteIdRef.current;
    if (!peerId || !socket || stateRef.current !== 'ringing') return;
    socket.emit('call:accept', { to: peerId });
    setState('active');
    startTimer();
    joinAgora(kindRef.current, peerId);
  };

  // === Imperative API (parent-dən çağrılır) ===
  useImperativeHandle(ref, () => ({
    startCall: (k, pId, pName) => {
      const targetId = pId || partnerId;
      const targetName = pName || partnerName;
      if (stateRef.current !== 'idle' || !targetId || !socket) return;
      setKind(k);
      setRemoteId(targetId);
      setRemoteName(targetName || 'İstifadəçi');
      setState('calling');
      socket.emit('call:invite', { to: targetId, kind: k });
      if (reInviteRef.current) clearInterval(reInviteRef.current);
      reInviteRef.current = setInterval(() => {
        if (stateRef.current === 'calling') socket.emit('call:invite', { to: targetId, kind: k });
        else { clearInterval(reInviteRef.current); reInviteRef.current = null; }
      }, 4000);
      if (noAnswerRef.current) clearTimeout(noAnswerRef.current);
      noAnswerRef.current = setTimeout(() => {
        if (stateRef.current === 'calling') { toast.info('Cavab vermədi.'); hangup(); }
      }, 60000);
    },
  }));

  // === Socket listeners — yalnız zəng İDARƏSİ (media-nı Agora aparır) ===
  useEffect(() => {
    if (!socket) return;

    const onInvite = ({ from, kind: k, fromName }) => {
      if (stateRef.current !== 'idle') {
        if (from === remoteIdRef.current) return; // həmin nəfərdən re-invite → IGNORE
        socket.emit('call:reject', { to: from, reason: 'busy' });
        return;
      }
      const nk = k === 'video' ? 'video' : 'audio';
      const callerName = fromName || (partnerName && partnerId === from ? partnerName : 'EVDƏN zəng');
      setKind(nk);
      setRemoteId(from);
      setRemoteName(callerName);
      setState('ringing');
      if (isNative) {
        showIncomingCall(callerName, nk);
        // App bağlı ikən bildirişdən "Cavabla" basılmışdısa → avtomatik qəbul et
        consumePendingAccept().then((acc) => {
          if (acc) {
            // remoteId/kind state-i təzə qoyulub; ref-lər növbəti tick-də hazır olur
            setTimeout(() => doAccept(), 0);
          }
        });
      }
    };

    const onAccept = ({ from }) => {
      if (stateRef.current !== 'calling' || from !== remoteIdRef.current) return;
      if (reInviteRef.current) { clearInterval(reInviteRef.current); reInviteRef.current = null; }
      if (noAnswerRef.current) { clearTimeout(noAnswerRef.current); noAnswerRef.current = null; }
      setState('active');
      startTimer();
      joinAgora(kindRef.current, from);
    };

    const onReject = ({ from, reason }) => {
      if (from !== remoteIdRef.current) return;
      toast.info(reason === 'busy' ? 'İstifadəçi məşğuldur.' : 'Zəng rədd edildi.');
      cleanup();
    };

    const onUnavailable = () => { /* zəng çalmağa davam etsin (push gedir, re-invite var) */ };

    const onEnd = ({ from }) => {
      if (from !== remoteIdRef.current) return;
      toast.info('Qarşı tərəf zəngi bitirdi.');
      cleanup();
    };

    socket.on('call:invite', onInvite);
    socket.on('call:accept', onAccept);
    socket.on('call:reject', onReject);
    socket.on('call:unavailable', onUnavailable);
    socket.on('call:end', onEnd);

    return () => {
      socket.off('call:invite', onInvite);
      socket.off('call:accept', onAccept);
      socket.off('call:reject', onReject);
      socket.off('call:unavailable', onUnavailable);
      socket.off('call:end', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const accept = () => doAccept();
  const reject = () => { if (remoteId) socket.emit('call:reject', { to: remoteId }); cleanup(); };
  const hangup = () => { if (remoteId) socket.emit('call:end', { to: remoteId }); cleanup(); };

  const toggleMute = () => {
    const next = !muted;
    try { if (micTrackRef.current) micTrackRef.current.setMuted(next); } catch {}
    setMuted(next);
  };
  const toggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    setSpeakerphone(next);
  };
  const toggleCam = () => {
    const next = !camOff;
    try { if (camTrackRef.current) camTrackRef.current.setEnabled(!next); } catch {}
    setCamOff(next);
  };

  if (state === 'idle') return null;

  const isVideo = kind === 'video';
  const isCalling = state === 'calling';
  const isRinging = state === 'ringing';
  const isActive = state === 'active';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      {/* Remote GÖRÜNTÜ — Agora bu konteynerə render edir (yalnız görüntülü aktiv zaman) */}
      {isVideo && (
        <div ref={remoteVideoRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', background: '#000', display: isActive ? 'block' : 'none' }} />
      )}

      {/* Local video preview — Agora bu konteynerə render edir */}
      {isVideo && isActive && (
        <div ref={localVideoRef}
          style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 16, width: 'clamp(96px, 28vw, 140px)', height: 'clamp(128px, 37vw, 186px)', objectFit: 'cover', borderRadius: 12, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: '#0f172a', overflow: 'hidden', zIndex: 1 }} />
      )}

      {/* Üst informasiya overlay (video çağrı aktivdə) */}
      {isVideo && isActive && (
        <div style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', left: 16, maxWidth: '55vw', background: 'rgba(0,0,0,0.55)', padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700, zIndex: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {remoteName} · {fmtTime(duration)}
        </div>
      )}

      {/* Səsli zəng / yığma / cavab gözləmə UI */}
      {(!isVideo || !isActive) && (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: isCalling || isRinging ? 'callPulse 1.6s infinite' : 'none' }}>
            <User size={64} color="white" />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 800 }}>{remoteName}</h2>
          <p style={{ margin: 0, opacity: 0.75, fontSize: 14 }}>
            {isCalling && (isVideo ? 'Görüntülü zəng edilir...' : 'Zəng edilir...')}
            {isRinging && (isVideo ? 'Görüntülü zəng' : 'Sizə zəng edir...')}
            {isActive && fmtTime(duration)}
          </p>
        </div>
      )}

      {/* Düymələr */}
      <div style={{ position: 'absolute', bottom: 'calc(28px + env(safe-area-inset-bottom))', left: 0, right: 0, display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 'clamp(14px, 5vw, 22px)', padding: '0 16px', zIndex: 2 }}>
        {isRinging && (
          <>
            <button onClick={reject} style={btnRed}><PhoneOff size={26} /></button>
            <button onClick={accept} style={btnGreen}>{isVideo ? <Video size={26} /> : <Phone size={26} />}</button>
          </>
        )}

        {isCalling && (
          <button onClick={hangup} style={btnRed}><PhoneOff size={26} /></button>
        )}

        {isActive && (
          <>
            <button onClick={toggleMute} title={muted ? 'Səssizliyi aç' : 'Səssiz et'} style={btnGray(muted)}>
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            {!isVideo && (
              <button onClick={toggleSpeaker} title={speakerOn ? 'Ucadan dinamik (açıq)' : 'Qulaq dinamiki'}
                style={{ ...btnBase, background: speakerOn ? 'rgba(255,255,255,0.38)' : 'rgba(255,255,255,0.18)' }}>
                {speakerOn ? <Volume2 size={22} /> : <Volume1 size={22} />}
              </button>
            )}
            {isVideo && (
              <button onClick={toggleCam} title={camOff ? 'Kameranı aç' : 'Kameranı bağla'} style={btnGray(camOff)}>
                {camOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            )}
            <button onClick={hangup} title="Bitir" style={btnRed}><PhoneOff size={26} /></button>
          </>
        )}
      </div>

      <style>{`
        @keyframes callPulse {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); }
          70% { box-shadow: 0 0 0 25px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>
    </div>
  );
});

const btnBase = { width: 'clamp(54px, 16vw, 64px)', height: 'clamp(54px, 16vw, 64px)', flexShrink: 0, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: '0.2s', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' };
const btnGreen = { ...btnBase, background: '#14224F' };
const btnRed = { ...btnBase, background: '#ef4444' };
const btnGray = (active) => ({ ...btnBase, background: active ? '#ef4444' : 'rgba(255,255,255,0.18)' });

export default CallSystem;
