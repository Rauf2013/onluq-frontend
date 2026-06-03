import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, User } from 'lucide-react';
import { toast } from 'react-toastify';

const ICE = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
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

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const timerRef = useRef(null);
  const pendingIceRef = useRef([]);
  const remoteAudioRef = useRef(null);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
  };

  const cleanup = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    pendingIceRef.current = [];
    setState('idle');
    setKind('audio');
    setRemoteId(null);
    setRemoteName('');
    setDuration(0);
    setMuted(false);
    setCamOff(false);
  };

  const setupPeer = async (peerKind, peerId) => {
    const pc = new RTCPeerConnection(ICE);
    pcRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate && peerId) socket.emit('call:ice', { to: peerId, candidate: e.candidate });
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (peerKind === 'video' && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        // peer dropped → end on our side too
        setTimeout(() => { if (pcRef.current === pc) cleanup(); }, 500);
      }
    };

    const constraints = { audio: true, video: peerKind === 'video' };
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (e) {
      toast.error(peerKind === 'video' ? 'Kamera/Mikrofon icazəsi rədd edildi.' : 'Mikrofon icazəsi rədd edildi.');
      throw e;
    }
    localStreamRef.current = stream;
    if (peerKind === 'video' && localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    return pc;
  };

  const startAsCaller = async () => {
    try {
      const pc = await setupPeer(kind, remoteId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('call:offer', { to: remoteId, sdp: offer.sdp, type: offer.type });
      setState('active');
      startTimer();
    } catch { cleanup(); }
  };

  const startAsCallee = async (offerSdp, offerType, peerKind, peerId) => {
    try {
      const pc = await setupPeer(peerKind, peerId);
      await pc.setRemoteDescription({ type: offerType || 'offer', sdp: offerSdp });
      // pendingICE-ləri əlavə et
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

  // === Imperative API ===
  useImperativeHandle(ref, () => ({
    startCall: (k) => {
      if (state !== 'idle' || !partnerId || !socket) return;
      setKind(k);
      setRemoteId(partnerId);
      setRemoteName(partnerName || 'İstifadəçi');
      setState('calling');
      socket.emit('call:invite', { to: partnerId, kind: k });
    },
  }));

  // === Socket listeners ===
  useEffect(() => {
    if (!socket) return;

    const onInvite = ({ from, kind: k }) => {
      // Zəng zamanı yeni gələn zəngləri rədd et
      if (state !== 'idle') {
        socket.emit('call:reject', { to: from, reason: 'busy' });
        return;
      }
      setKind(k === 'video' ? 'video' : 'audio');
      setRemoteId(from);
      setRemoteName(partnerName && partnerId === from ? partnerName : 'Bilinməyən');
      setState('ringing');
    };

    const onAccept = async ({ from }) => {
      if (state !== 'calling' || from !== remoteId) return;
      await startAsCaller();
    };

    const onReject = ({ from, reason }) => {
      if (from !== remoteId) return;
      toast.info(reason === 'busy' ? 'İstifadəçi məşğuldur.' : 'Zəng rədd edildi.');
      cleanup();
    };

    const onUnavailable = ({ to }) => {
      if (to !== remoteId) return;
      toast.warn('İstifadəçi oflayndır.');
      cleanup();
    };

    const onOffer = async ({ from, sdp, type }) => {
      if (from !== remoteId) return;
      // Yalnız callee onOffer alır
      await startAsCallee(sdp, type, kind, from);
    };

    const onAnswer = async ({ from, sdp, type }) => {
      if (from !== remoteId || !pcRef.current) return;
      try {
        await pcRef.current.setRemoteDescription({ type: type || 'answer', sdp });
        for (const c of pendingIceRef.current) {
          try { await pcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch {}
        }
        pendingIceRef.current = [];
      } catch {}
    };

    const onIce = async ({ from, candidate }) => {
      if (from !== remoteId) return;
      if (pcRef.current && pcRef.current.remoteDescription) {
        try { await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch {}
      } else {
        pendingIceRef.current.push(candidate);
      }
    };

    const onEnd = ({ from }) => {
      if (from !== remoteId) return;
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
  }, [socket, state, remoteId, kind, partnerName, partnerId]);

  const accept = () => {
    socket.emit('call:accept', { to: remoteId });
    // setState stays 'ringing' till offer comes; UI shows "connecting"
  };
  const reject = () => {
    socket.emit('call:reject', { to: remoteId });
    cleanup();
  };
  const hangup = () => {
    if (remoteId) socket.emit('call:end', { to: remoteId });
    cleanup();
  };
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const next = !muted;
    localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = !next));
    setMuted(next);
  };
  const toggleCam = () => {
    if (!localStreamRef.current) return;
    const next = !camOff;
    localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = !next));
    setCamOff(next);
  };

  if (state === 'idle') return null;

  const isVideo = kind === 'video';
  const isCalling = state === 'calling';
  const isRinging = state === 'ringing';
  const isActive = state === 'active';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', zIndex: 3000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
      {/* Remote audio (gizli) */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Görüntülü aktiv */}
      {isVideo && isActive && (
        <>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
          <video ref={localVideoRef} autoPlay playsInline muted style={{ position: 'absolute', top: 20, right: 20, width: 140, height: 100, objectFit: 'cover', borderRadius: 12, border: '2px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', background: '#0f172a', zIndex: 1 }} />
          <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(0,0,0,0.5)', padding: '6px 14px', borderRadius: 999, fontSize: 14, fontWeight: 700 }}>{remoteName} · {fmtTime(duration)}</div>
        </>
      )}

      {/* Səsli və ya zəng vəziyyəti */}
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
      <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 18, padding: '0 20px', zIndex: 2 }}>
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

const btnBase = { width: 64, height: 64, borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', transition: '0.2s', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' };
const btnGreen = { ...btnBase, background: '#10b981' };
const btnRed = { ...btnBase, background: '#ef4444' };
const btnGray = (active) => ({ ...btnBase, background: active ? '#ef4444' : 'rgba(255,255,255,0.18)' });

export default CallSystem;
