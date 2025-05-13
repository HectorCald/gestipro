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
let registrosMovimientos = [];
let registrosFiltrados = [];

async function obtenerUsuario() {
    try {
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
    finally{
        ocultarCarga();
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
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA; // Orden descendente por número de ID
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
                detalle: 'Ver mis registros.',
                onclick: 'onclick="document.querySelector(\'.seccion2 .normal\').scrollIntoView({behavior: \'smooth\', block: \'start\'})"'
            },
            {
                clase: 'opcion-btn',
                vista: 'gestionPro-view',
                icono: 'fa-chart-line',
                texto: 'Estadisticas',
                detalle: 'Ver mis estadisticas.',
                onclick: 'onclick="document.querySelector(\'.seccion3 .normal\').scrollIntoView({behavior: \'smooth\', block: \'start\'})"'
            }
        ],
        'Acopio': [
            {
                clase: 'opcion-btn',
                vista: 'almAcopio-view',
                icono: 'fa-shopping-cart',
                texto: 'Pedido',
                detalle: 'Hacer nuevo pedido',
                onclick: 'onclick="mostrarHacerPedido()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-dolly',
                texto: 'Almacen',
                detalle: 'Gestiona tu almacen',
                onclick: 'onclick="cargarRegistrosAcopio()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAcopio-view',
                icono: 'fa-clipboard',
                texto: 'Registros',
                detalle: 'Movientos en tu almacen',
                onclick: 'onclick="cargarRegistrosAcopio()"'
            }
        ],
        'Almacen': [
            {
                clase: 'opcion-btn',
                vista: 'verificarRegistros-view',
                icono: 'fa-check-double',
                texto: 'Verificar',
                detalle: 'Verifica registros.',
                onclick: 'onclick="mostrarVerificacion()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'almacen-view',
                icono: 'fa-arrow-down',
                texto: 'Ingresos',
                detalle: 'Ingresos de tu almacen.',
                onclick: 'onclick="mostrarIngresos()"'
            },
            {
                clase: 'opcion-btn',
                vista: 'regAlmacen-view',
                icono: 'fa-arrow-up',
                texto: 'Salidas',
                detalle: 'Salidas de tu almacen.',
                onclick: 'onclick="mostrarSalidas()"'
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
async function obtenerMovimientosAlmacen() {
    try {
        const response = await fetch('/obtener-movimientos-almacen');
        const data = await response.json();

        if (data.success) {
            // Store movements in global variable and sort by date (most recent first)
            registrosMovimientos = data.movimientos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Orden descendente por número de ID
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener movimientos de almacén',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener movimientos:', error);
        mostrarNotificacion({
            message: 'Error al obtener movimientos de almacén',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}


export function crearHome() {
    const view = document.querySelector('.home-view');
    view.style.opacity = '0';  // Start with opacity 0

    // Primero obtenemos el usuario
    obtenerUsuario().then(() => {
        // Después, según el rol, obtenemos los registros correspondientes
        const promesas = [
            usuarioInfo.rol === 'Producción' ? obtenerMisRegistros() : null,
            usuarioInfo.rol === 'Almacen' ? obtenerMovimientosAlmacen() : null
        ].filter(Boolean); // Filtramos los null

        Promise.all(promesas).then(() => {
            mostrarHome(view);
            requestAnimationFrame(() => {
                view.style.opacity = '1';
            });
        });
    });
}
export function mostrarHome(view) {
    const funcionesUsuario = obtenerFunciones();
    const funcionesHTML = funcionesUsuario.map(funcion => `
        <div class="funcion" ${funcion.onclick}>
            <i class='fas ${funcion.icono}'></i>
            <p class="nombre">${funcion.texto}</p>
            <p class="detalle">${funcion.detalle} </p>
        </div>
    `).join('');

    // Determinar qué registros mostrar según el rol
    let registrosFiltrados = [];
    let tipoRegistro = '';

    switch (usuarioInfo.rol) {
        case 'Producción':
            registrosFiltrados = registrosProduccion
            tipoRegistro = 'producción';
            break;
        case 'Almacen':
            registrosFiltrados = registrosMovimientos
            tipoRegistro = 'almacén';
            break;
    }

    const registrosParaMostrar = registrosFiltrados.slice(0, 10);

    // Adaptar el HTML según el tipo de registro
    const registrosHTML = registrosParaMostrar.map(registro => {
        if (usuarioInfo.rol === 'Producción') {
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
                        <p class="estado ${estado.toLowerCase()}"><strong>${estado}</strong></p>
                    </div>
                </div>
            `;
        } else if (usuarioInfo.rol === 'Almacen') {
            const tipo = registro.tipo === 'Ingreso' ? 'Ingreso' : 'Salida';
            return `
            <div class="registro" data-id="${registro.id}">
                <div class="info">
                    <p class="fecha">${registro.fecha_hora}</p>
                    <p class="producto">${registro.destino}</p>
                </div>
                <div class="detalles">
                    <p class="proovedor_cliente"><strong>${registro.cliente_proovedor}</strong></p>
                    <p class="tipo-movimiento ${tipo.toLowerCase()}"><strong>${registro.tipo}</strong></p>
                </div>
            </div>
        `;
        }
    }).join('');

    // Calcular los destacados según el rol
    let destacados = {};
    if (usuarioInfo.rol === 'Producción') {
        const totalRegistros = registrosFiltrados.length;
        const verificados = registrosFiltrados.filter(registro => registro.fecha_verificacion).length;
        destacados = {
            total: totalRegistros,
            verificados: verificados,
            noVerificados: totalRegistros - verificados
        };
    } else if (usuarioInfo.rol === 'Almacen') {
        const entradas = registrosFiltrados.filter(registro => registro.tipo === 'Ingreso').length;
        const salidas = registrosFiltrados.filter(registro => registro.tipo === 'Salida').length;
        destacados = {
            total: registrosFiltrados.length,
            entradas: entradas,
            salidas: salidas
        };
    }

    const home = `
        <h1 class="titulo"><i class='bx bx-home'></i> Inicio</h1>
        <div class="seccion1">
            <h2 class="normal">Tus atajos</h2>
            <div class="funciones-rol">
                ${funcionesHTML}
            </div>
        </div>
        <div class="seccion3">
            <h2 class="normal">Tus destacados</h2>
            <div class="destacados">
                ${usuarioInfo.rol === 'Producción' ? `
                    <div class="destacado">
                        <p class="cantidad blue">${destacados.total}</p>
                        <p class="tipo">Registros</p>
                    </div>
                    <div class="destacado">
                        <p class="cantidad green">${destacados.verificados}</p>
                        <p class="tipo">Verificados</p>
                    </div>
                    <div class="destacado">
                        <p class="cantidad yellow">${destacados.noVerificados}</p>
                        <p class="tipo">No verificados</p>
                    </div>
                ` : `
                    <div class="destacado">
                        <p class="cantidad blue">${destacados.total}</p>
                        <p class="tipo">Registros</p>
                    </div>
                    <div class="destacado">
                        <p class="cantidad green">${destacados.entradas}</p>
                        <p class="tipo">Ingresos</p>
                    </div>
                    <div class="destacado">
                        <p class="cantidad yellow">${destacados.salidas}</p>
                        <p class="tipo">Salidas</p>
                    </div>
                `}
            </div>
        </div>
        <div class="seccion2">
            <h2 class="normal">Tus registros de ${tipoRegistro}</h2>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                ${usuarioInfo.rol === 'Producción' ? `
                    <button class="btn-filtro">No verificados</button>
                    <button class="btn-filtro">Verificados</button>
                ` : `
                    <button class="btn-filtro">Ingresos</button>
                    <button class="btn-filtro">Salidas</button>
                `}
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
            <div class="buscador">
                <input type="text" placeholder="Buscar por producto o fecha" class="input-busqueda">
                <i class='bx bx-search'></i>
            </div>
            <p class="aviso">Todos los registros(Segun tus filtros).</p>
            <div class="registros">
                ${registrosHTML}
            </div>
            ${registrosFiltrados.length > 10 ? '<button class="btn-cargar-mas">Cargar más</button>' : ''}
        </div>
    `;

    view.innerHTML = home;
    eventosHome();

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
    const registrosContainer = document.querySelector('.registros');
    const inputBusqueda = document.querySelector('.input-busqueda');
    const botonBusqueda = document.querySelector('.buscador i.bx-search');

    function normalizarTexto(texto) {
        if (!texto) return '';
        return texto.toString().toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-\s]/g, '');
    }

    function buscarRegistros(termino) {
        if (!termino) {
            return usuarioInfo.rol === 'Producción' ? registrosProduccion : registrosMovimientos;
        }

        const terminoNormalizado = normalizarTexto(termino);
        const registrosBase = usuarioInfo.rol === 'Producción' ? registrosProduccion : registrosMovimientos;

        return registrosBase.filter(registro => {
            const productoNormalizado = normalizarTexto(registro.producto);

            // Manejar la normalización de la fecha según el rol
            let registroFecha;
            if (usuarioInfo.rol === 'Almacen') {
                registroFecha = registro.fecha_hora.split(',')[0];
            } else {
                registroFecha = registro.fecha;
            }

            const [day, month, year] = registroFecha.split('/').map(Number);
            const registroFechaNormalizada = `${day.toString().padStart(2, '0')}-${month.toString().padStart(2, '0')}-${year}`;

            // Verificar si el término es una fecha en el formato "dd-mm-yyyy"
            const esFecha = /^\d{2}-\d{2}-\d{4}$/.test(termino);
            const esProductoFecha = /^[a-zA-Z].*,\d{2}-\d{2}-\d{4}$/.test(termino);

            if (esProductoFecha) {
                const [productoTermino, fechaTermino] = termino.split(',');
                const producto = normalizarTexto(productoTermino);
                return productoNormalizado.includes(producto) && registroFechaNormalizada === fechaTermino;
            } else if (esFecha) {
                return registroFechaNormalizada === termino;
            } else {
                return productoNormalizado.includes(terminoNormalizado);
            }

        });
    }

    function realizarBusqueda() {
        const termino = inputBusqueda.value.trim();
        const resultados = buscarRegistros(termino);

        registrosFiltrados = resultados;


        // Desactivar todos los filtros
        const todosBotonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
        const todosBotonesTiempo = document.querySelectorAll('.filtros-opciones.tiempo .btn-filtro');

        todosBotonesEstado.forEach(btn => btn.classList.remove('activado'));
        todosBotonesTiempo.forEach(btn => btn.classList.remove('activado'));

        if (registrosFiltrados.length === 0) {
            mostrarNotificacion({
                message: 'No se encontraron registros',
                type: 'warning',
                duration: 3500
            });
        }

        actualizarRegistrosHTML(registrosFiltrados.slice(0, 10), registrosFiltrados);
    }
    botonBusqueda.addEventListener('click', realizarBusqueda);
    inputBusqueda.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            realizarBusqueda();
        }
    });


    registrosContainer.addEventListener('click', (e) => {
        const registroElement = e.target.closest('.registro');
        if (registroElement) {
            const registroId = registroElement.getAttribute('data-id');
            if (usuarioInfo.rol === 'Producción') {
                const registro = registrosProduccion.find(r => r.id === registroId);
                mostrarDetalleRegistro(registro);
            } else if (usuarioInfo.rol === 'Almacen') {
                const registro = registrosMovimientos.find(r => r.id === registroId);
                mostrarDetalleRegistroAlmacen(registro);
            }
        }
    });

    estadoButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Clear the search input
            inputBusqueda.value = '';

            estadoButtons.forEach(btn => btn.classList.remove('activado'));
            button.classList.add('activado');

            const estadoSeleccionado = button.textContent.trim();

            scrollToRegistros();
            await filtrarRegistros(estadoSeleccionado, obtenerFiltroTiempo());
        });
    });

    tiempoButtons.forEach(button => {
        button.addEventListener('click', async () => {
            // Clear the search input
            inputBusqueda.value = '';

            tiempoButtons.forEach(btn => btn.classList.remove('activado'));
            button.classList.add('activado');

            const tiempoSeleccionado = button.textContent.trim();

            scrollToRegistros();
            await filtrarRegistros(obtenerFiltroEstado(), tiempoSeleccionado);
        });
    });

    // Función auxiliar para hacer scroll
    function scrollToRegistros() {
        requestAnimationFrame(() => {
            const tusRegistrosSubtitle = document.querySelector('.seccion2 h2.normal');
            if (tusRegistrosSubtitle) {
                tusRegistrosSubtitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }



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
            let registrosFiltrados = [];

            if (usuarioInfo.rol === 'Producción') {
                registrosFiltrados = registrosProduccion.filter(registro => {
                    const estadoMatch = estado === 'Todos' ||
                        (estado === 'Verificados' && registro.fecha_verificacion) ||
                        (estado === 'No verificados' && !registro.fecha_verificacion);

                    const [day, month, year] = registro.fecha.split('/').map(Number);
                    const registroDate = new Date(year + 2000, month - 1, day);
                    return estadoMatch && filtrarPorTiempo(registroDate, tiempo);
                });
            } else if (usuarioInfo.rol === 'Almacen') {
                registrosFiltrados = registrosMovimientos.filter(registro => {
                    const estadoMatch = estado === 'Todos' ||
                        (estado === 'Ingresos' && registro.tipo === 'Ingreso') ||
                        (estado === 'Salidas' && registro.tipo === 'Salida');

                    // Separar fecha y hora
                    const [fecha, hora] = registro.fecha_hora.split(', ');
                    const [day, month, year] = fecha.split('/').map(Number);
                    const registroDate = new Date(year, month - 1, day);

                    return estadoMatch && filtrarPorTiempo(registroDate, tiempo);
                });
            }

            const registrosParaMostrar = registrosFiltrados.slice(0, 10);
            actualizarRegistrosHTML(registrosParaMostrar, registrosFiltrados, tiempo); // Pass tiempo parameter

            setTimeout(resolve, 50);
        });
    }
    function filtrarPorTiempo(registroDate, tiempo) {
        const currentDate = new Date();
        let startDate = new Date();

        if (tiempo === 'Todos') return true;

        switch (tiempo) {
            case '7 dias':
                startDate.setDate(currentDate.getDate() - 7);
                break;
            case '15 dias':
                startDate.setDate(currentDate.getDate() - 15);
                break;
            case '1 mes':
                startDate.setMonth(currentDate.getMonth() - 1);
                break;
            case '3 meses':
                startDate.setMonth(currentDate.getMonth() - 3);
                break;
            case '6 meses':
                startDate.setMonth(currentDate.getMonth() - 6);
                break;
            case '1 año':
                startDate.setFullYear(currentDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(currentDate.getDate() - 7);
        }

        return registroDate >= startDate;
    }
    function actualizarRegistrosHTML(registrosParaMostrar, registrosFiltrados) {
        const registrosHTML = registrosParaMostrar.map(registro => {
            if (usuarioInfo.rol === 'Producción') {
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
                            <p class="estado ${estado.toLowerCase()}"><strong>${estado}</strong></p>
                        </div>
                    </div>
                `;
            } else if (usuarioInfo.rol === 'Almacen') {
                const tipo = registro.tipo === 'Ingreso' ? 'Ingreso' : 'Salida';
                return `
                    <div class="registro" data-id="${registro.id}">
                        <div class="info">
                            <p class="fecha">${registro.fecha_hora}</p>
                            <p class="producto">${registro.producto}</p>
                        </div>
                        <div class="detalles">
                            <p class="cantidad">Cantidad: <strong>${registro.cantidad}</strong></p>
                            <p class="tipo-movimiento ${tipo.toLowerCase()}"><strong>${registro.tipo}</strong></p>
                        </div>
                    </div>
                `;
            }
        }).join('');

        const registrosContainer = document.querySelector('.registros');
        registrosContainer.innerHTML = registrosHTML;

        // Actualizar botón "Cargar más"
        const existingLoadMoreButton = document.querySelector('.btn-cargar-mas');
        if (existingLoadMoreButton) {
            existingLoadMoreButton.remove();
        }

        if (registrosFiltrados.length > 10) {
            const loadMoreButton = document.createElement('button');
            loadMoreButton.textContent = 'Cargar más';
            loadMoreButton.classList.add('btn-cargar-mas');
            loadMoreButton.addEventListener('click', () => {
                cargarMasRegistros(registrosFiltrados);
            });
            registrosContainer.appendChild(loadMoreButton);
        }

        // Actualizar aviso
        const avisoElement = document.querySelector('.aviso');
        const estadoActual = document.querySelector('.filtros-opciones.estado .btn-filtro.activado').textContent.trim();
        avisoElement.textContent = `Registros ${estadoActual.toLowerCase()} de ${tiempo}`;
    }


    function cargarMasRegistros(registrosFiltrados) {
        const registrosContainer = document.querySelector('.registros');
        const registrosActuales = document.querySelectorAll('.registro');
        const currentCount = registrosActuales.length;

        // Obtener los nuevos registros
        const nuevosRegistros = registrosFiltrados.slice(currentCount, currentCount + 10);

        // Generar HTML para los nuevos registros
        const nuevosRegistrosHTML = nuevosRegistros.map(registro => {
            if (usuarioInfo.rol === 'Producción') {
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
            } else if (usuarioInfo.rol === 'Almacen') {
                const tipo = registro.tipo === 'Ingreso' ? 'Ingreso' : 'Salida';
                return `
                <div class="registro" data-id="${registro.id}">
                    <div class="info">
                        <p class="fecha">${registro.fecha_hora}</p>
                        <p class="producto">${registro.producto}</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Cantidad: <strong>${registro.cantidad}</strong></p>
                        <p class="tipo-movimiento ${tipo.toLowerCase()}">Tipo: <strong>${registro.tipo}</strong></p>
                    </div>
                </div>
            `;
            }
        }).join('');

        // Agregar los nuevos registros al contenedor
        registrosContainer.insertAdjacentHTML('beforeend', nuevosRegistrosHTML);

        // Actualizar el botón "Cargar más"
        const loadMoreButton = document.querySelector('.btn-cargar-mas');
        if (loadMoreButton) {
            loadMoreButton.remove();
        }

        // Agregar el botón "Cargar más" si hay más registros
        if (currentCount + 10 < registrosFiltrados.length) {
            const newLoadMoreButton = document.createElement('button');
            newLoadMoreButton.textContent = 'Cargar más';
            newLoadMoreButton.classList.add('btn-cargar-mas');
            newLoadMoreButton.addEventListener('click', () => cargarMasRegistros(registrosFiltrados));
            registrosContainer.appendChild(newLoadMoreButton);
        }
    }
    window.cargarMasRegistros = cargarMasRegistros;

    document.querySelectorAll('.registro').forEach(registroElement => {
        registroElement.addEventListener('click', () => {
            const registroId = registroElement.getAttribute('data-id');
            if (usuarioInfo.rol === 'Producción') {
                const registro = registrosProduccion.find(r => r.id === registroId);
                mostrarDetalleRegistro(registro);
            } else if (usuarioInfo.rol === 'Almacen') {
                const registro = registrosMovimientos.find(r => r.id === registroId);
                mostrarDetalleRegistroAlmacen(registro);
            }
        });
    });

    function mostrarDetalleRegistro(registro) {
        const contenido = document.querySelector('.anuncio .contenido');
        const detalleHTML = `
            <div class="encabezado">
                <h1 class="titulo">Detalles del Registro</h1>
                <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-calendar'></i> Fecha:</strong> ${registro.fecha}</span>
                    <span><strong><i class='bx bx-id-card'></i> ID:</strong> ${registro.id}</span>
                </div>

                <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-package'></i> Producto:</strong> ${registro.producto}</span>
                    <span><strong><i class='bx bx-cube'></i> Gramos:</strong> ${registro.gramos}gr.</span>
                    <span><strong><i class='bx bx-box'></i> Lote:</strong> ${registro.lote}</span>
                </div>

                <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de producción</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-package'></i> Seleccionado/cernido:</strong> ${registro.proceso}</span>
                    <span><strong><i class='bx bx-microchip'></i> Microondas:</strong> ${registro.microondas}</span>
                    <span><strong><i class='bx bx-package'></i> Envases terminados:</strong> ${registro.envases_terminados} Und.</span>
                    <span><strong><i class='bx bx-calendar'></i> Fecha de vencimiento:</strong> ${registro.fecha_vencimiento}</span>
                </div>
                <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de verificación</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-transfer'></i> Verificado:</strong> ${registro.fecha_verificacion ? `${registro.c_real} Und.` : 'Pendiente'}</span>
                    ${registro.fecha_verificacion ? `<span><strong><i class='bx bx-calendar-check'></i> Fecha verificación:</strong> ${registro.fecha_verificacion}</span>` : ''}
                ${registro.observaciones ? `
                        <span><strong><i class='bx bx-comment-detail'></i> Observaciones: </strong> ${registro.observaciones}</span>
                    </div>
                ` : ''}
            </div>
        `;
        contenido.style.paddingBottom = '0';
        contenido.innerHTML = detalleHTML;
        mostrarAnuncio();
    }
    function mostrarDetalleRegistroAlmacen(registro) {
        const contenido = document.querySelector('.anuncio .contenido');
        const detalleHTML = `
            <div class="encabezado">
                <h1 class="titulo">Detalles del Movimiento</h1>
                <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-calendar'></i> Fecha y Hora:</strong> ${registro.fecha_hora}</span>
                    <span><strong><i class='bx bx-id-card'></i> ID:</strong> ${registro.id}</span>
                </div>

                <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-package'></i> Producto:</strong> ${registro.producto}</span>
                    <span><strong><i class='bx bx-cube'></i> Cantidad:</strong> ${registro.cantidad}Unidades</span>
                </div>

                <p class="normal"><i class='bx bx-chevron-right'></i> Detalles del movimiento</p>
                <div class="campo-vertical">
                    <span><strong><i class='bx bx-transfer'></i> Tipo:</strong> ${registro.tipo === 'entrada' ? 'Ingreso' : 'Salida'}</span>
                    ${registro.destino ? `<span><strong><i class='bx bx-map'></i> Destino:</strong> ${registro.destino}</p>` : ''}
                    ${registro.origen ? `<span><strong><i class='bx bx-map-pin'></i> Origen:</strong> ${registro.origen}</span>` : ''}
                    ${registro.motivo ? `<span><strong><i class='bx bx-message-square-detail'></i>Motivo:</strong> ${registro.motivo}</span>` : ''}
                </div>

                ${registro.observaciones ? `
                    <p class="normal"><i class='bx bx-chevron-right'></i> Observaciones</p>
                    <div class="campo-vertical">
                        <span><strong><i class='bx bx-comment-detail'></i> Obervaciones:</strong>${registro.observaciones}</span>
                    </div>
                ` : ''}
            </div>
        `;
        contenido.style.paddingBottom = '0';
        contenido.innerHTML = detalleHTML;
        mostrarAnuncio();
    }
}