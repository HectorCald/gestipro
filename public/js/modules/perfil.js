export function crearPerfil() {
    const view = document.querySelector('.perfil-view');
    const perfil = `
        <h1 class="titulo"><i class='bx bx-user'></i> Perfil</h1>
        <div class="info">
            <div class="detalles">
                <p class="titulo">Hola!</p>
                <p class="titulo nombre">Hector Ortiz</p>
                <p class="correo-usuario">hi.hector20@gmail.com</p>
            </div>
            <div class="foto">
                <img src="./icons/icon.png" alt="Foto de perfil">
            </div>
        </div>
        <button class="apartado"><i class='bx bx-user'></i> Cuenta</button>
        <button class="apartado"><i class='bx bx-cog'></i> Configuraciones</button>
        <button class="cerrar-sesion"><i class='bx bx-log-out'></i> Cerrar Sesión</button>
        <p class="version">Version 1.0.0</p>
    `;
    view.innerHTML = perfil;
}