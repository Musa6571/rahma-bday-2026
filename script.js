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
      const perfect = score === QUIZ.length;
      if (perfect) unlockSecret();
      q.innerHTML = `<div class="q">${perfect ? 'Five out of five! You know us perfectly 💚' : `You got ${score} out of ${QUIZ.length} first try. Still my favourite 🤎`}</div>` +
        (perfect ? '<button class="opt good" id="goSecret">A secret page just unlocked 🔓 Open it</button>'
          : unlocked ? '' : '<div class="q">Get a perfect score and something hidden unlocks 👀</div>') +
        '<button class="opt" id="again">Play again 🧶</button>';
      q.querySelector('#again').onclick = () => { qi = 0; score = 0; ask(); };
      const g = q.querySelector('#goSecret'); if (g) g.onclick = () => show(pages.length - 1);
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
const stickerFor = p => isLocked(p) ? ['🔒', p.last ? 'finish the chapters' : 'locked'] : p.quiz ? ['🧸', 'quiz time'] : p.incident ? ['🔒', 'classified'] : p.secret ? ['🎟️', 'secret ending'] : p.last ? ['🎂', 'happy birthday'] : p.first ? ['💌', 'just for you'] : ['📷', 'photo coming soon'];
const stickerHTML = p => { const [e, t] = stickerFor(p); return `<div class="sticker"><span>${e}</span><small>${t}</small></div>`; };
function place(pct) {
  $('#fill').style.width = pct * 100 + '%';
  $('#yarn').style.left = pct * 100 + '%';
  $('#yarn').style.transform = `rotate(${pct * 1440}deg)`;
}
function show(n) {
  stopGame(); stopGame = () => {};
  const old = i, dir = n >= i ? 1 : -1;
  i = Math.max(0, Math.min(pages.length - 1, n));
  const p = pages[i], locked = isLocked(p);
  page.style.setProperty('--d', dir * 40 + 'px');
  page.style.animation = 'none'; void page.offsetWidth; page.style.animation = '';
  page.classList.add('has-photo');
  page.innerHTML =
    (p.photo && !locked ? `<figure class="polaroid"><img src="images/image${p.photo}.jpg" alt=""><figcaption>Reason ${p.photo}</figcaption></figure>` : stickerHTML(p)) +
    `<div class="text"><div class="eyebrow">${esc(p.eyebrow)}</div><h2>${locked ? 'Locked 🔒' : esc(p.title)}</h2>${locked ? '' : p.paras.map(t => `<p>${inline(t)}</p>`).join('')}</div>`;
  if (locked) renderGate(page.querySelector('.text'), p);
  else if (p.quiz) renderQuiz(page.querySelector('.text'));
  if (p.incident) renderIncident(page.querySelector('.text'));
  if (p.secret) page.querySelector('.text').insertAdjacentHTML('beforeend', ticketHTML);
  if (p.photo && !locked) page.querySelector('img').addEventListener('error', e => { e.target.closest('figure').outerHTML = stickerHTML(p); });
  if (!dragging) place(pages.length > 1 ? i / (pages.length - 1) : 0);
  refreshNav();
  if (i !== old) sfx.flip();
  if ((p.last || p.secret) && !locked && pages.length > 1) confetti();
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
  if (e.target.tagName === 'INPUT') return;
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
    const k = pages.findIndex(p => p.photo === 11);
    pages.splice(k < 0 ? pages.length - 1 : k + 1, 0, { incident: true, eyebrow: 'Classified', title: 'The Incidents', paras: [], photo: 0 });
    try { if (localStorage.getItem('rb-unlocked')) { unlocked = true; pages.push(secretPage); } } catch (e) {}
    pages.splice(pages.length - (unlocked ? 2 : 1), 0, { quiz: true, eyebrow: 'A tiny quiz', title: 'How well do you know us?', paras: [], photo: 0 });
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

/* two songs: they play one after the other, and ⏭ skips */
const SONGS = [['Still choose me', 'audio/still-choose-me.mp3'], ['Habibti', 'audio/habibti.mp3']];
let si = 0;
const loadSong = n => {
  si = (n + SONGS.length) % SONGS.length;
  song.src = SONGS[si][1];
  music.textContent = '♪ ' + SONGS[si][0];
};
loadSong(0);
const nextSong = () => { loadSong(si + 1); song.play().catch(() => {}); };
song.onended = nextSong;
$('#skip').onclick = nextSong;

/* classified incidents page */
const FILES = [['Incident #1', 'Barking Park'], ['Incident #2', ''], ['Incident #3', ''], ['Incident #4', '']];
const DENIED = ['🚫 Access denied. This file is above your clearance.', 'Nice try. Whatever happened in Barking Park stays in Barking Park.',
  'Security has been notified. (Security is Musa.)', 'Still no. Stop poking the file. 😌', 'Okay fine… you will have to ask me in person 👀'];
let denied = 0;
function renderIncident(box) {
  const w = document.createElement('div');
  w.innerHTML = '<div class="tape"></div><div class="stamp">CONFIDENTIAL</div>' +
    FILES.map(([n, t]) => `<button class="opt file">📁 ${n}: ${t ? esc(t) : '<span class="redact">xxxxxxxxxxxx</span>'} <b>cannot be opened</b></button>`).join('') +
    '<div class="status">Click a file. Go on. 👀</div><div class="handwritten">Whatever happened in Barking Park stays in Barking Park.</div>';
  box.appendChild(w);
  w.querySelectorAll('.file').forEach(b => b.onclick = () => {
    b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
    sfx.bad();
    w.querySelector('.status').textContent = DENIED[denied++ % DENIED.length];
  });
}

/* secret ending: unlocked by a perfect quiz score */
let unlocked = false;
const secretPage = { secret: true, eyebrow: 'Secret ending', title: 'You know us perfectly', photo: 0,
  paras: ['Five out of five. Nobody gets to see this page unless they really know us.', 'So here is something real:'] };
const ticketHTML = '<div class="ticket"><div class="eyebrow">Coupon</div><div class="big">One date, planned by me, chosen by you</div><p>Pick the place and the day. I’ll be there.</p><small>valid forever · redeem in person 🤎</small></div>';
function refreshNav() {
  $('#count').textContent = `${i + 1} / ${pages.length}`;
  $('#prev').disabled = i === 0;
  $('#next').disabled = i === pages.length - 1;
}
function unlockSecret() {
  if (unlocked) return;
  unlocked = true; pages.push(secretPage);
  try { localStorage.setItem('rb-unlocked', '1'); } catch (e) {}
  refreshNav(); place(i / (pages.length - 1)); sfx.good(); confetti();
}

/* countdown: the book only opens at midnight on 8 November 2026 (the laptop's local time) */
const OPEN_AT = new Date(2026, 10, 8, 0, 0, 0);
function tick() {
  const ms = OPEN_AT - new Date();
  if (ms <= 0 || location.search.includes('test')) {
    $('#cd').innerHTML = 'Happy birthday 🎂';
    $('#open').disabled = false;
    return true;
  }
  const t = Math.floor(ms / 1000), p = n => String(n).padStart(2, '0');
  $('#cd').innerHTML = `Opens at midnight<br>${Math.floor(t / 86400)}d ${p(Math.floor(t % 86400 / 3600))}h ${p(Math.floor(t % 3600 / 60))}m ${p(t % 60)}s`;
  $('#open').disabled = true;
  return false;
}
if (!tick()) {
  const timer = setInterval(() => { if (tick()) { clearInterval(timer); confetti(); } }, 1000);
}

/* ===== chapter games: every chapter (and the quiz) is locked until she wins its game ===== */
const GAMES = true; // set to false to turn all the games off
let done = new Set();
try { done = new Set(JSON.parse(localStorage.getItem('rb-done') || '[]')); } catch (e) {}
const saveDone = () => { try { localStorage.setItem('rb-done', JSON.stringify([...done])); } catch (e) {} };
const chaptersDone = () => [...done].filter(k => k[0] === 'c').length;
const isLocked = p => GAMES && !location.search.includes('skip') &&
  (p.photo ? !done.has('c' + p.photo) : p.quiz ? !done.has('quiz') : p.last ? chaptersDone() < 15 : false);
let stopGame = () => {};
const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

const TRIVIA = [
  ['Which hobby is Rahma’s?', ['Skateboarding', 'Crochet', 'Gaming', 'Fishing'], 1],
  ['Which two colours does she love most?', ['Pink and blue', 'Brown and green', 'Red and gold', 'Purple and white'], 1],
  ['Which month is her birthday?', ['March', 'November', 'July', 'January'], 1],
  ['What does the name Rahma mean?', ['Mercy and compassion', 'Brave warrior', 'Little star', 'Sweet honey'], 0],
  ['What does she love to read?', ['Car manuals', 'Books', 'Maps', 'Nothing'], 1]
];
const QUIZ_GATE = ['Which two colours is this whole website made of?', ['Brown and green', 'Pink and blue', 'Red and yellow', 'Black and white'], 0];

function trivia(box, d, win, qn) {
  const [t, opts, a] = Array.isArray(qn) ? qn : TRIVIA[qn % TRIVIA.length];
  const o = shuffle(opts.map((x, k) => [x, k === a]));
  box.innerHTML = `<div class="q">${t}</div>` + o.map(x => `<button class="opt">${x[0]}</button>`).join('');
  box.querySelectorAll('.opt').forEach((b, k) => b.onclick = () => {
    if (o[k][1]) { b.classList.add('good'); sfx.good(); setTimeout(win, 700); }
    else { b.classList.add('bad'); b.disabled = true; sfx.bad(); }
  });
}
function balloons(box, d, win) {
  const need = 6 + d * 3; let hit = 0;
  box.innerHTML = `<div class="q">Pop ${need} balloons 🎈 <b id="hit">0</b> / ${need}</div><div class="arena"></div>`;
  const ar = box.querySelector('.arena');
  const t = setInterval(() => {
    const b = document.createElement('button');
    b.className = 'balloon'; b.textContent = ['🎈', '💚', '🤎', '🌷'][Math.random() * 4 | 0];
    b.style.left = rnd(2, 88) + '%'; b.style.animationDuration = rnd(3.5, 5.5) - d * .5 + 's';
    b.onanimationend = () => b.remove();
    b.onclick = () => {
      b.remove(); sfx.pop(); hit++;
      box.querySelector('#hit').textContent = hit;
      if (hit >= need) { clearInterval(t); win(); }
    };
    ar.appendChild(b);
  }, 650 - d * 80);
  return () => clearInterval(t);
}
function match(box, d, win) {
  const em = ['🌷', '📖', '🧶', '🤎', '☕', '🌿', '🍂', '✨'].slice(0, 6 + d);
  let open = [], left = em.length;
  box.innerHTML = '<div class="q">Match all the pairs 🧶</div><div class="grid"></div>';
  const g = box.querySelector('.grid');
  shuffle([...em, ...em]).forEach(e => {
    const c = document.createElement('button');
    c.className = 'card'; c.textContent = '❔';
    c.onclick = () => {
      if (open.length > 1 || c.classList.contains('up')) return;
      c.classList.add('up'); c.textContent = e; c.dataset.e = e; open.push(c); sfx.pop();
      if (open.length < 2) return;
      if (open[0].dataset.e === open[1].dataset.e) { open = []; sfx.good(); if (!--left) setTimeout(win, 500); }
      else setTimeout(() => { open.forEach(x => { x.classList.remove('up'); x.textContent = '❔'; }); open = []; }, 700);
    };
    g.appendChild(c);
  });
}
function tap(box, d, win) {
  const need = 20 + d * 8, secs = 8; let n = 0, started = false, timer;
  box.innerHTML = `<div class="q">Tap the yarn ball ${need} times in ${secs} seconds 🧶</div><button class="yarnbtn">🧶</button><div class="status">0 / ${need}</div>`;
  const st = box.querySelector('.status');
  box.querySelector('.yarnbtn').onclick = () => {
    if (!started) { started = true; timer = setTimeout(() => { n = 0; started = false; st.textContent = 'Too slow! Try again 🧶'; sfx.bad(); }, secs * 1000); }
    n++; tone(500 + n * 20, .05, 'triangle', .08);
    if (n >= need) { clearTimeout(timer); win(); } else st.textContent = `${n} / ${need}`;
  };
  return () => clearTimeout(timer);
}
const WORDS = ['CROCHET', 'HABIBTI', 'BIRTHDAY', 'BARKING', 'PRINCESS', 'LIBRARY'];
function word(box, d, win) {
  const w = WORDS[Math.random() * WORDS.length | 0]; let sc = w;
  while (sc === w) sc = shuffle([...w]).join('');
  box.innerHTML = `<div class="q">Unscramble the word 🔤</div><div class="scr">${sc}</div><input class="inp" maxlength="12" autocomplete="off"><button class="opt" style="display:inline-block;width:auto">Check</button><div class="status"></div>`;
  const inp = box.querySelector('input'), st = box.querySelector('.status');
  const check = () => { if (inp.value.trim().toUpperCase() === w) win(); else { st.textContent = 'Not quite, try again 🧐'; sfx.bad(); } };
  box.querySelector('button').onclick = check;
  inp.onkeydown = e => { if (e.key === 'Enter') check(); };
  inp.focus();
}
function hunt(box, d, win) {
  const n = 12 + d * 6, k = Math.random() * n | 0;
  box.innerHTML = '<div class="q">One leaf is hiding a heart 💚 Find it!</div><div class="grid"></div>';
  const g = box.querySelector('.grid');
  for (let j = 0; j < n; j++) {
    const c = document.createElement('button');
    c.className = 'card'; c.textContent = '🍃';
    c.onclick = () => {
      c.disabled = true; c.classList.add('up');
      if (j === k) { c.textContent = '💚'; sfx.good(); setTimeout(win, 700); } else { c.textContent = '🌱'; sfx.pop(); }
    };
    g.appendChild(c);
  }
}
const GAME_LIST = [balloons, trivia, match, tap, word, hunt];
function renderGate(box, p) {
  const w = document.createElement('div');
  box.appendChild(w);
  if (p.last) {
    w.innerHTML = `<div class="q">The last page is locked 🔒 Unlock all 15 chapters first. ${15 - chaptersDone()} to go.</div><button class="opt" id="gofirst">Take me to the next locked chapter</button>`;
    w.querySelector('#gofirst').onclick = () => show(pages.findIndex(x => x.photo && isLocked(x)));
    return;
  }
  const win = () => { done.add(p.quiz ? 'quiz' : 'c' + p.photo); saveDone(); sfx.good(); confetti(); setTimeout(() => show(i), 600); };
  const gi = p.quiz ? 1 : (p.photo - 1) % 6, d = p.quiz ? 0 : Math.floor((p.photo - 1) / 6);
  w.innerHTML = '<div class="q">Win this little game to open the page 🔓</div><div class="gate"></div>';
  stopGame = GAME_LIST[gi](w.querySelector('.gate'), d, win, p.quiz ? QUIZ_GATE : p.photo) || (() => {});
}
