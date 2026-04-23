const GROQ_API_KEY = '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';

let user = JSON.parse(localStorage.getItem('founderflow_user')) || null;
if (!user || !user.email) {
  user = {
    name: 'Demo Creator',
    avatar: 'DC',
    bio: 'Creador de contenido PRO',
    email: 'demo@founderflow.io',
    link: '',
    theme: 'dark',
    nicho: 'General / Lifestyle'
  };
  localStorage.setItem('founderflow_user', JSON.stringify(user));
}

let posts = JSON.parse(localStorage.getItem('founderflow_posts')) || [];
let collaborations = JSON.parse(localStorage.getItem('founderflow_collabs')) || [
  { id: 1, client: 'Clínica SmilePro', status: 'paid', amount: 2500, date: '2026-05-15', icon: 'fas fa-tooth', color: '#4ade80' },
  { id: 2, client: 'LuxHomes RE', status: 'pending', amount: 3000, date: '2026-05-20', icon: 'fas fa-building', color: '#3b82f6' },
];
let metrics = JSON.parse(localStorage.getItem('founderflow_metrics')) || [];
let savedIdeas = JSON.parse(localStorage.getItem('founderflow_ideas')) || [];
let postChecklists = JSON.parse(localStorage.getItem('founderflow_checklists')) || {};
let streakData = JSON.parse(localStorage.getItem('founderflow_streak')) || { current: 0, best: 0, days: [] };

let currentFilter = 'all';
let selectedNicho = user.nicho || 'General / Lifestyle';
let dragSrcIndex = null;
let currentChecklistPostId = null;
let showingSavedIdeas = false;

const CHECKLIST_STEPS_TEMPLATE = [
  { id: 'grabar', icon: '🎬', name: 'Grabar', desc: 'Grabación del contenido principal' },
  { id: 'editar', icon: '✂️', name: 'Editar', desc: 'Edición y montaje del vídeo/imagen' },
  { id: 'thumbnail', icon: '🖼️', name: 'Thumbnail', desc: 'Diseño de miniatura o portada' },
  { id: 'caption', icon: '✍️', name: 'Caption', desc: 'Redactar el texto y hashtags' },
  { id: 'publicar', icon: '🚀', name: 'Publicar', desc: 'Subir y programar en la plataforma' },
  { id: 'interactuar', icon: '💬', name: 'Interactuar', desc: 'Responder comentarios (primeras 2h)' },
];

window.addEventListener('load', () => {
  applyTheme(user.theme || 'dark');
  document.getElementById('user-name').textContent = user.name;
  updateAvatarEl();
  document.getElementById('profile-name').value = user.name;
  document.getElementById('profile-bio').value = user.bio || '';
  document.getElementById('profile-link').value = user.link || '';
  document.getElementById('post-date').value = new Date().toISOString().split('T')[0];

  document.querySelectorAll('.nicho-chip').forEach(c => {
    if (c.dataset.nicho === selectedNicho) c.classList.add('active');
  });

  animateStats();
  drawAnalyticsChart();
  renderPosts();
  renderCollaborations();
  renderCalendar();
  renderStreak();
  renderMetrics();
  renderSavedIdeas();
  updateIdeasNichoLabel();
  generateMediaKit();

  showNotif('🚀 FounderFlow PRO cargado – ¡todo al 100%!', 'success');
});

function showNotif(msg, type = 'success') {
  const stack = document.getElementById('notif-stack');
  const el = document.createElement('div');
  const icons = { success:'circle-check', error:'circle-xmark', info:'circle-info', warning:'triangle-exclamation' };
  el.className = `notif notif-${type}`;
  el.innerHTML = `<i class="fas fa-${icons[type] || 'circle-info'} notif-icon"></i><span>${msg}</span>`;
  stack.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => el.remove(), 400);
  }, 4000);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon = document.getElementById('theme-icon');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  user.theme = next;
  localStorage.setItem('founderflow_user', JSON.stringify(user));
  showNotif(`Tema ${next === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
}

function renderStreak() {
  document.getElementById('streak-count').textContent = streakData.current;
  document.getElementById('streak-best').textContent = streakData.best;

  const daysEl = document.getElementById('streak-days');
  daysEl.innerHTML = '';
  const today = new Date().toISOString().split('T')[0];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('es-ES', { weekday: 'narrow' });
    const published = streakData.days.includes(ds);
    const isToday = ds === today;

    const el = document.createElement('div');
    el.className = 'streak-day' + (isToday && published ? ' today' : published ? ' active' : '');
    el.textContent = dayName;
    el.title = ds;
    daysEl.appendChild(el);
  }
}

function logPublishToday() {
  const today = new Date().toISOString().split('T')[0];
  if (streakData.days.includes(today)) {
    showNotif('Ya registraste una publicación hoy 🔥', 'info');
    return;
  }
  streakData.days.push(today);
  streakData.days.sort();
  let streak = 0;
  let d = new Date();
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (streakData.days.includes(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else break;
  }
  streakData.current = streak;
  if (streak > streakData.best) streakData.best = streak;
  localStorage.setItem('founderflow_streak', JSON.stringify(streakData));
  renderStreak();
  showNotif(`🔥 ¡Racha actualizada! ${streak} días seguidos publicando`, 'success');
}

function animateStats() {
  document.querySelectorAll('.stat-number[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const isFloat = target % 1 !== 0;
    let current = 0, frame = 0;
    const steps = 80, inc = target / steps;
    const update = () => {
      frame++;
      current = Math.min(current + inc, target);
      const display = isFloat ? current.toFixed(1) : Math.round(current).toLocaleString('es-ES');
      el.textContent = prefix + display + suffix;
      if (frame < steps) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
}

function drawAnalyticsChart() {
  const canvas = document.getElementById('analytics-chart');
  if (!canvas || !canvas.getContext) return;
  const w = canvas.width = canvas.parentElement.offsetWidth - 32;
  const h = canvas.height = 260;
  const ctx = canvas.getContext('2d');
  const data = [3200, 4800, 6200, 8900, 10100, 12500];
  const labels = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar', 'Abr'];
  const maxVal = Math.max(...data);
  const pad = { top:20, right:20, bottom:40, left:55 };
  const gw = w - pad.left - pad.right, gh = h - pad.top - pad.bottom;

  ctx.clearRect(0,0,w,h);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;

  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (gh / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();
  }

  const pts = data.map((d,i) => ({ x: pad.left + (gw/(data.length-1))*i, y: pad.top + gh - (d/maxVal)*gh }));
  const grad = ctx.createLinearGradient(0, pad.top, 0, h - pad.bottom);
  grad.addColorStop(0, 'rgba(255,215,0,0.22)');
  grad.addColorStop(1, 'rgba(255,215,0,0)');

  ctx.beginPath();
  ctx.moveTo(pts[0].x, h - pad.bottom);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(pts[pts.length-1].x, h - pad.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  pts.forEach((p,i) => i===0 ? ctx.moveTo(p.x,p.y) : ctx.lineTo(p.x,p.y));
  ctx.strokeStyle = '#ffd700';
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.shadowBlur = 10;
  ctx.shadowColor = 'rgba(255,215,0,0.6)';
  ctx.stroke();
  ctx.shadowBlur = 0;

  pts.forEach((p,i) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5, 0, Math.PI*2);
    ctx.fillStyle = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'rgba(255,215,0,0.8)';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#080b12';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], p.x, h - pad.bottom + 18);
  });
}

function renderCalendar() {
  const canvas = document.getElementById('calendar-chart');
  if (!canvas || !canvas.getContext) return;
  const w = canvas.width = canvas.parentElement.offsetWidth - 32;
  const h = canvas.height = 220;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,w,h);
  const colors = ['#4ade80','#60a5fa','#f59e0b','#f87171','#a78bfa'];
  const scheduled = posts.filter(p => p.status === 'scheduled').slice(0,8);

  if (!scheduled.length) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '14px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin posts programados – genera contenido con IA ✨', w/2, h/2);
    return;
  }

  const barW = Math.min((w - 40) / scheduled.length - 12, 70);
  scheduled.forEach((p,i) => {
    const barH = Math.min(40 + (p.text.length/8), h - 60);
    const x = 20 + i * ((w-40)/scheduled.length) + 4, y = h - 35 - barH;
    ctx.fillStyle = colors[i % colors.length];
    ctx.shadowBlur = 8;
    ctx.shadowColor = colors[i % colors.length];
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 6);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barW, barH);
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 10px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.platform.split(' ')[0], x + barW/2, h - 14);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px DM Sans, sans-serif';
    ctx.fillText(new Date(p.date).toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit'}), x + barW/2, y - 6);
  });
}

function changeCalendarView(v) {
  showNotif(`Vista ${v === 'month' ? 'mensual' : 'semanal'} activada`, 'info');
}

document.getElementById('nicho-grid').addEventListener('click', e => {
  const chip = e.target.closest('.nicho-chip');
  if (!chip) return;
  document.querySelectorAll('.nicho-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  selectedNicho = chip.dataset.nicho;
  user.nicho = selectedNicho;
  localStorage.setItem('founderflow_user', JSON.stringify(user));
  updateIdeasNichoLabel();
  showNotif(`Nicho: ${selectedNicho}`, 'info');
});

function updateIdeasNichoLabel() {
  const el = document.getElementById('ideas-nicho-label');
  if (el) el.textContent = selectedNicho;
}

async function generateContent() {
  const input = document.getElementById('ai-input').value.trim();
  const platform = document.getElementById('platform').value.replace(/[📱📸🐦🎥💼📌👻]/g,'').trim();
  const contentType = document.getElementById('content-type').value;
  const container = document.getElementById('ai-container');
  const output = document.getElementById('ai-output');
  container.classList.add('is-loading');
  output.style.display = 'block';
  output.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:var(--gold-solid);"></i> Generando con Groq AI...';

  const contentTypeLabels = {
    viral:'viral/tendencia', educational:'educativo', storytelling:'storytelling emocional',
    humor:'humor/entretenimiento', promotional:'promocional', ugc:'UGC/review', challenge:'reto/challenge'
  };
  const topic = input || `ideas para el nicho de "${selectedNicho}"`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role:'system', content:'Eres experto en marketing de contenidos. Responde SIEMPRE en español. Sé concreto y accionable.' },
          { role:'user', content:`Genera 3 ideas COMPLETAS de contenido de tipo "${contentTypeLabels[contentType] || 'viral'}" para ${platform} en el nicho "${selectedNicho}".\n\nContexto: ${topic}` }
        ],
        max_tokens: 900,
        temperature: 0.9
      })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    output.textContent = data.choices[0].message.content;
    showNotif('✅ Contenido generado', 'success');
  } catch(err) {
    output.innerHTML = `⚠️ <strong>Modo demo (${err.message}):</strong>\n\n1️⃣ [3 cosas que nadie te cuenta sobre ${selectedNicho}]...`;
    showNotif('⚠️ Modo demo – revisa tu API key', 'warning');
  } finally {
    container.classList.remove('is-loading');
  }
}

function clearAI() {
  document.getElementById('ai-input').value = '';
  const out = document.getElementById('ai-output');
  out.style.display = 'none';
  out.textContent = '';
}

function addPostFromAI() {
  const text = document.getElementById('ai-output').textContent.trim() || document.getElementById('ai-input').value.trim();
  if (!text) {
    showNotif('Genera o escribe un post primero', 'warning');
    return;
  }
  posts.unshift({
    id: Date.now(),
    text,
    platform: document.getElementById('platform').value,
    status: 'draft',
    date: document.getElementById('post-date').value || new Date().toISOString().split('T')[0],
    created: new Date().toISOString(),
    niche: selectedNicho
  });
  savePosts();
  renderPosts();
  showNotif('📝 Post guardado', 'success');
}

function renderPosts(status = currentFilter, search = '') {
  const list = document.getElementById('posts-list');
  const q = search.toLowerCase().trim();
  const filtered = posts.filter(p => {
    const matchStatus = status === 'all' || p.status === status;
    const matchSearch = !q || (p.text || '').toLowerCase().includes(q) || (p.platform || '').toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-layer-group"></i><p>No hay posts para mostrar.</p></div>`;
  } else {
    list.innerHTML = filtered.map((p, i) => {
      const checklist = postChecklists[p.id] || {};
      const done = Object.values(checklist).filter(Boolean).length;
      const pct = Math.round((done / CHECKLIST_STEPS_TEMPLATE.length) * 100);
      return `
        <div class="post-item ${p.status}" draggable="true" ondragstart="dragStart(${i})" data-index="${i}">
          <div class="post-body">
            <div class="post-text">${escapeHtml(p.text)}</div>
            <div class="post-meta">
              <span class="badge badge-${p.status}">${statusLabel(p.status)}</span>
              <span><i class="fas fa-${platformIcon(p.platform)}"></i> ${escapeHtml(p.platform)}</span>
              <span><i class="fas fa-calendar"></i> ${formatDate(p.date)}</span>
              <span><i class="fas fa-list-check"></i> ${pct}% checklist</span>
            </div>
          </div>
          <div class="post-actions">
            <button class="btn btn-ghost btn-icon btn-sm" onclick="openChecklistByFilteredIndex(${i})" title="Checklist"><i class="fas fa-list-check"></i></button>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="toggleStatusByFilteredIndex(${i})" title="Cambiar estado"><i class="fas fa-exchange-alt"></i></button>
            <button class="btn btn-ghost btn-icon btn-sm" onclick="editPostByFilteredIndex(${i})" title="Editar"><i class="fas fa-pen"></i></button>
            <button class="btn btn-danger btn-icon btn-sm" onclick="deletePostByFilteredIndex(${i})" title="Eliminar"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  document.getElementById('total-posts').textContent = posts.length;
  document.getElementById('upcoming-count').textContent = posts.filter(p => p.status === 'scheduled').length;
  document.getElementById('drafts-count').textContent = posts.filter(p => p.status === 'draft').length;
  document.getElementById('published-count').textContent = posts.filter(p => p.status === 'published').length;
  updateStatPosts();
}

function savePosts() {
  localStorage.setItem('founderflow_posts', JSON.stringify(posts));
}

function filterPosts(search) { renderPosts(currentFilter, search); }

function filterByStatus(status, btn) {
  currentFilter = status;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderPosts(status, document.getElementById('search-posts').value);
}

function getActualIndex(filteredIndex) {
  const q = document.getElementById('search-posts').value.toLowerCase().trim();
  const filtered = posts.filter(p => (currentFilter === 'all' || p.status === currentFilter) && (!q || (p.text || '').toLowerCase().includes(q) || (p.platform || '').toLowerCase().includes(q)));
  return posts.findIndex(p => p.id === filtered[filteredIndex].id);
}

function editPostByFilteredIndex(i) { editPost(getActualIndex(i)); }
function deletePostByFilteredIndex(i) { deletePost(getActualIndex(i)); }
function toggleStatusByFilteredIndex(i) { toggleStatus(getActualIndex(i)); }
function openChecklistByFilteredIndex(i) { openChecklist(getActualIndex(i)); }

function editPost(index) {
  const post = posts[index];
  const newText = prompt('Editar post:\n', post.text);
  if (newText !== null && newText.trim() && newText !== post.text) {
    post.text = newText.trim();
    post.edited = new Date().toISOString();
    savePosts();
    renderPosts(currentFilter);
    renderCalendar();
    showNotif('✏️ Post actualizado');
  }
}

function deletePost(index) {
  if (!confirm('¿Eliminar este post permanentemente?')) return;
  posts.splice(index, 1);
  savePosts();
  renderPosts(currentFilter);
  renderCalendar();
  showNotif('🗑️ Post eliminado', 'info');
}

function toggleStatus(index) {
  const cycle = ['draft', 'scheduled', 'published'];
  const cur = cycle.indexOf(posts[index].status);
  posts[index].status = cycle[(cur + 1) % cycle.length];
  savePosts();
  renderPosts(currentFilter);
  renderCalendar();
  showNotif('Estado actualizado', 'info');
}

function bulkPublish() {
  const targets = posts.filter(p => p.status === 'draft' || p.status === 'scheduled');
  if (!targets.length) {
    showNotif('No hay posts pendientes', 'warning');
    return;
  }
  targets.forEach(p => p.status = 'published');
  savePosts();
  renderPosts(currentFilter);
  renderCalendar();
  showNotif(`🚀 ${targets.length} posts publicados en lote`, 'success');
}

function allowDrop(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function removeDragOver(e) { e.currentTarget.classList.remove('drag-over'); }
function dragStart(i) { dragSrcIndex = getActualIndex(i); }
function drop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const dropTarget = e.target.closest('.post-item');
  if (!dropTarget || dragSrcIndex === null) return;
  const dropIndex = parseInt(dropTarget.dataset.index);
  const actualDropIndex = getActualIndex(dropIndex);
  if (actualDropIndex === dragSrcIndex) return;
  const [moved] = posts.splice(dragSrcIndex, 1);
  posts.splice(actualDropIndex, 0, moved);
  dragSrcIndex = null;
  savePosts();
  renderPosts(currentFilter);
  showNotif('🔄 Posts reordenados', 'info');
}

function exportPosts(format = 'csv') {
  let content, filename;
  if (format === 'csv') {
    content = 'ID,Plataforma,Nicho,Fecha,Estado,Texto,Creado\n';
    posts.forEach(p => {
      content += `"${p.id}","${p.platform}","${p.niche || ''}","${p.date}","${p.status}","${(p.text || '').replace(/"/g,'""')}","${p.created || ''}"\n`;
    });
    filename = `founderflow_posts_${today()}.csv`;
  } else {
    content = JSON.stringify(posts, null, 2);
    filename = `founderflow_posts_${today()}.json`;
  }
  downloadFile(content, filename, format === 'csv' ? 'text/csv' : 'application/json');
  showNotif(`📊 ${format.toUpperCase()} exportado (${posts.length} posts)`);
}

function openChecklist(postIndex) {
  const post = posts[postIndex];
  currentChecklistPostId = post.id;
  const checklist = postChecklists[post.id] || {};
  document.getElementById('checklist-post-name').textContent = `${post.platform} — ${post.text.substring(0, 60)}...`;
  renderChecklistSteps(checklist);
  document.getElementById('checklist-modal').classList.add('open');
}

function closeChecklist() { document.getElementById('checklist-modal').classList.remove('open'); }
function closeChecklistIfOutside(e) { if (e.target === document.getElementById('checklist-modal')) closeChecklist(); }

function renderChecklistSteps(checklist) {
  const container = document.getElementById('checklist-steps');
  container.innerHTML = '';
  CHECKLIST_STEPS_TEMPLATE.forEach(step => {
    const done = !!checklist[step.id];
    const div = document.createElement('div');
    div.className = 'checklist-step' + (done ? ' done' : '');
    div.innerHTML = `
      <div class="step-check">${done ? '<i class="fas fa-check"></i>' : ''}</div>
      <div class="step-icon">${step.icon}</div>
      <div class="step-info">
        <div class="step-name">${step.name}</div>
        <div class="step-desc">${step.desc}</div>
      </div>
    `;
    div.onclick = () => {
      const cl = postChecklists[currentChecklistPostId] || {};
      cl[step.id] = !cl[step.id];
      postChecklists[currentChecklistPostId] = cl;
      renderChecklistSteps(cl);
      updateChecklistProgress(cl);
    };
    container.appendChild(div);
  });
  updateChecklistProgress(checklist);
}

function updateChecklistProgress(checklist) {
  const done = Object.values(checklist).filter(Boolean).length;
  const pct = Math.round((done / CHECKLIST_STEPS_TEMPLATE.length) * 100);
  document.getElementById('checklist-bar').style.width = pct + '%';
}

function saveChecklist() {
  localStorage.setItem('founderflow_checklists', JSON.stringify(postChecklists));
  renderPosts(currentFilter);
  closeChecklist();
  showNotif('✅ Progreso de producción guardado', 'success');
}

function resetChecklist() {
  if (!confirm('¿Resetear todos los pasos?')) return;
  postChecklists[currentChecklistPostId] = {};
  renderChecklistSteps({});
  showNotif('Checklist reseteado', 'info');
}

function addMetric() {
  const platform = document.getElementById('m-platform').value;
  const views = parseInt(document.getElementById('m-views').value) || 0;
  const likes = parseInt(document.getElementById('m-likes').value) || 0;
  const shares = parseInt(document.getElementById('m-shares').value) || 0;
  if (!views && !likes && !shares) { showNotif('Introduce al menos un dato', 'warning'); return; }
  const engagement = views > 0 ? ((likes + shares) / views * 100).toFixed(2) : '0';
  metrics.push({ id: Date.now(), platform, views, likes, shares, engagement: parseFloat(engagement), date: today() });
  localStorage.setItem('founderflow_metrics', JSON.stringify(metrics));
  document.getElementById('m-views').value = '';
  document.getElementById('m-likes').value = '';
  document.getElementById('m-shares').value = '';
  renderMetrics();
  showNotif('📊 Métricas añadidas', 'success');
}

function renderMetrics() {
  const list = document.getElementById('metrics-list');
  const insights = document.getElementById('analytics-insights');

  if (!metrics.length) {
    list.innerHTML = `<div class="empty-state" style="padding:2rem;"><i class="fas fa-chart-bar"></i><p>Añade las métricas reales de tus posts publicados para descubrir qué funciona mejor</p></div>`;
    insights.innerHTML = '';
    return;
  }

  const byPlatform = {};
  metrics.forEach(m => {
    if (!byPlatform[m.platform]) byPlatform[m.platform] = { totalViews:0, totalLikes:0, totalShares:0, count:0, engagements:[] };
    const bp = byPlatform[m.platform];
    bp.totalViews += m.views;
    bp.totalLikes += m.likes;
    bp.totalShares += m.shares;
    bp.count++;
    bp.engagements.push(m.engagement);
  });

  const platformStats = Object.entries(byPlatform).map(([name, d]) => ({
    name,
    avgEngagement: (d.engagements.reduce((a,b)=>a+b,0)/d.engagements.length).toFixed(2),
    totalViews: d.totalViews,
    totalLikes: d.totalLikes,
    totalShares: d.totalShares,
    count: d.count
  })).sort((a,b) => b.avgEngagement - a.avgEngagement);

  const best = platformStats[0];
  const totalViews = metrics.reduce((a,m)=>a+m.views,0);
  const avgEng = (metrics.reduce((a,m)=>a+m.engagement,0)/metrics.length).toFixed(2);
  const bestPost = [...metrics].sort((a,b)=>b.views-a.views)[0];

  insights.innerHTML = `
    <div class="insight-card"><div class="icon">🏆</div><div class="val">${best ? best.name.replace(/[📱📸🐦🎥💼]/g,'').trim() : '–'}</div><div class="desc">Mejor plataforma por engagement</div></div>
    <div class="insight-card"><div class="icon">👁️</div><div class="val">${totalViews >= 1000 ? (totalViews/1000).toFixed(1)+'K' : totalViews}</div><div class="desc">Vistas totales registradas</div></div>
    <div class="insight-card"><div class="icon">❤️</div><div class="val">${avgEng}%</div><div class="desc">Engagement medio global</div></div>
    <div class="insight-card"><div class="icon">🚀</div><div class="val">${bestPost ? (bestPost.views >= 1000 ? (bestPost.views/1000).toFixed(1)+'K' : bestPost.views) : '–'}</div><div class="desc">Mayor alcance en un post</div></div>
  `;

  list.innerHTML = '';
  platformStats.forEach(ps => {
    const div = document.createElement('div');
    div.className = 'metric-row';
    const maxViews = Math.max(...platformStats.map(p => p.totalViews)) || 1;
    const barPct = Math.round((ps.totalViews / maxViews) * 100);
    div.innerHTML = `
      <div class="metric-platform">${ps.name.replace(/[📱📸🐦🎥💼📌👻]/g,'').trim()}</div>
      <div class="metric-stat"><div class="val">${ps.totalViews >= 1000 ? (ps.totalViews/1000).toFixed(1)+'K' : ps.totalViews}</div><div class="lbl">Views</div></div>
      <div class="metric-stat"><div class="val">${ps.totalLikes}</div><div class="lbl">Likes</div></div>
      <div class="metric-stat"><div class="val">${ps.totalShares}</div><div class="lbl">Shares</div></div>
      <div class="metric-stat"><div class="val" style="color:var(--success);">${ps.avgEngagement}%</div><div class="lbl">Engagement</div></div>
      <div class="perf-chart" style="flex:1;max-width:80px;"><div class="perf-bar" style="height:${Math.max(barPct,8)}%;"></div></div>
      <div style="text-align:right;">${ps.name === platformStats[0].name ? '<span class="top-pill">⭐ Top</span>' : ''}</div>
      <button class="btn btn-danger btn-icon btn-sm" onclick="deletePlatformMetrics('${ps.name.replace(/'/g,"\\'")}')"><i class="fas fa-trash" style="font-size:0.7rem;"></i></button>
    `;
    list.appendChild(div);
  });
}

function deletePlatformMetrics(platform) {
  if (!confirm(`¿Eliminar todas las métricas de ${platform}?`)) return;
  metrics = metrics.filter(m => m.platform !== platform);
  localStorage.setItem('founderflow_metrics', JSON.stringify(metrics));
  renderMetrics();
  showNotif('Métricas eliminadas', 'info');
}

function renderCollaborations() {
  const list = document.getElementById('collaborations-list');
  list.innerHTML = '';
  if (!collaborations.length) {
    list.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><i class="fas fa-handshake"></i><p>Sin colaboraciones aún.</p></div>`;
    return;
  }
  collaborations.forEach((c, i) => {
    const statusMap = {
      paid: { icon:'fa-circle-check', color:'#4ade80', text:'Cobrado' },
      pending: { icon:'fa-clock', color:'#3b82f6', text:'Pendiente' },
      cancelled: { icon:'fa-circle-xmark', color:'#ef4444', text:'Cancelado' }
    };
    const st = statusMap[c.status] || statusMap.pending;
    const div = document.createElement('div');
    div.className = 'colab-item';
    div.innerHTML = `
      <div class="colab-icon" style="background:${c.color || st.color}22;color:${c.color || st.color};"><i class="${c.icon || 'fas fa-briefcase'}"></i></div>
      <div class="colab-info">
        <div class="colab-name">${escapeHtml(c.client)}</div>
        <div class="colab-sub">${formatDate(c.date)} · <i class="fas ${st.icon}" style="color:${st.color};"></i> ${st.text}</div>
      </div>
      <div class="colab-amount">€${c.amount.toLocaleString('es-ES')}</div>
      <button class="btn btn-danger btn-icon btn-sm" onclick="deleteColab(${i})" style="margin-left:0.25rem;"><i class="fas fa-trash" style="font-size:0.75rem;"></i></button>
    `;
    list.appendChild(div);
  });
}

function addCollaboration() {
  const client = prompt('Nombre del cliente / marca:');
  if (!client || !client.trim()) return;
  const amount = parseFloat(prompt('Importe pactado (€):', '1500')) || 0;
  collaborations.push({
    id: Date.now(),
    client: client.trim(),
    status: 'pending',
    amount,
    date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    icon: 'fas fa-handshake',
    color: '#60a5fa'
  });
  saveCollabs();
  renderCollaborations();
  showNotif('🤝 Colaboración añadida');
}

function deleteColab(index) {
  if (!confirm('¿Eliminar esta colaboración?')) return;
  collaborations.splice(index, 1);
  saveCollabs();
  renderCollaborations();
  showNotif('Colaboración eliminada', 'info');
}

function saveCollabs() {
  localStorage.setItem('founderflow_collabs', JSON.stringify(collaborations));
}

function updateAvatarEl() {
  const el = document.getElementById('user-avatar');
  if (user.avatarData) el.innerHTML = `<img src="${user.avatarData}" alt="avatar">`;
  else el.textContent = (user.name || 'U').substring(0,2).toUpperCase();
}

function saveProfile() {
  user.name = document.getElementById('profile-name').value.trim() || 'Usuario';
  user.bio = document.getElementById('profile-bio').value.trim();
  user.link = document.getElementById('profile-link').value.trim();
  user.nicho = selectedNicho;
  localStorage.setItem('founderflow_user', JSON.stringify(user));
  document.getElementById('user-name').textContent = user.name;
  updateAvatarEl();
  generateMediaKit();
  showNotif('💾 Perfil guardado');
}

function shareProfile() {
  const link = user.link || `${window.location.origin}/#${encodeURIComponent(user.name)}`;
  navigator.clipboard.writeText(link).then(() => showNotif('🔗 Link copiado')).catch(() => showNotif('Copia manualmente: ' + link, 'warning'));
}

function handleAvatarUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('profile-img').src = e.target.result;
    user.avatarData = e.target.result;
    localStorage.setItem('founderflow_user', JSON.stringify(user));
    updateAvatarEl();
    generateMediaKit();
    showNotif('🖼️ Avatar actualizado');
  };
  reader.readAsDataURL(file);
}

function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  localStorage.removeItem('founderflow_user');
  window.location.href = 'index.html';
}

function generateMediaKit() {
  const name = user.name || 'Creator Name';
  const bio = user.bio || 'Creador de contenido digital';
  const link = user.link || '';
  const nicho = selectedNicho;
  const avatar = user.avatarData || '';

  const rateFeed = document.getElementById('rate-feed')?.value || '500';
  const rateReel = document.getElementById('rate-reel')?.value || '800';
  const rateStory = document.getElementById('rate-story')?.value || '300';
  const ratePack = document.getElementById('rate-pack')?.value || '1500';

  const totalFollowers = 12500;
  const engagement = 8.5;
  const pubCount = posts.filter(p => p.status === 'published').length;
  const colabCount = collaborations.length;

  const preview = document.getElementById('mediakit-preview');
  preview.innerHTML = `
    <div class="mediakit-preview">
      <div class="mediakit-header">
        <div class="mediakit-avatar">${avatar ? `<img src="${avatar}" alt="avatar">` : name.substring(0,2).toUpperCase()}</div>
        <div>
          <div class="mediakit-name">${escapeHtml(name)}</div>
          <div class="mediakit-nicho">📌 ${escapeHtml(nicho)}</div>
          <div class="mediakit-bio">${escapeHtml(bio)}</div>
          ${link ? `<div style="margin-top:0.4rem;font-size:0.82rem;color:var(--gold-solid);">🔗 ${escapeHtml(link)}</div>` : ''}
        </div>
      </div>

      <div class="mediakit-stats">
        <div class="mk-stat"><div class="val">${totalFollowers.toLocaleString('es-ES')}</div><div class="lbl">Seguidores</div></div>
        <div class="mk-stat"><div class="val">${engagement}%</div><div class="lbl">Engagement</div></div>
        <div class="mk-stat"><div class="val">${pubCount}</div><div class="lbl">Posts publicados</div></div>
        <div class="mk-stat"><div class="val">${colabCount}</div><div class="lbl">Colabs</div></div>
      </div>

      <div class="mediakit-rates">
        <div class="rate-item"><div class="type">Feed / Carrusel</div><div class="price">€${rateFeed}</div><div class="desc">1 publicación estática</div></div>
        <div class="rate-item"><div class="type">Reel / TikTok</div><div class="price">€${rateReel}</div><div class="desc">Contenido corto vertical</div></div>
        <div class="rate-item"><div class="type">Story pack x5</div><div class="price">€${rateStory}</div><div class="desc">Pack de historias</div></div>
        <div class="rate-item"><div class="type">Pack completo</div><div class="price">€${ratePack}</div><div class="desc">Combo premium</div></div>
      </div>

      <div class="mediakit-footer">
        <div class="mediakit-contact">Contacto: <span>${link || 'Añade tu enlace principal'}</span></div>
        <div class="mk-logo">FounderFlow PRO</div>
      </div>
    </div>
  `;
}

function exportMediaKit() {
  const html = document.getElementById('mediakit-preview').innerHTML;
  downloadFile(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Media Kit</title></head><body>${html}</body></html>`, `mediakit_${today()}.html`, 'text/html');
  showNotif('📦 Media Kit exportado', 'success');
}

function copyMediaKitLink() {
  const link = user.link || window.location.href;
  navigator.clipboard.writeText(link).then(() => showNotif('🔗 Enlace copiado', 'success'));
}

function toggleSavedIdeas() {
  showingSavedIdeas = !showingSavedIdeas;
  document.getElementById('ideas-view-main').style.display = showingSavedIdeas ? 'none' : 'block';
  document.getElementById('ideas-view-saved').style.display = showingSavedIdeas ? 'block' : 'none';
  if (showingSavedIdeas) renderSavedIdeas();
}

function generateIdeas() {
  const ideas = [];
  for (let i = 0; i < 15; i++) {
    ideas.push({
      id: Date.now() + i,
      text: `Idea ${i + 1} para ${selectedNicho}: contenido de valor con gancho, desarrollo y CTA.`,
      niche: selectedNicho,
      date: today(),
      saved: false
    });
  }
  savedIdeas = savedIdeas.filter(x => x.saved);
  localStorage.setItem('founderflow_ideas', JSON.stringify(savedIdeas));
  renderIdeas(ideas);
  showNotif('💡 15 ideas generadas', 'success');
}

function renderIdeas(ideas = []) {
  const grid = document.getElementById('ideas-grid');
  if (!ideas.length) return;
  grid.innerHTML = ideas.map(idea => `
    <div class="idea-card ${idea.saved ? 'saved' : ''}" onclick="toggleIdeaSave(${idea.id})">
      <button class="idea-save-btn" onclick="event.stopPropagation(); toggleIdeaSave(${idea.id})"><i class="fas fa-bookmark"></i></button>
      <div class="idea-text">${escapeHtml(idea.text)}</div>
      <div class="idea-meta"><span>${idea.niche}</span><span>·</span><span>${formatDate(idea.date)}</span></div>
    </div>
  `).join('');
}

function renderSavedIdeas() {
  const list = document.getElementById('saved-ideas-list');
  document.getElementById('saved-count').textContent = savedIdeas.length;
  if (!savedIdeas.length) {
    list.innerHTML = `<div class="empty-state"><i class="fas fa-bookmark"></i><p>No hay ideas guardadas todavía.</p></div>`;
    return;
  }
  list.innerHTML = savedIdeas.map(idea => `
    <div class="saved-idea-item">
      <div class="idea-txt">${escapeHtml(idea.text)}</div>
      <button class="use-btn" onclick="useIdea(${idea.id})">Usar</button>
    </div>
  `).join('');
}

function toggleIdeaSave(id) {
  const existing = savedIdeas.find(x => x.id === id);
  if (existing) {
    savedIdeas = savedIdeas.filter(x => x.id !== id);
  } else {
    savedIdeas.push({ id, text: `Idea guardada ${id}`, niche: selectedNicho, date: today() });
  }
  localStorage.setItem('founderflow_ideas', JSON.stringify(savedIdeas));
  renderSavedIdeas();
}

function useIdea(id) {
  const idea = savedIdeas.find(x => x.id === id);
  if (!idea) return;
  document.getElementById('ai-input').value = idea.text;
  toggleSavedIdeas();
}

function savePostsAndRerender() {
  savePosts();
  renderPosts(currentFilter);
  renderCalendar();
}

function today() { return new Date().toISOString().split('T')[0]; }

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}

function statusLabel(status) {
  return { draft: 'Borrador', scheduled: 'Programado', published: 'Publicado' }[status] || status;
}

function platformIcon(platform) {
  const p = (platform || '').toLowerCase();
  if (p.includes('tiktok')) return 'video';
  if (p.includes('instagram')) return 'camera-retro';
  if (p.includes('twitter') || p.includes('x')) return 'bird';
  if (p.includes('youtube')) return 'play';
  if (p.includes('linkedin')) return 'briefcase';
  if (p.includes('pinterest')) return 'thumbtack';
  if (p.includes('snapchat')) return 'ghost';
  return 'circle';
}

function escapeHtml(str = '') {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function updateStatPosts() {
  const scheduled = posts.filter(p => p.status === 'scheduled').length;
  document.getElementById('stat-posts').textContent = scheduled;
  document.getElementById('posts-trend').innerHTML = `<i class="fas fa-layer-group"></i> ${posts.length} posts totales`;
}

function initNichoSelector() {
  const selector = document.querySelector('.nicho-selector');
  const toggle = document.getElementById('nicho-toggle');

  if (!selector || !toggle) return;

  toggle.addEventListener('click', () => {
    selector.classList.toggle('open');
  });
}

window.addEventListener('load', () => {
  initNichoSelector();
});