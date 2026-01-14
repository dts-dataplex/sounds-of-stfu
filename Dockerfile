# Build stage
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Enable auto toolchain download for newer Go requirements
ENV GOTOOLCHAIN=auto

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY cmd/ ./cmd/
COPY internal/ ./internal/

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server/

# Runtime stage
FROM alpine:latest

WORKDIR /app

# Copy binary from builder
COPY --from=builder /server .

# Copy web assets
COPY web/ ./web/

# Expose port
EXPOSE 8080

# Run the server
CMD ["./server"]
