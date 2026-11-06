package apidocs

import (
	"encoding/json"
	"net/http/httptest"
	"os"
	"regexp"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestDocumentationRoutes(t *testing.T) {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	Register(r)
	for _, path := range []string{"/api/v1/swagger/index.html", "/api/v1/swagger/", "/api/v1/swagger/doc.json", "/api/v1/swagger/swagger-ui.css", "/api/v1/swagger/swagger-ui-bundle.js"} {
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest("GET", path, nil))
		if w.Code != 200 || w.Body.Len() == 0 {
			t.Fatalf("%s: status %d", path, w.Code)
		}
	}
	w := httptest.NewRecorder()
	r.ServeHTTP(w, httptest.NewRequest("GET", "/api/v1/swagger/swagger-initializer.js", nil))
	if w.Code != 404 {
		t.Fatal("upstream demo must not be exposed")
	}
	// Emulate the deployed Traefik rewrite without any infrastructure dependency.
	w = httptest.NewRecorder()
	req := httptest.NewRequest("GET", "/dutylogapiv1/swagger/index.html", nil)
	req.URL.Path = strings.Replace(req.URL.Path, "/dutylogapiv1/", "/api/v1/", 1)
	r.ServeHTTP(w, req)
	if w.Code != 200 || !strings.Contains(w.Body.String(), "fetch('./doc.json'") {
		t.Fatal("proxy page or relative spec URL broken")
	}
}

func TestSpecMatchesRegisteredRoutes(t *testing.T) {
	raw, _ := content.ReadFile("swagger.json")
	var spec struct {
		Paths       map[string]map[string]json.RawMessage `json:"paths"`
		Definitions map[string]json.RawMessage            `json:"definitions"`
	}
	if err := json.Unmarshal(raw, &spec); err != nil {
		t.Fatal(err)
	}
	main, err := os.ReadFile("../../cmd/server/main.go")
	if err != nil {
		t.Fatal(err)
	}
	routes := regexp.MustCompile(`(api|admin)\.(GET|POST|PUT|DELETE)\("([^"]+)"`).FindAllStringSubmatch(string(main), -1)
	param := regexp.MustCompile(`:(\w+)`)
	count := 0
	for _, route := range routes {
		path := param.ReplaceAllString(route[3], "{$1}")
		if route[1] == "admin" {
			path = "/admin" + path
		}
		if _, ok := spec.Paths[path][strings.ToLower(route[2])]; !ok {
			t.Errorf("undocumented route: %s %s", route[2], path)
		}
		count++
	}
	documented := 0
	for _, operations := range spec.Paths {
		documented += len(operations)
	}
	if count != documented {
		t.Errorf("router has %d operations, spec has %d", count, documented)
	}
	for _, ref := range regexp.MustCompile(`"\$ref":\s*"#/definitions/([^"]+)"`).FindAllSubmatch(raw, -1) {
		if _, ok := spec.Definitions[string(ref[1])]; !ok {
			t.Errorf("unresolved schema %s", ref[1])
		}
	}
}
