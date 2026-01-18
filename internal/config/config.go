package config

import (
	"os"
	"strconv"
)

// Config holds all application configuration
type Config struct {
	// Server settings
	Port string
	Host string

	// LiveKit settings
	LiveKitURL       string
	LiveKitAPIKey    string
	LiveKitAPISecret string

	// Rate limiting
	MaxPositionUpdatesPerSecond int
}

// Load reads configuration from environment variables with defaults
func Load() *Config {
	return &Config{
		Port:                        getEnv("PORT", "8080"),
		Host:                        getEnv("HOST", "0.0.0.0"),
		LiveKitURL:                  getEnv("LIVEKIT_URL", "ws://localhost:7880"),
		LiveKitAPIKey:               getEnv("LIVEKIT_API_KEY", "devkey"),
		LiveKitAPISecret:            getEnv("LIVEKIT_API_SECRET", "secret"),
		MaxPositionUpdatesPerSecond: getEnvInt("MAX_POSITION_UPDATES_PER_SECOND", 20),
	}
}

// getEnv returns environment variable value or default
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt returns environment variable as int or default
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}
