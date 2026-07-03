import HomeView from '../views/HomeView.vue'
import Game2048View from '../views/Game2048View.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
  },
  {
    path: '/games/2048',
    name: 'game-2048',
    component: Game2048View,
  },
]

export default routes
