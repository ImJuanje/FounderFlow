// Gestor de Ideas - Funcionalidad MEJORADA
document.addEventListener('DOMContentLoaded', function() {
    const ideaForm = document.getElementById('idea-form');
    const ideasTableBody = document.getElementById('ideas-table-body');
    const filterPriority = document.getElementById('filter-priority');
    const filterTags = document.getElementById('filter-tags');
    const filterScore = document.getElementById('filter-score');
    const sortIdeas = document.getElementById('sort-ideas');
    const totalIdeas = document.getElementById('total-ideas');
    const highPriority = document.getElementById('high-priority');

    // Guardar/leer en localStorage - MEJORADO
    function saveToLocal(key, data) {
        const existing = JSON.parse(localStorage.getItem(key) || "[]");
        const ideaData = {
            ...data,
            id: Date.now(),
            createdAt: new Date().toISOString(),
            score: data.difficulty > 0 ? (data.impact / data.difficulty).toFixed(1) : data.impact.toFixed(1)
        };
        existing.push(ideaData);
        localStorage.setItem(key, JSON.stringify(existing));
        return ideaData;
    }

    function getFromLocal(key) {
        const data = JSON.parse(localStorage.getItem(key) || "[]");
        // Asegurar estructura compatible
        return data.map(idea => ({
            id: idea.id || Date.now(),
            title: idea.title || '',
            description: idea.description || '',
            tags: Array.isArray(idea.tags) ? idea.tags : [],
            priority: idea.priority || 'Media',
            impact: idea.impact || 5,
            difficulty: idea.difficulty || 5,
            score: idea.score || (idea.difficulty > 0 ? (idea.impact / idea.difficulty).toFixed(1) : idea.impact.toFixed(1)),
            createdAt: idea.createdAt || new Date().toISOString()
        }));
    }

    // Mostrar tabla - MEJORADO
    function loadIdeas() {
        const ideas = getFromLocal('ideas');
        const priorityFilter = filterPriority.value;
        const tagFilter = filterTags.value.toLowerCase();
        const scoreFilter = parseFloat(filterScore.value);
        const sortBy = sortIdeas.value;

        // Aplicar filtros
        let filteredIdeas = ideas.filter(idea => {
            const tagsArray = idea.tags.map(t => t.toLowerCase());
            const score = parseFloat(idea.score);
            
            if (priorityFilter && idea.priority !== priorityFilter) return false;
            if (tagFilter && !tagsArray.some(t => t.includes(tagFilter))) return false;
            if (scoreFilter && score < scoreFilter) return false;
            
            return true;
        });

        // Aplicar ordenamiento
        filteredIdeas.sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return parseFloat(b.score) - parseFloat(a.score);
                case 'impact':
                    return b.impact - a.impact;
                case 'difficulty':
                    return a.difficulty - b.difficulty;
                case 'priority':
                    const priorityOrder = { 'Alta': 3, 'Media': 2, 'Baja': 1 };
                    return priorityOrder[b.priority] - priorityOrder[a.priority];
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        ideasTableBody.innerHTML = '';

        if (filteredIdeas.length === 0) {
            ideasTableBody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="7">
                        <i class="fas fa-lightbulb"></i>
                        <p>No se encontraron ideas</p>
                        <small>Prueba ajustando los filtros o añade nuevas ideas</small>
                    </td>
                </tr>
            `;
        } else {
            filteredIdeas.forEach(idea => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${escapeHtml(idea.title)}</strong></td>
                    <td>${escapeHtml(idea.description)}</td>
                    <td>
                        <div class="tags-container">
                            ${idea.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    </td>
                    <td><span class="priority-badge ${idea.priority.toLowerCase()}">${idea.priority}</span></td>
                    <td>
                        <div class="rating-display">
                            <span class="rating-number">${idea.impact}</span>
                            <div class="rating-bar">
                                <div class="rating-fill" style="width: ${(idea.impact / 10) * 100}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="rating-display">
                            <span class="rating-number">${idea.difficulty}</span>
                            <div class="rating-bar">
                                <div class="rating-fill" style="width: ${(idea.difficulty / 10) * 100}%"></div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <div class="score-display ${getScoreClass(idea.score)}">
                            ${parseFloat(idea.score).toFixed(1)}
                        </div>
                    </td>
                `;
                ideasTableBody.appendChild(row);
            });
        }

        // Actualizar estadísticas
        updateStats(ideas, filteredIdeas);
    }

    function getScoreClass(score) {
        const numScore = parseFloat(score);
        if (numScore >= 3) return 'high-score';
        if (numScore >= 1.5) return 'medium-score';
        return 'low-score';
    }

    function updateStats(allIdeas, filteredIdeas) {
        totalIdeas.textContent = `${filteredIdeas.length} ${filteredIdeas.length === 1 ? 'idea' : 'ideas'}`;
        const highPriorityCount = allIdeas.filter(idea => idea.priority === 'Alta').length;
        highPriority.textContent = `${highPriorityCount} ${highPriorityCount === 1 ? 'alta prioridad' : 'altas prioridades'}`;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Añadir idea - MEJORADO
    ideaForm.addEventListener('submit', e => {
        e.preventDefault();

        const title = document.getElementById('idea-title').value.trim();
        const description = document.getElementById('idea-description').value.trim();
        const tags = document.getElementById('idea-tags').value
                     .split(',')
                     .map(t => t.trim())
                     .filter(t => t);
        const priority = document.getElementById('idea-priority').value;
        const impact = parseInt(document.getElementById('idea-impact').value) || 5;
        const difficulty = parseInt(document.getElementById('idea-difficulty').value) || 5;

        if (!title || !description) {
            alert('Por favor completa título y descripción.');
            return;
        }

        saveToLocal('ideas', { title, description, tags, priority, impact, difficulty });
        ideaForm.reset();
        
        // Restablecer sliders visualmente
        setTimeout(() => {
            updateScore(); // Actualizar puntuación
            loadIdeas();   // Recargar tabla
        }, 100);
    });

    // Sistema de puntuación en tiempo real
    function updateScore() {
        const impact = parseInt(document.getElementById('idea-impact').value) || 5;
        const difficulty = parseInt(document.getElementById('idea-difficulty').value) || 5;
        const score = difficulty > 0 ? (impact / difficulty).toFixed(1) : impact.toFixed(1);
        
        document.getElementById('impact-value').textContent = impact;
        document.getElementById('difficulty-value').textContent = difficulty;
        document.getElementById('idea-score').textContent = score;

        // Color según puntuación
        const scoreElement = document.getElementById('idea-score');
        const descriptionElement = document.getElementById('score-description');
        
        scoreElement.className = 'score-value';
        if (score >= 3) {
            scoreElement.classList.add('high-score');
            descriptionElement.textContent = '¡Excelente oportunidad!';
        } else if (score >= 1.5) {
            scoreElement.classList.add('medium-score');
            descriptionElement.textContent = 'Buena relación esfuerzo/beneficio';
        } else {
            scoreElement.classList.add('low-score');
            descriptionElement.textContent = 'Considera si vale la pena el esfuerzo';
        }
    }

    // Event listeners para sliders
    document.getElementById('idea-impact').addEventListener('input', updateScore);
    document.getElementById('idea-difficulty').addEventListener('input', updateScore);

    // Filtros - MEJORADO
    filterPriority.addEventListener('change', loadIdeas);
    filterTags.addEventListener('input', loadIdeas);
    filterScore.addEventListener('change', loadIdeas);
    sortIdeas.addEventListener('change', loadIdeas);

    // Inicializar
    updateScore();
    loadIdeas();
});