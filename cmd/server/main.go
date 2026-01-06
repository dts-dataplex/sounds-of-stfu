package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/dts-dataplex/sounds-of-stfu/internal/api"
	"github.com/dts-dataplex/sounds-of-stfu/internal/config"
	"github.com/dts-dataplex/sounds-of-stfu/internal/room"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Create room manager
	manager := room.NewManager(cfg.MaxPositionUpdatesPerSecond)
	go manager.Run()

	// Create API handler
	handler := api.NewHandler(manager, cfg)

	// Set up router
	router := mux.NewRouter()

	// API routes
	router.HandleFunc("/api/token", handler.HandleToken).Methods("POST", "OPTIONS")
	router.HandleFunc("/api/health", handler.HandleHealth).Methods("GET")

	// WebSocket route
	router.HandleFunc("/ws/{roomName}", handler.HandleWebSocket)

	// Room route - serves index.html for SPA routing
	router.HandleFunc("/room/{roomName}", serveIndex).Methods("GET")

	// Static file serving
	webDir := getWebDir()
	staticHandler := http.StripPrefix("/static/", http.FileServer(http.Dir(filepath.Join(webDir, "static"))))
	router.PathPrefix("/static/").Handler(staticHandler)

	// CSS and JS serving (relative to web/)
	router.PathPrefix("/css/").Handler(http.FileServer(http.Dir(webDir)))
	router.PathPrefix("/js/").Handler(http.FileServer(http.Dir(webDir)))

	// Root serves index.html
	router.HandleFunc("/", serveIndex).Methods("GET")

	// Set up CORS
	corsHandler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Start server
	addr := cfg.Host + ":" + cfg.Port
	log.Printf("Starting server on %s", addr)
	log.Printf("Serving static files from: %s", webDir)

	if err := http.ListenAndServe(addr, corsHandler.Handler(router)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// getWebDir returns the path to the web directory
func getWebDir() string {
	// Try current working directory first
	if _, err := os.Stat("web"); err == nil {
		return "web"
	}

	// Try relative to executable
	execPath, err := os.Executable()
	if err == nil {
		execDir := filepath.Dir(execPath)
		webPath := filepath.Join(execDir, "web")
		if _, err := os.Stat(webPath); err == nil {
			return webPath
		}

		// Try parent directories
		for i := 0; i < 3; i++ {
			execDir = filepath.Dir(execDir)
			webPath = filepath.Join(execDir, "web")
			if _, err := os.Stat(webPath); err == nil {
				return webPath
			}
		}
	}

	// Default fallback
	return "web"
}

// serveIndex serves the index.html file
func serveIndex(w http.ResponseWriter, r *http.Request) {
	webDir := getWebDir()
	indexPath := filepath.Join(webDir, "index.html")

	// Check if index.html exists
	if _, err := os.Stat(indexPath); os.IsNotExist(err) {
		// Serve a basic HTML page if index.html doesn't exist yet
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`<!DOCTYPE html>
<html>
<head>
    <title>Sounds of STFU</title>
    <style>
        body {
            background: #0a0a0f;
            color: #00d4ff;
            font-family: monospace;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
        }
        .container {
            text-align: center;
        }
        h1 { color: #ff6b00; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Sounds of STFU</h1>
        <p>Server is running. Frontend coming soon...</p>
        <p>API Health: <a href="/api/health" style="color: #00ff88">/api/health</a></p>
    </div>
</body>
</html>`))
		return
	}

	http.ServeFile(w, r, indexPath)
}
