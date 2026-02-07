package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"

	"INFJEW/backend/db"
)

type PreciousItem struct {
	ID       int    `json:"id"`
	ItemID   string `json:"itemid"`
	Title    string `json:"title"`
	Tag      string `json:"tag"`
	Type     string `json:"type"`
	Price    int    `json:"price"`
	Discount int    `json:"discount"`
	Rating   float64 `json:"rating"`
	Status   int    `json:"status"`
	URL      string `json:"url"`
	PicURL   string `json:"picurl"`
}

type PreciousInfoItem struct {
	ID                   int         `json:"id"`
	PreciousID           int         `json:"precious_id"`
	PreciousCode         string      `json:"precious_code"`
	PreciousName         string      `json:"precious_name"`
	PreciousPictures     []string    `json:"precious_pictures"`
	PreciousMaterials    string      `json:"precious_materials"`
	PreciousType         string      `json:"precious_type"`
	PreciousTag          string      `json:"precious_tag"`
	PreciousDesc         interface{} `json:"precious_desc"`
	PreciousOfficialPrice *float64   `json:"precious_official_price"`
	PreciousInfoFilled   int         `json:"precious_info_filled"`
}

type preciousItemPayload struct {
	ID       int    `json:"id"`
	ItemID   string `json:"itemid"`
	Title    string `json:"title"`
	Tag      string `json:"tag"`
	Type     string `json:"type"`
	Precious string `json:"precious"` // Alias for "type"
	Price    int    `json:"price"`
	Discount int    `json:"discount"`
	Rating   float64 `json:"rating"`
	Status   int    `json:"status"`
	URL      string `json:"url"`
	PicURL   string `json:"picurl"`
}

func (p preciousItemPayload) normalizedType() string {
	if t := strings.TrimSpace(p.Type); t != "" {
		return t
	}
	return strings.TrimSpace(p.Precious)
}

func (p preciousItemPayload) normalizedTag() string {
	return strings.TrimSpace(p.Tag)
}

func (p preciousItemPayload) normalizedItemID() string {
	return strings.TrimSpace(p.ItemID)
}

func (p preciousItemPayload) normalizedTitle() string {
	return strings.TrimSpace(p.Title)
}

func (p preciousItemPayload) normalizedURL() string {
	return strings.TrimSpace(p.URL)
}

func (p preciousItemPayload) normalizedPicURL() string {
	return strings.TrimSpace(p.PicURL)
}

func normalizeHalfStepRating(rating float64) (float64, error) {
	if math.IsNaN(rating) || math.IsInf(rating, 0) {
		return 0, errors.New("invalid rating")
	}

	if rating < 0 || rating > 5 {
		return 0, errors.New("rating out of range")
	}

	scaled := rating * 2
	rounded := math.Round(scaled)
	if math.Abs(scaled-rounded) > 1e-9 {
		return 0, errors.New("rating must be in 0.5 steps")
	}

	return rounded / 2, nil
}

func writeJSON(w http.ResponseWriter, statusCode int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(payload)
}

func loadPreciousItems() ([]PreciousItem, error) {
	rows, err := db.DB.Query(`
		SELECT id, itemid, title, tag, type, price, discount, rating, status, url, picurl
		FROM preciousList
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]PreciousItem, 0)
	for rows.Next() {
		var item PreciousItem
		if err := rows.Scan(
			&item.ID,
			&item.ItemID,
			&item.Title,
			&item.Tag,
			&item.Type,
			&item.Price,
			&item.Discount,
			&item.Rating,
			&item.Status,
			&item.URL,
			&item.PicURL,
		); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

func parseJSONPictures(raw []byte) []string {
	if len(raw) == 0 {
		return []string{}
	}

	var pictures []string
	if err := json.Unmarshal(raw, &pictures); err == nil {
		return pictures
	}

	var genericPictures []interface{}
	if err := json.Unmarshal(raw, &genericPictures); err == nil {
		normalized := make([]string, 0, len(genericPictures))
		for _, value := range genericPictures {
			if str, ok := value.(string); ok {
				normalized = append(normalized, str)
			}
		}
		return normalized
	}

	return []string{}
}

func parseJSONValue(raw []byte) interface{} {
	if len(raw) == 0 {
		return nil
	}

	var parsed interface{}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return string(raw)
	}

	return parsed
}

func loadPreciousInfoByPreciousID(preciousID int) (*PreciousInfoItem, error) {
	row := db.DB.QueryRow(`
		SELECT
			id,
			precious_id,
			precious_code,
			precious_name,
			precious_pictures,
			precious_materials,
			precious_type,
			precious_tag,
			precious_desc,
			precious_official_price,
			precious_info_filled
		FROM preciousInfo
		WHERE precious_id = ?
		LIMIT 1
	`, preciousID)

	var item PreciousInfoItem
	var code, name, materials, preciousType, tag sql.NullString
	var picturesRaw, descRaw []byte
	var officialPrice sql.NullFloat64

	if err := row.Scan(
		&item.ID,
		&item.PreciousID,
		&code,
		&name,
		&picturesRaw,
		&materials,
		&preciousType,
		&tag,
		&descRaw,
		&officialPrice,
		&item.PreciousInfoFilled,
	); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if code.Valid {
		item.PreciousCode = strings.TrimSpace(code.String)
	}
	if name.Valid {
		item.PreciousName = strings.TrimSpace(name.String)
	}
	if materials.Valid {
		item.PreciousMaterials = strings.TrimSpace(materials.String)
	}
	if preciousType.Valid {
		item.PreciousType = strings.TrimSpace(preciousType.String)
	}
	if tag.Valid {
		item.PreciousTag = strings.TrimSpace(tag.String)
	}

	item.PreciousPictures = parseJSONPictures(picturesRaw)
	item.PreciousDesc = parseJSONValue(descRaw)

	if officialPrice.Valid {
		price := officialPrice.Float64
		item.PreciousOfficialPrice = &price
	}

	return &item, nil
}

func loadStringList(query string) ([]string, error) {
	rows, err := db.DB.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	values := make([]string, 0)
	for rows.Next() {
		var value string
		if err := rows.Scan(&value); err != nil {
			return nil, err
		}
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		values = append(values, value)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return values, nil
}

func loadPreciousTypes() ([]string, error) {
	return loadStringList(`
		SELECT types
		FROM preciousTypes
		ORDER BY id ASC
	`)
}

func loadPreciousTags() ([]string, error) {
	return loadStringList(`
		SELECT tags
		FROM preciousTags
		ORDER BY id ASC
	`)
}

func getDefaultPreciousType() (string, error) {
	types, err := loadPreciousTypes()
	if err != nil {
		return "", err
	}
	if len(types) == 0 {
		return "", nil
	}
	return types[0], nil
}

func getExistingPreciousType(id int) (string, error) {
	var preciousType string
	err := db.DB.QueryRow(`
		SELECT type
		FROM preciousList
		WHERE id = ?
	`, id).Scan(&preciousType)
	if err == sql.ErrNoRows {
		return "", errors.New("item not found")
	}
	if err != nil {
		return "", err
	}
	return strings.TrimSpace(preciousType), nil
}

func validateCreatePayload(payload preciousItemPayload) (preciousItemPayload, error) {
	payload.ItemID = payload.normalizedItemID()
	payload.Title = payload.normalizedTitle()
	payload.Tag = payload.normalizedTag()
	payload.Type = payload.normalizedType()
	payload.URL = payload.normalizedURL()
	payload.PicURL = payload.normalizedPicURL()

	if payload.Type == "" {
		defaultType, err := getDefaultPreciousType()
		if err != nil {
			return payload, err
		}
		payload.Type = defaultType
	}

	if payload.ItemID == "" ||
		payload.Title == "" ||
		payload.Tag == "" ||
		payload.Type == "" ||
		payload.URL == "" ||
		payload.PicURL == "" {
		return payload, errors.New("missing required fields")
	}

	normalizedRating, err := normalizeHalfStepRating(payload.Rating)
	if err != nil {
		return payload, err
	}
	payload.Rating = normalizedRating

	return payload, nil
}

// GetPreciousInfoHandler returns one preciousInfo row by precious_id.
func GetPreciousInfoHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	preciousIDRaw := strings.TrimSpace(r.URL.Query().Get("precious_id"))
	preciousID, err := strconv.Atoi(preciousIDRaw)
	if err != nil || preciousID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid precious_id",
		})
		return
	}

	item, err := loadPreciousInfoByPreciousID(preciousID)
	if err != nil {
		log.Printf("failed to query preciousInfo by precious_id=%d: %v", preciousID, err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	if item == nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{
			"success": false,
			"message": "Precious info not found",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    item,
	})
}

func validateUpdatePayload(payload preciousItemPayload) (preciousItemPayload, error) {
	payload.ItemID = payload.normalizedItemID()
	payload.Title = payload.normalizedTitle()
	payload.Tag = payload.normalizedTag()
	payload.Type = payload.normalizedType()
	payload.URL = payload.normalizedURL()
	payload.PicURL = payload.normalizedPicURL()

	if payload.ID <= 0 {
		return payload, errors.New("invalid id")
	}

	if payload.ItemID == "" ||
		payload.Title == "" ||
		payload.Tag == "" ||
		payload.URL == "" ||
		payload.PicURL == "" {
		return payload, errors.New("missing required fields")
	}

	if payload.Type == "" {
		existingType, err := getExistingPreciousType(payload.ID)
		if err != nil {
			return payload, err
		}
		payload.Type = existingType
	}

	if payload.Type == "" {
		return payload, errors.New("type is required")
	}

	normalizedRating, err := normalizeHalfStepRating(payload.Rating)
	if err != nil {
		return payload, err
	}
	payload.Rating = normalizedRating

	return payload, nil
}

// GetPreciousMetaHandler returns type/tag options for precious form selects.
func GetPreciousMetaHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	types, err := loadPreciousTypes()
	if err != nil {
		log.Printf("failed to query preciousTypes: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	tags, err := loadPreciousTags()
	if err != nil {
		log.Printf("failed to query preciousTags: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data": map[string]interface{}{
			"types": types,
			"tags":  tags,
		},
	})
}

// GetPreciousListHandler returns all precious items for admin.
func GetPreciousListHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	items, err := loadPreciousItems()
	if err != nil {
		log.Printf("failed to query preciousList: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    items,
	})
}

// DeletePreciousItemHandler deletes one precious item by id.
func DeletePreciousItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var req struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("failed to decode delete request: %v", err)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	if req.ID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid id",
		})
		return
	}

	if _, err := db.DB.Exec("DELETE FROM preciousList WHERE id = ?", req.ID); err != nil {
		log.Printf("failed to delete precious item: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Delete failed",
		})
		return
	}

	items, err := loadPreciousItems()
	if err != nil {
		log.Printf("failed to reload precious list after delete: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Deleted but failed to reload list",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Deleted successfully",
		"data":    items,
	})
}

// CreatePreciousItemHandler creates a precious item.
func CreatePreciousItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var payload preciousItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("failed to decode create request: %v", err)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	payload, err := validateCreatePayload(payload)
	if err != nil {
		log.Printf("invalid create payload: %v", err)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Missing or invalid fields",
		})
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		log.Printf("failed to start create transaction: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Create failed",
		})
		return
	}
	defer func() {
		_ = tx.Rollback()
	}()

	preciousListResult, err := tx.Exec(`
		INSERT INTO preciousList (itemid, title, tag, type, price, discount, rating, status, url, picurl)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`,
		payload.ItemID,
		payload.Title,
		payload.Tag,
		payload.Type,
		payload.Price,
		payload.Discount,
		payload.Rating,
		payload.Status,
		payload.URL,
		payload.PicURL,
	)
	if err != nil {
		log.Printf("failed to create preciousList item: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Create failed",
		})
		return
	}

	newPreciousID, err := preciousListResult.LastInsertId()
	if err != nil {
		log.Printf("failed to get inserted preciousList id: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Create failed",
		})
		return
	}

	_, err = tx.Exec(`
		INSERT INTO preciousInfo (
			precious_id,
			precious_code,
			precious_name,
			precious_pictures,
			precious_type,
			precious_tag,
			precious_official_price
		)
		VALUES (?, ?, ?, JSON_ARRAY(?), ?, ?, ?)
	`,
		newPreciousID,
		payload.ItemID,
		payload.Title,
		payload.PicURL,
		payload.Type,
		payload.Tag,
		payload.Price,
	)
	if err != nil {
		log.Printf("failed to create preciousInfo item: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Create failed",
		})
		return
	}

	if err := tx.Commit(); err != nil {
		log.Printf("failed to commit create transaction: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Create failed",
		})
		return
	}

	items, err := loadPreciousItems()
	if err != nil {
		log.Printf("failed to reload precious list after create: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Created but failed to reload list",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Created successfully",
		"data":    items,
	})
}

// UpdatePreciousItemHandler updates a precious item.
func UpdatePreciousItemHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var payload preciousItemPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("failed to decode update request: %v", err)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Invalid request body",
		})
		return
	}

	payload, err := validateUpdatePayload(payload)
	if err != nil {
		log.Printf("invalid update payload: %v", err)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{
			"success": false,
			"message": "Missing or invalid fields",
		})
		return
	}

	_, err = db.DB.Exec(`
		UPDATE preciousList
		SET itemid = ?, title = ?, tag = ?, type = ?, price = ?, discount = ?, rating = ?, status = ?, url = ?, picurl = ?
		WHERE id = ?
	`,
		payload.ItemID,
		payload.Title,
		payload.Tag,
		payload.Type,
		payload.Price,
		payload.Discount,
		payload.Rating,
		payload.Status,
		payload.URL,
		payload.PicURL,
		payload.ID,
	)
	if err != nil {
		log.Printf("failed to update precious item: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Update failed",
		})
		return
	}

	items, err := loadPreciousItems()
	if err != nil {
		log.Printf("failed to reload precious list after update: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Updated but failed to reload list",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Updated successfully",
		"data":    items,
	})
}

// PublicGetPreciousItemsHandler returns all precious items for public pages.
func PublicGetPreciousItemsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	items, err := loadPreciousItems()
	if err != nil {
		log.Printf("failed to query public preciousList: %v", err)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"data":    items,
	})
}
