<template>
  <main class="home">
    <section class="hero">
      <p class="eyebrow">Games & Tools</p>
      <h1>小游戏 · 小工具</h1>
      <p class="desc">这里集合了休闲小游戏和实用小工具，适合碎片时间随手打开。</p>
      <span class="badge">✨ 即开即用</span>
    </section>

    <div class="content">
      <section class="group">
        <h2 class="group-title"><span class="group-dot group-dot--tool"></span>小工具</h2>
        <div class="grid">
          <router-link class="card card--special" to="/anniversary">
            <div class="card-icon" style="background: linear-gradient(135deg, #fb7185, #f97316);">⏳</div>
            <div class="card-body">
              <h3>时间胶囊</h3>
              <p class="card-desc">把值得铭记的时光封进胶囊，看岁月靠近那些温柔的约定。</p>
              <div class="card-tags"><span class="tag tag--pink">记忆</span><span class="tag tag--orange">情感</span></div>
            </div>
            <span class="card-go">→</span>
          </router-link>

          <router-link class="card" to="/games/mbti">
            <div class="card-icon" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">🧠</div>
            <div class="card-body">
              <h3>MBTI 测试</h3>
              <p class="card-desc">探索性格类型，发现真实的自己。</p>
              <div class="card-tags"><span class="tag tag--pink">测试</span><span class="tag tag--violet">性格</span></div>
            </div>
            <span class="card-go">→</span>
          </router-link>
        </div>
      </section>

      <section class="group">
        <h2 class="group-title"><span class="group-dot group-dot--game"></span>小游戏</h2>
        <div class="grid">
          <router-link class="card" to="/games/2048">
            <div class="card-icon" style="background: linear-gradient(135deg, #f59563, #f65e3b);">⬢</div>
            <div class="card-body">
              <h3>2048</h3>
              <p class="card-desc">滑动合并数字，挑战更高分数。</p>
              <div class="card-tags"><span class="tag tag--blue">单人</span><span class="tag tag--orange">益智</span></div>
            </div>
            <span class="card-go">→</span>
          </router-link>

          <router-link class="card" to="/games/airplane-battle">
            <div class="card-icon" style="background: linear-gradient(135deg, #3b82f6, #6366f1);">✈️</div>
            <div class="card-body">
              <h3>飞机大战</h3>
              <p class="card-desc">消灭敌机，制霸天空，挑战无尽波次。</p>
              <div class="card-tags"><span class="tag tag--blue">单人</span><span class="tag tag--red">射击</span></div>
            </div>
            <span class="card-go">→</span>
          </router-link>

          <router-link class="card" to="/games/gomoku">
            <div class="card-icon" style="background: linear-gradient(135deg, #eab308, #ca8a04);">⚫</div>
            <div class="card-body">
              <h3>五子棋</h3>
              <p class="card-desc">双人对弈，先连成五子者胜。</p>
              <div class="card-tags"><span class="tag tag--green">双人</span><span class="tag tag--purple">策略</span></div>
            </div>
            <span class="card-go">→</span>
          </router-link>
        </div>
      </section>
    </div>

    <p class="footer">更多内容即将上线 <span class="dots">···</span></p>
  </main>
</template>

<style>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 12px 20px;
  box-sizing: border-box;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(99,102,241,.08) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 100%, rgba(168,85,247,.06) 0%, transparent 50%),
    linear-gradient(160deg, #f8fafc 0%, #eef2ff 50%, #f5f3ff 100%);
  animation: fadeUp .5s ease-out;
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ---- hero ---- */
.hero { text-align: center; margin-bottom: 22px; }
.eyebrow {
  margin: 0 0 6px;
  font-size: .6rem; font-weight: 800;
  letter-spacing: .25em; color: #6366f1;
  text-transform: uppercase;
}
.home h1 {
  margin: 0 0 6px;
  font-size: 1.6rem; font-weight: 800;
  color: #0f172a; letter-spacing: -.02em; line-height: 1.15;
}
.desc {
  margin: 0 auto 10px;
  max-width: 360px;
  font-size: .8rem; line-height: 1.5; color: #64748b;
}
.badge {
  display: inline-block;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  color: #4338ca; padding: 5px 14px;
  border-radius: 999px; font-size: .7rem; font-weight: 700;
  box-shadow: 0 2px 8px rgba(99,102,241,.1);
}

/* ---- content / groups ---- */
.content {
  width: 100%; max-width: 640px;
  display: flex; flex-direction: column; gap: 22px;
}
.group-title {
  display: flex; align-items: center; gap: 8px;
  margin: 0 0 12px;
  font-size: .82rem; font-weight: 800; color: #475569;
  letter-spacing: .02em;
}
.group-dot {
  width: 8px; height: 8px; border-radius: 50%;
}
.group-dot--game { background: #6366f1; }
.group-dot--tool { background: #fb7185; }

/* ---- game grid ---- */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
.card {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  gap: 12px;
  padding: 12px 14px; border-radius: 16px;
  background: rgba(255,255,255,.9);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  color: #111827; text-decoration: none;
  border: 1px solid rgba(226,232,240,.9);
  box-shadow: 0 4px 14px rgba(15,23,42,.04);
  position: relative; overflow: hidden;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  text-align: left;
}
.card::before {
  content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: linear-gradient(180deg, #6366f1, #a855f7);
  opacity: 0; transition: opacity .25s ease;
}
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 30px rgba(99,102,241,.18);
  border-color: #c7d2fe;
}
.card:hover::before { opacity: 1; }
.card:active { transform: translateY(-1px); }
.card--special { border-color: rgba(251,113,133,.35); background: linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,250,240,.96)); }
.card--special::before { background: linear-gradient(180deg, #fb7185, #f97316); }
.card-icon {
  width: 42px; height: 42px;
  display: grid; place-items: center;
  border-radius: 12px;
  font-size: 1.25rem; color: #fff; flex-shrink: 0;
  box-shadow: 0 6px 14px rgba(0,0,0,.16);
}
.card-body {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 2px;
}
.card h3 {
  margin: 0; font-size: .9rem; font-weight: 700; color: #1e1b4b;
  line-height: 1.2;
}
.card-desc {
  margin: 0; font-size: .68rem; color: #64748b; line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 1px; }
.tag {
  font-size: .54rem; font-weight: 700;
  padding: 2px 6px; border-radius: 999px;
  letter-spacing: .02em;
}
.tag--blue { background: #dbeafe; color: #2563eb; }
.tag--green { background: #dcfce7; color: #16a34a; }
.tag--orange { background: #ffedd5; color: #ea580c; }
.tag--purple { background: #f3e8ff; color: #9333ea; }
.tag--pink { background: #fce7f3; color: #db2777; }
.tag--violet { background: #ede9fe; color: #7c3aed; }
.tag--red { background: #fee2e2; color: #dc2626; }
.tag--indigo { background: #e0e7ff; color: #4f46e5; }
.card-go {
  display: grid; place-items: center;
  width: 26px; height: 26px; flex-shrink: 0;
  border-radius: 50%;
  font-weight: 700; color: #4f46e5; font-size: .9rem;
  background: #eef2ff;
  opacity: .55;
  transition: all .25s ease;
}
.card:hover .card-go { opacity: 1; background: #6366f1; color: #fff; transform: translateX(2px); }

/* ---- footer ---- */
.footer {
  margin: 28px 0 0; padding-top: 14px;
  border-top: 1px solid rgba(99,102,241,.1);
  font-size: .72rem; color: #94a3b8;
}
.dots { letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }

/* 小工具组单列，卡片更宽更醒目 */
.group:first-child .grid { grid-template-columns: 1fr; }

@media (min-width: 540px) {
  .grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
  .card { gap: 14px; padding: 14px 16px; border-radius: 18px; }
  .card-icon { width: 46px; height: 46px; font-size: 1.4rem; border-radius: 14px; }
  .card-body { gap: 3px; }
  .card h3 { font-size: .95rem; }
  .card-desc { font-size: .72rem; }
  .card-tags { gap: 5px; }
  .tag { font-size: .58rem; padding: 2px 8px; }
  .card-go { width: 28px; height: 28px; font-size: 1rem; }
}

@media (min-width: 640px) {
  .home h1 { font-size: 2rem; }
  .content { max-width: 720px; }
}

@media (min-width: 960px) {
  .home h1 { font-size: 2.2rem; }
}
</style>
