import { useEffect, useRef, useState, useCallback } from "react";

// ── Load external libs via CDN script injection ──
function useExternalScript(src) {
  useEffect(() => {
    if (document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    document.head.appendChild(s);
  }, [src]);
}

// ── Gradients palette ──
const GRADS = {
  forest: "linear-gradient(160deg,#0a2e1a,#1b5e34,#4caf74,#b7e4c7)",
  lava:   "radial-gradient(circle at 40% 60%,#7f1d1d,#dc2626,#f97316,#fbbf24)",
  ocean:  "linear-gradient(180deg,#03045e,#0077b6,#00b4d8,#caf0f8)",
  void:   "radial-gradient(ellipse at 20% 30%,#1e1b4b,#4c1d95,#6d28d9,#0a0a0a)",
  dusk:   "linear-gradient(135deg,#1c0533,#7c3aed,#db2777,#f59e0b)",
  ice:    "linear-gradient(160deg,#e0f7fa,#b2ebf2,#80deea,#4dd0e1)",
  ember:  "radial-gradient(circle,#431407,#9a3412,#ea580c,#fed7aa)",
  night:  "linear-gradient(160deg,#000,#0f172a,#1e3a5f,#3b82f6)",
  blush:  "linear-gradient(135deg,#fff1f2,#fecdd3,#fb7185,#e11d48)",
  moss:   "linear-gradient(160deg,#14532d,#166534,#4ade80,#d9f99d)",
};

const MOOD_CARDS = [
  { key:"void",  shape:"portrait",  num:"001", name:"深夜独处",  sub:"宇宙 · 4K" },
  { key:"forest",shape:"landscape", num:"002", name:"清晨翠谷",  sub:"自然 · 5K" },
  { key:"dusk",  shape:"tall",      num:"003", name:"黄昏将至",  sub:"渐变 · 4K" },
  { key:"lava",  shape:"square",    num:"004", name:"烈焰熔岩",  sub:"抽象 · 4K" },
  { key:"ice",   shape:"portrait",  num:"005", name:"极地寒流",  sub:"自然 · 4K" },
  { key:"ocean", shape:"landscape", num:"006", name:"深海蔚蓝",  sub:"自然 · 5K" },
  { key:"blush", shape:"square",    num:"007", name:"粉色心境",  sub:"极简 · 2K" },
  { key:"night", shape:"tall",      num:"008", name:"午夜城市",  sub:"城市 · 4K" },
  { key:"ember", shape:"portrait",  num:"009", name:"炭火余烬",  sub:"暗色 · 4K" },
  { key:"moss",  shape:"landscape", num:"010", name:"苔藓之境",  sub:"自然 · 4K" },
];

const CATS = [
  { key:"forest", label:"自然风光",   count:"8.4K" },
  { key:"void",   label:"宇宙星系",   count:"5.1K" },
  { key:"dusk",   label:"抽象艺术",   count:"12K"  },
  { key:"ice",    label:"极简主义",   count:"6.2K" },
  { key:"night",  label:"城市夜景",   count:"9.6K" },
  { key:"blush",  label:"插画二次元", count:"7.3K" },
  { key:"ember",  label:"暗色系",     count:"4.8K" },
];

const TAGS = ["全部","暗夜","极简","渐变","自然","宇宙","城市","抽象","日系","赛博","AI生成"];

const TICKER_ITEMS = [
  { text:"最新上传", accent:false },{ text:"4K 超清", accent:true },
  { text:"自然风光", accent:false },{ text:"本周热榜", accent:"red" },
  { text:"极简主义", accent:false },{ text:"AI 生成艺术", accent:true },
  { text:"宇宙星系", accent:false },{ text:"赛博朋克", accent:"red" },
  { text:"摄影师作品",accent:false },{ text:"暗色系", accent:true },
];

// shape → dimensions
const SHAPE_SIZE = {
  portrait:  { w:220, h:340 },
  landscape: { w:380, h:240 },
  square:    { w:280, h:280 },
  tall:      { w:180, h:380 },
};

// ─────────────────────────────────────────────
// Magnetic button hook
// ─────────────────────────────────────────────
function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  const raf = useRef(null);
  const pos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top  + rect.height / 2;
      pos.current = {
        x: (e.clientX - cx) * strength,
        y: (e.clientY - cy) * strength,
      };
    };
    const onLeave = () => { pos.current = { x: 0, y: 0 }; };

    const tick = () => {
      el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px)`;
      raf.current = requestAnimationFrame(tick);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf.current = requestAnimationFrame(tick);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf.current);
      el.style.transform = "";
    };
  }, [strength]);

  return ref;
}

// ─────────────────────────────────────────────
// Cursor
// ─────────────────────────────────────────────
function Cursor() {
  const dot  = useRef(null);
  const ring = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  const isTouch = useRef(false);

  useEffect(() => {
    isTouch.current = navigator.maxTouchPoints > 0;
    if (isTouch.current) return;

    const move = (e) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (!visible) setVisible(true);
    };
    window.addEventListener("mousemove", move);

    // hover states
    const over = () => {
      dot.current && (dot.current.style.transform = "scale(2.5)");
      ring.current && (ring.current.style.transform = "scale(1.6)");
      ring.current && (ring.current.style.borderColor = "#d42b2b");
    };
    const out = () => {
      dot.current && (dot.current.style.transform = "scale(1)");
      ring.current && (ring.current.style.transform = "scale(1)");
      ring.current && (ring.current.style.borderColor = "rgba(10,8,4,0.4)");
    };
    const hoverEls = document.querySelectorAll("button,a,.mood-card-wrap,.cat-block,.dr-cell,.film-cell");
    hoverEls.forEach(el => { el.addEventListener("mouseenter", over); el.addEventListener("mouseleave", out); });

    let raf;
    const tick = () => {
      ringPos.current.x += (mouse.current.x - ringPos.current.x) * 0.1;
      ringPos.current.y += (mouse.current.y - ringPos.current.y) * 0.1;
      if (dot.current) {
        dot.current.style.left = mouse.current.x - 5 + "px";
        dot.current.style.top  = mouse.current.y - 5 + "px";
      }
      if (ring.current) {
        ring.current.style.left = ringPos.current.x - 22 + "px";
        ring.current.style.top  = ringPos.current.y - 22 + "px";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  if (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0) return null;

  return (
    <>
      <div ref={dot} style={{
        position:"fixed", width:10, height:10, borderRadius:"50%",
        background:"#d42b2b", pointerEvents:"none", zIndex:9999,
        transition:"transform .15s ease", mixBlendMode:"multiply",
        opacity: visible ? 1 : 0,
      }}/>
      <div ref={ring} style={{
        position:"fixed", width:44, height:44, borderRadius:"50%",
        border:"1.5px solid rgba(10,8,4,0.4)", pointerEvents:"none", zIndex:9998,
        transition:"transform .3s ease, border-color .3s",
        opacity: visible ? 1 : 0,
      }}/>
    </>
  );
}

// ─────────────────────────────────────────────
// Film Cell (hero right panel)
// ─────────────────────────────────────────────
function FilmCell({ gradKey, label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="film-cell"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: hovered ? 2.8 : 1,
        position:"relative", overflow:"hidden",
        borderRight:"1px solid rgba(242,237,228,.08)",
        transition:"flex .55s cubic-bezier(.4,0,.2,1)",
        cursor:"crosshair",
      }}
    >
      <div style={{
        position:"absolute", inset:0,
        background: GRADS[gradKey],
        transform: hovered ? "scale(1.07)" : "scale(1)",
        transition:"transform .6s ease",
      }}/>
      <div style={{
        position:"absolute", bottom:10, left:12,
        fontSize:9, letterSpacing:3, textTransform:"uppercase",
        color:"rgba(242,237,228,.55)", opacity: hovered ? 1 : 0,
        transition:"opacity .3s",
        fontFamily:"'Instrument Sans',sans-serif",
      }}>{label}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Mood Card
// ─────────────────────────────────────────────
function MoodCard({ card, index }) {
  const { w, h } = SHAPE_SIZE[card.shape];
  const [hov, setHov] = useState(false);
  const ref = useRef(null);

  // 3D tilt on hover
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  - 0.5) * 18;
      const y = ((e.clientY - rect.top)  / rect.height - 0.5) * 18;
      el.style.transform = `perspective(600px) rotateY(${x}deg) rotateX(${-y}deg) scale(1.03)`;
    };
    const leave = () => { el.style.transform = "perspective(600px) rotateY(0) rotateX(0) scale(1)"; };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, []);

  return (
    <div
      className="mood-card-wrap"
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: w, height: h, flexShrink:0,
        position:"relative", overflow:"hidden",
        border:"1.5px solid #0a0804",
        transition:"transform .1s ease, box-shadow .3s",
        boxShadow: hov ? "0 24px 60px rgba(10,8,4,.25)" : "0 4px 20px rgba(10,8,4,.08)",
        transformStyle:"preserve-3d",
        animationDelay: `${index * 0.06}s`,
      }}
    >
      <div style={{
        position:"absolute", inset:0,
        background: GRADS[card.key],
        transform: hov ? "scale(1.06)" : "scale(1)",
        transition:"transform .7s ease",
      }}/>
      {/* num */}
      <div style={{
        position:"absolute", top:14, left:14,
        fontFamily:"'Bebas Neue',sans-serif", fontSize:12, letterSpacing:2,
        color:"rgba(242,237,228,.45)", mixBlendMode:"screen",
      }}>{card.num}</div>

      {/* download btn */}
      <div style={{
        position:"absolute", top:12, right:12,
        width:34, height:34,
        background:"rgba(242,237,228,.9)", border:"1.5px solid #0a0804",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:14, cursor:"pointer",
        opacity: hov ? 1 : 0, transition:"opacity .25s, background .2s",
      }}
        onMouseEnter={e => e.currentTarget.style.background="#f5c842"}
        onMouseLeave={e => e.currentTarget.style.background="rgba(242,237,228,.9)"}
      >↓</div>

      {/* info slide up */}
      <div style={{
        position:"absolute", bottom:0, left:0, right:0,
        padding:"32px 16px 16px",
        background:"linear-gradient(to top, rgba(10,8,4,.85) 0%, transparent 100%)",
        transform: hov ? "translateY(0)" : "translateY(110%)",
        transition:"transform .42s cubic-bezier(.4,0,.2,1)",
      }}>
        <div style={{
          fontFamily:"'DM Serif Display',serif", fontStyle:"italic",
          fontSize:18, color:"#f2ede4", marginBottom:4,
        }}>{card.name}</div>
        <div style={{
          fontSize:9, letterSpacing:3, textTransform:"uppercase",
          color:"rgba(242,237,228,.6)", fontFamily:"'Instrument Sans',sans-serif",
        }}>{card.sub}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Category Block
// ─────────────────────────────────────────────
function CatBlock({ cat, expanded, onHover, onLeave }) {
  return (
    <div
      className="cat-block"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        flex: expanded ? 2.2 : 1,
        position:"relative", overflow:"hidden",
        height:280, borderRight:"1.5px solid #0a0804",
        transition:"flex .55s cubic-bezier(.4,0,.2,1)",
        cursor:"pointer", flexShrink:0, minWidth:100,
      }}
    >
      <div style={{
        position:"absolute", inset:0, background: GRADS[cat.key],
        transform: expanded ? "scale(1.09)" : "scale(1.01)",
        filter: expanded ? "saturate(1) brightness(.75)" : "saturate(.65) brightness(.55)",
        transition:"transform .7s ease, filter .5s",
      }}/>
      {/* big count */}
      <div style={{
        position:"absolute", top:14, left:0, right:0, textAlign:"center",
        fontFamily:"'Bebas Neue',sans-serif", fontSize:32,
        color: expanded ? "rgba(242,237,228,.65)" : "rgba(242,237,228,.2)",
        transition:"color .4s",
      }}>{cat.count}</div>
      {/* vertical label */}
      <div style={{
        position:"absolute", inset:0, display:"flex",
        alignItems:"flex-end", padding:"16px 14px",
      }}>
        <span style={{
          fontFamily:"'Bebas Neue',sans-serif",
          fontSize:15, letterSpacing: expanded ? 6 : 4,
          textTransform:"uppercase", color:"#f2ede4",
          writingMode:"vertical-rl", textOrientation:"mixed",
          transform:"rotate(180deg)",
          transition:"letter-spacing .35s",
        }}>{cat.label}</span>
      </div>
      {/* arrow */}
      <div style={{
        position:"absolute", bottom:14, right:14,
        width:28, height:28, borderRadius:"50%",
        border:"1px solid rgba(242,237,228,.5)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:13, color:"#f2ede4",
        opacity: expanded ? 1 : 0, transition:"opacity .3s",
      }}>↗</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Darkroom Cell
// ─────────────────────────────────────────────
function DrCell({ gradKey, title, sub, badge, span2 }) {
  const [hov, setHov] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width  - 0.5) * 12;
      const y = ((e.clientY - r.top)  / r.height - 0.5) * 12;
      el.querySelector(".dr-inner").style.transform =
        `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    const leave = () => { el.querySelector(".dr-inner").style.transform = "perspective(800px) rotateY(0) rotateX(0)"; };
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => { el.removeEventListener("mousemove", move); el.removeEventListener("mouseleave", leave); };
  }, []);

  return (
    <div
      className="dr-cell"
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position:"relative", overflow:"hidden", cursor:"pointer",
        gridColumn: span2 ? "1/3" : undefined,
        gridRow:    span2 ? "1"   : undefined,
      }}
    >
      <div
        className="dr-inner"
        style={{
          width:"100%", height:"100%",
          transition:"transform .1s ease",
          transformStyle:"preserve-3d",
        }}
      >
        <div style={{
          position:"absolute", inset:0, background: GRADS[gradKey],
          transform: hov ? "scale(1.06)" : "scale(1)",
          filter: hov ? "brightness(.85) saturate(1)" : "brightness(.65) saturate(.75)",
          transition:"transform .7s ease, filter .45s",
        }}/>
        {badge && (
          <div style={{
            position:"absolute", top:12, left:12,
            background:"#f5c842", color:"#0a0804",
            fontFamily:"'Bebas Neue',sans-serif",
            fontSize:10, letterSpacing:2, padding:"3px 8px",
          }}>{badge}</div>
        )}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(to top, rgba(10,8,4,.85) 0%, transparent 60%)",
          opacity: hov ? 1 : 0, transition:"opacity .35s",
          display:"flex", flexDirection:"column",
          justifyContent:"flex-end", padding:20,
        }}>
          <div style={{
            fontFamily:"'DM Serif Display',serif", fontStyle:"italic",
            fontSize: span2 ? 24 : 18, color:"#f2ede4", marginBottom:4,
          }}>{title}</div>
          <div style={{
            fontSize:9, letterSpacing:3, textTransform:"uppercase",
            color:"rgba(242,237,228,.5)",
            fontFamily:"'Instrument Sans',sans-serif",
          }}>{sub}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────
function Nav({ scrolled }) {
  const logoRef = useMagnetic(0.25);
  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:500,
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 32px", height:56,
      background: scrolled ? "#f2ede4" : "#f2ede4",
      borderBottom:"1.5px solid #0a0804",
      transition:"box-shadow .3s",
      boxShadow: scrolled ? "0 2px 24px rgba(10,8,4,.08)" : "none",
    }}>
      <div ref={logoRef} style={{
        fontFamily:"'Bebas Neue',sans-serif", fontSize:28,
        letterSpacing:4, color:"#0a0804", lineHeight:1, cursor:"pointer",
        transition:"transform .1s",
      }}>
        FRAME<sup style={{ fontFamily:"'Instrument Sans',sans-serif", fontSize:9, letterSpacing:2, color:"#d42b2b", verticalAlign:"super" }}>™</sup>
      </div>
      <div style={{ display:"flex", gap:32 }} className="nav-links">
        {["探索","暗室精选","创作者","4K库"].map(l => (
          <a key={l} href="#" style={{
            fontSize:11, letterSpacing:2, textTransform:"uppercase",
            color:"#8a8070", textDecoration:"none",
            transition:"color .2s",
          }}
            onMouseEnter={e => e.target.style.color="#0a0804"}
            onMouseLeave={e => e.target.style.color="#8a8070"}
          >{l}</a>
        ))}
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <MagBtn ghost>登录</MagBtn>
        <MagBtn>上传作品</MagBtn>
      </div>
    </nav>
  );
}

function MagBtn({ children, ghost }) {
  const ref = useMagnetic(0.4);
  return (
    <button ref={ref} style={{
      background: ghost ? "transparent" : "#0a0804",
      color: ghost ? "#0a0804" : "#f2ede4",
      border: ghost ? "1.5px solid #0a0804" : "none",
      padding: ghost ? "6px 16px" : "7px 18px",
      fontFamily:"'Instrument Sans',sans-serif",
      fontSize:11, letterSpacing:2, textTransform:"uppercase",
      cursor:"pointer", transition:"background .2s, color .2s",
    }}
      onMouseEnter={e => {
        if (ghost) { e.currentTarget.style.background="#0a0804"; e.currentTarget.style.color="#f2ede4"; }
        else e.currentTarget.style.background="#d42b2b";
      }}
      onMouseLeave={e => {
        if (ghost) { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="#0a0804"; }
        else e.currentTarget.style.background="#0a0804";
      }}
    >{children}</button>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  useExternalScript("https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Bebas+Neue&family=Instrument+Sans:ital,wght@0,300;0,400;1,300&display=swap");

  const [scrolled, setScrolled] = useState(false);
  const [activeTag, setActiveTag] = useState("全部");
  const [expandedCat, setExpandedCat] = useState(null);
  const moodRef = useRef(null);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Drag-to-scroll mood board
  useEffect(() => {
    const el = moodRef.current;
    if (!el) return;
    let isDown = false, startX, scrollLeft;
    const down = e => { isDown = true; startX = e.pageX - el.offsetLeft; scrollLeft = el.scrollLeft; el.style.cursor = "grabbing"; };
    const up   = () => { isDown = false; el.style.cursor = "grab"; };
    const move = e => {
      if (!isDown) return;
      e.preventDefault();
      el.scrollLeft = scrollLeft - (e.pageX - el.offsetLeft - startX) * 1.4;
    };
    el.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);
    el.addEventListener("mousemove", move);
    return () => { el.removeEventListener("mousedown", down); window.removeEventListener("mouseup", up); el.removeEventListener("mousemove", move); };
  }, []);

  // Scroll reveal
  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.opacity = "1";
          e.target.style.transform = "translateY(0)";
        }
      });
    }, { threshold: 0.1 });
    els.forEach(el => {
      el.style.opacity = "0";
      el.style.transform = "translateY(28px)";
      el.style.transition = "opacity .6s ease, transform .6s ease";
      obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  // Lenis-like smooth scroll (native CSS)
  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
  }, []);

  const heroFilmRows = [
    [["void","宇宙·027"],["dusk","黄昏·041"],["forest","自然·013"]],
    [["ocean","深海·058"],["lava","熔岩·072"],["night","暗夜·089"]],
    [["blush","腮红·104"],["ice","冰川·117"],["ember","余烬·132"]],
  ];

  return (
    <div style={{ background:"#f2ede4", color:"#0a0804", fontFamily:"'Instrument Sans',sans-serif", overflowX:"hidden" }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com"/>
      <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Bebas+Neue&family=Instrument+Sans:ital,wght@0,300;0,400;1,300&display=swap" rel="stylesheet"/>

      {/* Grain overlay */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:9000,
        opacity:.04,
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='g'%3E%3CfeTurbulence baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23g)'/%3E%3C/svg%3E")`,
        backgroundSize:"180px",
      }}/>

      <Cursor/>
      <Nav scrolled={scrolled}/>

      {/* ── HERO ── */}
      <section style={{
        marginTop:56, display:"grid",
        gridTemplateColumns:"1fr 1fr",
        minHeight:"calc(100svh - 56px)",
        borderBottom:"1.5px solid #0a0804",
      }}>
        {/* LEFT */}
        <div style={{
          padding:"clamp(40px,5vw,72px) clamp(20px,4vw,56px)",
          display:"flex", flexDirection:"column", justifyContent:"space-between",
          borderRight:"1.5px solid #0a0804", gap:28,
        }}>
          <div style={{
            display:"inline-flex", alignItems:"center", gap:8,
            fontSize:10, letterSpacing:3, textTransform:"uppercase", color:"#d42b2b",
          }}>
            <span style={{
              width:7, height:7, borderRadius:"50%", background:"#d42b2b",
              animation:"blink 1.4s ease infinite",
              display:"inline-block",
            }}/>
            每日更新中
          </div>

          <h1 style={{
            fontFamily:"'DM Serif Display',serif",
            fontSize:"clamp(52px,7.5vw,96px)",
            lineHeight:.93, letterSpacing:"-2px",
          }}>
            每一帧<br/>
            <em style={{ fontStyle:"italic", color:"#d42b2b" }}>都值得</em><br/>
            <span style={{ WebkitTextStroke:"1.5px #0a0804", color:"transparent" }}>被看见</span>
          </h1>

          <p style={{ fontSize:14, lineHeight:1.75, color:"#8a8070", maxWidth:360, fontWeight:300 }}>
            不只是壁纸——是你与世界相处的方式。收录来自全球摄影师与数字艺术家的 48,000+ 作品，4K 画质，免费下载。
          </p>

          <button
            style={{
              display:"inline-flex", alignItems:"center", gap:12,
              fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:3,
              background:"none", border:"none", cursor:"pointer", color:"#0a0804",
              transition:"gap .3s",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.gap="20px";
              e.currentTarget.querySelector(".ac").style.background="#0a0804";
              e.currentTarget.querySelector(".ac").style.color="#f2ede4";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.gap="12px";
              e.currentTarget.querySelector(".ac").style.background="transparent";
              e.currentTarget.querySelector(".ac").style.color="#0a0804";
            }}
          >
            <div className="ac" style={{
              width:48, height:48, borderRadius:"50%",
              border:"1.5px solid #0a0804",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:20, transition:"background .2s, color .2s",
            }}>→</div>
            进入画廊
          </button>

          <div style={{
            display:"flex", gap:40, paddingTop:32,
            borderTop:"1.5px solid rgba(10,8,4,.1)",
          }}>
            {[["48K+","精选壁纸"],["2.1M","月活用户"],["3,200","创作者"]].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:32, letterSpacing:-1 }}>{n}</div>
                <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", color:"#8a8070", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Ghost big number */}
          <div style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:120, lineHeight:1,
            color:"rgba(10,8,4,.04)", letterSpacing:-4,
            position:"absolute", bottom:-10, left:32, pointerEvents:"none",
          }}>48K</div>
        </div>

        {/* RIGHT: Film strip */}
        <div style={{ position:"relative", overflow:"hidden", background:"#0a0804", cursor:"crosshair" }}>
          {/* Sprocket holes */}
          {[{left:0},{right:0}].map((pos, i) => (
            <div key={i} style={{
              position:"absolute", ...pos, top:0, bottom:0, width:20,
              display:"flex", flexDirection:"column",
              justifyContent:"space-around", alignItems:"center",
              padding:"10px 0", pointerEvents:"none", zIndex:10,
            }}>
              {Array.from({length:8}).map((_,j) => (
                <div key={j} style={{
                  width:8, height:12, borderRadius:2,
                  border:"1px solid rgba(242,237,228,.18)",
                }}/>
              ))}
            </div>
          ))}

          <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column" }}>
            {heroFilmRows.map((row, ri) => (
              <div key={ri} style={{
                flex:1, display:"flex",
                borderBottom: ri < 2 ? "1px solid rgba(242,237,228,.08)" : "none",
                overflow:"hidden",
              }}>
                {row.map(([g, lbl]) => (
                  <FilmCell key={g+lbl} gradKey={g} label={lbl}/>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom overlay */}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"48px 28px 28px",
            background:"linear-gradient(to top, rgba(10,8,4,.92) 0%, transparent 100%)",
            pointerEvents:"none",
          }}>
            <h3 style={{ fontFamily:"'DM Serif Display',serif", fontStyle:"italic", fontSize:26, color:"#f2ede4", marginBottom:6 }}>本周最受欢迎</h3>
            <span style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", color:"#f5c842", fontFamily:"'Instrument Sans',sans-serif" }}>共 2,847 次下载</span>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{
        height:42, background:"#0a0804", overflow:"hidden",
        borderBottom:"1.5px solid #0a0804",
        display:"flex", alignItems:"center",
      }}>
        <div style={{
          display:"flex", gap:0, whiteSpace:"nowrap",
          animation:"tick 28s linear infinite",
        }}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} style={{
              display:"inline-flex", alignItems:"center", gap:16,
              padding:"0 20px",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:3,
              color: item.accent === true ? "#f5c842" : item.accent === "red" ? "#ff3b3b" : "#f2ede4",
            }}>
              {item.text}
              <span style={{ color:"rgba(242,237,228,.18)" }}>／</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── MOOD BOARD ── */}
      <section style={{ padding:"80px 0 0", borderBottom:"1.5px solid #0a0804" }}>
        <div className="reveal" style={{
          padding:"0 clamp(16px,4vw,40px) 36px",
          display:"flex", alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:16,
        }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:"#8a8070", textTransform:"uppercase", marginBottom:10, fontFamily:"'Instrument Sans',sans-serif" }}>01 — 情绪版</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(36px,5vw,64px)", lineHeight:1, letterSpacing:-1 }}>
              按<em style={{ fontStyle:"italic", color:"#d42b2b" }}>心情</em>找壁纸
            </h2>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"#8a8070" }}>
            <span style={{ animation:"nudge 2s ease infinite", display:"inline-block", fontSize:20 }}>→</span>
            左右滑动
          </div>
        </div>

        {/* Horizontal scroll */}
        <div ref={moodRef} style={{
          overflowX:"auto", overflowY:"visible",
          scrollbarWidth:"none", WebkitOverflowScrolling:"touch",
          padding:"0 clamp(16px,4vw,40px) 52px",
          cursor:"grab",
        }}>
          <div style={{ display:"flex", gap:14, width:"max-content", paddingBottom:2 }}>
            {MOOD_CARDS.map((card, i) => <MoodCard key={card.num} card={card} index={i}/>)}
          </div>
        </div>
      </section>

      {/* ── EDITORIAL ── */}
      <section className="reveal" style={{
        display:"grid", gridTemplateColumns:"1.2fr 1fr",
        borderBottom:"1.5px solid #0a0804",
      }}>
        <div style={{ position:"relative", overflow:"hidden", height:540, borderRight:"1.5px solid #0a0804", cursor:"pointer" }}
          onMouseEnter={e => { e.currentTarget.querySelector(".edbg").style.transform = "scale(1.05)"; }}
          onMouseLeave={e => { e.currentTarget.querySelector(".edbg").style.transform = "scale(1)"; }}
        >
          <div className="edbg" style={{
            width:"100%", height:"100%", background: GRADS.forest,
            transition:"transform .8s ease",
          }}/>
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"60px 36px 32px",
            background:"linear-gradient(to top, rgba(10,8,4,.95) 0%, transparent 100%)",
            color:"#f2ede4",
          }}>
            <div style={{ fontSize:9, letterSpacing:4, textTransform:"uppercase", color:"#f5c842", marginBottom:12 }}>✦ 编辑推荐 · 本周</div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:34, lineHeight:1.1, marginBottom:10 }}>消失于翡翠山谷的晨雾</h2>
            <p style={{ fontSize:12, lineHeight:1.65, color:"rgba(242,237,228,.6)", fontWeight:300, maxWidth:380 }}>摄影师 Lin Yue 在四川盆地花了三天守候这一帧——光、雾与绿的短暂和解。</p>
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column" }}>
          {[
            { key:"void",  num:"NO.02", name:"星云漂移",   meta:"宇宙 · 5K · 1,240 次下载" },
            { key:"lava",  num:"NO.03", name:"地核之火",   meta:"抽象 · 4K · 987 次下载" },
            { key:"night", num:"NO.04", name:"深夜漫游者", meta:"城市 · 4K · 876 次下载" },
          ].map(item => (
            <div key={item.key}
              style={{ display:"grid", gridTemplateColumns:"100px 1fr", borderBottom:"1.5px solid #0a0804", flex:1, cursor:"pointer", transition:"background .2s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#e8e0d2"; e.currentTarget.querySelector(".ith").style.transform="scale(1.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.querySelector(".ith").style.transform="scale(1)"; }}
            >
              <div style={{ overflow:"hidden", borderRight:"1.5px solid #0a0804" }}>
                <div className="ith" style={{ width:"100%", height:"100%", background: GRADS[item.key], transition:"transform .5s ease" }}/>
              </div>
              <div style={{ padding:"18px 20px", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:11, letterSpacing:2, color:"#8a8070" }}>{item.num}</div>
                <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:20, lineHeight:1.2 }}>{item.name}</div>
                <div style={{ fontSize:9, letterSpacing:2, textTransform:"uppercase", color:"#8a8070" }}>{item.meta}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CATEGORY STRIP ── */}
      <div style={{ display:"flex", borderBottom:"1.5px solid #0a0804", overflowX:"auto" }}>
        {CATS.map((cat, i) => (
          <CatBlock key={cat.key} cat={cat}
            expanded={expandedCat === i}
            onHover={() => setExpandedCat(i)}
            onLeave={() => setExpandedCat(null)}
          />
        ))}
      </div>

      {/* ── SEARCH ── */}
      <section className="reveal" style={{
        padding:"clamp(48px,8vw,80px) clamp(16px,4vw,40px)",
        borderBottom:"1.5px solid #0a0804",
        display:"flex", gap:"clamp(24px,6vw,60px)", alignItems:"flex-start", flexWrap:"wrap",
      }}>
        <div style={{ flex:"0 0 280px", minWidth:200 }}>
          <span style={{ fontSize:10, letterSpacing:4, textTransform:"uppercase", color:"#8a8070", display:"block", marginBottom:12 }}>02 — 发现</span>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(32px,4vw,44px)", lineHeight:1, letterSpacing:-1 }}>
            找到你的<em style={{ fontStyle:"italic", color:"#d42b2b" }}>那一帧</em>
          </h2>
        </div>
        <div style={{ flex:1, minWidth:260 }}>
          <div style={{ display:"flex", border:"1.5px solid #0a0804", overflow:"hidden", marginBottom:20 }}>
            <input
              style={{
                flex:1, border:"none", outline:"none", padding:"18px 20px",
                fontFamily:"'DM Serif Display',serif", fontSize:22, fontStyle:"italic",
                background:"transparent", color:"#0a0804",
              }}
              placeholder="描述你想要的画面…"
            />
            <button style={{
              background:"#0a0804", color:"#f2ede4", border:"none", padding:"0 28px",
              fontFamily:"'Bebas Neue',sans-serif", fontSize:14, letterSpacing:3, cursor:"pointer",
              transition:"background .2s",
            }}
              onMouseEnter={e => e.target.style.background="#d42b2b"}
              onMouseLeave={e => e.target.style.background="#0a0804"}
            >搜索</button>
          </div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
            {TAGS.map(t => (
              <button key={t}
                onClick={() => setActiveTag(t)}
                style={{
                  background: activeTag===t ? "#0a0804" : "transparent",
                  color: activeTag===t ? "#f2ede4" : "#0a0804",
                  border:"1.5px solid #0a0804", padding:"6px 14px",
                  fontFamily:"'Instrument Sans',sans-serif",
                  fontSize:10, letterSpacing:2, textTransform:"uppercase",
                  cursor:"pointer", transition:"all .2s",
                }}
                onMouseEnter={e => { if(activeTag!==t){ e.target.style.background="#0a0804"; e.target.style.color="#f2ede4"; }}}
                onMouseLeave={e => { if(activeTag!==t){ e.target.style.background="transparent"; e.target.style.color="#0a0804"; }}}
              >{t}</button>
            ))}
          </div>
        </div>
      </section>

      {/* ── DARKROOM ── */}
      <div style={{ background:"#0a0804", padding:"clamp(48px,6vw,80px) clamp(16px,4vw,40px)", borderBottom:"1px solid rgba(242,237,228,.08)" }}>
        <div className="reveal" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:44, flexWrap:"wrap", gap:12 }}>
          <h2 style={{ fontFamily:"'DM Serif Display',serif", fontStyle:"italic", fontSize:"clamp(36px,5vw,52px)", color:"#f2ede4" }}>暗室精选</h2>
          <p style={{ fontSize:11, letterSpacing:3, textTransform:"uppercase", color:"rgba(242,237,228,.3)", textAlign:"right", lineHeight:1.6 }}>每周策展<br/>编辑团队推荐</p>
        </div>
        <div style={{
          display:"grid",
          gridTemplateColumns:"2fr 1fr 1fr",
          gridTemplateRows:"260px 260px",
          gap:3,
        }}>
          <DrCell gradKey="dusk"   title="暮色将临，万物静默" sub="渐变 · 5K · 2,341 下载" badge="本周最佳" span2/>
          <DrCell gradKey="ocean"  title="冰川之蓝"    sub="自然 · 4K"/>
          <DrCell gradKey="ember"  title="炭火夜语"    sub="暗色 · 4K"/>
          <DrCell gradKey="moss"   title="苔藓与光"    sub="自然 · 4K"/>
          <DrCell gradKey="blush"  title="粉樱之间"    sub="极简 · 2K"/>
        </div>
      </div>

      {/* ── JOIN ── */}
      <section className="reveal" style={{
        display:"grid", gridTemplateColumns:"1fr 1fr",
        borderBottom:"1.5px solid #0a0804", minHeight:400,
      }}>
        <div style={{
          padding:"clamp(40px,5vw,72px) clamp(20px,4vw,48px)",
          borderRight:"1.5px solid #0a0804",
          display:"flex", flexDirection:"column", justifyContent:"space-between", gap:32,
        }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, textTransform:"uppercase", color:"#d42b2b", display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#d42b2b", animation:"blink 1.4s ease infinite", display:"inline-block" }}/>
              创作者计划
            </div>
            <h2 style={{ fontFamily:"'DM Serif Display',serif", fontSize:"clamp(32px,4vw,52px)", lineHeight:1.05, letterSpacing:-1 }}>
              分享你<br/>镜头里的<em style={{ fontStyle:"italic", color:"#d42b2b" }}>世界</em>
            </h2>
          </div>
          <p style={{ fontSize:14, color:"#8a8070", lineHeight:1.75, fontWeight:300, maxWidth:360 }}>上传你的摄影、插画或 AI 作品。每次下载，你都获得收益分成。加入 3,200 位创作者。</p>
          <div style={{ display:"flex", gap:40, flexWrap:"wrap" }}>
            {[["3.2K","活跃创作者"],["48K","收录作品"],["70%","收益分成"]].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:38, lineHeight:1, letterSpacing:-1 }}>
                  {n}<span style={{ fontSize:20, color:"#d42b2b" }}></span>
                </div>
                <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", color:"#8a8070", marginTop:4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background:"#0a0804", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:20,
          padding:48, cursor:"pointer", transition:"background .3s", position:"relative", overflow:"hidden",
        }}
          onMouseEnter={e => {
            e.currentTarget.style.background="#1a1612";
            e.currentTarget.querySelector(".ucross").style.borderColor="#f5c842";
            e.currentTarget.querySelector(".ucross").style.color="#f5c842";
            e.currentTarget.querySelector(".ucross").style.transform="rotate(45deg)";
            e.currentTarget.querySelector(".ulbl").style.color="#f2ede4";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background="#0a0804";
            e.currentTarget.querySelector(".ucross").style.borderColor="rgba(242,237,228,.2)";
            e.currentTarget.querySelector(".ucross").style.color="rgba(242,237,228,.3)";
            e.currentTarget.querySelector(".ucross").style.transform="rotate(0)";
            e.currentTarget.querySelector(".ulbl").style.color="rgba(242,237,228,.4)";
          }}
        >
          <div style={{
            position:"absolute", bottom:-20,
            fontFamily:"'Bebas Neue',sans-serif", fontSize:160, letterSpacing:-5,
            color:"rgba(242,237,228,.025)", pointerEvents:"none", whiteSpace:"nowrap",
          }}>UPLOAD</div>
          <div className="ucross" style={{
            width:80, height:80, borderRadius:"50%",
            border:"2px solid rgba(242,237,228,.2)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:36, color:"rgba(242,237,228,.3)",
            transition:"all .4s cubic-bezier(.4,0,.2,1)",
          }}>+</div>
          <div className="ulbl" style={{
            fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:5,
            color:"rgba(242,237,228,.4)", textAlign:"center",
            transition:"color .3s",
          }}>拖拽上传你的作品</div>
          <div style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase", color:"rgba(242,237,228,.2)", textAlign:"center" }}>JPG · PNG · WEBP · 最大 50MB</div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr",
        gap:0, padding:"clamp(40px,5vw,56px) clamp(16px,4vw,40px) 32px",
        borderBottom:"1.5px solid #0a0804", flexWrap:"wrap",
      }}>
        <div style={{ paddingRight:40 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:40, letterSpacing:4, lineHeight:1, marginBottom:14 }}>FRAME</div>
          <p style={{ fontSize:13, color:"#8a8070", lineHeight:1.65, fontWeight:300 }}>每一帧都值得被看见。<br/>壁纸不是装饰，是态度。</p>
        </div>
        {[
          ["探索", ["情绪版","暗室精选","热门排行","随机发现"]],
          ["创作者", ["上传作品","收益计划","版权保护","创作者指南"]],
          ["关于",   ["关于 FRAME","隐私政策","使用条款","联系我们"]],
        ].map(([h, links]) => (
          <div key={h} style={{ paddingRight:20 }}>
            <h5 style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", color:"#d42b2b", marginBottom:20 }}>{h}</h5>
            <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:10 }}>
              {links.map(l => (
                <li key={l}><a href="#" style={{ fontSize:13, color:"#8a8070", textDecoration:"none", transition:"color .2s" }}
                  onMouseEnter={e => e.target.style.color="#0a0804"}
                  onMouseLeave={e => e.target.style.color="#8a8070"}
                >{l}</a></li>
              ))}
            </ul>
          </div>
        ))}
      </footer>
      <div style={{
        padding:"18px clamp(16px,4vw,40px)", display:"flex",
        justifyContent:"space-between", flexWrap:"wrap", gap:8,
        fontSize:10, letterSpacing:2, textTransform:"uppercase", color:"#8a8070",
      }}>
        <span>© 2026 FRAME™ — 每一帧都值得被看见</span>
        <span>Made with obsession</span>
      </div>

      {/* ── GLOBAL CSS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Bebas+Neue&family=Instrument+Sans:ital,wght@0,300;0,400;1,300&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin:0; padding:0; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        ::-webkit-scrollbar { display: none; }

        @keyframes blink {
          0%,100%{opacity:1;transform:scale(1);}
          50%{opacity:.2;transform:scale(.8);}
        }
        @keyframes tick {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes nudge {
          0%,100%{transform:translateX(0);}
          50%{transform:translateX(7px);}
        }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(24px);}
          to{opacity:1;transform:translateY(0);}
        }

        /* mobile */
        @media(max-width:768px){
          section[style*="grid-template-columns: 1fr 1fr"]:first-of-type,
          section[style*="1.2fr 1fr"],
          footer,
          section[style*="gridTemplateColumns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          .nav-links { display:none !important; }
        }
      `}</style>
    </div>
  );
}
