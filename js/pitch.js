const pitchForm = document.getElementById('pitch-form');
const pitchTableBody = document.getElementById('pitch-table-body');
const exportBtn = document.getElementById('export-pdf-btn');
const { jsPDF } = window.jspdf;

// Función para guardar en localStorage
function saveToLocal(key, data) {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(data);
  localStorage.setItem(key, JSON.stringify(existing));
}

function getFromLocal(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

// Mostrar tabla al iniciar
function loadPitches() {
  const pitches = getFromLocal('pitches');
  pitchTableBody.innerHTML = '';
  pitches.forEach(p => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${p.problema}</td>
      <td>${p.solucion}</td>
      <td>${p.publico}</td>
      <td>${p.monetizacion}</td>
    `;
    pitchTableBody.appendChild(row);
  });
}

// Enviar formulario
pitchForm.addEventListener('submit', e => {
  e.preventDefault();

  const problema = document.getElementById('pitch-problema').value.trim();
  const solucion = document.getElementById('pitch-solucion').value.trim();
  const publico = document.getElementById('pitch-publico').value.trim();
  const monetizacion = document.getElementById('pitch-monetizacion').value.trim();

  if (!problema || !solucion || !publico || !monetizacion) {
    alert('Por favor completa todos los campos.');
    return;
  }

  saveToLocal('pitches', { problema, solucion, publico, monetizacion });
  loadPitches();
  pitchForm.reset();
});

// Exportar a PDF
exportBtn.addEventListener('click', () => {
  const pitches = getFromLocal('pitches');
  if (pitches.length === 0) {
    alert('No hay pitches para exportar.');
    return;
  }

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text('Mis Pitches de Negocio', 14, 20);
  doc.setFontSize(12);

  let y = 30;
  pitches.forEach((p, i) => {
    doc.text(`Pitch ${i + 1}`, 14, y);
    y += 6;
    doc.text(`Problema: ${p.problema}`, 14, y);
    y += 6;
    doc.text(`Solución: ${p.solucion}`, 14, y);
    y += 6;
    doc.text(`Público: ${p.publico}`, 14, y);
    y += 6;
    doc.text(`Monetización: ${p.monetizacion}`, 14, y);
    y += 10;
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save('mis_pitches.pdf');
});

// Cargar tabla al inicio
loadPitches();
