import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, User } from 'lucide-react';
import { toast } from 'react-toastify';

// ICE/TURN server konfiqurasiyası.
// ⚠ TURN ŞƏRTDİR: yalnız STUN ilə symmetric NAT (əksər mobil operatorlar, bəzi ev
// routerları) arxasında media (səs/görüntü) çata bilmir — "bəzən gəlir, bəzən gəlmir,
// tək tərəfli" probleminin əsl səbəbi budur. TURN relay olmadan P2P qurulmur.
// Dəyərlər build vaxtı env-dən oxunur (.env.production):
//   VITE_TURN_URLS=turn:host:3478,turns:host:5349   (vergüllə ayır)
//   VITE_TURN_USERNAME=...     VITE_TURN_CREDENTIAL=...
const buildIceServers = () => {
  const servers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  const turnUrls = (import.meta.env.VITE_TURN_URLS || '')
    .split(',').map((s) => s.trim()).filter(Boolean);
  if (turnUrls.length) {
    servers.push({
      urls: turnUrls,
      username: import.meta.env.VITE_TURN_USERNAME || '',
      credential: import.meta.env.VITE_TURN_CREDENTIAL || '',
    });
  }
  return servers;
};

const ICE = {
  iceServers: buildIceServers(),
  iceCandidatePoolSize: 10,
};

// state: 'idle' | 'calling' | 'ringing' | 'active'
const CallSystem = forwardRef(({ socket, myId, partnerId, partnerName }, ref) => {
  const [state, setState] = useState('idle');
  const [kind, setKind] = useState('audio');
  const [remoteId, setRemoteId] = useState(null);
  const [remoteName, setRemoteName] = useState('');
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  // Stable refs (event listener-lərdə stale closure-dan qaçmaq üçün)
  const stateRef = useRef(state);
  const kindRef = useRef(kind);
  const remoteIdRef = useRef(remoteId);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { kindRef.current = kind; }, [kind]);
  useEffect(() => { remoteIdRef.current = remoteId; }, [remoteId]);

  const pcRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null); // remote SƏS — həmişə (səsli + görüntülü çağrı)
  const remoteVideoRef = useRef(null); // remote GÖRÜNTÜ — yalnız görüntülü (MUTED → autoplay işləsin)
  const timerRef = useRef(null);
  const pendingIceRef = useRef([]);
  const audioCtxRef = useRef(null);    // ringtone üçün Web Audio context
  const ringRef = useRef(null);        // aktiv ringtone interval-i

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ─── Ringtone (Web Audio — fayl lazım deyil) ───
  const stopRing = () => {
    if (ringRef.current) { try { ringRef.current.stop(); } catch {} ringRef.current = null; }
    try { if (navigator.vibrate) navigator.vibrate(0); } catch {}
  };
  const playRing = (mode) => {
    // mode: 'outgoing' (zəng edirik — diiirt diiirt) | 'incoming' (bizə zəng gəlir — fərqli zəng)
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
        // "diiirt ... diiirt" — hər 2.4 san-də uzun ringback tonu
        const tick = () => beep(425, 0.9, 0.16);
        tick(); timer = setInterval(tick, 2400);
      } else {
        // gələn zəng — iki tonlu, daha diqqət çəkən + titrəyiş
        const tick = () => { beep(587, 0.3); setTimeout(() => beep(440, 0.3), 350); try { if (navigator.vibrate) navigator.vibrate([300, 200]); } catch {} };
        tick(); timer = setInterval(tick, 1600);
      }
      ringRef.current = { stop: () => { clearInterval(timer); } };
    } catch {}
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  // === Hard cleanup — bütün resursları azad et ===
  const stopAllTracks = (stream) => {
    if (!stream) return;
    try { stream.getTracks().forEach((t) => { try { t.stop(); } catch {} }); } catch {}
  };

  const cleanup = () => {
    stopRing();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // peer-in göndərənlərinin də tracklarını dayandır
    if (pcRef.current) {
      try {
        pcRef.current.getSenders().forEach((s) => { if (s.track) { try { s.track.stop(); } catch {} } });
        pcRef.current.getReceivers().forEach((r) => { if (r.track) { try { r.track.stop(); } catch {} } });
      } catch {}
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    setLocalStream((s) => { stopAllTracks(s); return null; });
    setRemoteStream((s) => { stopAllTracks(s); return null; });
    if (localVideoRef.current) { try { localVideoRef.current.srcObject = null; } catch {} }
    if (remoteAudioRef.current) { try { remoteAudioRef.current.srcObject = null; } catch {} }
    if (remoteVideoRef.current) { try { remoteVideoRef.current.srcObject = null; } catch {} }
    pendingIceRef.current = [];
    setState('idle');
    setKind('audio');
    setRemoteId(null);
    setRemoteName('');
    setDuration(0);
    setMuted(false);
    setCamOff(false);
  };

  // Komponent unmount-da da hard cleanup
  useEffect(() => () => cleanup(), []);

  // === Stream-i UI element-inə bağla (element render olunduqdan sonra) ===
  useEffect(() => {
    if (localStream && localVideoRef.current && kind === 'video') {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, kind, state]);

  // Remote stream-i SƏS (audio) və GÖRÜNTÜ (video) elementlərinə AYRICA bağla.
  // Video element MUTED-dir (səs ayrı <audio>-dan gəlir) — belə Android WebView
  // autoplay-i bloklamır və ortadakı böyük "play" overlay-i ÇIXMIR (sənin gördüyün bug).
  useEffect(() => {
    if (!remoteStream) return;
    const a = remoteAudioRef.current;
    if (a) {
      try { a.srcObject = remoteStream; const p = a.play(); if (p?.catch) p.catch(() => {}); } catch {}
    }
    if (kind === 'video') {
      const v = remoteVideoRef.current;
      if (v) {
        try { v.srcObject = remoteStream; const p = v.play(); if (p?.catch) p.catch(() => {}); } catch {}
      }
    }
  }, [remoteStream, kind, state]);

  // Ringtone — vəziyyətə görə: zəng edirik (outgoing), bizə zəng gəlir (incoming), digər → sus
  useEffect(() => {
    if (state === 'calling') playRing('outgoing');
    else if (state === 'ringing') playRing('incoming');
    else stopRing();
  }, [state]);

  // === Peer connection qur ===
  const setupPeer = async (peerKind, peerId) => {
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && peerId) socket.emit('call:ice', { to: peerId, candidate: e.candidate });
    };

    // ⚡ KRİTİK FIX: ontrack yalnız stream-i state-ə yaz, render olduqdan sonra srcObject useEffect-də qoşulur
    pc.ontrack = (e) => {
      const stream = e.streams[0];
      setRemoteStream(stream);
    };

    pc.onconnectionstatechange = () => {
      const st = pc.connectionState;
      if (['failed', 'disconnected', 'closed'].includes(st)) {
        if (pcRef.current === pc) {
          // Bir az gözlə — bəzən "disconnected" qısa müddətli olur (ICE restart-da gərək yox)
          setTimeout(() => {
            if (pcRef.current === pc && ['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
              cleanup();
            }
          }, 1500);
        }
      }
    };

    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: peerKind === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
    };
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      toast.error(peerKind === 'video' ? 'Kamera/Mikrofon icazəsi rədd edildi.' : 'Mikrofon icazəsi rədd edildi.');
      throw e;
    }
    setLocalStream(stream);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    return pc;
  };

  const startAsCaller = async () => {
    const peerId = remoteIdRef.current;
    const peerKind = kindRef.current;
    try {
      const pc = await setupPeer(peerKind, peerId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { to: peerId, sdp: offer.sdp, type: offer.type });
      setState('active');
      startTimer();
    } catch { cleanup(); }
  };

  const startAsCallee = async (offerSdp, offerType, peerKind, peerId) => {
    try {
      const pc = await setupPeer(peerKind, peerId);
      await pc.setRemoteDescription({ type: offerType || 'offer', sdp: offerSdp });
      for (const c of pendingIceRef.current) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }
      pendingIceRef.current = [];
      const ans = await pc.createAnswer();
      await pc.setLocalDescription(ans);
      socket.emit('call:answer', { to: peerId, sdp: ans.sdp, type: ans.type });
      setState('active');
      startTimer();
    } catch { cleanup(); }
  };

  // === Imperative API (parent-dən çağrılır) ===
  useImperativeHandle(ref, () => ({
    startCall: (k) => {
      if (stateRef.current !== 'idle' || !partnerId || !socket) return;
      setKind(k);
      setRemoteId(partnerId);
      setRemoteName(partnerName || 'İstifadəçi');
      setState('calling');
      socket.emit('call:invite', { to: partnerId, kind: k });
    },
  }));

  // === Socket listeners — STABIL, yalnız socket dəyişəndə re-subscribe ===
  useEffect(() => {
    if (!socket) return;

    const onInvite = ({ from, kind: k }) => {
      if (stateRef.current !== 'idle') {
        socket.emit('call:reject', { to: from, reason: 'busy' });
        return;
      }
      const nk = k === 'video' ? 'video' : 'audio';
      setKind(nk);
      setRemoteId(from);
      setRemoteName(partnerName && partnerId === from ? partnerName : 'Bilinməyən');
      setState('ringing');
    };

    const onAccept = async ({ from }) => {
      if (stateRef.current !== 'calling' || from !== remoteIdRef.current) return;
      await startAsCaller();
    };

    const onReject = ({ from, reason }) => {
      if (from !== remoteIdRef.current) return;
      toast.info(reason === 'busy' ? 'İstifadəçi məşğuldur.' : 'Zəng rədd edildi.');
      cleanup();
    };

    const onUnavailable = ({ to }) => {
      if (to !== remoteIdRef.current) return;
      toast.warn('İstifadəçi oflayndır.');
      cleanup();
    };

    const onOffer = async ({ from, sdp, type }) => {
      if (from !== remoteIdRef.current) return;
      await startAsCallee(sdp, type, kindRef.current, from);
    };

    const onAnswer = async ({ from, sdp, type }) => {
      if (from !== remoteIdRef.current || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription({ type: type || 'answer', sdp });
        for (const c of pendingIceRef.current) {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        pendingIceRef.current = [];
      } catch {}
    };

    const onIce = async ({ from, candidate }) => {
      if (from !== remoteIdRef.current) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      } else {
        pendingIceRef.current.push(candidate);
      }
    };

    const onEnd = ({ from }) => {
      if (from !== remoteIdRef.current) return;
      toast.info('Qarşı tərəf zəngi bitirdi.');
      cleanup();
    };

    socket.on('call:invite', onInvite);
    socket.on('call:accept', onAccept);
    socket.on('call:reject', onReject);
    socket.on('call:unavailable', onUnavailable);
    socket.on('call:offer', onOffer);
    socket.on('call:answer', onAnswer);
    socket.on('call:ice', onIce);
    socket.on('call:end', onEnd);

    return () => {
      socket.off('call:invite', onInvite);
      socket.off('call:accept', onAccept);
      socket.off('call:reject', onReject);
      socket.off('call:unavailable', onUnavailable);
      socket.off('call:offer', onOffer);
      socket.off('call:answer', onAnswer);
      socket.off('call:ice', onIce);
      socket.off('call:end', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const accept = () => socket.emit('call:accept', { to: remoteId });
  const reject = () => { socket.emit('call:reject', { to: remoteId }); cleanup(); };
  const hangup = () => { if (remoteId) socket.emit('call:end', { to: remoteId }); cleanup(); };
  const toggleMute = () => {
    if (!localStream) return;
    const next = !muted;
    localStream.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  };
  const toggleCam = () => {
    if (!localStream) return;
    const next = !camOff;
    localStream.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCamOff(next);
  };

  if (state === 'idle') return null;

  const isVideo = kind === 'video';
  const isCalling = state === 'calling';
  const isRinging = state === 'ringing';
  const isActive = state === 'active';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      {/* Remote SƏS — həmişə var (səsli + görüntülü çağrı). Gizli audio elementi. */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {/* Remote GÖRÜNTÜ — yalnız görüntülü çağrı. MUTED → autoplay işləyir, ortadakı böyük ▶ overlay çıxmır. */}
      {isVideo && (
        <video ref={remoteVideoRef} autoPlay playsInline muted
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000', display: isActive ? 'block' : 'none' }} />
      )}

      {/* Local video preview — yalnız görüntülü aktiv zaman */}
      {isVideo && isActive && (
        <video ref={localVideoRef} autoPlay playsInline muted
          style={{ position: 'absolute', top: 'calc(16px + env(safe-area-inset-top))', right: 16, width: 'clamp(96px, 28vw, 140px)', height: 'clamp(128px, 37vw, 186px)', objectFit: 'cover', borderRadius: 12, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: '#0f172a', zIndex: 1 }} />
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
