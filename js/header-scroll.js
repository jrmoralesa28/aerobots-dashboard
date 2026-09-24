// =====================================================
// AEROBOTS - HEADER AUTO-HIDE AL HACER SCROLL
// =====================================================

let ultimoScroll = 0;
const umbralScroll = 100;

window.addEventListener('scroll', () => {
    const header = document.querySelector('.header, .header-process');
    if (!header) return;

    const scrollActual = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollActual < umbralScroll) {
        header.classList.remove('hidden');
        ultimoScroll = scrollActual;
        return;
    }

    if (scrollActual > ultimoScroll && scrollActual > umbralScroll) {
        header.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
    }

    ultimoScroll = scrollActual;
});