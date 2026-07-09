import { db, auth } from './firebase';
import { collection, doc, addDoc, onSnapshot, query, where, setDoc, updateDoc, getDocs, deleteDoc, serverTimestamp, getDoc } from './firebase';

export class WebRTCManager {
  private roomId: string | null = null;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private onTrackCallback: (peerId: string, stream: MediaStream) => void;
  private onPeerDisconnectCallback: (peerId: string) => void;
  private unsubscribes: (() => void)[] = [];
  private participants: Set<string> = new Set();
  
  private onParticipantUpdateCallback: (peerId: string, data: any) => void;
  
  constructor(
    onTrack: (peerId: string, stream: MediaStream) => void,
    onPeerDisconnect: (peerId: string) => void,
    onParticipantUpdate: (peerId: string, data: any) => void
  ) {
    this.onTrackCallback = onTrack;
    this.onPeerDisconnectCallback = onPeerDisconnect;
    this.onParticipantUpdateCallback = onParticipantUpdate;
  }
  
  async joinRoom(roomId: string, isVideo: boolean = false) {
    if (this.roomId) await this.leaveRoom();
    this.roomId = roomId;
    
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    // Get local stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (e) {
      console.error("Error getting media:", e);
      // Create empty stream if denied
      this.localStream = new MediaStream();
    }
    
    // Ensure room exists
    const roomRef = doc(db, 'webrtc_rooms', roomId);
    await setDoc(roomRef, { lastActive: serverTimestamp() }, { merge: true });
    
    // Add self to participants subcollection
    const participantRef = doc(db, 'webrtc_rooms', roomId, 'participants', uid);
    await setDoc(participantRef, { joinedAt: serverTimestamp(), muted: false });
    
    // Listen for new participants to create offers
    const participantsRef = collection(db, 'webrtc_rooms', roomId, 'participants');
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach(change => {
        const peerId = change.doc.id;
        const data = change.doc.data();
        
        if (change.type === 'added' || change.type === 'modified') {
          this.onParticipantUpdateCallback(peerId, data);
        }
        
        if (peerId === uid) return;
        
        if (change.type === 'added') {
          this.participants.add(peerId);
          // If we joined BEFORE them, we should initiate the connection
          // Simple rule: lexically lower uid initiates
          if (uid < peerId) {
            this.initiateConnection(peerId);
          }
        } else if (change.type === 'removed') {
          this.participants.delete(peerId);
          this.handlePeerDisconnect(peerId);
          this.onParticipantUpdateCallback(peerId, null);
        }
      });
    });
    this.unsubscribes.push(unsubParticipants);
    
    // Listen for signals directed at me
    const signalsRef = collection(db, 'webrtc_rooms', roomId, 'signals');
    const q = query(signalsRef, where('targetId', '==', uid));
    const unsubSignals = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          await this.handleSignal(change.doc.id, data);
          // Delete signal after processing
          deleteDoc(change.doc.ref);
        }
      });
    });
    this.unsubscribes.push(unsubSignals);
  }
  
  private async initiateConnection(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    this.sendSignal(peerId, 'offer', JSON.stringify(offer));
  }
  
  private createPeerConnection(peerId: string) {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }
    
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    });
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream!));
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, 'candidate', JSON.stringify(event.candidate));
      }
    };
    
    pc.ontrack = (event) => {
      this.onTrackCallback(peerId, event.streams[0]);
    };
    
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'closed') {
        this.handlePeerDisconnect(peerId);
      }
    };
    
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        this.sendSignal(peerId, 'offer', JSON.stringify(offer));
      } catch (err) {
        console.error('Error in renegotiation:', err);
      }
    };
    
    this.peerConnections.set(peerId, pc);
    return pc;
  }
  
  private async handleSignal(signalId: string, payload: any) {
    const { senderId, type, data } = payload;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    const pc = this.createPeerConnection(senderId);
    
    if (type === 'offer') {
      const offer = JSON.parse(data);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.sendSignal(senderId, 'answer', JSON.stringify(answer));
    } else if (type === 'answer') {
      const answer = JSON.parse(data);
      if (pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } else if (type === 'candidate') {
      const candidate = JSON.parse(data);
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }
  
  private async sendSignal(targetId: string, type: string, data: string) {
    if (!this.roomId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    
    await addDoc(collection(db, 'webrtc_rooms', this.roomId, 'signals'), {
      roomId: this.roomId,
      senderId: uid,
      targetId,
      type,
      data,
      createdAt: serverTimestamp()
    });
  }
  
  private handlePeerDisconnect(peerId: string) {
    const pc = this.peerConnections.get(peerId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(peerId);
    }
    this.onPeerDisconnectCallback(peerId);
  }
  
  getLocalStream() {
    return this.localStream;
  }
  
  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => track.enabled = enabled);
    }
    const uid = auth.currentUser?.uid;
    if (this.roomId && uid) {
      const participantRef = doc(db, 'webrtc_rooms', this.roomId, 'participants', uid);
      updateDoc(participantRef, { muted: !enabled }).catch(console.error);
    }
  }
  
  async toggleVideo(enabled: boolean) {
    if (!this.localStream) return;

    const videoTracks = this.localStream.getVideoTracks();
    
    if (enabled && videoTracks.length === 0) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
        const newVideoTrack = stream.getVideoTracks()[0];
        this.localStream.addTrack(newVideoTrack);
        
        // Add to all existing peer connections
        this.peerConnections.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(newVideoTrack);
          } else {
            pc.addTrack(newVideoTrack, this.localStream!);
            // Might need renegotiation if we add a track, but simple replace is better if possible. 
            // Since we didn't add it initially, addTrack triggers renegotiation.
          }
        });
        
        // For local UI update, we trigger a "fake" stream update or we assume the UI reacts to tracks changing.
        // The store handles the local stream state.
      } catch (e) {
        console.error("Failed to get video:", e);
      }
    } else {
      videoTracks.forEach(track => {
        track.enabled = enabled;
        if (!enabled) {
          // Optionally stop the track to release the camera light
          track.stop();
          this.localStream?.removeTrack(track);
        }
      });
      // If we stopped the track, we should also replace it with null in peer connections
      if (!enabled) {
        this.peerConnections.forEach((pc) => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            pc.removeTrack(videoSender);
          }
        });
      }
    }
  }
  
  async leaveRoom() {
    const uid = auth.currentUser?.uid;
    if (this.roomId && uid) {
      const participantRef = doc(db, 'webrtc_rooms', this.roomId, 'participants', uid);
      await deleteDoc(participantRef).catch(console.error);
    }
    
    this.unsubscribes.forEach(u => u());
    this.unsubscribes = [];
    
    this.peerConnections.forEach(pc => pc.close());
    this.peerConnections.clear();
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    this.roomId = null;
    this.participants.clear();
  }
}
