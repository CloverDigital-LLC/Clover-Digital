import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const customStyles = {
  body: {
    backgroundColor: '#F9F6F0',
    color: '#4A5548',
    overflowX: 'hidden',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  textureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: 1,
    opacity: 0.03,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  },
  sunGlow: {
    position: 'absolute',
    top: '5%',
    left: '15%',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(249, 246, 240, 0.4) 0%, rgba(249, 246, 240, 0) 60%)',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 2,
  },
  reveal: {
    opacity: 0,
    transform: 'translateY(40px)',
    transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  revealActive: {
    opacity: 1,
    transform: 'translateY(0)',
  },
};

const useReveal = () => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
      setIsVisible(true);
    }
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

const RevealDiv = ({ children, className, style, delay = 0 }) => {
  const { ref, isVisible } = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...customStyles.reveal,
        ...(isVisible ? customStyles.revealActive : {}),
        transitionDelay: `${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Nav = ({ onGetStarted, onSeeHow }) => {
  return (
    <nav className="absolute top-0 w-full z-50 px-6 py-8 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3 text-prairie group cursor-pointer" style={{ color: '#2C3E2D' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors duration-300" style={{ color: '#2C3E2D' }}>
            <path d="M12 22V8" />
            <path d="m8 12 4-4 4 4" />
            <path d="M12 2a3 3 0 0 0-3 3v2a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          </svg>
          <span className="font-serif text-2xl font-semibold tracking-tight">Prairie Digital</span>
        </div>
        <div className="hidden md:flex gap-10 items-center font-medium text-lg" style={{ color: 'rgba(44,62,45,0.9)' }}>
          <a href="#how-it-works" className="hover:text-yellow-600 transition-colors duration-200" style={{ color: 'rgba(44,62,45,0.9)' }}>How it works</a>
          <a href="#capabilities" className="hover:text-yellow-600 transition-colors duration-200" style={{ color: 'rgba(44,62,45,0.9)' }}>Capabilities</a>
          <a href="#faq" className="hover:text-yellow-600 transition-colors duration-200" style={{ color: 'rgba(44,62,45,0.9)' }}>FAQ</a>
          <button
            onClick={onGetStarted}
            className="text-white px-7 py-2.5 rounded-full hover:-translate-y-0.5 transition-all duration-300"
            style={{ backgroundColor: '#D4AF37', boxShadow: '0 10px 40px -10px rgba(212, 175, 55, 0.2)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B8962B'; e.currentTarget.style.boxShadow = '0 20px 50px -15px rgba(212, 175, 55, 0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(212, 175, 55, 0.2)'; }}
          >
            Get Started
          </button>
        </div>
      </div>
    </nav>
  );
};

const HeroSection = ({ onGetStarted, onSeeHow }) => {
  return (
    <section className="relative overflow-hidden flex flex-col justify-center" style={{ height: '110vh', minHeight: '850px', width: '100%', backgroundColor: '#9BBED8' }}>
      <div style={customStyles.textureOverlay}></div>
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to bottom, #9BBED8, #A8C8DD, #c5d8e2)' }}></div>
      <div style={customStyles.sunGlow}></div>

      <svg className="absolute top-[10%] w-full h-[400px] z-10" style={{ pointerEvents: 'none' }}>
        <g style={{ animation: 'cloudFloat 140s linear infinite', animationDelay: '-30s' }}>
          <path d="M130,100 Q150,70 180,90 Q210,60 250,80 Q280,70 290,100 Q320,110 300,140 Q310,170 270,160 Q240,180 200,150 Q160,180 130,150 Q100,150 110,120 Q90,90 130,100 Z" fill="#FAFAF7" opacity="0.85" />
        </g>
        <g style={{ animation: 'cloudFloat 200s linear infinite', animationDelay: '-90s' }}>
          <path d="M730,150 Q750,120 780,140 Q810,110 850,130 Q880,120 890,150 Q920,160 900,190 Q910,220 870,210 Q840,230 800,200 Q760,230 730,200 Q700,200 710,170 Q690,140 730,150 Z" fill="#FAFAF7" opacity="0.85" transform="scale(0.8) translate(200, -50)" />
        </g>
        <g style={{ animation: 'cloudFloat 170s linear infinite', animationDelay: '-10s' }}>
          <path d="M1130,80 Q1150,50 1180,70 Q1210,40 1250,60 Q1280,50 1290,80 Q1320,90 1300,120 Q1310,150 1270,140 Q1240,160 1200,130 Q1160,160 1130,130 Q1100,130 1110,100 Q1090,70 1130,80 Z" fill="#FAFAF7" opacity="0.85" transform="scale(0.6) translate(600, 100)" />
        </g>
      </svg>

      <div className="absolute bottom-0 left-0 w-full z-20 flex items-end" style={{ height: '65vh' }}>
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 500">
          <defs>
            <linearGradient id="backHillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#9BC49C', stopOpacity: 0.6 }} />
              <stop offset="100%" style={{ stopColor: '#7ba381', stopOpacity: 0.85 }} />
            </linearGradient>
            <linearGradient id="midHillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#7ba381', stopOpacity: 0.95 }} />
              <stop offset="100%" style={{ stopColor: '#5A8A5F', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="frontHillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#5A8A5F', stopOpacity: 1 }} />
              <stop offset="60%" style={{ stopColor: '#6b8f71', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#EEF2EC', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path d="M0,500 L0,300 C200,260 400,340 600,280 C800,220 1000,300 1200,260 C1320,230 1380,280 1440,270 L1440,500 Z" fill="url(#backHillGrad)" />
          <path d="M0,500 L0,340 C240,300 480,380 720,320 C960,260 1200,340 1440,300 L1440,500 Z" fill="url(#midHillGrad)" />
          <path d="M0,500 L0,400 C360,360 720,420 1080,360 C1260,330 1380,380 1440,390 L1440,500 Z" fill="url(#frontHillGrad)" />
        </svg>
      </div>

      <div className="relative z-30 max-w-5xl mx-auto px-6 text-center" style={{ marginTop: '-10vh' }}>
        <RevealDiv>
          <span className="inline-block py-1.5 px-4 rounded-full text-sm font-semibold tracking-widest uppercase mb-6 backdrop-blur-sm border" style={{ backgroundColor: 'rgba(44,62,45,0.05)', borderColor: 'rgba(44,62,45,0.1)', color: '#2C3E2D' }}>
            A new kind of workforce
          </span>
        </RevealDiv>
        <RevealDiv delay={100}>
          <h1 className="font-serif text-6xl md:text-[5.5rem] font-medium leading-[1.1] mb-8 drop-shadow-sm tracking-tight" style={{ color: '#2C3E2D' }}>
            Your new best employee <br className="hidden md:block" />doesn't sleep.
          </h1>
        </RevealDiv>
        <RevealDiv delay={200}>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed" style={{ color: 'rgba(44,62,45,0.8)' }}>
            Digital employees that run entire workflows across your business. From operations and client management to the tasks you haven't had time to think about yet.
          </p>
        </RevealDiv>
        <RevealDiv delay={300}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto text-white px-9 py-4 rounded-full text-lg font-semibold hover:-translate-y-1 transition-all duration-300"
              style={{ backgroundColor: '#D4AF37', boxShadow: '0 10px 40px -10px rgba(212, 175, 55, 0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B8962B'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; }}
            >
              Meet your new hire
            </button>
            <button
              onClick={onSeeHow}
              className="w-full sm:w-auto border px-9 py-4 rounded-full text-lg font-semibold backdrop-blur-md transition-all duration-300 shadow-sm"
              style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.6)', color: '#2C3E2D' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.4)'; }}
            >
              See how it works
            </button>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
};

const QuoteSection = () => {
  return (
    <section className="py-20 md:py-32 px-6 relative z-30 -mt-10" style={{ backgroundColor: '#EEF2EC' }}>
      <RevealDiv className="max-w-4xl mx-auto text-center">
        <svg className="w-12 h-12 mx-auto mb-8 opacity-80" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7ba381" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <h2 className="font-serif text-3xl md:text-[2.75rem] leading-tight md:leading-snug font-medium" style={{ color: '#2C3E2D' }}>
          "We believe small businesses deserve the same operational power as the giants. Without the headache."
        </h2>
      </RevealDiv>
    </section>
  );
};

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 md:py-32 px-6 border-t" style={{ backgroundColor: '#F9F6F0', borderColor: 'rgba(222,230,220,0.5)' }}>
      <div className="max-w-7xl mx-auto">
        <RevealDiv className="text-center mb-20">
          <span className="font-bold tracking-widest uppercase text-sm mb-4 block" style={{ color: '#8B7355' }}>The Process</span>
          <h2 className="font-serif text-4xl md:text-5xl mb-6" style={{ color: '#2C3E2D' }}>Simple to hire. Easier to manage.</h2>
          <p className="text-xl max-w-2xl mx-auto font-light leading-relaxed" style={{ color: '#4A5548' }}>Getting started with a digital employee doesn't require an IT degree. We handle the heavy lifting.</p>
        </RevealDiv>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          <div className="hidden md:block absolute top-[45px] left-[15%] right-[15%] h-[2px] z-0" style={{ backgroundColor: '#DEE6DC' }}></div>

          <RevealDiv className="relative z-10 bg-white rounded-[2rem] p-10 border hover:-translate-y-1.5 transition-all duration-300 cursor-default" style={{ boxShadow: '0 10px 40px -10px rgba(44, 62, 45, 0.08)', borderColor: 'rgba(238,242,236,0.5)' }} delay={0}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm mx-auto md:mx-0 border-2" style={{ backgroundColor: '#F9F6F0', borderColor: '#DEE6DC', transform: 'rotate(-3deg)' }}>
              <span className="font-serif text-2xl font-bold" style={{ color: '#8B7355' }}>1</span>
            </div>
            <h3 className="font-serif text-2xl mb-4 text-center md:text-left" style={{ color: '#2C3E2D' }}>The Introduction</h3>
            <p className="leading-relaxed text-lg text-center md:text-left" style={{ color: '#4A5548' }}>We sit down with you to learn exactly how your business operates, what tasks are slowing you down, and importantly, your brand's unique tone of voice.</p>
          </RevealDiv>

          <RevealDiv className="relative z-10 bg-white rounded-[2rem] p-10 border hover:-translate-y-1.5 transition-all duration-300 cursor-default" style={{ boxShadow: '0 10px 40px -10px rgba(44, 62, 45, 0.08)', borderColor: 'rgba(238,242,236,0.5)' }} delay={150}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm mx-auto md:mx-0 border-2" style={{ backgroundColor: 'rgba(212,175,55,0.1)', borderColor: 'rgba(212,175,55,0.2)', transform: 'rotate(3deg)' }}>
              <span className="font-serif text-2xl font-bold" style={{ color: '#B8962B' }}>2</span>
            </div>
            <h3 className="font-serif text-2xl mb-4 text-center md:text-left" style={{ color: '#2C3E2D' }}>The Training</h3>
            <p className="leading-relaxed text-lg text-center md:text-left" style={{ color: '#4A5548' }}>Our engineers build and train your digital employee on your specific pricing models, calendar availability, FAQs, and internal processes behind the scenes.</p>
          </RevealDiv>

          <RevealDiv className="relative z-10 bg-white rounded-[2rem] p-10 border hover:-translate-y-1.5 transition-all duration-300 cursor-default" style={{ boxShadow: '0 10px 40px -10px rgba(44, 62, 45, 0.08)', borderColor: 'rgba(238,242,236,0.5)' }} delay={300}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-sm mx-auto md:mx-0 border-2" style={{ backgroundColor: 'rgba(123,163,129,0.1)', borderColor: 'rgba(123,163,129,0.2)', transform: 'rotate(-3deg)' }}>
              <span className="font-serif text-2xl font-bold" style={{ color: '#587a5e' }}>3</span>
            </div>
            <h3 className="font-serif text-2xl mb-4 text-center md:text-left" style={{ color: '#2C3E2D' }}>First Day on Job</h3>
            <p className="leading-relaxed text-lg text-center md:text-left" style={{ color: '#4A5548' }}>Your new hire goes live. They seamlessly start answering emails, taking phone calls, booking appointments, and organizing data without needing a coffee break.</p>
          </RevealDiv>
        </div>
      </div>
    </section>
  );
};

const CapabilitiesSection = () => {
  const capabilities = [
    {
      icon: (
        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      iconBg: 'rgba(212,175,55,0.2)',
      title: 'Operations Management',
      description: 'Runs your daily operations end to end. Manages schedules, coordinates between teams, tracks deadlines, and makes sure nothing falls through the cracks.',
      delay: 0,
    },
    {
      icon: (
        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#A8D4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      iconBg: 'rgba(123,163,129,0.3)',
      title: 'Client Relationship Management',
      description: 'Builds and maintains client relationships at scale. Remembers every detail, follows up at the right time, and keeps your clients feeling like your only client.',
      delay: 100,
    },
    {
      icon: (
        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      iconBg: 'rgba(212,175,55,0.2)',
      title: 'Business Development',
      description: 'Works your pipeline from first touch to close. Qualifies opportunities, nurtures prospects, prepares proposals, and keeps your revenue engine running.',
      delay: 200,
    },
    {
      icon: (
        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#A8D4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
      iconBg: 'rgba(123,163,129,0.3)',
      title: 'Administrative Operations',
      description: 'Handles the back-office work that eats your week. Communications, document management, vendor coordination, compliance tracking, and reporting.',
      delay: 300,
    },
    {
      icon: (
        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      ),
      iconBg: 'rgba(212,175,55,0.2)',
      title: 'Financial Operations',
      description: 'Manages invoicing, expense tracking, payment follow-ups, and financial reporting. Keeps your books organized and your cash flow visible.',
      delay: 400,
    },
    {
      icon: (
        <svg className="w-7 h-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#A8D4A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      iconBg: 'rgba(123,163,129,0.3)',
      title: 'Process Automation',
      description: 'Takes your most time-consuming multi-step processes and runs them flawlessly. The workflows unique to your business that no off-the-shelf software can handle.',
      delay: 500,
    },
  ];

  return (
    <section id="capabilities" className="py-24 md:py-32 px-6 relative overflow-hidden" style={{ backgroundColor: '#3A5240' }}>
      <div className="max-w-7xl mx-auto relative z-10">
        <RevealDiv className="text-center mb-20">
          <span className="font-bold tracking-widest uppercase text-sm mb-4 block" style={{ color: '#A8C8A8' }}>Capabilities</span>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">What can they do?</h2>
          <p className="text-xl max-w-2xl mx-auto font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.9)' }}>From running your day-to-day operations to managing complex client relationships, they handle the workflows that actually move your business forward.</p>
        </RevealDiv>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {capabilities.map((cap, i) => (
            <RevealDiv
              key={i}
              className="backdrop-blur-sm border rounded-[2rem] p-8 transition-all duration-300 group cursor-default"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
              delay={cap.delay}
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: cap.iconBg }}>
                {cap.icon}
              </div>
              <h3 className="font-serif text-2xl text-white mb-3">{cap.title}</h3>
              <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{cap.description}</p>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

const NotJustSoftwareSection = () => {
  const items = [
    {
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
        </svg>
      ),
      title: 'No Dashboards',
      desc: "You don't need to learn a complicated new interface. Your digital employee communicates directly with you via email or text, just like a human assistant would.",
      delay: 0,
    },
    {
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: 'Zero Setup Time',
      desc: 'Traditional software requires you to set it up. We act as your IT department, handling all the technical configuration and setup before handover.',
      delay: 150,
    },
    {
      icon: (
        <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: 'Adapts to You',
      desc: 'It seamlessly plugs into the tools you already use every day. If you use Google Workspace, ServiceTitan, or specific CRMs, your employee learns to use them too.',
      delay: 300,
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6" style={{ backgroundColor: '#F9F6F0' }}>
      <div className="max-w-7xl mx-auto">
        <RevealDiv>
          <h2 className="font-serif text-4xl md:text-5xl text-center mb-20" style={{ color: '#2C3E2D' }}>This is not just another software tool.</h2>
        </RevealDiv>
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {items.map((item, i) => (
            <RevealDiv key={i} className="text-center md:text-left" delay={item.delay}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto md:mx-0 shadow-sm border" style={{ backgroundColor: '#EEF2EC', borderColor: '#DEE6DC' }}>
                {item.icon}
              </div>
              <h3 className="font-serif text-2xl mb-4" style={{ color: '#2C3E2D' }}>{item.title}</h3>
              <p className="text-lg leading-relaxed" style={{ color: '#4A5548' }}>{item.desc}</p>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

const MathSection = () => {
  return (
    <section className="py-24 md:py-32 px-6 relative overflow-hidden" style={{ backgroundColor: '#3A5240' }}>
      <div className="max-w-6xl mx-auto relative z-10">
        <RevealDiv>
          <h2 className="font-serif text-4xl md:text-5xl text-white text-center mb-16">The math makes sense.</h2>
          <div className="backdrop-blur-sm rounded-[2.5rem] border overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
              {[
                {
                  icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
                  stat: '24/7',
                  label: 'Availability',
                  desc: 'Never calls in sick, never takes a holiday, always online.',
                },
                {
                  icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
                  stat: '$0',
                  label: 'Payroll Tax',
                  desc: 'No benefits, no office space, no complicated HR paperwork.',
                },
                {
                  icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
                  stat: '100%',
                  label: 'Reliable',
                  desc: 'Executes processes perfectly every single time, without fail.',
                },
              ].map((item, i) => (
                <div key={i} className="p-10 md:p-14 text-center flex flex-col items-center justify-center transition-colors duration-300 hover:bg-white/5 border-white/20">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                    {item.icon}
                  </div>
                  <div className="font-serif text-5xl md:text-6xl text-white font-semibold mb-3">{item.stat}</div>
                  <div className="text-xl font-medium mb-2" style={{ color: 'rgba(255,255,255,0.9)' }}>{item.label}</div>
                  <p className="leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="p-8 md:p-12 text-center relative overflow-hidden border-t" style={{ backgroundColor: '#2A4230', borderColor: 'rgba(255,255,255,0.1)' }}>
              <svg className="absolute top-4 left-4 w-16 h-16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="relative z-10 font-serif text-2xl md:text-3xl italic leading-snug max-w-3xl mx-auto" style={{ color: '#F9F6F0' }}>
                "It's like cloning my best employee, but they never ask for a vacation."
              </p>
            </div>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
};

const WhyPrairieSection = () => {
  const items = [
    {
      icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
      title: 'Human-in-the-loop monitoring',
      desc: "We don't just set it and forget it. Our dedicated team regularly monitors interactions to ensure exceptional quality and continuous improvement.",
      delay: 0,
    },
    {
      icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      title: 'Secure & Private',
      desc: 'Your data is locked down. We use enterprise-grade security and your private business information is never shared or used for anything other than serving your business.',
      delay: 150,
    },
    {
      icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>,
      title: 'Simple Pricing',
      desc: 'One flat monthly fee. No complex usage tiers, no surprise overage charges, and no hidden setup costs. Predictable costs for predictable results.',
      delay: 300,
    },
    {
      icon: <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#8B7355" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>,
      title: 'Steady Growth',
      desc: 'Your digital employee gets smarter over time. We regularly push updates to their capabilities as your business evolves and grows.',
      delay: 450,
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 relative" style={{ backgroundColor: '#F9F6F0' }}>
      <div className="max-w-7xl mx-auto">
        <RevealDiv className="text-center mb-20">
          <span className="font-bold tracking-widest uppercase text-sm mb-4 block" style={{ color: '#8B7355' }}>Why Prairie Digital</span>
          <h2 className="font-serif text-4xl md:text-5xl mb-6" style={{ color: '#2C3E2D' }}>Grounded in reality. Built for Main Street.</h2>
        </RevealDiv>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-16 lg:gap-x-20">
          {items.map((item, i) => (
            <RevealDiv key={i} className="flex gap-6 lg:gap-8" delay={item.delay}>
              <div className="flex-shrink-0 w-14 h-14 border rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: '#EEF2EC', borderColor: '#DEE6DC' }}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-serif text-2xl mb-3" style={{ color: '#2C3E2D' }}>{item.title}</h3>
                <p className="text-lg leading-relaxed" style={{ color: '#4A5548' }}>{item.desc}</p>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};


const TeamSection = () => {
  const team = [
    {
      name: 'Mason Cagnoni',
      title: 'Co-Founder',
      bio: 'Started on Wall Street at Deutsche Bank before moving into operations and ecosystem building. Currently leads a technology ecosystem where partner businesses generated over $37 million in revenue last year. Now bringing that same playbook to Main Street.',
      linkedin: 'https://www.linkedin.com/in/mason-cagnoni-18906049/',
    },
    {
      name: 'Shannon Sweeney Offen',
      title: 'Co-Founder',
      bio: 'Background in investment banking and venture. Experienced in financial strategy, deal structuring, and building businesses from the ground up.',
      linkedin: 'https://www.linkedin.com/in/shannon-sweeney-offen/',
    },
    {
      name: 'Jasper',
      title: 'Co-Founder',
      bio: 'Technical architect behind Prairie Digital\'s infrastructure. Builds the systems that make our digital employees reliable, smart, and seamlessly integrated with client operations.',
      linkedin: '#',
    },
    {
      name: 'Dan',
      title: 'Co-Founder',
      bio: 'Handles product development and client experience. Focused on making sure every digital employee we deploy actually works the way a real team member should.',
      linkedin: '#',
    },
  ];

  return (
    <section className="py-24 md:py-32 px-6 relative" style={{ backgroundColor: '#F9F6F0' }}>
      <div className="max-w-7xl mx-auto">
        <RevealDiv className="text-center mb-20">
          <span className="font-bold tracking-widest uppercase text-sm mb-4 block" style={{ color: '#8B7355' }}>Our Team</span>
          <h2 className="font-serif text-4xl md:text-5xl mb-6" style={{ color: '#2C3E2D' }}>Real people behind every digital employee.</h2>
        </RevealDiv>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
          {team.map((member, i) => (
            <RevealDiv
              key={i}
              className="bg-white rounded-[2rem] p-8 md:p-10 border transition-all duration-300 hover:-translate-y-1"
              style={{ boxShadow: '0 10px 40px -10px rgba(44, 62, 45, 0.08)', borderColor: 'rgba(238,242,236,0.5)' }}
              delay={i * 100}
            >
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-serif text-xl font-bold" style={{ backgroundColor: i % 2 === 0 ? 'rgba(212,175,55,0.15)' : 'rgba(123,163,129,0.2)', color: i % 2 === 0 ? '#B8962B' : '#587a5e' }}>
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-serif text-xl mb-0" style={{ color: '#2C3E2D' }}>{member.name}</h3>
                  <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: '#8B7355' }}>{member.title}</span>
                </div>
              </div>
              <p className="text-base leading-relaxed mb-4" style={{ color: '#4A5548' }}>{member.bio}</p>
              {member.linkedin !== '#' && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold transition-colors duration-200" style={{ color: '#8B7355' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#8B7355'; }}>
                  <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
                  </svg>
                  LinkedIn
                </a>
              )}
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

const IndustriesSection = () => {
  const industries = ['Home Services', 'Law Firms', 'Clinics & Medical', 'Real Estate', 'Boutiques', 'Creative Agencies'];
  return (
    <section className="py-16 px-6 relative overflow-hidden border-y" style={{ backgroundColor: '#2F4A35', borderColor: 'rgba(255,255,255,0.1)' }}>
      <div className="max-w-7xl mx-auto relative z-10">
        <RevealDiv>
          <h3 className="text-center text-white font-serif text-2xl md:text-3xl mb-10">Trusted by local businesses across industries</h3>
        </RevealDiv>
        <div className="flex flex-wrap justify-center gap-4 md:gap-5">
          {industries.map((ind, i) => (
            <RevealDiv key={i} delay={i * 50}>
              <div
                className="backdrop-blur-md border px-8 py-3.5 rounded-full text-white text-base font-medium tracking-wide transition-all duration-300 hover:-translate-y-0.5 shadow-sm cursor-default"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
              >
                {ind}
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

const FAQSection = () => {
  const faqs = [
    {
      q: 'Is this just another dumb chatbot?',
      a: "Not at all. Old chatbots followed rigid decision trees and frustrated customers. Our digital employees are custom-trained to understand context, nuance, and actually solve problems the way a real team member would.",
    },
    {
      q: 'How long does training take?',
      a: 'Typically 7-10 days. We do all the heavy lifting of ingesting your documentation, setting up workflows, and thoroughly testing scenarios before they ever interact with a real customer.',
    },
    {
      q: "What happens if it doesn't know the answer?",
      a: 'We design "graceful handoffs." If a request is outside its training, complex, or highly sensitive, it politely informs the customer and seamlessly routes the conversation to the right person on your team.',
    },
    {
      q: 'Will this replace my current staff?',
      a: "Think of them as a teammate, not a replacement. They handle the repetitive grunt work, data entry, and basic scheduling so your human staff can focus on high-value tasks, strategy, and building real relationships.",
    },
  ];

  return (
    <section id="faq" className="py-24 md:py-32 px-6" style={{ backgroundColor: '#F9F6F0' }}>
      <div className="max-w-4xl mx-auto">
        <RevealDiv>
          <h2 className="font-serif text-4xl md:text-5xl text-center mb-16" style={{ color: '#2C3E2D' }}>Common Questions</h2>
        </RevealDiv>
        <div className="space-y-8">
          {faqs.map((faq, i) => (
            <RevealDiv key={i} delay={i * 100}>
              <div className="bg-white rounded-3xl p-8 md:p-10 border" style={{ boxShadow: '0 10px 40px -10px rgba(44, 62, 45, 0.08)', borderColor: 'rgba(238,242,236,0.5)' }}>
                <h4 className="font-serif text-2xl mb-4 font-medium" style={{ color: '#2C3E2D' }}>{faq.q}</h4>
                <p className="text-lg leading-relaxed" style={{ color: '#4A5548' }}>{faq.a}</p>
              </div>
            </RevealDiv>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = ({ onBook }) => {
  return (
    <section className="py-28 md:py-40 px-6 text-center relative overflow-hidden" style={{ backgroundColor: '#3A5240' }}>
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(74,107,79,0.6), transparent, rgba(42,66,48,0.6))' }}></div>
      <svg className="absolute -top-40 -right-40 w-96 h-96 rotate-45 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(255,255,255,0.1)">
        <path d="M12 2L2 22h20L12 2z" />
      </svg>
      <svg className="absolute -bottom-20 -left-20 w-80 h-80 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(212,175,55,0.2)">
        <circle cx="12" cy="12" r="10" />
      </svg>
      <div className="relative z-10 max-w-3xl mx-auto">
        <RevealDiv>
          <h2 className="font-serif text-5xl md:text-6xl text-white mb-8">Ready to grow your team?</h2>
          <p className="text-xl mb-12 font-light leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.9)' }}>Book a short discovery call. We'll chat about your bottlenecks and see if a digital employee is the right fit. No pressure, no hard sell.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <button
              onClick={onBook}
              className="w-full sm:w-auto text-white px-10 py-4 rounded-full text-lg font-semibold hover:-translate-y-1 transition-all duration-300"
              style={{ backgroundColor: '#D4AF37', boxShadow: '0 10px 40px -10px rgba(212, 175, 55, 0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B8962B'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; }}
            >
              Book a 15-minute call
            </button>
          </div>
        </RevealDiv>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="pt-20 pb-10 px-6 border-t" style={{ backgroundColor: '#243325', color: 'rgba(238,242,236,0.6)', borderColor: 'rgba(255,255,255,0.05)' }}>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2 pr-0 md:pr-12">
          <div className="flex items-center gap-3 mb-6" style={{ color: '#F9F6F0' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V8" /><path d="m8 12 4-4 4 4" /><path d="M12 2a3 3 0 0 0-3 3v2a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            </svg>
            <span className="font-serif text-2xl font-semibold tracking-tight">Prairie Digital</span>
          </div>
          <p className="text-base max-w-sm leading-relaxed mb-6">Reliable digital employees for small businesses across the heartland. We handle the work so you can focus on what matters.</p>
          <div className="flex gap-4">
            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = ''; }}>
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; e.currentTarget.style.color = 'white'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = ''; }}>
              <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
            </a>
          </div>
        </div>

        <div>
          <h5 className="font-semibold mb-6 font-serif text-lg tracking-wide" style={{ color: '#F9F6F0' }}>Company</h5>
          <ul className="space-y-4 text-base">
            {['About Us', 'How it Works', 'Capabilities', 'Pricing Structure'].map((item, i) => (
              <li key={i}>
                <a
                  href={item === 'How it Works' ? '#how-it-works' : item === 'Capabilities' ? '#capabilities' : '#'}
                  className="transition-colors duration-200 block"
                  style={{ color: 'rgba(238,242,236,0.6)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#D4AF37'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,242,236,0.6)'; }}
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="font-semibold mb-6 font-serif text-lg tracking-wide" style={{ color: '#F9F6F0' }}>Contact</h5>
          <ul className="space-y-4 text-base">
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
              <a href="#" className="transition-colors" style={{ color: 'rgba(238,242,236,0.6)' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'white'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(238,242,236,0.6)'; }}>
                hello@prairie-digital.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>(217) 303-4601</span>
            </li>
            <li className="flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>Springfield, Illinois</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t pt-8 flex flex-col md:flex-row justify-between items-center text-sm" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <p>© 2026 Prairie Digital LLC. All rights reserved.</p>
        <div className="flex gap-6 mt-4 md:mt-0">
          {['Privacy Policy', 'Terms of Service'].map((item, i) => (
            <a key={i} href="#" className="transition-colors"
              onMouseEnter={e => { e.currentTarget.style.color = '#F9F6F0'; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; }}>
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(44,62,45,0.6)', backdropFilter: 'blur(4px)' }}></div>
      <div
        className="relative bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ boxShadow: '0 25px 60px -15px rgba(44,62,45,0.25)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-200"
          style={{ backgroundColor: '#EEF2EC', color: '#4A5548' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#DEE6DC'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#EEF2EC'; }}
        >
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h3 className="font-serif text-3xl mb-2" style={{ color: '#2C3E2D' }}>{title}</h3>
        {children}
      </div>
    </div>
  );
};

const GetStartedModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', business: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Get Started">
      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2EC' }}>
            <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7ba381" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="font-serif text-2xl mb-2" style={{ color: '#2C3E2D' }}>We'll be in touch!</p>
          <p className="text-lg" style={{ color: '#4A5548' }}>Thank you for reaching out. Our team will contact you within 24 hours.</p>
          <button onClick={onClose} className="mt-6 px-8 py-3 rounded-full text-white font-semibold transition-all duration-300" style={{ backgroundColor: '#D4AF37' }}>Close</button>
        </div>
      ) : (
        <>
          <p className="text-lg mb-6" style={{ color: '#4A5548' }}>Tell us a bit about yourself and we'll get back to you shortly.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'name', placeholder: 'Your Name', type: 'text' },
              { name: 'email', placeholder: 'Email Address', type: 'email' },
              { name: 'business', placeholder: 'Business Name', type: 'text' },
            ].map((field) => (
              <input
                key={field.name}
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                required
                className="w-full px-5 py-3 rounded-2xl border text-lg outline-none transition-all duration-200"
                style={{ borderColor: '#DEE6DC', backgroundColor: '#F9F6F0', color: '#2C3E2D' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7ba381'; e.currentTarget.style.backgroundColor = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#DEE6DC'; e.currentTarget.style.backgroundColor = '#F9F6F0'; }}
              />
            ))}
            <textarea
              name="message"
              placeholder="What tasks are slowing you down?"
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="w-full px-5 py-3 rounded-2xl border text-lg outline-none transition-all duration-200 resize-none"
              style={{ borderColor: '#DEE6DC', backgroundColor: '#F9F6F0', color: '#2C3E2D' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7ba381'; e.currentTarget.style.backgroundColor = 'white'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#DEE6DC'; e.currentTarget.style.backgroundColor = '#F9F6F0'; }}
            />
            <button type="submit" className="w-full py-3 rounded-full text-white text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5" style={{ backgroundColor: '#D4AF37' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B8962B'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; }}>
              Submit
            </button>
          </form>
        </>
      )}
    </Modal>
  );
};

const BookCallModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', time: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book a 15-Minute Call">
      {submitted ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EEF2EC' }}>
            <svg className="w-8 h-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7ba381" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <p className="font-serif text-2xl mb-2" style={{ color: '#2C3E2D' }}>Call Booked!</p>
          <p className="text-lg" style={{ color: '#4A5548' }}>We'll send a calendar invite to your email. Looking forward to chatting!</p>
          <button onClick={onClose} className="mt-6 px-8 py-3 rounded-full text-white font-semibold transition-all duration-300" style={{ backgroundColor: '#D4AF37' }}>Close</button>
        </div>
      ) : (
        <>
          <p className="text-lg mb-6" style={{ color: '#4A5548' }}>No pressure, no hard sell. Just a friendly chat about your business.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { name: 'name', placeholder: 'Your Name', type: 'text' },
              { name: 'email', placeholder: 'Email Address', type: 'email' },
              { name: 'phone', placeholder: 'Phone Number (optional)', type: 'tel' },
            ].map((field) => (
              <input
                key={field.name}
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                value={formData[field.name]}
                onChange={handleChange}
                required={field.name !== 'phone'}
                className="w-full px-5 py-3 rounded-2xl border text-lg outline-none transition-all duration-200"
                style={{ borderColor: '#DEE6DC', backgroundColor: '#F9F6F0', color: '#2C3E2D' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7ba381'; e.currentTarget.style.backgroundColor = 'white'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#DEE6DC'; e.currentTarget.style.backgroundColor = '#F9F6F0'; }}
              />
            ))}
            <select
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
              className="w-full px-5 py-3 rounded-2xl border text-lg outline-none transition-all duration-200"
              style={{ borderColor: '#DEE6DC', backgroundColor: '#F9F6F0', color: formData.time ? '#2C3E2D' : '#9aaa96' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7ba381'; e.currentTarget.style.backgroundColor = 'white'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#DEE6DC'; e.currentTarget.style.backgroundColor = '#F9F6F0'; }}
            >
              <option value="">Preferred Time Slot</option>
              {timeSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
            </select>
            <button type="submit" className="w-full py-3 rounded-full text-white text-lg font-semibold transition-all duration-300 hover:-translate-y-0.5" style={{ backgroundColor: '#D4AF37' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#B8962B'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#D4AF37'; }}>
              Book My Call
            </button>
          </form>
        </>
      )}
    </Modal>
  );
};

const HomePage = () => {
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [showBookCall, setShowBookCall] = useState(false);

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ backgroundColor: '#F9F6F0', color: '#4A5548' }}>
      <Nav onGetStarted={() => setShowGetStarted(true)} />
      <HeroSection onGetStarted={() => setShowGetStarted(true)} onSeeHow={scrollToHowItWorks} />
      <QuoteSection />
      <HowItWorksSection />
      <CapabilitiesSection />
      <NotJustSoftwareSection />
      <MathSection />
      <WhyPrairieSection />
      <TeamSection />
      <IndustriesSection />
      <FAQSection />
      <CTASection onBook={() => setShowBookCall(true)} />
      <Footer />
      <GetStartedModal isOpen={showGetStarted} onClose={() => setShowGetStarted(false)} />
      <BookCallModal isOpen={showBookCall} onClose={() => setShowBookCall(false)} />
    </div>
  );
};

const App = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Nunito:wght@300;400;500;600;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; font-family: 'Nunito', sans-serif; }
      .font-serif { font-family: 'Lora', serif; }
      .font-sans { font-family: 'Nunito', sans-serif; }
      ::selection { background-color: #D4AF37; color: white; }
      @keyframes cloudFloat {
        from { transform: translateX(-150px); }
        to { transform: translateX(calc(100vw + 150px)); }
      }
      html { scroll-behavior: smooth; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Router basename="/">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;