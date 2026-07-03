<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/* ──────── 常量 ──────── */
const ROLE = { WEREWOLF: 'werewolf', SEER: 'seer', WITCH: 'witch', VILLAGER: 'villager', HUNTER: 'hunter' }
const PHASE = { SETUP: 'setup', ROLE_REVEAL: 'role_reveal', NIGHT_WOLF: 'night_wolf', NIGHT_SEER: 'night_seer', NIGHT_WITCH: 'night_witch', DAY_ANNOUNCE: 'day_announce', DAY_DISCUSS: 'day_discuss', DAY_VOTE: 'day_vote', NIGHT_HUNTER: 'night_hunter', GAME_OVER: 'game_over' }
const ROLE_LABEL = { [ROLE.WEREWOLF]: '狼人', [ROLE.SEER]: '预言家', [ROLE.WITCH]: '女巫', [ROLE.VILLAGER]: '村民', [ROLE.HUNTER]: '猎人' }
const ROLE_ICON = { [ROLE.WEREWOLF]: '🐺', [ROLE.SEER]: '🔮', [ROLE.WITCH]: '🧪', [ROLE.VILLAGER]: '👤', [ROLE.HUNTER]: '🏹' }
const ROLE_DESC = {
  [ROLE.WEREWOLF]: '每晚可以袭击一名玩家',
  [ROLE.SEER]: '每晚可以查验一名玩家的身份',
  [ROLE.WITCH]: '拥有一瓶解药和一瓶毒药',
  [ROLE.VILLAGER]: '白天投票放逐可疑玩家',
  [ROLE.HUNTER]: '出局时可以开枪带走一名玩家',
}

function getRoleConfig(n) {
  if (n <= 6) return { [ROLE.WEREWOLF]: 2, [ROLE.SEER]: 1, [ROLE.WITCH]: 1, [ROLE.VILLAGER]: 2 }
  if (n <= 8) return { [ROLE.WEREWOLF]: 2, [ROLE.SEER]: 1, [ROLE.WITCH]: 1, [ROLE.HUNTER]: 1, [ROLE.VILLAGER]: 3 }
  return { [ROLE.WEREWOLF]: 3, [ROLE.SEER]: 1, [ROLE.WITCH]: 1, [ROLE.HUNTER]: 1, [ROLE.VILLAGER]: 4 }
}

/* ──────── 状态 ──────── */
const phase = ref(PHASE.SETUP)
const playerCount = ref(6)
const players = ref([])          // { id, name, role, alive, isCurrentPlayer }
const currentPlayerIndex = ref(0) // 用于角色揭示阶段
const round = ref(0)
const nightLog = ref([])         // 每晚事件记录
const lastDeaths = ref([])       // 昨夜死亡玩家
const wolfTarget = ref(null)
const seerTarget = ref(null)
const seerResult = ref(null)
const witchSaveUsed = ref(false)
const witchPoisonUsed = ref(false)
const witchSave = ref(false)
const witchPoisonTarget = ref(null)
const hunterTarget = ref(null)
const voteSelections = ref({})   // voterId -> targetId
const discussionTime = ref(90)
const discussionTimer = ref(null)
const gameResult = ref(null)     // 'villager' | 'werewolf'
const showRoleCard = ref(false)
const viewingPlayer = ref(null)

/* ──────── 计算属性 ──────── */
const alivePlayers = computed(() => players.value.filter(p => p.alive))
const aliveWolves = computed(() => alivePlayers.value.filter(p => p.role === ROLE.WEREWOLF))
const wolfPlayers = computed(() => players.value.filter(p => p.role === ROLE.WEREWOLF))
const phaseTitle = computed(() => {
  const map = {
    [PHASE.SETUP]: '游戏设置',
    [PHASE.ROLE_REVEAL]: '确认身份',
    [PHASE.NIGHT_WOLF]: '🌙 狼人请行动',
    [PHASE.NIGHT_SEER]: '🌙 预言家请行动',
    [PHASE.NIGHT_WITCH]: '🌙 女巫请行动',
    [PHASE.DAY_ANNOUNCE]: '☀️ 天亮了',
    [PHASE.DAY_DISCUSS]: '☀️ 自由讨论',
    [PHASE.DAY_VOTE]: '☀️ 投票放逐',
    [PHASE.NIGHT_HUNTER]: '🏹 猎人技能',
    [PHASE.GAME_OVER]: '游戏结束',
  }
  return map[phase.value] || ''
})

/* ──────── 初始化 ──────── */
function shuffleRoles(n) {
  const config = getRoleConfig(n)
  const roles = []
  for (const [role, count] of Object.entries(config)) {
    for (let i = 0; i < count; i++) roles.push(role)
  }
  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]]
  }
  return roles
}

function startGame() {
  const roles = shuffleRoles(playerCount.value)
  players.value = Array.from({ length: playerCount.value }, (_, i) => ({
    id: i + 1,
    name: `玩家${i + 1}`,
    role: roles[i],
    alive: true,
  }))
  round.value = 0
  nightLog.value = []
  lastDeaths.value = []
  wolfTarget.value = null
  seerTarget.value = null
  seerResult.value = null
  witchSaveUsed.value = false
  witchPoisonUsed.value = false
  witchSave.value = false
  witchPoisonTarget.value = null
  hunterTarget.value = null
  voteSelections.value = {}
  gameResult.value = null
  currentPlayerIndex.value = 0
  phase.value = PHASE.ROLE_REVEAL
}

/* ──────── 角色揭示 ──────── */
function revealRole() {
  viewingPlayer.value = players.value[currentPlayerIndex.value]
  showRoleCard.value = true
}

function confirmRole() {
  showRoleCard.value = false
  if (currentPlayerIndex.value < players.value.length - 1) {
    currentPlayerIndex.value++
  } else {
    startNight()
  }
}

/* ──────── 夜晚流程 ──────── */
function startNight() {
  round.value++
  lastDeaths.value = []
  wolfTarget.value = null
  seerTarget.value = null
  seerResult.value = null
  witchSave.value = false
  witchPoisonTarget.value = null
  hunterTarget.value = null
  voteSelections.value = {}

  // 检查是否还有狼人
  if (aliveWolves.value.length === 0) {
    endGame('villager')
    return
  }
  phase.value = PHASE.NIGHT_WOLF
}

function confirmWolfTarget() {
  // 狼人投票结果（简化：取第一个选择或随机）
  const target = wolfTarget.value
  if (target === null) return
  // 进入预言家阶段
  const seer = players.value.find(p => p.role === ROLE.SEER && p.alive)
  if (seer) {
    phase.value = PHASE.NIGHT_SEER
  } else {
    // 没有预言家，跳到女巫
    const witch = players.value.find(p => p.role === ROLE.WITCH && p.alive)
    if (witch) {
      phase.value = PHASE.NIGHT_WITCH
    } else {
      resolveNight()
    }
  }
}

function confirmSeerAction() {
  if (seerTarget.value !== null) {
    const target = players.value.find(p => p.id === seerTarget.value)
    seerResult.value = target.role === ROLE.WEREWOLF ? '狼人' : '好人'
  }
  const witch = players.value.find(p => p.role === ROLE.WITCH && p.alive)
  if (witch) {
    phase.value = PHASE.NIGHT_WITCH
  } else {
    resolveNight()
  }
}

function confirmWitchAction() {
  if (witchPoisonTarget.value !== null && witchPoisonTarget.value !== -1) {
    witchPoisonUsed.value = true
  }
  resolveNight()
}

function resolveNight() {
  const deaths = []
  // 狼人袭击
  if (wolfTarget.value !== null) {
    const target = players.value.find(p => p.id === wolfTarget.value)
    if (target && target.alive) {
      // 女巫解救
      if (witchSave.value) {
        // 被救，不死
      } else {
        target.alive = false
        deaths.push(target)
      }
    }
  }
  // 女巫毒杀
  if (witchPoisonTarget.value !== null && witchPoisonTarget.value !== -1) {
    const target = players.value.find(p => p.id === witchPoisonTarget.value)
    if (target && target.alive) {
      target.alive = false
      deaths.push(target)
    }
  }
  lastDeaths.value = deaths
  nightLog.value.push({ round: round.value, deaths: deaths.map(d => d.name) })

  // 检查游戏是否结束
  if (checkGameEnd()) return

  phase.value = PHASE.DAY_ANNOUNCE
}

/* ──────── 白天流程 ──────── */
function startDiscussion() {
  phase.value = PHASE.DAY_DISCUSS
  discussionTime.value = 90
  startDiscussionTimer()
}

function startDiscussionTimer() {
  clearInterval(discussionTimer.value)
  discussionTimer.value = setInterval(() => {
    if (discussionTime.value > 0) {
      discussionTime.value--
    } else {
      clearInterval(discussionTimer.value)
      phase.value = PHASE.DAY_VOTE
    }
  }, 1000)
}

function startVoting() {
  clearInterval(discussionTimer.value)
  voteSelections.value = {}
  phase.value = PHASE.DAY_VOTE
}

function castVote(voterId, targetId) {
  voteSelections.value[voterId] = targetId
}

function finishVoting() {
  // 统计票数
  const tally = {}
  for (const targetId of Object.values(voteSelections.value)) {
    tally[targetId] = (tally[targetId] || 0) + 1
  }
  let maxVotes = 0
  let exiled = null
  let tie = false
  for (const [id, count] of Object.entries(tally)) {
    if (count > maxVotes) {
      maxVotes = count
      exiled = Number(id)
      tie = false
    } else if (count === maxVotes) {
      tie = true
    }
  }

  if (!tie && exiled !== null) {
    const player = players.value.find(p => p.id === exiled)
    if (player) {
      player.alive = false
      // 猎人技能
      if (player.role === ROLE.HUNTER) {
        phase.value = PHASE.NIGHT_HUNTER
        return
      }
    }
  }

  if (checkGameEnd()) return
  startNight()
}

function confirmHunterAction() {
  if (hunterTarget.value !== null) {
    const target = players.value.find(p => p.id === hunterTarget.value)
    if (target) {
      target.alive = false
    }
  }
  if (checkGameEnd()) return
  startNight()
}

function skipHunterAction() {
  if (checkGameEnd()) return
  startNight()
}

/* ──────── 胜负判定 ──────── */
function checkGameEnd() {
  const wolves = players.value.filter(p => p.role === ROLE.WEREWOLF && p.alive).length
  const nonWolves = players.value.filter(p => p.role !== ROLE.WEREWOLF && p.alive).length
  if (wolves === 0) {
    endGame('villager')
    return true
  }
  if (wolves >= nonWolves) {
    endGame('werewolf')
    return true
  }
  return false
}

function endGame(result) {
  gameResult.value = result
  phase.value = PHASE.GAME_OVER
}

function restartAll() {
  phase.value = PHASE.SETUP
  players.value = []
  clearInterval(discussionTimer.value)
}

/* ──────── 工具 ──────── */
const formatTime = computed(() => {
  const m = Math.floor(discussionTime.value / 60)
  const s = discussionTime.value % 60
  return `${m}:${String(s).padStart(2, '0')}`
})

function getVoteCount(playerId) {
  return Object.values(voteSelections.value).filter(id => id === playerId).length
}

function getVoterCount() {
  return Object.keys(voteSelections.value).length
}

onBeforeUnmount(() => {
  clearInterval(discussionTimer.value)
})
</script>

<template>
  <main class="game werewolf">
    <!-- ====== 设置阶段 ====== -->
    <template v-if="phase === 'setup'">
      <header class="top-bar">
        <p class="eyebrow">小游戏</p>
        <h1>🐺 狼人杀</h1>
      </header>
      <p class="hint">线下传手机，多人面对面推理</p>
      <div class="setup-card">
        <label class="setup-label">玩家人数</label>
        <div class="count-selector">
          <button v-for="n in [6,7,8,9,10]" :key="n"
            :class="['count-btn', { active: playerCount === n }]"
            @click="playerCount = n">{{ n }}人</button>
        </div>
        <div class="role-preview">
          <p class="role-preview-title">角色配置</p>
          <div v-for="(count, role) in getRoleConfig(playerCount)" :key="role" class="role-chip">
            <span>{{ ROLE_ICON[role] }}</span>
            <span>{{ ROLE_LABEL[role] }} ×{{ count }}</span>
          </div>
        </div>
        <button class="btn-primary big" @click="startGame">开始游戏</button>
      </div>
      <div class="bottom-actions">
        <button type="button" class="btn-ghost" @click="$router.push('/')">← 返回首页</button>
      </div>
    </template>

    <!-- ====== 角色揭示阶段 ====== -->
    <template v-else-if="phase === 'role_reveal'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round || 1 }} 轮</p>
        <h1>确认身份</h1>
      </header>
      <p class="hint">请将手机传给 <strong>{{ players[currentPlayerIndex]?.name }}</strong></p>
      <div class="role-reveal-area">
        <template v-if="!showRoleCard">
          <div class="pass-phone-card">
            <div class="pass-icon">📱</div>
            <p>确认周围没有其他人看到屏幕</p>
            <button class="btn-primary" @click="revealRole">查看身份</button>
          </div>
        </template>
        <template v-else>
          <div class="role-card" @click="confirmRole">
            <div class="role-card-icon">{{ ROLE_ICON[viewingPlayer?.role] }}</div>
            <div class="role-card-name">{{ viewingPlayer?.name }}</div>
            <div class="role-card-role">{{ ROLE_LABEL[viewingPlayer?.role] }}</div>
            <div class="role-card-desc">{{ ROLE_DESC[viewingPlayer?.role] }}</div>
            <p class="role-card-tap">点击确认并传给下一位玩家</p>
          </div>
        </template>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: ((currentPlayerIndex + (showRoleCard ? 1 : 0)) / players.length * 100) + '%' }"></div>
        </div>
        <p class="progress-text">{{ currentPlayerIndex + 1 }} / {{ players.length }}</p>
      </div>
    </template>

    <!-- ====== 狼人夜晚 ====== -->
    <template v-else-if="phase === 'night_wolf'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round }} 夜</p>
        <h1>🌙 狼人请行动</h1>
      </header>
      <p class="hint">请狼人选择要袭击的目标</p>
      <div class="action-area">
        <div class="wolf-players">
          <span v-for="w in wolfPlayers.filter(w=>w.alive)" :key="w.id" class="wolf-tag">
            🐺 {{ w.name }}
          </span>
        </div>
        <div class="target-grid">
          <button v-for="p in alivePlayers.filter(p => p.role !== ROLE.WEREWOLF)" :key="p.id"
            :class="['target-btn', { selected: wolfTarget === p.id }]"
            @click="wolfTarget = p.id">
            <span class="target-num">{{ p.id }}</span>
            <span class="target-name">{{ p.name }}</span>
          </button>
        </div>
        <button class="btn-primary" :disabled="wolfTarget === null" @click="confirmWolfTarget">确认袭击</button>
      </div>
    </template>

    <!-- ====== 预言家夜晚 ====== -->
    <template v-else-if="phase === 'night_seer'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round }} 夜</p>
        <h1>🔮 预言家请行动</h1>
      </header>
      <p class="hint">请选择要查验的玩家</p>
      <div class="action-area">
        <div class="target-grid">
          <button v-for="p in alivePlayers.filter(p => p.role !== ROLE.SEER)" :key="p.id"
            :class="['target-btn', { selected: seerTarget === p.id }]"
            @click="seerTarget = p.id">
            <span class="target-num">{{ p.id }}</span>
            <span class="target-name">{{ p.name }}</span>
          </button>
        </div>
        <div v-if="seerResult" class="seer-result" :class="seerResult === '狼人' ? 'evil' : 'good'">
          {{ players.find(p => p.id === seerTarget)?.name }} 的身份是：<strong>{{ seerResult }}</strong>
        </div>
        <button v-if="!seerResult" class="btn-primary" :disabled="seerTarget === null" @click="confirmSeerAction">确认查验</button>
        <button v-else class="btn-primary" @click="confirmSeerAction">继续</button>
      </div>
    </template>

    <!-- ====== 女巫夜晚 ====== -->
    <template v-else-if="phase === 'night_witch'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round }} 夜</p>
        <h1>🧪 女巫请行动</h1>
      </header>
      <p class="hint" v-if="wolfTarget">
        今夜 <strong>{{ players.find(p => p.id === wolfTarget)?.name }}</strong> 被狼人袭击
      </p>
      <p class="hint" v-else>今夜无人被袭击</p>
      <div class="action-area witch-area">
        <div class="witch-potions">
          <button :class="['potion-btn', 'save', { used: witchSaveUsed, active: witchSave }]"
            :disabled="witchSaveUsed"
            @click="witchSave = !witchSave">
            <span class="potion-icon">💚</span>
            <span>解药</span>
          </button>
          <button :class="['potion-btn', 'poison', { used: witchPoisonUsed }]"
            :disabled="witchPoisonUsed"
            @click="witchPoisonTarget = witchPoisonTarget === null ? -1 : null">
            <span class="potion-icon">💀</span>
            <span>毒药</span>
          </button>
        </div>
        <div v-if="witchPoisonTarget === -1" class="poison-select">
          <p class="hint">选择毒杀目标</p>
          <div class="target-grid">
            <button v-for="p in alivePlayers.filter(p => p.id !== wolfTarget)" :key="p.id"
              :class="['target-btn', { selected: witchPoisonTarget === p.id }]"
              @click="witchPoisonTarget = p.id">
              <span class="target-num">{{ p.id }}</span>
              <span class="target-name">{{ p.name }}</span>
            </button>
          </div>
        </div>
        <button class="btn-primary" @click="confirmWitchAction">确认</button>
      </div>
    </template>

    <!-- ====== 天亮宣布 ====== -->
    <template v-else-if="phase === 'day_announce'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round }} 天</p>
        <h1>☀️ 天亮了</h1>
      </header>
      <div class="announce-area">
        <template v-if="lastDeaths.length === 0">
          <div class="announce-card peaceful">
            <div class="announce-icon">🕊️</div>
            <p>昨夜是平安夜，无人死亡</p>
          </div>
        </template>
        <template v-else>
          <div class="announce-card death">
            <div class="announce-icon">💀</div>
            <p>昨夜死亡的玩家：</p>
            <div class="death-list">
              <span v-for="d in lastDeaths" :key="d.id" class="death-tag">
                {{ d.name }}
                <small>({{ ROLE_LABEL[d.role] }})</small>
              </span>
            </div>
          </div>
        </template>
        <button class="btn-primary" @click="startDiscussion">开始讨论</button>
      </div>
    </template>

    <!-- ====== 自由讨论 ====== -->
    <template v-else-if="phase === 'day_discuss'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round }} 天</p>
        <h1>☀️ 自由讨论</h1>
      </header>
      <div class="discuss-area">
        <div class="timer-ring">
          <span class="timer-value">{{ formatTime }}</span>
        </div>
        <div class="alive-grid">
          <div v-for="p in alivePlayers" :key="p.id" class="alive-tag">
            <span class="alive-num">{{ p.id }}</span>
            <span>{{ p.name }}</span>
          </div>
        </div>
        <button class="btn-primary" @click="startVoting">进入投票</button>
      </div>
    </template>

    <!-- ====== 投票阶段 ====== -->
    <template v-else-if="phase === 'day_vote'">
      <header class="top-bar">
        <p class="eyebrow">第 {{ round }} 天</p>
        <h1>☀️ 投票放逐</h1>
      </header>
      <p class="hint">每位存活玩家选择一名要放逐的玩家</p>
      <div class="vote-area">
        <div class="vote-progress">
          已投票: {{ getVoterCount() }} / {{ alivePlayers.length }}
        </div>
        <div v-for="voter in alivePlayers" :key="voter.id" class="vote-row">
          <div class="vote-row-label">{{ voter.name }}</div>
          <div class="vote-row-targets">
            <button v-for="p in alivePlayers.filter(p => p.id !== voter.id)" :key="p.id"
              :class="['vote-chip', { selected: voteSelections[voter.id] === p.id }]"
              @click="castVote(voter.id, p.id)">
              {{ p.id }}
            </button>
            <button :class="['vote-chip', 'skip', { selected: voteSelections[voter.id] === 0 }]"
              @click="castVote(voter.id, 0)">弃</button>
          </div>
        </div>
        <div class="vote-tally">
          <div v-for="p in alivePlayers" :key="'t'+p.id" class="tally-item" v-show="getVoteCount(p.id) > 0">
            <span>{{ p.name }}</span>
            <span class="tally-count">{{ getVoteCount(p.id) }} 票</span>
          </div>
        </div>
        <button class="btn-primary" :disabled="getVoterCount() < alivePlayers.length" @click="finishVoting">
          确认放逐
        </button>
      </div>
    </template>

    <!-- ====== 猎人技能 ====== -->
    <template v-else-if="phase === 'night_hunter'">
      <header class="top-bar">
        <p class="eyebrow">猎人技能</p>
        <h1>🏹 猎人请行动</h1>
      </header>
      <p class="hint">猎人被放逐，可以选择开枪带走一名玩家</p>
      <div class="action-area">
        <div class="target-grid">
          <button v-for="p in alivePlayers" :key="p.id"
            :class="['target-btn', { selected: hunterTarget === p.id }]"
            @click="hunterTarget = p.id">
            <span class="target-num">{{ p.id }}</span>
            <span class="target-name">{{ p.name }}</span>
          </button>
        </div>
        <div class="hunter-actions">
          <button class="btn-primary" :disabled="hunterTarget === null" @click="confirmHunterAction">开枪</button>
          <button class="btn-ghost" @click="skipHunterAction">放弃开枪</button>
        </div>
      </div>
    </template>

    <!-- ====== 游戏结束 ====== -->
    <template v-else-if="phase === 'game_over'">
      <header class="top-bar">
        <p class="eyebrow">游戏结束</p>
        <h1>{{ gameResult === 'villager' ? '🎉 好人阵营胜利' : '🐺 狼人阵营胜利' }}</h1>
      </header>
      <div class="result-area">
        <div class="result-banner" :class="gameResult">
          {{ gameResult === 'villager' ? '🏆 好人胜利' : '🐺 狼人胜利' }}
        </div>
        <div class="role-reveal-grid">
          <div v-for="p in players" :key="p.id" :class="['role-reveal-item', { dead: !p.alive }]">
            <span class="role-reveal-icon">{{ ROLE_ICON[p.role] }}</span>
            <span class="role-reveal-name">{{ p.name }}</span>
            <span class="role-reveal-role">{{ ROLE_LABEL[p.role] }}</span>
            <span class="role-reveal-status">{{ p.alive ? '存活' : '死亡' }}</span>
          </div>
        </div>
        <div class="bottom-actions">
          <button class="btn-primary" @click="startGame">再来一局</button>
          <button class="btn-ghost" @click="restartAll">返回设置</button>
          <button class="btn-ghost" @click="$router.push('/')">返回首页</button>
        </div>
      </div>
    </template>

    <!-- ====== 通用返回按钮 ====== -->
    <div v-if="phase !== 'setup' && phase !== 'game_over'" class="bottom-actions">
      <button type="button" class="btn-ghost" @click="restartAll">退出游戏</button>
    </div>
  </main>
</template>

<style>
.game.werewolf {
  background:
    radial-gradient(ellipse at 30% 0%, rgba(99,102,241,.06) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 100%, rgba(139,92,246,.06) 0%, transparent 50%),
    linear-gradient(160deg, #f8fafc 0%, #ede9fe 50%, #eef2ff 100%);
}

.werewolf .top-bar {
  width: 100%; max-width: 560px;
  margin-left: auto; margin-right: auto; margin-bottom: 12px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}

.werewolf .hint {
  margin: 0 0 16px; font-size: .88rem; color: #64748b;
}
.werewolf .hint strong { color: #4f46e5; }

/* ---- 设置 ---- */
.setup-card {
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  border-radius: 20px; padding: 28px 24px;
  border: 1px solid #e8eaf6;
  max-width: 400px; width: 100%;
  box-shadow: 0 4px 16px rgba(99,102,241,.08);
}
.setup-label {
  display: block; font-size: .82rem; font-weight: 600;
  color: #64748b; margin-bottom: 10px;
}
.count-selector { display: flex; gap: 8px; justify-content: center; margin-bottom: 20px; }
.count-btn {
  width: 52px; height: 42px; border-radius: 12px;
  border: 2px solid #e2e8f0; background: white;
  font-weight: 700; font-size: .95rem; color: #475569;
  cursor: pointer; transition: all .2s;
}
.count-btn.active {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white; border-color: transparent;
  box-shadow: 0 4px 12px rgba(99,102,241,.3);
}
.count-btn:hover:not(.active) { border-color: #a5b4fc; }
.role-preview {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
  margin-bottom: 20px;
}
.role-preview-title {
  width: 100%; font-size: .75rem; color: #94a3b8;
  margin-bottom: 4px; text-align: center;
}
.role-chip {
  display: flex; align-items: center; gap: 4px;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  padding: 6px 12px; border-radius: 999px;
  font-size: .8rem; font-weight: 600; color: #4338ca;
}

/* ---- 角色揭示 ---- */
.role-reveal-area { text-align: center; max-width: 400px; width: 100%; }
.pass-phone-card {
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px);
  border-radius: 20px; padding: 40px 24px;
  border: 1px solid #e8eaf6;
}
.pass-icon { font-size: 3rem; margin-bottom: 16px; }
.pass-phone-card p { margin: 0 0 20px; color: #64748b; font-size: .9rem; }
.role-card {
  background: linear-gradient(135deg, #312e81, #4c1d95);
  border-radius: 20px; padding: 40px 24px;
  color: white; cursor: pointer;
  box-shadow: 0 12px 32px rgba(67,56,202,.3);
  animation: scaleIn .3s ease;
}
.role-card-icon { font-size: 3.5rem; margin-bottom: 12px; }
.role-card-name { font-size: 1.1rem; font-weight: 600; opacity: .8; margin-bottom: 8px; }
.role-card-role { font-size: 1.8rem; font-weight: 800; margin-bottom: 12px; }
.role-card-desc { font-size: .88rem; opacity: .7; margin-bottom: 20px; }
.role-card-tap { font-size: .78rem; opacity: .5; }
.progress-bar {
  height: 4px; background: rgba(99,102,241,.15);
  border-radius: 999px; margin-top: 24px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px; transition: width .3s ease;
}
.progress-text { font-size: .78rem; color: #94a3b8; margin-top: 8px; }

/* ---- 行动区域 ---- */
.action-area {
  max-width: 480px; width: 100%; text-align: center;
}
.wolf-players {
  display: flex; gap: 8px; justify-content: center; margin-bottom: 16px; flex-wrap: wrap;
}
.wolf-tag {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white; padding: 6px 14px; border-radius: 999px;
  font-size: .82rem; font-weight: 600;
}
.target-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px; margin-bottom: 20px;
}
.target-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 8px; border-radius: 14px;
  border: 2px solid #e2e8f0; background: rgba(255,255,255,.85);
  cursor: pointer; transition: all .2s;
}
.target-btn:hover { border-color: #a5b4fc; }
.target-btn.selected {
  border-color: #6366f1;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  box-shadow: 0 4px 12px rgba(99,102,241,.15);
}
.target-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #6366f1; color: white;
  display: grid; place-items: center;
  font-size: .78rem; font-weight: 700;
}
.target-name { font-size: .82rem; font-weight: 600; color: #1e1b4b; }

/* ---- 预言家结果 ---- */
.seer-result {
  padding: 16px 20px; border-radius: 14px; margin-bottom: 16px;
  font-size: .95rem; font-weight: 600;
}
.seer-result.good {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #065f46; border: 1px solid #a7f3d0;
}
.seer-result.evil {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #991b1b; border: 1px solid #fca5a5;
}

/* ---- 女巫 ---- */
.witch-area { text-align: center; }
.witch-potions { display: flex; gap: 12px; justify-content: center; margin-bottom: 20px; }
.potion-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 16px 24px; border-radius: 16px;
  border: 2px solid #e2e8f0; background: white;
  cursor: pointer; transition: all .2s; font-weight: 600; font-size: .88rem;
}
.potion-btn:hover:not(:disabled) { border-color: #a5b4fc; }
.potion-btn.save.active { border-color: #10b981; background: #ecfdf5; }
.potion-btn.used { opacity: .3; cursor: not-allowed; }
.potion-icon { font-size: 1.8rem; }

/* ---- 宣布 ---- */
.announce-area { text-align: center; max-width: 400px; width: 100%; }
.announce-card {
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px);
  border-radius: 20px; padding: 32px 24px;
  border: 1px solid #e8eaf6; margin-bottom: 20px;
}
.announce-icon { font-size: 3rem; margin-bottom: 12px; }
.announce-card p { margin: 0; font-size: .95rem; color: #475569; }
.announce-card.peaceful { border-color: #a7f3d0; background: linear-gradient(135deg, rgba(236,253,245,.9), rgba(209,250,229,.9)); }
.death-list { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px; }
.death-tag {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #991b1b; padding: 8px 16px; border-radius: 999px;
  font-size: .88rem; font-weight: 600;
}
.death-tag small { opacity: .7; margin-left: 4px; }

/* ---- 讨论 ---- */
.discuss-area { text-align: center; max-width: 400px; width: 100%; }
.timer-ring {
  width: 100px; height: 100px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: grid; place-items: center; margin: 0 auto 20px;
  box-shadow: 0 8px 24px rgba(99,102,241,.25);
}
.timer-value { color: white; font-size: 1.5rem; font-weight: 800; }
.alive-grid {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 20px;
}
.alive-tag {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.85);
  padding: 8px 14px; border-radius: 999px;
  border: 1px solid #e8eaf6;
  font-size: .85rem; font-weight: 600; color: #1e1b4b;
}
.alive-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: #6366f1; color: white;
  display: grid; place-items: center;
  font-size: .7rem; font-weight: 700;
}

/* ---- 投票 ---- */
.vote-area { text-align: center; max-width: 560px; width: 100%; }
.vote-progress {
  font-size: .82rem; color: #64748b; margin-bottom: 16px;
  font-weight: 600;
}
.vote-row {
  background: rgba(255,255,255,.85);
  border-radius: 14px; padding: 12px 16px;
  border: 1px solid #e8eaf6; margin-bottom: 8px;
  text-align: left;
}
.vote-row-label {
  font-size: .85rem; font-weight: 700; color: #1e1b4b;
  margin-bottom: 8px;
}
.vote-row-targets { display: flex; flex-wrap: wrap; gap: 6px; }
.vote-chip {
  width: 36px; height: 36px; border-radius: 10px;
  border: 2px solid #e2e8f0; background: white;
  font-weight: 700; font-size: .82rem; color: #475569;
  cursor: pointer; transition: all .15s;
  display: grid; place-items: center;
}
.vote-chip.skip { width: auto; padding: 0 12px; font-size: .75rem; }
.vote-chip:hover { border-color: #a5b4fc; }
.vote-chip.selected {
  border-color: #6366f1; background: #6366f1; color: white;
}
.vote-tally {
  margin: 16px 0; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
}
.tally-item {
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  padding: 6px 14px; border-radius: 999px;
  font-size: .82rem; font-weight: 600; color: #4338ca;
  display: flex; gap: 6px; align-items: center;
}
.tally-count { font-weight: 800; }

/* ---- 猎人 ---- */
.hunter-actions { display: flex; gap: 10px; justify-content: center; margin-top: 16px; }

/* ---- 结果 ---- */
.result-area { text-align: center; max-width: 480px; width: 100%; }
.result-banner {
  padding: 20px; border-radius: 16px; margin-bottom: 20px;
  font-size: 1.3rem; font-weight: 800;
}
.result-banner.villager {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  color: #065f46; border: 1px solid #a7f3d0;
}
.result-banner.werewolf {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  color: #991b1b; border: 1px solid #fca5a5;
}
.role-reveal-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px; margin-bottom: 20px;
}
.role-reveal-item {
  background: rgba(255,255,255,.85);
  border-radius: 14px; padding: 14px 10px;
  border: 1px solid #e8eaf6;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
}
.role-reveal-item.dead { opacity: .5; }
.role-reveal-icon { font-size: 1.5rem; }
.role-reveal-name { font-size: .82rem; font-weight: 700; color: #1e1b4b; }
.role-reveal-role { font-size: .75rem; color: #6366f1; font-weight: 600; }
.role-reveal-status {
  font-size: .7rem; padding: 2px 8px; border-radius: 999px;
  background: #f1f5f9; color: #64748b;
}
.role-reveal-item.dead .role-reveal-status {
  background: #fee2e2; color: #991b1b;
}

/* ---- 通用按钮 ---- */
.werewolf .btn-primary,
.werewolf .btn-ghost {
  border: none; border-radius: 999px;
  padding: 10px 24px; cursor: pointer;
  font-weight: 600; font-size: .88rem; transition: all .2s;
}
.werewolf .btn-primary {
  background: #4f46e5; color: white;
}
.werewolf .btn-primary:hover { background: #4338ca; }
.werewolf .btn-primary:disabled { opacity: .4; cursor: not-allowed; }
.werewolf .btn-primary.big { padding: 14px 32px; font-size: 1rem; }
.werewolf .btn-ghost {
  background: rgba(255,255,255,.8); color: #4338ca;
  border: 1px solid rgba(99,102,241,.15);
}
.werewolf .btn-ghost:hover { background: #eef2ff; }

.werewolf .bottom-actions {
  display: flex; gap: 10px; margin-top: 20px; justify-content: center;
}

@keyframes scaleIn {
  from { transform: scale(.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (min-width: 640px) {
  .game.werewolf { padding: 32px 24px; }
}
</style>
