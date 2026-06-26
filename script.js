// ─────────────────────────────────────────────────────────
//  ResiRamos — script.js
//  Responsável por: lógica dos carrosséis dos cards
// ─────────────────────────────────────────────────────────

// 1. Seleciona TODOS os carrosséis da página de uma vez
const carousels = document.querySelectorAll('.carousel');

// 2. Para cada carrossel, configura sua lógica de forma independente
carousels.forEach(carousel => {

    // Pega os elementos internos deste carrossel específico
    const track  = carousel.querySelector('.carousel-track');
    const images = carousel.querySelectorAll('.carousel-track img');
    const dots   = carousel.querySelectorAll('.dot');
    const btnPrev = carousel.querySelector('.carousel-btn.prev');
    const btnNext = carousel.querySelector('.carousel-btn.next');

    // Guarda qual foto está sendo exibida (começa na 0)
    let currentIndex = 0;
    const total = images.length; // = 3 em todos os cards

    // ── Função principal: move o carrossel para o índice desejado ──
    function goTo(index) {

        // Garante que o índice não saia do intervalo [0, total-1]
        // Se passar do último, volta pro primeiro (efeito "circular")
        if (index >= total) index = 0;
        if (index < 0)      index = total - 1;

        currentIndex = index;

        // Move o track horizontalmente: cada "passo" = 100% da largura
        // Ex: índice 1 → translateX(-100%), índice 2 → translateX(-200%)
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Atualiza os pontinhos: remove 'active' de todos, coloca no atual
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }

    // ── Eventos das setas ──
    btnNext.addEventListener('click', () => goTo(currentIndex + 1));
    btnPrev.addEventListener('click', () => goTo(currentIndex - 1));

    // ── Eventos dos pontinhos (clique direto em qualquer ponto) ──
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goTo(i));
    });

    // ── Suporte a swipe (toque em celular) ──
    let touchStartX = 0;

    carousel.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    });

    carousel.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;

        // Só considera swipe se o dedo se moveu mais de 40px
        if (Math.abs(diff) > 40) {
            if (diff > 0) {
                goTo(currentIndex + 1); // swipe para esquerda → próxima
            } else {
                goTo(currentIndex - 1); // swipe para direita → anterior
            }
        }
    });

});
