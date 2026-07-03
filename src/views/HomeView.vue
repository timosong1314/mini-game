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
        <div class="card-icon">⬢</div>
        <div class="card-body">
          <h2>2048</h2>
          <p>滑动合并数字，挑战更高分数。</p>
        </div>
        <span class="card-go">开始 →</span>
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
  padding: 40px 20px;
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
.hero { margin-bottom: 40px; }
.eyebrow {
  margin: 0 0 10px;
  font-size: .7rem; font-weight: 800;
  letter-spacing: .25em; color: #6366f1;
  text-transform: uppercase;
}
.home h1 {
  margin: 0 0 12px;
  font-size: 2.2rem; font-weight: 800;
  color: #0f172a; letter-spacing: -.02em; line-height: 1.2;
}
.desc {
  margin: 0 auto 16px;
  max-width: 480px;
  font-size: 1rem; line-height: 1.6; color: #64748b;
}
.badge {
  display: inline-block;
  background: linear-gradient(135deg, #eef2ff, #ede9fe);
  color: #4338ca; padding: 8px 18px;
  border-radius: 999px; font-size: .8rem; font-weight: 700;
  box-shadow: 0 2px 8px rgba(99,102,241,.1);
}

/* ---- game grid ---- */
.grid {
  width: 100%; max-width: 960px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px; margin-bottom: 8px;
}
.card {
  display: flex; align-items: center; gap: 16px;
  padding: 24px; border-radius: 20px;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  color: #111827; text-decoration: none;
  border: 1px solid #e8eaf6;
  transition: all .25s cubic-bezier(.4,0,.2,1);
}
.card:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(99,102,241,.1); border-color: #c7d2fe; }
.card:active { transform: translateY(0); }
.card-icon {
  width: 52px; height: 52px;
  display: grid; place-items: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  font-size: 1.3rem; color: #fff; flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(99,102,241,.25);
}
.card-body { flex: 1; min-width: 0; }
.card h2 { margin: 0 0 4px; font-size: 1.1rem; font-weight: 700; color: #1e1b4b; }
.card-body p { margin: 0; color: #64748b; font-size: .88rem; line-height: 1.4; }
.card-go { font-weight: 700; color: #4f46e5; font-size: .88rem; white-space: nowrap; }
.card:hover .card-go { color: #6366f1; }

/* ---- footer ---- */
.footer {
  margin: 0; padding-top: 24px;
  border-top: 1px solid rgba(99,102,241,.1);
  font-size: .82rem; color: #94a3b8;
}
.dots { letter-spacing: 2px; animation: pulse 1.5s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: .3; } 50% { opacity: 1; } }

@media (min-width: 640px) {
  .home h1 { font-size: 2.6rem; }
}
</style>
