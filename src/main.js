import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import routes from './router'

const router = createRouter({
  history: createWebHistory('/mini-game/'),
  routes,
})

createApp(App).use(router).mount('#app')
