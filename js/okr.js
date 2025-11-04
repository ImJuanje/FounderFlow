// okr.js - Sistema OKR Mejorado

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('okr-form');
  const okrsContainer = document.getElementById('okrs-container');
  const chartCanvas = document.getElementById('okr-chart');
  const totalOkrsElement = document.getElementById('total-okrs');
  const avgProgressElement = document.getElementById('avg-progress');

  let okrs = JSON.parse(localStorage.getItem('okrs')) || [];
  let weeklyData = JSON.parse(localStorage.getItem('okrWeekly')) || {};

  renderOKRs();
  renderChart();
  updateStats();

  form.addEventListener('submit', e => {
    e.preventDefault();
    const objective = document.getElementById('objective').value.trim();
    const keyResultsInput = document.getElementById('keyResults').value.trim();

    if (!objective || !keyResultsInput) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    const keyResults = keyResultsInput.split(',').map(kr => kr.trim()).filter(kr => kr);

    if (keyResults.length === 0) {
      showNotification('Agrega al menos un resultado clave', 'error');
      return;
    }

    const newOKR = {
      id: Date.now(),
      objective,
      keyResults,
      progress: 0,
      createdAt: new Date().toISOString()
    };

    okrs.push(newOKR);
    localStorage.setItem('okrs', JSON.stringify(okrs));

    form.reset();
    renderOKRs();
    renderChart();
    updateStats();
    showNotification('OKR creado exitosamente', 'success');
  });

  function renderOKRs() {
    if (okrs.length === 0) {
      okrsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bullseye"></i>
          <p>No hay OKRs creados todavía</p>
          <small>Crea tu primer OKR usando el formulario superior</small>
        </div>
      `;
      return;
    }

    okrsContainer.innerHTML = okrs.map((okr, index) => {
      const progressClass = getProgressClass(okr.progress);
      
      return `
        <div class="okr-card" data-okr-id="${okr.id}">
          <div class="okr-header">
            <div class="okr-objective">
              <h3>${escapeHtml(okr.objective)}</h3>
            </div>
            <div class="okr-progress-circle">
              <div class="progress-circle-bg">
                <div class="progress-circle-fill" style="--progress-percent: ${okr.progress}%"></div>
                <div class="progress-text ${progressClass}">${okr.progress}%</div>
              </div>
            </div>
          </div>

          <div class="okr-key-results">
            ${okr.keyResults.map(kr => `
              <div class="key-result-item">
                <i class="fas fa-chevron-right key-result-icon"></i>
                <span class="key-result-text">${escapeHtml(kr)}</span>
              </div>
            `).join('')}
          </div>

          <div class="okr-actions">
            <div class="progress-input-container">
              <input 
                type="number" 
                min="0" 
                max="100" 
                value="${okr.progress}" 
                data-index="${index}"
                class="progress-input"
                placeholder="0-100"
              >
              <span>%</span>
            </div>
            <button data-index="${index}" class="update-btn">
              <i class="fas fa-sync-alt"></i>
              Actualizar
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Add event listeners to update buttons
    document.querySelectorAll('.update-btn').forEach(btn => {
      btn.addEventListener('click', handleProgressUpdate);
    });

    // Add event listeners for Enter key on inputs
    document.querySelectorAll('.progress-input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const index = e.target.dataset.index;
          document.querySelector(`.update-btn[data-index="${index}"]`).click();
        }
      });
    });
  }

  function handleProgressUpdate(e) {
    const index = parseInt(e.target.dataset.index);
    const input = document.querySelector(`.progress-input[data-index="${index}"]`);
    let progress = parseInt(input.value);

    if (isNaN(progress) || progress < 0) progress = 0;
    if (progress > 100) progress = 100;

    okrs[index].progress = progress;
    localStorage.setItem('okrs', JSON.stringify(okrs));

    // Save weekly progress
    const currentWeek = getCurrentWeek();
    if (!weeklyData[currentWeek]) {
      weeklyData[currentWeek] = {};
    }
    weeklyData[currentWeek][index] = progress;
    localStorage.setItem('okrWeekly', JSON.stringify(weeklyData));

    // Update UI with animation
    const okrCard = document.querySelector(`.okr-card[data-okr-id="${okrs[index].id}"]`);
    const progressText = okrCard.querySelector('.progress-text');
    const progressFill = okrCard.querySelector('.progress-circle-fill');
    
    progressText.textContent = `${progress}%`;
    progressText.className = `progress-text ${getProgressClass(progress)}`;
    progressFill.style.setProperty('--progress-percent', `${progress}%`);
    
    okrCard.classList.add('progress-updated');
    setTimeout(() => okrCard.classList.remove('progress-updated'), 600);

    renderChart();
    updateStats();
    showNotification('Progreso actualizado correctamente', 'success');
  }

  function renderChart() {
    const labels = Object.keys(weeklyData).sort();
    const datasets = okrs.map((okr, index) => {
      const data = labels.map(week => weeklyData[week][index] || 0);
      const color = getColorForIndex(index);
      
      return {
        label: okr.objective.length > 30 ? okr.objective.substring(0, 30) + '...' : okr.objective,
        data,
        borderColor: color,
        backgroundColor: color + '20',
        tension: 0.4,
        fill: false,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      };
    });

    // Update legend
    const legendContainer = document.getElementById('chart-legend');
    legendContainer.innerHTML = datasets.map((dataset, index) => `
      <div class="legend-color-item">
        <div class="legend-color-swatch" style="background-color: ${dataset.borderColor}"></div>
        <span>${dataset.label}</span>
      </div>
    `).join('');

    if (window.okrChart) {
      window.okrChart.data.labels = labels;
      window.okrChart.data.datasets = datasets;
      window.okrChart.update();
    } else {
      window.okrChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
          labels,
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: '#475569',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  return `${context.dataset.label}: ${context.parsed.y}%`;
                }
              }
            }
          },
          scales: {
            x: {
              grid: {
                color: 'rgba(71, 85, 105, 0.3)'
              },
              ticks: {
                color: '#94a3b8'
              }
            },
            y: {
              min: 0,
              max: 100,
              grid: {
                color: 'rgba(71, 85, 105, 0.3)'
              },
              ticks: {
                color: '#94a3b8',
                callback: function(value) {
                  return value + '%';
                }
              },
              title: {
                display: true,
                text: 'Progreso (%)',
                color: '#cbd5e1'
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          }
        }
      });
    }
  }

  function updateStats() {
    totalOkrsElement.textContent = `${okrs.length} ${okrs.length === 1 ? 'OKR' : 'OKRs'}`;
    
    if (okrs.length > 0) {
      const totalProgress = okrs.reduce((sum, okr) => sum + okr.progress, 0);
      const averageProgress = Math.round(totalProgress / okrs.length);
      avgProgressElement.textContent = `${averageProgress}% progreso promedio`;
    } else {
      avgProgressElement.textContent = '0% progreso promedio';
    }
  }

  function getCurrentWeek() {
    const today = new Date();
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
    const pastDaysOfYear = (today - firstDayOfYear) / 86400000;
    return `Semana ${Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)}`;
  }

  function getProgressClass(progress) {
    if (progress >= 80) return 'progress-excellent';
    if (progress >= 50) return 'progress-good';
    return 'progress-poor';
  }

  function getColorForIndex(index) {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    return colors[index % colors.length];
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
      <span>${message}</span>
    `;
    
    // Add styles for notification
    if (!document.querySelector('#notification-styles')) {
      const styles = document.createElement('style');
      styles.id = 'notification-styles';
      styles.textContent = `
        .notification {
          position: fixed;
          top: 100px;
          right: 20px;
          background: var(--secondary-dark);
          border: 1px solid var(--border-color);
          border-left: 4px solid var(--accent-color);
          border-radius: var(--border-radius);
          padding: 1rem 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: var(--text-primary);
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          transform: translateX(400px);
          transition: transform 0.3s ease;
        }
        .notification-success { border-left-color: #10b981; }
        .notification-error { border-left-color: #ef4444; }
        .notification i { font-size: 1.2rem; }
        .notification-success i { color: #10b981; }
        .notification-error i { color: #ef4444; }
      `;
      document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
});