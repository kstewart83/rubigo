// Package main provides a WebRTC SFU for screen sharing.
// This handles media relay only - signaling is done via Next.js.
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/pion/interceptor"
	"github.com/pion/interceptor/pkg/intervalpli"
	"github.com/pion/webrtc/v4"
)

// Global room manager
var rooms = NewRoomManager()

// CORS middleware for development
func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// SDPExchange is the request/response format for SDP exchange
type SDPExchange struct {
	SDP  string `json:"sdp"`
	Type string `json:"type"`
}

// createPeerConnection creates a new peer connection with standard config
func createPeerConnection() (*webrtc.PeerConnection, error) {
	// Configure media engine
	mediaEngine := &webrtc.MediaEngine{}
	if err := mediaEngine.RegisterDefaultCodecs(); err != nil {
		return nil, fmt.Errorf("failed to register codecs: %w", err)
	}

	// Configure interceptors for RTCP handling
	interceptorRegistry := &interceptor.Registry{}
	if err := webrtc.RegisterDefaultInterceptors(mediaEngine, interceptorRegistry); err != nil {
		return nil, fmt.Errorf("failed to register interceptors: %w", err)
	}

	// Add PLI interceptor for keyframe requests
	intervalPliFactory, err := intervalpli.NewReceiverInterceptor()
	if err != nil {
		return nil, fmt.Errorf("failed to create PLI interceptor: %w", err)
	}
	interceptorRegistry.Add(intervalPliFactory)

	// Create API with configured engine
	api := webrtc.NewAPI(
		webrtc.WithMediaEngine(mediaEngine),
		webrtc.WithInterceptorRegistry(interceptorRegistry),
	)

	// Create peer connection
	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{URLs: []string{"stun:stun.l.google.com:19302"}},
		},
	}

	return api.NewPeerConnection(config)
}

// handleCreateRoom handles POST /internal/room
func handleCreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		RoomID string `json:"roomId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	if req.RoomID == "" {
		http.Error(w, "roomId required", http.StatusBadRequest)
		return
	}

	room := rooms.GetOrCreate(req.RoomID)
	_ = room // Room created/retrieved

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok", "roomId": req.RoomID})
}

// handlePublishWithID handles POST /internal/room/{id}/publish
// Broadcaster sends SDP offer, receives answer
func handlePublishWithID(w http.ResponseWriter, r *http.Request, roomID string) {

	var offer SDPExchange
	if err := json.NewDecoder(r.Body).Decode(&offer); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	room := rooms.GetOrCreate(roomID)

	// Create peer connection for broadcaster
	pc, err := createPeerConnection()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create peer connection: %v", err), http.StatusInternalServerError)
		return
	}

	// Add transceiver to receive video
	if _, err = pc.AddTransceiverFromKind(webrtc.RTPCodecTypeVideo); err != nil {
		http.Error(w, fmt.Sprintf("Failed to add transceiver: %v", err), http.StatusInternalServerError)
		return
	}

	// Handle incoming track from broadcaster
	pc.OnTrack(func(remoteTrack *webrtc.TrackRemote, receiver *webrtc.RTPReceiver) {
		log.Printf("[Room %s] Received track from broadcaster: %s", roomID, remoteTrack.Codec().MimeType)

		// Create local track for forwarding to viewers
		localTrack, err := webrtc.NewTrackLocalStaticRTP(
			remoteTrack.Codec().RTPCodecCapability,
			"video",
			"screen-share",
		)
		if err != nil {
			log.Printf("[Room %s] Failed to create local track: %v", roomID, err)
			return
		}

		room.SetBroadcasterTrack(localTrack)

		// Forward RTP packets from broadcaster to local track
		go func() {
			buf := make([]byte, 1500)
			for {
				n, _, err := remoteTrack.Read(buf)
				if err != nil {
					log.Printf("[Room %s] Broadcaster track ended: %v", roomID, err)
					room.SetBroadcasterTrack(nil)
					return
				}
				if _, err := localTrack.Write(buf[:n]); err != nil {
					// ErrClosedPipe is expected when no viewers
					continue
				}
			}
		}()
	})

	// Set remote description (offer from broadcaster)
	if err := pc.SetRemoteDescription(webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  offer.SDP,
	}); err != nil {
		http.Error(w, fmt.Sprintf("Failed to set remote description: %v", err), http.StatusBadRequest)
		return
	}

	// Create answer
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create answer: %v", err), http.StatusInternalServerError)
		return
	}

	// Gather ICE candidates
	gatherComplete := webrtc.GatheringCompletePromise(pc)
	if err := pc.SetLocalDescription(answer); err != nil {
		http.Error(w, fmt.Sprintf("Failed to set local description: %v", err), http.StatusInternalServerError)
		return
	}
	<-gatherComplete

	room.SetBroadcasterPC(pc)

	// Return answer with gathered ICE candidates
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SDPExchange{
		Type: "answer",
		SDP:  pc.LocalDescription().SDP,
	})
}

// handleSubscribeWithID handles POST /internal/room/{id}/subscribe
// Viewer sends SDP offer, receives answer with broadcaster's track
func handleSubscribeWithID(w http.ResponseWriter, r *http.Request, roomID string) {

	var offer SDPExchange
	if err := json.NewDecoder(r.Body).Decode(&offer); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	room := rooms.Get(roomID)
	if room == nil {
		http.Error(w, "Room not found", http.StatusNotFound)
		return
	}

	track := room.GetBroadcasterTrack()
	if track == nil {
		http.Error(w, "No broadcaster in room", http.StatusNotFound)
		return
	}

	// Create peer connection for viewer
	pc, err := createPeerConnection()
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create peer connection: %v", err), http.StatusInternalServerError)
		return
	}

	// Add broadcaster's track to viewer connection
	rtpSender, err := pc.AddTrack(track)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to add track: %v", err), http.StatusInternalServerError)
		return
	}

	// Handle RTCP packets from viewer
	go func() {
		buf := make([]byte, 1500)
		for {
			if _, _, err := rtpSender.Read(buf); err != nil {
				return
			}
		}
	}()

	// Set remote description (offer from viewer)
	if err := pc.SetRemoteDescription(webrtc.SessionDescription{
		Type: webrtc.SDPTypeOffer,
		SDP:  offer.SDP,
	}); err != nil {
		http.Error(w, fmt.Sprintf("Failed to set remote description: %v", err), http.StatusBadRequest)
		return
	}

	// Create answer
	answer, err := pc.CreateAnswer(nil)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create answer: %v", err), http.StatusInternalServerError)
		return
	}

	// Gather ICE candidates
	gatherComplete := webrtc.GatheringCompletePromise(pc)
	if err := pc.SetLocalDescription(answer); err != nil {
		http.Error(w, fmt.Sprintf("Failed to set local description: %v", err), http.StatusInternalServerError)
		return
	}
	<-gatherComplete

	room.AddViewer(pc)

	// Return answer
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(SDPExchange{
		Type: "answer",
		SDP:  pc.LocalDescription().SDP,
	})
}

// handleStatusWithID handles GET /internal/room/{id}/status
func handleStatusWithID(w http.ResponseWriter, r *http.Request, roomID string) {
	room := rooms.Get(roomID)

	if room == nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"exists":         false,
			"hasBroadcaster": false,
			"viewerCount":    0,
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"exists":         true,
		"hasBroadcaster": room.GetBroadcasterTrack() != nil,
		"viewerCount":    room.ViewerCount(),
	})
}

// handleHealth handles GET /health
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

func main() {
	port := flag.Int("port", 37003, "HTTP server port")
	flag.Parse()

	// Use a custom mux with manual routing for compatibility
	mux := http.NewServeMux()

	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/internal/room", corsMiddleware(handleRoomRouter))
	mux.HandleFunc("/internal/room/", corsMiddleware(handleRoomRouter))

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Rubigo Screen Share SFU starting on %s", addr)
	log.Printf("Endpoints:")
	log.Printf("  POST /internal/room           - Create room")
	log.Printf("  POST /internal/room/{id}/publish   - Broadcaster SDP exchange")
	log.Printf("  POST /internal/room/{id}/subscribe - Viewer SDP exchange")
	log.Printf("  GET  /internal/room/{id}/status    - Room status")

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// handleRoomRouter routes requests under /internal/room/
func handleRoomRouter(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path

	// POST /internal/room - create room
	if path == "/internal/room" && r.Method == http.MethodPost {
		handleCreateRoom(w, r)
		return
	}

	// Parse /internal/room/{id}/{action}
	// Expected: /internal/room/abc123/publish
	parts := strings.Split(strings.TrimPrefix(path, "/internal/room/"), "/")
	if len(parts) < 1 || parts[0] == "" {
		http.Error(w, "Room ID required", http.StatusBadRequest)
		return
	}

	roomID := parts[0]
	action := ""
	if len(parts) >= 2 {
		action = parts[1]
	}

	// Store roomID in request context or use directly
	switch action {
	case "publish":
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		handlePublishWithID(w, r, roomID)
	case "subscribe":
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		handleSubscribeWithID(w, r, roomID)
	case "status":
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		handleStatusWithID(w, r, roomID)
	default:
		http.Error(w, "Unknown action", http.StatusNotFound)
	}
}

// RoomManager manages in-memory room state
type RoomManager struct {
	mu    sync.RWMutex
	rooms map[string]*Room
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]*Room),
	}
}

func (m *RoomManager) GetOrCreate(id string) *Room {
	m.mu.Lock()
	defer m.mu.Unlock()

	if room, ok := m.rooms[id]; ok {
		return room
	}

	room := &Room{id: id}
	m.rooms[id] = room
	log.Printf("Created room: %s", id)
	return room
}

func (m *RoomManager) Get(id string) *Room {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.rooms[id]
}

func (m *RoomManager) Delete(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.rooms, id)
	log.Printf("Deleted room: %s", id)
}

// Room holds in-memory state for a screen share session
// No persistence - Next.js owns room metadata in SQLite
type Room struct {
	id               string
	mu               sync.RWMutex
	broadcasterPC    *webrtc.PeerConnection
	broadcasterTrack *webrtc.TrackLocalStaticRTP
	viewers          []*webrtc.PeerConnection
}

func (r *Room) SetBroadcasterPC(pc *webrtc.PeerConnection) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.broadcasterPC = pc
}

func (r *Room) SetBroadcasterTrack(track *webrtc.TrackLocalStaticRTP) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.broadcasterTrack = track
}

func (r *Room) GetBroadcasterTrack() *webrtc.TrackLocalStaticRTP {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.broadcasterTrack
}

func (r *Room) AddViewer(pc *webrtc.PeerConnection) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.viewers = append(r.viewers, pc)
	log.Printf("[Room %s] Viewer joined (total: %d)", r.id, len(r.viewers))
}

func (r *Room) ViewerCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.viewers)
}
