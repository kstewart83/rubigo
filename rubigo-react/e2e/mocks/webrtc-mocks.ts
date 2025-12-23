/**
 * WebRTC Mocks for E2E Testing
 *
 * This script is injected into the browser context to mock WebRTC APIs,
 * enabling E2E tests of the Screen Share module without requiring actual
 * screen capture permissions or a running SFU.
 */

// Configuration for mock behavior
export const MOCK_CONFIG = {
    roomId: "mock-room-" + Date.now(),
    iceGatheringDelay: 10,
    trackDelay: 50,
};

/**
 * Script to inject into browser context via page.addInitScript()
 * This creates mock versions of RTCPeerConnection, MediaStream, etc.
 */
export function getWebRTCMockScript(): string {
    return `
(function() {
    console.log('[WebRTC Mock] Installing WebRTC mocks...');

    // Store original constructors for potential passthrough
    const OriginalRTCPeerConnection = window.RTCPeerConnection;
    const OriginalMediaStream = window.MediaStream;

    // Mock MediaStreamTrack
    class MockMediaStreamTrack {
        constructor(kind = 'video') {
            this.id = 'mock-track-' + Math.random().toString(36).substr(2, 9);
            this.kind = kind;
            this.label = kind === 'video' ? 'Mock Screen Share' : 'Mock Audio';
            this.muted = false;
            this.readyState = 'live';
            this.enabled = true;
            this._listeners = {};
        }

        stop() {
            this.readyState = 'ended';
            this._emit('ended');
        }

        clone() {
            return new MockMediaStreamTrack(this.kind);
        }

        getCapabilities() { return {}; }
        getConstraints() { return {}; }
        getSettings() {
            return this.kind === 'video'
                ? { width: 1920, height: 1080, frameRate: 30 }
                : { sampleRate: 48000, channelCount: 2 };
        }

        addEventListener(event, handler) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(handler);
        }

        removeEventListener(event, handler) {
            if (this._listeners[event]) {
                this._listeners[event] = this._listeners[event].filter(h => h !== handler);
            }
        }

        _emit(event) {
            if (this._listeners[event]) {
                this._listeners[event].forEach(h => h());
            }
            if (this['on' + event]) {
                this['on' + event]();
            }
        }
    }

    // Mock MediaStream
    class MockMediaStream {
        constructor(tracks = []) {
            this.id = 'mock-stream-' + Math.random().toString(36).substr(2, 9);
            this._tracks = tracks.length > 0 ? tracks : [new MockMediaStreamTrack('video')];
            this.active = true;
        }

        getTracks() { return this._tracks; }
        getVideoTracks() { return this._tracks.filter(t => t.kind === 'video'); }
        getAudioTracks() { return this._tracks.filter(t => t.kind === 'audio'); }

        addTrack(track) { this._tracks.push(track); }
        removeTrack(track) {
            this._tracks = this._tracks.filter(t => t.id !== track.id);
        }

        clone() {
            return new MockMediaStream(this._tracks.map(t => t.clone()));
        }
    }

    // Mock RTCPeerConnection
    class MockRTCPeerConnection {
        constructor(config) {
            console.log('[WebRTC Mock] Creating MockRTCPeerConnection');
            this._config = config;
            this._localDescription = null;
            this._remoteDescription = null;
            this._transceivers = [];
            this._tracks = [];
            this._iceGatheringState = 'new';
            this._iceConnectionState = 'new';
            this._connectionState = 'new';
            this._signalingState = 'stable';

            // Event handlers
            this.ontrack = null;
            this.onicecandidate = null;
            this.onicegatheringstatechange = null;
            this.oniceconnectionstatechange = null;
            this.onconnectionstatechange = null;
            this.onsignalingstatechange = null;
        }

        get localDescription() { return this._localDescription; }
        get remoteDescription() { return this._remoteDescription; }
        get iceGatheringState() { return this._iceGatheringState; }
        get iceConnectionState() { return this._iceConnectionState; }
        get connectionState() { return this._connectionState; }
        get signalingState() { return this._signalingState; }

        addTrack(track, stream) {
            console.log('[WebRTC Mock] addTrack called');
            this._tracks.push({ track, stream });
            return { track };
        }

        addTransceiver(trackOrKind, init) {
            console.log('[WebRTC Mock] addTransceiver called:', trackOrKind);
            const transceiver = {
                mid: String(this._transceivers.length),
                direction: init?.direction || 'sendrecv',
                sender: { track: null },
                receiver: { track: new MockMediaStreamTrack(typeof trackOrKind === 'string' ? trackOrKind : trackOrKind.kind) },
            };
            this._transceivers.push(transceiver);
            return transceiver;
        }

        async createOffer() {
            console.log('[WebRTC Mock] createOffer called');
            this._signalingState = 'have-local-offer';
            return {
                type: 'offer',
                sdp: this._generateMockSDP('offer'),
            };
        }

        async createAnswer() {
            console.log('[WebRTC Mock] createAnswer called');
            return {
                type: 'answer',
                sdp: this._generateMockSDP('answer'),
            };
        }

        async setLocalDescription(desc) {
            console.log('[WebRTC Mock] setLocalDescription:', desc.type);
            this._localDescription = desc;

            // Simulate ICE gathering
            setTimeout(() => {
                this._iceGatheringState = 'gathering';
                this._emit('icegatheringstatechange');

                setTimeout(() => {
                    this._iceGatheringState = 'complete';
                    this._emit('icegatheringstatechange');
                }, 10);
            }, 10);
        }

        async setRemoteDescription(desc) {
            console.log('[WebRTC Mock] setRemoteDescription:', desc.type);
            this._remoteDescription = desc;
            this._signalingState = 'stable';
            this._connectionState = 'connected';
            this._iceConnectionState = 'connected';

            // Emit track events for viewers (when receiving answer with video)
            // Check if we have recvonly transceivers (viewer mode)
            const hasRecvTransceiver = this._transceivers.some(t => t.direction === 'recvonly');

            if (hasRecvTransceiver && desc.type === 'answer') {
                console.log('[WebRTC Mock] Viewer mode detected, emitting track event');
                setTimeout(() => {
                    const mockTrack = new MockMediaStreamTrack('video');
                    const mockStream = new MockMediaStream([mockTrack]);

                    if (this.ontrack) {
                        this.ontrack({
                            track: mockTrack,
                            streams: [mockStream],
                            receiver: { track: mockTrack },
                            transceiver: this._transceivers[0],
                        });
                    }
                }, 50);
            }
        }

        close() {
            console.log('[WebRTC Mock] close called');
            this._connectionState = 'closed';
            this._iceConnectionState = 'closed';
            this._signalingState = 'closed';
        }

        getTransceivers() { return this._transceivers; }
        getSenders() { return this._tracks.map(t => ({ track: t.track })); }
        getReceivers() { return this._transceivers.map(t => t.receiver); }

        _generateMockSDP(type) {
            // Minimal valid-looking SDP
            const sessionId = Date.now();
            return [
                'v=0',
                'o=- ' + sessionId + ' 2 IN IP4 127.0.0.1',
                's=-',
                't=0 0',
                'a=group:BUNDLE 0',
                'm=video 9 UDP/TLS/RTP/SAVPF 96',
                'c=IN IP4 0.0.0.0',
                'a=rtcp:9 IN IP4 0.0.0.0',
                'a=ice-ufrag:mock',
                'a=ice-pwd:mockpassword12345678901234',
                'a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99',
                'a=setup:' + (type === 'offer' ? 'actpass' : 'active'),
                'a=mid:0',
                'a=rtpmap:96 VP8/90000',
                type === 'offer' ? 'a=sendrecv' : 'a=recvonly',
                '',
            ].join('\\r\\n');
        }

        _emit(event) {
            const handler = this['on' + event];
            if (handler) handler();
        }
    }

    // Override navigator.mediaDevices.getDisplayMedia
    const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia?.bind(navigator.mediaDevices);

    navigator.mediaDevices.getDisplayMedia = async function(constraints) {
        console.log('[WebRTC Mock] getDisplayMedia called');

        // Create a mock stream with a video track
        const mockStream = new MockMediaStream([new MockMediaStreamTrack('video')]);

        // Mark as mock for testing
        mockStream._isMock = true;

        return mockStream;
    };

    // Install global mocks
    window.RTCPeerConnection = MockRTCPeerConnection;
    window.webkitRTCPeerConnection = MockRTCPeerConnection;
    window.MediaStream = MockMediaStream;

    // Mark that mocks are installed
    window.__WEBRTC_MOCKS_INSTALLED__ = true;

    console.log('[WebRTC Mock] WebRTC mocks installed successfully');
})();
`;
}

/**
 * Script to create a visible fake video stream using canvas
 * This is optional - provides a visual indicator that mocks are working
 */
export function getCanvasVideoScript(): string {
    return `
(function() {
    window.__createMockVideoElement = function(videoElement) {
        // Create a canvas to generate fake video frames
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');

        let frame = 0;
        function drawFrame() {
            // Draw a test pattern
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Animated circle
            ctx.beginPath();
            ctx.arc(
                canvas.width / 2 + Math.sin(frame * 0.05) * 100,
                canvas.height / 2,
                50,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = '#4ade80';
            ctx.fill();

            // Text
            ctx.fillStyle = '#fff';
            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Mock Screen Share', canvas.width / 2, 50);
            ctx.font = '16px sans-serif';
            ctx.fillText('Frame: ' + frame, canvas.width / 2, canvas.height - 30);

            frame++;
            if (videoElement.isConnected) {
                requestAnimationFrame(drawFrame);
            }
        }

        // Convert canvas to stream and set as video source
        const stream = canvas.captureStream(30);
        videoElement.srcObject = stream;
        drawFrame();
    };
})();
`;
}
