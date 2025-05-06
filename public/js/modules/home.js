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

            registrosProduccion = data.registros;
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
function obtenerFunciones() {
    const atajosPorRol = {
        'Producción': [
            {
                clase: 'opcion-btn',
                vista: 'formProduccion-view',
                icono: 'fa-clipboard-list',
                texto: 'Formulario',
                detalle: 'Nueva producción.',
                onclick: 'onclick="mostrarFormularioProduccion()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'cuentasProduccion-view',
                icono: 'fa-history',
                texto: 'Registros',
                detalle: 'Ver mis registros de producción'
            },
            {
                clase: 'opcion-btn',
                vista: 'gestionPro-view',
                icono: 'fa-chart-line',
                texto: 'Estadisticas',
                detalle: 'Ver mis estadisticas.'
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
                detalle: 'Aqui puedes verificar la cantidad real de los registros de producción.',
                onclick: 'onclick="cargarRegistros()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-dolly',
                texto: 'Gestionar Almacen',
                detalle: 'Aqui puedes gestionar el almacen de la empresa: (stock, Productos, ingresos, salidas).',
                onclick: 'onclick="inicializarAlmacenGral()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-history',
                texto: 'Registros Almacen',
                detalle: 'Aqui puedes ver todos los registros de almacen que hiciste tanto ingreso como salidas.',
                onclick: 'onclick="cargarRegistrosAlmacenGral()"'
            }
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




export function crearHome() {
    const view = document.querySelector('.home-view');
    Promise.all([
        obtenerUsuario(),
        obtenerMisRegistros(),
    ]).then(() => mostrarHome(view));
}
export function mostrarHome(view) {
    // Obtener las funciones del usuario según su rol
    const funcionesUsuario = obtenerFunciones();

    // Generar el HTML de las funciones
    const funcionesHTML = funcionesUsuario.map(funcion => `
        <div class="funcion" ${funcion.onclick}>
            <i class='fas ${funcion.icono}'></i>
            <p class="nombre">${funcion.texto}</p>
            <p class="detalle">${funcion.detalle} </p>
        </div>
    `).join('');

    // Filtrar registros por el nombre del usuario actual en la columna J
    const registrosFiltrados = registrosProduccion.filter(registro => registro.user === usuarioInfo.email);

    // Mostrar solo los últimos 10 registros
    const registrosParaMostrar = registrosFiltrados.slice(-10);

    // Calcular los destacados
    const totalRegistros = registrosFiltrados.length;
    const verificados = registrosFiltrados.filter(registro => registro.fecha_verificacion).length;
    const noVerificados = totalRegistros - verificados;

    const registrosHTML = registrosParaMostrar.map(registro => {
        const estado = registro.fecha_verificacion ? 'Verificado' : 'Pendiente';
        return `
            <div class="registro" data-id="${registro.id}">
                <div class="info">
                    <p class="fecha">${registro.fecha}</p>
                    <p class="producto">${registro.producto} ${registro.gramos}gr.</p>
                </div>
                <div class="detalles">
                    <p class="cantidad">Envasados: <strong>${registro.envases_terminados} Und.</strong></p>
                    <p class="lote">Lote: <strong>${registro.lote}</strong></p>
                    <p class="estado ${estado.toLowerCase()}">Estado: <strong>${estado}</strong></p>
                </div>
            </div>
        `;
    }).join('');

    const home = `
        <h1 class="titulo"><i class='bx bx-home'></i> Inicio</h1>
        <div class="seccion1">
            <h2 class="subtitulo">Tus funciones</h2>
            <div class="funciones-rol">
                ${funcionesHTML}
            </div>
        </div>
        <div class="seccion3">
            <h2 class="subtitulo">Tus destacados</h2>
            <div class="destacados">

                <div class="destacado">
                    <p class="cantidad blue">${totalRegistros}</p>
                    <p class="tipo">Total registros</p>
                </div>

                <div class="destacado">
                    <p class="cantidad green">${verificados}</p>
                    <p class="tipo">Verificados</p>
                </div>

                <div class="destacado">
                    <p class="cantidad yellow">${noVerificados}</p>
                    <p class="tipo">No verificados</p>
                </div>
            </div>
        </div>
        <div class="seccion2">
            <h2 class="subtitulo">Tus registros</h2>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">No verificados</button>
                <button class="btn-filtro">Verificados</button>
            </div>
            <div class="filtros-opciones tiempo">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">7 dias</button>
                <button class="btn-filtro">15 dias</button>
                <button class="btn-filtro">1 mes</button>
                <button class="btn-filtro">3 meses</button>
                <button class="btn-filtro">6 meses</button>
                <button class="btn-filtro">1 año</button>
            </div>
            <p class="aviso">Registros de <span>7 dias</span></p>
            <div class="registros">
                ${registrosHTML}
            </div>
            ${totalRegistros > 10 ? '<button class="btn-cargar-mas">Cargar más</button>' : ''}
        </div>
    `;

    view.innerHTML = home;
    eventosHome();

    // Add event listener for "Load More" button
    const loadMoreButton = document.querySelector('.btn-cargar-mas');
    if (loadMoreButton) {
        loadMoreButton.addEventListener('click', () => {
            cargarMasRegistros(registrosFiltrados);
        });
    }
}
function eventosHome() {
    const estadoButtons = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
    const tiempoButtons = document.querySelectorAll('.filtros-opciones.tiempo .btn-filtro');
    const homeView = document.querySelector('.home-view');
    const tusRegistrosSubtitle = document.querySelector('.seccion2 .subtitulo');

    estadoButtons.forEach(button => {
        button.addEventListener('click', () => {
            estadoButtons.forEach(btn => btn.classList.remove('activado'));
            button.classList.add('activado');

            // Scroll the button into view
            button.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

            const estadoSeleccionado = button.textContent.trim();
            filtrarRegistros(estadoSeleccionado, obtenerFiltroTiempo()).then(() => {
                // After filtering, scroll the "Tus registros" subtitle to the top of the home-view container
                tusRegistrosSubtitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    });

    tiempoButtons.forEach(button => {
        button.addEventListener('click', () => {
            tiempoButtons.forEach(btn => btn.classList.remove('activado'));
            button.classList.add('activado');

            // Scroll the button into view
            button.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

            const tiempoSeleccionado = button.textContent.trim();
            filtrarRegistros(obtenerFiltroEstado(), tiempoSeleccionado).then(() => {
                // After filtering, scroll the "Tus registros" subtitle to the top of the home-view container
                tusRegistrosSubtitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    });

    function obtenerFiltroEstado() {
        const estadoButton = document.querySelector('.filtros-opciones.estado .btn-filtro.activado');
        return estadoButton ? estadoButton.textContent.trim() : 'Todos';
    }

    function obtenerFiltroTiempo() {
        const tiempoButton = document.querySelector('.filtros-opciones.tiempo .btn-filtro.activado');
        return tiempoButton ? tiempoButton.textContent.trim() : '7 dias';
    }

    function filtrarRegistros(estado, tiempo) {
        return new Promise((resolve) => {
            const registrosFiltrados = registrosProduccion.filter(registro => {
                const userMatch = registro.user === usuarioInfo.email;
                const estadoMatch = estado === 'Todos' || (estado === 'Verificados' && registro.fecha_verificacion) || (estado === 'No verificados' && !registro.fecha_verificacion);

                const [day, month, year] = registro.fecha.split('/').map(Number);
                const registroDate = new Date(year + 2000, month - 1, day);

                const currentDate = new Date();
                let startDate;
                if (tiempo === 'Todos') {
                    startDate = new Date(0);
                } else {
                    switch (tiempo) {
                        case '7 dias':
                            startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
                            break;
                        case '15 dias':
                            startDate = new Date(currentDate.setDate(currentDate.getDate() - 15));
                            break;
                        case '1 mes':
                            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
                            break;
                        case '3 meses':
                            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 3));
                            break;
                        case '6 meses':
                            startDate = new Date(currentDate.setMonth(currentDate.getMonth() - 6));
                            break;
                        case '1 año':
                            startDate = new Date(currentDate.setFullYear(currentDate.getFullYear() - 1));
                            break;
                        default:
                            startDate = new Date(currentDate.setDate(currentDate.getDate() - 7));
                    }
                }

                const tiempoMatch = registroDate >= startDate;
                return userMatch && estadoMatch && tiempoMatch;
            });

            // Sort and slice to get the last 10 records
            const registrosParaMostrar = registrosFiltrados.slice(-10);

            const registrosHTML = registrosParaMostrar.map(registro => {
                const estado = registro.fecha_verificacion ? 'Verificado' : 'Pendiente';
                return `
            <div class="registro" data-id="${registro.id}">
                <div class="info">
                    <p class="fecha">${registro.fecha}</p>
                    <p class="producto">${registro.producto}</p>
                </div>
                <div class="detalles">
                    <p class="cantidad">Envasados: <strong>${registro.envases_terminados} Und.</strong></p>
                    <p class="lote">Lote: <strong>${registro.lote}</strong></p>
                    <p class="estado ${estado.toLowerCase()}">Estado: <strong>${estado}</strong></p>
                </div>
            </div>
        `;
            }).join('');

            const registrosContainer = document.querySelector('.registros');
            registrosContainer.innerHTML = registrosHTML;

            // Remove existing "Load More" button
            const existingLoadMoreButton = document.querySelector('.btn-cargar-mas');
            if (existingLoadMoreButton) {
                existingLoadMoreButton.remove();
            }

            // Add "Load More" button if there are more than 10 records
            if (registrosFiltrados.length > 10) {
                const loadMoreButton = document.createElement('button');
                loadMoreButton.textContent = 'Cargar más';
                loadMoreButton.classList.add('btn-cargar-mas');
                loadMoreButton.addEventListener('click', () => {
                    cargarMasRegistros(registrosFiltrados);
                });
                registrosContainer.appendChild(loadMoreButton);
            }

            // Add event listeners to registros
            document.querySelectorAll('.registro').forEach(registroElement => {
                registroElement.addEventListener('click', () => {
                    const registroId = registroElement.getAttribute('data-id');
                    const registro = registrosProduccion.find(r => r.id === registroId);
                    mostrarDetalleRegistro(registro);
                });
            });

            const avisoElement = document.querySelector('.aviso');
            if (registrosFiltrados.length > 0) {
                avisoElement.textContent = `Registros ${estado.toLowerCase()} de ${tiempo}`;
            } else {
                avisoElement.textContent = 'No hay registros';
            }

            resolve(); // Resolve the promise after filtering is done
        });
    }

    function cargarMasRegistros(registrosFiltrados) {
        const currentCount = document.querySelectorAll('.registro').length;
        const registrosParaMostrar = registrosFiltrados.slice(currentCount, currentCount + 10);

        const registrosHTML = registrosParaMostrar.map(registro => {
            const estado = registro.fecha_verificacion ? 'Verificado' : 'Pendiente';
            return `
            <div class="registro" data-id="${registro.id}">
                <div class="info">
                    <p class="fecha">${registro.fecha}</p>
                    <p class="producto">${registro.producto}</p>
                </div>
                <div class="detalles">
                    <p class="cantidad">Envasados: <strong>${registro.envases_terminados} Und.</strong></p>
                    <p class="lote">Lote: <strong>${registro.lote}</strong></p>
                    <p class="estado ${estado.toLowerCase()}">Estado: <strong>${estado}</strong></p>
                </div>
            </div>
        `;
        }).join('');

        document.querySelector('.registros').insertAdjacentHTML('beforeend', registrosHTML);

        // Agregar event listeners a los nuevos registros
        const nuevosRegistros = document.querySelectorAll('.registro');
        nuevosRegistros.forEach((registroElement, index) => {
            if (index >= currentCount) { // Solo agregar listeners a los nuevos
                registroElement.addEventListener('click', () => {
                    const registroId = registroElement.getAttribute('data-id');
                    const registro = registrosProduccion.find(r => r.id === registroId);
                    mostrarDetalleRegistro(registro);
                });
            }
        });

        // Remover botón si ya no hay más registros para cargar
        if (currentCount + 10 >= registrosFiltrados.length) {
            document.querySelector('.btn-cargar-mas').remove();
        }
    }
    window.cargarMasRegistros = cargarMasRegistros;

    document.querySelectorAll('.registro').forEach(registroElement => {
        registroElement.addEventListener('click', () => {
            const registroId = registroElement.getAttribute('data-id');
            const registro = registrosProduccion.find(r => r.id === registroId);
            mostrarDetalleRegistro(registro);
        });
    });

    function mostrarDetalleRegistro(registro) {
        const contenido = document.querySelector('.anuncio .contenido')
        const detalleHTML = `
        <div class="encabezado">
            <h1 class="titulo">Detalles del Registro</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="subtitulo"> Información basica</p>
            <div class="campo-vertical">
                <p class="item"><i class='bx bx-calendar'></i> <strong>Fecha:</strong> ${registro.fecha}</p>
                <p class="item"><i class='bx bx-id-card'></i> <strong>ID:</strong> ${registro.id}</p>
            </div>
            

            <p class="subtitulo"> Información del producto</p>
            <div class="campo-vertical">
                <p class="item"><i class='bx bx-package'></i> <strong>Producto:</strong>${registro.producto} ${registro.gramos}gr.</p>
                <p class="item"><i class='bx bx-barcode'></i> <strong>Lote:</strong> ${registro.lote}</p>
            </div>
            
            <p class="subtitulo"> Procesos</p>
            <div class="campo-vertical">
                <p class="item"><i class='bx bx-cog'></i><strong>Seleccion/Cernido:</strong> ${registro.proceso}</p>
                <p class="item"><i class='bx bx-microchip'></i><strong>Microondas:</strong> ${registro.microondas} Segundos</p>
            </div>

            <p class="subtitulo"> Detalles de finalización</p>
            <div class="campo-vertical">
                <p class="item"><i class='bx bx-box'></i> <strong>Envasados Terminados:</strong> ${registro.envases_terminados} Unidades</p>
                <p class="item"><i class='bx bx-calendar-check'></i> <strong>Fecha de Vencimiento:</strong> ${registro.fecha_vencimiento}</p>
            </div>

            <p class="subtitulo"> Detalles de la verificación</p>
            <div class="campo-vertical">
                <p class="item"><i class='bx bx-check-circle'></i> <strong>Fecha de Verificación:</strong> ${registro.fecha_verificacion ? registro.fecha_verificacion : 'No verificado'}</p>
                <p class="item"><i class='bx bx-calculator'></i> <strong>Cantidad Real:</strong> ${registro.c_real ? registro.fecha_verificacion : 'No verificado'}</p>
                <p class="item"><i class='bx bx-comment'></i> <strong>Observaciones:</strong> ${registro.observaciones ? registro.fecha_verificacion : 'No verificado'}</p>
                <p class="item"><i class='bx bx-dollar'></i> <strong>Pagado:</strong> ${registro.pagado ? registro.fecha_verificacion : 'No verificado'}</p>
            </div>
        </div>
    `;
        contenido.innerHTML = detalleHTML;
        mostrarAnuncio();
    }
}
