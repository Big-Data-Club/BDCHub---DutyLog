package rds

import (
	"context"
	"log"
	"os"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// Connect returns a Redis client configured from REDIS_* env vars.
func Connect() *redis.Client {
	host := os.Getenv("REDIS_HOST")
	if host == "" {
		host = "localhost"
	}
	port := os.Getenv("REDIS_PORT")
	if port == "" {
		port = "6379"
	}
	password := os.Getenv("REDIS_PASSWORD")
	dbIdx, _ := strconv.Atoi(os.Getenv("REDIS_DB"))

	client := redis.NewClient(&redis.Options{
		Addr:     host + ":" + port,
		Password: password,
		DB:       dbIdx,
	})

	if err := client.Ping(context.Background()).Err(); err != nil {
		log.Printf("[REDIS] Warning: initial ping failed (will retry): %v", err)
	} else {
		log.Println("[REDIS] Redis connected successfully")
	}
	return client
}
