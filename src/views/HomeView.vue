<template>
  <main class="home">
    <section class="hero">
      <p class="eyebrow">Mini Game Hub</p>
      <h1>轻松玩一局</h1>
      <p class="desc">这里有好玩的小游戏，适合碎片时间随手打开。</p>
      <span class="badge">🎮 随时玩</span>
    </section>

    <div class="grid">
      <router-link class="card" to="/games/2048">
        <div class="card-icon" style="background: linear-gradient(135deg, #f59563, #f65e3b);">⬢</div>
        <div class="card-body">
          <h2>2048</h2>
          <div class="card-tags"><span class="tag tag--blue">单人</span><span class="tag tag--orange">益智</span></div>
          <p class="card-desc">滑动合并数字，挑战更高分数。</p>
        </div>
        <span class="card-go">→</span>
      </router-link>

      <router-link class="card" to="/games/gomoku">
        <div class="card-icon" style="background: linear-gradient(135deg, #eab308, #ca8a04);">⚫</div>
        <div class="card-body">
          <h2>五子棋</h2>
          <div class="card-tags"><span class="tag tag--green">双人</span><span class="tag tag--purple">策略</span></div>
          <p class="card-desc">双人对弈，先连成五子者胜。</p>
        </div>
        <span class="card-go">→</span>
      </router-link>

      <router-link class="card" to="/games/mbti">
        <div class="card-icon" style="background: linear-gradient(135deg, #ec4899, #8b5cf6);">🧠</div>
        <div class="card-body">
          <h2>MBTI 测试</h2>
          <div class="card-tags"><span class="tag tag--pink">测试</span><span class="tag tag--violet">性格</span></div>
          <p class="card-desc">探索你的性格类型，发现真实的自己。</p>
        </div>
        <span class="card-go">→</span>
      </router-link>

      <router-link class="card" to="/games/werewolf">
        <div class="card-icon" style="background: linear-gradient(135deg, #7c3aed, #6d28d9);">🐺</div>
        <div class="card-body">
          <h2>狼人杀</h2>
          <div class="card-tags"><span class="tag tag--red">多人</span><span class="tag tag--indigo">推理</span></div>
          <p class="card-desc">多人推理，找出隐藏的狼人。</p>
        </div>
        <span class="card-go">→</span>
      </router-link>
    </div>

    <p class="footer">更多游戏即将上线 <span class="dots">···</span></p>
  </main>
</template>

<style>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 28px 16px 20px;
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
.hero { margin-bottom: 20px; }
.eyebrow {
  margin: 0 0 6px;
  font-size: .6rem; font-weight: 800;
  letter-spacing: .25em; color: #6366f1;
  text-transform: uppercase;
}
.home h1 {
  margin: 0 0 6px;
  font-size: 1.5rem; font-weight: 800;
  color: #0f172a; letter-spacing: -.02em; line-height: 1.15;
}
.desc {
  margin: 0 auto 10px;
  max-width: 340px;
  font-size: .8rem; line-height: 1.5; color: #64748b;
}
.badge {
  display: inline-block;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  color: #4338ca; padding: 5px 14px;
  border-radius: 999px; font-size: .7rem; font-weight: 700;
  box-shadow: 0 2px 8px rgba(99,102,241,.1);
}

/* ---- game grid ---- */
.grid {
  width: 100%; max-width: 440px;
  display: grid; grid-template-columns: 1fr;
  gap: 10px; margin-bottom: 6px;
}
.card {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 14px;
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
  width: 42px; height: 42px;
  display: grid; place-items: center;
  border-radius: 12px;
  font-size: 1.1rem; color: #fff; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
}
.card-body { flex: 1; min-width: 0; }
.card-tags { display: flex; gap: 4px; margin-top: 4px; }
.tag {
  font-size: .6rem; font-weight: 700;
  padding: 2px 7px; border-radius: 999px;
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
.card h2 { margin: 0; font-size: .92rem; font-weight: 700; color: #1e1b4b; }
.card-desc { margin: 3px 0 0; font-size: .75rem; color: #64748b; line-height: 1.4; }
.card-tags { display: flex; gap: 4px; margin-top: 4px; }
.card-go {
  font-weight: 700; color: #4f46e5; font-size: 1rem;
  white-space: nowrap; opacity: 0;
  transform: translateX(-6px);
  transition: all .25s ease;
}
.card:hover .card-go { opacity: 1; transform: translateX(0); }

/* ---- footer ---- */
.footer {
  margin: 0; padding-top: 12px;
  border-top: 1px solid rgba(99,102,241,.1);
  font-size: .72rem; color: #94a3b8;
}
.dots { letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }

@media (min-width: 640px) {
  .home h1 { font-size: 2rem; }
  .hero { margin-bottom: 24px; }
  .grid { gap: 12px; max-width: 380px; }
  .card { padding: 16px 20px; gap: 14px; }
  .card-icon { width: 46px; height: 46px; font-size: 1.2rem; }
  .card h2 { font-size: 1rem; }
}

@media (min-width: 960px) {
  .grid { max-width: 420px; gap: 14px; }
  .card { padding: 18px 24px; }
  .home h1 { font-size: 2.2rem; }
}
</style>
