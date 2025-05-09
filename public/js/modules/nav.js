let usuarioInfo = {
    nombre: '',
    apellido: '',
    email: '',
    foto: '',
    rol: '',
    estado: '',
    plugins: ''
};

async function obtenerUsuario() {
    try {
        mostrarCarga();
        // Intentar recuperar del localStorage
        const usuarioGuardado = localStorage.getItem('damabrava_usuario');
        if (usuarioGuardado) {
            usuarioInfo = JSON.parse(usuarioGuardado);
            return true;
        }

        mostrarCarga();
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

            // Guardar en localStorage
            localStorage.setItem('damabrava_usuario', JSON.stringify(usuarioInfo));
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
export function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}
export function limpiarUsuarioLocal() {
    localStorage.removeItem('damabrava_usuario');
    usuarioInfo = {
        nombre: '',
        apellido: '',
        email: '',
        foto: '',
        rol: '',
        estado: '',
        plugins: ''
    };
}


function obtenerOpcionesMenu() {
    const atajosPorRol = {
        'Producción': [
            {
                clase: 'opcion-btn',
                vista: 'formProduccion-view',
                icono: 'fa-clipboard-list',
                texto: 'Formulario',
                detalle: 'Registra una nueva producción',
                onclick: 'onclick="mostrarFormularioProduccion(); ocultarAnuncioSecond();"'
            },
            {
                clase: 'opcion-btn',
                vista: 'cuentasProduccion-view',
                icono: 'fa-history',
                texto: 'Registros',
                detalle: 'Ver mis registros de producción',
                onclick: 'onclick="document.querySelector(\'.seccion2 .normal\').scrollIntoView({behavior: \'smooth\', block: \'start\'});ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'gestionPro-view',
                icono: 'fa-chart-line',
                texto: 'Estadisticas',
                detalle: 'Ver mis estadisticas de registros.',
                onclick: 'onclick="document.querySelector(\'.seccion3 .normal\').scrollIntoView({behavior: \'smooth\', block: \'start\'});ocultarAnuncioSecond()"'
            }
        ],
        'Acopio': [
            {
                clase: 'opcion-btn',
                vista: 'almAcopio-view',
                icono: 'fa-dolly',
                texto: 'Gestionar Almacen',
                detalle: 'Aqui puedes gestionar el almacen de Acopio: (Materia Prima, Materia Bruta, Movimientos).',
                onclick: 'onclick="inicializarAlmacen()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-history',
                texto: 'Registros Acopio.',
                detalle: 'Aqui puedes ver todos los registros de Acopio que hiciste: (Pedidos, Movimientos).',
                onclick: 'onclick="cargarRegistrosAcopio()"'
            }
        ],
        'Almacen': [
            {
                clase: 'opcion-btn',
                vista: 'verificarRegistros-view',
                icono: 'fa-check-double',
                texto: 'Verificar Registros',
                detalle: 'Verificar registros de producción.',
                onclick: 'onclick="mostrarVerificacion(); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-history',
                texto: 'Registros Almacen',
                detalle: 'Registros de almacen ingresos/salidas.',
                onclick: 'onclick="document.querySelector(\'.seccion2 .normal\').scrollIntoView({behavior: \'smooth\', block: \'start\'}); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-dolly',
                texto: 'Gestionar Almacen',
                detalle: 'Gestionar tu alamcen general',
                onclick: 'onclick="mostrarAlmacenGeneral(); ocultarAnuncioSecond()"'
            },
        ],
        'Administración': [
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-search',
                texto: 'Registros Acopio',
                detalle: 'Aqui puedes gestionar todos los registros de Acopio. (Eliminar, Editar, Movimientos)',
                onclick: 'onclick="cargarRegistrosAcopio()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-search',
                texto: 'Registros Almacen',
                detalle: 'Aqui puedes gestionar todos los registros de Almacen. (Eliminar, Editar, Movimientos)',
                onclick: 'onclick="cargarRegistrosAlmacenGral()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'verificarRegistros-view',
                icono: 'fa-search',
                texto: 'Registros Producción',
                detalle: 'Aqui puedes gestionar todos los registros de producción. (Eliminar, Editar, Pagar, Calcular pagos)',
                onclick: 'onclick="cargarRegistros()"'
            }
        ]
    };

    // Collect all shortcuts for user's roles
    const rol = usuarioInfo.rol;
    let atajosUsuario = [];

    const atajosRol = atajosPorRol[rol];
    if (atajosRol) {
        atajosUsuario = [...atajosRol];
    }
    return atajosUsuario.slice(0, 3);
}
export async function crearNav() {
    // Solo ejecutar si estamos en el dashboard
    if (window.location.pathname === '/dashboard') {
        const view = document.querySelector('.nav');
        obtenerUsuario().then(() => mostrarNav(view));
    }
}



function mostrarNav() {
    const view = document.querySelector('.nav');
    const nav = `
            <div class="nav-container">
                <button class="refresh"><i class='bx bx-refresh'></i></button>
                <button class="menu"><i class='bx bx-menu'></i></button>
                <div class="info">
                    <h1 class="titulo">Damabrava</h1>
                    <p class="rol">@${usuarioInfo.rol}</p>
                </div>
            </div>
    `;
    view.innerHTML = nav;
    eventosNav();
}
function mostrarMenu() {
    const contenido = document.querySelector('.anuncio-second .contenido');
    const opcionesUsuario = obtenerOpcionesMenu();
    
    const opcionesHTML = opcionesUsuario.map(opcion => `
        <div class="opcion" ${opcion.onclick}>
            <i class="fas ${opcion.icono}"></i>
            <div class="info">
                <p class="texto">${opcion.texto}</p>
                <p class="detalle">${opcion.detalle}</p>
            </div>
        </div>
    `).join('');

    const menuHTML = `
        <div class="encabezado">
            <h1 class="titulo">Menú de ${usuarioInfo.rol}</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i> Tus funciones basicas</p>
            ${opcionesHTML}
        </div>
    `;

    contenido.innerHTML = menuHTML;
    mostrarAnuncioSecond();
}
function eventosNav() {
    const refreshButton = document.querySelector('.nav-container .refresh');
    const menu = document.querySelector('.nav-container .menu');
    
    refreshButton.addEventListener('click', () => {
        mostrarCarga();
        location.reload();
    });
    menu.addEventListener('click', () => {
        mostrarMenu();
    });
}