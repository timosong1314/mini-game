<template>
  <main class="mbti" :class="{ 'show-result': showResult }">
    <!-- 开始页 -->
    <div v-if="!started" class="start-screen">
      <button class="back-btn" @click="$router.push('/')">← 返回</button>
      <div class="start-card">
        <div class="start-icon">🧠</div>
        <h1>MBTI 性格测试</h1>
        <p class="start-desc">通过 {{ totalQuestions }} 道题目，探索你的性格类型。<br>发现你是哪一种 MBTI 人格。</p>
        <div class="start-info">
          <span class="info-item">⏱ 约 3 分钟</span>
          <span class="info-item">📝 {{ totalQuestions }} 道题</span>
          <span class="info-item">🎯 4 个维度</span>
        </div>
        <button class="start-btn" @click="startTest">开始测试</button>
      </div>
    </div>

    <!-- 答题页 -->
    <div v-else-if="started && !showResult" class="quiz-screen">
      <div class="quiz-header">
        <button class="back-btn" @click="confirmQuit">退出</button>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
        <span class="progress-text">{{ currentIndex + 1 }} / {{ totalQuestions }}</span>
      </div>
      <div class="question-area">
        <transition name="fade" mode="out-in">
          <div class="question-card" :key="currentIndex">
            <div class="dimension-badge" :style="{ background: dimColor }">{{ currentDim }}</div>
            <h2 class="question-text">{{ currentQuestion.text }}</h2>
            <div class="options">
              <button
                class="option option-a"
                :class="{ selected: answers[currentIndex] === 'A' }"
                @click="selectAnswer('A')"
              >
                <span class="option-label">A</span>
                <span class="option-text">{{ currentQuestion.a }}</span>
              </button>
              <div class="vs">VS</div>
              <button
                class="option option-b"
                :class="{ selected: answers[currentIndex] === 'B' }"
                @click="selectAnswer('B')"
              >
                <span class="option-label">B</span>
                <span class="option-text">{{ currentQuestion.b }}</span>
              </button>
            </div>
            <div class="nav-btns">
              <button class="nav-btn" :disabled="currentIndex === 0" @click="prevQuestion">上一题</button>
              <button
                class="nav-btn primary"
                :disabled="!answers[currentIndex]"
                @click="nextQuestion"
              >
                {{ currentIndex === totalQuestions - 1 ? '查看结果' : '下一题' }}
              </button>
            </div>
          </div>
        </transition>
      </div>
    </div>

    <!-- 结果页 -->
    <div v-else class="result-screen">
      <div class="result-card">
        <div class="result-type">{{ mbtiResult }}</div>
        <h1 class="result-name">{{ typeInfo.name }}</h1>
        <p class="result-nickname">「{{ typeInfo.nickname }}」</p>
        <p class="result-desc">{{ typeInfo.desc }}</p>

        <div class="dimension-bars">
          <div v-for="dim in dimensions" :key="dim.key" class="dim-row">
            <div class="dim-labels">
              <span :class="{ active: dimScores[dim.key] < 50 }">{{ dim.left }}</span>
              <span :class="{ active: dimScores[dim.key] >= 50 }">{{ dim.right }}</span>
            </div>
            <div class="dim-bar">
              <div class="dim-fill-left" :style="{ width: (100 - dimScores[dim.key]) + '%' }"></div>
              <div class="dim-fill-right" :style="{ width: dimScores[dim.key] + '%' }"></div>
            </div>
            <div class="dim-pct">
              <span>{{ 100 - dimScores[dim.key] }}%</span>
              <span>{{ dimScores[dim.key] }}%</span>
            </div>
          </div>
        </div>

        <div class="traits">
          <h3>核心特质</h3>
          <div class="trait-tags">
            <span v-for="t in typeInfo.traits" :key="t" class="trait-tag">{{ t }}</span>
          </div>
        </div>

        <div class="result-actions">
          <button class="action-btn" @click="restart">重新测试</button>
          <button class="action-btn outline" @click="$router.push('/')">返回首页</button>
        </div>
      </div>
    </div>

    <!-- 退出确认弹窗 -->
    <teleport to="body">
      <div v-if="showQuitConfirm" class="modal-overlay" @click.self="showQuitConfirm = false">
        <div class="modal-box">
          <h3>确认退出？</h3>
          <p>当前进度将不会保存</p>
          <div class="modal-btns">
            <button class="modal-btn" @click="showQuitConfirm = false">继续答题</button>
            <button class="modal-btn danger" @click="quitTest">确认退出</button>
          </div>
        </div>
      </div>
    </teleport>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'

const questions = [
  // E/I 维度
  { text: '在社交聚会中，你通常会？', a: '主动和很多人聊天，享受热闹氛围', b: '只和少数熟悉的人深入交流', dim: 'EI' },
  { text: '周末休息时，你更倾向于？', a: '约朋友出去活动或聚会', b: '独自待着或只和一两个亲密的人在一起', dim: 'EI' },
  { text: '在团队讨论中，你通常？', a: '积极发言，边想边说', b: '先在心里想好再发言', dim: 'EI' },
  { text: '你的精力来源更多是？', a: '与他人互动和交流', b: '独处和自我反思', dim: 'EI' },
  // S/N 维度
  { text: '面对一个新项目，你更关注？', a: '具体的细节和实际可行的步骤', b: '整体的愿景和创新的可能性', dim: 'SN' },
  { text: '你更信任？', a: '亲身经验和事实数据', b: '直觉和内心的预感', dim: 'SN' },
  { text: '别人形容你更可能说？', a: '"你很务实接地气"', b: '"你很有想象力和创意"', dim: 'SN' },
  { text: '阅读时你更喜欢？', a: '实用类书籍，如教程、指南', b: '虚构类或哲学类书籍', dim: 'SN' },
  // T/F 维度
  { text: '做决定时，你更看重？', a: '逻辑分析和客观事实', b: '个人价值观和他人感受', dim: 'TF' },
  { text: '朋友向你倾诉烦恼时，你倾向于？', a: '帮 TA 分析问题并提供解决方案', b: '先倾听共情，给予情感支持', dim: 'TF' },
  { text: '你认为好的领导应该？', a: '公正严明，以效率和结果为导向', b: '善解人意，关注团队成员的感受', dim: 'TF' },
  { text: '面对批评时，你通常？', a: '理性分析批评是否合理', b: '会在意对方的态度和语气', dim: 'TF' },
  // J/P 维度
  { text: '你的日常生活更像？', a: '有规律的作息和明确的计划', b: '随性而为，保持灵活和弹性', dim: 'JP' },
  { text: '面对截止日期，你通常？', a: '提前规划并按时完成', b: '在最后关头才爆发完成', dim: 'JP' },
  { text: '出去旅行时，你更喜欢？', a: '提前做好详细行程安排', b: '到了目的地再随机决定', dim: 'JP' },
  { text: '你的桌面/房间通常？', a: '整洁有序，东西各有定位', b: '看似凌乱但自己知道在哪', dim: 'JP' },
  // 混合维度 - 更深层
  { text: '在压力之下，你更容易？', a: '变得外向，找人倾诉', b: '变得内向，需要独处空间', dim: 'EI' },
  { text: '学习新东西时，你更喜欢？', a: '按步骤一步步来', b: '先了解全貌再深入细节', dim: 'SN' },
  { text: '发生冲突时，你认为更重要的是？', a: '找到公平合理的解决方案', b: '维护和谐的人际关系', dim: 'TF' },
  { text: '你更享受？', a: '完成任务的成就感', b: '探索过程本身带来的乐趣', dim: 'JP' },
  { text: '在认识新朋友时，你通常？', a: '很快就能打开话题', b: '需要一段时间才会放松下来', dim: 'EI' },
  { text: '你更被哪种特质吸引？', a: '严谨、有条理的人', b: '随和、灵活的人', dim: 'JP' },
  { text: '解决问题时，你更倾向于？', a: '使用经过验证的方法', b: '尝试全新的方式', dim: 'SN' },
  { text: '评价一件事时，你更看重？', a: '它是否合乎逻辑', b: '它是否合乎人情', dim: 'TF' },
  { text: '对于规则和制度，你觉得？', a: '很重要，应该遵守', b: '可以参考，但不必拘泥', dim: 'JP' },
  { text: '你理想的的工作环境是？', a: '开放式的，方便随时交流', b: '安静的，有独立空间', dim: 'EI' },
  { text: '你更关注？', a: '当下正在发生的事', b: '未来可能发生的事', dim: 'SN' },
  { text: '你觉得自己更像？', a: '理性的思考者', b: '感性的体验者', dim: 'TF' },
]

const totalQuestions = questions.length
const started = ref(false)
const showResult = ref(false)
const showQuitConfirm = ref(false)
const currentIndex = ref(0)
const answers = ref({})

const dimensions = [
  { key: 'EI', left: 'E 外向', right: 'I 内向' },
  { key: 'SN', left: 'S 实感', right: 'N 直觉' },
  { key: 'TF', left: 'T 思考', right: 'F 情感' },
  { key: 'JP', left: 'J 判断', right: 'P 感知' },
]

const dimColorMap = { EI: '#6366f1', SN: '#f59e0b', TF: '#10b981', JP: '#ec4899' }
const dimLabelMap = { EI: '能量方向', SN: '认知方式', TF: '决策方式', JP: '生活态度' }

const currentQuestion = computed(() => questions[currentIndex.value])
const currentDim = computed(() => dimLabelMap[currentQuestion.value.dim])
const dimColor = computed(() => dimColorMap[currentQuestion.value.dim])
const progress = computed(() => ((Object.keys(answers.value).length) / totalQuestions) * 100)

const dimScores = computed(() => {
  const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 }
  questions.forEach((q, i) => {
    const ans = answers.value[i]
    if (!ans) return
    if (q.dim === 'EI') { ans === 'A' ? scores.E++ : scores.I++ }
    else if (q.dim === 'SN') { ans === 'A' ? scores.S++ : scores.N++ }
    else if (q.dim === 'TF') { ans === 'A' ? scores.T++ : scores.F++ }
    else if (q.dim === 'JP') { ans === 'A' ? scores.J++ : scores.P++ }
  })
  return {
    EI: Math.round((scores.I / (scores.E + scores.I || 1)) * 100),
    SN: Math.round((scores.N / (scores.S + scores.N || 1)) * 100),
    TF: Math.round((scores.F / (scores.T + scores.F || 1)) * 100),
    JP: Math.round((scores.P / (scores.J + scores.P || 1)) * 100),
  }
})

const mbtiResult = computed(() => {
  const s = dimScores.value
  return (s.EI < 50 ? 'E' : 'I') + (s.SN < 50 ? 'S' : 'N') + (s.TF < 50 ? 'T' : 'F') + (s.JP < 50 ? 'J' : 'P')
})

const typeInfoMap = {
  ESTJ: { name: '总经理', nickname: '果断的管理者', desc: '你天生具有领导力，注重秩序和规则，善于组织和管理。你务实、果断，喜欢按计划行事，是团队中可靠的执行者。', traits: ['高效', '务实', '果断', '有责任心', '条理清晰'] },
  ESTP: { name: '创业者', nickname: '大胆的实践者', desc: '你充满活力，喜欢冒险和刺激。你善于观察周围的环境，能迅速做出反应，是天生的问题解决者。', traits: ['大胆', '灵活', '直接', '精力充沛', '善于应变'] },
  ESFJ: { name: '执政官', nickname: '热心的守护者', desc: '你温暖、体贴，善于照顾他人。你重视和谐的人际关系，乐于帮助他人，是社交圈中的粘合剂。', traits: ['热心', '忠诚', '体贴', '善于合作', '重视传统'] },
  ESFP: { name: '表演者', nickname: '热情的自由灵魂', desc: '你开朗、热情，喜欢成为注意力的焦点。你活在当下，享受生活每一刻，有很强的感染力。', traits: ['热情', '有趣', '乐观', '慷慨', '活在当下'] },
  ENTJ: { name: '指挥官', nickname: '天生的统帅', desc: '你充满自信，具有远见和战略思维。你善于制定长期计划，驱动团队达成目标，是天生的领导者。', traits: ['有远见', '果断', '自信', '高效', '战略思维'] },
  ENTP: { name: '辩论家', nickname: '聪明的创新者', desc: '你思维敏捷，喜欢智力上的挑战。你善于发现系统中的漏洞并提出创新解决方案，是出色的思考者。', traits: ['创新', '机智', '博学', '善于辩论', '思维敏捷'] },
  ENFJ: { name: '主人公', nickname: '魅力的引导者', desc: '你充满魅力和感染力，善于激励他人。你关注他人的潜力并乐于帮助他人成长，是天生的导师。', traits: ['有魅力', '善解人意', '有理想', '利他', '有感染力'] },
  ENFP: { name: '竞选者', nickname: '热情的梦想家', desc: '你热情洋溢，富有想象力和创造力。你善于发现可能性，能激励身边的人，是充满魅力的理想主义者。', traits: ['热情', '有创意', '乐观', '善于交际', '富有想象力'] },
  ISTJ: { name: '物流师', nickname: '可靠的守护者', desc: '你安静、严肃，通过全面和可靠来达到成功。你注重实际，逻辑性强，是值得信赖的人。', traits: ['可靠', '负责', '有条理', '细致', '忠诚'] },
  ISTP: { name: '鉴赏家', nickname: '灵巧的工匠', desc: '你安静但善于观察，对事物的运作原理充满好奇。你善于动手，喜欢在实践中探索和学习。', traits: ['冷静', '灵活', '善于分析', '动手能力强', '独立'] },
  ISFJ: { name: '守卫者', nickname: '温暖的守护者', desc: '你安静、友善，有责任心。你注重稳定和安全，善于照顾他人，默默付出而不求回报。', traits: ['温暖', '细心', '负责', '忠诚', '有耐心'] },
  ISFP: { name: '探险家', nickname: '温柔的艺术灵魂', desc: '你安静、敏感，善于用感官体验世界。你有着强烈的价值观和审美感，喜欢以自己的方式生活。', traits: ['温和', '敏感', '有艺术感', '谦逊', '忠于自我'] },
  INTJ: { name: '建筑师', nickname: '独立的策略家', desc: '你在实现想法方面有独创性的思维和非凡的洞察力。你独立自主，追求完美，善于制定长远战略。', traits: ['有远见', '独立', '理性', '追求完美', '战略思维'] },
  INTP: { name: '逻辑学家', nickname: '理性的思考者', desc: '你对理论和抽象概念有着深厚的兴趣。你善于分析，追求理解事物的本质和原理，是安静的思考者。', traits: ['理性', '好奇', '善于分析', '独立', '追求真理'] },
  INFJ: { name: '提倡者', nickname: '安静的理想主义者', desc: '你安静而有洞察力，有着强烈的理想主义和价值观。你善于理解他人，致力于让世界变得更好。', traits: ['有洞察力', '理想主义', '有原则', '有同理心', '有远见'] },
  INFP: { name: '调停者', nickname: '诗意的理想主义者', desc: '你理想主义、忠诚，有着强烈的内在价值观。你追求和谐与真实，善于理解他人的情感和需要。', traits: ['理想主义', '有同理心', '有创意', '忠诚', '追求意义'] },
}

const typeInfo = computed(() => typeInfoMap[mbtiResult.value] || typeInfoMap['INFP'])

function startTest() { started.value = true }
function selectAnswer(choice) { answers.value[currentIndex.value] = choice }
function nextQuestion() {
  if (currentIndex.value < totalQuestions - 1) currentIndex.value++
  else showResult.value = true
}
function prevQuestion() { if (currentIndex.value > 0) currentIndex.value-- }
function confirmQuit() { showQuitConfirm.value = true }
function quitTest() {
  showQuitConfirm.value = false
  started.value = false
  showResult.value = false
  currentIndex.value = 0
  answers.value = {}
}
function restart() {
  started.value = false
  showResult.value = false
  currentIndex.value = 0
  answers.value = {}
}
</script>

<style>
.mbti {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(99,102,241,.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(168,85,247,.06) 0%, transparent 50%),
    linear-gradient(160deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%);
  animation: fadeUp .4s ease-out;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.back-btn {
  background: none; border: none; cursor: pointer;
  font-size: .85rem; color: #6366f1; font-weight: 600;
  padding: 6px 0; transition: opacity .2s;
}
.back-btn:hover { opacity: .7; }

/* ---- 开始页 ---- */
.start-screen {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-height: 80vh; width: 100%;
}
.start-card {
  background: rgba(255,255,255,.9); backdrop-filter: blur(12px);
  border-radius: 20px; padding: 40px 32px; text-align: center;
  border: 1px solid #e8eaf6; max-width: 420px; width: 100%;
  box-shadow: 0 8px 32px rgba(99,102,241,.08);
}
.start-icon { font-size: 3rem; margin-bottom: 16px; }
.start-card h1 { margin: 0 0 12px; font-size: 1.6rem; font-weight: 800; color: #1e1b4b; }
.start-desc { margin: 0 0 20px; color: #64748b; font-size: .9rem; line-height: 1.6; }
.start-info {
  display: flex; justify-content: center; gap: 16px;
  margin-bottom: 28px; flex-wrap: wrap;
}
.info-item {
  font-size: .78rem; color: #6366f1; font-weight: 600;
  background: #eef2ff; padding: 4px 12px; border-radius: 999px;
}
.start-btn {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; padding: 14px 48px;
  border-radius: 12px; font-size: 1rem; font-weight: 700;
  cursor: pointer; transition: all .25s; box-shadow: 0 4px 16px rgba(99,102,241,.3);
}
.start-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(99,102,241,.4); }
.start-btn:active { transform: translateY(0); }

/* ---- 答题页 ---- */
.quiz-screen { width: 100%; max-width: 560px; margin: 0 auto; }
.quiz-header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
}
.progress-bar {
  flex: 1; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden;
}
.progress-fill {
  height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 999px; transition: width .4s ease;
}
.progress-text { font-size: .8rem; font-weight: 700; color: #6366f1; white-space: nowrap; }

.question-card {
  background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
  border-radius: 20px; padding: 28px 24px; border: 1px solid #e8eaf6;
  box-shadow: 0 8px 32px rgba(99,102,241,.06);
}
.dimension-badge {
  display: inline-block; padding: 4px 14px; border-radius: 999px;
  color: #fff; font-size: .72rem; font-weight: 700; margin-bottom: 16px;
  letter-spacing: .03em;
}
.question-text {
  margin: 0 0 24px; font-size: 1.15rem; font-weight: 700;
  color: #1e1b4b; line-height: 1.5;
}
.options { display: flex; flex-direction: column; gap: 0; margin-bottom: 24px; }
.option {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 18px; border-radius: 14px; border: 2px solid #e2e8f0;
  background: #fff; cursor: pointer; transition: all .2s; text-align: left;
  width: 100%;
}
.option:hover { border-color: #c7d2fe; background: #fafafe; }
.option.selected { border-color: #6366f1; background: #eef2ff; }
.option-label {
  width: 28px; height: 28px; display: grid; place-items: center;
  border-radius: 8px; font-size: .75rem; font-weight: 800;
  background: #f1f5f9; color: #64748b; flex-shrink: 0;
}
.option.selected .option-label { background: #6366f1; color: #fff; }
.option-text { font-size: .88rem; color: #334155; line-height: 1.4; }
.vs {
  text-align: center; font-size: .7rem; font-weight: 800;
  color: #cbd5e1; padding: 4px 0; letter-spacing: .1em;
}

.nav-btns { display: flex; gap: 10px; justify-content: space-between; }
.nav-btn {
  padding: 10px 24px; border-radius: 10px; border: 1px solid #e2e8f0;
  background: #fff; font-size: .85rem; font-weight: 600; color: #64748b;
  cursor: pointer; transition: all .2s;
}
.nav-btn:hover:not(:disabled) { border-color: #c7d2fe; color: #6366f1; }
.nav-btn:disabled { opacity: .4; cursor: not-allowed; }
.nav-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; border: none; box-shadow: 0 4px 12px rgba(99,102,241,.2);
}
.nav-btn.primary:hover:not(:disabled) { box-shadow: 0 6px 16px rgba(99,102,241,.3); }
.nav-btn.primary:disabled { opacity: .4; cursor: not-allowed; }

.fade-enter-active, .fade-leave-active { transition: all .25s ease; }
.fade-enter-from { opacity: 0; transform: translateX(20px); }
.fade-leave-to { opacity: 0; transform: translateX(-20px); }

/* ---- 结果页 ---- */
.result-screen { width: 100%; max-width: 520px; margin: 0 auto; padding-top: 20px; }
.result-card {
  background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
  border-radius: 24px; padding: 36px 28px; border: 1px solid #e8eaf6;
  box-shadow: 0 12px 40px rgba(99,102,241,.1); text-align: center;
  animation: fadeUp .5s ease-out;
}
.result-type {
  font-size: 3rem; font-weight: 900; letter-spacing: .08em;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; margin-bottom: 8px;
}
.result-name { margin: 0 0 4px; font-size: 1.3rem; font-weight: 800; color: #1e1b4b; }
.result-nickname { margin: 0 0 16px; font-size: 1rem; color: #6366f1; font-weight: 600; }
.result-desc {
  margin: 0 0 28px; font-size: .88rem; color: #64748b; line-height: 1.7;
  text-align: left; background: #f8fafc; padding: 16px; border-radius: 12px;
}

.dimension-bars { margin-bottom: 24px; }
.dim-row { margin-bottom: 16px; }
.dim-labels {
  display: flex; justify-content: space-between;
  font-size: .75rem; font-weight: 700; margin-bottom: 6px; color: #94a3b8;
}
.dim-labels .active { color: #6366f1; }
.dim-bar {
  height: 10px; border-radius: 999px; background: #e2e8f0;
  display: flex; overflow: hidden; position: relative;
}
.dim-fill-left {
  background: linear-gradient(90deg, #6366f1, #818cf8);
  border-radius: 999px 0 0 999px; transition: width .6s ease;
}
.dim-fill-right {
  background: linear-gradient(90deg, #a78bfa, #8b5cf6);
  border-radius: 0 999px 999px 0; transition: width .6s ease;
}
.dim-pct {
  display: flex; justify-content: space-between;
  font-size: .72rem; font-weight: 700; color: #6366f1; margin-top: 4px;
}

.traits { margin-bottom: 28px; }
.traits h3 { margin: 0 0 12px; font-size: .9rem; font-weight: 700; color: #1e1b4b; }
.trait-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.trait-tag {
  padding: 6px 16px; border-radius: 999px; font-size: .78rem; font-weight: 600;
  background: linear-gradient(135deg, #eef2ff, #ede9fe); color: #4338ca;
}

.result-actions { display: flex; gap: 12px; justify-content: center; }
.action-btn {
  padding: 12px 28px; border-radius: 12px; font-size: .88rem; font-weight: 700;
  cursor: pointer; transition: all .2s; border: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  box-shadow: 0 4px 12px rgba(99,102,241,.2);
}
.action-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(99,102,241,.3); }
.action-btn.outline {
  background: #fff; color: #6366f1; border: 2px solid #c7d2fe;
  box-shadow: none;
}
.action-btn.outline:hover { background: #eef2ff; box-shadow: none; }

/* ---- 弹窗 ---- */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.4);
  display: grid; place-items: center; z-index: 1000;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  background: #fff; border-radius: 16px; padding: 28px;
  text-align: center; max-width: 320px; width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,.15);
}
.modal-box h3 { margin: 0 0 8px; font-size: 1.1rem; color: #1e1b4b; }
.modal-box p { margin: 0 0 20px; font-size: .85rem; color: #64748b; }
.modal-btns { display: flex; gap: 10px; }
.modal-btn {
  flex: 1; padding: 10px; border-radius: 10px; border: none;
  font-size: .85rem; font-weight: 600; cursor: pointer; transition: all .2s;
  background: #f1f5f9; color: #334155;
}
.modal-btn:hover { background: #e2e8f0; }
.modal-btn.danger { background: #fee2e2; color: #dc2626; }
.modal-btn.danger:hover { background: #fecaca; }

@media (min-width: 640px) {
  .start-card { padding: 48px 40px; }
  .start-card h1 { font-size: 1.8rem; }
  .question-card { padding: 32px; }
  .result-card { padding: 40px 32px; }
}
</style>
