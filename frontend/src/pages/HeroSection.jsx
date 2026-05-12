import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

const NODES = [
  { id: 0,  label: 'SkillSync',  x: 0.50, y: 0.50, r: 24, center: true },
  { id: 1,  label: 'Python',     x: 0.25, y: 0.25, r: 16 },
  { id: 2,  label: 'Node.js',    x: 0.72, y: 0.22, r: 14 },
  { id: 3,  label: 'Leadership', x: 0.15, y: 0.55, r: 15 },
  { id: 4,  label: 'UI/UX',      x: 0.78, y: 0.52, r: 14 },
  { id: 5,  label: 'DevOps',     x: 0.30, y: 0.75, r: 13 },
  { id: 6,  label: 'AI/ML',      x: 0.65, y: 0.78, r: 16 },
  { id: 7,  label: 'Design',     x: 0.48, y: 0.18, r: 13 },
  { id: 8,  label: 'MongoDB',    x: 0.85, y: 0.35, r: 12 },
  { id: 9,  label: 'TypeScript', x: 0.18, y: 0.80, r: 13 },
  { id: 10, label: 'Scrum',      x: 0.55, y: 0.88, r: 12 },
  { id: 11, label: 'AWS',        x: 0.88, y: 0.68, r: 12 },
]

const EDGES = [
  [0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
  [1,3],[1,5],[1,6],[2,8],[2,4],[3,9],[4,11],
  [5,9],[5,10],[6,10],[6,11],[7,2],[8,11],[9,10],
]

export default function HeroSection() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animFrame
    let pulses = []
    let t = 0

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const pulseInterval = setInterval(() => {
      const edge = EDGES[Math.floor(Math.random() * EDGES.length)]
      pulses.push({ edge, progress: 0, speed: 0.012 + Math.random() * 0.008 })
    }, 600)

    const draw = () => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)

      const pos = NODES.map((n, i) => ({
        x: n.x * W + (n.center ? 0 : Math.sin(t * 0.6 + i * 1.3) * 6),
        y: n.y * H + (n.center ? 0 : Math.cos(t * 0.5 + i * 0.9) * 5),
        r: n.r, label: n.label, center: n.center,
      }))

      EDGES.forEach(([a, b]) => {
        const pa = pos[a], pb = pos[b]
        const g = ctx.createLinearGradient(pa.x, pa.y, pb.x, pb.y)
        g.addColorStop(0, 'rgba(40,98,58,0.35)')
        g.addColorStop(1, 'rgba(40,98,58,0.10)')
        ctx.beginPath()
        ctx.moveTo(pa.x, pa.y)
        ctx.lineTo(pb.x, pb.y)
        ctx.strokeStyle = g
        ctx.lineWidth = 1
        ctx.stroke()
      })

      pulses = pulses.filter(p => p.progress <= 1)
      pulses.forEach(p => {
        const [a, b] = p.edge
        const pa = pos[a], pb = pos[b]
        const px = pa.x + (pb.x - pa.x) * p.progress
        const py = pa.y + (pb.y - pa.y) * p.progress
        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8)
        grd.addColorStop(0, 'rgba(62,224,127,0.9)')
        grd.addColorStop(1, 'rgba(62,224,127,0)')
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI*2)
        ctx.fillStyle = grd; ctx.fill()
        ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI*2)
        ctx.fillStyle = '#3EE07F'; ctx.fill()
        p.progress += p.speed
      })

      pos.forEach(n => {
        if (n.center) {
          const glow = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.5)
          glow.addColorStop(0, 'rgba(62,224,127,0.2)')
          glow.addColorStop(1, 'rgba(62,224,127,0)')
          ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 2.5, 0, Math.PI*2)
          ctx.fillStyle = glow; ctx.fill()
        }
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI*2)
        ctx.strokeStyle = n.center ? 'rgba(62,224,127,0.45)' : 'rgba(40,98,58,0.35)'
        ctx.lineWidth = 1; ctx.stroke()
        const fill = ctx.createRadialGradient(n.x - n.r*0.3, n.y - n.r*0.3, 1, n.x, n.y, n.r)
        fill.addColorStop(0, n.center ? '#28623A' : '#1A4D2E')
        fill.addColorStop(1, '#0F2027')
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2)
        ctx.fillStyle = fill; ctx.fill()
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI*2)
        ctx.strokeStyle = n.center ? '#3EE07F' : 'rgba(40,98,58,0.55)'
        ctx.lineWidth = n.center ? 1.5 : 1; ctx.stroke()
        ctx.font = `${n.center ? 600 : 500} ${n.center ? 11 : 9}px Inter,sans-serif`
        ctx.fillStyle = n.center ? '#F0FAF4' : '#7BAF8E'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(n.label, n.x, n.y)
      })

      t += 0.016
      animFrame = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animFrame)
      clearInterval(pulseInterval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div>
      <Navbar />
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-[#0F2027]">

      {/* bg glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(40,98,58,0.18)_0%,_transparent_70%)]" />
      </div>

      {/* grid overlay */}
      <div className="ss-grid-overlay absolute inset-0 pointer-events-none opacity-[0.04]" />

      {/* text block */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pt-32 pb-10">

        {/* eyebrow */}
        <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[#28623A]/40 bg-[#28623A]/10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3EE07F] animate-pulse" />
          <span className="text-[#7BAF8E] text-[12px] tracking-[0.2em] uppercase font-medium">AI-Powered Project Staffing</span>
        </div>

        {/* headline */}
        <h1 className="mb-6 text-[#F0FAF4] font-bold leading-[1.05] tracking-tight text-[clamp(40px,6vw,76px)]">
          Stop staffing by instinct.<br />
          <span className="text-[#3EE07F]">Start syncing</span> by intelligence.
        </h1>

        {/* subtext */}
        <p className="mb-10 max-w-[540px] text-[#7BAF8E] font-light leading-relaxed text-[clamp(15px,1.6vw,18px)]">
          SkillSync reads your project brief, scans your talent pool, and assembles
          the optimal team in seconds — not days.
        </p>

        {/* CTAs */}
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link to="/register"
            className="px-7 py-3 rounded-full text-[15px] font-semibold tracking-wide
              bg-gradient-to-r from-[#28623A] to-[#1A4D2E] text-[#F0FAF4]
              border border-[#3EE07F]/20
              hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(62,224,127,0.2)]
              transition-all duration-200">
            Start Free Trial →
          </Link>
          <Link to="/login"
            className="px-7 py-3 rounded-full text-[15px] font-medium tracking-wide
              text-[#7BAF8E] border border-[#28623A]/40
              hover:text-[#F0FAF4] hover:border-[#28623A]/70 hover:bg-[#28623A]/10
              transition-all duration-200">
            &#9655; Watch Demo 
          </Link>
        </div>

        {/* stats */}
        <div className="flex items-center gap-8 mt-10 flex-wrap justify-center">
          {[['0%','Match Accuracy'],['0','Teams Synced'],['2x','Faster Staffing']].map(([val, lbl], i) => (
            <div key={lbl} className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-[#F0FAF4] font-semibold text-[22px] leading-none">{val}</div>
                <div className="text-[#7BAF8E] text-[11px] tracking-widest uppercase mt-1">{lbl}</div>
              </div>
              {i < 2 && <div className="w-px h-8 bg-[#28623A]/40" />}
            </div>
          ))}
        </div>
      </div>

      {/* canvas frame */}
      <div className="relative z-10 w-full max-w-[860px] px-6 pb-16">
        <div className="relative rounded-2xl overflow-hidden border border-[#28623A]/30 bg-[#0F2027]/60 backdrop-blur-sm shadow-[0_24px_80px_rgba(15,32,39,0.8)]">
          {/* top bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#28623A]/20 bg-[#0F2027]/80">
            <span className="w-3 h-3 rounded-full bg-[#28623A]/60" />
            <span className="w-3 h-3 rounded-full bg-[#28623A]/40" />
            <span className="w-3 h-3 rounded-full bg-[#28623A]/20" />
            <span className="ml-3 text-[#7BAF8E] text-[11px] tracking-widest uppercase">SkillSync — Live AI Team Graph</span>
          </div>
          <canvas ref={canvasRef} className="block h-[380px] w-full" />
        </div>
        <p className="text-center text-[#7BAF8E] text-[12px] tracking-[0.15em] uppercase mt-4">
          Real-time skill graph · AI matching in progress
        </p>
      </div>

    </section>
    </div>
  )
}
