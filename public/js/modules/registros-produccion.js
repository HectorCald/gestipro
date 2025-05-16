let registrosProduccion = recuperarMisRegistrosLocal();
let usuarioInfo = recuperarUsuarioLocal();

export function recuperarMisRegistrosLocal() {
    const registrosGuardados = localStorage.getItem('damabrava_mis_registros');
    if (registrosGuardados) {
        return JSON.parse(registrosGuardados);
    }
    return [];
}
function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}
function limpiarMisRegistrosLocal() {
    localStorage.removeItem('damabrava_mis_registros');
    if (usuarioInfo.rol === 'Producción') {
        registrosProduccion = [];
    }
}


export async function obtenerMisRegistros() {
    // Verificar si el usuario tiene el rol correcto
    if (usuarioInfo.rol !== 'Producción') {
        console.log('No autorizado para obtener registros de producción personal');
        return false;
    }

    try {
        mostrarCarga();
        const response = await fetch('/obtener-registros-produccion');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar
            const misRegistros = data.registros
                .filter(registro => registro.user === usuarioInfo.email)
                .sort((a, b) => {
                    const idA = parseInt(a.id.split('-')[1]);
                    const idB = parseInt(b.id.split('-')[1]);
                    return idB - idA;
                });
            
            // Guardar en localStorage
            localStorage.setItem('damabrava_mis_registros', JSON.stringify(misRegistros));
            registrosProduccion = misRegistros;
            return true;
        } else {
            // Intentar recuperar del localStorage si falla el servidor
            const registrosGuardados = localStorage.getItem('damabrava_mis_registros');
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
        // Intentar recuperar del localStorage en caso de error
        const registrosGuardados = localStorage.getItem('damabrava_mis_registros');
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


export async function mostrarMisRegistros() {
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
    const { aplicarFiltros } = eventosMisRegistros();

    aplicarFiltros('Todos');
}
function eventosMisRegistros() {
    const btnExcel = document.getElementById('exportar-excel');
    const registrosAExportar = registrosProduccion;
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
    const botonesInfo = document.querySelectorAll('.btn-info');
    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-registro-produccion');
    const iconoBusqueda = document.querySelector('.buscador .lupa');
    const botonCalendario = document.querySelector('.btn-calendario');


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
        const filtroTipo = filtroNombreActual;
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const items = document.querySelectorAll('.registro-item');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosProduccion.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Aplicar todos los filtros
            if (filtroTipo !== 'todos') {
                if (filtroTipo === 'observado') {
                    mostrar = registroData.observaciones && registroData.observaciones !== 'Sin observaciones';
                } else {
                    const estadoRegistro = registroData.fecha_verificacion ? 'verificado' : 'pendiente';
                    mostrar = (filtroTipo === estadoRegistro);
                }
            }

            if (mostrar && fechasSeleccionadas.length === 2) {
                const [dia, mes, anio] = registroData.fecha.split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];
                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }


            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.producto,
                    registroData.gramos?.toString(),
                    registroData.lote?.toString(),
                    registroData.fecha
                ].filter(Boolean).join(' ').toLowerCase();
                mostrar = normalizarTexto(textoRegistro).includes(busqueda);
            }

            return { elemento: registro, mostrar };
        });

        const registrosVisibles = registrosFiltrados.filter(r => r.mostrar).length;

        // Ocultar todos con una transición suave
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
        }, 200);
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



    

    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }

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


    btnExcel.addEventListener('click', () => exportarArchivos('produccion', registrosAExportar));
    return { aplicarFiltros };
}
