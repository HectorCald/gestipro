import { mostrarCarga } from "./componentes";


export function crearPerfil() {
    const view = document.querySelector('.perfil-view');
    obtenerYMostrarUsuario(view);
}
async function obtenerYMostrarUsuario(view) {
    try {
        const response = await fetch('/obtener-usuario-actual');
        const data = await response.json();
        
        if (data.success) {
            const nombreCompleto = data.usuario.nombre.split(' ');
            const nombre = nombreCompleto[0] || '';
            const apellido = nombreCompleto[1] || '';
            
            const perfil = `
                <h1 class="titulo"><i class='bx bx-user'></i> Perfil</h1>
                <div class="info">
                    <div class="detalles">
                        <p class="titulo">Hola!</p>
                        <p class="titulo nombre">${nombre} ${apellido}</p>
                        <p class="correo-usuario">${data.usuario.email}</p>
                    </div>
                    <div class="foto">
                        <img src="${data.usuario.foto}" alt="Foto de perfil">
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
                mostrarCuenta(nombre, apellido, data.usuario.email, data.usuario.foto);
            });
            btnConfiguraciones.addEventListener('click', () => {
                mostrarConfiguraciones();
            });
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
    }
}
function mostrarCuenta(nombre, apellido, email, foto){
    const anuncio = document.querySelector('.anuncio');
    const registrationHTML = `
        <div class="contenido">
            <h1 class="bienvenida titulo">Tu cuenta</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <div class="foto-perfil">
                <div class="preview-container">
                    <img src="${foto}" alt="Vista previa" id="preview-foto">
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
                    <input class="nombre" type="text" value="${nombre}" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Apellido</p>
                    <input class="nombre" type="text" value="${apellido}" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-envelope'></i>
                <div class="input">
                    <p class="detalle">Email/Usuario</p>
                    <input class="email-registro" type="email" value="${email}" placeholder=" " required>
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
    const btnGuardar = document.querySelector('#btn-guardar');
    let fotoBase64 = previewFoto.src; // Store current photo

    inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fotoBase64 = e.target.result;
                previewFoto.src = fotoBase64;
            };
            reader.readAsDataURL(file);
        }
    });

    btnGuardar.addEventListener('click', async () => {
        const nombre = document.querySelector('input.nombre').value;
        const apellido = document.querySelectorAll('input.nombre')[1].value;
        const email = document.querySelector('input.email-registro').value;

        try {
            
            const response = await fetch('/actualizar-usuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    nuevoEmail: email,
                    foto: fotoBase64
                })
            });

            const data = await response.json();

            if (data.success) {
                // Refresh the profile view
                const view = document.querySelector('.perfil-view');
                obtenerYMostrarUsuario(view);
                ocultarAnuncio();
                crearNotificacion('success', 'Perfil actualizado correctamente');
            } else {
                crearNotificacion('error', data.error || 'Error al actualizar el perfil');
            }
        } catch (error) {
            console.error('Error:', error);
            crearNotificacion('error', 'Error al actualizar el perfil');
        }finally{
          
        }
    });
}

