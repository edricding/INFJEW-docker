package db

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

var DB *sql.DB

func InitDB() {
	var err error

	// Use MYSQL_DSN if provided; fallback keeps existing behavior.
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		dsn = "root:Haishigugue33@tcp(34.57.48.165:3306)/infjew?parseTime=true"
	}
	DB, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Database connection error:", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Database ping error:", err)
	}

	log.Println("Database connected successfully.")
}