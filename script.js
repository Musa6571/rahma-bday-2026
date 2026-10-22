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
function show(n) {
  const dir = n >= i ? 1 : -1;
  i = Math.max(0, Math.min(pages.length - 1, n));
  const p = pages[i];
  page.style.setProperty('--d', dir * 40 + 'px');
  page.classList.remove('has-photo');
  page.style.animation = 'none'; void page.offsetWidth; page.style.animation = '';
  page.innerHTML =
    (p.photo ? `<figure class="polaroid"><img src="images/image${p.photo}.jpg" alt=""><figcaption>Reason ${p.photo}</figcaption></figure>` : '') +
    `<div class="text"><div class="eyebrow">${esc(p.eyebrow)}</div><h2>${esc(p.title)}</h2>${p.paras.map(t => `<p>${inline(t)}</p>`).join('')}</div>`;
  if (p.photo) {
    page.classList.add('has-photo');
    page.querySelector('img').addEventListener('error', e => { e.target.closest('figure').remove(); page.classList.remove('has-photo'); });
  }
  const pct = pages.length > 1 ? i / (pages.length - 1) : 0;
  $('#fill').style.width = pct * 100 + '%';
  $('#yarn').style.left = pct * 100 + '%';
  $('#yarn').style.transform = `rotate(${pct * 1440}deg)`;
  $('#count').textContent = `${i + 1} / ${pages.length}`;
  $('#prev').disabled = i === 0;
  $('#next').disabled = i === pages.length - 1;
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
  song.volume = 0.6;
  song.play().catch(() => {});
  $('#cover').classList.add('open');
  setTimeout(() => $('#cover').classList.add('gone'), 1700);
};
music.onclick = () => (song.paused ? song.play() : song.pause());
song.onplay = () => music.classList.add('playing');
song.onpause = () => music.classList.remove('playing');

fetch('book.md')
  .then(r => { if (!r.ok) throw 0; return r.text(); })
  .then(t => { pages = parse(t); if (!pages.length) throw 0; show(0); })
  .catch(() => {
    page.innerHTML = '<div class="text"><h2>Book not found</h2><p>book.md is missing or empty. Put it in the same folder as index.html, and open this page from the GitHub link, not by double-clicking the file.</p></div>';
  });
