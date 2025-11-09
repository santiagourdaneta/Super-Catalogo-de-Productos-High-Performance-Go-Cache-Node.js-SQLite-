// cache-service/main.go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"io"
)

const (
	CachePort = "8080"
)

type Product struct {
	ID    int    `json:"id"`
	Name  string `json:"name"`
	Price float64 `json:"price"`
}

type InvalidationRequest struct {
	ID int `json:"id"`
}

type ProductCache struct {
	store map[int]Product
	mu    sync.RWMutex 
}

var cache = ProductCache{
	store: make(map[int]Product),
}

// Handler HTTP para obtener un producto (simulando LFU/ARC hit)
func getProductHandler(w http.ResponseWriter, r *http.Request) {
    // Simulación: Tomar el ID 1 de la URL
    productID := 1 
    
    cache.mu.RLock()
    defer cache.mu.RUnlock()

    if product, ok := cache.store[productID]; ok {
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(product)
        return
    }
    
    http.Error(w, "Product not found in cache", http.StatusNotFound)
}

// 💥 Handler HTTP para invalidar el cache (Reemplazo de Kafka)
func invalidateCacheHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    body, err := io.ReadAll(r.Body)
    if err != nil {
        http.Error(w, "Error reading request body", http.StatusBadRequest)
        return
    }

    var req InvalidationRequest
    if err := json.Unmarshal(body, &req); err != nil {
        http.Error(w, "Invalid JSON format", http.StatusBadRequest)
        return
    }

    cache.mu.Lock()
    delete(cache.store, req.ID)
    cache.mu.Unlock()
    
    log.Printf("[INVALIDATION] Cache removed for Product ID: %d (via HTTP)", req.ID)
    w.WriteHeader(http.StatusOK)
    fmt.Fprintf(w, "Invalidated ID: %d", req.ID)
}

func main() {
    // Simular carga de datos iniciales en el cache
    cache.store[1] = Product{ID: 1, Name: "Producto Cacheado LFU", Price: 10.00}
    cache.store[2] = Product{ID: 2, Name: "Producto Cacheado LFU", Price: 50.00}

    // Configurar las rutas HTTP
    http.HandleFunc("/api/v1/cache/product", getProductHandler)
    http.HandleFunc("/api/v1/cache/invalidate", invalidateCacheHandler) // Nueva ruta

    log.Printf("Cache Service (Go) running on :%s", CachePort)
    log.Fatal(http.ListenAndServe(":"+CachePort, nil))
}