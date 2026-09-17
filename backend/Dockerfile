FROM golang:1.22-alpine AS builder
WORKDIR /app

# Install build dependencies
RUN apk --no-cache add ca-certificates git

# Download dependencies first (layer caching)
COPY go.mod ./
RUN go mod download || true
COPY go.sum* ./
RUN go mod tidy

# Copy source and build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -o dutylog-service ./cmd/server/main.go

# ── Runtime image ──────────────────────────────────────────────────────────────
FROM alpine:3.19
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/dutylog-service /app/dutylog-service
EXPOSE 8086
USER nobody
CMD ["/app/dutylog-service"]
