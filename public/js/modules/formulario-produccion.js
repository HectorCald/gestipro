export function mostrarFormularioProduccion() {
    const anuncio = document.querySelector('.anuncio');
    const registrationHTML = `
        <div class="contenido">
            <h1 class="bienvenida titulo">Nueva Producción</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Producto</p>
                    <input class="nombre" type="text" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-building'></i>
                <div class="input">
                    <p class="detalle">Gramaje</p>
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
                await crearPerfil();
                ocultarCarga();
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
        }
    });

}