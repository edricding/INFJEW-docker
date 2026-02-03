package handlers

import (
	"encoding/json"
	"net/http"
	"log"

	"INFJEW/backend/db"


)

type CountingDown struct {
	ID         int    `json:"id"`
	Title      string `json:"title"`
	Price      int    `json:"price"`
	Discount   int    `json:"discount"`
	Percentage string `json:"percentage"`
	Rating     int    `json:"rating"`
	DDL        string `json:"ddl"`
	URL        string `json:"url"`
	PicURL     string `json:"picurl"`
}

// CountingDownData 用于绑定 JSON 数据
type UpdateCountingDownData struct {
    Title      string `json:"title"`
    Price      int    `json:"price"`
    Discount   int    `json:"discount"`
    Percentage string `json:"percentage"`
    Rating     int    `json:"rating"`
    DDL        string `json:"ddl"`
    URL        string `json:"url"`
    PicURL     string `json:"picurl"`
}



// 获取所有 CountingDown 数据
func GetCountingDownHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	// 查询 countingDown 数据
	rows, err := db.DB.Query("SELECT id, title, price, discount, percentage, rating, ddl, url, picurl FROM countingDown")
	if err != nil {
		log.Printf("❌ 数据库查询失败: %v", err)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Database query failed",
		})
		return
	}
	defer rows.Close()

	var countingDowns []CountingDown
	for rows.Next() {
		var cd CountingDown
		if err := rows.Scan(&cd.ID, &cd.Title, &cd.Price, &cd.Discount, &cd.Percentage, &cd.Rating, &cd.DDL, &cd.URL, &cd.PicURL); err != nil {
			log.Printf("❌ 数据行扫描失败: %v", err)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": false,
				"message": "Error processing data",
			})
			return
		}
		countingDowns = append(countingDowns, cd)
	}

	// 返回获取到的 countingDown 数据
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    countingDowns,
	})
}

// 更新 countingDown 表中的唯一一行（id = 1）
func UpdateCountingDownHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	var data UpdateCountingDownData
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		log.Printf("❌ JSON 解析失败: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "请求体解析失败",
		})
		return
	}

	query := `
        UPDATE countingDown SET
            title = ?, price = ?, discount = ?, percentage = ?,
            rating = ?, ddl = ?, url = ?, picurl = ?
        WHERE id = 1
    `
	_, err := db.DB.Exec(query,
		data.Title, data.Price, data.Discount, data.Percentage,
		data.Rating, data.DDL, data.URL, data.PicURL,
	)
	if err != nil {
		log.Printf("❌ 数据库更新失败: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "数据库更新失败",
		})
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "更新成功",
	})
}


func PublicGetCountingDownHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Method Not Allowed",
		})
		return
	}

	rows, err := db.DB.Query(`SELECT id, title, price, discount, percentage, rating, ddl, url, picurl FROM countingDown`)
	if err != nil {
		log.Printf("❌ 查询 countingdown 数据失败: %v", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "数据库查询失败",
		})
		return
	}
	defer rows.Close()

	

	var items []CountingDown
	for rows.Next() {
		var item CountingDown
		if err := rows.Scan(&item.ID, &item.Title, &item.Price, &item.Discount, &item.Percentage, &item.Rating, &item.DDL, &item.URL, &item.PicURL); err != nil {
			log.Printf("❌ 数据行扫描失败: %v", err)
			continue
		}
		items = append(items, item)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    items,
	})
}
