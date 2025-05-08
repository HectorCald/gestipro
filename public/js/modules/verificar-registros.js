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
                        <div class="info">
                            <span class="nombre">${registro.nombre}</span>
                            <span class="fecha">${registro.fecha}</span>
                        </div>
                        <div class="registro-acciones">
                            <button class="btn-editar btn-icon blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>
                            <button class="btn-eliminar btn-icon red" data-id="${registro.id}"><i class="bi bi-trash-fill"></i></button>
                            <button class="btn-verificar btn-icon green" data-id="${registro.id}"><i class="bi bi-check-circle-fill"></i></button>
                        </div> 
                    </div>
                    <div class="detalle">
                        <span class="valor">${registro.producto} - ${registro.gramos}gr.</span>
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
            `).join('')}
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    contenido.style.paddingBottom = '10px';
    mostrarAnuncio();
    evetosVerificacion();

    aplicarFiltros('Todos', 'Todos');
}
function evetosVerificacion() {
    const botonesNombre = document.querySelectorAll('.filtros-opciones.nombre .btn-filtro');
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');
    const botonesVerificar = document.querySelectorAll('.btn-verificar');
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    const botonesEditar = document.querySelectorAll('.btn-editar');

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
            const nombreRegistro = registro.querySelector('.nombre').textContent;
            // Corregimos el selector para obtener la fecha de verificación
            const fechaVerificacion = registro.querySelector('.detalle:nth-child(5) .valor:last-child').textContent;
            const observaciones = registro.querySelector('.detalle:last-child .valor').textContent;

            let cumpleFiltroNombre = filtroNombreActual === 'Todos' || nombreRegistro === filtroNombreActual;
            let cumpleFiltroEstado = true;

            if (filtroEstadoActual !== 'Todos') {
                switch (filtroEstadoActual) {
                    case 'Pendientes':
                        cumpleFiltroEstado = fechaVerificacion.includes('Pendiente');
                        break;
                    case 'Verificados':
                        cumpleFiltroEstado = !fechaVerificacion.includes('Pendiente');
                        break;
                    case 'Observados':
                        cumpleFiltroEstado = observaciones !== 'Sin observaciones';
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
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información</p>
            <div class="registro-item" data-id="${registro.id}">
                <div class="header">
                    <div class="info">
                        <span class="nombre">${registro.nombre}</span>
                        <span class="fecha">${registro.fecha}</span>
                    </div>
                </div>
                <div class="detalle">
                    <span class="valor">${registro.producto} - ${registro.gramos}gr.</span>
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
            <button id="btn-registrar" class="btn orange"><i class='bx bx-check-circle'></i> Verificar</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnGuardar = contenido.querySelector('.btn-guardar');
        btnGuardar.addEventListener('click', guardarVerificacion);
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
                    </div>
                </div>
                <div class="detalle">
                    <span class="valor">${registro.producto} - ${registro.gramos}gr.</span>
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
            <button id="btn-registrar" class="btn red"><i class="bi bi-trash-fill"></i> Eliminar</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnGuardar = contenido.querySelector('.btn-guardar');
        btnGuardar.addEventListener('click', guardarVerificacion);
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
        <div class="relleno">
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
            <button id="btn-registrar" class="btn orange"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnGuardar = contenido.querySelector('.btn-guardar');
        btnGuardar.addEventListener('click', guardarVerificacion);
    }
}