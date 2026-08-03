<template>
  <main class="anniversary">
    <section class="hero">
      <p class="eyebrow">Time Capsule</p>
      <h1>时光胶囊</h1>
      <p class="desc">把值得铭记的时光封进胶囊，看岁月一点点靠近那些温柔的约定。</p>
    </section>

    <section class="cards">
      <article class="card-wrap" :class="`card--${item.type}`" v-for="item in events" :key="item.id">
        <button class="card-delete" aria-label="删除" @click="removeEvent(item.id)">删除</button>
        <div
          class="card"
          :class="['card--' + item.type, dragId === item.id && dragging ? 'no-anim' : '']"
          :style="cardStyle(item.id)"
          @pointerdown="onSwipeStart($event, item.id)"
          @pointermove="onSwipeMove($event, item.id)"
          @pointerup="onSwipeEnd(item.id)"
          @pointercancel="onSwipeEnd(item.id)"
        >
          <div class="card-info">
            <div class="card-label-row">
              <span class="card-dot"></span>
              <span class="card-title">{{ item.label }}</span>
            </div>
            <p class="card-date">{{ item.type === 'festival' ? nextFestivalDate(item.date).toLocaleDateString() : formatDate(item.date) }}</p>
          </div>
          <div class="card-stat">
            <div class="card-stat-text">
              <p class="card-status">{{ statusText(item) }}</p>
            </div>
            <div class="card-number-badge" :class="{ compact: isStatCompact(item) }">
              <span class="card-number">{{ statNumber(item) }}</span>
            </div>
          </div>
        </div>
      </article>
    </section>

    <button class="fab" aria-label="新增卡片" @click="openForm">＋</button>

    <transition name="modal">
      <div v-if="showForm" class="modal-mask" @click.self="closeForm">
        <div class="modal">
          <button class="modal-close" aria-label="关闭" @click="closeForm">×</button>
          <p class="form-title">新增卡片</p>

          <div class="field-group">
            <label>名称</label>
            <input v-model="form.label" placeholder="例如：初次见面" />
          </div>

          <div class="field-group">
            <label>类型</label>
            <div class="radio-group">
              <label :class="{ active: form.type === 'anniversary' }">
                <input type="radio" value="anniversary" v-model="form.type" />
                纪念日
              </label>
              <label :class="{ active: form.type === 'birthday' }">
                <input type="radio" value="birthday" v-model="form.type" />
                生日
              </label>
              <label :class="{ active: form.type === 'festival' }">
                <input type="radio" value="festival" v-model="form.type" />
                节日
              </label>
            </div>
          </div>

          <div class="field-group">
            <label>日期</label>
            <input type="date" v-model="form.date" class="date-input" />
          </div>

          <button class="add-button" :disabled="!canAdd" @click="addEvent">保存卡片</button>
        </div>
      </div>
    </transition>
  </main>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const savedEvents = localStorage.getItem('anniversaryEvents')
const events = ref(
  savedEvents
    ? JSON.parse(savedEvents)
    : [
        { id: 1, label: '元旦', date: '01-01', type: 'festival' },
        { id: 2, label: '春节', date: 'spring', type: 'festival' },
        { id: 3, label: '初次见面', date: '2022-08-07', type: 'anniversary' },
        { id: 4, label: '生日', date: '1996-05-22', type: 'birthday' }
      ]
)

const form = ref({
  label: '',
  date: new Date().toISOString().slice(0, 10),
  type: 'anniversary',
})

const showForm = ref(false)
function openForm() {
  showForm.value = true
}
function closeForm() {
  showForm.value = false
}

const canAdd = computed(() => {
  return !!form.value.label.trim() && !!form.value.date
})

// 天数较多（>=4 位数）时缩小该卡片数字区字号
function isStatCompact(item) {
  const n = statNumber(item)
  return typeof n === 'number' && String(n).length >= 4
}

// 未来几年春节公历日期（用于倒计时查找）
const springFestival = [
  '2026-02-17', '2027-02-06', '2028-01-26', '2029-02-13', '2030-02-03',
  '2031-01-23', '2032-02-11', '2033-01-31', '2034-02-19', '2035-02-08',
]

// 计算节日（元旦等固定月日 / 春节）的下一个目标日期
function nextFestivalDate(dateValue) {
  const now = today()
  if (dateValue === 'spring') {
    for (const d of springFestival) {
      const dt = normalizeDate(d)
      if (dt >= now) return dt
    }
    return normalizeDate(springFestival[springFestival.length - 1])
  }
  const [m, d] = dateValue.split('-').map(Number)
  const pad = (n) => String(n).padStart(2, '0')
  const thisYear = normalizeDate(`${now.getFullYear()}-${pad(m)}-${pad(d)}`)
  if (thisYear >= now) return thisYear
  return normalizeDate(`${now.getFullYear() + 1}-${pad(m)}-${pad(d)}`)
}

// 距离下一个节日还有多少天（纯数字）
function daysUntilFestival(item) {
  const target = nextFestivalDate(item.date)
  if (!target || isNaN(target.getTime())) return '--'
  const delta = Math.ceil((target.getTime() - today().getTime()) / 86400000)
  return Math.max(0, delta)
}

// 统一的数字 / 文案输出
function statNumber(item) {
  if (item.type === 'birthday') return daysUntilBirthday(item.date)
  if (item.type === 'festival') return daysUntilFestival(item)
  return daysSinceAnniversary(item.date)
}
function statusText(item) {
  if (item.type === 'birthday') return '距离下次生日'
  if (item.type === 'festival') return `距离${item.label}还有`
  return '已经走过'
}

function saveEvents() {
  localStorage.setItem('anniversaryEvents', JSON.stringify(events.value))
}

// ---- 左滑删除 ----
const DELETE_WIDTH = 76
const openId = ref(null)
const dragId = ref(null)
const dragging = ref(false)
let dragStartX = 0
let dragOffset = 0

function onSwipeStart(e, id) {
  dragId.value = id
  dragging.value = true
  dragStartX = e.clientX
  dragOffset = openId.value === id ? -DELETE_WIDTH : 0
}
function onSwipeMove(e, id) {
  if (dragId.value !== id || !dragging.value) return
  const x = e.clientX
  let dx = x - dragStartX + (openId.value === id ? -DELETE_WIDTH : 0)
  dx = Math.min(0, Math.max(-DELETE_WIDTH, dx))
  dragOffset = dx
}
function onSwipeEnd(id) {
  if (dragId.value !== id) return
  dragging.value = false
  dragId.value = null
  openId.value = dragOffset <= -DELETE_WIDTH / 2 ? id : null
}
function cardStyle(id) {
  let offset = 0
  if (dragging.value && dragId.value === id) offset = dragOffset
  else if (openId.value === id) offset = -DELETE_WIDTH
  return { transform: `translateX(${offset}px)` }
}
function removeEvent(id) {
  events.value = events.value.filter((e) => e.id !== id)
  openId.value = null
  saveEvents()
}

function normalizeDate(dateValue) {
  return new Date(dateValue + 'T00:00:00')
}

function formatDate(dateValue) {
  const date = normalizeDate(dateValue)
  return isNaN(date.getTime()) ? '无效日期' : date.toLocaleDateString()
}

function diffDays(start, end) {
  const msPerDay = 86400000
  return Math.floor((end.getTime() - start.getTime()) / msPerDay)
}

function today() {
  return new Date(new Date().toDateString())
}

function daysSinceAnniversary(dateValue) {
  const start = normalizeDate(dateValue)
  if (isNaN(start.getTime())) return '--'
  const delta = diffDays(start, today())
  return Math.max(0, delta)
}

function daysUntilBirthday(dateValue) {
  const target = normalizeDate(dateValue)
  if (isNaN(target.getTime())) return '--'
  const nowDate = today()
  const month = String(target.getMonth() + 1).padStart(2, '0')
  const day = String(target.getDate()).padStart(2, '0')
  const next = new Date(`${nowDate.getFullYear()}-${month}-${day}T00:00:00`)
  if (next < nowDate) next.setFullYear(next.getFullYear() + 1)
  const delta = Math.ceil((next.getTime() - nowDate.getTime()) / 86400000)
  return Math.max(0, delta)
}

function addEvent() {
  if (!canAdd.value) return
  events.value.push({
    id: Date.now(),
    label: form.value.label.trim(),
    date: form.value.date,
    type: form.value.type,
  })
  form.value.label = ''
  form.value.date = new Date().toISOString().slice(0, 10)
  form.value.type = 'anniversary'
  showForm.value = false
  saveEvents()
}

watch(events, saveEvents, { deep: true })
</script>

<style>
/* ====== 移动端优先 (375px) ====== */
.anniversary {
  min-height: 100vh;
  width: 100%;
  padding: 22px 15px 32px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  background:
    radial-gradient(circle at 50% 0%, rgba(148,163,184,.08), transparent 45%),
    linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #e9eef5 100%);
}
.hero {
  text-align: center;
  margin-bottom: 18px;
  max-width: 400px;
}
.eyebrow {
  margin: 0 0 4px;
  font-size: .64rem;
  font-weight: 800;
  letter-spacing: .14em;
  text-transform: uppercase;
  background: linear-gradient(90deg, #f472b6, #a78bfa, #60a5fa);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.anniversary h1 {
  margin: 0 0 5px;
  font-size: 1.38rem;
  line-height: 1.2;
  letter-spacing: -.01em;
  background: linear-gradient(90deg, #ec4899, #8b5cf6 50%, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.desc {
  margin: 0 auto;
  color: #94a3b8;
  font-size: .78rem;
  line-height: 1.5;
}
.cards {
  width: 100%;
  max-width: 420px;
  display: grid;
  gap: 11px;
  margin-bottom: 20px;
}

/* ---- 卡片包裹层（左滑容器）---- */
.card-wrap {
  position: relative;
  overflow: hidden;
  border-radius: 17px;
  background: rgba(148,163,184,.1);
  -webkit-tap-highlight-color: transparent;
}
.card--anniversary.card-wrap { background: rgba(236,72,153,.1); }
.card--birthday.card-wrap { background: rgba(59,130,246,.1); }
.card--festival.card-wrap { background: rgba(245,158,11,.1); }
.card-delete {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 76px;
  border: none;
  border-radius: 0 17px 17px 0;
  background: linear-gradient(135deg, #f43f5e, #fb7185);
  color: #fff;
  font-size: .9rem;
  font-weight: 700;
  letter-spacing: .04em;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 0;
  -webkit-tap-highlight-color: transparent;
}
.card-delete:active {
  filter: brightness(.92);
}

/* ---- 卡片：横排一行布局 ---- */
.card {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 12px;
  padding: 13px 14px;
  border-radius: 17px;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0,0,0,.05);
  border: 1px solid transparent;
  position: relative;
  z-index: 1;
  touch-action: pan-y;
  -webkit-tap-highlight-color: transparent;
  transition: transform .28s cubic-bezier(.4,0,.2,1), box-shadow .2s ease;
}
.card.no-anim {
  transition: none;
}
.card--anniversary {
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(253,242,248,.96));
  border-color: rgba(236,72,153,.18);
}
.card--birthday {
  background: linear-gradient(135deg, rgba(255,255,255,.96), rgba(239,246,255,.96));
  border-color: rgba(59,130,246,.18);
}

/* 中间文字区 */
.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.card-label-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
}
.card-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.card--anniversary .card-dot {
  background: #ec4899;
}
.card--birthday .card-dot {
  background: #3b82f6;
}
.card--festival .card-dot {
  background: #f59e0b;
}
.card-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  line-height: 1.2;
}
.card-date {
  margin: 0;
  color: #94a3b8;
  font-size: .72rem;
}

/* 右侧数字区：横向布局 */
.card-stat {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-stat-text {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  text-align: right;
}
.card-status {
  margin: 0;
  color: #64748b;
  font-size: .8rem;
  font-weight: 600;
  letter-spacing: .02em;
  line-height: 1.2;
}
/* 只有天数字带背景卡片 */
.card-number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 64px;
  height: 44px;
  padding: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #f8fafc, #eef2f7);
  border: 1px solid rgba(148,163,184,.18);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.7), 0 2px 6px rgba(15,23,42,.06);
  transition: transform .2s ease, box-shadow .2s ease;
}
/* 按类型着色，呼应卡片主题 */
.card--anniversary .card-number-badge {
  background: linear-gradient(135deg, #fdf2f8, #fce7f3);
  border-color: rgba(236,72,153,.25);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 2px 8px rgba(236,72,153,.14);
}
.card--birthday .card-number-badge {
  background: linear-gradient(135deg, #eff6ff, #dbeafe);
  border-color: rgba(59,130,246,.25);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 2px 8px rgba(59,130,246,.14);
}
.card--festival .card-number-badge {
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-color: rgba(245,158,11,.25);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8), 0 2px 8px rgba(245,158,11,.14);
}
.card-number {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -.02em;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}
/* 数字按类型强调色 */
.card--anniversary .card-number { color: #db2777; }
.card--birthday .card-number { color: #2563eb; }
.card--festival .card-number { color: #d97706; }
/* 天数过多时缩小 */
.card-number-badge.compact .card-number {
  font-size: .92rem;
}
.card-status {
  margin: 0;
  color: #64748b;
  font-size: .82rem;
  font-weight: 600;
  letter-spacing: .02em;
}

/* ---- 悬浮新增按钮 ---- */
.fab {
  position: fixed;
  right: 20px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: linear-gradient(135deg, #f472b6, #a78bfa 50%, #60a5fa);
  color: #fff;
  font-size: 1.9rem;
  font-weight: 300;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(139,92,246,.4);
  -webkit-tap-highlight-color: transparent;
  transition: transform .2s ease, box-shadow .2s ease;
  z-index: 30;
}
.fab:active {
  transform: scale(.94);
}

/* ---- 弹层 ---- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15,23,42,.45);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}
.modal {
  position: relative;
  width: 100%;
  max-width: 360px;
  max-height: 90vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 22px 20px 20px;
  border-radius: 22px;
  background: rgba(255,255,255,.98);
  border: 1px solid rgba(148,163,184,.16);
  box-shadow: 0 20px 50px rgba(15,23,42,.22);
  box-sizing: border-box;
}
.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  font-size: 1.2rem;
  line-height: 1;
  cursor: pointer;
}
.form-title {
  margin: 0 0 16px;
  font-size: 1.05rem;
  font-weight: 800;
  background: linear-gradient(90deg, #ec4899, #8b5cf6 50%, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
}
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}
.field-group label {
  color: #64748b;
  font-size: .74rem;
  font-weight: 700;
}
.field-group input {
  width: 100%;
  padding: 11px 12px;
  border-radius: 11px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  color: #111827;
  font-size: .86rem;
  outline: none;
  transition: border-color .2s ease, box-shadow .2s ease;
  box-sizing: border-box;
  color-scheme: light;
}
.field-group input:focus {
  border-color: #8b5cf6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(139,92,246,.12);
}
/* 日期选择器样式优化 */
.date-input {
  cursor: pointer;
  font-family: inherit;
  letter-spacing: .02em;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}
.date-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: .55;
  filter: invert(38%) sepia(68%) saturate(900%) hue-rotate(245deg);
}
.radio-group {
  display: flex;
  gap: 8px;
}
.radio-group label {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 10px 6px;
  border-radius: 11px;
  font-size: .82rem;
  font-weight: 600;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all .2s ease;
}
.radio-group label.active {
  background: #fff;
  border-color: #8b5cf6;
  color: #6d28d9;
  box-shadow: 0 1px 6px rgba(139,92,246,.15);
}
.radio-group input {
  display: none;
}
.add-button {
  width: 100%;
  margin-top: 6px;
  padding: 12px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #f472b6, #a78bfa 55%, #60a5fa);
  color: #fff;
  font-size: .92rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
  letter-spacing: .01em;
}
.add-button:active:not(:disabled) {
  transform: scale(.97);
}
.add-button:disabled {
  opacity: .45;
  cursor: not-allowed;
}

/* 弹层动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity .25s ease;
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: transform .25s cubic-bezier(.34,1.56,.64,1), opacity .25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(16px) scale(.96);
  opacity: 0;
}

/* ====== 大屏适配 ====== */
@media (min-width: 520px) {
  .anniversary { padding: 28px 18px 36px; }
  .hero { margin-bottom: 22px; max-width: 560px; }
  .eyebrow { font-size: .7rem; }
  .anniversary h1 { font-size: 1.65rem; }
  .desc { font-size: .86rem; }
  .cards { max-width: 580px; gap: 14px; }
  .card { gap: 16px; padding: 16px 18px; border-radius: 20px; }
  .card-title { font-size: 1.08rem; }
  .card-date { font-size: .8rem; }
  .card-number { font-size: 1.6rem; }
  .card-number-badge { padding: 7px 13px; min-width: 64px; }
  .modal { max-width: 400px; max-height: 90vh; padding: 26px 24px 22px; }
  .form-title { font-size: 1.15rem; }
  .field-group input { padding: 13px 14px; font-size: .92rem; }
  .radio-group { gap: 12px; }
  .radio-group label { padding: 12px; font-size: .88rem; }
  .add-button { padding: 14px; font-size: .96rem; }
  .fab { width: 60px; height: 60px; font-size: 2rem; right: 28px; bottom: 28px; }
}
</style>
