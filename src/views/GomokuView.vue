<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const BOARD_SIZE = 15
const EMPTY = 0
const BLACK = 1
const WHITE = 2

function createBoard() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY))
}

const board = ref(createBoard())
const currentPlayer = ref(BLACK)
const gameOver = ref(false)
const winner = ref(null)
const lastMove = ref(null)
const moveCount = ref(0)
const boardSize = ref(0)
const history = ref([])

function calcBoardSize() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxFromWidth = Math.min(vw * 0.88, 560)
  const maxFromHeight = vh * 0.6
  boardSize.value = Math.floor(Math.min(maxFromWidth, maxFromHeight))
}

const cellSize = computed(() => Math.floor(boardSize.value / (BOARD_SIZE + 1)))
const boardPixelSize = computed(() => cellSize.value * (BOARD_SIZE - 1) + cellSize.value * 2)

const boardStyle = computed(() => ({
  width: boardPixelSize.value + 'px',
  height: boardPixelSize.value + 'px',
}))

function checkWin(row, col, player) {
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal
    [1, -1], // anti-diagonal
  ]

  for (const [dr, dc] of directions) {
    let count = 1
    for (let i = 1; i < 5; i++) {
      const r = row + dr * i
      const c = col + dc * i
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board.value[r][c] === player) {
        count++
      } else break
    }
    for (let i = 1; i < 5; i++) {
      const r = row - dr * i
      const c = col - dc * i
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board.value[r][c] === player) {
        count++
      } else break
    }
    if (count >= 5) return true
  }
  return false
}

function placePiece(row, col) {
  if (gameOver.value) return
  if (board.value[row][col] !== EMPTY) return

  board.value[row][col] = currentPlayer.value
  moveCount.value++
  lastMove.value = { row, col }
  history.value.push({ row, col, player: currentPlayer.value })

  if (checkWin(row, col, currentPlayer.value)) {
    gameOver.value = true
    winner.value = currentPlayer.value
    return
  }

  if (moveCount.value >= BOARD_SIZE * BOARD_SIZE) {
    gameOver.value = true
    winner.value = null
    return
  }

  currentPlayer.value = currentPlayer.value === BLACK ? WHITE : BLACK
}

function handleCellClick(row, col) {
  placePiece(row, col)
}

function restartGame() {
  board.value = createBoard()
  currentPlayer.value = BLACK
  gameOver.value = false
  winner.value = null
  lastMove.value = null
  moveCount.value = 0
  history.value = []
}

function undoMove() {
  if (history.value.length === 0 || gameOver.value) return
  const last = history.value.pop()
  board.value[last.row][last.col] = EMPTY
  currentPlayer.value = last.player
  moveCount.value--
  lastMove.value = history.value.length > 0 ? { row: history.value[history.value.length - 1].row, col: history.value[history.value.length - 1].col } : null
}

const statusText = computed(() => {
  if (gameOver.value) {
    if (winner.value === BLACK) return '黑棋获胜！'
    if (winner.value === WHITE) return '白棋获胜！'
    return '平局！'
  }
  return currentPlayer.value === BLACK ? '黑棋落子' : '白棋落子'
})

const statusColor = computed(() => {
  if (gameOver.value && winner.value) {
    return winner.value === BLACK ? '#1e1b4b' : '#f8fafc'
  }
  return currentPlayer.value === BLACK ? '#1e1b4b' : '#f8fafc'
})

const statusBg = computed(() => {
  if (gameOver.value && winner.value) {
    return winner.value === BLACK ? 'linear-gradient(135deg, #eef2ff, #ede9fe)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
  }
  return currentPlayer.value === BLACK ? 'linear-gradient(135deg, #eef2ff, #ede9fe)' : 'linear-gradient(135deg, #f1f5f9, #e2e8f0)'
})

const starPoints = BOARD_SIZE === 15
  ? [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]]
  : [[3, 3], [3, BOARD_SIZE - 4], [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)], [BOARD_SIZE - 4, 3], [BOARD_SIZE - 4, BOARD_SIZE - 4]]

onMounted(() => {
  calcBoardSize()
  window.addEventListener('resize', calcBoardSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', calcBoardSize)
})
</script>

<template>
  <main class="game gomoku">
    <header class="top-bar">
      <p class="eyebrow">小游戏</p>
      <h1>五子棋</h1>
      <div class="status-row">
        <div class="status-box" :style="{ background: statusBg }">
          <div class="stone-indicator" :style="{ background: statusColor }"></div>
          <span>{{ statusText }}</span>
        </div>
        <div class="status-box moves">
          <span>步数</span>
          <strong>{{ moveCount }}</strong>
        </div>
      </div>
    </header>

    <p class="hint">点击棋盘交叉点落子，先连成五子者胜</p>

    <div class="board-area" :style="boardStyle">
      <svg
        class="gomoku-board"
        :viewBox="`0 0 ${boardPixelSize} ${boardPixelSize}`"
        :width="boardPixelSize"
        :height="boardPixelSize"
      >
        <!-- Board background -->
        <rect x="0" y="0" :width="boardPixelSize" :height="boardPixelSize" rx="12" fill="#e8c87a" />
        <rect x="4" y="4" :width="boardPixelSize - 8" :height="boardPixelSize - 8" rx="10" fill="#dcb35c" />

        <!-- Grid lines -->
        <g stroke="#a07830" stroke-width="1" opacity="0.6">
          <line v-for="i in BOARD_SIZE" :key="'h' + i"
            :x1="cellSize" :y1="cellSize * i"
            :x2="cellSize * BOARD_SIZE" :y2="cellSize * i" />
          <line v-for="i in BOARD_SIZE" :key="'v' + i"
            :x1="cellSize * i" :y1="cellSize"
            :x2="cellSize * i" :y2="cellSize * BOARD_SIZE" />
        </g>

        <!-- Star points -->
        <circle v-for="p in starPoints" :key="'s' + p[0] + '-' + p[1]"
          :cx="cellSize * (p[1] + 1)" :cy="cellSize * (p[0] + 1)"
          :r="Math.max(3, cellSize * 0.12)" fill="#a07830" opacity="0.7" />

        <!-- Pieces -->
        <g v-for="row in BOARD_SIZE" :key="'r' + row">
          <g v-for="col in BOARD_SIZE" :key="'c' + row + '-' + col">
            <template v-if="board[row - 1][col - 1] !== EMPTY">
              <!-- Black piece -->
              <circle v-if="board[row - 1][col - 1] === BLACK"
                :cx="cellSize * col" :cy="cellSize * row"
                :r="cellSize * 0.42"
                fill="url(#blackGrad)"
                stroke="#111" stroke-width="0.5" />
              <!-- White piece -->
              <circle v-else
                :cx="cellSize * col" :cy="cellSize * row"
                :r="cellSize * 0.42"
                fill="url(#whiteGrad)"
                stroke="#bbb" stroke-width="0.5" />
              <!-- Last move indicator -->
              <circle v-if="lastMove && lastMove.row === row - 1 && lastMove.col === col - 1"
                :cx="cellSize * col" :cy="cellSize * row"
                :r="cellSize * 0.1"
                :fill="board[row - 1][col - 1] === BLACK ? '#ef4444' : '#ef4444'"
                opacity="0.8" />
            </template>
          </g>
        </g>

        <!-- Click areas -->
        <g v-for="row in BOARD_SIZE" :key="'click-r' + row">
          <rect v-for="col in BOARD_SIZE" :key="'click-' + row + '-' + col"
            :x="cellSize * col - cellSize / 2"
            :y="cellSize * row - cellSize / 2"
            :width="cellSize"
            :height="cellSize"
            fill="transparent"
            class="click-area"
            @click="handleCellClick(row - 1, col - 1)" />
        </g>

        <!-- Gradients -->
        <defs>
          <radialGradient id="blackGrad" cx="35%" cy="35%">
            <stop offset="0%" stop-color="#555" />
            <stop offset="100%" stop-color="#111" />
          </radialGradient>
          <radialGradient id="whiteGrad" cx="35%" cy="35%">
            <stop offset="0%" stop-color="#fff" />
            <stop offset="100%" stop-color="#ddd" />
          </radialGradient>
        </defs>
      </svg>

      <div v-if="gameOver" class="overlay">
        <div class="overlay-card">
          <h2>{{ winner ? (winner === BLACK ? '🖤 黑棋获胜！' : '🤍 白棋获胜！') : '🤝 平局！' }}</h2>
          <p>{{ winner ? '精彩的对局！' : '棋盘已满，势均力敌。' }}</p>
          <button type="button" class="btn-primary" @click="restartGame">再来一局</button>
        </div>
      </div>
    </div>

    <div class="bottom-actions">
      <button type="button" class="btn-ghost" @click="$router.push('/')">← 返回首页</button>
      <button type="button" class="btn-ghost" @click="undoMove" :disabled="history.length === 0 || gameOver">悔棋</button>
      <button type="button" class="btn-primary" @click="restartGame">重新开始</button>
    </div>
  </main>
</template>

<style>
.game.gomoku {
  background:
    radial-gradient(ellipse at 30% 0%, rgba(99,102,241,.06) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(234,179,8,.06) 0%, transparent 50%),
    linear-gradient(160deg, #f8fafc 0%, #fef9e7 50%, #eef2ff 100%);
}

.gomoku .top-bar {
  width: 100%;
  max-width: 560px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.status-row {
  display: flex;
  gap: 10px;
  align-items: center;
}

.status-box {
  display: flex;
  align-items: center;
  gap: 8px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 8px 18px;
  text-align: center;
  border: 1px solid rgba(99,102,241,.1);
  font-size: .88rem;
  font-weight: 600;
  color: #111827;
  transition: all .2s;
}

.stone-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,.15);
  flex-shrink: 0;
}

.status-box.moves span {
  font-size: .7rem;
  color: #64748b;
  display: block;
}

.status-box.moves strong {
  font-size: 1.05rem;
  color: #111827;
}

.gomoku .hint {
  margin: 0 0 12px;
  font-size: .82rem;
  color: #94a3b8;
}

.board-area {
  position: relative;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15,23,42,.12);
}

.gomoku-board {
  display: block;
  border-radius: 12px;
}

.click-area {
  cursor: pointer;
}

.click-area:hover {
  fill: rgba(99,102,241,.08);
}

/* overlay */
.gomoku .overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15,23,42,.4);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.gomoku .overlay-card {
  background: white;
  border-radius: 16px;
  padding: 24px 28px;
  text-align: center;
  box-shadow: 0 14px 30px rgba(15,23,42,.16);
}

.gomoku .overlay-card h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
  color: #111827;
}

.gomoku .overlay-card p {
  margin: 0 0 16px;
  color: #64748b;
  font-size: .9rem;
}

.gomoku .bottom-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.gomoku .btn-primary,
.gomoku .btn-ghost {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: .88rem;
  transition: all .2s;
}

.gomoku .btn-primary {
  background: #4f46e5;
  color: white;
}

.gomoku .btn-primary:hover {
  background: #4338ca;
}

.gomoku .btn-ghost {
  background: rgba(255,255,255,.8);
  color: #4338ca;
  border: 1px solid rgba(99,102,241,.15);
}

.gomoku .btn-ghost:hover {
  background: #eef2ff;
}

.gomoku .btn-ghost:disabled {
  opacity: .4;
  cursor: not-allowed;
}

@media (min-width: 640px) {
  .game.gomoku { padding: 32px 24px; }
}
</style>
