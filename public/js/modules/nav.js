export function crearNav() {
    const view = document.querySelector('.nav');
    const nav = `
            <div class="nav-container">
                <button><i class='bx bx-menu'></i></button>
                <div class="info">
                    <h1 class="titulo">Damabrava</h1>
                    <p class="rol">@rol</p>
                </div>
            </div>
    `;
    view.innerHTML = nav;
}