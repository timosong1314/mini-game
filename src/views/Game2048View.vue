<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

function createEmptyBoard() {
  return Array.from({ length: 4 }, () => Array(4).fill(0))
}

function getBestScore() {
  if (typeof window === 'undefined') {
    return 0
  }
  return Number(window.localStorage.getItem('2048-best') || 0)
}

function cloneBoard(source) {
  return source.map((row) => [...row])
}

function getRandomTile() {
  return Math.random() < 0.9 ? 2 : 4
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

const board = ref(createEmptyBoard())
const score = ref(0)
const bestScore = ref(getBestScore())
const gameOver = ref(false)
const won = ref(false)
const touchStart = ref(null)
const boardSize = ref(400)
const showShareModal = ref(false)

function calcBoardSize() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const maxFromWidth = Math.min(vw * 0.85, 420)
  const maxFromHeight = vh * 0.5
  boardSize.value = Math.floor(Math.min(maxFromWidth, maxFromHeight))
}

const boardStyle = computed(() => ({
  width: boardSize.value + 'px',
  height: boardSize.value + 'px',
}))

function addRandomTile() {
  const emptyCells = []
  board.value.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (value === 0) {
        emptyCells.push([rowIndex, colIndex])
      }
    })
  })

  if (!emptyCells.length) {
    return false
  }

  const [rowIndex, colIndex] = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  board.value[rowIndex][colIndex] = getRandomTile()
  return true
}

function hasMoves() {
  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    for (let colIndex = 0; colIndex < 4; colIndex += 1) {
      const value = board.value[rowIndex][colIndex]
      if (value === 0) {
        return true
      }

      if (board.value[rowIndex][colIndex + 1] === value) {
        return true
      }

      if (board.value[rowIndex + 1]?.[colIndex] === value) {
        return true
      }
    }
  }

  return false
}

function slideLine(line) {
  const filtered = line.filter((value) => value !== 0)
  const merged = []
  let mergedScore = 0

  for (let index = 0; index < filtered.length; index += 1) {
    if (filtered[index] === filtered[index + 1]) {
      const nextValue = filtered[index] * 2
      merged.push(nextValue)
      mergedScore += nextValue
      index += 1
    } else {
      merged.push(filtered[index])
    }
  }

  while (merged.length < 4) {
    merged.push(0)
  }

  return { line: merged, scoreDelta: mergedScore }
}

function move(direction) {
  if (gameOver.value) {
    return
  }

  const nextBoard = createEmptyBoard()
  let moved = false
  let gainedScore = 0

  const lines = []
  if (direction === 'left' || direction === 'right') {
    board.value.forEach((row) => {
      lines.push([...row])
    })
  } else {
    for (let colIndex = 0; colIndex < 4; colIndex += 1) {
      lines.push(board.value.map((row) => row[colIndex]))
    }
  }

  const transformedLines = lines.map((line) => {
    const normalized = direction === 'left' || direction === 'up' ? line : [...line].reverse()
    const { line: movedLine, scoreDelta } = slideLine(normalized)
    if (!arraysEqual(normalized, movedLine)) {
      moved = true
    }
    gainedScore += scoreDelta
    return direction === 'left' || direction === 'up' ? movedLine : movedLine.reverse()
  })

  if (direction === 'left' || direction === 'right') {
    transformedLines.forEach((line, rowIndex) => {
      nextBoard[rowIndex] = line
    })
  } else {
    transformedLines.forEach((line, colIndex) => {
      line.forEach((value, rowIndex) => {
        nextBoard[rowIndex][colIndex] = value
      })
    })
  }

  if (!moved) {
    return
  }

  board.value = nextBoard
  score.value += gainedScore
  bestScore.value = Math.max(bestScore.value, score.value)
  window.localStorage.setItem('2048-best', String(bestScore.value))

  if (board.value.some((row) => row.includes(2048))) {
    won.value = true
  }

  addRandomTile()

  if (!hasMoves()) {
    gameOver.value = true
  }
}

function restartGame() {
  board.value = createEmptyBoard()
  score.value = 0
  gameOver.value = false
  won.value = false
  addRandomTile()
  addRandomTile()
}

function handleKeydown(event) {
  const actions = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
  }

  if (actions[event.key]) {
    event.preventDefault()
    move(actions[event.key])
  }
}

function handlePointerDown(event) {
  touchStart.value = { x: event.clientX, y: event.clientY }
}

function handlePointerUp(event) {
  if (!touchStart.value) {
    return
  }

  const deltaX = event.clientX - touchStart.value.x
  const deltaY = event.clientY - touchStart.value.y
  const threshold = 30

  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    touchStart.value = null
    return
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    move(deltaX > 0 ? 'right' : 'left')
  } else {
    move(deltaY > 0 ? 'down' : 'up')
  }

  touchStart.value = null
}

onMounted(() => {
  restartGame()
  window.addEventListener('keydown', handleKeydown)
  calcBoardSize()
  window.addEventListener('resize', calcBoardSize)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', calcBoardSize)
})

const tileClass = computed(() => (value) => {
  if (!value) {
    return 'tile tile--empty'
  }

  const colors = {
    2: 'tile--2',
    4: 'tile--4',
    8: 'tile--8',
    16: 'tile--16',
    32: 'tile--32',
    64: 'tile--64',
    128: 'tile--128',
    256: 'tile--256',
    512: 'tile--512',
    1024: 'tile--1024',
    2048: 'tile--2048',
  }

  return `tile ${colors[value] || 'tile--default'}`
})

const flatBoard = computed(() => board.value.flat())

const tileColors = {
  0: { bg: '#cdc1b4', fg: '#f9fafb' },
  2: { bg: '#eee4da', fg: '#776e65' },
  4: { bg: '#ede0c8', fg: '#776e65' },
  8: { bg: '#f2b179', fg: '#f9fafb' },
  16: { bg: '#f59563', fg: '#f9fafb' },
  32: { bg: '#f67c5f', fg: '#f9fafb' },
  64: { bg: '#f65e3b', fg: '#f9fafb' },
  128: { bg: '#edcf72', fg: '#f9fafb' },
  256: { bg: '#edcc61', fg: '#f9fafb' },
  512: { bg: '#edc850', fg: '#f9fafb' },
  1024: { bg: '#edc53f', fg: '#f9fafb' },
  2048: { bg: '#3c3a32', fg: '#f9fafb' },
}

function generateShareCanvas() {
  const canvas = document.createElement('canvas')
  const dpr = 2
  const size = 480
  const padding = 32
  const headerH = 80
  const footerH = 48
  const boardTop = padding + headerH
  const boardSize = size - padding * 2
  const totalH = boardTop + boardSize + footerH + padding

  canvas.width = size * dpr
  canvas.height = totalH * dpr
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  ctx.fillStyle = '#faf8ef'
  ctx.beginPath()
  ctx.roundRect(0, 0, size, totalH, 16)
  ctx.fill()

  ctx.fillStyle = '#776e65'
  ctx.font = 'bold 28px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('2048', padding, padding + 30)

  ctx.font = '14px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#a09080'
  ctx.fillText(`得分: ${score.value}   最佳: ${bestScore.value}`, padding, padding + 56)

  const bx = padding
  const by = boardTop
  ctx.fillStyle = '#bbada0'
  ctx.beginPath()
  ctx.roundRect(bx, by, boardSize, boardSize, 12)
  ctx.fill()

  const gap = 10
  const cellPad = 8
  const innerSize = boardSize - cellPad * 2
  const cellSize = (innerSize - gap * 3) / 4

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = board.value[r][c]
      const x = bx + cellPad + c * (cellSize + gap)
      const y = by + cellPad + r * (cellSize + gap)
      const colors = tileColors[val] || tileColors[0]

      ctx.fillStyle = colors.bg
      ctx.beginPath()
      ctx.roundRect(x, y, cellSize, cellSize, 8)
      ctx.fill()

      if (val > 0) {
        ctx.fillStyle = colors.fg
        ctx.font = `bold ${val >= 1000 ? 22 : val >= 100 ? 26 : 30}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(val), x + cellSize / 2, y + cellSize / 2 + 1)
      }
    }
  }

  ctx.fillStyle = '#a09080'
  ctx.font = '12px Inter, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('Mini Game Hub · 来挑战我吧！', size / 2, boardTop + boardSize + 16)

  return canvas
}

function openShareModal() {
  showShareModal.value = true
}

function closeShareModal() {
  showShareModal.value = false
}

function downloadScore() {
  const canvas = generateShareCanvas()
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `2048-score-${score.value}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}
</script>

<template>
  <main class="game">
    <header class="top-bar" style="display:flex;flex-direction:column;align-items:center;text-align:center;margin:0 auto 16px;">
      <p class="eyebrow">小游戏</p>
      <h1>2048</h1>
      <div class="score-row">
        <div class="score-box">
          <span>得分</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="score-box best" @click="openShareModal">
          <span>最佳 🏆</span>
          <strong>{{ bestScore }}</strong>
        </div>
      </div>
    </header>

    <p class="hint">滑动棋盘上下左右移动数字</p>

    <div class="board-area" :style="boardStyle">
      <div
        class="board"
        role="grid"
        aria-label="2048 game board"
        @pointerdown="handlePointerDown"
        @pointerup="handlePointerUp"
      >
        <div
          v-for="(value, index) in flatBoard"
          :key="index"
          :class="tileClass(value)"
        >
          {{ value || '' }}
        </div>
      </div>

      <div v-if="won || gameOver" class="overlay">
        <div class="overlay-card">
          <h2>{{ won ? '你赢了！' : '游戏结束' }}</h2>
          <p>{{ won ? '继续挑战更高的分数吧。' : '这局已经没有可移动的方向了。' }}</p>
          <button type="button" class="btn-primary" @click="restartGame">再来一局</button>
        </div>
      </div>
    </div>

    <div class="bottom-actions">
      <button type="button" class="btn-ghost" @click="$router.push('/')">← 返回首页</button>
      <button type="button" class="btn-primary" @click="restartGame">重新开始</button>
    </div>

    <div v-if="showShareModal" class="modal-mask" @click.self="closeShareModal">
      <div class="modal-box">
        <h3>分享战绩</h3>
        <p class="modal-score">本局得分 <strong>{{ score }}</strong> · 最佳 <strong>{{ bestScore }}</strong></p>
        <div class="modal-actions">
          <button type="button" class="btn-primary" @click="downloadScore">💾 保存图片</button>
          <button type="button" class="btn-ghost" @click="closeShareModal">关闭</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style>
.game {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 20px 16px;
  box-sizing: border-box;
  background:
    radial-gradient(ellipse at 30% 0%, rgba(99,102,241,.06) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(56,189,248,.06) 0%, transparent 50%),
    linear-gradient(160deg, #f8fafc 0%, #e0f2fe 50%, #eef2ff 100%);
  animation: fadeUp .5s ease-out;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- top bar ---- */
.top-bar {
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.eyebrow {
  margin: 0 0 2px;
  font-size: .7rem; font-weight: 700;
  letter-spacing: .2em; text-transform: uppercase;
  color: #6366f1;
}
.game h1 {
  margin: 0 0 12px;
  font-size: 1.8rem; font-weight: 800;
  color: #111827;
}
.score-row { display: flex; gap: 10px; }
.score-box {
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 8px 18px;
  text-align: center;
  border: 1px solid rgba(99,102,241,.1);
  min-width: 90px;
}
.score-box.best {
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  border-color: rgba(99,102,241,.25);
  cursor: pointer;
  transition: transform .15s, box-shadow .15s;
}
.score-box.best:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99,102,241,.15);
}
.score-box span { display: block; font-size: .7rem; color: #64748b; }
.score-box strong { font-size: 1.05rem; color: #111827; }

/* ---- hint ---- */
.hint {
  margin: 0 0 16px;
  font-size: .82rem; color: #94a3b8;
}

/* ---- board ---- */
.board-area {
  position: relative;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
  padding: 8px;
  background: #bbada0;
  border-radius: 16px;
  touch-action: none;
  user-select: none;
  width: 100%;
  height: 100%;
  cursor: grab;
  box-shadow: 0 8px 24px rgba(15,23,42,.12);
  box-sizing: border-box;
}
.tile {
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 700;
  color: #f9fafb;
  background: #cdc1b4;
  transition: transform .1s;
}
.tile--empty { background: #d6cdbf; }
.tile--2    { background: #eee4da; color: #776e65; }
.tile--4    { background: #ede0c8; color: #776e65; }
.tile--8    { background: #f2b179; }
.tile--16   { background: #f59563; }
.tile--32   { background: #f67c5f; }
.tile--64   { background: #f65e3b; }
.tile--128  { background: #edcf72; }
.tile--256  { background: #edcc61; }
.tile--512  { background: #edc850; }
.tile--1024 { background: #edc53f; }
.tile--2048 { background: #3c3a32; }
.tile--default { background: #3b82f6; }

/* ---- overlay ---- */
.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15,23,42,.4);
  border-radius: 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}
.overlay-card {
  background: white;
  border-radius: 16px;
  padding: 24px 28px;
  text-align: center;
  box-shadow: 0 14px 30px rgba(15,23,42,.16);
}
.overlay-card h2 { margin: 0 0 8px; font-size: 1.2rem; color: #111827; }
.overlay-card p { margin: 0 0 16px; color: #64748b; font-size: .9rem; }

/* ---- bottom actions ---- */
.bottom-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-primary, .btn-ghost {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: .88rem;
  transition: all .2s;
}
.btn-primary {
  background: #4f46e5;
  color: white;
}
.btn-primary:hover { background: #4338ca; }
.btn-ghost {
  background: rgba(255,255,255,.8);
  color: #4338ca;
  border: 1px solid rgba(99,102,241,.15);
}
.btn-ghost:hover { background: #eef2ff; }

/* ---- modal ---- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal-box {
  background: white;
  border-radius: 20px;
  padding: 28px 32px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(15,23,42,.2);
  max-width: 320px;
  width: 90%;
  animation: scaleIn .25s ease;
}
@keyframes scaleIn {
  from { transform: scale(.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.modal-box h3 {
  margin: 0 0 10px;
  font-size: 1.2rem;
  color: #111827;
}
.modal-score {
  margin: 0 0 20px;
  font-size: .9rem;
  color: #64748b;
}
.modal-score strong {
  color: #4f46e5;
  font-size: 1.1rem;
}
.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ---- responsive ---- */
@media (min-width: 640px) {
  .game { padding: 32px 24px; }
  .game h1 { font-size: 2.2rem; }
  .tile { font-size: 1.3rem; }
}
</style>
