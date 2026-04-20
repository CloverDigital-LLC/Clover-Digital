// Renders og-image.png for social previews (iMessage, Slack, Twitter, etc.)
// Run with: node scripts/generate-og.mjs
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'

const W = 1200
const H = 630

const clover = (cx, cy, r, rot, fill) => `
  <g transform="rotate(${rot} ${cx} ${cy})" fill="${fill}">
    <circle cx="${cx - r * 0.55}" cy="${cy - r * 0.55}" r="${r}"/>
    <circle cx="${cx + r * 0.55}" cy="${cy - r * 0.55}" r="${r}"/>
    <circle cx="${cx - r * 0.55}" cy="${cy + r * 0.55}" r="${r}"/>
    <circle cx="${cx + r * 0.55}" cy="${cy + r * 0.55}" r="${r}"/>
  </g>`

const cloverLogo = (cx, cy, r, color, centerColor) => `
  <g>
    <ellipse cx="${cx - r * 0.6}" cy="${cy - r * 0.55}" rx="${r}" ry="${r * 1.05}" fill="${color}"/>
    <ellipse cx="${cx + r * 0.6}" cy="${cy - r * 0.55}" rx="${r}" ry="${r * 1.05}" fill="${color}"/>
    <ellipse cx="${cx - r * 0.6}" cy="${cy + r * 0.6}" rx="${r}" ry="${r * 1.05}" fill="${color}"/>
    <ellipse cx="${cx + r * 0.6}" cy="${cy + r * 0.6}" rx="${r}" ry="${r * 1.05}" fill="${color}"/>
    <circle cx="${cx}" cy="${cy}" r="${r * 0.32}" fill="${centerColor}"/>
    <path d="M ${cx} ${cy + r * 1.55} Q ${cx} ${cy + r * 2.2} ${cx + r * 0.9} ${cy + r * 2.45}"
          stroke="${color}" stroke-width="${r * 0.3}" stroke-linecap="round" fill="none"/>
  </g>`

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#C8DFEE"/>
      <stop offset="50%" stop-color="#B0D0E4"/>
      <stop offset="100%" stop-color="#A3C5D8"/>
    </linearGradient>
    <linearGradient id="hill1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a8b67"/><stop offset="100%" stop-color="#2f6b4a"/>
    </linearGradient>
    <linearGradient id="hill2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2f6b4a"/><stop offset="100%" stop-color="#1f4d35"/>
    </linearGradient>
    <linearGradient id="hill3" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1f4d35"/><stop offset="100%" stop-color="#0f2a1d"/>
    </linearGradient>
    <filter id="cloud-shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
      <feOffset dy="6" result="off"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.28"/></feComponentTransfer>
      <feComposite in2="off" operator="in" result="shadow"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>

  <!-- Clover clouds -->
  <g filter="url(#cloud-shadow)" opacity="0.96">${clover(150, 160, 42, -10, 'white')}</g>
  <g filter="url(#cloud-shadow)" opacity="0.88">${clover(1050, 140, 36, -14, 'white')}</g>
  <g filter="url(#cloud-shadow)" opacity="0.78">${clover(1100, 380, 24, -6, 'white')}</g>
  <g filter="url(#cloud-shadow)" opacity="0.78">${clover(90, 400, 22, -12, 'white')}</g>

  <!-- Hills -->
  <path d="M0 500 Q200 450 400 480 Q600 455 800 475 Q1000 450 1200 470 L1200 ${H} L0 ${H}Z"
        fill="url(#hill1)" opacity="0.55"/>
  <path d="M0 530 Q180 500 360 520 Q540 495 720 515 Q900 498 1080 525 Q1160 510 1200 525 L1200 ${H} L0 ${H}Z"
        fill="url(#hill2)" opacity="0.8"/>
  <path d="M0 560 Q160 545 320 555 Q480 540 640 553 Q800 544 960 557 Q1120 548 1200 560 L1200 ${H} L0 ${H}Z"
        fill="url(#hill3)"/>

  <!-- Wordmark — Clover in lighter green, Digital in darker. First i is dotless (ı) so a clover can sit above it as the dot. -->
  <text x="${W / 2}" y="370" text-anchor="middle"
        font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-weight="600"
        font-size="120" letter-spacing="-2">
    <tspan fill="#4a8b67">Clover </tspan><tspan fill="#0f2a1d">Dıgital</tspan>
  </text>

  <!-- Clover-as-dot above the first i in Digital (no stem) -->
  ${clover(734, 282, 12, -6, '#0f2a1d')}

  <!-- Tagline -->
  <text x="${W / 2}" y="425" text-anchor="middle"
        font-family="Helvetica, Arial, sans-serif" font-weight="500"
        font-size="28" fill="#1a1a16" letter-spacing="0.5">
    Digital Employees for Small Business
  </text>
</svg>
`.trim()

const resvg = new Resvg(svg, {
  background: 'white',
  fitTo: { mode: 'width', value: W },
  font: { loadSystemFonts: true, defaultFontFamily: 'Georgia' },
})
const pngBuffer = resvg.render().asPng()
writeFileSync(new URL('../og-image.png', import.meta.url), pngBuffer)
console.log(`wrote og-image.png (${W}x${H}, ${pngBuffer.length} bytes)`)
