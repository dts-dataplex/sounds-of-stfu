package room

import (
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents a WebSocket connection to a user
type Client struct {
	Conn     *websocket.Conn
	Username string
	RoomName string
	Send     chan []byte

	// Rate limiting
	lastPositionUpdate time.Time
	updateCount        int
	rateLimitWindow    time.Time
}

// Manager handles all rooms and client connections
type Manager struct {
	rooms      map[string]*Room
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *BroadcastMessage
	mu         sync.RWMutex

	// Configuration
	maxUpdatesPerSecond int
}

// BroadcastMessage represents a message to broadcast to a room
type BroadcastMessage struct {
	RoomName string
	Message  []byte
	Exclude  *Client // Optional: client to exclude from broadcast
}

// NewManager creates a new room manager
func NewManager(maxUpdatesPerSecond int) *Manager {
	return &Manager{
		rooms:               make(map[string]*Room),
		clients:             make(map[*Client]bool),
		register:            make(chan *Client),
		unregister:          make(chan *Client),
		broadcast:           make(chan *BroadcastMessage, 256),
		maxUpdatesPerSecond: maxUpdatesPerSecond,
	}
}

// Run starts the manager's main loop
func (m *Manager) Run() {
	// Start cleanup goroutine for empty rooms
	go m.cleanupEmptyRooms()

	for {
		select {
		case client := <-m.register:
			m.handleRegister(client)

		case client := <-m.unregister:
			m.handleUnregister(client)

		case msg := <-m.broadcast:
			m.handleBroadcast(msg)
		}
	}
}

// handleRegister adds a new client to a room
func (m *Manager) handleRegister(client *Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Get or create room
	room, exists := m.rooms[client.RoomName]
	if !exists {
		room = NewRoom(client.RoomName)
		m.rooms[client.RoomName] = room
		log.Printf("Created room: %s", client.RoomName)
	}

	// Add user to room
	if !room.AddUser(client.Username) {
		// Username already taken
		client.Send <- []byte(`{"type":"error","code":"username_taken","message":"Username is already in use"}`)
		close(client.Send)
		return
	}

	m.clients[client] = true
	log.Printf("User %s joined room %s", client.Username, client.RoomName)
}

// handleUnregister removes a client from a room
func (m *Manager) handleUnregister(client *Client) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, ok := m.clients[client]; !ok {
		return
	}

	delete(m.clients, client)
	close(client.Send)

	if room, exists := m.rooms[client.RoomName]; exists {
		room.RemoveUser(client.Username)
		log.Printf("User %s left room %s", client.Username, client.RoomName)
	}
}

// handleBroadcast sends a message to all clients in a room
func (m *Manager) handleBroadcast(msg *BroadcastMessage) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for client := range m.clients {
		if client.RoomName == msg.RoomName && client != msg.Exclude {
			select {
			case client.Send <- msg.Message:
			default:
				// Client send buffer full, skip
				log.Printf("Dropping message for slow client %s", client.Username)
			}
		}
	}
}

// cleanupEmptyRooms periodically removes empty rooms
func (m *Manager) cleanupEmptyRooms() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		m.mu.Lock()
		for name, room := range m.rooms {
			if room.IsEmpty() && time.Since(room.CreatedAt) > 30*time.Second {
				delete(m.rooms, name)
				log.Printf("Cleaned up empty room: %s", name)
			}
		}
		m.mu.Unlock()
	}
}

// Register adds a client to the manager
func (m *Manager) Register(client *Client) {
	m.register <- client
}

// Unregister removes a client from the manager
func (m *Manager) Unregister(client *Client) {
	m.unregister <- client
}

// Broadcast sends a message to all clients in a room
func (m *Manager) Broadcast(roomName string, message []byte, exclude *Client) {
	m.broadcast <- &BroadcastMessage{
		RoomName: roomName,
		Message:  message,
		Exclude:  exclude,
	}
}

// GetRoom returns a room by name
func (m *Manager) GetRoom(name string) (*Room, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	room, exists := m.rooms[name]
	return room, exists
}

// CheckRateLimit checks if a client can send another position update
// Returns true if allowed, false if rate limited
func (m *Manager) CheckRateLimit(client *Client) bool {
	now := time.Now()

	// Reset window if it's been more than a second
	if now.Sub(client.rateLimitWindow) >= time.Second {
		client.rateLimitWindow = now
		client.updateCount = 0
	}

	// Check if under limit
	if client.updateCount >= m.maxUpdatesPerSecond {
		return false
	}

	client.updateCount++
	client.lastPositionUpdate = now
	return true
}

// GetRoomStats returns statistics about all rooms
func (m *Manager) GetRoomStats() map[string]int {
	m.mu.RLock()
	defer m.mu.RUnlock()

	stats := make(map[string]int)
	for name, room := range m.rooms {
		stats[name] = room.UserCount()
	}
	return stats
}
