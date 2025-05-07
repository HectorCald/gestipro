let usuarioInfo = {
    nombre: '',
    apellido: '',
    email: '',
    foto: '',
    rol: '',
    estado: '',
    plugins: ''
};
let registrosProduccion = [];
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
    }
}
async function obtenerMisRegistros() {
    try {
        const response = await fetch('/obtener-registros-produccion');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            registrosProduccion = data.registros
                .filter(registro => registro.user === usuarioInfo.email)
                .sort((a, b) => {
                    const [dayA, monthA, yearA] = a.fecha.split('/').map(Number);
                    const [dayB, monthB, yearB] = b.fecha.split('/').map(Number);
                    const dateA = new Date(yearA + 2000, monthA - 1, dayA);
                    const dateB = new Date(yearB + 2000, monthB - 1, dayB);
                    return dateA - dateB; // Orden descendente (más reciente primero)
                });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener registros de producción',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        mostrarNotificacion({
            message: 'Error al obtener registros de producción',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}


export async function crearPerfil() {
    const view = document.querySelector('.perfil-view');
    await obtenerUsuario();
    await obtenerMisRegistros();
    mostrarPerfil(view);
}
function mostrarPerfil(view) {
    const perfil = `
        <h1 class="titulo"><i class='bx bx-user'></i> Perfil</h1>
        <div class="info">
            <div class="detalles">
                <p class="subtitulo">Hola!</p>
                <p class="titulo nombre">${usuarioInfo.nombre} ${usuarioInfo.apellido}</p>
                <p class="correo-usuario">${usuarioInfo.email}</p>
            </div>
            <div class="foto">
                <img src="${usuarioInfo.foto}" alt="Foto de perfil" class="foto-perfil-img" onerror="this.src='./icons/icon.png'">
            </div>
        </div>
        <button class="apartado cuenta"><i class='bx bx-user'></i> Cuenta</button>
        <button class="apartado configuraciones"><i class='bx bx-cog'></i> Configuraciones</button>
        <button class="apartado exportar"><i class='bx bx-export'></i> Exportar</button>
        <button class="cerrar-sesion"><i class='bx bx-log-out'></i> Cerrar Sesión</button>
        <p class="version">Version 1.0.0</p>
    `;
    view.innerHTML = perfil;

    // Configurar event listeners
    const btnCuenta = document.querySelector('.apartado.cuenta');
    const btnConfiguraciones = document.querySelector('.apartado.configuraciones');
    const btnExportar = document.querySelector('.apartado.exportar');
    const btnCerrarSesion = document.querySelector('.cerrar-sesion');

    btnCuenta.addEventListener('click', () => {
        mostrarCuenta(usuarioInfo.nombre, usuarioInfo.apellido, usuarioInfo.email, usuarioInfo.foto);
    });

    btnConfiguraciones.addEventListener('click', () => {
        mostrarConfiguraciones();
    });

    btnExportar.addEventListener('click', () => {
        mostrarExportar();
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
    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Tu cuenta</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="foto-perfil">
                <div class="preview-container">
                    <img src="${foto}" alt="Vista previa" id="preview-foto">
                    <label for="input-foto" class="upload-overlay">
                        <i class='bx bx-upload'></i>
                    </label>
                </div>
                <input type="file" id="input-foto" accept="image/*" style="display: none;">
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i> Información</p>
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
            
        </div>
        <div class="anuncio-botones">
            <button id="btn-guardar" class="btn orange">Guardar cambios</button>
        </div>
    `;

    contenido.innerHTML = registrationHTML;
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
            } finally {
                ocultarCarga();
            }
        }
    });

    btnGuardar.addEventListener('click', async () => {
        const nombre = document.querySelector('input.nombre').value.trim();
        const apellido = document.querySelectorAll('input.nombre')[1].value.trim();
        const passwordActual = document.querySelector('input.password-actual')?.value;
        const passwordNueva = document.querySelector('input.password-nueva')?.value;

        // Validaciones básicas
        if (!nombre || !apellido) {
            mostrarNotificacion({
                message: 'Nombre y apellido son requeridos',
                type: 'error',
                duration: 3500
            });
            return;
        }

        // Validación de contraseña nueva
        if (passwordNueva && passwordNueva.length < 8) {
            mostrarNotificacion({
                message: 'La nueva contraseña debe tener al menos 8 caracteres',
                type: 'error',
                duration: 3500
            });
            return;
        }

        // Validar que ambas contraseñas estén presentes si se está cambiando
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
                    passwordActual: passwordActual || undefined,
                    passwordNueva: passwordNueva || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al actualizar el perfil');
            }

            await obtenerUsuario();
            mostrarPerfil(document.querySelector('.perfil-view'));
            ocultarAnuncio();
            mostrarNotificacion({
                message: 'Perfil actualizado con éxito',
                type: 'success',
                duration: 3500
            });

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
    const contenido = document.querySelector('.anuncio .contenido');
    const currentTheme = localStorage.getItem('theme') || 'system';
    
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Tus configuraciones</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
        <p class="normal"><i class='bx bx-chevron-right'></i> Tema</p>
            <div class="tema-selector">
                <button class="btn-tema ${currentTheme === 'light' ? 'active' : ''} dia" data-theme="light">
                    <i class='bx bx-sun'></i> Claro
                </button>
                <button class="btn-tema ${currentTheme === 'dark' ? 'active' : ''} noche" data-theme="dark">
                    <i class='bx bx-moon'></i> Oscuro
                </button>
                <button class="btn-tema ${currentTheme === 'system' ? 'active' : ''} sistema" data-theme="system">
                    <i class='bx bx-desktop'></i> Sistema
                </button>
            </div>
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    eventosConfiguraciones();
}
function eventosConfiguraciones() {
    const btnsTheme = document.querySelectorAll('.btn-tema');
    
    // Detector de cambios en el tema del sistema
    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Función para manejar cambios en el tema del sistema
    const handleSystemThemeChange = (e) => {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme === 'system') {
            setTheme('system');
        }
    };

    // Remover listener anterior si existe
    systemThemeQuery.removeEventListener('change', handleSystemThemeChange);
    // Agregar nuevo listener
    systemThemeQuery.addEventListener('change', handleSystemThemeChange);
    
    btnsTheme.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            setTheme(theme);
            
            // Update active state
            document.querySelectorAll('.btn-tema').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function setTheme(theme) {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);
    
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', theme);
    }
}


document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'system';
    setTheme(savedTheme);
});





async function mostrarExportar() {
    const contenido = document.querySelector('.anuncio .contenido');
    const exportHTML = `
            <div class="encabezado">
                <h1 class="titulo">Exportar mis registros</h1>
                <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Filtros de fecha:</p>
                <div class="entrada">
                    <i class='bx bx-calendar'></i>
                    <div class="input">
                        <p class="detalle">Desde</p>
                        <input class="fecha-desde" type="date" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-calendar'></i>
                    <div class="input">
                        <p class="detalle">Hasta</p>
                        <input class="fecha-hasta" type="date" placeholder=" " required>
                    </div>
                </div>

                <div class="registros-lista">
                    <p class="normal"><i class='bx bx-chevron-right'></i> Tienes ${registrosProduccion.length} registros</p>
                    ${registrosProduccion.map(registro => `
                        <div class="registro-item">
                            <div class="info-registro">
                                <p class="fecha"><strong>${registro.fecha}</strong></p>
                                <p class="detalle">${registro.producto} ${registro.gramos} - ${registro.c_real ? registro.c_real : registro.envases_terminados} Und.</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="anuncio-botones">
                <button id="exportar-excel" class="btn orange" style="margin-bottom:10px"><i class='bx bxs-file-export'></i> Exportar a Excel</button>
            </div>
        `;


    contenido.innerHTML = exportHTML;
    mostrarAnuncio();
    eventosExportar();
}
function eventosExportar() {
    const btnExcel = document.getElementById('exportar-excel');
    const fechaDesde = document.querySelector('.fecha-desde');
    const fechaHasta = document.querySelector('.fecha-hasta');
    const registrosLista = document.querySelector('.registros-lista');
    let registrosFiltrados = [...registrosProduccion];

    function actualizarLista() {
        const desde = fechaDesde.value;
        const hasta = fechaHasta.value;

        registrosFiltrados = registrosProduccion.filter(registro => {
            let mostrar = true;

            // Filtro por fechas
            if (desde || hasta) {
                const fechaTexto = registro.fecha;
                const [dia, mes] = fechaTexto.split('/');
                const año = new Date().getFullYear();
                const fechaRegistro = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

                if (desde) {
                    mostrar = fechaRegistro >= desde;
                }

                if (mostrar && hasta) {
                    mostrar = fechaRegistro <= hasta;
                }
            }

            return mostrar;
        });

        registrosLista.innerHTML = `
            <p class="subtitulo">Tienes ${registrosFiltrados.length} registros</p>
            ${registrosFiltrados.map(registro => `
                <div class="registro-item">
                    <div class="info-registro">
                        <p class="fecha">${registro.fecha}</p>
                        <p class="detalle">${registro.producto} ${registro.gramos} - ${registro.envases_terminados} Und.</p>
                    </div>
                </div>
            `).join('')}
        `;
    }

    fechaDesde.addEventListener('change', actualizarLista);
    fechaHasta.addEventListener('change', actualizarLista);

    btnExcel.addEventListener('click', () => {
        exportarAExcel(registrosFiltrados);
    });

    function exportarAExcel(registros) {
        const fechaDesde = document.querySelector('.fecha-desde').value;
        const fechaHasta = document.querySelector('.fecha-hasta').value;

        // Determine the filename based on the date range
        const nombreArchivo = (fechaDesde || fechaHasta)
            ? `Registros ${fechaDesde} - ${fechaHasta}.xlsx`
            : `Todos los registros.xlsx`;

        const worksheet = XLSX.utils.json_to_sheet(registros);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
        XLSX.writeFile(workbook, nombreArchivo);
    }
}