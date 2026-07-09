import React, { useEffect, useRef, useState } from 'react';
import { Channel } from '../../types';
import { useWebRTCStore } from '../../store/webrtcStore';
import { useAuthStore } from '../../store/authStore';
import { useCallStore } from '../../store/callStore';
import { useUserStore } from '../../store/userStore';
import { Mic, MicOff, Video, VideoOff, PhoneOff, MonitorUp, BellRing } from 'lucide-react';
import { cn, getInitials } from '../../lib/utils';
import { useUIStore } from '../../store/uiStore';

interface Props {
  channel: Channel;
}

export function ActiveVoiceChannel({ channel }: Props) {
  const { joinRoom, leaveRoom, streams, participants, audioEnabled, videoEnabled, toggleAudio, toggleVideo, roomId } = useWebRTCStore();
  const { ringServer } = useCallStore();
  const { user } = useAuthStore();
  const { setActiveChannel } = useUIStore();

  useEffect(() => {
    // Only join if we aren't already in this room
    if (roomId !== channel.id) {
      joinRoom(channel.id);
      ringServer(channel.groupId, channel.id);
    }
  }, [channel.id, roomId, joinRoom, ringServer, channel.groupId]);

  const handleDisconnect = () => {
    leaveRoom();
    setActiveChannel(null);
  };

  const participantEntries = Object.entries(streams);

  return (
    <div className="flex-1 flex flex-col bg-transparent relative z-0">
      {/* Video Grid */}
      <div className="flex-1 p-4 grid gap-4 place-content-center overflow-hidden" 
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(${participantEntries.length > 1 ? '300px' : '600px'}, 1fr))`
        }}
      >
        {participantEntries.map(([peerId, stream]) => {
          const isLocal = peerId === 'local';
          const isMuted = isLocal ? !audioEnabled : !!participants[peerId]?.muted;
          return (
            <VideoTile key={peerId} peerId={peerId} stream={stream} isLocal={isLocal} isMuted={isMuted} />
          );
        })}
        {participantEntries.length === 0 && (
          <div className="text-white text-center">Connecting to voice...</div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="h-24 bg-white/5 backdrop-blur-xl border-t border-white/10 flex items-center justify-center gap-6 px-4 pb-2 shadow-2xl z-10">
        <ControlButton 
          onClick={toggleVideo} 
          icon={videoEnabled ? Video : VideoOff} 
          label={videoEnabled ? "Turn Off Camera" : "Turn On Camera"} 
          active={!videoEnabled}
        />
        <ControlButton 
          onClick={toggleAudio} 
          icon={audioEnabled ? Mic : MicOff} 
          label={audioEnabled ? "Mute" : "Unmute"} 
          active={!audioEnabled}
        />
        <ControlButton 
          onClick={() => ringServer(channel.groupId, channel.id)} 
          icon={BellRing} 
          label="Ring Everyone" 
          special
        />
        <ControlButton 
          onClick={handleDisconnect} 
          icon={PhoneOff} 
          label="Disconnect" 
          danger
        />
      </div>
    </div>
  );
}

function VideoTile({ peerId, stream, isLocal, isMuted }: { peerId: string, stream: MediaStream, isLocal: boolean, isMuted: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { users, fetchUser } = useUserStore();
  const { user: currentUser } = useAuthStore();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    if (audioRef.current && !isLocal) {
      audioRef.current.srcObject = stream;
    }
    const checkVideo = () => setHasVideo(stream.getVideoTracks().length > 0 && stream.getVideoTracks()[0].enabled);
    checkVideo();
    
    const interval = setInterval(checkVideo, 1000);
    return () => clearInterval(interval);
  }, [stream, isLocal]);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let rafId: number;

    const checkAudio = () => {
      if (isMuted) {
        setIsSpeaking(false);
        rafId = requestAnimationFrame(checkAudio);
        return;
      }
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0 || !audioTracks[0].enabled) {
         setIsSpeaking(false);
         rafId = requestAnimationFrame(checkAudio);
         return;
      }
      
      try {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          analyser = audioCtx.createAnalyser();
          analyser.minDecibels = -70;
          analyser.smoothingTimeConstant = 0.2;
          
          source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
        }
        
        if (audioCtx.state === 'running' && analyser) {
          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(dataArray);
          const maxVol = Math.max(...Array.from(dataArray));
          
          setIsSpeaking(maxVol > 30);
        }
      } catch (e) {
        // ignore
      }

      rafId = requestAnimationFrame(checkAudio);
    };

    rafId = requestAnimationFrame(checkAudio);

    return () => {
      cancelAnimationFrame(rafId);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [stream, isMuted]);

  useEffect(() => {
    if (!isLocal && !users[peerId]) {
      fetchUser(peerId);
    }
  }, [peerId, isLocal, users, fetchUser]);

  const displayUser = isLocal ? currentUser : users[peerId];
  const displayName = displayUser?.displayName || (isLocal ? 'You' : `User ${peerId.substring(0,4)}`);
  const initials = getInitials(displayName);

  return (
    <div className={cn(
      "relative bg-zinc-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center group shadow-2xl transition-all duration-300",
      isSpeaking ? "border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]" : "border border-white/10"
    )}>
      {!isLocal && <audio ref={audioRef} autoPlay />}
      {hasVideo ? (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted={isLocal} 
          className="w-full h-full object-cover" 
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className={cn("w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg overflow-hidden transition-all duration-300",
            isSpeaking && "shadow-[0_0_20px_rgba(34,197,94,0.4)] ring-4 ring-green-500"
          )}>
            {displayUser?.avatar ? <img src={displayUser.avatar} className="w-full h-full object-cover" /> : initials}
          </div>
        </div>
      )}
      
      {/* Name tag and Mute status */}
      <div className="absolute bottom-4 left-4 bg-black/60 px-4 py-2 rounded-lg text-white text-sm font-medium backdrop-blur-md border border-white/10 flex items-center gap-2">
        {displayName}
        {isMuted && <MicOff size={14} className="text-red-500" />}
      </div>
    </div>
  );
}

function ControlButton({ onClick, icon: Icon, label, active, danger, special }: any) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-105 active:scale-95",
        danger 
          ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/20" 
          : special
            ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
            : active 
              ? "bg-white text-black hover:bg-zinc-200" 
              : "bg-zinc-800 text-white hover:bg-zinc-700 border border-white/10"
      )}
    >
      <Icon size={24} />
    </button>
  );
}
