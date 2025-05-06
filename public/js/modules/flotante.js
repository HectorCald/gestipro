export function flotante() {
    const btnHome = document.querySelector('.flotante .home');
    const btnPefil = document.querySelector('.flotante .perfil');
    const home = document.querySelector('.home-view');
    const perfil = document.querySelector('.perfil-view');

    btnHome.addEventListener('click', () => {
        // Limpiar clases anteriores
        home.classList.remove('slide-out');
        perfil.classList.remove('slide-in');
        
        perfil.classList.add('slide-out');
        setTimeout(() => {
            perfil.style.display = 'none';
            home.style.display = 'flex';
            home.classList.remove('slide-out');
            home.classList.add('slide-in');
        }, 300);
        btnPefil.style.color = 'black';
        btnHome.style.color = 'var(--tercer-color)';
    });

    btnPefil.addEventListener('click', () => {
        // Limpiar clases anteriores
        perfil.classList.remove('slide-out');
        home.classList.remove('slide-in');
        
        home.classList.add('slide-out');
        setTimeout(() => {
            home.style.display = 'none';
            perfil.style.display = 'flex';
            perfil.classList.remove('slide-out');
            perfil.classList.add('slide-in');
        }, 300);
        btnHome.style.color = 'black';
        btnPefil.style.color = 'var(--tercer-color)';
    });
}