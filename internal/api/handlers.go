package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/dts-dataplex/sounds-of-stfu/internal/config"
	"github.com/dts-dataplex/sounds-of-stfu/internal/room"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// Handler holds dependencies for HTTP handlers
type Handler struct {
	manager  *room.Manager
	config   *config.Config
	upgrader websocket.Upgrader
}

// NewHandler creates a new Handler instance
func NewHandler(manager *room.Manager, cfg *config.Config) *Handler {
	return &Handler{
		manager: manager,
		config:  cfg,
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(r *http.Request) bool {
				return true // Allow all origins for development
			},
		},
	}
}

// TokenRequest represents a request for a LiveKit token
type TokenRequest struct {
	RoomName string `json:"roomName"`
	Username string `json:"username"`
}

// TokenResponse represents the response with a LiveKit token
type TokenResponse struct {
	Token string `json:"token"`
}

// HandleToken generates a LiveKit access token
func (h *Handler) HandleToken(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req TokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RoomName == "" || req.Username == "" {
		http.Error(w, "roomName and username are required", http.StatusBadRequest)
		return
	}

	// TODO: Generate actual LiveKit token using livekit-server-sdk
	// For now, return a placeholder token
	token := "placeholder-token-" + req.Username + "-" + req.RoomName

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{Token: token})
}

// HandleWebSocket handles WebSocket connections for room communication
func (h *Handler) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roomName := vars["roomName"]
	username := r.URL.Query().Get("username")

	if roomName == "" || username == "" {
		http.Error(w, "roomName and username are required", http.StatusBadRequest)
		return
	}

	// Upgrade to WebSocket
	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &room.Client{
		Conn:     conn,
		Username: username,
		RoomName: roomName,
		Send:     make(chan []byte, 256),
	}

	// Register client
	h.manager.Register(client)

	// Start read and write goroutines
	go h.writePump(client)
	go h.readPump(client)

	// Send initial room state after a small delay to ensure registration
	time.AfterFunc(100*time.Millisecond, func() {
		h.sendRoomState(client)
		h.broadcastUserJoined(client)
	})
}

// sendRoomState sends the current room state to a client
func (h *Handler) sendRoomState(client *room.Client) {
	rm, exists := h.manager.GetRoom(client.RoomName)
	if !exists {
		return
	}

	users := rm.GetUsers()
	data, err := room.MarshalRoomState(users)
	if err != nil {
		log.Printf("Failed to marshal room state: %v", err)
		return
	}

	select {
	case client.Send <- data:
	default:
		log.Printf("Client %s send buffer full", client.Username)
	}
}

// broadcastUserJoined broadcasts that a user has joined
func (h *Handler) broadcastUserJoined(client *room.Client) {
	rm, exists := h.manager.GetRoom(client.RoomName)
	if !exists {
		return
	}

	user, exists := rm.GetUser(client.Username)
	if !exists {
		return
	}

	data, err := room.MarshalUserJoined(user)
	if err != nil {
		log.Printf("Failed to marshal user joined: %v", err)
		return
	}

	h.manager.Broadcast(client.RoomName, data, client)
}

// readPump handles incoming WebSocket messages
func (h *Handler) readPump(client *room.Client) {
	defer func() {
		h.handleDisconnect(client)
	}()

	client.Conn.SetReadLimit(4096)
	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		h.handleMessage(client, message)
	}
}

// writePump handles outgoing WebSocket messages
func (h *Handler) writePump(client *room.Client) {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-client.Send:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				// Channel closed
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := client.Conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (h *Handler) handleMessage(client *room.Client, message []byte) {
	var base room.BaseMessage
	if err := json.Unmarshal(message, &base); err != nil {
		log.Printf("Failed to parse message: %v", err)
		return
	}

	switch base.Type {
	case room.MsgTypePositionUpdate:
		h.handlePositionUpdate(client, message)
	case room.MsgTypePing:
		client.Send <- room.MarshalPong()
	default:
		log.Printf("Unknown message type: %s", base.Type)
	}
}

// handlePositionUpdate processes position update messages
func (h *Handler) handlePositionUpdate(client *room.Client, message []byte) {
	// Check rate limit
	if !h.manager.CheckRateLimit(client) {
		return // Silently drop rate-limited updates
	}

	var update room.PositionUpdateMessage
	if err := json.Unmarshal(message, &update); err != nil {
		log.Printf("Failed to parse position update: %v", err)
		return
	}

	// Validate position bounds (assuming 800x600 canvas)
	if update.X < 0 || update.X > 800 || update.Y < 0 || update.Y > 600 {
		return // Invalid position, ignore
	}

	rm, exists := h.manager.GetRoom(client.RoomName)
	if !exists {
		return
	}

	pos := room.Position{X: update.X, Y: update.Y}
	if !rm.UpdatePosition(client.Username, pos) {
		return
	}

	// Get updated user info for zone
	user, exists := rm.GetUser(client.Username)
	if !exists {
		return
	}

	// Broadcast position update to all other users
	data, err := room.MarshalUserMoved(client.Username, pos, user.Zone)
	if err != nil {
		log.Printf("Failed to marshal user moved: %v", err)
		return
	}

	h.manager.Broadcast(client.RoomName, data, client)
}

// handleDisconnect handles client disconnection
func (h *Handler) handleDisconnect(client *room.Client) {
	// Broadcast user left before unregistering
	data, err := room.MarshalUserLeft(client.Username)
	if err == nil {
		h.manager.Broadcast(client.RoomName, data, nil)
	}

	h.manager.Unregister(client)
	client.Conn.Close()
}

// HandleHealth returns server health status
func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
	stats := h.manager.GetRoomStats()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "ok",
		"rooms":  stats,
	})
}
