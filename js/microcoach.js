// microcoach.js - Sistema de Micro-Coach Mejorado

document.addEventListener('DOMContentLoaded', () => {
  // ------------------
  // POOL DE RETOS (por categoría)
  // ------------------
  const CHALLENGES = {
    productividad: [
      { text: "Anota tus 3 MIT (Most Important Tasks) para hoy y priorízalas.", points: 10 },
      { text: "Haz una sesión Pomodoro de 25 minutos sin distracciones.", points: 8 },
      { text: "Elimina o delega 1 tarea que no aporta valor esta semana.", points: 12 },
      { text: "Organiza tu bandeja de entrada durante 10 minutos (limpia/archiva).", points: 6 },
      { text: "Planifica mañana: escribe las 3 acciones que debes terminar.", points: 6 }
    ],
    negocio: [
      { text: "Define en una frase el problema que resuelve tu producto.", points: 12 },
      { text: "Escribe una hipótesis medible que puedas validar esta semana.", points: 15 },
      { text: "Contacta a 1 cliente potencial con un mensaje corto y valiente.", points: 20 },
      { text: "Crea un mini-experimento (1 día) para validar una funcionalidad.", points: 14 },
      { text: "Revisa tu propuesta de valor y mejora una frase clave.", points: 10 }
    ],
    mindset: [
      { text: "Escribe 1 miedo profesional y 1 acción pequeña para enfrentarlo.", points: 8 },
      { text: "Encuentra 3 cosas que has logrado este mes y anótalas.", points: 6 },
      { text: "Haz 5 minutos de respiración consciente antes de trabajar.", points: 5 },
      { text: "Reformula una creencia limitante en una afirmación accionable.", points: 10 },
      { text: "Piensa en un posible fallo y escribe 1 plan de contingencia.", points: 9 }
    ],
    networking: [
      { text: "Envía un mensaje de seguimiento a alguien con quien ya hablaste.", points: 10 },
      { text: "Pide 1 pequeña introducción a una persona relevante.", points: 15 },
      { text: "Comparte una publicación con valor con tu red (1 idea práctica).", points: 8 },
      { text: "Agenda una llamada de 15 minutos con un contacto importante.", points: 18 },
      { text: "Agradece a alguien que te ayudó esta semana con un mensaje sincero.", points: 6 }
    ]
  };

  // ------------------
  // ELEMENTOS DOM
  // ------------------
  const newBtn = document.getElementById('new-challenge-btn');
  const categorySelect = document.getElementById('category');
  const challengeText = document.getElementById('challenge-text');
  const challengePoints = document.getElementById('challenge-points');
  const challengeActions = document.getElementById('challenge-actions');
  const reflectionInput = document.getElementById('reflection');
  const completeBtn = document.getElementById('complete-btn');
  const skipBtn = document.getElementById('skip-btn');

  const pointsEl = document.getElementById('points');
  const completedCountEl = document.getElementById('completed-count');
  const streakEl = document.getElementById('streak');
  const favoriteCategoryEl = document.getElementById('favorite-category');
  const totalChallengesEl = document.getElementById('total-challenges');
  const completionRateEl = document.getElementById('completion-rate');
  const historyContainer = document.getElementById('history-container');
  const resetBtn = document.getElementById('reset-stats');

  const filterCategory = document.getElementById('filter-category');
  const filterStatus = document.getElementById('filter-status');
  const sortHistory = document.getElementById('sort-history');

  // ------------------
  // STATE y LOCALSTORAGE
  // ------------------
  const STORAGE_KEY = 'ff_microcoach_v2';
  
  function loadState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
        points: 0,
        streak: { lastDate: null, current: 0 },
        history: []
      };
    } catch (e) {
      console.error('Error parseando estado', e);
      return { points: 0, streak: { lastDate: null, current: 0 }, history: [] };
    }
  }
  
  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  
  let state = loadState();

  // ------------------
  // FUNCIONES AUX
  // ------------------
  function uid() {
    return Math.random().toString(36).slice(2, 9);
  }
  
  function todayISO() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  
  function isSameDayISO(a, b) {
    return String(a).slice(0, 10) === String(b).slice(0, 10);
  }
  
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getCategoryDisplayName(category) {
    const names = {
      'productividad': 'Productividad',
      'negocio': 'Negocio',
      'mindset': 'Mindset',
      'networking': 'Networking'
    };
    return names[category] || category;
  }

  function getCategoryBadgeClass(category) {
    return `category-badge category-${category}`;
  }

  // ------------------
  // INTERFAZ DE RETOS
  // ------------------
  let currentChallenge = null;

  function showChallenge(ch) {
    currentChallenge = ch;
    
    if (ch) {
      challengeText.textContent = ch.text;
      challengePoints.textContent = `${ch.points} pts`;
      challengeActions.style.display = 'block';
      challengeText.parentElement.classList.add('challenge-appear');
    } else {
      challengeText.textContent = 'Selecciona una categoría y pulsa "Nuevo Reto" para recibir tu desafío diario';
      challengePoints.textContent = '0 pts';
      challengeActions.style.display = 'none';
      challengeText.parentElement.classList.remove('challenge-appear');
    }
    
    reflectionInput.value = '';
  }

  function pickRandomChallenge(category) {
    const pool = CHALLENGES[category] || [];
    if (!pool.length) return null;
    const idx = Math.floor(Math.random() * pool.length);
    return Object.assign({}, pool[idx]);
  }

  // Nuevo reto
  newBtn.addEventListener('click', () => {
    const cat = categorySelect.value;
    const ch = pickRandomChallenge(cat);
    
    if (!ch) {
      showChallenge(null);
      showNotification('No hay retos disponibles para esta categoría', 'error');
      return;
    }
    
    ch.id = uid();
    ch.category = cat;
    ch.generatedAt = new Date().toISOString();
    showChallenge(ch);
  });

  // Completar reto
  completeBtn.addEventListener('click', () => {
    if (!currentChallenge) return;
    
    const reflection = reflectionInput.value.trim();
    const entry = {
      id: currentChallenge.id || uid(),
      dateISO: new Date().toISOString(),
      category: currentChallenge.category,
      text: currentChallenge.text,
      points: currentChallenge.points || 0,
      reflection,
      completed: true
    };
    
    state.history.unshift(entry);
    state.points = (state.points || 0) + (entry.points || 0);
    updateStreakOnComplete();
    saveState(state);
    
    renderStats();
    renderHistory();
    showChallenge(null);
    showNotification(`🎉 Reto completado +${entry.points} pts`, 'success');
    
    // Animación de puntos
    animatePoints(entry.points);
  });

  // Saltar reto
  skipBtn.addEventListener('click', () => {
    if (!currentChallenge) return;
    
    const reflection = reflectionInput.value.trim();
    const entry = {
      id: currentChallenge.id || uid(),
      dateISO: new Date().toISOString(),
      category: currentChallenge.category,
      text: currentChallenge.text,
      points: 0,
      reflection,
      completed: false
    };
    
    state.history.unshift(entry);
    saveState(state);
    renderHistory();
    showChallenge(null);
    showNotification('Reto saltado - ¡Intenta con otro!', 'info');
  });

  // Resetear datos
  resetBtn.addEventListener('click', () => {
    if (!confirm('¿Estás seguro de que quieres resetear todos tus datos del Micro-Coach? Se perderá tu historial, puntos y racha.')) return;
    
    state = { points: 0, streak: { lastDate: null, current: 0 }, history: [] };
    saveState(state);
    renderStats();
    renderHistory();
    showChallenge(null);
    showNotification('Datos reseteados correctamente', 'info');
  });

  // ------------------
  // STATS y STREAK
  // ------------------
  function updateStreakOnComplete() {
    const lastISO = state.streak.lastDate;
    const today = todayISO();

    if (!lastISO) {
      state.streak.current = 1;
      state.streak.lastDate = today;
      return;
    }

    const lastDate = new Date(lastISO);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    if (isSameDayISO(lastISO, today)) {
      return;
    } else if (isSameDayISO(lastISO, yesterday.toISOString())) {
      state.streak.current = (state.streak.current || 0) + 1;
      state.streak.lastDate = today;
    } else {
      state.streak.current = 1;
      state.streak.lastDate = today;
    }
  }

  function calculateFavoriteCategory() {
    const categoryCount = {};
    state.history.forEach(entry => {
      if (entry.completed) {
        categoryCount[entry.category] = (categoryCount[entry.category] || 0) + 1;
      }
    });
    
    let favorite = '-';
    let maxCount = 0;
    
    Object.entries(categoryCount).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favorite = getCategoryDisplayName(cat);
      }
    });
    
    return favorite;
  }

  function calculateCompletionRate() {
    const total = state.history.length;
    if (total === 0) return '0%';
    
    const completed = state.history.filter(h => h.completed).length;
    return `${Math.round((completed / total) * 100)}%`;
  }

  // ------------------
  // RENDER UI
  // ------------------
  function renderStats() {
    pointsEl.textContent = state.points || 0;
    const completed = state.history.filter(h => h.completed).length;
    completedCountEl.textContent = completed;
    streakEl.textContent = state.streak.current || 0;
    streakEl.className = state.streak.current >= 3 ? 'stat-number streak-active' : 'stat-number';
    
    favoriteCategoryEl.textContent = calculateFavoriteCategory();
    totalChallengesEl.textContent = `${state.history.length} ${state.history.length === 1 ? 'reto' : 'retos'}`;
    completionRateEl.textContent = calculateCompletionRate();
  }

  function renderHistory() {
    const filterCat = filterCategory.value;
    const filterStat = filterStatus.value;
    const sortBy = sortHistory.value;

    let filteredHistory = state.history.filter(entry => {
      if (filterCat !== 'all' && entry.category !== filterCat) return false;
      if (filterStat !== 'all') {
        if (filterStat === 'completed' && !entry.completed) return false;
        if (filterStat === 'skipped' && entry.completed) return false;
      }
      return true;
    });

    // Ordenar
    filteredHistory.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.dateISO) - new Date(a.dateISO);
        case 'oldest':
          return new Date(a.dateISO) - new Date(b.dateISO);
        case 'points':
          return (b.points || 0) - (a.points || 0);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return new Date(b.dateISO) - new Date(a.dateISO);
      }
    });

    if (filteredHistory.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-history"></i>
          <p>No hay historial de retos</p>
          <small>Los retos completados aparecerán aquí</small>
        </div>
      `;
      return;
    }

    const table = document.createElement('table');
    table.className = 'history-table';
    
    table.innerHTML = `
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Categoría</th>
          <th>Reto</th>
          <th>Estado</th>
          <th>Puntos</th>
          <th>Reflexión</th>
        </tr>
      </thead>
      <tbody>
        ${filteredHistory.map(entry => `
          <tr>
            <td>${formatDate(entry.dateISO)}</td>
            <td><span class="${getCategoryBadgeClass(entry.category)}">${getCategoryDisplayName(entry.category)}</span></td>
            <td>${escapeHtml(entry.text)}</td>
            <td>
              <span class="${entry.completed ? 'status-completed' : 'status-skipped'}">
                <i class="fas ${entry.completed ? 'fa-check-circle' : 'fa-forward'}"></i>
                ${entry.completed ? 'Completado' : 'Saltado'}
              </span>
            </td>
            <td class="points-display">${entry.points || 0}</td>
            <td>${escapeHtml(entry.reflection || '-')}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    historyContainer.innerHTML = '';
    historyContainer.appendChild(table);
  }

  function animatePoints(points) {
    const pointsElement = pointsEl;
    const originalText = pointsElement.textContent;
    const originalColor = pointsElement.style.color;
    
    pointsElement.style.color = '#10b981';
    pointsElement.textContent = `+${points}`;
    
    setTimeout(() => {
      pointsElement.style.color = originalColor;
      pointsElement.textContent = state.points;
    }, 1000);
  }

  function showNotification(message, type = 'info') {
    // Implementación similar a las otras páginas
    console.log(`${type}: ${message}`);
    
    // Notificación temporal
    const notification = document.createElement('div');
    notification.className = `achievement-unlocked`;
    notification.innerHTML = `
      <div class="achievement-icon">
        <i class="fas ${type === 'success' ? 'fa-trophy' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
      </div>
      <div class="achievement-title">${type === 'success' ? '¡Éxito!' : type === 'error' ? 'Atención' : 'Información'}</div>
      <div class="achievement-desc">${message}</div>
    `;
    
    document.querySelector('.current-challenge').insertAdjacentElement('beforebegin', notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // ------------------
  // EVENT LISTENERS
  // ------------------
  filterCategory.addEventListener('change', renderHistory);
  filterStatus.addEventListener('change', renderHistory);
  sortHistory.addEventListener('change', renderHistory);

  // ------------------
  // INIT
  // ------------------
  renderStats();
  renderHistory();
  showChallenge(null);

  // Expose for debug
  window._microcoach_state = state;
});