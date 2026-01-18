package room

import "encoding/json"

// Message types for WebSocket communication
const (
	// Client -> Server
	MsgTypePositionUpdate = "position_update"
	MsgTypePing           = "ping"

	// Server -> Client
	MsgTypeRoomState  = "room_state"
	MsgTypeUserJoined = "user_joined"
	MsgTypeUserMoved  = "user_moved"
	MsgTypeUserLeft   = "user_left"
	MsgTypePong       = "pong"
	MsgTypeError      = "error"
)

// BaseMessage is the base structure for all messages
type BaseMessage struct {
	Type string `json:"type"`
}

// PositionUpdateMessage is sent by client to update position
type PositionUpdateMessage struct {
	Type string  `json:"type"`
	X    float64 `json:"x"`
	Y    float64 `json:"y"`
}

// RoomStateMessage sends the current room state to a new user
type RoomStateMessage struct {
	Type  string        `json:"type"`
	Users []*User       `json:"users"`
	Zones []ZoneInfo    `json:"zones"`
}

// ZoneInfo describes a zone for the client
type ZoneInfo struct {
	Name       string  `json:"name"`
	Label      string  `json:"label"`
	MinX       float64 `json:"minX"`
	MinY       float64 `json:"minY"`
	MaxX       float64 `json:"maxX"`
	MaxY       float64 `json:"maxY"`
	Multiplier float64 `json:"multiplier"`
}

// UserJoinedMessage notifies when a user joins
type UserJoinedMessage struct {
	Type     string  `json:"type"`
	Username string  `json:"username"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Zone     string  `json:"zone"`
}

// UserMovedMessage notifies when a user moves
type UserMovedMessage struct {
	Type     string  `json:"type"`
	Username string  `json:"username"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
	Zone     string  `json:"zone"`
}

// UserLeftMessage notifies when a user leaves
type UserLeftMessage struct {
	Type     string `json:"type"`
	Username string `json:"username"`
}

// ErrorMessage sends an error to the client
type ErrorMessage struct {
	Type    string `json:"type"`
	Code    string `json:"code"`
	Message string `json:"message"`
}

// GetZoneInfoList returns zone information for clients
func GetZoneInfoList() []ZoneInfo {
	return []ZoneInfo{
		{Name: "gaming_corner", Label: "Gaming Corner", MinX: 50, MinY: 50, MaxX: 200, MaxY: 200, Multiplier: 0.8},
		{Name: "main_bar", Label: "Main Bar", MinX: 400, MinY: 50, MaxX: 750, MaxY: 200, Multiplier: 1.0},
		{Name: "card_tables", Label: "Card Tables", MinX: 50, MinY: 250, MaxX: 200, MaxY: 400, Multiplier: 0.85},
		{Name: "firepit", Label: "Firepit", MinX: 400, MinY: 250, MaxX: 750, MaxY: 400, Multiplier: 0.9},
		{Name: "quiet_booths", Label: "Quiet Booths", MinX: 50, MinY: 450, MaxX: 750, MaxY: 550, Multiplier: 0.4},
	}
}

// MarshalRoomState creates a room state message
func MarshalRoomState(users []*User) ([]byte, error) {
	msg := RoomStateMessage{
		Type:  MsgTypeRoomState,
		Users: users,
		Zones: GetZoneInfoList(),
	}
	return json.Marshal(msg)
}

// MarshalUserJoined creates a user joined message
func MarshalUserJoined(user *User) ([]byte, error) {
	msg := UserJoinedMessage{
		Type:     MsgTypeUserJoined,
		Username: user.Username,
		X:        user.Position.X,
		Y:        user.Position.Y,
		Zone:     user.Zone,
	}
	return json.Marshal(msg)
}

// MarshalUserMoved creates a user moved message
func MarshalUserMoved(username string, pos Position, zone string) ([]byte, error) {
	msg := UserMovedMessage{
		Type:     MsgTypeUserMoved,
		Username: username,
		X:        pos.X,
		Y:        pos.Y,
		Zone:     zone,
	}
	return json.Marshal(msg)
}

// MarshalUserLeft creates a user left message
func MarshalUserLeft(username string) ([]byte, error) {
	msg := UserLeftMessage{
		Type:     MsgTypeUserLeft,
		Username: username,
	}
	return json.Marshal(msg)
}

// MarshalError creates an error message
func MarshalError(code, message string) ([]byte, error) {
	msg := ErrorMessage{
		Type:    MsgTypeError,
		Code:    code,
		Message: message,
	}
	return json.Marshal(msg)
}

// MarshalPong creates a pong message
func MarshalPong() []byte {
	return []byte(`{"type":"pong"}`)
}
