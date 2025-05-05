
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
        <button class="apartado cuenta"><i class='bx bx-user'></i> Cuenta</button>
        <button class="apartado configuraciones"><i class='bx bx-cog'></i> Configuraciones</button>
        <button class="cerrar-sesion"><i class='bx bx-log-out'></i> Cerrar Sesión</button>
        <p class="version">Version 1.0.0</p>
    `;
    view.innerHTML = perfil;

    const btnCuenta = document.querySelector('.apartado.cuenta');
    const btnConfiguraciones = document.querySelector('.apartado.configuraciones');
    btnCuenta.addEventListener('click', () => {
        mostrarCuenta();
    });
    btnConfiguraciones.addEventListener('click', () => {
        mostrarConfiguraciones();
    });
}
function mostrarCuenta(){
    const anuncio = document.querySelector('.anuncio');
    const registrationHTML = `
        <div class="contenido">
            <h1 class="bienvenida titulo">Tu cuenta</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <div class="foto-perfil">
                <div class="preview-container">
                    <img src="./icons/icon.png" alt="Vista previa" id="preview-foto">
                    <label for="input-foto" class="upload-overlay">
                        <i class='bx bx-upload'></i>
                    </label>
                </div>
                <input type="file" id="input-foto" accept="image/*" style="display: none;">
            </div>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Nombre</p>
                    <input class="nombre" type="text" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Apellido</p>
                    <input class="nombre" type="text" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-envelope'></i>
                <div class="input">
                    <p class="detalle">Email/Usuario</p>
                    <input class="email-registro" type="email" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-building'></i>
                <div class="input">
                    <p class="detalle">ID de la Empresa</p>
                    <input class="empresa" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <button id="btn-guardar" class="btn green">Guardar cambios</button>
        </div>
        
    `;

    anuncio.innerHTML = registrationHTML;
    mostrarAnuncio();
    evetosCuenta();
}
function evetosCuenta(){
    const inputFoto = document.querySelector('#input-foto');
    const previewFoto = document.querySelector('#preview-foto');

    inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewFoto.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
}


