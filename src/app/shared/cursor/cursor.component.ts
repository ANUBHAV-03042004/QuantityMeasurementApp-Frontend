import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';

@Component({
  selector: 'app-cursor',
  standalone: true,
  template: `
    <div id="dragon-cursor">🐲</div>
    <div id="cursor-flame">🔥</div>
  `
})
export class CursorComponent implements OnInit {
  constructor(@Inject(PLATFORM_ID) private pid: Object) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.pid)) return;
    const cur   = document.getElementById('dragon-cursor')!;
    const flame = document.getElementById('cursor-flame')!;
    let mx=0, my=0, fx=0, fy=0;

    document.addEventListener('mousemove', e => {
      mx=e.clientX; my=e.clientY;
      gsap.to(cur, { x: mx-8, y: my-8, duration: .08 });
    });
    gsap.ticker.add(() => {
      fx += (mx-fx)*.18; fy += (my-fy)*.18;
      gsap.set(flame, { x: fx-4, y: fy-4 });
    });

    const HOVER = 'button,a,select,input,textarea,.feat-card,.unit-card,.dash-card,.recent-item,.op-btn,.type-btn,.dragon-btn,.run-btn,.auth-submit,.bar,.op-badge,.history-table tr';
    document.addEventListener('mouseover', e => {
      if ((e.target as Element).closest(HOVER)) {
        gsap.to(cur,   { scale: 1.7, duration: .2, ease: 'back.out(2)' });
        gsap.to(flame, { scale: 2,   opacity: 1,   duration: .2 });
      }
    });
    document.addEventListener('mouseout', e => {
      if ((e.target as Element).closest(HOVER)) {
        gsap.to(cur,   { scale: 1, duration: .2 });
        gsap.to(flame, { scale: 1, opacity: .7, duration: .2 });
      }
    });

    // Fire breath sparks on click
    document.addEventListener('click', e => {
      const sparks = ['🔥','✨','💥','⭐','🌟','🐲','⚔️'];
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('div');
        s.textContent = sparks[Math.floor(Math.random()*sparks.length)];
        s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;font-size:${10+Math.random()*14}px;pointer-events:none;z-index:9996`;
        document.body.appendChild(s);
        gsap.to(s, {
          x: (Math.random()-.5)*100, y: -Math.random()*80-20,
          opacity:0, scale:0, duration: .5+Math.random()*.4,
          ease:'power2.out', onComplete: () => s.remove()
        });
      }
    });

    this.buildWorld();
  }

  private buildWorld() {
    this.injectStyles();
    this.spawnEmbers();
    this.spawnFlyingDragons();
    this.spawnPhoenix();
    this.spawnCastleTowers();
    this.spawnFloatingIslands();
    this.spawnWyverns();
    this.spawnMagicOrbs();
    this.spawnClouds();
  }

  /* ── Inject animation keyframes ── */
  private injectStyles() {
    if (document.getElementById('worldStyles')) return;
    const s = document.createElement('style');
    s.id = 'worldStyles';
    s.textContent = `
      @keyframes flyAcross   { 0%{transform:translateX(-160px) translateY(0) scaleX(1)} 50%{transform:translateX(50vw) translateY(-30px) scaleX(1)} 100%{transform:translateX(110vw) translateY(10px) scaleX(1)} }
      @keyframes flyBack     { 0%{transform:translateX(110vw) translateY(0) scaleX(-1)} 50%{transform:translateX(50vw) translateY(20px) scaleX(-1)} 100%{transform:translateX(-160px) translateY(-10px) scaleX(-1)} }
      @keyframes phoenixBob  { 0%,100%{transform:translateY(0) rotate(-5deg)} 50%{transform:translateY(-18px) rotate(5deg)} }
      @keyframes orbFloat    { 0%,100%{transform:translateY(0) scale(1);opacity:.6} 50%{transform:translateY(-20px) scale(1.1);opacity:.9} }
      @keyframes towerSway   { 0%,100%{transform:rotate(-0.5deg)} 50%{transform:rotate(0.5deg)} }
      @keyframes islandDrift { 0%,100%{transform:translateY(0) translateX(0)} 50%{transform:translateY(-12px) translateX(6px)} }
      @keyframes cloudDrift  { 0%{transform:translateX(-200px)} 100%{transform:translateX(110vw)} }
      @keyframes emberRise   { 0%{transform:translateY(0) scale(1);opacity:.8} 100%{transform:translateY(-90vh) scale(.1);opacity:0} }
      @keyframes wyvernCircle{ 0%{transform:rotate(0deg) translateX(60px) rotate(0deg) scaleX(1)}
                                50%{transform:rotate(180deg) translateX(60px) rotate(-180deg) scaleX(-1)}
                                100%{transform:rotate(360deg) translateX(60px) rotate(-360deg) scaleX(1)} }
      @keyframes runeGlow    { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.7;transform:scale(1.15)} }
    `;
    document.head.appendChild(s);
  }

  /* ── Embers ── */
  private spawnEmbers() {
    const spawn = () => {
      const e = document.createElement('div');
      e.style.cssText = `
        position:fixed; border-radius:50%; pointer-events:none; z-index:3;
        width:${Math.random()*5+2}px; height:${Math.random()*5+2}px;
        background:${Math.random()>.5?'#f5820a':'#f5c030'};
        left:${Math.random()*100}vw; bottom:80px;
        animation:emberRise ${Math.random()*5+4}s linear ${Math.random()*2}s forwards;
      `;
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 9000);
    };
    for (let i=0;i<18;i++) setTimeout(spawn, i*500);
    setInterval(spawn, 1400);
  }

  /* ── Flying dragons across the sky ── */
  private spawnFlyingDragons() {
    const dragons = ['🐉','🐲','🦕'];
    const rows = [8, 18, 28, 38];
    rows.forEach((top, i) => {
      const d = document.createElement('div');
      const emoji = dragons[i % dragons.length];
      const dur = 18 + i * 7;
      const delay = i * 4;
      const size = 28 + Math.random() * 20;
      const dir = i % 2 === 0 ? 'flyAcross' : 'flyBack';
      d.style.cssText = `
        position:fixed; top:${top}%; z-index:4; pointer-events:none;
        font-size:${size}px; line-height:1;
        filter:drop-shadow(2px 2px 4px rgba(0,0,0,.4));
        animation:${dir} ${dur}s linear ${delay}s infinite;
      `;
      d.textContent = emoji;
      document.body.appendChild(d);
    });
  }

  /* ── Phoenix ── */
  private spawnPhoenix() {
    const p = document.createElement('div');
    p.style.cssText = `
      position:fixed; top:12%; right:8%; z-index:4; pointer-events:none;
      font-size:52px; filter:drop-shadow(0 0 12px #f5820a);
      animation:phoenixBob 3s ease-in-out infinite;
    `;
    p.textContent = '🦅';
    document.body.appendChild(p);
    // Flame trail under phoenix
    const f = document.createElement('div');
    f.style.cssText = `
      position:fixed; top:16%; right:9%; z-index:3; pointer-events:none;
      font-size:24px; animation:orbFloat 3s ease-in-out .5s infinite; opacity:.7;
    `;
    f.textContent = '🔥';
    document.body.appendChild(f);
  }

  /* ── Castle towers on the sides ── */
  private spawnCastleTowers() {
    const towers = [
      { left:'0px', bottom:'60px', size:90, emoji:'🏰' },
      { left:'auto', right:'0px', bottom:'60px', size:80, emoji:'🗼' },
      { left:'3%', bottom:'60px', size:60, emoji:'🛡️' },
    ];
    towers.forEach(t => {
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed; bottom:${t.bottom}; ${t.left!=='auto'?'left:'+t.left:'right:'+t.right};
        z-index:5; pointer-events:none; font-size:${t.size}px; line-height:1;
        filter:drop-shadow(3px 3px 6px rgba(0,0,0,.5));
        animation:towerSway 6s ease-in-out infinite;
        transform-origin:bottom center;
      `;
      el.textContent = t.emoji;
      document.body.appendChild(el);
    });
  }

  /* ── Floating islands in mid-sky ── */
  private spawnFloatingIslands() {
    const islands = [
      { left:'8%',  top:'55%', size:44, delay:0   },
      { left:'80%', top:'48%', size:36, delay:1.5 },
      { left:'45%', top:'60%', size:38, delay:.8  },
    ];
    islands.forEach(cfg => {
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed; left:${cfg.left}; top:${cfg.top}; z-index:3;
        font-size:${cfg.size}px; pointer-events:none; line-height:1;
        filter:drop-shadow(2px 4px 6px rgba(0,0,0,.3));
        animation:islandDrift ${4+Math.random()*3}s ease-in-out ${cfg.delay}s infinite;
      `;
      el.textContent = '🌏';
      document.body.appendChild(el);
      // Plant a tree on top
      const tree = document.createElement('div');
      tree.style.cssText = `
        position:fixed; left:calc(${cfg.left} + ${cfg.size*.2}px); top:calc(${cfg.top} - 20px);
        font-size:${cfg.size*.4}px; z-index:4; pointer-events:none;
        animation:islandDrift ${4+Math.random()*3}s ease-in-out ${cfg.delay}s infinite;
      `;
      tree.textContent = '🌲';
      document.body.appendChild(tree);
    });
  }

  /* ── Wyverns circling (small) ── */
  private spawnWyverns() {
    const positions = [
      { left:'20%', top:'30%' },
      { left:'70%', top:'25%' },
    ];
    positions.forEach((pos, i) => {
      const w = document.createElement('div');
      w.style.cssText = `
        position:fixed; left:${pos.left}; top:${pos.top}; z-index:3;
        pointer-events:none; font-size:20px; line-height:1;
        animation:wyvernCircle ${10+i*4}s linear infinite;
      `;
      w.textContent = i===0 ? '🦎' : '🦕';
      document.body.appendChild(w);
    });
  }

  /* ── Glowing magic orbs ── */
  private spawnMagicOrbs() {
    const orbs = [
      { left:'15%', top:'40%', color:'#f5c030', emoji:'⭐' },
      { left:'75%', top:'35%', color:'#a020f0', emoji:'🔮' },
      { left:'50%', top:'25%', color:'#1ab8a0', emoji:'💎' },
      { left:'30%', top:'50%', color:'#e8420a', emoji:'🔥' },
      { left:'88%', top:'45%', color:'#f5c030', emoji:'✨' },
    ];
    orbs.forEach((o, i) => {
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed; left:${o.left}; top:${o.top}; z-index:3;
        pointer-events:none; font-size:18px; line-height:1;
        filter:drop-shadow(0 0 8px ${o.color});
        animation:orbFloat ${3+i*.8}s ease-in-out ${i*.5}s infinite;
      `;
      el.textContent = o.emoji;
      document.body.appendChild(el);
    });
  }

  /* ── Animated clouds ── */
  private spawnClouds() {
    const cloudTypes = ['☁️','🌤️','⛅'];
    const spawn = () => {
      const c = document.createElement('div');
      const dur = Math.random()*20+20;
      const top = Math.random()*25+3;
      const size = Math.random()*20+18;
      c.style.cssText = `
        position:fixed; top:${top}%; z-index:2; pointer-events:none;
        font-size:${size}px; opacity:${Math.random()*.4+.3};
        animation:cloudDrift ${dur}s linear forwards;
      `;
      c.textContent = cloudTypes[Math.floor(Math.random()*cloudTypes.length)];
      document.body.appendChild(c);
      setTimeout(() => c.remove(), dur*1000+500);
    };
    for (let i=0;i<5;i++) setTimeout(spawn, i*5000);
    setInterval(spawn, 7000);
  }
}
