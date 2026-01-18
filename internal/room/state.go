package room

import (
	"sync"
	"time"
)

// Position represents a user's location in 2D space
type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// User represents a connected user in a room
type User struct {
	Username    string    `json:"username"`
	Position    Position  `json:"position"`
	Zone        string    `json:"zone"`
	JoinedAt    time.Time `json:"joinedAt"`
	LastUpdated time.Time `json:"-"`
}

// Room represents a virtual space where users can interact
type Room struct {
	Name      string           `json:"name"`
	Users     map[string]*User `json:"users"`
	CreatedAt time.Time        `json:"createdAt"`
	mu        sync.RWMutex
}

// NewRoom creates a new room with the given name
func NewRoom(name string) *Room {
	return &Room{
		Name:      name,
		Users:     make(map[string]*User),
		CreatedAt: time.Now(),
	}
}

// AddUser adds a user to the room
// Returns false if username is already taken
func (r *Room) AddUser(username string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.Users[username]; exists {
		return false
	}

	r.Users[username] = &User{
		Username: username,
		Position: Position{X: 400, Y: 300}, // Default spawn position (center-ish)
		Zone:     "main_bar",
		JoinedAt: time.Now(),
	}
	return true
}

// RemoveUser removes a user from the room
func (r *Room) RemoveUser(username string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.Users, username)
}

// UpdatePosition updates a user's position
func (r *Room) UpdatePosition(username string, pos Position) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	user, exists := r.Users[username]
	if !exists {
		return false
	}

	user.Position = pos
	user.Zone = detectZone(pos)
	user.LastUpdated = time.Now()
	return true
}

// GetUser returns a copy of the user data
func (r *Room) GetUser(username string) (*User, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	user, exists := r.Users[username]
	if !exists {
		return nil, false
	}

	// Return a copy to avoid race conditions
	userCopy := *user
	return &userCopy, true
}

// GetUsers returns a copy of all users
func (r *Room) GetUsers() []*User {
	r.mu.RLock()
	defer r.mu.RUnlock()

	users := make([]*User, 0, len(r.Users))
	for _, user := range r.Users {
		userCopy := *user
		users = append(users, &userCopy)
	}
	return users
}

// UserCount returns the number of users in the room
func (r *Room) UserCount() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.Users)
}

// IsEmpty returns true if the room has no users
func (r *Room) IsEmpty() bool {
	return r.UserCount() == 0
}

// Zone boundaries (simplified for MVP - single floor)
var zones = map[string]struct {
	MinX, MinY, MaxX, MaxY float64
}{
	"gaming_corner": {50, 50, 200, 200},
	"main_bar":      {400, 50, 750, 200},
	"card_tables":   {50, 250, 200, 400},
	"firepit":       {400, 250, 750, 400},
	"quiet_booths":  {50, 450, 750, 550},
}

// detectZone determines which zone a position is in
func detectZone(pos Position) string {
	for name, bounds := range zones {
		if pos.X >= bounds.MinX && pos.X <= bounds.MaxX &&
			pos.Y >= bounds.MinY && pos.Y <= bounds.MaxY {
			return name
		}
	}
	return "main_bar" // Default zone
}
