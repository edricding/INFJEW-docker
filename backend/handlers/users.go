package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"INFJEW/backend/db"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
}

// GetUsersHandler returns a list of users (account table) without passwords.
func GetUsersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	rows, err := db.DB.Query("SELECT id, username, role FROM account")
	if err != nil {
		log.Printf("Database query failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var user User
		if err := rows.Scan(&user.ID, &user.Username, &user.Role); err != nil {
			log.Printf("Row scan failed: %v", err)
			w.WriteHeader(http.StatusInternalServerError)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Error processing data",
			})
			return
		}
		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    users,
	})
}

type ResetPasswordRequest struct {
	ID       int    `json:"id"`
	Password string `json:"password"`
}

func ResetUserPasswordHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var req ResetPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid JSON: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid JSON",
		})
		return
	}

	if req.ID <= 0 || req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid payload",
		})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Password hashing failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Password hashing failed",
		})
		return
	}

	_, err = db.DB.Exec("UPDATE account SET password = ? WHERE id = ?", string(hashed), req.ID)
	if err != nil {
		log.Printf("Password update failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Database update failed",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Password updated",
	})
}

type DeleteUserRequest struct {
	ID int `json:"id"`
}

func DeleteUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var req DeleteUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid JSON: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid JSON",
		})
		return
	}

	if req.ID <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid payload",
		})
		return
	}

	var role string
	if err := db.DB.QueryRow("SELECT role FROM account WHERE id = ?", req.ID).Scan(&role); err != nil {
		log.Printf("Role lookup failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Role lookup failed",
		})
		return
	}

	if role == "superadmin" {
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Superadmin cannot be deleted",
		})
		return
	}

	_, err := db.DB.Exec("DELETE FROM account WHERE id = ?", req.ID)
	if err != nil {
		log.Printf("Delete user failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Delete failed",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User deleted",
	})
}

type CreateUserRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

func CreateUserHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var req CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Invalid JSON: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid JSON",
		})
		return
	}

	if req.Username == "" || req.Password == "" || req.Role == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid payload",
		})
		return
	}

	if req.Role != "superadmin" && req.Role != "admin" && req.Role != "user" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid role",
		})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Password hashing failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Password hashing failed",
		})
		return
	}

	_, err = db.DB.Exec("INSERT INTO account (username, password, role) VALUES (?, ?, ?)", req.Username, string(hashed), req.Role)
	if err != nil {
		log.Printf("Create user failed: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Create user failed",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "User created",
	})
}
