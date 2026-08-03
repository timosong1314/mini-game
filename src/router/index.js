import HomeView from '../views/HomeView.vue'
import Game2048View from '../views/Game2048View.vue'
import AirplaneBattleView from '../views/AirplaneBattleView.vue'
import GomokuView from '../views/GomokuView.vue'
import WerewolfView from '../views/WerewolfView.vue'
import MBTIView from '../views/MBTIView.vue'
import AnniversaryView from '../views/AnniversaryView.vue'

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
    path: '/games/airplane-battle',
    name: 'game-airplane-battle',
    component: AirplaneBattleView,
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
  {
    path: '/games/mbti',
    name: 'game-mbti',
    component: MBTIView,
  },
  {
    path: '/anniversary',
    name: 'anniversary',
    component: AnniversaryView,
  },
]

export default routes
