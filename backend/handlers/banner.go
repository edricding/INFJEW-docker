package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"INFJEW/backend/db"
)

type Banner struct {
	ID        int    `json:"id"`
	Title1    string `json:"title1"`
	Title2    string `json:"title2"`
	Subtitle  string `json:"subtitle"`
	URL       string `json:"url"`
	PicURL    string `json:"picurl"`
	SortOrder int    `json:"sort_order,omitempty"`
}

type BannerReorderRequest struct {
	IDs []int `json:"ids"`
}

func ensureBannerSortOrderColumn() error {
	rows, err := db.DB.Query("SHOW COLUMNS FROM banner LIKE 'sort_order'")
	if err != nil {
		return fmt.Errorf("check banner.sort_order column: %w", err)
	}
	columnExists := rows.Next()
	_ = rows.Close()

	if !columnExists {
		if _, err := db.DB.Exec("ALTER TABLE banner ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER picurl"); err != nil {
			return fmt.Errorf("add banner.sort_order column: %w", err)
		}
	}

	if err := normalizeBannerSortOrder(); err != nil {
		return fmt.Errorf("normalize banner sort order: %w", err)
	}

	return nil
}

func normalizeBannerSortOrder() error {
	rows, err := db.DB.Query("SELECT id FROM banner ORDER BY sort_order ASC, id ASC")
	if err != nil {
		return err
	}
	defer rows.Close()

	var ids []int
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			return err
		}
		ids = append(ids, id)
	}

	tx, err := db.DB.Begin()
	if err != nil {
		return err
	}

	for idx, id := range ids {
		if _, err := tx.Exec("UPDATE banner SET sort_order = ? WHERE id = ?", idx+1, id); err != nil {
			_ = tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func queryBannersOrdered() ([]Banner, error) {
	rows, err := db.DB.Query(`
		SELECT id, title1, title2, subtitle, url, picurl, sort_order
		FROM banner
		ORDER BY sort_order ASC, id ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	banners := make([]Banner, 0)
	for rows.Next() {
		var banner Banner
		if err := rows.Scan(&banner.ID, &banner.Title1, &banner.Title2, &banner.Subtitle, &banner.URL, &banner.PicURL, &banner.SortOrder); err != nil {
			return nil, err
		}
		banners = append(banners, banner)
	}

	return banners, nil
}

func GetBannersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	if err := ensureBannerSortOrderColumn(); err != nil {
		log.Printf("failed to ensure banner sort schema: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database schema error",
		})
		return
	}

	banners, err := queryBannersOrdered()
	if err != nil {
		log.Printf("failed to query banner list: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    banners,
	})
}

func DeleteBannerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	if err := ensureBannerSortOrderColumn(); err != nil {
		log.Printf("failed to ensure banner sort schema: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database schema error",
		})
		return
	}

	var req struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if req.ID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid banner id",
		})
		return
	}

	if _, err := db.DB.Exec("DELETE FROM banner WHERE id = ?", req.ID); err != nil {
		log.Printf("failed to delete banner: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Delete failed",
		})
		return
	}

	if err := normalizeBannerSortOrder(); err != nil {
		log.Printf("failed to normalize banner order after delete: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Order normalize failed",
		})
		return
	}

	banners, err := queryBannersOrdered()
	if err != nil {
		log.Printf("failed to query banner list after delete: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Banner deleted successfully",
		"data":    banners,
	})
}

func CreateBannerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	if err := ensureBannerSortOrderColumn(); err != nil {
		log.Printf("failed to ensure banner sort schema: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database schema error",
		})
		return
	}

	var req Banner
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	var nextSortOrder int
	if err := db.DB.QueryRow("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM banner").Scan(&nextSortOrder); err != nil {
		log.Printf("failed to query next banner sort_order: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	insertQuery := `
		INSERT INTO banner (title1, title2, subtitle, url, picurl, sort_order)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	if _, err := db.DB.Exec(insertQuery, req.Title1, req.Title2, req.Subtitle, req.URL, req.PicURL, nextSortOrder); err != nil {
		log.Printf("failed to create banner: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Insert failed",
		})
		return
	}

	banners, err := queryBannersOrdered()
	if err != nil {
		log.Printf("failed to query banner list after create: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Banner created successfully",
		"data":    banners,
	})
}

func ReorderBannerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	if err := ensureBannerSortOrderColumn(); err != nil {
		log.Printf("failed to ensure banner sort schema: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database schema error",
		})
		return
	}

	var req BannerReorderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if len(req.IDs) == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "ids cannot be empty",
		})
		return
	}

	seen := make(map[int]struct{}, len(req.IDs))
	for _, id := range req.IDs {
		if id <= 0 {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{
				"success": false,
				"message": "ids must be positive integers",
			})
			return
		}
		if _, exists := seen[id]; exists {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{
				"success": false,
				"message": "ids must be unique",
			})
			return
		}
		seen[id] = struct{}{}
	}

	rows, err := db.DB.Query("SELECT id FROM banner")
	if err != nil {
		log.Printf("failed to query banner ids: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}
	defer rows.Close()

	existing := make(map[int]struct{})
	existingCount := 0
	for rows.Next() {
		var id int
		if err := rows.Scan(&id); err != nil {
			log.Printf("failed to scan banner id: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
				"success": false,
				"message": "Database query failed",
			})
			return
		}
		existing[id] = struct{}{}
		existingCount++
	}

	if len(req.IDs) != existingCount {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "ids must include all banners exactly once",
		})
		return
	}

	for _, id := range req.IDs {
		if _, ok := existing[id]; !ok {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{
				"success": false,
				"message": "ids contain unknown banner id",
			})
			return
		}
	}

	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("failed to begin reorder transaction: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Transaction start failed",
		})
		return
	}

	for idx, id := range req.IDs {
		if _, err := tx.Exec("UPDATE banner SET sort_order = ? WHERE id = ?", idx+1, id); err != nil {
			_ = tx.Rollback()
			log.Printf("failed to update banner sort_order: %v", err)
			writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
				"success": false,
				"message": "Order update failed",
			})
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("failed to commit reorder transaction: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Transaction commit failed",
		})
		return
	}

	banners, err := queryBannersOrdered()
	if err != nil {
		log.Printf("failed to query banners after reorder: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Banner order updated",
		"data":    banners,
	})
}

func PublicGetBannersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	if err := ensureBannerSortOrderColumn(); err != nil {
		log.Printf("failed to ensure banner sort schema: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database schema error",
		})
		return
	}

	banners, err := queryBannersOrdered()
	if err != nil {
		log.Printf("failed to query public banner list: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    banners,
	})
}
