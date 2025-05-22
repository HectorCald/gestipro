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
                texto: 'Almacen acopio',
                detalle: 'Gestiona tu almacen de acopio',
                onclick: 'onclick="mostrarAlmacenAcopio();"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-history',
                texto: 'Pedidos',
                detalle: 'Gestionar todos los pedidos',
                onclick: 'onclick="mostrarPedidos();"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-truck',
                texto: 'Proovedores acopio',
                detalle: 'Gestiona tus proovedores.',
                onclick: 'onclick="mostrarProovedoresAcopio()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-history',
                texto: 'Registros acopio',
                detalle: 'Aqui puedes ver todos los registros',
                onclick: 'onclick="mostrarRegistrosAcopio();"'
            },
        ],
        'Almacen': [
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-dolly',
                texto: 'Almacen general',
                detalle: 'Gestiona tu almacen.',
                onclick: 'onclick="mostrarAlmacenGeneral()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-clipboard-list',
                texto: 'Conteo fisico',
                detalle: 'Realiza conteos fisicos.',
                onclick: 'onclick="mostrarConteo()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-user-circle',
                texto: 'Clientes',
                detalle: 'Gestiona tus clientes',
                onclick: 'onclick="mostrarClientes()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-truck',
                texto: 'Proovedores',
                detalle: 'Gestiona tus proovedores',
                onclick: 'onclick="mostrarProovedores()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-history',
                texto: 'Registros almacen',
                detalle: 'Aqui puedes ver todos los registros',
                onclick: 'onclick="mostrarMovimientosAlmacen()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-history',
                texto: 'Registros conteo',
                detalle: 'Aqui puedes ver todos los registros',
                onclick: 'onclick="registrosConteoAlmacen()"'
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
    return atajosUsuario.slice(0, 10);
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
    const contenido = document.querySelector('.anuncio .contenido');
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
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            ${opcionesHTML}
        </div>
    `;

    contenido.innerHTML = menuHTML;
    contenido.style.paddingBottom = '10px';
    mostrarAnuncio();
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