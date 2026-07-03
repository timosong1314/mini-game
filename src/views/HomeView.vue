<template>
  <main class="home">
    <section class="hero">
      <p class="eyebrow">Mini Game Hub</p>
      <h1>轻松玩一局</h1>
      <p class="desc">这里有好玩的小游戏，适合碎片时间随手打开。</p>
      <span class="badge">🎮 随时玩</span>
    </section>

    <div class="grid">
      <router-link class="card card--2048" to="/games/2048">
        <div class="card-icon" style="background: linear-gradient(135deg, #f59563, #f65e3b);">⬢</div>
        <div class="card-body">
          <div class="card-tags"><span class="tag">单人</span><span class="tag">益智</span></div>
          <h2>2048</h2>
          <p>滑动合并数字，挑战更高分数。</p>
        </div>
        <span class="card-go">开始 →</span>
      </router-link>

      <router-link class="card card--gomoku" to="/games/gomoku">
        <div class="card-icon" style="background: linear-gradient(135deg, #eab308, #ca8a04);">⚫</div>
        <div class="card-body">
          <div class="card-tags"><span class="tag">双人</span><span class="tag">策略</span></div>
          <h2>五子棋</h2>
          <p>双人对弈，先连成五子者胜。</p>
        </div>
        <span class="card-go">开始 →</span>
      </router-link>

      <router-link class="card card--werewolf" to="/games/werewolf">
        <div class="card-icon" style="background: linear-gradient(135deg, #7c3aed, #6d28d9);">🐺</div>
        <div class="card-body">
          <div class="card-tags"><span class="tag">多人</span><span class="tag">推理</span></div>
          <h2>狼人杀</h2>
          <p>多人推理，找出隐藏的狼人。</p>
        </div>
        <span class="card-go">开始 →</span>
      </router-link>
    </div>

    <p class="footer">更多游戏即将上线 <span class="dots">···</span></p>
  </main>
</template>

<style>
.home {
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px 20px;
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
.hero { margin-bottom: 28px; }
.eyebrow {
  margin: 0 0 8px;
  font-size: .65rem; font-weight: 800;
  letter-spacing: .25em; color: #6366f1;
  text-transform: uppercase;
}
.home h1 {
  margin: 0 0 8px;
  font-size: 1.8rem; font-weight: 800;
  color: #0f172a; letter-spacing: -.02em; line-height: 1.15;
}
.desc {
  margin: 0 auto 12px;
  max-width: 380px;
  font-size: .85rem; line-height: 1.5; color: #64748b;
}
.badge {
  display: inline-block;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  color: #4338ca; padding: 6px 16px;
  border-radius: 999px; font-size: .75rem; font-weight: 700;
  box-shadow: 0 2px 8px rgba(99,102,241,.1);
}

/* ---- game grid ---- */
.grid {
  width: 100%; max-width: 720px;
  display: grid; grid-template-columns: 1fr;
  gap: 12px; margin-bottom: 8px;
}
.card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; border-radius: 16px;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  color: #111827; text-decoration: none;
  border: 1px solid #e8eaf6;
  transition: all .25s cubic-bezier(.4,0,.2,1);
  text-align: left;
}
.card:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(99,102,241,.12); border-color: #c7d2fe; }
.card:active { transform: translateY(0); }
.card-icon {
  width: 44px; height: 44px;
  display: grid; place-items: center;
  border-radius: 12px;
  font-size: 1.15rem; color: #fff; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
}
.card-body { flex: 1; min-width: 0; }
.card-tags { display: flex; gap: 6px; margin-bottom: 6px; }
.tag {
  font-size: .65rem; font-weight: 700;
  padding: 2px 8px; border-radius: 999px;
  background: #f1f5f9; color: #64748b;
  letter-spacing: .02em;
}
.card h2 { margin: 0 0 2px; font-size: .95rem; font-weight: 700; color: #1e1b4b; }
.card-body p { margin: 0; color: #64748b; font-size: .8rem; line-height: 1.35; }
.card-go {
  font-weight: 700; color: #4f46e5; font-size: .85rem;
  white-space: nowrap; opacity: 0;
  transform: translateX(-6px);
  transition: all .25s ease;
}
.card:hover .card-go { opacity: 1; transform: translateX(0); }

/* ---- footer ---- */
.footer {
  margin: 0; padding-top: 16px;
  border-top: 1px solid rgba(99,102,241,.1);
  font-size: .78rem; color: #94a3b8;
}
.dots { letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }

@media (min-width: 640px) {
  .home h1 { font-size: 2.2rem; }
  .hero { margin-bottom: 32px; }
  .grid { grid-template-columns: repeat(2, 1fr); gap: 14px; max-width: 620px; }
  .card { flex-direction: column; align-items: flex-start; padding: 20px; gap: 12px; text-align: left; position: relative; }
  .card-icon { width: 48px; height: 48px; font-size: 1.25rem; }
  .card-go { position: absolute; top: 20px; right: 20px; }
  .card:last-child { grid-column: 1 / -1; max-width: calc(50% - 7px); justify-self: center; }
}

@media (min-width: 960px) {
  .grid { max-width: 660px; }
  .card { padding: 24px; }
  .card:last-child { max-width: calc(50% - 7px); }
}
</style>
