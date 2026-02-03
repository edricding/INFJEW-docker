package handlers

import (
	"encoding/json"
	"net/http"
	"log"

	"INFJEW/backend/db"
)

type Banner struct {
	ID        int    `json:"id"`
	Title1    string `json:"title1"`
	Title2    string `json:"title2"`
	Subtitle  string `json:"subtitle"`
	URL       string `json:"url"`
	PicURL    string `json:"picurl"`
}

// 获取所有 Banner
func GetBannersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	// 查询 banner 数据
	rows, err := db.DB.Query("SELECT id, title1, title2, subtitle, url, picurl FROM banner")
	if err != nil {
		log.Printf("❌ 数据库查询失败: %v", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}
	defer rows.Close()

	var banners []Banner
	for rows.Next() {
		var banner Banner
		if err := rows.Scan(&banner.ID, &banner.Title1, &banner.Title2, &banner.Subtitle, &banner.URL, &banner.PicURL); err != nil {
			log.Printf("❌ 数据行扫描失败: %v", err)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Error processing data",
			})
			return
		}
		banners = append(banners, banner)
	}

	// 返回获取到的 banner 数据
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    banners,
	})
}


// 删除 Banner
func DeleteBannerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	// 获取请求中的 ID 参数
	var data struct {
		ID int `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		log.Printf("❌ JSON 解析失败: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "请求体解析失败",
		})
		return
	}

	// 删除指定 ID 的 banner
	query := "DELETE FROM banner WHERE id = ?"
	_, err := db.DB.Exec(query, data.ID)
	if err != nil {
		log.Printf("❌ 删除 Banner 失败: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "删除失败",
		})
		return
	}

	// 获取当前所有 banner 数据并返回
	rows, err := db.DB.Query("SELECT id, title1, title2, subtitle, url, picurl FROM banner")
	if err != nil {
		log.Printf("❌ 数据库查询失败: %v", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "数据库查询失败",
		})
		return
	}
	defer rows.Close()

	var banners []Banner
	for rows.Next() {
		var banner Banner
		if err := rows.Scan(&banner.ID, &banner.Title1, &banner.Title2, &banner.Subtitle, &banner.URL, &banner.PicURL); err != nil {
			log.Printf("❌ 数据行扫描失败: %v", err)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Error processing data",
			})
			return
		}
		banners = append(banners, banner)
	}

	// 返回删除后的 banner 列表
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Banner 删除成功",
		"data":    banners,
	})
}


// 创建新 Banner
func CreateBannerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	// 解析请求体
	var data Banner
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		log.Printf("❌ 请求体解析失败: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "请求体解析失败",
		})
		return
	}

	// 插入数据库
	insertQuery := `
		INSERT INTO banner (title1, title2, subtitle, url, picurl)
		VALUES (?, ?, ?, ?, ?)
	`
	_, err := db.DB.Exec(insertQuery, data.Title1, data.Title2, data.Subtitle, data.URL, data.PicURL)
	if err != nil {
		log.Printf("❌ 插入数据失败: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "插入数据失败",
		})
		return
	}

	// 查询插入后的所有数据并返回
	rows, err := db.DB.Query("SELECT id, title1, title2, subtitle, url, picurl FROM banner")
	if err != nil {
		log.Printf("❌ 查询所有 banner 失败: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "查询数据失败",
		})
		return
	}
	defer rows.Close()

	var banners []Banner
	for rows.Next() {
		var b Banner
		if err := rows.Scan(&b.ID, &b.Title1, &b.Title2, &b.Subtitle, &b.URL, &b.PicURL); err != nil {
			log.Printf("❌ 扫描行失败: %v", err)
			continue
		}
		banners = append(banners, b)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "添加成功",
		"data":    banners,
	})
}













// -----------以下给前端用api-----------------------

// 公共获取 Banner 接口：无需登录
func PublicGetBannersHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	rows, err := db.DB.Query("SELECT id, title1, title2, subtitle, url, picurl FROM banner")
	if err != nil {
		log.Printf("❌ 公共接口：数据库查询失败: %v", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "数据库查询失败",
		})
		return
	}
	defer rows.Close()

	var banners []Banner
	for rows.Next() {
		var banner Banner
		if err := rows.Scan(&banner.ID, &banner.Title1, &banner.Title2, &banner.Subtitle, &banner.URL, &banner.PicURL); err != nil {
			log.Printf("❌ 公共接口：扫描数据失败: %v", err)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "数据处理失败",
			})
			return
		}
		banners = append(banners, banner)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    banners,
	})
}
