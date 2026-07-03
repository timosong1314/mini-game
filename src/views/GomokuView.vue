<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
const gameMode = ref(null) // 'pvp' or 'pve'
const aiThinking = ref(false)
const showModeSelect = ref(true)

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
  if (gameMode.value === 'pve' && currentPlayer.value === WHITE && !gameOver.value) return
  placePiece(row, col)
  if (gameMode.value === 'pve' && !gameOver.value && currentPlayer.value === WHITE) {
    triggerAI()
  }
}

function restartGame() {
  board.value = createBoard()
  currentPlayer.value = BLACK
  gameOver.value = false
  winner.value = null
  lastMove.value = null
  moveCount.value = 0
  history.value = []
  aiThinking.value = false
}

function backToModeSelect() {
  showModeSelect.value = true
  gameMode.value = null
  restartGame()
}

function undoMove() {
  if (history.value.length === 0 || gameOver.value) return
  if (gameMode.value === 'pve' && aiThinking.value) return
  const steps = gameMode.value === 'pve' ? 2 : 1
  for (let i = 0; i < steps && history.value.length > 0; i++) {
    const last = history.value.pop()
    board.value[last.row][last.col] = EMPTY
    currentPlayer.value = last.player
    moveCount.value--
  }
  lastMove.value = history.value.length > 0 ? { row: history.value[history.value.length - 1].row, col: history.value[history.value.length - 1].col } : null
}

const statusText = computed(() => {
  if (gameOver.value) {
    if (winner.value === BLACK) return '黑棋获胜！'
    if (winner.value === WHITE) return '白棋获胜！'
    return '平局！'
  }
  if (aiThinking.value) return 'AI 思考中...'
  if (gameMode.value === 'pve') {
    return currentPlayer.value === BLACK ? '你的回合' : 'AI 回合'
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

/* ──────── AI 逻辑 ──────── */
const SCORES = {
  FIVE: 1000000,
  OPEN_FOUR: 100000,
  CLOSED_FOUR: 10000,
  OPEN_THREE: 5000,
  CLOSED_THREE: 800,
  OPEN_TWO: 400,
  CLOSED_TWO: 80,
  ONE: 10,
}

function evaluateDirection(boardState, row, col, dr, dc, player) {
  let count = 1
  let block = 0
  let empty1 = 0, empty2 = 0

  // 正向
  for (let i = 1; i <= 4; i++) {
    const r = row + dr * i
    const c = col + dc * i
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) { block++; break }
    if (boardState[r][c] === player) count++
    else if (boardState[r][c] === EMPTY) { empty1++; break }
    else { block++; break }
  }

  // 反向
  for (let i = 1; i <= 4; i++) {
    const r = row - dr * i
    const c = col - dc * i
    if (r < 0 || r >= BOARD_SIZE || c < 0 || c >= BOARD_SIZE) { block++; break }
    if (boardState[r][c] === player) count++
    else if (boardState[r][c] === EMPTY) { empty2++; break }
    else { block++; break }
  }

  if (count >= 5) return SCORES.FIVE
  if (block === 2) return 0 // 两端都被堵死

  if (count === 4) {
    if (block === 0) return SCORES.OPEN_FOUR
    return SCORES.CLOSED_FOUR
  }
  if (count === 3) {
    if (block === 0) return SCORES.OPEN_THREE
    return SCORES.CLOSED_THREE
  }
  if (count === 2) {
    if (block === 0) return SCORES.OPEN_TWO
    return SCORES.CLOSED_TWO
  }
  return SCORES.ONE
}

function evaluatePosition(boardState, row, col, player) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  let score = 0
  for (const [dr, dc] of directions) {
    score += evaluateDirection(boardState, row, col, dr, dc, player)
  }
  return score
}

function getCandidates(boardState) {
  const candidates = new Set()
  const range = 2
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (boardState[r][c] !== EMPTY) {
        for (let dr = -range; dr <= range; dr++) {
          for (let dc = -range; dc <= range; dc++) {
            const nr = r + dr
            const nc = c + dc
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && boardState[nr][nc] === EMPTY) {
              candidates.add(nr * BOARD_SIZE + nc)
            }
          }
        }
      }
    }
  }
  return Array.from(candidates).map(v => [Math.floor(v / BOARD_SIZE), v % BOARD_SIZE])
}

function aiMove() {
  const boardState = board.value
  const aiPlayer = WHITE
  const humanPlayer = BLACK

  // 如果棋盘为空，下中心
  if (moveCount.value === 0) {
    return [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)]
  }

  const candidates = getCandidates(boardState)
  if (candidates.length === 0) return null

  let bestScore = -1
  let bestMove = candidates[0]

  for (const [r, c] of candidates) {
    // 进攻分数
    boardState[r][c] = aiPlayer
    const attackScore = evaluatePosition(boardState, r, c, aiPlayer)
    boardState[r][c] = EMPTY

    // 防守分数
    boardState[r][c] = humanPlayer
    const defendScore = evaluatePosition(boardState, r, c, humanPlayer)
    boardState[r][c] = EMPTY

    // 综合分数：进攻优先
    const totalScore = attackScore * 1.1 + defendScore

    if (totalScore > bestScore) {
      bestScore = totalScore
      bestMove = [r, c]
    }
  }

  return bestMove
}

function triggerAI() {
  aiThinking.value = true
  setTimeout(() => {
    const move = aiMove()
    if (move) {
      placePiece(move[0], move[1])
    }
    aiThinking.value = false
  }, 300)
}

function startPvP() {
  gameMode.value = 'pvp'
  showModeSelect.value = false
  restartGame()
}

function startPvE() {
  gameMode.value = 'pve'
  showModeSelect.value = false
  restartGame()
}
</script>

<template>
  <main class="game gomoku">
    <!-- 模式选择 -->
    <template v-if="showModeSelect">
      <header class="top-bar">
        <p class="eyebrow">小游戏</p>
        <h1>五子棋</h1>
      </header>
      <p class="hint">选择游戏模式</p>
      <div class="mode-select">
        <button class="mode-card" @click="startPvP">
          <div class="mode-icon">👥</div>
          <div class="mode-title">双人对战</div>
          <div class="mode-desc">两人轮流落子</div>
        </button>
        <button class="mode-card" @click="startPvE">
          <div class="mode-icon">🤖</div>
          <div class="mode-title">人机对战</div>
          <div class="mode-desc">挑战 AI 电脑</div>
        </button>
      </div>
      <div class="bottom-actions">
        <button type="button" class="btn-ghost" @click="$router.push('/')">← 返回首页</button>
      </div>
    </template>

    <!-- 游戏界面 -->
    <template v-else>
      <header class="top-bar">
        <p class="eyebrow">小游戏</p>
        <h1>五子棋 <span class="mode-badge">{{ gameMode === 'pve' ? '人机' : '双人' }}</span></h1>
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

      <p class="hint">{{ gameMode === 'pve' ? '你执黑先行，点击棋盘落子' : '点击棋盘交叉点落子，先连成五子者胜' }}</p>

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
              :class="{ disabled: gameMode === 'pve' && currentPlayer === WHITE && !gameOver }"
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

        <!-- AI 思考遮罩 -->
        <div v-if="aiThinking" class="ai-thinking-overlay">
          <div class="ai-thinking-card">
            <div class="ai-thinking-icon">🤖</div>
            <p>AI 思考中...</p>
          </div>
        </div>

        <div v-if="gameOver" class="overlay">
          <div class="overlay-card">
            <h2>{{ winner ? (winner === BLACK ? '🖤 黑棋获胜！' : '🤍 白棋获胜！') : '🤝 平局！' }}</h2>
            <p>{{ winner ? (gameMode === 'pve' ? (winner === BLACK ? '恭喜你战胜了 AI！' : 'AI 获胜，再接再厉！') : '精彩的对局！') : '棋盘已满，势均力敌。' }}</p>
            <button type="button" class="btn-primary" @click="restartGame">再来一局</button>
          </div>
        </div>
      </div>

      <div class="bottom-actions">
        <button type="button" class="btn-ghost" @click="backToModeSelect">切换模式</button>
        <button type="button" class="btn-ghost" @click="undoMove" :disabled="history.length === 0 || gameOver || aiThinking">悔棋</button>
        <button type="button" class="btn-primary" @click="restartGame">重新开始</button>
      </div>
    </template>
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

/* 模式选择 */
.mode-select {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: center;
}
.mode-card {
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid #e8eaf6;
  border-radius: 18px;
  padding: 28px 32px;
  text-align: center;
  cursor: pointer;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  min-width: 160px;
}
.mode-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(99,102,241,.12);
  border-color: #c7d2fe;
}
.mode-card:active {
  transform: translateY(0);
}
.mode-icon {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.mode-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 6px;
}
.mode-desc {
  font-size: .82rem;
  color: #64748b;
}
.mode-badge {
  display: inline-block;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: .65rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  margin-left: 8px;
  vertical-align: middle;
}
.click-area.disabled {
  cursor: not-allowed;
}
.click-area.disabled:hover {
  fill: transparent;
}

/* AI 思考遮罩 */
.ai-thinking-overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15,23,42,.25);
  border-radius: 12px;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
  z-index: 10;
}
.ai-thinking-card {
  background: rgba(255,255,255,.95);
  border-radius: 16px;
  padding: 24px 32px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(15,23,42,.15);
}
.ai-thinking-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
  animation: pulse 1s ease-in-out infinite;
}
.ai-thinking-card p {
  margin: 0;
  font-size: .95rem;
  font-weight: 600;
  color: #4338ca;
}

@media (min-width: 640px) {
  .game.gomoku { padding: 32px 24px; }
}
</style>
