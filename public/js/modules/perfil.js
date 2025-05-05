let usuarioInfo = {
    nombre: '',
    apellido: '',
    email: '',
    foto: '',
    rol: '',
    estado: '',
    plugins: ''
};

export function crearPerfil() {
    const view = document.querySelector('.perfil-view');
    obtenerUsuario().then(() => mostrarPerfil(view));
}
async function obtenerUsuario() {
    try {
        const response = await fetch('/obtener-usuario-actual');
        const data = await response.json();
        
        if (data.success) {
            const nombreCompleto = data.usuario.nombre.split(' ');
            usuarioInfo = {
                nombre: nombreCompleto[0] || '',
                apellido: nombreCompleto[1] || '',
                email: data.usuario.email,
                rol: data.usuario.rol,
                estado: data.usuario.estado,
                plugins: data.usuario.plugins
            };

            // Procesar la foto
            if (!data.usuario.foto || data.usuario.foto === './icons/icon.png') {
                usuarioInfo.foto = './icons/icon.png';
            } else if (data.usuario.foto.startsWith('data:image')) {
                usuarioInfo.foto = data.usuario.foto;
            } else {
                try {
                    const imgResponse = await fetch(data.usuario.foto);
                    if (!imgResponse.ok) throw new Error('Error al cargar la imagen');
                    const blob = await imgResponse.blob();
                    usuarioInfo.foto = URL.createObjectURL(blob);
                } catch (error) {
                    console.error('Error loading image:', error);
                    usuarioInfo.foto = './icons/icon.png';
                }
            }
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener datos del usuario',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        mostrarNotificacion({
            message: 'Error al obtener datos del usuario',
            type: 'error',
            duration: 3500
        });
        return false;
    } finally {
        ocultarCarga();
    }
}
function mostrarPerfil(view) {
    const perfil = `
        <h1 class="titulo"><i class='bx bx-user'></i> Perfil</h1>
        <div class="info">
            <div class="detalles">
                <p class="titulo">Hola!</p>
                <p class="titulo nombre">${usuarioInfo.nombre} ${usuarioInfo.apellido}</p>
                <p class="correo-usuario">${usuarioInfo.email}</p>
            </div>
            <div class="foto">
                <img src="${usuarioInfo.foto}" alt="Foto de perfil" class="foto-perfil-img" onerror="this.src='./icons/icon.png'">
            </div>
        </div>
        <button class="apartado cuenta"><i class='bx bx-user'></i> Cuenta</button>
        <button class="apartado configuraciones"><i class='bx bx-cog'></i> Configuraciones</button>
        <button class="cerrar-sesion"><i class='bx bx-log-out'></i> Cerrar Sesión</button>
        <p class="version">Version 1.0.0</p>
    `;
    view.innerHTML = perfil;

    // Configurar event listeners
    const btnCuenta = document.querySelector('.apartado.cuenta');
    const btnConfiguraciones = document.querySelector('.apartado.configuraciones');
    const btnCerrarSesion = document.querySelector('.cerrar-sesion');

    btnCuenta.addEventListener('click', () => {
        mostrarCuenta(usuarioInfo.nombre, usuarioInfo.apellido, usuarioInfo.email, usuarioInfo.foto);
    });

    btnConfiguraciones.addEventListener('click', () => {
        mostrarConfiguraciones();
    });

    btnCerrarSesion.addEventListener('click', async () => {
        try {
            mostrarCarga();
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
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
}


function mostrarCuenta(nombre, apellido, email, foto) {
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
                <i class='bx bx-lock-alt'></i>
                <div class="input">
                    <p class="detalle">Contraseña Actual</p>
                    <input class="password-actual" type="password" placeholder=" "autocomplete="new-password" required>
                    <button class="toggle-password"><i class="fas fa-eye"></i></button>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-lock-alt'></i>
                <div class="input">
                    <p class="detalle">Nueva Contraseña</p>
                    <input class="password-nueva" type="password" placeholder=" " autocomplete="new-password" required>
                    <button class="toggle-password"><i class="fas fa-eye"></i></button>
                </div>
            </div>
            <button id="btn-guardar" class="btn green">Guardar cambios</button>
        </div>
    `;
    
    anuncio.innerHTML = registrationHTML;
    mostrarAnuncio();
    evetosCuenta();
}
function evetosCuenta() {
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

    

    inputFoto.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                mostrarNotificacion({
                    message: 'Solo se permiten archivos de imagen',
                    type: 'error',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();
                const img = new Image();
                const reader = new FileReader();

                reader.onload = function (e) {
                    img.src = e.target.result;
                };

                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Reducir más el tamaño máximo para móviles
                    const MAX_SIZE = 500; // Reducido de 800 a 500
                    if (width > height && width > MAX_SIZE) {
                        height *= MAX_SIZE / width;
                        width = MAX_SIZE;
                    } else if (height > MAX_SIZE) {
                        width *= MAX_SIZE / height;
                        height = MAX_SIZE;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Aumentar la compresión para móviles
                    const calidad = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 0.5 : 0.7;
                    fotoBase64 = canvas.toDataURL('image/jpeg', calidad);

                    // Verificar el tamaño de la cadena base64
                    if (fotoBase64.length > 2000000) { // Si es mayor a 2MB
                        mostrarNotificacion({
                            message: 'La imagen es demasiado grande, intenta con una más pequeña',
                            type: 'error',
                            duration: 3500
                        });
                        return;
                    }

                    previewFoto.src = fotoBase64;
                    fotoModificada = true;
                };

                reader.readAsDataURL(file);
            } catch (error) {
                console.error('Error al procesar la imagen:', error);
                mostrarNotificacion({
                    message: 'Error al procesar la imagen',
                    type: 'error',
                    duration: 3500
                });
            }finally{
                ocultarCarga();
            }
        }
    });

    btnGuardar.addEventListener('click', async () => {
        const nombre = document.querySelector('input.nombre').value.trim();
        const apellido = document.querySelectorAll('input.nombre')[1].value.trim();
        const passwordActual = document.querySelector('input.password-actual')?.value;
        const passwordNueva = document.querySelector('input.password-nueva')?.value;

        if (!nombre || !apellido) {
            mostrarNotificacion({
                message: 'Nombre y apellido son requeridos',
                type: 'error',
                duration: 3500
            });
            return;
        }

        // Validar contraseñas si se están cambiando
        if ((passwordActual && !passwordNueva) || (!passwordActual && passwordNueva)) {
            mostrarNotificacion({
                message: 'Debe ingresar ambas contraseñas para cambiarla',
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
                    foto: fotoModificada ? fotoBase64 : undefined,
                    passwordActual,
                    passwordNueva
                })
            });

            const data = await response.json();

            if (data.success) {
                await obtenerUsuario();
                mostrarPerfil(document.querySelector('.perfil-view'));
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

function mostrarConfiguraciones() {
    const anuncio = document.querySelector('.anuncio');
    const registrationHTML = `
        <div class="contenido">
            <h1 class="bienvenida titulo">Tu configuraciones</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <p>No existen configuraciónes aun.</p>
            <button id="btn-guardar" class="btn green">Guardar cambios</button>
        </div>
    `;

    anuncio.innerHTML = registrationHTML;
    mostrarAnuncio();
    evetosCuenta();
}


