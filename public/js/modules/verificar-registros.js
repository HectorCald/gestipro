let registrosProduccion = recuperarRegistrosProduccionLocal();
let usuarioInfo = recuperarUsuarioLocal();
function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}
function recuperarRegistrosProduccionLocal() {
    const registrosGuardados = localStorage.getItem('damabrava_registros_produccion');
    if (registrosGuardados) {
        return JSON.parse(registrosGuardados);
    }
    return [];
}
function limpiarRegistrosProduccionLocal() {
    localStorage.removeItem('damabrava_registros_produccion');
    registrosProduccion = [];
}


async function obtenerRegistrosProduccion() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-registros-produccion');
        const data = await response.json();

        if (data.success) {
            registrosProduccion = data.registros
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
            
            // Guardar en localStorage
            localStorage.setItem('damabrava_registros_produccion', JSON.stringify(registrosProduccion));
            return true;
        } else {
            // Intentar recuperar del localStorage si falla el servidor
            const registrosGuardados = localStorage.getItem('damabrava_registros_produccion');
            if (registrosGuardados) {
                registrosProduccion = JSON.parse(registrosGuardados);
                return true;
            }
            
            mostrarNotificacion({
                message: 'Error al obtener registros de producción',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        const registrosGuardados = localStorage.getItem('damabrava_registros_produccion');
        if (registrosGuardados) {
            registrosProduccion = JSON.parse(registrosGuardados);
            return true;
        }
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


export async function mostrarVerificacion() {
    const contenido = document.querySelector('.anuncio .contenido');
    const nombresUnicos = [...new Set(registrosProduccion.map(registro => registro.nombre))];
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Registros de producción</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="buscador">
                <input type="text" class="buscar-registro-verificacion" placeholder="Buscar...">
                <i class='bx bx-search lupa'></i>
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
            </div>
            <div class="filtros-opciones nombre">
                <button class="btn-filtro activado">Todos</button>
                ${nombresUnicos.map(nombre => `
                    <button class="btn-filtro">${nombre}</button>
                `).join('')}
            </div>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Verificados</button>
                <button class="btn-filtro">Observados</button>
            </div>
                ${registrosProduccion.map(registro => `
                <div class="registro-item" data-id="${registro.id}">
                    <div class="header">
                        <i class='bx bx-file'></i>
                        <div class="info-header">
                            <span class="id">${registro.nombre}<span class="valor ${registro.fecha_verificacion ? 'verificado' : 'pendiente'}">${registro.fecha_verificacion ? 'Verificado' : 'Pendiente'}</span></span>
                            <span class="nombre"><strong>${registro.producto} - ${registro.gramos}gr.</strong></span>
                            <span class="fecha">${registro.fecha}</span>
                        </div>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info btn-icon gray" data-id="${registro.id}"><i class='bx bx-info-circle'></i>Info</button>
                        ${!registro.fecha_verificacion ? `
                            <button class="btn-editar btn-icon blue" data-id="${registro.id}"><i class='bx bx-edit'></i> Editar</button>
                            <button class="btn-eliminar btn-icon red" data-id="${registro.id}"><i class="bx bx-trash"></i> Eliminar</button>
                            <button class="btn-verificar btn-icon green" data-id="${registro.id}"><i class="bx bx-check-circle"></i> Verificar</button>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
            <p class="no-encontrado" style="text-align: center; font-size: 15px; color: #777; width:100%; padding:15px; display:none">
                <i class='bx bx-box' style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                ¡Ups! No encontramos registros que coincidan con tu búsqueda o filtrado.
            </p>
        </div>
        <div class="anuncio-botones">
            <button id="exportar-excel" class="btn orange" style="margin-bottom:10px"><i class='bx bx-download'></i> Descargar registros</button>
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();


    const { aplicarFiltros } = eventosVerificacion();
    aplicarFiltros('Todos', 'Todos');
}
function eventosVerificacion() {
    const btnExcel = document.getElementById('exportar-excel');
    const registrosAExportar = registrosProduccion;

    const botonesNombre = document.querySelectorAll('.filtros-opciones.nombre .btn-filtro');
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');


    const botonesVerificar = document.querySelectorAll('.btn-verificar');
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    const botonesEditar = document.querySelectorAll('.btn-editar');
    const botonesInfo = document.querySelectorAll('.btn-info');


    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-registro-verificacion');
    const iconoBusqueda = document.querySelector('.buscador .lupa');
    const botonCalendario = document.querySelector('.btn-calendario');


    let filtroFechaInstance = null;
    let filtroNombreActual = 'Todos';
    let filtroEstadoActual = 'Todos';

    function normalizarTexto(texto) {
        return texto.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[-_\s]+/g, ''); // Eliminar guiones, guiones bajos y espacios
    }
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    function aplicarFiltros() {
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const items = document.querySelectorAll('.registro-item');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Lógica de filtrado existente
            if (filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = !registroData.fecha_verificacion;
                } else if (filtroEstadoActual === 'Verificados') {
                    mostrar = !!registroData.fecha_verificacion;
                } else if (filtroEstadoActual === 'Observados') {
                    mostrar = registroData.observaciones && registroData.observaciones !== 'Sin observaciones';
                }
            }

            if (mostrar && filtroNombreActual && filtroNombreActual !== 'Todos') {
                mostrar = registroData.nombre === filtroNombreActual;
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];

                fechaRegistro.setHours(0, 0, 0, 0);
                fechaInicio.setHours(0, 0, 0, 0);
                fechaFin.setHours(23, 59, 59, 999);

                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.gramos?.toString(),
                    registroData.lote?.toString(),
                    registroData.fecha,
                    registroData.nombre,
                    registroData.proceso
                ].filter(Boolean).join(' ').toLowerCase();

                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Animación de ocultamiento
        items.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        // Esperar a que termine la animación de ocultamiento
        setTimeout(() => {
            items.forEach(registro => {
                registro.style.display = 'none';
            });

            // Mostrar los filtrados con animación escalonada
            registrosFiltrados.forEach(({ elemento, mostrar }, index) => {
                if (mostrar) {
                    elemento.style.display = 'flex';
                    elemento.style.opacity = '0';
                    elemento.style.transform = 'translateY(20px)';

                    setTimeout(() => {
                        elemento.style.opacity = '1';
                        elemento.style.transform = 'translateY(0)';
                    }, 20); // Efecto cascada suave
                }
            });

            // Actualizar mensaje de no encontrado
            if (mensajeNoEncontrado) {
                mensajeNoEncontrado.style.display = registrosVisibles === 0 ? 'block' : 'none';
            }
        }, 100);
    }
    botonesNombre.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesNombre.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroNombreActual = boton.textContent.trim();
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });
    botonesEstado.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesEstado.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroEstadoActual = boton.textContent.trim();
            scrollToCenter(boton, boton.parentElement);
            aplicarFiltros();
        });
    });
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
                    } else if (selectedDates.length <= 1) {
                        botonCalendario.classList.remove('con-fecha');
                    }
                },
                onClose: function (selectedDates) {
                    if (selectedDates.length <= 1) {
                        aplicarFiltros();
                        botonCalendario.classList.remove('con-fecha');
                    }
                }
            });
        }
        filtroFechaInstance.open();
    });
    inputBusqueda.addEventListener('input', () => {
        aplicarFiltros();
        iconoBusqueda.className = inputBusqueda.value ? 'bx bx-x lupa' : 'bx bx-search lupa';
    });
    iconoBusqueda.addEventListener('click', () => {
        if (inputBusqueda.value) {
            inputBusqueda.value = '';
            iconoBusqueda.className = 'bx bx-search lupa';
            aplicarFiltros();
        }
    });


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
    botonesVerificar.forEach(btn => {
        btn.addEventListener('click', verificar);
    });
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', eliminar);
    });
    botonesEditar.forEach(btn => {
        btn.addEventListener('click', editar);
    });


    function verificar(event) {
        const registroId = event.currentTarget.dataset.id;

        const registro = registrosProduccion.find(r => r.id === registroId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Verificar registro</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
           <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                <span class="nombre"><strong><i class='bx bx-user'></i> Operador: </strong>${registro.nombre}</span>
                <span class="fecha"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
            <div class="campo-vertical">
                <span class="producto"><strong><i class='bx bx-cube'></i> Producto: </strong>${registro.producto}</span>
                <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${registro.gramos}gr.</span>
                <span class="valor"><strong><i class='bx bx-barcode'></i> Lote: </strong>${registro.lote}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de producción</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-cog'></i> Selección/Cernido: </strong>${registro.proceso}</span>
                <span class="valor"><strong><i class='bx bx-bowl-hot'></i> Microondas: </strong>${registro.microondas}</span>
                <span class="valor"><strong><i class='bx bx-check-shield'></i> Envases terminados: </strong>${registro.envases_terminados}</span>
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha de vencimiento: </strong>${registro.fecha_vencimiento}</span>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Verificación</p>
            <div class="entrada">
                <i class='bx bx-hash'></i>
                <div class="input">
                    <p class="detalle">Cantidad real</p>
                    <input class="cantidad_real" type="number" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Observaciones</p>
                    <input class="observaciones" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-verificar-registro btn orange"><i class='bx bx-check-circle'></i> Verificar</button>
        </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnVerificar = contenido.querySelector('.btn-verificar-registro');
        btnVerificar.addEventListener('click', confirmarVerificacion);

        async function confirmarVerificacion() {
            const cantidadReal = document.querySelector('.verificar-registro .cantidad_real').value.trim();
            const observaciones = document.querySelector('.verificar-registro .observaciones').value.trim();

            if (!cantidadReal) {
                mostrarNotificacion({
                    message: 'Debe ingresar la cantidad real verificada',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();

                const registro = registrosProduccion.find(r => r.id === registroId);

                const response = await fetch(`/verificar-registro-produccion/${registroId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cantidad_real: cantidadReal,
                        observaciones: observaciones || 'Sin observaciones'
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await registrarHistorial(
                        `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
                        'Verificación',
                        `Cantidad real: ${cantidadReal} - Registro: ${registro.producto} (${registro.lote})`
                    );

                    mostrarNotificacion({
                        message: 'Registro verificado correctamente',
                        type: 'success',
                        duration: 3000
                    });

                    ocultarAnuncioSecond();
                    await obtenerRegistrosProduccion();
                    await mostrarVerificacion();
                    await mostrarIngresos(registro.producto); // Pasar el nombre del producto verificado
                } else {
                    throw new Error(data.error || 'Error al verificar el registro');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al verificar el registro',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        }
    }
    function info(event) {
        const registroId = event.currentTarget.dataset.id;
        // Encontrar el registro correspondiente
        const registro = registrosProduccion.find(r => r.id === registroId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Info registro</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                <span class="nombre"><strong><i class='bx bx-user'></i> Operador: </strong>${registro.nombre}</span>
                <span class="fecha"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
            <div class="campo-vertical">
                <span class="producto"><strong><i class='bx bx-cube'></i> Producto: </strong>${registro.producto}</span>
                <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${registro.gramos}gr.</span>
                <span class="valor"><strong><i class='bx bx-barcode'></i> Lote: </strong>${registro.lote}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de producción</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-cog'></i> Selección/Cernido: </strong>${registro.proceso}</span>
                <span class="valor"><strong><i class='bx bx-bowl-hot'></i> Microondas: </strong>${registro.microondas}</span>
                <span class="valor"><strong><i class='bx bx-check-shield'></i> Envases terminados: </strong>${registro.envases_terminados}</span>
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha de vencimiento: </strong>${registro.fecha_vencimiento}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de verificación</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-hash'></i> Cantidad real: </strong>${registro.c_real || 'No verificado'}</span>
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha de verificación: </strong>${registro.fecha_verificacion || 'Pendiente'}</span>
                <span class="valor"><strong><i class='bx bx-comment-detail'></i> Observaciones: </strong>${registro.observaciones || 'Sin observaciones'}</span>
            </div>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();
    }
    function eliminar(event) {
        const registroId = event.currentTarget.dataset.id;
        // Encontrar el registro correspondiente
        const registro = registrosProduccion.find(r => r.id === registroId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Eliminar registro</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                <span class="nombre"><strong><i class='bx bx-user'></i> Operador: </strong>${registro.nombre}</span>
                <span class="fecha"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
            <div class="campo-vertical">
                <span class="producto"><strong><i class='bx bx-cube'></i> Producto: </strong>${registro.producto}</span>
                <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${registro.gramos}gr.</span>
                <span class="valor"><strong><i class='bx bx-barcode'></i> Lote: </strong>${registro.lote}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de producción</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-cog'></i> Selección/Cernido: </strong>${registro.proceso}</span>
                <span class="valor"><strong><i class='bx bx-bowl-hot'></i> Microondas: </strong>${registro.microondas}</span>
                <span class="valor"><strong><i class='bx bx-check-shield'></i> Envases terminados: </strong>${registro.envases_terminados}</span>
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha de vencimiento: </strong>${registro.fecha_vencimiento}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de verificación</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-hash'></i> Cantidad real: </strong>${registro.c_real || 'No verificado'}</span>
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha de verificación: </strong>${registro.fecha_verificacion || 'Pendiente'}</span>
                <span class="valor"><strong><i class='bx bx-comment-detail'></i> Observaciones: </strong>${registro.observaciones || 'Sin observaciones'}</span>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Motivo de la eliminación</p>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Motivo</p>
                    <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-eliminar-registro btn red"><i class="bi bi-trash-fill"></i> Eliminar</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnEliminar = contenido.querySelector('.btn-eliminar-registro');
        btnEliminar.addEventListener('click', confirmarEliminacion);

        async function confirmarEliminacion() {
            const motivo = document.querySelector('.motivo').value.trim();

            if (!motivo) {
                mostrarNotificacion({
                    message: 'Debe ingresar el motivo de la eliminación',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();

                // Aseguramos que la URL sea correcta
                const response = await fetch(`/eliminar-registro-produccion/${registroId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    // Registrar en historial
                    await registrarHistorial(
                        `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
                        'Eliminación',
                        `Motivo: ${motivo} - Registro: ${registro.producto} (${registro.lote})`
                    );

                    mostrarNotificacion({
                        message: 'Registro eliminado correctamente',
                        type: 'success',
                        duration: 3000
                    });

                    ocultarAnuncioSecond();
                    await obtenerRegistrosProduccion();
                    await mostrarVerificacion();
                } else {
                    throw new Error(data.error || 'Error al eliminar el registro');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al eliminar el registro',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        }
    }
    function editar(event) {
        const registroId = event.currentTarget.dataset.id;
        // Encontrar el registro correspondiente
        const registro = registrosProduccion.find(r => r.id === registroId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Editar registro</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-produccion">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información basica</p>
                <div class="entrada">
                    <i class='bx bx-cube'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" type="text" value="${registro.producto}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class="ri-scales-line"></i>
                    <div class="input">
                        <p class="detalle">Gramaje</p>
                        <input class="gramaje" type="number" value="${registro.gramos}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Información del proceso</p>
                <div class="entrada">
                    <i class='bx bx-cog'></i>
                    <div class="input">
                        <p class="detalle">Proceso</p>
                        <select class="select" required>
                            <option value="${registro.proceso}" selected>${registro.proceso}</option>
                            <option value="Seleccion">Selección</option>
                            <option value="Cernido">Cernido</option>
                        </select>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-bowl-hot'></i>
                    <div class="input">
                        <p class="detalle">Microondas</p>
                        <input class="microondas" type="text" value="${registro.microondas}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Información del acabado</p>
                <div class="entrada">
                    <i class='bx bx-check-shield'></i>
                    <div class="input">
                        <p class="detalle">Terminados</p>
                        <input class="terminados" type="number" value="${registro.envases_terminados}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-barcode'></i>
                    <div class="input">
                        <p class="detalle">Lote</p>
                        <input class="lote" type="number" autocomplete="off" value="${registro.lote}" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-calendar'></i>
                    <div class="input">
                        <p class="detalle">vencimiento</p>
                        <input class="vencimiento" type="month" value="${registro.fecha_vencimiento}" placeholder=" " required>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Información de verificación</p>
                <div class="entrada">
                    <i class='bx bx-hash'></i>
                    <div class="input">
                        <p class="detalle">Cantidad real</p>
                        <input class="cantidad_real" type="number" value="${registro.c_real}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Observaciones</p>
                        <input class="observaciones" type="text" value="${registro.observaciones}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Motivo de la edición</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo</p>
                        <input class="motivo" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-editar-registro btn orange"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnEditar = contenido.querySelector('.btn-editar-registro');
        btnEditar.addEventListener('click', confirmarEdicion);

        async function confirmarEdicion() {
            const producto = document.querySelector('.editar-produccion .producto').value;
            const gramos = document.querySelector('.editar-produccion .gramaje').value;
            const lote = document.querySelector('.editar-produccion .lote').value;
            const proceso = document.querySelector('.editar-produccion .select').value;
            const microondas = document.querySelector('.editar-produccion .microondas').value;
            const envases_terminados = document.querySelector('.editar-produccion .terminados').value;
            const fecha_vencimiento = document.querySelector('.editar-produccion .vencimiento').value;
            const verificado = document.querySelector('.editar-produccion .cantidad_real').value;
            const observaciones = document.querySelector('.editar-produccion .observaciones').value;
            const motivo = document.querySelector('.editar-produccion .motivo').value;

            if (!motivo) { // Solo el campo "Motivo" es obligatorio
                mostrarNotificacion({
                    message: 'Debe ingresar el motivo de la edición',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();

                const response = await fetch(`/editar-registro-produccion/${registroId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        producto,
                        gramos,
                        lote,
                        proceso,
                        microondas,
                        envases_terminados,
                        fecha_vencimiento,
                        verificado,
                        observaciones,
                        motivo
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
                    await registrarHistorial(
                        `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
                        'Edición',
                        `Motivo: ${motivo} - Registro: ${registro.producto} (${registro.lote})`
                    );

                    mostrarNotificacion({
                        message: 'Registro actualizado correctamente',
                        type: 'success',
                        duration: 3000
                    });

                    ocultarAnuncioSecond();
                    await obtenerRegistrosProduccion();
                    await mostrarVerificacion();
                } else {
                    throw new Error(data.error || 'Error al actualizar el registro');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al actualizar el registro',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        }
    }


    btnExcel.addEventListener('click', () => exportarArchivos('produccion', registrosAExportar));
    return { aplicarFiltros };
}
