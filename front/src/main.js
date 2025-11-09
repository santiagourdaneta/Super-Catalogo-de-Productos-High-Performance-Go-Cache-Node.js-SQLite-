// front/src/main.ts

import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; 

import './assets/main.css'; 

// 1. Crea la instancia de la aplicación
const app = createApp(App);

// 2. INSTALA EL ROUTER: Esto inyecta el servicio de router a todos los componentes hijos
app.use(router); 

// 3. Monta la aplicación en el elemento DOM (#app)
app.mount('#app');