// product.js - Sistema de pestañas para la página de producto

document.addEventListener('DOMContentLoaded', function() {
  // Sistema de pestañas
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Función para cambiar de pestaña
  function switchTab(targetTab) {
    // Remover clase active de todos los botones y contenidos
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Activar el botón y contenido seleccionado
    const selectedBtn = document.querySelector(`[data-target="${targetTab}"]`);
    const selectedContent = document.getElementById(targetTab);

    if (selectedBtn && selectedContent) {
      selectedBtn.classList.add('active');
      selectedContent.classList.add('active');
    }
  }

  // Event listeners para los botones de pestañas
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-target');
      switchTab(targetTab);
    });
  });

  // Efectos de hover para tarjetas de precios
  const pricingCards = document.querySelectorAll('.pricing-card');
  pricingCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transform = this.classList.contains('featured') 
        ? 'scale(1.05) translateY(-5px)' 
        : 'translateY(-5px)';
    });

    card.addEventListener('mouseleave', function() {
      this.style.transform = this.classList.contains('featured') 
        ? 'scale(1.05)' 
        : 'none';
    });
  });

  // Smooth scroll para elementos internos (si los hay)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Efecto de aparición para elementos al hacer scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observar elementos para animaciones
  document.querySelectorAll('.feature-item, .pricing-card, .security-item, .timeline-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
});