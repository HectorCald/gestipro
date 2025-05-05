

export function crearPerfil() {
    const view = document.querySelector('.perfil-view');
    obtenerYMostrarUsuario(view);
}

async function obtenerYMostrarUsuario(view) {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-usuario-actual');
        const data = await response.json();
        
        if (data.success) {
            const nombreCompleto = data.usuario.nombre.split(' ');
            const nombre = nombreCompleto[0] || '';
            const apellido = nombreCompleto[1] || '';
            
            let fotoSrc;
            if (!data.usuario.foto || data.usuario.foto === './icons/icon.png') {
                fotoSrc = './icons/icon.png';
            } else if (data.usuario.foto.startsWith('data:image')) {
                fotoSrc = data.usuario.foto;
            } else {
                try {
                    const imgResponse = await fetch(data.usuario.foto);
                    if (!imgResponse.ok) throw new Error('Error al cargar la imagen');
                    const blob = await imgResponse.blob();
                    fotoSrc = URL.createObjectURL(blob);
                } catch (error) {
                    console.error('Error loading image:', error);
                    fotoSrc = './icons/icon.png';
                }
            }
            
            const perfil = `
                <h1 class="titulo"><i class='bx bx-user'></i> Perfil</h1>
                <div class="info">
                    <div class="detalles">
                        <p class="titulo">Hola!</p>
                        <p class="titulo nombre">${nombre} ${apellido}</p>
                        <p class="correo-usuario">${data.usuario.email}</p>
                    </div>
                    <div class="foto">
                        <img src="${fotoSrc}" alt="Foto de perfil" class="foto-perfil-img" onerror="this.src='./icons/icon.png'">
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
            const btnCerrarSesion = document.querySelector('.cerrar-sesion');

            btnCuenta.addEventListener('click', () => {
                mostrarCuenta(nombre, apellido, data.usuario.email, fotoSrc);
            });

            btnConfiguraciones.addEventListener('click', () => {
                mostrarConfiguraciones();
            });

            btnCerrarSesion.addEventListener('click', async () => {
                try {
                    const response = await fetch('/logout', { method: 'POST' });
                    if (response.ok) {
                        window.location.href = '/';
                    }
                } catch (error) {
                    console.error('Error al cerrar sesión:', error);
                    mostrarNotificacion({
                        message: 'Error al cerrar sesión',
                        type: 'error',
                        duration: 3500
                    });
                }
            });
        } else {
            mostrarNotificacion({
                message: 'Error al obtener datos del usuario',
                type: 'error',
                duration: 3500
            });
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        mostrarNotificacion({
            message: 'Error al obtener datos del usuario',
            type: 'error',
            duration: 3500
        });
    }finally{
        ocultarCarga();
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
    let fotoBase64 = null;
    let fotoModificada = false;

    // Initialize current photo
    const currentPhoto = previewFoto.src;
    if (currentPhoto.startsWith('data:image')) {
        fotoBase64 = currentPhoto;
    } else if (currentPhoto.startsWith('http') || currentPhoto.startsWith('./')) {
        fetch(currentPhoto)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    fotoBase64 = reader.result;
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('Error loading current photo:', error);
                fotoBase64 = null;
            });
    }

    inputFoto.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5242880) { // 5MB limit
                mostrarNotificacion({
                    message: 'La imagen debe ser menor a 5MB',
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                fotoBase64 = e.target.result;
                previewFoto.src = fotoBase64;
                fotoModificada = true;
            };
            reader.onerror = () => {
                mostrarNotificacion({
                    message: 'Error al cargar la imagen',
                    type: 'error',
                    duration: 3500
                });
            };
            reader.readAsDataURL(file);
        }
    });

    btnGuardar.addEventListener('click', async () => {
        const nombre = document.querySelector('input.nombre').value.trim();
        const apellido = document.querySelectorAll('input.nombre')[1].value.trim();
        const email = document.querySelector('input.email-registro').value.trim();

        // Validate fields
        if (!nombre || !apellido || !email) {
            mostrarNotificacion({
                message: 'Todos los campos son requeridos',
                type: 'error',
                duration: 3500
            });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            mostrarNotificacion({
                message: 'Formato de email inválido',
                type: 'error',
                duration: 3500
            });
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-usuario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre,
                    apellido,
                    nuevoEmail: email,
                    foto: fotoModificada ? fotoBase64 : undefined
                })
            });

            const data = await response.json();

            if (data.success) {
                const view = document.querySelector('.perfil-view');
                await obtenerYMostrarUsuario(view);
                ocultarAnuncio();
                mostrarNotificacion({
                    message: 'Perfil actualizado con éxito',
                    type: 'success',
                    duration: 3500
                });
            } else {
                throw new Error(data.error || 'Error al actualizar el perfil');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion({
                message: error.message || 'Error al actualizar el perfil',
                type: 'error',
                duration: 3500
            });
        } finally {
            ocultarCarga();
        }
    });
}

