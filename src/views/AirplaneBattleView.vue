<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ─── 游戏状态 ───
const canvasRef = ref(null)
const gameRunning = ref(false)
const gameOver = ref(false)
const score = ref(0)
const lives = ref(3)
const wave = ref(1)
const showStart = ref(true)
const highScore = ref(parseInt(localStorage.getItem('airplane_high_score') || '0'))

// ─── 游戏常量 ───
const CANVAS_W = 400
const CANVAS_H = 600
const PLAYER_W = 36
const PLAYER_H = 40
const BULLET_W = 4
const BULLET_H = 12
const ENEMY_W = 34
const ENEMY_H = 36
const PLAYER_SPEED = 5
const BULLET_SPEED = 8
const ENEMY_BULLET_SPEED = 4

// ─── 游戏变量 ───
let player = { x: 0, y: 0 }
let bullets = []
let enemies = []
let enemyBullets = []
let particles = []
let stars = []
let keys = {}
let animFrame = null
let shootTimer = 0
const SHOOT_INTERVAL = 12 // 自动射击间隔（帧）
let enemiesKilled = 0
let enemiesPerWave = 6
let spawnTimer = 0
let spawnInterval = 90
let enemiesSpawned = 0
let starOffset = 0

// ─── 道具系统 ───
let powerups = [] // 掉落的道具
let activePowerup = null // { type, timer }
const POWERUP_TYPES = [
  { type: 'double', icon: '⚡', color: '#fbbf24', label: '双发弹' },
  { type: 'triple', icon: '🔱', color: '#f97316', label: '三发散射' },
  { type: 'shield', icon: '🛡️', color: '#3b82f6', label: '护盾' },
  { type: 'speed',  icon: '💨', color: '#a855f7', label: '快速子弹' },
]
const POWERUP_DROP_RATE = 0.15 // 15% 掉落率
const POWERUP_DURATION = { double: 480, triple: 360, shield: 1, speed: 360 } // 帧数（shield=1次）
const POWERUP_SIZE = 22
const POWERUP_FALL_SPEED = 1.5

// ─── 初始化星空背景 ───
function createStars() {
  stars = []
  for (let i = 0; i < 60; i++) {
    stars.push({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: 0.5 + Math.random() * 2,
      speed: 0.3 + Math.random() * 1.2,
      brightness: 0.3 + Math.random() * 0.7
    })
  }
}

function initGame() {
  player = { x: CANVAS_W / 2 - PLAYER_W / 2, y: CANVAS_H - 80 }
  bullets = []
  enemies = []
  enemyBullets = []
  particles = []
  score.value = 0
  lives.value = 3
  wave.value = 1
  gameOver.value = false
  enemiesKilled = 0
  enemiesPerWave = 6
  spawnTimer = 0
  spawnInterval = 90
  enemiesSpawned = 0
  shootTimer = 0
  powerups = []
  activePowerup = null
  createStars()
}

// ─── 粒子效果 ───
function spawnExplosion(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14
    const speed = 1.5 + Math.random() * 3
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 20 + Math.random() * 15,
      maxLife: 35,
      size: 2 + Math.random() * 3,
      color
    })
  }
}

// ─── 碰撞检测 ───
function rectCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

// ─── 生成敌人 ───
function spawnEnemy() {
  const cols = 5
  const spacing = CANVAS_W / (cols + 1)
  const col = Math.floor(Math.random() * cols)
  const x = spacing * (col + 1) - ENEMY_W / 2
  const types = [
    { color: '#dc2626', speed: 1.3, hp: 1, score: 100 },
    { color: '#ea580c', speed: 1.6, hp: 1, score: 150 },
    { color: '#7c3aed', speed: 0.9, hp: 2, score: 200 },
  ]
  const typeIdx = wave.value >= 3 ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 2)
  const type = types[typeIdx]
  // 预先决定是否掉落道具及类型
  const hasDrop = Math.random() < POWERUP_DROP_RATE
  const dropInfo = hasDrop ? POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)] : null
  enemies.push({
    x, y: -ENEMY_H,
    w: ENEMY_W, h: ENEMY_H,
    vx: (Math.random() > 0.5 ? 1 : -1) * (0.8 + Math.random() * 1),
    vy: type.speed + wave.value * 0.15,
    hp: type.hp,
    maxHp: type.hp,
    color: type.color,
    score: type.score,
    shootTimer: 60 + Math.floor(Math.random() * 120),
    dropInfo // null 或 { type, icon, color, label }
  })
}

// ─── 游戏主循环 ───
function gameLoop() {
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx || !gameRunning.value) return

  // 清屏 - 深蓝天空渐变
  const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
  skyGrad.addColorStop(0, '#0a0e27')
  skyGrad.addColorStop(0.5, '#0f1b3d')
  skyGrad.addColorStop(1, '#1a1040')
  ctx.fillStyle = skyGrad
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  // ─── 更新和绘制星空 ───
  starOffset += 0.5
  for (const star of stars) {
    star.y += star.speed
    if (star.y > CANVAS_H) {
      star.y = -2
      star.x = Math.random() * CANVAS_W
    }
    ctx.globalAlpha = star.brightness * (0.6 + 0.4 * Math.sin(starOffset * 0.05 + star.x))
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // ─── 玩家移动（四方向） ───
  if (keys['ArrowLeft'] || keys['a']) player.x -= PLAYER_SPEED
  if (keys['ArrowRight'] || keys['d']) player.x += PLAYER_SPEED
  if (keys['ArrowUp'] || keys['w']) player.y -= PLAYER_SPEED
  if (keys['ArrowDown'] || keys['s']) player.y += PLAYER_SPEED
  player.x = Math.max(4, Math.min(CANVAS_W - PLAYER_W - 4, player.x))
  player.y = Math.max(36, Math.min(CANVAS_H - PLAYER_H - 4, player.y))

  // ─── 自动射击 ───
  shootTimer++
  if (shootTimer >= SHOOT_INTERVAL) {
    shoot()
    shootTimer = 0
  }

  // ─── 生成敌人 ───
  if (enemiesSpawned < enemiesPerWave) {
    spawnTimer++
    if (spawnTimer >= spawnInterval) {
      spawnEnemy()
      enemiesSpawned++
      spawnTimer = 0
    }
  }

  // ─── 更新子弹 ───
  const bSpeed = (activePowerup && activePowerup.type === 'speed') ? BULLET_SPEED * 1.8 : BULLET_SPEED
  bullets = bullets.filter(b => {
    b.y -= bSpeed
    if (b.vx) b.x += b.vx // 散射水平偏移
    if (b.y < -BULLET_H) return false
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      if (rectCollide({ x: b.x, y: b.y, w: BULLET_W, h: BULLET_H }, e)) {
        e.hp--
        if (e.hp <= 0) {
          spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, e.color)
          score.value += e.score
          enemiesKilled++
          // 道具掉落（由生成时预先决定）
          if (e.dropInfo) {
            powerups.push({
              x: e.x + e.w / 2 - POWERUP_SIZE / 2,
              y: e.y + e.h / 2,
              w: POWERUP_SIZE, h: POWERUP_SIZE,
              type: e.dropInfo.type,
              icon: e.dropInfo.icon,
              color: e.dropInfo.color,
              label: e.dropInfo.label,
              bobOffset: Math.random() * Math.PI * 2
            })
          }
          enemies.splice(i, 1)
        }
        return false
      }
    }
    return true
  })

  // ─── 更新敌人 ───
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    e.x += e.vx
    e.y += e.vy
    if (e.x <= 4 || e.x + e.w >= CANVAS_W - 4) e.vx *= -1
    e.x = Math.max(4, Math.min(CANVAS_W - e.w - 4, e.x))

    // 敌人射击
    e.shootTimer--
    if (e.shootTimer <= 0 && e.y > 0) {
      e.shootTimer = 80 + Math.floor(Math.random() * 100)
      enemyBullets.push({
        x: e.x + e.w / 2 - 2,
        y: e.y + e.h,
        w: 4, h: 10,
        vy: ENEMY_BULLET_SPEED
      })
    }

    // 敌人到达底部
    if (e.y + e.h >= CANVAS_H - 20) {
      spawnExplosion(e.x + e.w / 2, e.y + e.h / 2, '#ef4444')
      enemies.splice(i, 1)
      lives.value--
      if (lives.value <= 0) {
        endGame()
        return
      }
    }
  }

  // ─── 更新敌人子弹 ───
  enemyBullets = enemyBullets.filter(b => {
    b.y += b.vy
    if (b.y > CANVAS_H) return false
    if (rectCollide(b, { x: player.x, y: player.y, w: PLAYER_W, h: PLAYER_H })) {
      // 护盾抵挡
      if (activePowerup && activePowerup.type === 'shield') {
        activePowerup = null
        spawnExplosion(player.x + PLAYER_W / 2, player.y, '#3b82f6')
        return false
      }
      spawnExplosion(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, '#3b82f6')
      lives.value--
      if (lives.value <= 0) {
        endGame()
      }
      return false
    }
    return true
  })

  // ─── 更新掉落道具 ───
  powerups = powerups.filter(p => {
    p.y += POWERUP_FALL_SPEED
    p.bobOffset += 0.08
    if (p.y > CANVAS_H) return false
    // 玩家拾取
    if (rectCollide(p, { x: player.x, y: player.y, w: PLAYER_W, h: PLAYER_H })) {
      activePowerup = { type: p.type, timer: POWERUP_DURATION[p.type], icon: p.icon, label: p.label, color: p.color }
      spawnExplosion(p.x + p.w / 2, p.y + p.h / 2, p.color)
      return false
    }
    return true
  })

  // ─── 更新道具计时器 ───
  if (activePowerup) {
    activePowerup.timer--
    if (activePowerup.timer <= 0) {
      activePowerup = null
    }
  }

  // ─── 更新粒子 ───
  particles = particles.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.vx *= 0.96
    p.vy *= 0.96
    p.life--
    return p.life > 0
  })

  // ─── 检查波次完成 ───
  if (enemiesKilled >= enemiesPerWave && enemies.length === 0 && enemiesSpawned >= enemiesPerWave) {
    wave.value++
    enemiesPerWave = 5 + wave.value * 2
    spawnInterval = Math.max(30, 90 - wave.value * 8)
    enemiesKilled = 0
    enemiesSpawned = 0
    spawnTimer = 0
  }

  // ─── 绘制掉落道具 ───
  for (const p of powerups) {
    const bobY = Math.sin(p.bobOffset) * 3
    // 光晕
    ctx.globalAlpha = 0.25
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2 + bobY, p.w * 0.7, 0, Math.PI * 2)
    ctx.fill()
    // 背景圆
    ctx.globalAlpha = 0.85
    ctx.fillStyle = '#1e293b'
    ctx.beginPath()
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2 + bobY, p.w / 2, 0, Math.PI * 2)
    ctx.fill()
    // 图标
    ctx.globalAlpha = 1
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.icon, p.x + p.w / 2, p.y + p.h / 2 + bobY + 5)
  }
  ctx.globalAlpha = 1

  // ─── 绘制玩家飞机 ───
  drawAirplane(ctx, player.x, player.y, PLAYER_W, PLAYER_H, '#3b82f6', '#60a5fa')

  // 护盾光环
  if (activePowerup && activePowerup.type === 'shield') {
    ctx.strokeStyle = 'rgba(59,130,246,0.5)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, PLAYER_W * 0.75, 0, Math.PI * 2)
    ctx.stroke()
    ctx.strokeStyle = 'rgba(96,165,250,0.3)'
    ctx.beginPath()
    ctx.arc(player.x + PLAYER_W / 2, player.y + PLAYER_H / 2, PLAYER_W * 0.9, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ─── 绘制敌人 ───
  for (const e of enemies) {
    drawEnemyPlane(ctx, e.x, e.y, e.w, e.h, e.color, darkenColor(e.color))
    // 血条
    if (e.maxHp > 1) {
      const barW = e.w * 0.8
      const barH = 3
      const barX = e.x + (e.w - barW) / 2
      const barY = e.y - 6
      ctx.fillStyle = '#333'
      ctx.fillRect(barX, barY, barW, barH)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(barX, barY, barW * (e.hp / e.maxHp), barH)
    }
    // 掉落标识
    if (e.dropInfo) {
      const cx = e.x + e.w / 2
      const cy = e.y + e.h + 10
      const pulse = 0.7 + 0.3 * Math.sin(starOffset * 0.1 + e.x)
      // 光晕
      ctx.globalAlpha = 0.2 * pulse
      ctx.fillStyle = e.dropInfo.color
      ctx.beginPath()
      ctx.arc(cx, cy, 10, 0, Math.PI * 2)
      ctx.fill()
      // 小圆底
      ctx.globalAlpha = 0.85
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(cx, cy, 7, 0, Math.PI * 2)
      ctx.fill()
      // 图标
      ctx.globalAlpha = pulse
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(e.dropInfo.icon, cx, cy + 3.5)
      ctx.globalAlpha = 1
    }
  }

  // ─── 绘制玩家子弹 ───
  ctx.fillStyle = '#fbbf24'
  ctx.shadowColor = '#fbbf24'
  ctx.shadowBlur = 8
  for (const b of bullets) {
    ctx.beginPath()
    ctx.ellipse(b.x + BULLET_W / 2, b.y + BULLET_H / 2, BULLET_W / 2, BULLET_H / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // ─── 绘制敌人子弹 ───
  ctx.fillStyle = '#f87171'
  ctx.shadowColor = '#f87171'
  ctx.shadowBlur = 6
  for (const b of enemyBullets) {
    ctx.beginPath()
    ctx.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2, b.h / 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // ─── 绘制粒子 ───
  for (const p of particles) {
    ctx.globalAlpha = p.life / p.maxLife
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // ─── HUD ───
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.fillRect(0, 0, CANVAS_W, 32)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 13px Inter, system-ui, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(`分数: ${score.value}`, 10, 21)
  ctx.textAlign = 'center'
  ctx.fillText(`第 ${wave.value} 波`, CANVAS_W / 2, 21)
  ctx.textAlign = 'right'
  for (let i = 0; i < lives.value; i++) {
    ctx.fillStyle = '#3b82f6'
    ctx.beginPath()
    ctx.arc(CANVAS_W - 14 - i * 20, 16, 6, 0, Math.PI * 2)
    ctx.fill()
  }

  // ─── HUD: 当前道具 ───
  if (activePowerup) {
    const ap = activePowerup
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(CANVAS_W / 2 - 50, 34, 100, 18)
    ctx.fillStyle = ap.color
    ctx.font = 'bold 10px Inter, system-ui, sans-serif'
    ctx.textAlign = 'center'
    const timeLeft = ap.type === 'shield' ? '✦' : `▮`.repeat(Math.max(1, Math.ceil(ap.timer / 60)))
    ctx.fillText(`${ap.icon} ${ap.label} ${timeLeft}`, CANVAS_W / 2, 47)
  }

  animFrame = requestAnimationFrame(gameLoop)
}

function drawAirplane(ctx, x, y, w, h, color1, color2) {
  // 机身
  ctx.fillStyle = color1
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y)
  ctx.lineTo(x + w * 0.7, y + h * 0.4)
  ctx.lineTo(x + w * 0.65, y + h * 0.85)
  ctx.lineTo(x + w * 0.35, y + h * 0.85)
  ctx.lineTo(x + w * 0.3, y + h * 0.4)
  ctx.closePath()
  ctx.fill()

  // 机翼
  ctx.fillStyle = color2
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y + h * 0.45)
  ctx.lineTo(x - 2, y + h * 0.65)
  ctx.lineTo(x + w * 0.25, y + h * 0.65)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x + w * 0.7, y + h * 0.45)
  ctx.lineTo(x + w + 2, y + h * 0.65)
  ctx.lineTo(x + w * 0.75, y + h * 0.65)
  ctx.closePath()
  ctx.fill()

  // 尾翼
  ctx.fillStyle = color2
  ctx.beginPath()
  ctx.moveTo(x + w * 0.4, y + h * 0.75)
  ctx.lineTo(x + w * 0.15, y + h * 0.95)
  ctx.lineTo(x + w * 0.4, y + h * 0.9)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x + w * 0.6, y + h * 0.75)
  ctx.lineTo(x + w * 0.85, y + h * 0.95)
  ctx.lineTo(x + w * 0.6, y + h * 0.9)
  ctx.closePath()
  ctx.fill()

  // 驾驶舱
  ctx.fillStyle = 'rgba(147,197,253,0.7)'
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h * 0.28, w * 0.12, h * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()

  // 尾焰
  const flameH = 4 + Math.random() * 6
  ctx.fillStyle = '#fbbf24'
  ctx.globalAlpha = 0.8
  ctx.beginPath()
  ctx.moveTo(x + w * 0.4, y + h * 0.85)
  ctx.lineTo(x + w / 2, y + h * 0.85 + flameH)
  ctx.lineTo(x + w * 0.6, y + h * 0.85)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#f97316'
  ctx.globalAlpha = 0.5
  ctx.beginPath()
  ctx.moveTo(x + w * 0.43, y + h * 0.85)
  ctx.lineTo(x + w / 2, y + h * 0.85 + flameH * 1.4)
  ctx.lineTo(x + w * 0.57, y + h * 0.85)
  ctx.closePath()
  ctx.fill()
  ctx.globalAlpha = 1
}

function drawEnemyPlane(ctx, x, y, w, h, color1, color2) {
  // 机身（倒置）
  ctx.fillStyle = color1
  ctx.beginPath()
  ctx.moveTo(x + w / 2, y + h)
  ctx.lineTo(x + w * 0.7, y + h * 0.6)
  ctx.lineTo(x + w * 0.65, y + h * 0.15)
  ctx.lineTo(x + w * 0.35, y + h * 0.15)
  ctx.lineTo(x + w * 0.3, y + h * 0.6)
  ctx.closePath()
  ctx.fill()

  // 机翼
  ctx.fillStyle = color2
  ctx.beginPath()
  ctx.moveTo(x + w * 0.3, y + h * 0.55)
  ctx.lineTo(x - 2, y + h * 0.35)
  ctx.lineTo(x + w * 0.25, y + h * 0.35)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x + w * 0.7, y + h * 0.55)
  ctx.lineTo(x + w + 2, y + h * 0.35)
  ctx.lineTo(x + w * 0.75, y + h * 0.35)
  ctx.closePath()
  ctx.fill()

  // 驾驶舱
  ctx.fillStyle = 'rgba(255,200,200,0.5)'
  ctx.beginPath()
  ctx.ellipse(x + w / 2, y + h * 0.72, w * 0.12, h * 0.1, 0, 0, Math.PI * 2)
  ctx.fill()
}

function darkenColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`
}

function endGame() {
  gameRunning.value = false
  gameOver.value = true
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('airplane_high_score', String(score.value))
  }
  cancelAnimationFrame(animFrame)
}

function shoot() {
  if (!gameRunning.value) return
  const cx = player.x + PLAYER_W / 2
  const cy = player.y
  if (activePowerup && activePowerup.type === 'double') {
    bullets.push({ x: cx - 8, y: cy - BULLET_H })
    bullets.push({ x: cx + 4, y: cy - BULLET_H })
  } else if (activePowerup && activePowerup.type === 'triple') {
    bullets.push({ x: cx - 2, y: cy - BULLET_H, vx: -1.2 })
    bullets.push({ x: cx - 2, y: cy - BULLET_H, vx: 0 })
    bullets.push({ x: cx - 2, y: cy - BULLET_H, vx: 1.2 })
  } else {
    bullets.push({ x: cx - BULLET_W / 2, y: cy - BULLET_H })
  }
}

// ─── 触摸控制 ───
let touchStartX = 0
let touchStartY = 0
let touchMoving = false

function handleTouchStart(e) {
  e.preventDefault()
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  touchMoving = true
}

function handleTouchMove(e) {
  e.preventDefault()
  if (!touchMoving || !gameRunning.value) return
  const touch = e.touches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY
  player.x += dx * 0.8
  player.y += dy * 0.8
  player.x = Math.max(4, Math.min(CANVAS_W - PLAYER_W - 4, player.x))
  player.y = Math.max(36, Math.min(CANVAS_H - PLAYER_H - 4, player.y))
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

function handleTouchEnd(e) {
  e.preventDefault()
  touchMoving = false
}

// ─── 键盘事件 ───
function handleKeyDown(e) {
  keys[e.key] = true
  if (e.key === ' ' || e.key === 'ArrowUp') {
    e.preventDefault()
  }
}

function handleKeyUp(e) {
  keys[e.key] = false
}

// ─── 开始游戏 ───
function startGame() {
  showStart.value = false
  initGame()
  gameRunning.value = true
  animFrame = requestAnimationFrame(gameLoop)
}

function restartGame() {
  initGame()
  gameRunning.value = true
  gameOver.value = false
  animFrame = requestAnimationFrame(gameLoop)
}

function backToStart() {
  gameRunning.value = false
  gameOver.value = false
  showStart.value = true
  cancelAnimationFrame(animFrame)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  cancelAnimationFrame(animFrame)
})
</script>

<template>
  <main class="game airplane-battle">
    <!-- 开始界面 -->
    <template v-if="showStart">
      <header class="top-bar">
        <p class="eyebrow">小游戏</p>
        <h1>飞机大战</h1>
      </header>
      <p class="hint">经典飞行射击游戏</p>
      <div class="mode-select">
        <button class="mode-card" @click="startGame">
          <div class="mode-icon">✈️</div>
          <div class="mode-title">开始游戏</div>
          <div class="mode-desc">消灭所有敌机，制霸天空</div>
        </button>
      </div>
      <div v-if="highScore > 0" class="high-score-badge">
        🏆 最高分: {{ highScore }}
      </div>
      <div class="controls-info">
        <p>🎯 操作说明</p>
        <div class="control-item"><kbd>← → ↑ ↓</kbd> 或 <kbd>W A S D</kbd> 移动</div>
        <div class="control-item">🔫 自动射击</div>
        <div class="control-item">🎁 击落敌机随机掉落: ⚡双发 🔱散射 🛡️护盾 💨加速</div>
        <div class="control-item">📱 触屏：滑动移动</div>
      </div>
      <div class="bottom-actions">
        <button type="button" class="btn-ghost" @click="$router.push('/')">← 返回首页</button>
      </div>
    </template>

    <!-- 游戏界面 -->
    <template v-else>
      <header class="top-bar">
        <p class="eyebrow">小游戏</p>
        <h1>飞机大战 <span class="mode-badge">第 {{ wave }} 波</span></h1>
      </header>

      <div class="canvas-wrapper">
        <canvas
          ref="canvasRef"
          :width="CANVAS_W"
          :height="CANVAS_H"
          class="game-canvas"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
        />

        <!-- 游戏结束遮罩 -->
        <div v-if="gameOver" class="overlay">
          <div class="overlay-card">
            <h2>💥 游戏结束</h2>
            <p class="final-score">得分: {{ score }}</p>
            <p class="final-wave">坚持到第 {{ wave }} 波</p>
            <p v-if="score >= highScore && score > 0" class="new-record">🎉 新纪录！</p>
            <div class="overlay-btns">
              <button type="button" class="btn-primary" @click="restartGame">再来一局</button>
              <button type="button" class="btn-ghost" @click="backToStart">返回主页</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-actions">
        <button type="button" class="btn-ghost" @click="backToStart">退出游戏</button>
      </div>
    </template>
  </main>
</template>

<style>
.game.airplane-battle {
  background:
    radial-gradient(ellipse at 30% 0%, rgba(59,130,246,.06) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(139,92,246,.06) 0%, transparent 50%),
    linear-gradient(160deg, #f8fafc 0%, #eff6ff 50%, #eef2ff 100%);
}

.airplane-battle .top-bar {
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

.airplane-battle .hint {
  margin: 0 0 16px;
  font-size: .82rem;
  color: #94a3b8;
}

.airplane-battle .canvas-wrapper {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15,23,42,.18);
  border: 2px solid rgba(59,130,246,.2);
}

.airplane-battle .game-canvas {
  display: block;
  max-width: 100%;
  height: auto;
  touch-action: none;
}

/* overlay */
.airplane-battle .overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(15,23,42,.55);
  border-radius: 12px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.airplane-battle .overlay-card {
  background: white;
  border-radius: 16px;
  padding: 24px 28px;
  text-align: center;
  box-shadow: 0 14px 30px rgba(15,23,42,.16);
}

.airplane-battle .overlay-card h2 {
  margin: 0 0 8px;
  font-size: 1.3rem;
  color: #111827;
}

.airplane-battle .final-score {
  margin: 4px 0;
  font-size: 1.5rem;
  font-weight: 800;
  color: #3b82f6;
}

.airplane-battle .final-wave {
  margin: 2px 0 8px;
  font-size: .85rem;
  color: #64748b;
}

.airplane-battle .new-record {
  margin: 0 0 12px;
  font-size: .9rem;
  font-weight: 700;
  color: #f59e0b;
  animation: pulse 1s ease-in-out infinite;
}

.airplane-battle .overlay-btns {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 12px;
}

/* 最高分 */
.airplane-battle .high-score-badge {
  display: inline-block;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  color: #92400e;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: .8rem;
  font-weight: 700;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(251,191,36,.15);
}

/* 操作说明 */
.airplane-battle .controls-info {
  background: rgba(255,255,255,.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(59,130,246,.1);
  border-radius: 14px;
  padding: 14px 20px;
  margin-bottom: 16px;
  max-width: 320px;
}

.airplane-battle .controls-info p {
  margin: 0 0 8px;
  font-size: .85rem;
  font-weight: 700;
  color: #1e1b4b;
}

.airplane-battle .control-item {
  font-size: .78rem;
  color: #64748b;
  margin: 4px 0;
}

/* 按钮 */
.airplane-battle .btn-primary,
.airplane-battle .btn-ghost {
  border: none;
  border-radius: 999px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 600;
  font-size: .88rem;
  transition: all .2s;
}

.airplane-battle .btn-primary {
  background: #3b82f6;
  color: white;
}

.airplane-battle .btn-primary:hover {
  background: #2563eb;
}

.airplane-battle .btn-ghost {
  background: rgba(255,255,255,.8);
  color: #2563eb;
  border: 1px solid rgba(59,130,246,.15);
}

.airplane-battle .btn-ghost:hover {
  background: #eff6ff;
}

.airplane-battle .bottom-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.airplane-battle .mode-select {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.airplane-battle .mode-card {
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

.airplane-battle .mode-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(59,130,246,.12);
  border-color: #93c5fd;
}

.airplane-battle .mode-icon { font-size: 2.5rem; margin-bottom: 12px; }
.airplane-battle .mode-title { font-size: 1.1rem; font-weight: 700; color: #1e1b4b; margin-bottom: 6px; }
.airplane-battle .mode-desc { font-size: .82rem; color: #64748b; }
.airplane-battle .mode-badge {
  display: inline-block;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: white;
  font-size: .65rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  margin-left: 8px;
  vertical-align: middle;
}

@media (min-width: 640px) {
  .game.airplane-battle { padding: 32px 24px; }
}
</style>
