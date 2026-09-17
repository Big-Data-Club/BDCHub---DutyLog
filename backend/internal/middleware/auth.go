package middleware

import (
	"net/http"
	"os"
	"strconv"
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
		if norm == "ADMIN" || norm == "SUPER_ADMIN" || norm == "MANAGER" {
			return true
		}
	}

	// 2. Check "roles" slice claim ([]interface{} from jwt.MapClaims)
	if rolesRaw, ok := claims["roles"].([]interface{}); ok {
		for _, item := range rolesRaw {
			if str, ok := item.(string); ok {
				norm := normalizeRole(str)
				if norm == "ADMIN" || norm == "SUPER_ADMIN" || norm == "MANAGER" {
					return true
				}
			}
		}
	}

	// 3. Check "roles" slice claim if []string
	if rolesStr, ok := claims["roles"].([]string); ok {
		for _, str := range rolesStr {
			norm := normalizeRole(str)
			if norm == "ADMIN" || norm == "SUPER_ADMIN" || norm == "MANAGER" {
				return true
			}
		}
	}

	return false
}

func parseToken(tokenStr, secret string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(secret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, jwt.ErrTokenInvalidClaims
	}
	return claims, nil
}

func extractUserClaims(c *gin.Context, claims jwt.MapClaims) {
	c.Set("claims", claims)

	// user_id
	var userID int64
	if idFloat, ok := claims["user_id"].(float64); ok {
		userID = int64(idFloat)
	} else if idStr, ok := claims["user_id"].(string); ok {
		userID, _ = strconv.ParseInt(idStr, 10, 64)
	}
	c.Set("user_id", userID)

	// email / sub
	email := ""
	if e, ok := claims["email"].(string); ok {
		email = e
	} else if sub, ok := claims["sub"].(string); ok {
		email = sub
	}
	c.Set("user_email", email)

	isAdmin := hasAdminRole(claims)
	c.Set("is_admin", isAdmin)
}

// RequireAuth validates BDC Hub JWT and sets user info in context.
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-jwt-secret-change-in-prod-min-32-chars-long"
		}
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := parseToken(tokenStr, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token: " + err.Error()})
			return
		}

		extractUserClaims(c, claims)
		c.Next()
	}
}

// OptionalAuth parses JWT if provided, otherwise continues with empty identity.
func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-jwt-secret-change-in-prod-min-32-chars-long"
		}
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
			if claims, err := parseToken(tokenStr, secret); err == nil {
				extractUserClaims(c, claims)
			}
		}
		c.Next()
	}
}

// RequireAdminJWT validates a BDC Hub JWT and enforces role=ADMIN/SUPER_ADMIN.
func RequireAdminJWT() gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			secret = "dev-jwt-secret-change-in-prod-min-32-chars-long"
		}
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}
		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := parseToken(tokenStr, secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}
		if !hasAdminRole(claims) {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin or super admin role required"})
			return
		}
		extractUserClaims(c, claims)
		c.Next()
	}
}
