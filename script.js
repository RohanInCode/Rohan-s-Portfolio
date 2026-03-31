/* =========================================
   PREMIUM CURSOR SYSTEM
   ========================================= */
const cursorEl     = document.getElementById('cursor');
const cursorRing   = document.getElementById('cursorRing');
const trailContainer = document.getElementById('cursorTrail');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;
const LERP = 0.10; // ring lag factor (lower = more lag)

/* -- Move cursor dot instantly -- */
document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  /* position the dot exactly on cursor */
  cursorEl.style.left = mouseX + 'px';
  cursorEl.style.top  = mouseY + 'px';

  /* spawn a trail particle every ~3 moves */
  if (Math.random() > 0.55) spawnTrail(mouseX, mouseY);

  /* detect what's under cursor for state classes */
  const el = document.elementFromPoint(mouseX, mouseY);
  if (el) {
    const isInteractive = el.closest('a, button, [role="button"], .cert-filter-btn, .skill-cat-btn, .btn, .overlay-btn, .cert-btn, .nav-link, .nav-toggle, .tech-tile, .social-float-btn, .footer-social-btn');
    const isText = !isInteractive && el.closest('p, h1, h2, h3, h4, h5, span, li, label');
    document.body.classList.toggle('cursor-hover', !!isInteractive);
    document.body.classList.toggle('cursor-text',  !!isText && !isInteractive);
  }
});

/* -- Smooth ring follows with lerp -- */
function animateRing() {
  ringX += (mouseX - ringX) * LERP;
  ringY += (mouseY - ringY) * LERP;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
}
animateRing();

/* -- Trail particles -- */
const TRAIL_COLORS = [
  'rgba(192,132,252,0.55)',
  'rgba(139,92,246,0.45)',
  'rgba(167,139,250,0.4)',
  'rgba(196,181,253,0.35)',
  'rgba(109,40,217,0.4)',
];
function spawnTrail(x, y) {
  const p = document.createElement('div');
  p.className = 'trail-particle';
  const size = Math.random() * 5 + 2;
  p.style.cssText = `
    left: ${x}px;
    top: ${y}px;
    width: ${size}px;
    height: ${size}px;
    background: ${TRAIL_COLORS[Math.floor(Math.random() * TRAIL_COLORS.length)]};
    animation-duration: ${0.5 + Math.random() * 0.4}s;
  `;
  trailContainer.appendChild(p);
  setTimeout(() => p.remove(), 900);
}

/* -- Click burst ring -- */
document.addEventListener('click', (e) => {
  const burst = document.createElement('div');
  burst.className = 'click-burst';
  burst.style.left = e.clientX + 'px';
  burst.style.top  = e.clientY + 'px';
  document.body.appendChild(burst);

  /* second slightly delayed burst */
  setTimeout(() => {
    const burst2 = document.createElement('div');
    burst2.className = 'click-burst';
    burst2.style.cssText = `left:${e.clientX}px; top:${e.clientY}px; animation-duration:0.65s; border-color:rgba(139,92,246,0.5); width:10px; height:10px;`;
    document.body.appendChild(burst2);
    setTimeout(() => burst2.remove(), 700);
  }, 80);

  setTimeout(() => burst.remove(), 550);
});

/* -- Hide cursor when leaving window -- */
document.addEventListener('mouseleave', () => {
  cursorEl.style.opacity  = '0';
  cursorRing.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  cursorEl.style.opacity  = '1';
  cursorRing.style.opacity = '1';
});

/* ---------- PARTICLE CANVAS ---------- */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.3;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = (Math.random() - 0.5) * 0.4;
    this.alpha = Math.random() * 0.6 + 0.1;
    const colors = ['139,92,246', '109,40,217', '26,58,110', '167,139,250', '34,211,238'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.life = 0;
    this.maxLife = Math.random() * 300 + 200;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life++;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height || this.life > this.maxLife) {
      this.reset();
    }
  }
  draw() {
    ctx.save();
    const fade = this.life < 30 ? this.life / 30 : this.life > this.maxLife - 30 ? (this.maxLife - this.life) / 30 : 1;
    ctx.globalAlpha = this.alpha * fade;
    ctx.fillStyle = `rgba(${this.color}, 1)`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(${this.color}, 0.6)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Connection lines between nearby particles
function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        ctx.save();
        ctx.globalAlpha = (1 - dist / 120) * 0.08;
        ctx.strokeStyle = `rgba(139, 92, 246, 1)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

function initParticles() {
  const count = Math.min(120, Math.floor(window.innerWidth / 14));
  particles = Array.from({ length: count }, () => new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => { p.update(); p.draw(); });
  drawConnections();
  animationId = requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

/* ---------- NAVBAR ---------- */
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const spans = navToggle.querySelectorAll('span');
  if (navLinks.classList.contains('open')) {
    spans[0].style.transform = 'translateY(7px) rotate(45deg)';
    spans[1].style.opacity = '0';
    spans[2].style.transform = 'translateY(-7px) rotate(-45deg)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close nav on link click
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ---------- ACTIVE NAV ON SCROLL ---------- */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinkEls.forEach(link => link.classList.remove('active'));
      const activeLink = document.querySelector(`.nav-link[data-section="${entry.target.id}"]`);
      if (activeLink) activeLink.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

sections.forEach(s => sectionObserver.observe(s));

/* ---------- TYPEWRITER ---------- */
const roles = ['Aspiring Cybersecurity Analyst 🔐', 'Web Developer 💻', 'Digital Forensics Explorer 🔍', 'Python & Django Dev', 'Incident Response Learner 🛡️', 'React Enthusiast', 'Problem Solver 🚀'];
const roleEl = document.getElementById('roleDynamic');
let roleIdx = 0, charIdx = 0, isDeleting = false;

function typeRole() {
  const current = roles[roleIdx];
  if (!isDeleting) {
    roleEl.textContent = current.substring(0, charIdx + 1);
    charIdx++;
    if (charIdx === current.length) {
      setTimeout(() => { isDeleting = true; typeRole(); }, 2200);
      return;
    }
  } else {
    roleEl.textContent = current.substring(0, charIdx - 1);
    charIdx--;
    if (charIdx === 0) {
      isDeleting = false;
      roleIdx = (roleIdx + 1) % roles.length;
    }
  }
  const speed = isDeleting ? 45 : 80;
  setTimeout(typeRole, speed);
}
typeRole();

/* ---------- COUNTER ANIMATION ---------- */
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-count'));
  let current = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { el.textContent = target; clearInterval(timer); }
    else { el.textContent = Math.floor(current); }
  }, 25);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('[data-count]').forEach(animateCounter);
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObserver.observe(heroStats);

/* ---------- SCROLL HIDE INDICATOR ---------- */
const scrollIndicator = document.getElementById('scrollIndicator');
window.addEventListener('scroll', () => {
  if (scrollIndicator) scrollIndicator.style.opacity = window.scrollY > 80 ? '0' : '1';
});

/* ---------- AOS (Animate On Scroll) ---------- */
const aosElements = document.querySelectorAll('[data-aos]');
const aosDelay = { 0: 0, 1: 100, 2: 200, 3: 300 };

const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.classList.add('aos-animate');
      }, (entry.target.dataset.aosDelay || 0));
      aosObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

aosElements.forEach((el, i) => aosObserver.observe(el));

/* ---------- SUPABASE SETUP ---------- */
const { createClient } = window.supabase;
const db = createClient(
  'https://axtwdgallicnkqrrzeng.supabase.co',
  'sb_publishable_XFpvk_AC8rHRciCKl6zMFQ_3AZI17gy'
);

/* ---------- CONTACT FORM ---------- */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');
const formSubmit = document.getElementById('formSubmit');

if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect form values
    const name    = document.getElementById('formName').value.trim();
    const email   = document.getElementById('formEmail').value.trim();
    const subject = document.getElementById('formSubject').value.trim();
    const message = document.getElementById('formMsg').value.trim();

    // Show sending state
    const originalHTML = formSubmit.innerHTML;
    formSubmit.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Sending...</span>';
    formSubmit.disabled = true;

    try {
      const { error } = await db
        .from('messages')
        .insert([{ name, email, subject, message }]);

      if (error) throw error;

      // Success!
      formSuccess.innerHTML = '✅ Message sent! I\'ll get back to you soon.';
      formSuccess.style.color = '#4ade80';
      formSuccess.classList.add('show');
      contactForm.reset();
      setTimeout(() => formSuccess.classList.remove('show'), 5000);

    } catch (err) {
      console.error('Supabase error:', err);
      formSuccess.innerHTML = '❌ Something went wrong. Please email me directly.';
      formSuccess.style.color = '#f87171';
      formSuccess.classList.add('show');
      setTimeout(() => formSuccess.classList.remove('show'), 5000);
    } finally {
      formSubmit.innerHTML = originalHTML;
      formSubmit.disabled = false;
    }
  });
}

/* ---------- PARALLAX HERO ---------- */
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const heroBg = document.querySelector('.hero-bg-image');
  if (heroBg) heroBg.style.transform = `translateY(${scrollY * 0.3}px)`;
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) heroContent.style.transform = `translateY(${scrollY * 0.08}px)`;
});

/* ---------- HOVER GLOW EFFECT ---------- */
document.querySelectorAll('.project-card, .tech-group, .timeline-card, .contact-card').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.background = `radial-gradient(220px circle at ${x}px ${y}px, rgba(109,40,217,0.07), transparent 55%), ${el.classList.contains('tech-group') ? 'rgba(255,255,255,0.02)' : 'var(--gradient-card)'}`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.background = '';
  });
});

/* ---------- SMOOTH SCROLL ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ---------- CV DOWNLOAD ---------- */
// Handled natively by HTML anchor tag now.

// Keyframe injection for skill filter animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);

/* ---------- CERTIFICATE FILTER ---------- */
const certFilterBtns = document.querySelectorAll('.cert-filter-btn');
const certCards = document.querySelectorAll('.cert-card');

certFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    certFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.getAttribute('data-filter');
    certCards.forEach(card => {
      const cardCat = card.getAttribute('data-cert');
      if (filter === 'all' || cardCat === filter) {
        card.classList.remove('cert-hidden');
        card.style.animation = 'none';
        requestAnimationFrame(() => {
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        });
      } else {
        card.classList.add('cert-hidden');
      }
    });
  });
});

/* ---------- HOVER GLOW (extend to cert cards) ---------- */
document.querySelectorAll('.cert-card').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.background = `radial-gradient(180px circle at ${x}px ${y}px, rgba(109,40,217,0.08), transparent 50%), var(--dark-2)`;
  });
  el.addEventListener('mouseleave', () => { el.style.background = ''; });
});

console.log('%c Portfolio Loaded 🚀', 'color: #8b5cf6; font-size: 20px; font-weight: bold;');
