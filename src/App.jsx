import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el) } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function RevealDiv({ className = '', delay = 0, children, as: Tag = 'div' }) {
  const ref = useReveal()
  const cls = ['reveal', delay ? `reveal-delay-${delay}` : '', className].filter(Boolean).join(' ')
  return <Tag ref={ref} className={cls}>{children}</Tag>
}

/* ── FAQ Item ── */
function FaqItem({ question, answer, isOpen, onToggle, delay }) {
  const answerRef = useRef(null)
  return (
    <RevealDiv className={`faq-item${isOpen ? ' open' : ''}`} delay={delay}>
      <button className="faq-question" onClick={onToggle}>
        <span>{question}</span>
        <span className="faq-icon">+</span>
      </button>
      <div className="faq-answer" ref={answerRef} style={{ maxHeight: isOpen ? answerRef.current?.scrollHeight + 'px' : '0' }}>
        <div className="faq-answer-inner">{answer}</div>
      </div>
    </RevealDiv>
  )
}

/* ── HomePage ── */
function HomePage() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [capSlide, setCapSlide] = useState(0)
  const capCarouselRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile optimizations injected via JS to bypass Vite/Lightning CSS stripping
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @media (max-width: 767px) {
        .how-it-works, .capabilities, .why-us, .faq, .cta { padding: 64px 0 72px; }
        .stats { padding: 56px 0; }
        .testimonial { padding: 56px 0 64px; }
        .trust { padding: 40px 0 56px; }
        .footer { padding: 48px 0 32px; }
        .steps-grid, .cap-grid-desktop, .why-grid { margin-top: 36px; }
        .stats-header, .faq-header { margin-bottom: 36px; }
        .hero { min-height: calc(100vh + env(safe-area-inset-bottom)); min-height: calc(100dvh + env(safe-area-inset-bottom)); padding-bottom: env(safe-area-inset-bottom); }
        .hero h1 em { display: block; }
        .hero-content { padding: 40px 20px 0; }
        .hero-sub { margin-bottom: 32px; }
        .hero-actions { flex-direction: column; align-items: center; gap: 12px; }
        .btn-primary, .btn-secondary { width: 100%; max-width: 320px; justify-content: center; }
        .clouds-container { height: 30%; top: 72px; }
        .cloud-1, .cloud-4 { display: none; }
        .cloud-2 { width: 100px; height: 30px; top: 30%; right: auto; left: -120px; animation: cloudDrift 25s linear infinite; opacity: 0.85; }
        .cloud-2::before { width: 50px; height: 44px; top: -24px; left: 14px; }
        .cloud-2::after { width: 62px; height: 36px; top: -18px; left: 36px; }
        .step-card { padding: 28px 24px; }
        .cap-card { padding: 24px 20px; }
        .why-card { padding: 24px 20px; }
        .stat-card { padding: 32px 20px; }
        .trust-pills { gap: 8px; }
        .trust-pill { padding: 8px 14px; font-size: 0.8125rem; }
        .faq-question { padding: 20px 0; font-size: 1rem; }
        .footer-bottom { flex-direction: column; align-items: flex-start; }
        .footer-grid { gap: 32px; }
        .quote-mark { font-size: 4rem; margin-bottom: -28px; }
        .landscape { height: 15vh; min-height: 80px; max-height: 120px; }
        .hills-desktop { display: none !important; }
        .hills-mobile { display: block !important; }
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const toggleFaq = useCallback((i) => setOpenFaq(prev => prev === i ? null : i), [])

  const faqs = [
    { q: "Is this just another dumb chatbot?", a: "Not at all. Old chatbots followed rigid decision trees and frustrated customers. Our digital employees are custom-trained to understand context, nuance, and actually solve problems the way a real team member would." },
    { q: "How long does training take?", a: "Typically 7-10 days. We do all the heavy lifting of ingesting your documentation, setting up workflows, and thoroughly testing scenarios before they ever interact with a real customer." },
    { q: "What happens if it doesn't know the answer?", a: 'We design "graceful handoffs." If a request is outside its training, complex, or highly sensitive, it politely informs the customer and seamlessly routes the conversation to the right person on your team.' },
    { q: "Will this replace my current staff?", a: "Think of them as a teammate, not a replacement. They handle the repetitive grunt work, data entry, and basic scheduling so your human staff can focus on high-value tasks, strategy, and building real relationships." },
  ]

  const capabilities = [
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>, title: 'Operations Management', desc: 'Runs your daily operations end to end. Manages schedules, coordinates between teams, tracks deadlines, and makes sure nothing falls through the cracks.' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>, title: 'Client Relationship Management', desc: 'Builds and maintains client relationships at scale. Remembers every detail, follows up at the right time, and keeps your clients feeling like your only client.' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>, title: 'Business Development', desc: 'Works your pipeline from first touch to close. Qualifies opportunities, nurtures prospects, prepares proposals, and keeps your revenue engine running.' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" /><line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" /></svg>, title: 'Administrative Operations', desc: 'Handles the back-office work that eats your week. Communications, document management, vendor coordination, compliance tracking, and reporting.' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>, title: 'Financial Operations', desc: 'Manages invoicing, expense tracking, payment follow-ups, and financial reporting. Keeps your books organized and your cash flow visible.' },
    { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></svg>, title: 'Process Automation', desc: 'Takes your most time-consuming multi-step processes and runs them flawlessly. The workflows unique to your business that no off-the-shelf software can handle.' },
  ]

  useEffect(() => {
    const el = capCarouselRef.current
    if (!el) return
    let startX = 0
    let startY = 0
    const onStart = (e) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY }
    const onEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx < 0) setCapSlide(s => Math.min(5, s + 1))
        else setCapSlide(s => Math.max(0, s - 1))
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  }, [])

  return (
    <>
      {/* NAV */}
      <nav className={`nav${navScrolled ? ' scrolled' : ''}`}>
        <div className="nav-inner">
          <a href="#" className="nav-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#2C3E2D" strokeWidth="2" fill="none" />
              <path d="M8 18 C8 18, 10 10, 14 10 C18 10, 20 18, 20 18" stroke="#2C3E2D" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M11 16 C11 16, 12 12, 14 12 C16 12, 17 16, 17 16" stroke="#4A6B4E" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <circle cx="14" cy="8" r="1.5" fill="#D4AF37" />
            </svg>
            Prairie Digital
          </a>
          <ul className="nav-links">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#capabilities">Capabilities</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#cta" className="nav-cta">Get Started</a></li>
          </ul>
          <button className="nav-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`mobile-menu${mobileOpen ? ' open' : ''}`}>
        <a href="#how-it-works" onClick={closeMobile}>How it works</a>
        <a href="#capabilities" onClick={closeMobile}>Capabilities</a>
        <a href="#faq" onClick={closeMobile}>FAQ</a>
        <a href="#cta" onClick={closeMobile}>Get Started</a>
      </div>

      <main>
      {/* HERO */}
      <section className="hero">
        <div className="clouds-container">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-4"></div>
        </div>
        <div className="landscape">
          {/* Desktop hills */}
          <svg className="hills-desktop" viewBox="0 0 1440 200" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5A8F62" /><stop offset="100%" stopColor="#3A6B42" /></linearGradient>
              <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4A7B52" /><stop offset="100%" stopColor="#2C5A34" /></linearGradient>
              <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3A6843" /><stop offset="100%" stopColor="#2C3E2D" /></linearGradient>
            </defs>
            <path d="M0 120 Q200 80 400 110 Q600 85 800 105 Q1000 80 1200 100 Q1350 85 1440 110 L1440 200 L0 200Z" fill="url(#hill1)" opacity="0.5" />
            <path d="M0 145 Q180 110 360 135 Q540 105 720 130 Q900 110 1080 140 Q1260 120 1440 145 L1440 200 L0 200Z" fill="url(#hill2)" opacity="0.7" />
            <path d="M0 165 Q160 145 320 158 Q480 140 640 155 Q800 145 960 160 Q1120 148 1280 158 Q1380 150 1440 165 L1440 200 L0 200Z" fill="url(#hill3)" />
          </svg>
          {/* Mobile hills - proportioned for narrow screens, gentle rolling curves */}
          <svg className="hills-mobile" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="mhill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5A8F62" /><stop offset="100%" stopColor="#3A6B42" /></linearGradient>
              <linearGradient id="mhill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4A7B52" /><stop offset="100%" stopColor="#2C5A34" /></linearGradient>
              <linearGradient id="mhill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3A6843" /><stop offset="100%" stopColor="#2C3E2D" /></linearGradient>
            </defs>
            <path d="M0 30 Q60 22 120 28 Q200 20 280 27 Q350 22 400 30 L400 60 L0 60Z" fill="url(#mhill1)" opacity="0.5" />
            <path d="M0 38 Q50 30 130 36 Q210 28 290 35 Q360 30 400 38 L400 60 L0 60Z" fill="url(#mhill2)" opacity="0.7" />
            <path d="M0 45 Q70 40 150 43 Q230 38 310 42 Q370 40 400 45 L400 60 L0 60Z" fill="url(#mhill3)" />
          </svg>
        </div>
        <div className="hero-content">

          <RevealDiv as="h1" delay={1}>Your new best employee <em style={{color: '#ffffff'}}>doesn't sleep.</em></RevealDiv>
          <RevealDiv as="p" className="hero-sub" delay={2}>Digital employees that run entire workflows across your business. From operations and client management to the tasks you haven't had time to think about yet.</RevealDiv>
          <RevealDiv className="hero-actions" delay={3}>
            <a href="#cta" className="btn-primary">Meet your new hire <span>→</span></a>
            <a href="#how-it-works" className="btn-secondary">See how it works</a>
          </RevealDiv>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works" id="how-it-works">
        <div className="container">
          <div className="text-center">
            <RevealDiv as="span" className="section-label">The Process</RevealDiv>
            <RevealDiv as="h2" delay={1}>Simple to hire. Easier to manage.</RevealDiv>
            <RevealDiv as="p" className="section-subtitle" delay={2} style={{ margin: '16px auto 0' }}>Getting started with a digital employee doesn't require an IT degree. We handle the heavy lifting.</RevealDiv>
          </div>
          <div className="steps-grid">
            <RevealDiv className="step-card">
              <div className="step-num">1</div>
              <h3>The Introduction</h3>
              <p>We sit down with you to learn exactly how your business operates, what tasks are slowing you down, and importantly, your brand's unique tone of voice.</p>
            </RevealDiv>
            <RevealDiv className="step-card" delay={1}>
              <div className="step-num">2</div>
              <h3>The Training</h3>
              <p>Our engineers build and train your digital employee on your specific pricing models, calendar availability, FAQs, and internal processes behind the scenes.</p>
            </RevealDiv>
            <RevealDiv className="step-card" delay={2}>
              <div className="step-num">3</div>
              <h3>First Day on the Job</h3>
              <p>Your new hire goes live. They seamlessly start answering emails, taking phone calls, booking appointments, and organizing data without needing a coffee break.</p>
            </RevealDiv>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="capabilities" id="capabilities">
        <div className="wave-divider" style={{ top: '-1px', bottom: 'auto', transform: 'rotate(180deg)' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px' }}>
            <path d="M0 60 Q360 0 720 30 Q1080 60 1440 10 L1440 60Z" fill="#ffffff" />
          </svg>
        </div>
        <div className="container">
          <div className="text-center">
            <RevealDiv as="span" className="section-label section-label-light">Capabilities</RevealDiv>
            <RevealDiv as="h2" delay={1}>What can they do?</RevealDiv>
            <RevealDiv as="p" className="section-subtitle section-subtitle-light" delay={2} style={{ margin: '16px auto 0' }}>From running your day-to-day operations to managing complex client relationships, they handle the workflows that actually move your business forward.</RevealDiv>
          </div>
          {/* Desktop grid - hidden on mobile */}
          <div className="cap-grid cap-grid-desktop">
            {capabilities.map((cap, i) => (
              <RevealDiv className="cap-card" delay={i % 3} key={i}>
                <div className="icon-box icon-box-dark">{cap.icon}</div>
                <h3>{cap.title}</h3>
                <p>{cap.desc}</p>
              </RevealDiv>
            ))}
          </div>

          {/* Mobile carousel - hidden on desktop */}
          <div className="cap-carousel" ref={capCarouselRef}>
            <div className="cap-carousel-track" style={{ transform: `translateX(-${capSlide * 100}%)` }}>
              {capabilities.map((cap, i) => (
                <div className="cap-carousel-slide" key={i}>
                  <div className="cap-card">
                    <div className="icon-box icon-box-dark">{cap.icon}</div>
                    <h3>{cap.title}</h3>
                    <p>{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="cap-carousel-dots">
              {capabilities.map((_, i) => (
                <button key={i} className={`cap-dot${capSlide === i ? ' active' : ''}`} onClick={() => setCapSlide(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
            <div className="cap-carousel-nav">
              <button className="cap-nav-btn" onClick={() => setCapSlide(s => Math.max(0, s - 1))} disabled={capSlide === 0} aria-label="Previous">&#8249;</button>
              <button className="cap-nav-btn" onClick={() => setCapSlide(s => Math.min(capabilities.length - 1, s + 1))} disabled={capSlide === capabilities.length - 1} aria-label="Next">&#8250;</button>
            </div>
          </div>
        </div>
        <div className="wave-divider">
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px' }}>
            <path d="M0 0 Q360 50 720 20 Q1080 50 1440 10 L1440 60 L0 60Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* WHY US */}
      <section className="why-us">
        <div className="container">
          <div className="text-center">
            <RevealDiv as="span" className="section-label">Why Prairie Digital</RevealDiv>
            <RevealDiv as="h2" delay={1}>Grounded in reality. Built for Main Street.</RevealDiv>
          </div>
          <div className="why-grid">
            <RevealDiv className="why-card">
              <div className="icon-box icon-box-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h3>No Dashboards</h3>
              <p>You don't need to learn a complicated new interface. Your digital employee communicates directly with you via email or text, just like a human assistant would.</p>
            </RevealDiv>
            <RevealDiv className="why-card" delay={1}>
              <div className="icon-box icon-box-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3>Zero Setup Time</h3>
              <p>Traditional software requires you to set it up. We act as your IT department, handling all the technical configuration and setup before handover.</p>
            </RevealDiv>
            <RevealDiv className="why-card" delay={2}>
              <div className="icon-box icon-box-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3>Human-in-the-Loop Monitoring</h3>
              <p>We don't just set it and forget it. Our dedicated team regularly monitors interactions to ensure exceptional quality and continuous improvement.</p>
            </RevealDiv>
            <RevealDiv className="why-card" delay={1}>
              <div className="icon-box icon-box-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <h3>Secure &amp; Private</h3>
              <p>Your data is locked down. We use enterprise-grade security and your private business information is never shared or used for anything other than serving your business.</p>
            </RevealDiv>
            <RevealDiv className="why-card" delay={2}>
              <div className="icon-box icon-box-light">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2" />
                  <line x1="2" y1="10" x2="22" y2="10" />
                </svg>
              </div>
              <h3>Simple Pricing</h3>
              <p>One flat monthly fee. No complex usage tiers, no surprise overage charges, and no hidden setup costs. Predictable costs for predictable results.</p>
            </RevealDiv>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats">
        <div className="container">
          <div className="stats-header">
            <RevealDiv as="span" className="section-label">Results</RevealDiv>
            <RevealDiv as="h2" delay={1}>The math makes sense.</RevealDiv>
          </div>
          <div className="stats-grid">
            <RevealDiv className="stat-card">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Availability. Never calls in sick, never takes a holiday, always online.</div>
            </RevealDiv>
            <RevealDiv className="stat-card" delay={1}>
              <div className="stat-value">$0</div>
              <div className="stat-label">Payroll tax. No benefits, no office space, no complicated HR paperwork.</div>
            </RevealDiv>
            <RevealDiv className="stat-card" delay={2}>
              <div className="stat-value">100%</div>
              <div className="stat-label">Reliable. Executes processes perfectly every single time, without fail.</div>
            </RevealDiv>
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="testimonial">
        <div className="container">
          <RevealDiv className="testimonial-inner">
            <span className="quote-mark">{"\u201C"}</span>
            <blockquote>It's like cloning my best employee, but they never ask for a vacation.</blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">S</div>
              <div className="author-info">
                <div className="author-name">Small Business Owner</div>
                <div className="author-title">Springfield, IL</div>
              </div>
            </div>
          </RevealDiv>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust">
        <RevealDiv className="container">
          <h2 className="trust-heading">Trusted by local businesses across industries</h2>
          <div className="trust-pills">
            <a href="/for/home-services.html" className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg> Home Services
            </a>
            <a href="/for/law-firms.html" className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v18M4 8h16M6 8l-2 8h4M18 8l-2 8h4" />
                <line x1="2" y1="20" x2="22" y2="20" />
              </svg> Law Firms
            </a>
            <a href="/for/real-estate.html" className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="8" width="18" height="14" rx="1" />
                <path d="M1 8l11-6 11 6" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg> Real Estate
            </a>
            <a href="/for/creative-agencies.html" className="trust-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg> Creative Agencies
            </a>
          </div>
        </RevealDiv>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="container">
          <div className="faq-header">
            <RevealDiv as="span" className="section-label">Support</RevealDiv>
            <RevealDiv as="h2" delay={1}>Common Questions</RevealDiv>
          </div>
          <div className="faq-list">
            {faqs.map((faq, i) => (
              <FaqItem
                key={i}
                question={faq.q}
                answer={faq.a}
                isOpen={openFaq === i}
                onToggle={() => toggleFaq(i)}
                delay={i <= 3 ? i : 0}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="cta">
        <div className="container">
          <RevealDiv as="h2">Ready to grow your team?</RevealDiv>
          <RevealDiv as="p" delay={1}>Book a short discovery call. We'll chat about your bottlenecks and see if a digital employee is the right fit. No pressure, no hard sell.</RevealDiv>
          <RevealDiv delay={2}>
            <a href="mailto:hello@prairie-digital.com" className="btn-primary">Book a 15-minute call <span>→</span></a>
          </RevealDiv>
        </div>
      </section>

      {/* FOOTER */}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="13" stroke="#7BA381" strokeWidth="2" fill="none" />
                  <path d="M8 18 C8 18, 10 10, 14 10 C18 10, 20 18, 20 18" stroke="#7BA381" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <circle cx="14" cy="8" r="1.5" fill="#D4AF37" />
                </svg>
                Prairie Digital
              </div>
              <p>Reliable digital employees for small businesses across the heartland. We handle the work so you can focus on what matters.</p>
            </div>
            <div>
              <h3 className="footer-heading">Company</h3>
              <ul className="footer-links">
                <li><a href="#how-it-works">How it Works</a></li>
                <li><a href="#capabilities">Capabilities</a></li>
                <li><a href="/blog/">Blog</a></li>
                <li><a href="/blog/#industries">Industries</a></li>
              </ul>
            </div>
            <div>
              <h3 className="footer-heading">Contact</h3>
              <ul className="footer-links">
                <li><a href="mailto:hello@prairie-digital.com">hello@prairie-digital.com</a></li>
                <li><a href="tel:+12173034601">(217) 303-4601</a></li>
                <li><span style={{ fontSize: '0.875rem' }}>Springfield, Illinois</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Prairie Digital LLC. All rights reserved.</span>
            <div className="footer-legal">
              <a href="/privacy-policy.html">Privacy Policy</a>
              <a href="/terms-of-service.html">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

/* ── App with Router ── */
function App() {
  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  )
}

export default App
