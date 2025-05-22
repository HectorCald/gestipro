let registrosProduccion = [];
let usuarioInfo = recuperarUsuarioLocal();
let pedidosGlobal = [];
let proovedoresAcopioGlobal = []; // Add this
async function obtenerProovedoresAcopio() {
    try {
        const response = await fetch('/obtener-proovedores-acopio');
        const data = await response.json();

        if (data.success) {
            // Store proovedores in global variable
            proovedoresAcopioGlobal = data.proovedores.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Descending order
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener proovedores',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener proovedores:', error);
        mostrarNotificacion({
            message: 'Error al obtener proovedores',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}
function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}
async function obtenerPedidos() {
    try {
        const response = await fetch('/obtener-pedidos');
        const data = await response.json();

        if (data.success) {
            // Sort pedidos by ID (newest first)
            pedidosGlobal = data.pedidos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Descending order
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener pedidos',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        mostrarNotificacion({
            message: 'Error al obtener pedidos',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}



function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Pedidos</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno almacen-general">
            <div class="entrada">
                <i class='bx bx-search'></i>
                <div class="input">
                    <p class="detalle">Buscar</p>
                    <input type="text" class="buscar-pedido" placeholder="">
                </div>
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
            </div>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Pendientes</button>
                <button class="btn-filtro">Recibidos</button>
                <button class="btn-filtro">Ingresados</button>
                <button class="btn-filtro">Rechazados</button>
                <button class="btn-filtro">No llegaron</button>
            </div>
            <div class="productos-container">
                ${Array(10).fill().map(() => `
                    <div class="skeleton-producto">
                        <div class="skeleton-header">
                            <div class="skeleton skeleton-img"></div>
                            <div class="skeleton-content">
                                <div class="skeleton skeleton-line"></div>
                                <div class="skeleton skeleton-line"></div>
                                <div class="skeleton skeleton-line"></div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="no-encontrado" style="display: none; text-align: center; color: #555; font-size: 1.1rem;padding:20px">
                <i class='bx bx-file-blank' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron pedidos segun tu busqueda o filtrado.</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button id="exportar-excel" class="btn orange" style="margin-bottom:10px"><i class='bx bx-download'></i> Descargar registros</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
}
export async function mostrarPedidos() {
    mostrarAnuncio();
    renderInitialHTML();
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);

    const [registrosPedidos, registrosProovedores] = await Promise.all([
        obtenerPedidos(),
        obtenerProovedoresAcopio()
    ]);

    updateHTMLWithData();
    eventosPedidos();
}
function updateHTMLWithData() {
    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = pedidosGlobal.map(pedido => `
        <div class="registro-item" data-id="${pedido.id}">
            <div class="header">
                <i class='bx bx-file'></i>
                <div class="info-header">
                    <span class="id">${pedido.id}<span class="estado ${pedido.estado.toLowerCase().replace(/\s+/g, '-')}">${pedido.estado}</span></span>
                    <span class="nombre">
                        <strong>${pedido.producto}</strong>
                        ${pedido.estado.toLowerCase() === 'pendiente' ?
                            `<span class="cantidad-pedida">(${pedido.cantidadPedida})</span>` :
                            pedido.estado.toLowerCase() === 'recibido' ?
                            `<span class="cantidad-pedida">(${pedido.cantidadEntregadaUnd || 'No registrado'})</span>` :
                            pedido.estado.toLowerCase() === 'ingresado' ?
                            `<span class="cantidad-pedida">(${pedido.cantidadIngresada || 'No registrado'})</span>` :
                            ''
                        }
                    </span>
                    <span class="fecha">${pedido.fecha}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
}



function eventosPedidos() {
    const btnExcel = document.getElementById('exportar-excel');
    const registrosAExportar = registrosProduccion;

    const botonesNombre = document.querySelectorAll('.filtros-opciones.nombre .btn-filtro');
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');


    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-pedido');
    const botonCalendario = document.querySelector('.btn-calendario');

    let filtroFechaInstance = null;
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
            const registroData = pedidosGlobal.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            if (filtroEstadoActual && filtroEstadoActual !== 'Todos') {
                if (filtroEstadoActual === 'Pendientes') {
                    mostrar = registroData.estado === 'Pendiente';
                } else if (filtroEstadoActual === 'Recibidos') {
                    mostrar = registroData.estado === 'Recibido';
                } else if (filtroEstadoActual === 'Ingresados') {
                    mostrar = registroData.estado === 'Ingresado';
                } else if (filtroEstadoActual === 'Rechazados') {
                    mostrar = registroData.estado === 'Rechazado';
                } else if (filtroEstadoActual === 'No llegaron') {
                    mostrar = registroData.estado === 'No llego';
                }
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
                    registroData.idProducto,
                    registroData.fecha,
                    registroData.proovedor,
                    registroData.estado
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
    });
    inputBusqueda.addEventListener('focus', function () {
        this.select();
    });


    items.forEach(item => {
        item.addEventListener('click', function () {
            const registroId = this.dataset.id;
            window.info(registroId);
        });
    });
    window.info = function (registroId) {
        const registro = pedidosGlobal.find(r => r.id === registroId);
        if (!registro) return;

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">${registro.producto}</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información del pedido</p>
            <div class="campo-horizontal">
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Cantidad pedida: </strong>${registro.cantidadPedida}</span>
                    <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
                    <span class="estado ${registro.estado.toLowerCase()}"><strong><i class='bx bx-check-circle'></i> Estado: </strong>${registro.estado}</span>
                </div>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles del producto</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-cube'></i> Producto: </strong>${registro.producto}</span>
                <span class="nombre"><strong><i class='bx bx-barcode'></i> ID Producto: </strong>${registro.idProducto}</span>
                <span class="observaciones"><strong><i class='bx bx-comment-detail'></i> Observaciones: </strong>${registro.observacionesPedido || 'Sin observaciones'}</span>
            </div>

            ${registro.estado !== 'Pendiente' ? `
            <p class="normal"><i class='bx bx-chevron-right'></i> Información de recepción</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-package'></i> Cantidad entregada (KG): </strong>${registro.cantidadEntregadaKg || 'No registrado'}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Cantidad entregada (UND): </strong>${registro.cantidadEntregadaUnd || 'No registrado'}</span>
                <span class="valor"><strong><i class='bx bx-user'></i> Proveedor: </strong>${registro.proovedor || 'No registrado'}</span>
                <span class="valor"><strong><i class='bx bx-money'></i> Precio: </strong>${registro.precio || 'No registrado'}</span>
                <span class="valor"><strong><i class='bx bx-money'></i> Estado: </strong>${registro.estadoCompra || 'No registrado'}</span>
                <span class="observaciones"><strong><i class='bx bx-comment-detail'></i> Observaciones compras: </strong>${registro.observacionesCompras || 'Sin observaciones'}</span>
            </div>
            ` : ''}

            ${registro.estado === 'Ingresado' ? `
            <p class="normal"><i class='bx bx-chevron-right'></i> Información de ingreso</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha ingreso: </strong>${registro.fechaIngreso || 'No registrado'}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Cantidad ingresada: </strong>${registro.cantidadIngresada || 'No registrado'}</span>
                <span class="observaciones"><strong><i class='bx bx-comment-detail'></i> Observaciones ingreso: </strong>${registro.observacionesIngresado || 'Sin observaciones'}</span>
            </div>
            ` : ''}
        </div>
        <div class="anuncio-botones">
            ${registro.estado === 'Pendiente' ? `
                <button class="btn-entregar btn green" data-id="${registro.id}"><i class='bx bx-check-circle'></i> Entregar</button>
            ` : ''}
            ${registro.estado === 'Recibido' ? `
                <button class="btn-ingresar btn blue" data-id="${registro.id}"><i class='bx bx-log-in'></i> Ingresar</button>
            ` : ''}
            <button class="btn-eliminar btn red" data-id="${registro.id}"><i class="bx bx-trash"></i></button>
            <button class="btn-editar btn blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>
        </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();


        const btnEditar = contenido.querySelector('.btn-editar');
        const btnEliminar = contenido.querySelector('.btn-eliminar');
        const btnEntregar = contenido.querySelector('.btn-entregar');
        const btnIngresar = contenido.querySelector('.btn-ingresar');

        btnEditar.addEventListener('click', () => editar(registro));
        btnEliminar.addEventListener('click', () => eliminar(registro));
        btnEntregar.addEventListener('click', () => entregar(registro));
        btnIngresar.addEventListener('click', () => ingresar(registro));

        function eliminar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar registro</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('tercer')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
                <div class="campo-horizontal">
                    <div class="campo-vertical">
                       <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                    <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${registro.gramos}gr.</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Envases: </strong>${registro.envases_terminados} Und.</span>
                    <span class="valor"><strong><i class='bx bx-hash'></i> Vencimiento: </strong>${registro.fecha_vencimiento}</span>
                    </div>
                    <div class="imagen-producto">
                    ${producto.imagen && producto.imagen.startsWith('data:image') ?
                    `<img class="imagen" src="${producto.imagen}">` :
                    `<i class='bx bx-package'></i>`}
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
                <button class="btn-eliminar-registro btn red"><i class="bx bx-trash"></i> Confirmar eliminación</button>
            </div>
        `;
            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();

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
                        ocultarCarga();
                        mostrarNotificacion({
                            message: 'Registro eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        ocultarAnuncioSecond();
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
        function editar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Editar registro</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
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
                <button class="btn-editar-registro btn blue"><i class="bx bx-save"></i> Guardar cambios</button>
            </div>
        `;
            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();

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
                        ocultarCarga();
                        mostrarNotificacion({
                            message: 'Registro actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        ocultarAnuncioSecond();
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
        function entregar(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Entregar Pedido</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información del pedido</p>
            <div class="campo-horizontal">
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Cantidad pedida: </strong>${registro.cantidadPedida}</span>
                    <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
                </div>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles de entrega</p>
            <div class="entrada">
                <i class='bx bx-package'></i>
                <div class="input">
                    <p class="detalle">Cantidad entregada (KG)</p>
                    <input class="cantidad-kg" type="number" step="0.01" autocomplete="off" required>
                </div>
            </div>

            <div class="campo-horizontal">
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad</p>
                        <input class="cantidad-und" type="number" autocomplete="off" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Medida</p>
                        <select class="unidad-medida">
                            <option value="Bolsas">Bolsas</option>
                            <option value="Cajas">Cajas</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Proveedor</p>
                    <select class="proovedor" required>
                        <option value=""></option>
                        ${proovedoresAcopioGlobal.map(p => `
                            <option value="${p.nombre}">${p.nombre}</option>
                        `).join('')}
                    </select>
                </div>
            </div>

            <div class="campo-horizontal">
                <div class="entrada">
                    <i class='bx bx-money'></i>
                    <div class="input">
                        <p class="detalle">Precio</p>
                        <input class="precio" type="number" step="0.01" autocomplete="off" required>
                    </div>
                </div>

                <div class="entrada">
                    <i class='bx bx-car'></i>
                    <div class="input">
                        <p class="detalle">Trans./Otros</p>
                        <input class="transporte" type="text" autocomplete="off">
                    </div>
                </div>
            </div>

            <div class="entrada">
                <i class='bx bx-check-circle'></i>
                <div class="input">
                    <p class="detalle">Estado de entrega</p>
                    <select class="estado-compra" required>
                        <option value="Llego">Llegó</option>
                        <option value="No llego">No llegó</option>
                    </select>
                </div>
            </div>

            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Observaciones</p>
                    <input class="observaciones" type="text" autocomplete="off">
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-confirmar-entrega btn green"><i class='bx bx-check-circle'></i> Confirmar entrega</button>
        </div>
    `;

            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();


            const btnConfirmar = contenido.querySelector('.btn-confirmar-entrega');
            btnConfirmar.addEventListener('click', confirmarEntrega);

            async function confirmarEntrega() {
                const cantidadKg = document.querySelector('.verificar-registro .cantidad-kg').value.trim();
                const cantidadUnd = document.querySelector('.verificar-registro .cantidad-und').value.trim();
                const unidadMedida = document.querySelector('.verificar-registro .unidad-medida').value;
                const proovedor = document.querySelector('.verificar-registro .proovedor').value;
                const precio = document.querySelector('.verificar-registro .precio').value.trim();
                const transporteOtros = document.querySelector('.verificar-registro .transporte').value.trim();
                const estadoCompra = document.querySelector('.verificar-registro .estado-compra').value;
                const observaciones = document.querySelector('.verificar-registro .observaciones').value.trim();

                // Validaciones básicas
                if (!cantidadKg || !cantidadUnd || !proovedor || !precio) {
                    mostrarNotificacion({
                        message: 'Debe completar todos los campos obligatorios',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }

                try {
                    mostrarCarga();

                    const response = await fetch(`/entregar-pedido/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cantidadKg,
                            proovedor,
                            precio,
                            observaciones: observaciones || 'Sin observaciones',
                            cantidadUnidad: cantidadUnd,
                            unidadMedida,
                            transporteOtros: transporteOtros || '',
                            estadoCompra
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        ocultarCarga();
                        mostrarNotificacion({
                            message: 'Pedido entregado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        ocultarAnuncioSecond();
                        await mostrarPedidos();
                    } else {
                        throw new Error(data.error || 'Error al entregar el pedido');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al entregar el pedido',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            }
        }
        function ingresar(registro) {

            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Verificar registro</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
               <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
                <div class="campo-horizontal">
                    <div class="campo-vertical">
                        <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                        <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${registro.gramos}gr.</span>
                        <span class="valor"><strong><i class='bx bx-package'></i> Envases: </strong>${registro.envases_terminados} Und.</span>
                        <span class="valor"><strong><i class='bx bx-hash'></i> Vencimiento: </strong>${registro.fecha_vencimiento}</span>
                    </div>
                    <div class="imagen-producto">
                    ${producto.imagen && producto.imagen.startsWith('data:image') ?
                    `<img class="imagen" src="${producto.imagen}">` :
                    `<i class='bx bx-package'></i>`}
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
                <button class="btn-verificar-registro btn green"><i class='bx bx-check-circle'></i> Verificar y finalizar</button>
            </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();

            // Agregar evento al botón guardar
            const btnVerificar = contenido.querySelector('.btn-verificar-registro');
            btnVerificar.addEventListener('click', confirmarVerificacion);

            async function confirmarVerificacion() {
                const cantidadRealInput = document.querySelector('.verificar-registro .cantidad_real');
                const observacionesInput = document.querySelector('.verificar-registro .observaciones');

                if (!cantidadRealInput || !observacionesInput) {
                    mostrarNotificacion({
                        message: 'Error al acceder a los campos del formulario',
                        type: 'error',
                        duration: 3500
                    });
                    return;
                }

                const cantidadReal = cantidadRealInput.value.trim();
                const observaciones = observacionesInput.value.trim();

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
                        ocultarCarga();
                        mostrarNotificacion({
                            message: 'Registro verificado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        ocultarAnuncioSecond();
                        await mostrarIngresos(registro.idProducto);
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
    }
    btnExcel.addEventListener('click', () => exportarArchivos('produccion', registrosAExportar));
    aplicarFiltros();
}
