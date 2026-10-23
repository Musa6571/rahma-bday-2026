const $ = s => document.querySelector(s);
const song = $('#song'), page = $('#page'), music = $('#music');
let pages = [], i = 0;

/* falling leaves */
(() => {
  const cols = ['#4f6f52', '#7a9a6b', '#8a5a3c', '#5a3a28', '#a8b99b'];
  for (let k = 0; k < 14; k++) {
    const l = document.createElement('i');
    l.className = 'leaf';
    const s = 10 + Math.random() * 12;
    l.style.cssText = `left:${Math.random() * 100}%;width:${s}px;height:${s}px;background:${cols[k % 5]};` +
      `animation-duration:${13 + Math.random() * 10}s,${3 + Math.random() * 3}s;animation-delay:${-Math.random() * 20}s,0s`;
    $('#leaves').appendChild(l);
  }
})();

/* floating doodles */
(() => {
  const em = ['🌷', '📖', '🧶', '🤎', '✨', '🌿', '🍂', '☕'];
  for (let k = 0; k < 12; k++) {
    const f = document.createElement('span');
    f.className = 'float';
    f.textContent = em[k % em.length];
    f.style.cssText = `left:${Math.random() * 100}%;font-size:${18 + Math.random() * 16}px;` +
      `animation-duration:${22 + Math.random() * 16}s,${4 + Math.random() * 3}s;animation-delay:${-Math.random() * 30}s,0s`;
    $('#leaves').appendChild(f);
  }
})();

/* sound effects (made in the browser, no files) */
let ac, sfxOn = true;
const tone = (f, d = .15, type = 'sine', v = .12, at = 0) => {
  ac = ac || new AudioContext();
  const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + d);
};
const sfx = {
  flip() {
    if (!sfxOn) return;
    ac = ac || new AudioContext();
    const n = (ac.sampleRate * .14) | 0, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
    for (let k = 0; k < n; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / n);
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = 'bandpass'; f.frequency.value = 2200; g.gain.value = .25;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(ac.destination); s.start();
  },
  pop() { if (sfxOn) { tone(520, .1, 'triangle'); tone(780, .12, 'triangle', .1, .07); } },
  good() { if (sfxOn) [660, 880, 1320].forEach((f, k) => tone(f, .3, 'sine', .12, k * .09)); },
  bad() { if (sfxOn) { tone(240, .25, 'triangle', .12); tone(190, .3, 'triangle', .12, .12); } }
};
const heart = (x, y) => {
  const h = document.createElement('span');
  h.className = 'heart';
  h.textContent = ['🤎', '💚', '✨', '🌷'][Math.random() * 4 | 0];
  h.style.left = x - 10 + 'px'; h.style.top = y - 10 + 'px';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1000);
};
document.addEventListener('click', e => heart(e.clientX, e.clientY));

/* mini quiz */
const QUIZ = [
  ['How did we end up talking?', ['A mutual friend', 'An accidental Snapchat add', 'An Instagram DM', 'Through school'], 1],
  ['Where did we first meet?', ['Holland Park', 'Westfield Stratford', 'Barking Park', 'Mayesbrook Park'], 2],
  ['Which day did our story begin?', ['The 8th', 'The 15th', 'The 1st', 'The 25th'], 1],
  ['What am I calling you in Chapter 8?', ['My favourite little weirdo', 'My favourite princess', 'My little bookworm', 'My favourite crocheter'], 0],
  ['What will I keep writing, even if you tell me to stop?', ['Poems only', 'Voice notes', 'Paragraphs', 'One-word texts'], 2]
];
let qi = 0, score = 0;
function renderQuiz(box) {
  const q = document.createElement('div');
  box.appendChild(q);
  const ask = () => {
    if (qi >= QUIZ.length) {
      q.innerHTML = `<div class="q">${score === QUIZ.length ? 'Five out of five! You know us perfectly 💚' : `You got ${score} out of ${QUIZ.length} first try. Still my favourite 🤎`}</div><button class="opt" id="again">Play again 🧶</button>`;
      q.querySelector('#again').onclick = () => { qi = 0; score = 0; ask(); };
      return;
    }
    const [text, opts, a] = QUIZ[qi];
    let miss = false;
    q.innerHTML = `<div class="q">${qi + 1} of ${QUIZ.length}: ${text}</div>` + opts.map(o => `<button class="opt">${o}</button>`).join('');
    const btns = [...q.querySelectorAll('.opt')];
    btns.forEach((b, k) => b.onclick = () => {
      if (k === a) {
        b.classList.add('good'); sfx.good();
        const r = b.getBoundingClientRect();
        for (let n = 0; n < 6; n++) heart(r.left + Math.random() * r.width, r.top + r.height / 2);
        if (!miss) score++;
        btns.forEach(x => x.disabled = true);
        qi++; setTimeout(ask, 1000);
      } else { b.classList.add('bad'); b.disabled = true; miss = true; sfx.bad(); }
    });
  };
  ask();
}

/* read the book (book.md) */
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const inline = t => esc(t).replace(/ {2}\n/g, '<br>')
  .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\*(.+?)\*/g, '<em>$1</em>');

function parse(md) {
  return md.replace(/\r/g, '').split(/\n\s*---\s*\n/).slice(1).map((block, idx) => {
    const p = { eyebrow: '', title: '', paras: [] }, body = [];
    for (const ln of block.trim().split('\n')) {
      const m = ln.match(/^(#{1,3})\s+(.*)/);
      if (m) { if (m[1] === '#') p.eyebrow = m[2]; else p.title = m[2]; } else body.push(ln);
    }
    p.paras = body.join('\n').split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
    const n = p.eyebrow.match(/Chapter\s+(\d+)/i);
    p.photo = n ? +n[1] : 0;
    if (!p.eyebrow) p.eyebrow = idx === 0 ? 'Before you begin' : 'One last thing';
    return p;
  }).filter(p => p.paras.length);
}

/* show a page */
let dragging = false;
const stickerFor = p => p.quiz ? ['🧸', 'quiz time'] : p.last ? ['🎂', 'happy birthday'] : p.first ? ['💌', 'just for you'] : ['📷', 'photo coming soon'];
const stickerHTML = p => { const [e, t] = stickerFor(p); return `<div class="sticker"><span>${e}</span><small>${t}</small></div>`; };
function place(pct) {
  $('#fill').style.width = pct * 100 + '%';
  $('#yarn').style.left = pct * 100 + '%';
  $('#yarn').style.transform = `rotate(${pct * 1440}deg)`;
}
function show(n) {
  const old = i, dir = n >= i ? 1 : -1;
  i = Math.max(0, Math.min(pages.length - 1, n));
  const p = pages[i];
  page.style.setProperty('--d', dir * 40 + 'px');
  page.style.animation = 'none'; void page.offsetWidth; page.style.animation = '';
  page.classList.add('has-photo');
  page.innerHTML =
    (p.photo ? `<figure class="polaroid"><img src="images/image${p.photo}.jpg" alt=""><figcaption>Reason ${p.photo}</figcaption></figure>` : stickerHTML(p)) +
    `<div class="text"><div class="eyebrow">${esc(p.eyebrow)}</div><h2>${esc(p.title)}</h2>${p.paras.map(t => `<p>${inline(t)}</p>`).join('')}</div>`;
  if (p.quiz) renderQuiz(page.querySelector('.text'));
  if (p.photo) page.querySelector('img').addEventListener('error', e => { e.target.closest('figure').outerHTML = stickerHTML(p); });
  if (!dragging) place(pages.length > 1 ? i / (pages.length - 1) : 0);
  $('#count').textContent = `${i + 1} / ${pages.length}`;
  $('#prev').disabled = i === 0;
  $('#next').disabled = i === pages.length - 1;
  if (i !== old) sfx.flip();
  if (i === pages.length - 1 && pages.length > 1) confetti();
}

function confetti() {
  const cols = ['#4f6f52', '#a8b99b', '#8a5a3c', '#c9a57a', '#1c1916'];
  for (let k = 0; k < 90; k++) {
    const d = document.createElement('i');
    d.className = 'conf';
    d.style.cssText = `left:${Math.random() * 100}%;width:${6 + Math.random() * 6}px;height:${10 + Math.random() * 8}px;background:${cols[k % 5]};` +
      `animation-delay:${Math.random() * 1.2}s;animation-duration:${2.5 + Math.random() * 2}s`;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 6500);
  }
}

/* controls */
$('#next').onclick = () => show(i + 1);
$('#prev').onclick = () => show(i - 1);
addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') show(i + 1);
  if (e.key === 'ArrowLeft') show(i - 1);
});
$('#open').onclick = () => {
  song.volume = 0.6; sfx.pop();
  song.play().catch(() => {});
  $('#cover').classList.add('open');
  setTimeout(() => $('#cover').classList.add('gone'), 1700);
};
music.onclick = () => (song.paused ? song.play() : song.pause());
song.onplay = () => music.classList.add('playing');
song.onpause = () => music.classList.remove('playing');

fetch('book.md')
  .then(r => { if (!r.ok) throw 0; return r.text(); })
  .then(t => {
    pages = parse(t); if (!pages.length) throw 0;
    pages[0].first = true; pages[pages.length - 1].last = true;
    pages.splice(pages.length - 1, 0, { quiz: true, eyebrow: 'A tiny quiz', title: 'How well do you know us?', paras: [], photo: 0 });
    show(0);
  })
  .catch(() => {
    page.innerHTML = '<div class="text"><h2>Book not found</h2><p>book.md is missing or empty. Put it in the same folder as index.html, and open this page from the GitHub link, not by double-clicking the file.</p></div>';
  });

/* drag the yarn ball to flip through the pages */
const bar = $('#bar');
const scrub = e => {
  const r = bar.getBoundingClientRect(), pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  place(pct);
  const idx = Math.round(pct * (pages.length - 1));
  if (idx !== i) show(idx);
};
const endDrag = () => { if (!dragging) return; dragging = false; bar.classList.remove('drag'); place(pages.length > 1 ? i / (pages.length - 1) : 0); };
bar.onpointerdown = e => { if (pages.length < 2) return; dragging = true; bar.classList.add('drag'); bar.setPointerCapture(e.pointerId); scrub(e); };
bar.onpointermove = e => { if (dragging) scrub(e); };
bar.onpointerup = endDrag; bar.onpointercancel = endDrag;

/* back to the cover, and the sound-effects switch */
$('#home').onclick = () => {
  const c = $('#cover');
  c.classList.remove('gone'); void c.offsetWidth; c.classList.remove('open');
  sfx.pop();
};
$('#sfx').onclick = () => { sfxOn = !sfxOn; $('#sfx').textContent = sfxOn ? '🔔' : '🔕'; sfx.pop(); };
