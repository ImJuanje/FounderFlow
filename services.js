function saveToLocal(key, data) {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.push(data);
  localStorage.setItem(key, JSON.stringify(existing));
}

function getFromLocal(key) {
  return JSON.parse(localStorage.getItem(key) || "[]");
}

//DASHBOARD

// --- Ideas ---
function getIdeas() {
  return JSON.parse(localStorage.getItem('ideas') || "[]");
}

function saveIdea(idea) {
  const ideas = getIdeas();
  ideas.push(idea);
  localStorage.setItem('ideas', JSON.stringify(ideas));
}

// --- Pitches ---
function getPitches() {
  return JSON.parse(localStorage.getItem('pitches') || "[]");
}

function savePitch(pitch) {
  const pitches = getPitches();
  pitches.push(pitch);
  localStorage.setItem('pitches', JSON.stringify(pitches));
}
