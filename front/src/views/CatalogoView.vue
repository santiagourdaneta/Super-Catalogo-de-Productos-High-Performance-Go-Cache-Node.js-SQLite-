<script setup lang="ts">
// front/src/views/CatalogoView.vue 
import { ref, reactive, onMounted, computed } from 'vue'; 
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface PaginationState {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

const products = ref<Product[]>([]);
const errorMessage = ref<string | null>(null);

const pagination: PaginationState = reactive({
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
});

// Nota: Mantén la URL y la simulación del token
const API_URL = 'http://localhost:3000/api/products/search';

const visiblePages = computed(() => {
    const { totalPages, currentPage } = pagination;
    const maxVisiblePages = 5; 
    const pages: (number | '...')[] = [];
    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) { pages.push(i); }
    } else {
        pages.push(1);
        const startPage = Math.max(2, currentPage - 1);
        const endPage = Math.min(totalPages - 1, currentPage + 1);
        if (startPage > 2) { pages.push('...'); }
        for (let i = startPage; i <= endPage; i++) { pages.push(i); }
        if (endPage < totalPages - 1) { pages.push('...'); }
        pages.push(totalPages);
    }
    return pages;
});

const fetchProducts = async () => {
    errorMessage.value = null;
    try {
        const params = new URLSearchParams({
            page: pagination.currentPage.toString(),
            limit: pagination.limit.toString(),
        });
        
        // Simulación de Token JWT (Recuerda desactivar authMiddleware en el backend)
        const token = 'MOCK_JWT_TOKEN_PARA_AUTENTICACION'; 

        const response = await axios.get(
            `${API_URL}?${params.toString()}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = response.data; 

        if (data.resultados && Array.isArray(data.resultados)) {
            products.value = data.resultados;
            
            Object.assign(pagination, {
                totalItems: data.total || 0,
                totalPages: Math.ceil((data.total || 0) / (data.limit || 10)),
                currentPage: data.page || 1,
                limit: data.limit || 10,
            });
        } else {
            products.value = [];
            errorMessage.value = 'El servidor devolvió una estructura de datos inválida.';
        }

    } catch (error: any) {
        if (error.response && error.response.status === 403) {
             errorMessage.value = 'Error de Autenticación (403 Forbidden). Desactiva el authMiddleware en el backend.';
        } else {
            errorMessage.value = 'Error al conectar al backend o al Cache Go.';
        }
        products.value = [];
        Object.assign(pagination, { totalItems: 0, totalPages: 1, currentPage: 1, limit: 10 });
    }
};

const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        pagination.currentPage = newPage;
        fetchProducts(); 
    }
};

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <section class="section">
    <div class="container">
      <h2 class="title is-2 mb-6">🛍️ Súper-Catálogo ({{ pagination.totalItems }} Items)</h2>
      
      <div v-if="errorMessage" class="notification is-danger is-light mb-5">
        <p class="is-size-5 has-text-weight-bold">Error de Conexión</p>
        <p>⚠️ {{ errorMessage }}</p>
      </div>

      <div v-else-if="products.length" class="columns is-multiline is-variable is-4">
        
        <div v-for="product in products" :key="product.id" class="column is-one-quarter-desktop is-half-tablet is-full-mobile">
          
          <div class="card has-hover-shadow">
            
            <div class="card-image">
                <figure class="image is-4by3 has-background-light is-flex is-justify-content-center is-align-items-center">
                    <p class="is-size-5 has-text-grey">ID: {{ product.id }}</p>
                </figure>
            </div>
            
            <div class="card-content">
              <div class="media">
                <div class="media-content">
                  <p class="title is-5 is-capitalized">{{ product.name }}</p>
                  <p class="subtitle is-6 has-text-info has-text-weight-bold">${{ product.price.toFixed(2) }}</p>
                </div>
              </div>

              <div class="content is-size-7">
                Stock disponible: {{ product.stock }}
                <br>
                <time datetime="2016-1-1">Producto creado ahora.</time>
              </div>
            </div>

            <footer class="card-footer">
                <a href="#" class="card-footer-item button is-info is-light is-fullwidth has-text-weight-bold">
                    Añadir al Carrito
                </a>
            </footer>
          </div>
        </div>
      </div>
      
      <p v-else-if="!errorMessage && products.length === 0" class="has-text-centered has-text-grey-light is-size-4 pt-6">Cargando productos o catálogo vacío...</p>
      
      <hr class="mt-6 mb-6"/>

      <nav v-if="pagination.totalPages > 1" class="pagination is-centered" role="navigation" aria-label="pagination">
        
        <a 
          @click.prevent="changePage(pagination.currentPage - 1)" 
          :disabled="pagination.currentPage === 1"
          class="pagination-previous"
          :class="{ 'is-disabled': pagination.currentPage === 1 }">
          Anterior
        </a>

        <a 
          @click.prevent="changePage(pagination.currentPage + 1)" 
          :disabled="pagination.currentPage === pagination.totalPages"
          class="pagination-next"
          :class="{ 'is-disabled': pagination.currentPage === pagination.totalPages }">
          Siguiente
        </a>

        <ul class="pagination-list">
            <template v-for="page in visiblePages" :key="page">
                <li v-if="page === '...'">
                    <span class="pagination-ellipsis">&hellip;</span>
                </li>
                <li v-else>
                    <a @click.prevent="changePage(page as number)" 
                       class="pagination-link"
                       :class="{ 'is-current': page === pagination.currentPage }"
                       :aria-label="`Goto page ${page}`">
                       {{ page }}
                    </a>
                </li>
            </template>
        </ul>
      </nav>
      
      <div v-if="pagination.totalPages > 1" class="has-text-centered is-size-7 mt-4 has-text-grey">
        Página {{ pagination.currentPage }} de {{ pagination.totalPages }} (Total: {{ pagination.totalItems }} productos)
      </div>

    </div>
  </section>
</template>

<style scoped>
.card.has-hover-shadow {
    transition: box-shadow 0.3s, transform 0.3s;
}
.card.has-hover-shadow:hover {
    box-shadow: 0 0.5em 1em -0.125em rgba(10, 10, 10, 0.2), 0 0px 0 1px rgba(10, 10, 10, 0.02);
    transform: translateY(-4px);
}
</style>