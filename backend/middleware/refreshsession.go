// middleware/session_refresh.go
package middleware

import (
	"INFJEW/backend/session"
	"net/http"
)

// 自动续期中间件
func WithSessionRefresh(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess, _ := session.Store.Get(r, "session-id")

		if username, ok := sess.Values["username"].(string); ok && username != "" {
			// 检测到已登录，刷新过期时间
			sess.Options.MaxAge = 3600 // 重新设置 1 小时
			sess.Save(r, w)
		}

		next.ServeHTTP(w, r)
	})
}
