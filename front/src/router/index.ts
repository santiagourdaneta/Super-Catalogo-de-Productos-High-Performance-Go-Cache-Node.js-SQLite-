// front/src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import CatalogoView from '../views/CatalogoView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'catalogo',
      component: CatalogoView,
    },
  ],
});

export default router;