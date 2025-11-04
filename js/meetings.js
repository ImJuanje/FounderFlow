// meetings.js - Sistema de Reuniones Mejorado

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('meeting-form');
  const meetingsContainer = document.getElementById('meetings-container');
  const filterStatusSelect = document.getElementById('filter-status');
  const filterDateSelect = document.getElementById('filter-date');
  const sortMeetingsSelect = document.getElementById('sort-meetings');
  const totalMeetingsElement = document.getElementById('total-meetings');
  const upcomingMeetingsElement = document.getElementById('upcoming-meetings');
  const pendingActionsElement = document.getElementById('pending-actions');
  const minutesModal = document.getElementById('minutes-modal');
  const exportMinutesBtn = document.getElementById('export-minutes');

  let meetings = JSON.parse(localStorage.getItem('meetings')) || [];
  let actionItems = JSON.parse(localStorage.getItem('meetingActions')) || {};

  renderMeetings();
  updateStats();

  form.addEventListener('submit', e => {
    e.preventDefault();

    const title = document.getElementById('meeting-title').value.trim();
    const date = document.getElementById('meeting-date').value;
    const time = document.getElementById('meeting-time').value;
    const duration = document.getElementById('meeting-duration').value;
    const participants = document.getElementById('meeting-participants').value.split(',').map(p => p.trim()).filter(Boolean);
    const objective = document.getElementById('meeting-objective').value.trim();
    const agenda = document.getElementById('meeting-agenda').value.trim();

    if (!title || !date || !time || !objective) {
      showNotification('Por favor completa los campos obligatorios', 'error');
      return;
    }

    const newMeeting = {
      id: Date.now(),
      title,
      date,
      time,
      duration: parseInt(duration),
      participants,
      objective,
      agenda,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      actionItems: []
    };

    meetings.push(newMeeting);
    localStorage.setItem('meetings', JSON.stringify(meetings));

    form.reset();
    renderMeetings();
    updateStats();
    showNotification('Reunión programada exitosamente', 'success');
  });

  // Event listeners for filters
  filterStatusSelect.addEventListener('change', renderMeetings);
  filterDateSelect.addEventListener('change', renderMeetings);
  sortMeetingsSelect.addEventListener('change', renderMeetings);

  function renderMeetings() {
    const filterStatus = filterStatusSelect.value;
    const filterDate = filterDateSelect.value;
    const sortBy = sortMeetingsSelect.value;

    let filteredMeetings = meetings.filter(meeting => {
      // Filter by status
      if (filterStatus !== 'all' && meeting.status !== filterStatus) {
        return false;
      }
      
      // Filter by date
      if (filterDate !== 'all') {
        const meetingDate = new Date(meeting.date);
        const today = new Date();
        
        switch (filterDate) {
          case 'today':
            return meetingDate.toDateString() === today.toDateString();
          case 'week':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return meetingDate >= startOfWeek && meetingDate <= endOfWeek;
          case 'month':
            return meetingDate.getMonth() === today.getMonth() && 
                   meetingDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      }
      
      return true;
    });

    // Sort meetings
    filteredMeetings.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
        case 'recent':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          // Simple priority based on status and date
          const priority = { 'upcoming': 3, 'completed': 2, 'cancelled': 1 };
          return priority[b.status] - priority[a.status];
        default:
          return 0;
      }
    });

    if (filteredMeetings.length === 0) {
      meetingsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-alt"></i>
          <p>No se encontraron reuniones</p>
          <small>Prueba ajustando los filtros o programa nuevas reuniones</small>
        </div>
      `;
      return;
    }

    meetingsContainer.innerHTML = filteredMeetings.map(meeting => {
      const meetingDateTime = new Date(meeting.date + ' ' + meeting.time);
      const now = new Date();
      const isUpcoming = meetingDateTime > now && meeting.status === 'upcoming';
      const meetingActions = actionItems[meeting.id] || [];
      const pendingActions = meetingActions.filter(action => !action.completed).length;
      
      return `
        <div class="meeting-card ${meeting.status} ${isUpcoming ? 'upcoming' : ''}" data-meeting-id="${meeting.id}">
          <div class="meeting-header">
            <div class="meeting-info">
              <div class="meeting-title">${escapeHtml(meeting.title)}</div>
              <div class="meeting-meta">
                <div class="meta-item">
                  <i class="fas fa-calendar-day"></i>
                  ${formatDate(meeting.date)}
                </div>
                <div class="meta-item">
                  <i class="fas fa-clock"></i>
                  ${meeting.time} (${meeting.duration}min)
                </div>
                <div class="meta-item">
                  <i class="fas fa-users"></i>
                  ${meeting.participants.length} participantes
                </div>
              </div>
            </div>
            <div class="meeting-status status-${meeting.status}">
              ${getStatusDisplayName(meeting.status)}
            </div>
          </div>

          <div class="meeting-details">
            <div class="detail-section">
              <h4><i class="fas fa-bullseye"></i> Objetivo</h4>
              <div class="detail-content">${escapeHtml(meeting.objective)}</div>
            </div>

            ${meeting.agenda ? `
              <div class="detail-section">
                <h4><i class="fas fa-list-ol"></i> Agenda</h4>
                <div class="detail-content">${escapeHtml(meeting.agenda)}</div>
              </div>
            ` : ''}

            ${meeting.participants.length > 0 ? `
              <div class="detail-section">
                <h4><i class="fas fa-users"></i> Participantes</h4>
                <div class="participants-list">
                  ${meeting.participants.map(participant => `
                    <span class="participant-tag">${escapeHtml(participant)}</span>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${meetingActions.length > 0 ? `
              <div class="detail-section">
                <h4><i class="fas fa-tasks"></i> Acciones (${pendingActions} pendientes)</h4>
                <div class="action-items">
                  ${meetingActions.slice(0, 3).map(action => `
                    <div class="action-item ${action.completed ? 'completed' : ''} ${isOverdue(action.deadline) ? 'overdue' : ''}">
                      <div class="action-checkbox ${action.completed ? 'checked' : ''}" 
                           onclick="toggleAction('${meeting.id}', '${action.id}')"></div>
                      <div class="action-content">
                        <div class="action-text">${escapeHtml(action.text)}</div>
                        <div class="action-meta">
                          <span class="action-responsible">${escapeHtml(action.responsible)}</span>
                          <span class="action-deadline ${isOverdue(action.deadline) ? 'overdue' : ''}">
                            ${formatDate(action.deadline)}
                          </span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                  ${meetingActions.length > 3 ? `
                    <div class="detail-content" style="text-align: center; color: var(--accent-color); cursor: pointer;"
                         onclick="viewMinutes('${meeting.id}')">
                      +${meetingActions.length - 3} más acciones...
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="meeting-actions">
            <button class="meeting-action-btn" onclick="viewMinutes('${meeting.id}')">
              <i class="fas fa-file-alt"></i>
              Minutas
            </button>
            ${isUpcoming ? `
              <button class="meeting-action-btn" onclick="startMeeting('${meeting.id}')">
                <i class="fas fa-play"></i>
                Iniciar
              </button>
              <button class="meeting-action-btn" onclick="cancelMeeting('${meeting.id}')">
                <i class="fas fa-times"></i>
                Cancelar
              </button>
            ` : `
              <button class="meeting-action-btn primary" onclick="addActionItem('${meeting.id}')">
                <i class="fas fa-plus"></i>
                Agregar Acción
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  function updateStats() {
    const now = new Date();
    
    totalMeetingsElement.textContent = `${meetings.length} ${meetings.length === 1 ? 'reunión' : 'reuniones'}`;
    
    const upcoming = meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date + ' ' + meeting.time);
      return meetingDate > now && meeting.status === 'upcoming';
    }).length;
    
    upcomingMeetingsElement.textContent = `${upcoming} ${upcoming === 1 ? 'próxima' : 'próximas'}`;
    
    let totalPending = 0;
    Object.values(actionItems).forEach(actions => {
      totalPending += actions.filter(action => !action.completed).length;
    });
    
    pendingActionsElement.textContent = `${totalPending} ${totalPending === 1 ? 'acción pendiente' : 'acciones pendientes'}`;
  }

  function getStatusDisplayName(status) {
    const statusNames = {
      'upcoming': 'Próxima',
      'completed': 'Realizada',
      'cancelled': 'Cancelada'
    };
    return statusNames[status] || status;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function isOverdue(deadline) {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showNotification(message, type = 'info') {
    // Implementation similar a las otras páginas
    console.log(`${type}: ${message}`);
    alert(message); // Temporal para demostración
  }

  // Export minutes functionality
  exportMinutesBtn.addEventListener('click', () => {
    // Aquí iría la lógica para exportar a PDF
    showNotification('Funcionalidad de exportación en desarrollo', 'info');
  });
});

// Funciones globales para las acciones de reuniones
function viewMinutes(meetingId) {
  const meetings = JSON.parse(localStorage.getItem('meetings')) || [];
  const actionItems = JSON.parse(localStorage.getItem('meetingActions')) || {};
  const meeting = meetings.find(m => m.id == meetingId);
  
  if (!meeting) return;

  const minutesContent = document.getElementById('minutes-content');
  const actions = actionItems[meetingId] || [];
  
  minutesContent.innerHTML = `
    <div class="minutes-section">
      <h4>Información General</h4>
      <div class="detail-content">
        <p><strong>Título:</strong> ${escapeHtml(meeting.title)}</p>
        <p><strong>Fecha:</strong> ${formatDate(meeting.date)} ${meeting.time}</p>
        <p><strong>Duración:</strong> ${meeting.duration} minutos</p>
        <p><strong>Objetivo:</strong> ${escapeHtml(meeting.objective)}</p>
      </div>
    </div>

    ${meeting.agenda ? `
      <div class="minutes-section">
        <h4>Agenda</h4>
        <div class="detail-content">
          ${escapeHtml(meeting.agenda).split('\n').map(line => `<p>${line}</p>`).join('')}
        </div>
      </div>
    ` : ''}

    ${meeting.participants.length > 0 ? `
      <div class="minutes-section">
        <h4>Participantes</h4>
        <div class="participants-list">
          ${meeting.participants.map(participant => `
            <span class="participant-tag">${escapeHtml(participant)}</span>
          `).join('')}
        </div>
      </div>
    ` : ''}

    ${actions.length > 0 ? `
      <div class="minutes-section">
        <h4>Acciones Acordadas</h4>
        <div class="action-items-minutes">
          ${actions.map(action => `
            <div class="action-item-minutes">
              <p><strong>Acción:</strong> ${escapeHtml(action.text)}</p>
              <p><strong>Responsable:</strong> ${escapeHtml(action.responsible)}</p>
              <p><strong>Plazo:</strong> ${formatDate(action.deadline)}</p>
              <p><strong>Estado:</strong> ${action.completed ? '✅ Completada' : '⏳ Pendiente'}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  document.getElementById('minutes-modal').classList.add('active');
}

function startMeeting(meetingId) {
  if (confirm('¿Estás seguro de que quieres iniciar esta reunión?')) {
    // Aquí iría la lógica para cambiar el estado de la reunión
    showNotification('Reunión iniciada - Puedes comenzar a tomar minutas', 'success');
  }
}

function cancelMeeting(meetingId) {
  if (confirm('¿Estás seguro de que quieres cancelar esta reunión?')) {
    // Aquí iría la lógica para cancelar la reunión
    showNotification('Reunión cancelada', 'info');
  }
}

function addActionItem(meetingId) {
  const text = prompt('Describe la acción:');
  if (!text) return;
  
  const responsible = prompt('Responsable:');
  if (!responsible) return;
  
  const deadline = prompt('Fecha límite (YYYY-MM-DD):');
  if (!deadline) return;

  // Aquí iría la lógica para guardar la acción
  showNotification('Acción agregada exitosamente', 'success');
}

function toggleAction(meetingId, actionId) {
  // Aquí iría la lógica para marcar/desmarcar acción como completada
  showNotification('Estado de acción actualizado', 'success');
}

// Helper functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}