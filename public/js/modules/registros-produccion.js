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
    } finally {
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
        </div>
        <div class="relleno">
            <div class="buscador">
                <input type="text" class="buscar-registro-produccion" placeholder="Buscar...">
                <i class='bx bx-search lupa'></i>
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
            </div>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Verificados</button>
                <button class="btn-filtro">Observados</button>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Registros</p>
            ${registrosProduccion.map(registro => `
            <div class="registro-item" data-id="${registro.id}">
                <div class="header">
                    <i class='bx bx-file'></i>
                    <div class="info-header">
                        <span class="id">${registro.id}<span class="valor ${registro.fecha_verificacion ? 'verificado' : 'pendiente'}">${registro.fecha_verificacion ? 'Verificado' : 'Pendiente'}</span></span>
                        <span class="nombre"><strong>${registro.producto} - ${registro.gramos}gr.</strong></span>
                        <span class="fecha">${registro.fecha}</span>
                    </div>
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
    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-registro-produccion');
    const iconoBusqueda = document.querySelector('.buscador .lupa');
    const botonCalendario = document.querySelector('.btn-calendario');


    let filtroNombreActual = 'todos';
    let filtroFechaInstance = null;


    botonCalendario.addEventListener('click', async () => {
        if (!filtroFechaInstance) {
            filtroFechaInstance = flatpickr(botonCalendario, {
                mode: "range",
                dateFormat: "d/m/Y",
                locale: "es",
                rangeSeparator: " hasta ",
                onChange: function (selectedDates) {
                    if (selectedDates.length === 2) {
                        aplicarFiltros();
                        botonCalendario.classList.add('con-fecha');
                    } else if (selectedDates.length === 0) {
                        // Show all records when dates are cleared
                        document.querySelectorAll('.registro-item').forEach(registro => {
                            registro.style.display = '';
                        });
                        botonCalendario.classList.remove('con-fecha');
                    }
                },
                onClose: function (selectedDates) {
                    if (selectedDates.length === 1) {
                        // Show all records when calendar is closed without dates
                        document.querySelectorAll('.registro-item').forEach(registro => {
                            registro.style.display = '';
                        });
                        botonCalendario.classList.remove('con-fecha');
                    }
                }
            });
        }
        filtroFechaInstance.open();
    });
    botonesEstado.forEach(boton => {
        boton.addEventListener('click', async () => {
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
            else if (tipoFiltro === 'observados') {
                filtroNombreActual = 'observado';
            }

            aplicarFiltros();
            await scrollToCenter(boton, boton.parentElement);
        });
    });
    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');
        const filtroTipo = filtroNombreActual;
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);

        registros.forEach(registro => {
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return;

            let mostrarPorEstado = true;
            let mostrarPorFecha = true;
            let mostrarPorBusqueda = true;

            // Filtro por estado
            if (filtroTipo !== 'todos') {
                const estadoRegistro = registroData.fecha_verificacion ? 'verificado' : 'pendiente';
                mostrarPorEstado = (filtroTipo === estadoRegistro);
            }

            // Filtro por fecha
            if (fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                fechaRegistro.setHours(0, 0, 0, 0);

                const fechaInicio = new Date(fechasSeleccionadas[0]);
                fechaInicio.setHours(0, 0, 0, 0);
                const fechaFin = new Date(fechasSeleccionadas[1]);
                fechaFin.setHours(23, 59, 59, 999);

                mostrarPorFecha = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            // Filtro por búsqueda
            if (busqueda) {
                mostrarPorBusqueda = 
                    normalizarTexto(registroData.producto).includes(busqueda) ||
                    normalizarTexto(registroData.fecha_verificacion || '').includes(busqueda) ||
                    normalizarTexto(registroData.gramos).includes(busqueda) ||
                    normalizarTexto(registroData.lote).includes(busqueda) ||
                    normalizarTexto(registroData.fecha).includes(busqueda);
            }

            registro.style.display = (mostrarPorEstado && mostrarPorFecha && mostrarPorBusqueda) ? '' : 'none';
        });
    }
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }


    inputBusqueda.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value);
        iconoBusqueda.className = busqueda ? 'bx bx-x lupa' : 'bx bx-search lupa';
        aplicarFiltros();
    });
    iconoBusqueda.addEventListener('click', () => {
        if (inputBusqueda.value) {
            inputBusqueda.value = '';
            iconoBusqueda.className = 'bx bx-search lupa';
            aplicarFiltros();
        }
    });
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
            <p class="normal"><i class='bx bx-chevron-right'></i>Información básica</p>
            <div class="campo-vertical">
                <span><strong><i class='bx bx-calendar'></i> Fecha:</strong> ${registro.fecha}</span>
                <span><strong><i class='bx bx-id-card'></i> ID:</strong> ${registro.id}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Información del producto</p>
            <div class="campo-vertical">
                <span><strong><i class='bx bx-package'></i> Producto:</strong> ${registro.producto}</span>
                <span><strong><i class='bx bx-cube'></i> Gramos:</strong> ${registro.gramos}gr.</span>
                <span><strong><i class='bx bx-box'></i> Lote:</strong> ${registro.lote}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles de producción</p>
            <div class="campo-vertical">
                <span><strong><i class='bx bx-package'></i> Seleccionado/cernido:</strong> ${registro.proceso}</span>
                <span><strong><i class='bx bx-microchip'></i> Microondas:</strong> ${registro.microondas}</span>
                <span><strong><i class='bx bx-package'></i> Envases terminados:</strong> ${registro.envases_terminados} Und.</span>
                <span><strong><i class='bx bx-calendar'></i> Fecha de vencimiento:</strong> ${registro.fecha_vencimiento}</span>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles de verificación</p>
            <div class="campo-vertical">
                <span><strong><i class='bx bx-transfer'></i> Verificado:</strong> ${registro.fecha_verificacion ? `${registro.c_real} Und.` : 'Pendiente'}</span>
                ${registro.fecha_verificacion ? `<span><strong><i class='bx bx-calendar-check'></i> Fecha verificación:</strong> ${registro.fecha_verificacion}</span>` : ''}
            ${registro.observaciones ? `
                    <span><strong><i class='bx bx-comment-detail'></i>Observaciones: </strong> ${registro.observaciones}</span>
                </div>
            ` : ''}
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();
    }

    return { aplicarFiltros };
}
