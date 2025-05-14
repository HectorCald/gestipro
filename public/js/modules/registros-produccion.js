let registrosProduccion = [];
let usuarioInfo = recuperarUsuarioLocal();


function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}
async function obtenerMisRegistros() {
    try {
        mostrarCarga();
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
    }finally {
        ocultarCarga();
    }
}


export async function mostrarMisRegistros() {
    await obtenerMisRegistros();

    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Mis registros</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <button class="btn filtros"><i class='bx bx-filter'></i></button>
        </div>
        <div class="relleno">
            <div class="buscador">
                <input type="text" class="buscar-registro-produccion" placeholder="Buscar...">
                <i class='bx bx-search'></i>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros</p>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Verificados</button>
                <button class="btn-filtro">Obeservados</button>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Registros</p>
                ${registrosProduccion.map(registro => `
                <div class="registro-item" data-id="${registro.id}">
                    <div class="header">
                        <span class="nombre">${registro.id}<span class="valor ${registro.fecha_verificacion ? 'verificado' : 'pendiente'}">${registro.fecha_verificacion ? 'Verificado' : 'Pendiente'}</span></span>
                        <span class="valor" color var><strong>${registro.producto} - ${registro.gramos}gr.</strong></span>
                        <span class="fecha">${registro.fecha}</span>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info btn-icon gray" data-id="${registro.id}"><i class='bx bx-info-circle'></i>Info</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    contenido.style.paddingBottom = '10px';
    mostrarAnuncio();
    const { aplicarFiltros } = eventosMisRegistros();

    aplicarFiltros('Todos');
}
function eventosMisRegistros() {
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
    const botonesInfo = document.querySelectorAll('.btn-info');
    const filtros = document.querySelector('.filtros');
    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-registro-produccion');
    const iconoBusqueda = document.querySelector('.relleno .buscador i');


    inputBusqueda.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value);
        iconoBusqueda.className = busqueda ? 'bx bx-x' : 'bx bx-search';

        // Cambiar icono y clase según si hay texto
        if (busqueda) {
            iconoBusqueda.className = 'bx bx-x';
        } else {
            iconoBusqueda.className = 'bx bx-search';
        }

        const registros = document.querySelectorAll('.registro-item');
        registros.forEach(registro => {
            const producto = registrosProduccion.find(p => p.id === registro.dataset.id);
            const textoProducto = normalizarTexto(producto.producto);

            if (!busqueda ||
                textoProducto.includes(busqueda) ||
                normalizarTexto(producto.fecha_verificacion).includes(busqueda) ||
                normalizarTexto(producto.producto).includes(busqueda) ||
                normalizarTexto(producto.gramos).includes(busqueda)) {
                registro.style.display = '';
            } else {
                registro.style.display = 'none';
            }
        });
    });
    iconoBusqueda.addEventListener('click', () => {
        if (inputBusqueda.value) {
            inputBusqueda.value = '';
            iconoBusqueda.className = 'bx bx-search';
            // Show all records when clearing search
            document.querySelectorAll('.registro-item').forEach(registro => {
                registro.style.display = '';
            });
            // Reactivate "Todos" filter
            document.querySelector('.btn-filtro').classList.add('activado');
        }
    })
    function normalizarTexto(texto) {
        return texto.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[-_\s]+/g, ''); // Eliminar guiones, guiones bajos y espacios
    }



    items.forEach(item => {
        const accionesDiv = item.querySelector('.registro-acciones');
        if (accionesDiv && !item.querySelector('.fecha_verificacion')) {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                // Ocultar todos los demás menús
                document.querySelectorAll('.registro-item').forEach(otroItem => {
                    if (otroItem !== item) {
                        otroItem.classList.remove('activo');
                        otroItem.querySelector('.registro-acciones')?.classList.remove('mostrar');
                    }
                });

                // Alternar estado actual
                item.classList.toggle('activo');
                accionesDiv.classList.toggle('mostrar');
            });
        }
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.registro-item').forEach(item => {
            item.classList.remove('activo');
            item.querySelector('.registro-acciones')?.classList.remove('mostrar');
        });
    });
    document.querySelector('.contenido').addEventListener('click', () => {
        document.querySelectorAll('.registro-item').forEach(item => {
            item.classList.remove('activo');
            item.querySelector('.registro-acciones')?.classList.remove('mostrar');
        });
    });
    document.querySelector('.relleno').addEventListener('scroll', () => {
        document.querySelectorAll('.registro-item').forEach(item => {
            item.classList.remove('activo');
            item.querySelector('.registro-acciones')?.classList.remove('mostrar');
        });
    });



    botonesInfo.forEach(btn => {
        btn.addEventListener('click', info);
    });
    filtros.addEventListener('click', filtroAvanzado);

    let filtroNombreActual = 'Todos';


    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');
        const filtroTipo = filtroNombreActual;

        registros.forEach(registro => {
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);

            if (!registroData) {
                return;
            }
            let mostrar = true;
            // Filtro por tipo modificado
            if (filtroTipo !== 'todos') {
                const estadoRegistro = registroData.fecha_verificacion ? 'verificado' : 'pendiente';
                
                if (filtroTipo === 'verificado' && estadoRegistro !== 'verificado') mostrar = false;
                if (filtroTipo === 'pendiente' && estadoRegistro !== 'pendiente') mostrar = false;
                if (filtroTipo === 'obeservados') mostrar = false; // Mantenemos la lógica original para observados
            }

            registro.style.display = mostrar ? '' : 'none';
        });
    }
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }


    botonesEstado.forEach(boton => {
        boton.addEventListener('click', async () => { // Agregar async aquí
            botonesEstado.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');

            const tipoFiltro = boton.textContent.trim().toLowerCase();


            if (tipoFiltro === 'pendientes') {
                filtroNombreActual = 'pendiente';
            }
            else if (tipoFiltro === 'verificados') {
                filtroNombreActual = 'verificado';
            }
            else if (tipoFiltro === 'todos') {
                filtroNombreActual = 'todos';
            }
            else if (tipoFiltro === 'Obeservados') {
                filtroNombreActual = 'observado';
            }

            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });


    function info(event) {
        const registroId = event.currentTarget.dataset.id;
        const registro = registrosProduccion.find(r => r.id === registroId);  // Changed from registrosProduccion

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Detalles del Registro</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
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
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();
    }
    function filtroAvanzado() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Filtros avanzados</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-produccion">
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros por fecha</p>
                <div class="entrada">
                    <i class='bx bx-calendar-alt'></i>
                    <div class="input">
                        <p class="detalle">Desde</p>
                        <input class="fecha-desde" type="date" autocomplete="off" placeholder=" ">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-calendar-alt'></i>
                    <div class="input">
                        <p class="detalle">Hasta</p>
                        <input class="fecha-hasta" type="date" autocomplete="off" placeholder=" ">
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros por operador</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Operador</p>
                        <select class="select-operador">
                            <option value="Todos">Todos</option>
                            ${[...new Set(registrosProduccion.map(r => r.nombre))].map(nombre =>
            `<option value="${nombre}">${nombre}</option>`
        ).join('')}
                        </select>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros por estado</p>
                <div class="entrada">
                    <i class='bx bx-check-circle'></i>
                    <div class="input">
                        <p class="detalle">Estado</p>
                        <select class="select-estado">
                            <option value="Todos">Todos</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="verificado">Verificados</option>
                        </select>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros por producto</p>
                <div class="entrada">
                    <i class='bx bx-cube'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <select class="select-producto">
                            <option value="Todos">Todos</option>
                            ${[...new Set(registrosProduccion.map(r => r.producto))].map(producto =>
            `<option value="${producto}">${producto}</option>`
        ).join('')}
                        </select>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-barcode'></i>
                    <div class="input">
                        <p class="detalle">Lote</p>
                        <input class="lote" type="number" placeholder=" ">
                    </div>
                </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-aplicar-filtros btn orange"><i class='bx bx-filter-alt'></i> Aplicar filtros</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        // Agregar evento al botón de aplicar filtros
        const btnAplicar = contenido.querySelector('.btn-aplicar-filtros');
        btnAplicar.addEventListener('click', aplicarFiltrosAvanzados);

        function aplicarFiltrosAvanzados() {
            const fechaDesde = document.querySelector('.anuncio-second .fecha-desde').value;
            const fechaHasta = document.querySelector('.anuncio-second .fecha-hasta').value;
            const operador = document.querySelector('.anuncio-second .select-operador').value === 'Todos' ? '' : document.querySelector('.anuncio-second .select-operador').value;
            const estado = document.querySelector('.anuncio-second .select-estado').value === 'Todos' ? '' : document.querySelector('.anuncio-second .select-estado').value;
            const producto = document.querySelector('.anuncio-second .select-producto').value === 'Todos' ? '' : document.querySelector('.anuncio-second .select-producto').value;
            const lote = document.querySelector('.anuncio-second .lote').value;

            const registros = document.querySelectorAll('.anuncio .registro-item');
            registros.forEach(registro => {
                const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
                let mostrar = true;

                // Filtro mejorado por fecha
                if (fechaDesde || fechaHasta) {
                    const [dia, mes, anioStr] = registroData.fecha.split('/');
                    const anioCompleto = anioStr.length === 2 ? '20' + anioStr : anioStr;

                    // Crear fecha del registro al inicio del día
                    const fechaRegistro = new Date(anioCompleto, parseInt(mes) - 1, parseInt(dia));
                    fechaRegistro.setHours(0, 0, 0, 0);

                    if (fechaDesde) {
                        const [anioDesde, mesDesde, diaDesde] = fechaDesde.split('-');
                        const fechaDesdeObj = new Date(parseInt(anioDesde), parseInt(mesDesde) - 1, parseInt(diaDesde));
                        fechaDesdeObj.setHours(0, 0, 0, 0);
                        if (fechaRegistro < fechaDesdeObj) mostrar = false;
                    }

                    if (fechaHasta) {
                        const [anioHasta, mesHasta, diaHasta] = fechaHasta.split('-');
                        const fechaHastaObj = new Date(parseInt(anioHasta), parseInt(mesHasta) - 1, parseInt(diaHasta));
                        // Establecer al final del día seleccionado (23:59:59.999)
                        fechaHastaObj.setHours(23, 59, 59, 999);
                        if (fechaRegistro > fechaHastaObj) mostrar = false;
                    }
                }

                // Resto de los filtros sin cambios...
                if (operador && registroData.nombre !== operador) mostrar = false;
                if (estado) {
                    if (estado === 'pendiente' && registroData.fecha_verificacion) mostrar = false;
                    if (estado === 'verificado' && !registroData.fecha_verificacion) mostrar = false;
                }
                if (producto && registroData.producto !== producto) mostrar = false;
                if (lote && registroData.lote !== lote) mostrar = false;

                registro.style.display = mostrar ? '' : 'none';
            });

            // Desactivar botones de filtro
            const botonesFiltro = document.querySelectorAll('.btn-filtro');
            botonesFiltro.forEach(boton => boton.classList.remove('activado'));

            ocultarAnuncioSecond();
        }
    }


    return { aplicarFiltros };
}
