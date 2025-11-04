// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  updateDashboard();
});

// Actualiza contadores y gráficos
function updateDashboard() {
  const ideas = getIdeas();
  const pitches = getPitches();

  // --- Contadores ---
  document.getElementById('total-ideas').textContent = ideas.length;
  document.getElementById('total-pitches').textContent = pitches.length;

  // --- Distribución por prioridad ---
  const priorities = { Alta:0, Media:0, Baja:0 };
  ideas.forEach(i => priorities[i.priority] = (priorities[i.priority]||0)+1);

  const ctx1 = document.getElementById('priority-chart').getContext('2d');
  if(window.priorityChart) window.priorityChart.destroy();
  window.priorityChart = new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Alta','Media','Baja'],
      datasets:[{
        data: [priorities.Alta, priorities.Media, priorities.Baja],
        backgroundColor:['#ff4d4d','#ffcc00','#4da6ff']
      }]
    }
  });

  // --- Impacto vs Dificultad ---
  const ctx2 = document.getElementById('impact-difficulty-chart').getContext('2d');
  if(window.impactChart) window.impactChart.destroy();
  window.impactChart = new Chart(ctx2, {
    type:'scatter',
    data:{ datasets:[{ 
      label:'Impacto vs Dificultad',
      data: ideas.map(i => ({x:i.impact||0, y:i.difficulty||0})),
      backgroundColor:'#4da6ff'
    }] },
    options:{ 
      scales:{
        x:{ title:{display:true,text:'Impacto'}, min:0, max:10 },
        y:{ title:{display:true,text:'Dificultad'}, min:0, max:10 }
      }
    }
  });

  // --- KPIs básicos en consola (puedes crear tarjetas visuales después) ---
  const avgImpact = ideas.reduce((sum, i) => sum + (i.impact||0),0)/(ideas.length||1);
  const avgDifficulty = ideas.reduce((sum, i) => sum + (i.difficulty||0),0)/(ideas.length||1);
  console.log("Impacto medio:", avgImpact.toFixed(2));
  console.log("Dificultad media:", avgDifficulty.toFixed(2));
  console.log("Distribución por prioridad:", priorities);
}

// dashboard.js - MEJORADO

document.addEventListener('DOMContentLoaded', () => {
  updateDashboard();
  // Actualizar cada 30 segundos por si hay cambios
  setInterval(updateDashboard, 30000);
});

// Actualiza contadores y gráficos - MEJORADO
function updateDashboard() {
  const ideas = getIdeas();
  const pitches = getPitches();

  // --- Contadores Principales ---
  document.getElementById('total-ideas').textContent = ideas.length;
  document.getElementById('total-pitches').textContent = pitches.length;

  // --- Cálculos Avanzados ---
  const priorities = { Alta: 0, Media: 0, Baja: 0 };
  let totalImpact = 0;
  let totalDifficulty = 0;
  let totalScore = 0;
  let highImpactCount = 0;
  let idealOpportunities = 0;
  const tagCounts = {};

  ideas.forEach(idea => {
    // Prioridades
    priorities[idea.priority] = (priorities[idea.priority] || 0) + 1;
    
    // Métricas numéricas
    totalImpact += idea.impact || 0;
    totalDifficulty += idea.difficulty || 0;
    
    // Puntuación
    const score = idea.difficulty > 0 ? (idea.impact / idea.difficulty) : idea.impact;
    totalScore += score;
    
    // Conteos especiales
    if (idea.impact >= 8) highImpactCount++;
    if (idea.impact >= 7 && idea.difficulty <= 3) idealOpportunities++;
    
    // Etiquetas
    idea.tags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const avgImpact = ideas.length > 0 ? totalImpact / ideas.length : 0;
  const avgDifficulty = ideas.length > 0 ? totalDifficulty / ideas.length : 0;
  const avgScore = ideas.length > 0 ? totalScore / ideas.length : 0;

  // --- Actualizar Estadísticas ---
  document.getElementById('avg-impact').textContent = avgImpact.toFixed(1);
  document.getElementById('avg-difficulty').textContent = avgDifficulty.toFixed(1);
  document.getElementById('avg-score').textContent = avgScore.toFixed(1);
  document.getElementById('high-impact-count').textContent = highImpactCount;
  document.getElementById('ideal-opportunities').textContent = idealOpportunities;
  document.getElementById('total-tags').textContent = Object.keys(tagCounts).length;

  // --- Actualizar Leyendas ---
  document.getElementById('count-alta').textContent = priorities.Alta;
  document.getElementById('count-media').textContent = priorities.Media;
  document.getElementById('count-baja').textContent = priorities.Baja;

  // --- Actualizar Progress Bars ---
  document.getElementById('score-progress').style.width = `${(avgScore / 5) * 100}%`;
  document.getElementById('score-progress').parentElement.nextElementSibling.textContent = `${avgScore.toFixed(1)}/5`;

  const highImpactPercent = ideas.length > 0 ? (highImpactCount / ideas.length) * 100 : 0;
  document.getElementById('high-impact-progress').style.width = `${highImpactPercent}%`;
  document.getElementById('high-impact-percent').textContent = `${highImpactPercent.toFixed(0)}%`;

  const idealPercent = ideas.length > 0 ? (idealOpportunities / ideas.length) * 100 : 0;
  document.getElementById('ideal-progress').style.width = `${idealPercent}%`;
  document.getElementById('ideal-percent').textContent = `${idealPercent.toFixed(0)}%`;

  // --- Etiquetas Populares ---
  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const tagsContainer = document.getElementById('popular-tags');
  if (popularTags.length > 0) {
    tagsContainer.innerHTML = popularTags.map(([tag, count]) => 
      `<span class="tag">${tag} (${count})</span>`
    ).join('');
  } else {
    tagsContainer.innerHTML = '<span class="loading-tags">No hay etiquetas aún</span>';
  }

  // --- Gráfico de Prioridades ---
  const ctx1 = document.getElementById('priority-chart').getContext('2d');
  if (window.priorityChart) window.priorityChart.destroy();
  
  window.priorityChart = new Chart(ctx1, {
    type: 'doughnut',
    data: {
      labels: ['Alta Prioridad', 'Media Prioridad', 'Baja Prioridad'],
      datasets: [{
        data: [priorities.Alta, priorities.Media, priorities.Baja],
        backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
        borderColor: ['#dc2626', '#d97706', '#059669'],
        borderWidth: 2,
        hoverOffset: 8
      }]
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
          borderWidth: 1
        }
      },
      cutout: '60%'
    }
  });

  // --- Gráfico de Dispersión ---
  const ctx2 = document.getElementById('impact-difficulty-chart').getContext('2d');
  if (window.impactChart) window.impactChart.destroy();
  
  window.impactChart = new Chart(ctx2, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Ideas',
        data: ideas.map(i => ({
          x: i.impact || 0,
          y: i.difficulty || 0,
          priority: i.priority
        })),
        backgroundColor: ideas.map(i => {
          switch (i.priority) {
            case 'Alta': return '#ef4444';
            case 'Media': return '#f59e0b';
            case 'Baja': return '#10b981';
            default: return '#6b7280';
          }
        }),
        borderColor: ideas.map(i => {
          switch (i.priority) {
            case 'Alta': return '#dc2626';
            case 'Media': return '#d97706';
            case 'Baja': return '#059669';
            default: return '#4b5563';
          }
        }),
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Impacto',
            color: '#cbd5e1'
          },
          min: 0,
          max: 10,
          grid: {
            color: 'rgba(71, 85, 105, 0.3)'
          },
          ticks: {
            color: '#94a3b8'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Dificultad',
            color: '#cbd5e1'
          },
          min: 0,
          max: 10,
          grid: {
            color: 'rgba(71, 85, 105, 0.3)'
          },
          ticks: {
            color: '#94a3b8'
          }
        }
      },
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
              const point = context.raw;
              return `Impacto: ${point.x}, Dificultad: ${point.y}, Prioridad: ${point.priority}`;
            }
          }
        }
      }
    }
  });

  // --- Insights Automáticos ---
  generateInsights(ideas, pitches, {
    avgImpact,
    avgDifficulty,
    avgScore,
    highImpactCount,
    idealOpportunities,
    priorities
  });
}

// Generar insights automáticos
function generateInsights(ideas, pitches, metrics) {
  const focusRecommendation = document.getElementById('focus-recommendation');
  const improvementArea = document.getElementById('improvement-area');
  const nextSteps = document.getElementById('next-steps');

  // Insight 1: Enfoque Recomendado
  if (metrics.idealOpportunities > 0) {
    focusRecommendation.textContent = `Enfócate en tus ${metrics.idealOpportunities} ideas de alto impacto y baja dificultad. Son tus mejores oportunidades inmediatas.`;
  } else if (metrics.highImpactCount > 0) {
    focusRecommendation.textContent = `Prioriza tus ${metrics.highImpactCount} ideas de alto impacto. Considera formas de reducir su dificultad de implementación.`;
  } else if (ideas.length > 0) {
    focusRecommendation.textContent = 'Tus ideas tienen buen balance. Considera desarrollar más ideas de alto impacto.';
  } else {
    focusRecommendation.textContent = 'Comienza añadiendo tus primeras ideas para obtener recomendaciones personalizadas.';
  }

  // Insight 2: Área de Mejora
  if (metrics.avgScore < 1) {
    improvementArea.textContent = 'Tus ideas tienden a ser más difíciles que impactantes. Enfócate en identificar problemas que requieran soluciones más simples.';
  } else if (metrics.avgScore > 3) {
    improvementArea.textContent = '¡Excelente! Tus ideas tienen gran relación impacto/dificultad. Sigue este patrón.';
  } else {
    improvementArea.textContent = 'Balance saludable. Considera experimentar con ideas más ambiciosas (alto impacto, alta dificultad).';
  }

  // Insight 3: Siguientes Pasos
  if (pitches.length === 0 && ideas.length > 0) {
    nextSteps.textContent = 'Convierte tus mejores ideas en pitches profesionales para compartir con stakeholders.';
  } else if (ideas.length < 5) {
    nextSteps.textContent = 'Continúa capturando ideas. La diversidad de oportunidades es clave para el éxito.';
  } else {
    nextSteps.textContent = 'Revisa y actualiza regularmente tus ideas. Las mejores oportunidades evolucionan con el tiempo.';
  }
}

// Función auxiliar para obtener pitches (debe estar en services.js)
function getPitches() {
  return JSON.parse(localStorage.getItem('pitches') || "[]");
}

// Función auxiliar para obtener ideas (debe estar en services.js)
function getIdeas() {
  const ideas = JSON.parse(localStorage.getItem('ideas') || "[]");
  return ideas.map(idea => ({
    ...idea,
    impact: idea.impact || 5,
    difficulty: idea.difficulty || 5,
    priority: idea.priority || 'Media',
    tags: Array.isArray(idea.tags) ? idea.tags : []
  }));
}