let usuarioInfo = '';


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
                onclick: 'onclick="mostrarMisRegistros(); ocultarAnuncioSecond()"'
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
                texto: 'Almacen',
                detalle: 'Gestionar almacen acopio(editar, eliminar, crear).',
                onclick: 'onclick="mostrarAlmacenAcopio(); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-history',
                texto: 'Registros',
                detalle: 'Todos los movimientos del alamcen(ingresos, saldias).',
                onclick: 'onclick="cargarRegistrosAcopio()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-truck',
                texto: 'Proovedores',
                detalle: 'Gestiona tus proovedores(agregar, editar, eliminar).',
                onclick: 'onclick="cargarRegistrosAcopio()"'
            }
        ],
        'Almacen': [
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-history',
                texto: 'Registros',
                detalle: 'Movimientos del almacen (Ingresos, salidas).',
                onclick: 'onclick="mostrarMovimientosAlmacen(); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-dolly',
                texto: 'Almacen',
                detalle: 'Gestionar tu almacen general (crear, editar, eliminar).',
                onclick: 'onclick="mostrarAlmacenGeneral(); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-user-circle',
                texto: 'Clientes',
                detalle: 'Gestiona tus clientes (agregar, editar, eliminar).',
                onclick: 'onclick="mostrarClientes(); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-truck',
                texto: 'Proovedores',
                detalle: 'Gestiona tus proovedores (agregar, editar, eliminar).',
                onclick: 'onclick="mostrarProovedores(); ocultarAnuncioSecond()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-clipboard-list',
                texto: 'Conteo',
                detalle: 'Haz tu conteo fisico del almacen (imprime y archiva).',
                onclick: 'onclick="mostrarConteo(); ocultarAnuncioSecond()"'
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
    const rol = usuarioInfo;
    let atajosUsuario = [];

    const atajosRol = atajosPorRol[rol];
    if (atajosRol) {
        atajosUsuario = [...atajosRol];
    }
    return atajosUsuario.slice(0, 5);
}
export async function crearNav(rol) {

    usuarioInfo=rol;
    // Solo ejecutar si estamos en el dashboard
    if (window.location.pathname === '/dashboard') {
        const view = document.querySelector('.nav');
        mostrarNav(view);
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
                    <p class="rol">@${usuarioInfo}</p>
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
            <h1 class="titulo">Menú de ${usuarioInfo}</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            ${opcionesHTML}
        </div>
    `;

    contenido.innerHTML = menuHTML;
    contenido.style.paddingBottom = '10px';
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