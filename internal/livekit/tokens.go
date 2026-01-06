package livekit

import (
	"time"

	"github.com/dts-dataplex/sounds-of-stfu/internal/config"
	"github.com/livekit/protocol/auth"
)

// TokenService generates LiveKit access tokens
type TokenService struct {
	apiKey    string
	apiSecret string
}

// NewTokenService creates a new token service
func NewTokenService(cfg *config.Config) *TokenService {
	return &TokenService{
		apiKey:    cfg.LiveKitAPIKey,
		apiSecret: cfg.LiveKitAPISecret,
	}
}

// GenerateToken creates a LiveKit access token for a user to join a room
func (s *TokenService) GenerateToken(roomName, username string) (string, error) {
	// Create access token with API key
	at := auth.NewAccessToken(s.apiKey, s.apiSecret)

	// Set token grants
	grant := &auth.VideoGrant{
		RoomJoin: true,
		Room:     roomName,
	}

	at.AddGrant(grant).
		SetIdentity(username).
		SetValidFor(24 * time.Hour)

	// Generate JWT token
	return at.ToJWT()
}
