export function flotante() {
    const btnHome = document.querySelector('.flotante .home');
    const btnPefil = document.querySelector('.flotante .perfil');

    const home = document.querySelector('.home-view');
    const perfil = document.querySelector('.perfil-view');

    btnHome.addEventListener('click', () => {
        perfil.style.display = 'none'; 
        home.style.display = 'flex';
        btnPefil.style.color='black'
        btnHome.style.color='var(--tercer-color)'
    });
    btnPefil.addEventListener('click', () => {
        home.style.display = 'none';
        perfil.style.display = 'flex';
        btnHome.style.color='black'
        btnPefil.style.color='var(--tercer-color)'
    });
}