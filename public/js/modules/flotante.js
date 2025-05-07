export function flotante() {
    const btnHome = document.querySelector('.flotante .home');
    const btnPefil = document.querySelector('.flotante .perfil');
    const home = document.querySelector('.home-view');
    const perfil = document.querySelector('.perfil-view');

    btnHome.addEventListener('click', () => {
        // Limpiar clases anteriores
        home.classList.remove('slide-out-flotante');
        perfil.classList.remove('slide-in-flotante');

        perfil.classList.add('slide-out-flotante');
        setTimeout(() => {
            perfil.style.display = 'none';
            home.style.display = 'flex';
            home.classList.remove('slide-out-flotante');
            home.classList.add('slide-in-flotante');

            // Agregar un pequeño retraso para el scroll
            setTimeout(() => {
                home.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }, 300);
        btnPefil.style.color = 'var(--text)';
        btnHome.style.color = 'var(--tercer-color)';
    });

    btnPefil.addEventListener('click', () => {
        // Limpiar clases anteriores
        perfil.classList.remove('slide-out-flotante');
        home.classList.remove('slide-in-flotante');

        home.classList.add('slide-out-flotante');
        setTimeout(() => {
            home.style.display = 'none';
            perfil.style.display = 'flex';
            perfil.classList.remove('slide-out-flotante');
            perfil.classList.add('slide-in-flotante');
        }, 300);
        btnHome.style.color = 'var(--text)';
        btnPefil.style.color = 'var(--tercer-color)';
    });
}