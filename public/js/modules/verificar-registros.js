

let registrosProduccion = [];
async function obtenerRegistrosProduccion() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-registros-produccion');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            registrosProduccion = data.registros
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
    finally {
        ocultarCarga();
    }
}


export async function mostrarVerificacion() {
    await obtenerRegistrosProduccion();
    const contenido = document.querySelector('.anuncio .contenido');
    const nombresUnicos = [...new Set(registrosProduccion.map(registro => registro.nombre))];
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Verificar</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <button class="btn filtros" onclick="ocultarAnuncio();"><i class='bx bx-filter'></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros</p>
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
            <p class="normal"><i class='bx bx-chevron-right'></i>Registros</p>
            ${registrosProduccion.map(registro => `
                <div class="registro-item" data-id="${registro.id}">
                    <div class="header">
                        <span class="nombre">${registro.nombre}<span class="valor ${registro.fecha_verificacion ? 'verificado' : 'pendiente'}">${registro.fecha_verificacion ? 'Verificado' : 'Pendiente'}</span></span>
                        <span class="valor" color var><strong>${registro.producto} - ${registro.gramos}gr.</strong></span>
                    </div>
                    <div class="registro-acciones" ${registro.fecha_verificacion ? 'style="display: none;"' : ''}>
                        <button class="btn-info btn-icon gray" data-id="${registro.id}"><i class='bx bx-info-circle'></i></button>
                        <button class="btn-editar btn-icon blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>
                        <button class="btn-eliminar btn-icon red" data-id="${registro.id}"><i class="bi bi-trash-fill"></i></button>
                        <button class="btn-verificar btn-icon green" data-id="${registro.id}"><i class="bi bi-check-circle-fill"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    contenido.style.paddingBottom = '10px';
    mostrarAnuncio();
    const { aplicarFiltros } = evetosVerificacion();

    aplicarFiltros('Todos', 'Todos');
}
function evetosVerificacion() {
    const botonesNombre = document.querySelectorAll('.filtros-opciones.nombre .btn-filtro');
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
    const botonesVerificar = document.querySelectorAll('.btn-verificar');
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    const botonesEditar = document.querySelectorAll('.btn-editar');
    const botonesInfo = document.querySelectorAll('.btn-info');
    const items = document.querySelectorAll('.registro-item');

    items.forEach(item => {
        const accionesDiv = item.querySelector('.registro-acciones');
        if (accionesDiv && !item.querySelector('.fecha_verificacion')) {
            item.addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar que el click se propague
                // Ocultar todos los demás menús de acciones
                document.querySelectorAll('.registro-acciones').forEach(div => {
                    if (div !== accionesDiv) {
                        div.style.display = 'none';
                    }
                });
                accionesDiv.style.display = accionesDiv.style.display === 'flex' ? 'none' : 'flex';
            });
        }
    });
    document.addEventListener('click', () => {
        document.querySelectorAll('.registro-acciones').forEach(div => {
            div.style.display = 'none';
        });
    });
    document.querySelector('.relleno').addEventListener('scroll', () => {
        document.querySelectorAll('.registro-acciones').forEach(div => {
            div.style.display = 'none';
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
    let filtroNombreActual = 'Todos';
    let filtroEstadoActual = 'Todos';

    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');
    
        registros.forEach(registro => {
            const registroId = registro.dataset.id;
            const registroData = registrosProduccion.find(r => r.id === registroId);
            // Modificamos el selector para obtener solo el texto del nombre
            const nombreRegistro = registro.querySelector('.nombre').childNodes[0].textContent;
    
            let cumpleFiltroNombre = filtroNombreActual === 'Todos' || nombreRegistro === filtroNombreActual;
            let cumpleFiltroEstado = true;

            if (filtroEstadoActual !== 'Todos' && registroData) {
                switch (filtroEstadoActual) {
                    case 'Pendientes':
                        cumpleFiltroEstado = !registroData.fecha_verificacion;
                        break;
                    case 'Verificados':
                        cumpleFiltroEstado = !!registroData.fecha_verificacion;
                        break;
                    case 'Observados':
                        cumpleFiltroEstado = registroData.observaciones && registroData.observaciones !== 'Sin observaciones';
                        break;
                }
            }

            if (cumpleFiltroNombre && cumpleFiltroEstado) {
                registro.style.display = '';
            } else {
                registro.style.display = 'none';
            }
        });
    }
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    botonesNombre.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesNombre.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });

    botonesEstado.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesEstado.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroEstadoActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });

    function verificar(event) {
        const registroId = event.currentTarget.dataset.id;
        // Encontrar el registro correspondiente
        const registro = registrosProduccion.find(r => r.id === registroId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Verificar</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información</p>
            <div class="registro-item" data-id="${registro.id}">
                <div class="header">
                    <div class="info">
                        <span class="nombre">${registro.nombre}</span>
                        <span class="fecha">${registro.fecha}</span>
                        <span class="valor">${registro.producto} - ${registro.gramos}gr.</span>
                    </div>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Lote: </strong>${registro.lote}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Proceso: </strong>${registro.proceso}</span>
                    <span class="valor"><strong>Microondas: </strong>${registro.microondas}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Terminados: </strong>${registro.envases_terminados}</span>
                    <span class="valor"><strong>Vencimiento: </strong>${registro.fecha_vencimiento}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Real: </strong>${registro.c_real || 'No verificado'}</span>
                    <span class="valor"><strong>fecha de verificación: </strong>${registro.fecha_verificacion || 'Pendiente'}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Observaciones: </strong>${registro.observaciones || 'Sin observaciones'}</span>
                </div>
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
        contenido.style.paddingBottom = '10px';
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
                const registroId = document.querySelector('.verificar-registro .registro-item').dataset.id;
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
                    // Registrar en historial
                    await registrarHistorial(
                        'Producción',
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
            <h1 class="titulo">Verificar</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información</p>
            <div class="registro-item" data-id="${registro.id}">
                <div class="header">
                    <div class="info">
                        <span class="nombre">${registro.nombre}</span>
                        <span class="fecha">${registro.fecha}</span>
                        <span class="valor">${registro.producto} - ${registro.gramos}gr.</span>
                    </div>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Lote: </strong>${registro.lote}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Proceso: </strong>${registro.proceso}</span>
                    <span class="valor"><strong>Microondas: </strong>${registro.microondas}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Terminados: </strong>${registro.envases_terminados}</span>
                    <span class="valor"><strong>Vencimiento: </strong>${registro.fecha_vencimiento}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Real: </strong>${registro.c_real || 'No verificado'}</span>
                    <span class="valor"><strong>fecha de verificación: </strong>${registro.fecha_verificacion || 'Pendiente'}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Observaciones: </strong>${registro.observaciones || 'Sin observaciones'}</span>
                </div>
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
            <p class="normal"><i class='bx bx-chevron-right'></i>Información</p>
            <div class="registro-item" data-id="${registro.id}">
                <div class="header">
                    <div class="info">
                        <span class="nombre">${registro.nombre}</span>
                        <span class="fecha">${registro.fecha}</span>
                        <span class="valor">${registro.producto} - ${registro.gramos}gr.</span>
                    </div>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Lote: </strong>${registro.lote}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Proceso: </strong>${registro.proceso}</span>
                    <span class="valor"><strong>Microondas: </strong>${registro.microondas}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Terminados: </strong>${registro.envases_terminados}</span>
                    <span class="valor"><strong>Vencimiento: </strong>${registro.fecha_vencimiento}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Real: </strong>${registro.c_real || 'No verificado'}</span>
                    <span class="valor"><strong>fecha de verificación: </strong>${registro.fecha_verificacion || 'Pendiente'}</span>
                </div>
                <div class="detalle">
                    <span class="valor"><strong>Observaciones: </strong>${registro.observaciones || 'Sin observaciones'}</span>
                </div>
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
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnEliminar = contenido.querySelector('.btn-eliminar-registro');
        btnEliminar.addEventListener('click', confirmarEliminacion);

        async function confirmarEliminacion() {
            const motivo = document.querySelector('.motivo').value.trim();

            if (!motivo) {
                mostrarNotificacion({
                    message: 'Debe ingresar un motivo para la eliminación',
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
                        'Producción',
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

            if (!producto || !gramos || !proceso || !microondas || !envases_terminados || !fecha_vencimiento) {
                mostrarNotificacion({
                    message: 'Todos los campos son obligatorios',
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
                        observaciones
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la respuesta del servidor');
                }

                const data = await response.json();

                if (data.success) {
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
    return { aplicarFiltros };
}