import React, { useState, useEffect, useRef, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

/* ── Scroll-reveal hook ── */
function useReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el) } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return { ref, visible }
}

function RevealDiv({ className = '', delay = 0, children, as: Tag = 'div' }) {
  const { ref, visible } = useReveal()
  const cls = ['reveal', visible ? 'visible' : '', delay ? `reveal-delay-${delay}` : '', className].filter(Boolean).join(' ')
  return <Tag ref={ref} className={cls}>{children}</Tag>
}

/* ── FAQ Item ── */
function FaqItem({ question, answer, isOpen, onToggle, delay }) {
  const innerRef = useRef(null)
  return (
    <RevealDiv className={`faq-item${isOpen ? ' open' : ''}`} delay={delay}>
      <button className="faq-question" onClick={onToggle}>
        <span>{question}</span>
        <span className="faq-icon">+</span>
      </button>
      <div className="faq-answer" style={{ maxHeight: isOpen ? (innerRef.current?.offsetHeight || 200) + 'px' : '0' }}>
        <div className="faq-answer-inner" ref={innerRef}>{answer}</div>
      </div>
    </RevealDiv>
  )
}

/* ── Modal ── */
function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden' } else { document.body.style.overflow = '' }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])
  if (!isOpen) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(44,62,45,0.6)', backdropFilter: 'blur(4px)' }}></div>
      <div style={{ position: 'relative', background: '#fff', borderRadius: '2rem', padding: '40px', maxWidth: '512px', width: '100%', boxShadow: '0 25px 60px -15px rgba(44,62,45,0.25)' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '24px', right: '24px', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', backgroundColor: '#e3ede5', color: '#3a3a32', transition: 'background-color 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#c5d8cb' }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#e3ede5' }}>
          <svg style={{ width: '20px', height: '20px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.875rem', marginBottom: '8px', color: '#1a1a16' }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

/* ── Get Started Modal ── */
function GetStartedModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', business: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('https://formsubmit.co/ajax/pons@cloverdigital.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: `New Lead: ${formData.name} - ${formData.business}`, name: formData.name, email: formData.email, business: formData.business, message: formData.message || '(no message)', _template: 'table' }),
      })
    } catch (err) { /* still show success */ }
    setSubmitting(false)
    setSubmitted(true)
  }
  const inputStyle = { width: '100%', padding: '12px 20px', borderRadius: '16px', border: '1px solid #c5d8cb', fontSize: '1.0625rem', outline: 'none', transition: 'all 0.2s', backgroundColor: '#faf6ef', color: '#1a1a16', boxSizing: 'border-box', fontFamily: 'inherit' }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Get Started">
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backgroundColor: '#e3ede5' }}>
            <svg style={{ width: '32px', height: '32px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4a8b67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a16' }}>We'll be in touch!</p>
          <p style={{ fontSize: '1.0625rem', color: '#3a3a32' }}>Thank you for reaching out. Our team will contact you within 24 hours.</p>
          <button onClick={onClose} style={{ marginTop: '24px', padding: '12px 32px', borderRadius: '9999px', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', backgroundColor: '#c98b3a' }}>Close</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '1.0625rem', marginBottom: '24px', color: '#3a3a32' }}>Tell us a bit about yourself and we'll get back to you shortly.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[{ name: 'name', placeholder: 'Your Name', type: 'text' }, { name: 'email', placeholder: 'Email Address', type: 'email' }, { name: 'business', placeholder: 'Business Name', type: 'text' }].map((field) => (
              <input key={field.name} type={field.type} name={field.name} placeholder={field.placeholder} value={formData[field.name]} onChange={handleChange} required
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#4a8b67'; e.currentTarget.style.backgroundColor = 'white' }} onBlur={e => { e.currentTarget.style.borderColor = '#c5d8cb'; e.currentTarget.style.backgroundColor = '#faf6ef' }} />
            ))}
            <textarea name="message" placeholder="What tasks are slowing you down?" value={formData.message} onChange={handleChange} rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#4a8b67'; e.currentTarget.style.backgroundColor = 'white' }} onBlur={e => { e.currentTarget.style.borderColor = '#c5d8cb'; e.currentTarget.style.backgroundColor = '#faf6ef' }} />
            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', borderRadius: '9999px', color: '#fff', fontSize: '1.0625rem', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', backgroundColor: submitting ? '#a0681f' : '#c98b3a', opacity: submitting ? 0.7 : 1 }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#a0681f' }} onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#c98b3a' }}>
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </>
      )}
    </Modal>
  )
}

/* ── Book Call Modal ── */
function BookCallModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', time: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('https://formsubmit.co/ajax/pons@cloverdigital.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ _subject: `Call Request: ${formData.name} - ${formData.time}`, name: formData.name, email: formData.email, phone: formData.phone || '(not provided)', preferred_time: formData.time, _template: 'table' }),
      })
    } catch (err) { /* still show success */ }
    setSubmitting(false)
    setSubmitted(true)
  }
  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
  const inputStyle = { width: '100%', padding: '12px 20px', borderRadius: '16px', border: '1px solid #c5d8cb', fontSize: '1.0625rem', outline: 'none', transition: 'all 0.2s', backgroundColor: '#faf6ef', color: '#1a1a16', boxSizing: 'border-box', fontFamily: 'inherit' }
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book a 15-Minute Call">
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', backgroundColor: '#e3ede5' }}>
            <svg style={{ width: '32px', height: '32px' }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#4a8b67" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <p style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '8px', color: '#1a1a16' }}>Call Booked!</p>
          <p style={{ fontSize: '1.0625rem', color: '#3a3a32' }}>We'll send a calendar invite to your email. Looking forward to chatting!</p>
          <button onClick={onClose} style={{ marginTop: '24px', padding: '12px 32px', borderRadius: '9999px', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem', fontFamily: 'inherit', backgroundColor: '#c98b3a' }}>Close</button>
        </div>
      ) : (
        <>
          <p style={{ fontSize: '1.0625rem', marginBottom: '24px', color: '#3a3a32' }}>No pressure, no hard sell. Just a friendly chat about your business.</p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[{ name: 'name', placeholder: 'Your Name', type: 'text' }, { name: 'email', placeholder: 'Email Address', type: 'email' }, { name: 'phone', placeholder: 'Phone Number (optional)', type: 'tel' }].map((field) => (
              <input key={field.name} type={field.type} name={field.name} placeholder={field.placeholder} value={formData[field.name]} onChange={handleChange} required={field.name !== 'phone'}
                style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = '#4a8b67'; e.currentTarget.style.backgroundColor = 'white' }} onBlur={e => { e.currentTarget.style.borderColor = '#c5d8cb'; e.currentTarget.style.backgroundColor = '#faf6ef' }} />
            ))}
            <select name="time" value={formData.time} onChange={handleChange} required
              style={{ ...inputStyle, color: formData.time ? '#1a1a16' : '#a8a79a', appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath d=%27M6 8L1 3h10z%27 fill=%27%233a3a32%27/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#4a8b67'; e.currentTarget.style.backgroundColor = 'white' }} onBlur={e => { e.currentTarget.style.borderColor = '#c5d8cb'; e.currentTarget.style.backgroundColor = '#faf6ef' }}>
              <option value="">Preferred Time Slot</option>
              {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
            <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', borderRadius: '9999px', color: '#fff', fontSize: '1.0625rem', fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s', backgroundColor: submitting ? '#a0681f' : '#c98b3a', opacity: submitting ? 0.7 : 1 }}
              onMouseEnter={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#a0681f' }} onMouseLeave={e => { if (!submitting) e.currentTarget.style.backgroundColor = '#c98b3a' }}>
              {submitting ? 'Booking...' : 'Book My Call'}
            </button>
          </form>
        </>
      )}
    </Modal>
  )
}

/* ── Inbox Demo — animated iMessage thread ── */
const INBOX_THREAD = [
  { from: 'Karen',  isClover: false, body: "Hey — can you reschedule Mrs. Patel's Tuesday visit, send last month's invoice, and follow up with the Johnsons on their renewal?" },
  { from: 'Clover', isClover: true,  body: "On it." },
  { from: 'Clover', isClover: true,  body: "All three done.\n\n• Patel moved to Tues the 18th, 2:00 PM — confirmed by text\n• Invoice №2041 sent — $4,225 / 32.5 hrs\n• Johnson renewal email out at 2:40 PM" },
  { from: 'Karen',  isClover: false, body: "Perfect. Thank you \u{1F64F}" },
]

function InboxThread() {
  const rootRef = useRef(null)
  const [shown, setShown] = useState(0)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!inView) return
    const timers = []
    INBOX_THREAD.forEach((_, i) => {
      timers.push(setTimeout(() => setShown(s => Math.max(s, i + 1)), 700 + i * 1600))
    })
    return () => timers.forEach(clearTimeout)
  }, [inView])

  const visible = INBOX_THREAD.slice(0, shown)
  const grouped = visible.map((m, i) => {
    const next = visible[i + 1]
    const isLastOfGroup = !next || next.isClover !== m.isClover
    return { ...m, isLastOfGroup }
  })
  const nextMsg = INBOX_THREAD[shown]
  const showTyping = inView && nextMsg && nextMsg.isClover

  return (
    <div className="imsg-phone" ref={rootRef} role="region" aria-label="Example text thread with a Clover digital employee">
      <div className="imsg-screen">
        <div className="imsg-status">
          <span className="imsg-status-time">9:41</span>
          <div className="imsg-status-notch" />
          <div className="imsg-status-right">
            <svg width="17" height="11" viewBox="0 0 17 11" fill="none" aria-hidden="true">
              <rect x="0" y="3" width="3" height="5" rx="1" fill="#000"/>
              <rect x="4.5" y="2" width="3" height="7" rx="1" fill="#000"/>
              <rect x="9" y="1" width="3" height="9" rx="1" fill="#000"/>
              <rect x="13.5" y="0" width="3" height="11" rx="1" fill="#000"/>
            </svg>
            <svg width="16" height="11" viewBox="0 0 16 11" fill="none" aria-hidden="true">
              <path d="M8 2.5a9 9 0 0 1 6.36 2.64l-1.41 1.41A7 7 0 0 0 8 4.5a7 7 0 0 0-4.95 2.05L1.64 5.14A9 9 0 0 1 8 2.5z M8 6.5a5 5 0 0 1 3.54 1.46l-1.42 1.41A3 3 0 0 0 8 8.5a3 3 0 0 0-2.12.87L4.46 7.96A5 5 0 0 1 8 6.5z M8 10a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#000"/>
            </svg>
            <div className="imsg-battery">
              <div className="imsg-battery-body"><div className="imsg-battery-fill"/></div>
              <div className="imsg-battery-tip"/>
            </div>
          </div>
        </div>
        <div className="imsg-nav">
          <div className="imsg-nav-back">
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" aria-hidden="true">
              <path d="M10 2L2 10l8 8" stroke="#007AFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="imsg-nav-badge">3</span>
          </div>
          <div className="imsg-nav-contact">
            <div className="imsg-nav-avatar">
              <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
                <rect width="40" height="40" rx="20" fill="var(--green-700)"/>
                <text x="20" y="27" textAnchor="middle" fontFamily="Fraunces, Georgia, serif" fontSize="22" fill="#fff" fontStyle="italic">C</text>
              </svg>
            </div>
            <div className="imsg-nav-name">
              Clover
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none" aria-hidden="true">
                <path d="M1.5 1.5L6 6l-4.5 4.5" stroke="#8e8e93" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
          <div className="imsg-nav-right">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M17 10.5V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3.5l5 3.5V7l-5 3.5z" fill="#007AFF"/>
            </svg>
          </div>
        </div>
        <div className="imsg-timestamp"><span>Today</span> 7:12 AM</div>
        <div className="imsg-messages">
          {grouped.map((m, i) => (
            <div key={i} className={`imsg-row ${m.isClover ? 'from-them' : 'from-me'} ${m.isLastOfGroup ? 'has-tail' : ''}`}>
              <div className="imsg-bubble-wrap">
                <div className="imsg-bubble">
                  {m.body.split('\n').map((line, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && <br/>}
                      {line || '\u00A0'}
                    </React.Fragment>
                  ))}
                </div>
                {!m.isClover && i === grouped.length - 1 && shown === INBOX_THREAD.length && (
                  <div className="imsg-delivered">Delivered</div>
                )}
              </div>
            </div>
          ))}
          {showTyping && (
            <div className="imsg-row from-them has-tail">
              <div className="imsg-bubble imsg-typing" aria-label="typing">
                <span/><span/><span/>
              </div>
            </div>
          )}
        </div>
        <div className="imsg-inputbar">
          <button className="imsg-plus" aria-label="More">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="#8e8e93" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="imsg-inputfield">
            <span className="imsg-placeholder">iMessage</span>
            <button className="imsg-mic" aria-label="Dictate">
              <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
                <rect x="4" y="1" width="6" height="10" rx="3" stroke="#8e8e93" strokeWidth="1.4"/>
                <path d="M1 8a6 6 0 0 0 12 0M7 14v3" stroke="#8e8e93" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="imsg-home-indicator" />
      </div>
    </div>
  )
}

/* ── HomePage ── */
function HomePage() {
  const [navScrolled, setNavScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [capSlide, setCapSlide] = useState(0)
  const capCarouselRef = useRef(null)
  const [showGetStarted, setShowGetStarted] = useState(false)
  const [showBookCall, setShowBookCall] = useState(false)

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
        .inbox-demo { padding: 64px 0 80px; }
        .inbox-demo-frame { margin-top: 36px; }
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
        .clouds-container { height: 35%; top: 72px; }
        .cloud-4 { display: none; }
        .cloud-1 { width: 90px; top: 8%; left: 4%; opacity: 0.95; }
        .cloud-2 { width: 68px; right: auto; left: -100px; top: 22%; animation: cloudDrift 32s linear infinite; opacity: 0.9; }
        .tree-1 { width: 42px; height: 63px; left: 7%; bottom: 14%; }
        .tree-5 { width: 26px; height: 39px; left: 78%; bottom: 22%; }
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
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-label="Clover">
              <ellipse cx="17" cy="15" rx="8" ry="8.5" fill="#1f4d35" />
              <ellipse cx="31" cy="15" rx="8" ry="8.5" fill="#1f4d35" />
              <ellipse cx="17" cy="29" rx="8" ry="8.5" fill="#1f4d35" />
              <ellipse cx="31" cy="29" rx="8" ry="8.5" fill="#1f4d35" />
              <circle cx="24" cy="22" r="2.6" fill="#faf6ef" />
              <path d="M24 36 Q 24 42, 30 44" stroke="#1f4d35" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </svg>
            Clover Digital
          </a>
          <ul className="nav-links">
            <li><a href="#how-it-works">How it works</a></li>
            <li><a href="#capabilities">Capabilities</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><button onClick={() => setShowGetStarted(true)} className="nav-cta">Get Started</button></li>
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
        <button onClick={() => { closeMobile(); setShowGetStarted(true) }}>Get Started</button>
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
              <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a8b67" /><stop offset="100%" stopColor="#2f6b4a" /></linearGradient>
              <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f6b4a" /><stop offset="100%" stopColor="#1f4d35" /></linearGradient>
              <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1f4d35" /><stop offset="100%" stopColor="#0f2a1d" /></linearGradient>
            </defs>
            <path d="M0 120 Q200 80 400 110 Q600 85 800 105 Q1000 80 1200 100 Q1350 85 1440 110 L1440 200 L0 200Z" fill="url(#hill1)" opacity="0.5" />
            <path d="M0 145 Q180 110 360 135 Q540 105 720 130 Q900 110 1080 140 Q1260 120 1440 145 L1440 200 L0 200Z" fill="url(#hill2)" opacity="0.7" />
            <path d="M0 165 Q160 145 320 158 Q480 140 640 155 Q800 145 960 160 Q1120 148 1280 158 Q1380 150 1440 165 L1440 200 L0 200Z" fill="url(#hill3)" />
          </svg>
          {/* Mobile hills - proportioned for narrow screens, gentle rolling curves */}
          <svg className="hills-mobile" viewBox="0 0 400 60" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="mhill1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4a8b67" /><stop offset="100%" stopColor="#2f6b4a" /></linearGradient>
              <linearGradient id="mhill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2f6b4a" /><stop offset="100%" stopColor="#1f4d35" /></linearGradient>
              <linearGradient id="mhill3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1f4d35" /><stop offset="100%" stopColor="#0f2a1d" /></linearGradient>
            </defs>
            <path d="M0 30 Q60 22 120 28 Q200 20 280 27 Q350 22 400 30 L400 60 L0 60Z" fill="url(#mhill1)" opacity="0.5" />
            <path d="M0 38 Q50 30 130 36 Q210 28 290 35 Q360 30 400 38 L400 60 L0 60Z" fill="url(#mhill2)" opacity="0.7" />
            <path d="M0 45 Q70 40 150 43 Q230 38 310 42 Q370 40 400 45 L400 60 L0 60Z" fill="url(#mhill3)" />
          </svg>
        </div>
        <div className="foliage" aria-hidden="true">
          <div className="tree tree-1"></div>
          <div className="tree tree-5"></div>
        </div>
        <div className="hero-content">

          <RevealDiv as="h1" delay={1}>Your new best employee <em style={{color: '#ffffff'}}>doesn't sleep.</em></RevealDiv>
          <RevealDiv as="p" className="hero-sub" delay={2}>Digital employees that run entire workflows across your business. From operations and client management to the tasks you haven't had time to think about yet.</RevealDiv>
          <RevealDiv className="hero-actions" delay={3}>
            <button onClick={() => setShowGetStarted(true)} className="btn-primary">Meet your new hire <span>→</span></button>
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

      {/* INBOX DEMO */}
      <section className="inbox-demo" id="in-practice">
        <div className="container">
          <div className="text-center">
            <RevealDiv as="span" className="section-label">In Practice</RevealDiv>
            <RevealDiv as="h2" delay={1}>One text. Done by end of day.</RevealDiv>
            <RevealDiv as="p" className="section-subtitle" delay={2} style={{ margin: '16px auto 0' }}>A typical Monday morning handoff. Scheduling, invoicing, follow-up — handled the way a real team member would.</RevealDiv>
          </div>
          <RevealDiv className="inbox-demo-frame" delay={2}>
            <InboxThread />
          </RevealDiv>
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
        <div className="wave-divider" style={{ bottom: '-1px', transform: 'none' }}>
          <svg viewBox="0 0 1440 60" preserveAspectRatio="none" style={{ height: '60px' }}>
            <path d="M0 60 Q360 0 720 30 Q1080 60 1440 10 L1440 60Z" fill="#ffffff" />
          </svg>
        </div>
      </section>

      {/* WHY US */}
      <section className="why-us">
        <div className="container">
          <div className="text-center">
            <RevealDiv as="span" className="section-label">Why Clover Digital</RevealDiv>
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
            <button onClick={() => setShowBookCall(true)} className="btn-primary">Book a 15-minute call <span>→</span></button>
          </RevealDiv>
        </div>
      </section>

      <GetStartedModal isOpen={showGetStarted} onClose={() => setShowGetStarted(false)} />
      <BookCallModal isOpen={showBookCall} onClose={() => setShowBookCall(false)} />

      {/* FOOTER */}
      </main>
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <svg width="24" height="24" viewBox="0 0 48 48" fill="none" aria-label="Clover">
                  <ellipse cx="17" cy="15" rx="8" ry="8.5" fill="#a7c4b2" />
                  <ellipse cx="31" cy="15" rx="8" ry="8.5" fill="#a7c4b2" />
                  <ellipse cx="17" cy="29" rx="8" ry="8.5" fill="#a7c4b2" />
                  <ellipse cx="31" cy="29" rx="8" ry="8.5" fill="#a7c4b2" />
                  <circle cx="24" cy="22" r="2.6" fill="#0f2a1d" />
                  <path d="M24 36 Q 24 42, 30 44" stroke="#a7c4b2" strokeWidth="2.2" strokeLinecap="round" fill="none" />
                </svg>
                Clover Digital
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
                <li><a href="mailto:hello@cloverdigital.com">hello@cloverdigital.com</a></li>
                <li><a href="tel:+12173034601">(217) 303-4601</a></li>
                <li><span style={{ fontSize: '0.875rem' }}>Springfield, Illinois</span></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 Clover Digital LLC. All rights reserved.</span>
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
