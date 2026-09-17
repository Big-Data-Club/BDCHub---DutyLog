package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func normalizeRole(role string) string {
	r := strings.ToUpper(strings.TrimSpace(role))
	r = strings.TrimPrefix(r, "ROLE_")
	return r
}

func hasAdminRole(claims jwt.MapClaims) bool {
	// 1. Check singular "role" claim
	if r, ok := claims["role"].(string); ok {
		norm := normalizeRole(r)
		if norm == "ADMIN" || norm == "MANAGER" {
			return true
		}
	}

	// 2. Check "roles" slice claim ([]interface{} from jwt.MapClaims)
	if rolesRaw, ok := claims["roles"].([]interface{}); ok {
		for _, item := range rolesRaw {
			if str, ok := item.(string); ok {
				norm := normalizeRole(str)
				if norm == "ADMIN" || norm == "MANAGER" {
					return true
				}
			}
		}
	}

	// 3. Check "roles" slice claim if []string
	if rolesStr, ok := claims["roles"].([]string); ok {
		for _, str := range rolesStr {
			norm := normalizeRole(str)
			if norm == "ADMIN" || norm == "MANAGER" {
				return true
			}
		}
	}

	return false
}

// RequireAdminJWT validates a BDC Hub JWT and enforces role=ADMIN.
// The token secret is read from the JWT_SECRET environment variable.
func RequireAdminJWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "malformed claims"})
			return
		}
		if !hasAdminRole(claims) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin role required"})
			return
		}
		c.Set("claims", claims)
		c.Next()
	}
}
