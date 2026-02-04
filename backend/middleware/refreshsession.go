// middleware/session_refresh.go
package middleware

import (
	"INFJEW/backend/session"
	"net/http"
	"time"
)

// Auto-refresh session expiry for logged-in users.
func WithSessionRefresh(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess, _ := session.Store.Get(r, "session-id")

		if username, ok := sess.Values["username"].(string); ok && username != "" {
			sess.Options.MaxAge = 3600
			sess.Values["expiresAt"] = time.Now().Add(time.Hour).Unix()
			sess.Save(r, w)
		}

		next.ServeHTTP(w, r)
	})
}
