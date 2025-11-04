// networking.js - Sistema de Networking Mejorado

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');
  const contactsContainer = document.getElementById('contacts-container');
  const filterTagsInput = document.getElementById('filter-tags');
  const filterRoleSelect = document.getElementById('filter-role');
  const sortContactsSelect = document.getElementById('sort-contacts');
  const totalContactsElement = document.getElementById('total-contacts');
  const pendingFollowupsElement = document.getElementById('pending-followups');

  let contacts = JSON.parse(localStorage.getItem('contacts')) || [];

  renderContacts();
  updateStats();

  form.addEventListener('submit', e => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const role = document.getElementById('role').value;
    const company = document.getElementById('company').value.trim();
    const tags = document.getElementById('tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const lastContact = document.getElementById('lastContact').value;
    const nextFollowUp = document.getElementById('nextFollowUp').value;
    const notes = document.getElementById('notes').value.trim();

    if (!name || !email) {
      showNotification('Nombre y email son obligatorios', 'error');
      return;
    }

    const newContact = {
      id: Date.now(),
      name,
      email,
      role,
      company,
      tags,
      lastContact,
      nextFollowUp,
      notes,
      createdAt: new Date().toISOString()
    };

    contacts.push(newContact);
    localStorage.setItem('contacts', JSON.stringify(contacts));

    form.reset();
    renderContacts();
    updateStats();
    showNotification('Contacto agregado exitosamente', 'success');
  });

  // Event listeners for filters
  filterTagsInput.addEventListener('input', renderContacts);
  filterRoleSelect.addEventListener('change', renderContacts);
  sortContactsSelect.addEventListener('change', renderContacts);

  function renderContacts() {
    const filterTag = filterTagsInput.value.trim().toLowerCase();
    const filterRole = filterRoleSelect.value;
    const sortBy = sortContactsSelect.value;

    let filteredContacts = contacts.filter(contact => {
      // Filter by tag
      if (filterTag && !contact.tags.some(t => t.toLowerCase().includes(filterTag))) {
        return false;
      }
      
      // Filter by role
      if (filterRole && contact.role !== filterRole) {
        return false;
      }
      
      return true;
    });

    // Sort contacts
    filteredContacts.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return new Date(b.lastContact || b.createdAt) - new Date(a.lastContact || a.createdAt);
        case 'followup':
          if (!a.nextFollowUp && !b.nextFollowUp) return 0;
          if (!a.nextFollowUp) return 1;
          if (!b.nextFollowUp) return -1;
          return new Date(a.nextFollowUp) - new Date(b.nextFollowUp);
        case 'role':
          return (a.role || '').localeCompare(b.role || '');
        default:
          return 0;
      }
    });

    if (filteredContacts.length === 0) {
      contactsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-address-book"></i>
          <p>No se encontraron contactos</p>
          <small>Prueba ajustando los filtros o agrega nuevos contactos</small>
        </div>
      `;
      return;
    }

    contactsContainer.innerHTML = filteredContacts.map(contact => {
      const initials = getInitials(contact.name);
      const followupStatus = getFollowupStatus(contact.nextFollowUp);
      const daysUntilFollowup = getDaysUntilFollowup(contact.nextFollowUp);
      
      return `
        <div class="contact-card ${followupStatus.class} new-contact" data-contact-id="${contact.id}">
          <div class="contact-header">
            <div class="contact-avatar">${initials}</div>
            <div class="contact-info">
              <div class="contact-name">${escapeHtml(contact.name)}</div>
              <div class="contact-email">${escapeHtml(contact.email)}</div>
              ${contact.role ? `<span class="contact-role role-${contact.role}">${getRoleDisplayName(contact.role)}</span>` : ''}
            </div>
          </div>

          <div class="contact-details">
            ${contact.company ? `
              <div class="detail-item">
                <i class="fas fa-building detail-icon"></i>
                <div class="detail-content">
                  <span class="detail-label">Empresa:</span>
                  ${escapeHtml(contact.company)}
                </div>
              </div>
            ` : ''}
            
            ${contact.lastContact ? `
              <div class="detail-item">
                <i class="fas fa-calendar-check detail-icon"></i>
                <div class="detail-content">
                  <span class="detail-label">Último contacto:</span>
                  ${formatDate(contact.lastContact)}
                </div>
              </div>
            ` : ''}
            
            ${contact.nextFollowUp ? `
              <div class="detail-item">
                <i class="fas fa-bell detail-icon"></i>
                <div class="detail-content">
                  <span class="detail-label">Próximo seguimiento:</span>
                  ${formatDate(contact.nextFollowUp)}
                  ${daysUntilFollowup !== null ? `
                    <div class="followup-status ${followupStatus.class}">
                      <i class="fas ${followupStatus.icon}"></i>
                      ${followupStatus.text}
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            
            ${contact.notes ? `
              <div class="detail-item">
                <i class="fas fa-sticky-note detail-icon"></i>
                <div class="detail-content">
                  <span class="detail-label">Notas:</span>
                  ${escapeHtml(contact.notes)}
                </div>
              </div>
            ` : ''}
          </div>

          ${contact.tags.length > 0 ? `
            <div class="contact-tags">
              ${contact.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
            </div>
          ` : ''}

          <div class="contact-actions">
            <button class="action-btn" onclick="sendEmail('${contact.email}')">
              <i class="fas fa-envelope"></i>
              Email
            </button>
            <button class="action-btn" onclick="scheduleFollowup('${contact.id}')">
              <i class="fas fa-calendar-plus"></i>
              Programar
            </button>
            <button class="action-btn primary" onclick="logInteraction('${contact.id}')">
              <i class="fas fa-comment"></i>
              Registrar
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateStats() {
    totalContactsElement.textContent = `${contacts.length} ${contacts.length === 1 ? 'contacto' : 'contactos'}`;
    
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const pendingFollowups = contacts.filter(contact => {
      if (!contact.nextFollowUp) return false;
      const followupDate = new Date(contact.nextFollowUp);
      return followupDate <= nextWeek;
    }).length;
    
    pendingFollowupsElement.textContent = `${pendingFollowups} ${pendingFollowups === 1 ? 'seguimiento pendiente' : 'seguimientos pendientes'}`;
  }

  function getInitials(name) {
    return name.split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  function getFollowupStatus(nextFollowUp) {
    if (!nextFollowUp) return { class: '', icon: '', text: '' };
    
    const today = new Date();
    const followupDate = new Date(nextFollowUp);
    const daysDiff = Math.ceil((followupDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      return { class: 'urgent', icon: 'fa-exclamation-triangle', text: 'Vencido' };
    } else if (daysDiff <= 3) {
      return { class: 'urgent', icon: 'fa-exclamation-circle', text: `En ${daysDiff} días` };
    } else if (daysDiff <= 7) {
      return { class: 'upcoming', icon: 'fa-clock', text: `En ${daysDiff} días` };
    } else {
      return { class: 'on-track', icon: 'fa-check-circle', text: `En ${daysDiff} días` };
    }
  }

  function getDaysUntilFollowup(nextFollowUp) {
    if (!nextFollowUp) return null;
    const today = new Date();
    const followupDate = new Date(nextFollowUp);
    return Math.ceil((followupDate - today) / (1000 * 60 * 60 * 24));
  }

  function getRoleDisplayName(role) {
    const roleNames = {
      'inversor': 'Inversor',
      'mentor': 'Mentor',
      'cliente': 'Cliente',
      'cliente-potencial': 'Cliente Potencial',
      'partner': 'Partner',
      'referencia-tecnica': 'Referencia Técnica',
      'advisor': 'Advisor',
      'colega': 'Colega',
      'otro': 'Otro'
    };
    return roleNames[role] || role;
  }

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

  function showNotification(message, type = 'info') {
    // Implementation similar to OKR notifications
    console.log(`${type}: ${message}`);
    // En un entorno real, aquí iría el código de notificaciones
    alert(message); // Temporal para demostración
  }
});

// Funciones globales para los botones de acción
function sendEmail(email) {
  window.location.href = `mailto:${email}`;
}

function scheduleFollowup(contactId) {
  const newDate = prompt('Ingresa la nueva fecha para el seguimiento (YYYY-MM-DD):');
  if (newDate) {
    // Aquí iría la lógica para actualizar la fecha en localStorage
    console.log(`Programando seguimiento para contacto ${contactId} en ${newDate}`);
  }
}

function logInteraction(contactId) {
  const notes = prompt('Registra notas de la interacción:');
  if (notes) {
    // Aquí iría la lógica para guardar las notas en localStorage
    console.log(`Registrando interacción para contacto ${contactId}: ${notes}`);
  }
}