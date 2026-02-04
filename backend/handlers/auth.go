package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"net/url"
	"os"

	"INFJEW/backend/db"
	"INFJEW/backend/session"
	"golang.org/x/crypto/bcrypt"
)

type LoginRequest struct {
	Username       string `json:"username"`
	Password       string `json:"password"`
	RecaptchaToken string `json:"recaptchaToken"`
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

	if req.RecaptchaToken == "" {
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: "reCAPTCHA required",
		})
		return
	}

	recaptchaResult, err := verifyRecaptcha(req.RecaptchaToken, "login")
	if err != nil || !recaptchaResult.OK {
		log.Printf("reCAPTCHA failed: %v", err)
		msg := recaptchaResult.Message
		if msg == "" {
			msg = "reCAPTCHA failed"
		}
		json.NewEncoder(w).Encode(LoginResponse{
			Success: false,
			Message: msg,
		})
		return
	}

	var hashedPassword string
	err = db.DB.QueryRow("SELECT password FROM account WHERE username = ?", req.Username).Scan(&hashedPassword)
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

type recaptchaResponse struct {
	Success bool    `json:"success"`
	Score   float64 `json:"score"`
	Action  string  `json:"action"`
}

type recaptchaResult struct {
	OK      bool
	Message string
}

func verifyRecaptcha(token string, expectedAction string) (recaptchaResult, error) {
	secret := os.Getenv("RECAPTCHA_SECRET")
	if secret == "" {
		return recaptchaResult{OK: false, Message: "reCAPTCHA not configured"}, http.ErrNoCookie
	}

	resp, err := http.PostForm("https://www.google.com/recaptcha/api/siteverify", url.Values{
		"secret":   {secret},
		"response": {token},
	})
	if err != nil {
		return recaptchaResult{OK: false, Message: "reCAPTCHA verification error"}, err
	}
	defer resp.Body.Close()

	var result recaptchaResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return recaptchaResult{OK: false, Message: "reCAPTCHA verification error"}, err
	}

	if !result.Success {
		return recaptchaResult{OK: false, Message: "reCAPTCHA failed"}, nil
	}
	if expectedAction != "" && result.Action != expectedAction {
		return recaptchaResult{OK: false, Message: "reCAPTCHA action mismatch"}, nil
	}

	const minScore = 0.5
	if result.Score < minScore {
		return recaptchaResult{OK: false, Message: "reCAPTCHA score too low"}, nil
	}

	return recaptchaResult{OK: true}, nil
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
