// Package apidocs serves self-contained Swagger UI assets and the API contract.
package apidocs

import (
	"embed"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
)

//go:embed index.html swagger.json
var content embed.FS

// Register installs docs outside API authentication middleware. Traefik rewrites
// /dutylogapiv1/swagger/* to /api/v1/swagger/* just like other DutyLog requests.
func Register(r *gin.Engine) {
	assets := http.FileServer(swaggerFiles.HTTP)
	r.GET("/api/v1/swagger/*file", func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		switch c.Param("file") {
		case "/", "/index.html":
			page, _ := content.ReadFile("index.html")
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "text/html; charset=utf-8", page)
		case "/doc.json", "/swagger.json":
			spec, _ := content.ReadFile("swagger.json")
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "application/json; charset=utf-8", spec)
		default:
			file := strings.TrimPrefix(c.Param("file"), "/")
			// Only expose the assets needed by our UI, not the upstream demo initializer.
			if file != "swagger-ui.css" && file != "swagger-ui-bundle.js" {
				c.Status(http.StatusNotFound)
				return
			}
			req := c.Request.Clone(c.Request.Context())
			url := *c.Request.URL
			url.Path = "/" + file
			req.URL = &url
			assets.ServeHTTP(c.Writer, req)
		}
	})
}
