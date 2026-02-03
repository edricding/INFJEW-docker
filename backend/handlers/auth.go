package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	
	"log"

	"INFJEW/backend/db"
	"golang.org/x/crypto/bcrypt"

	"INFJEW/backend/session"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Token   string `json:"token,omitempty"` // 可选的 JWT Token
}

func AuthLoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Method Not Allowed",
		})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("❌ JSON 解码失败: %v", err)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid JSON",
		})
		return
	}

	var hashedPassword string
	err := db.DB.QueryRow("SELECT password FROM account WHERE username = ?", req.Username).Scan(&hashedPassword)
	if err == sql.ErrNoRows {
		log.Printf("❌ 用户不存在: %s", req.Username)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid username or password", // 统一错误提示
		})
		return
	} else if err != nil {
		log.Printf("❌ 数据库查询失败: %v", err)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "MySql Server error",
		})
		return
	}

	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		log.Printf("❌ 密码不匹配: %v", err)
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Invalid username or password", // 统一错误提示
		})
		return
	}

	if err := session.InitSession(w, r, req.Username); err != nil {
		log.Printf("❌ 设置 session 失败: %v", err)
		
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Session error", // 统一错误提示
		})
		return
	}

	log.Printf("✅ 登录成功: %s", req.Username)

	resp := LoginResponse{
		Success: true,
		Message: "Login successful",
	}
	json.NewEncoder(w).Encode(resp)

	
}

func AuthLogoutHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "Method Not Allowed",
		})
		return
	}

	session.ClearSession(w, r)
	// 这里可以添加注销逻辑，比如清除会话或 JWT Token
	
	resp := LoginResponse{
		Success: true,
		Message: "Logout successful",
	}
	json.NewEncoder(w).Encode(resp)
}
