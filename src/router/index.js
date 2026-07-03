import HomeView from '../views/HomeView.vue'
import Game2048View from '../views/Game2048View.vue'
import GomokuView from '../views/GomokuView.vue'
import WerewolfView from '../views/WerewolfView.vue'

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
  {
    path: '/games/gomoku',
    name: 'game-gomoku',
    component: GomokuView,
  },
  {
    path: '/games/werewolf',
    name: 'game-werewolf',
    component: WerewolfView,
  },
]

export default routes
