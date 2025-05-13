let registrosAlmacen = [];
let usuarioInfo = recuperarUsuarioLocal();
let proovedores = [];
let clientes = [];
async function obtenerProovedores() {
    try {
        const response = await fetch('/obtener-proovedores');
        const data = await response.json();

        if (data.success) {
            proovedores = data.proovedores.sort((a, b) => {
                const nombreA = a.nombre.toLowerCase();
                const nombreB = b.nombre.toLowerCase();
                return nombreA.localeCompare(nombreB);
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
    } finally {
    }
}
async function obtenerClientes() {
    try {
        const response = await fetch('/obtener-clientes');
        const data = await response.json();

        if (data.success) {
            clientes = data.clientes.sort((a, b) => {
                const nombreA = a.nombre.toLowerCase();
                const nombreB = b.nombre.toLowerCase();
                return nombreA.localeCompare(nombreB);
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener clientes',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        mostrarNotificacion({
            message: 'Error al obtener clientes',
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
async function obtenerRegistrosAlmacen() {
    try {
        mostrarCarga();
        await obtenerProovedores();
        await obtenerClientes();
        const response = await fetch('/obtener-movimientos-almacen');
        const data = await response.json();

        if (data.success) {
            // Filtrar registros por el email del usuario actual y ordenar de más reciente a más antiguo
            registrosAlmacen = data.movimientos
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


export async function mostrarMovimientosAlmacen() {
    await obtenerRegistrosAlmacen();

    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Registros de producción</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <button class="btn filtros"><i class='bx bx-filter'></i></button>
        </div>
        <div class="relleno">
            <div class="buscador">
                <input type="text" class="buscar-registro-almacen" placeholder="Buscar...">
                <i class='bx bx-search'></i>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros</p>
            <div class="filtros-opciones tipo">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Ingresos</button>
                <button class="btn-filtro">Salidas</button>
                <select class="proovedor-cliente">
                    <option value="Todos">Todos</option>
                </select>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Registros</p>
                ${registrosAlmacen.map(registro => `
                <div class="registro-item" data-id="${registro.id}">
                    <div class="header">
                        <span class="nombre">${registro.id}<span class="valor ${registro.tipo}">${registro.tipo}</span></span>
                        <span class="valor" color var><strong>${registro.nombre_movimiento}</strong></span>
                        <span class="fecha">${registro.fecha_hora}</span>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info btn-icon gray" data-id="${registro.id}"><i class='bx bx-info-circle'></i></button>
                        <button class="btn-editar btn-icon blue" data-id="${registro.id}"><i class='bx bx-edit'></i></button>
                        <button class="btn-eliminar btn-icon red" data-id="${registro.id}"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    contenido.style.paddingBottom = '10px';
    mostrarAnuncio();
    const { aplicarFiltros } = eventosVerificacion();

    aplicarFiltros('Todos');
}
function eventosVerificacion() {
    const botonesTipo = document.querySelectorAll('.filtros-opciones.tipo .btn-filtro');
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    const botonesEditar = document.querySelectorAll('.btn-editar');
    const botonesInfo = document.querySelectorAll('.btn-info');
    const filtros = document.querySelector('.filtros');
    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-registro-almacen');
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
            const producto = registrosAlmacen.find(p => p.id === registro.dataset.id);
            const textoProducto = normalizarTexto(producto.producto);

            if (!busqueda ||
                textoProducto.includes(busqueda) ||
                normalizarTexto(producto.tipo).includes(busqueda) ||
                normalizarTexto(producto.nombre_movimiento).includes(busqueda) ||
                normalizarTexto(producto.fecha_hora).includes(busqueda)) {
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
    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', eliminar);
    });
    botonesEditar.forEach(btn => {
        btn.addEventListener('click', editar);
    });
    filtros.addEventListener('click', filtroAvanzado);

    let filtroNombreActual = 'Todos';


    function actualizarSelectProovedorCliente(tipoFiltro) {
        const select = document.querySelector('.proovedor-cliente');
        select.innerHTML = '<option value="Todos">Todos</option>';

        if (tipoFiltro === 'Ingresos') {
            proovedores.forEach(proovedor => {
                select.innerHTML += `
                    <option value="${proovedor.nombre}">${proovedor.nombre}</option>
                `;
            });
            filtroNombreActual = 'Ingreso';
        }
        else if (tipoFiltro === 'Salidas') {
            clientes.forEach(cliente => {
                select.innerHTML += `
                    <option value="${cliente.nombre}">${cliente.nombre}</option>
                `;
            });
            filtroNombreActual = 'Salida';
        }
        else if (tipoFiltro === 'Todos') {
            filtroNombreActual = 'Todos';
        }
    }

    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');
        const filtroTipo = filtroNombreActual;
        const filtroProovedorCliente = document.querySelector('.proovedor-cliente').value;

        registros.forEach(registro => {
            const registroData = registrosAlmacen.find(r => r.id === registro.dataset.id);

            if (!registroData) {
                return;
            }

            let mostrar = true;

            // Filtro por tipo modificado
            if (filtroTipo !== 'Todos') {
                const tipoLimpio = registroData.tipo.trim().toLowerCase().replace('s', '');
                const filtroLimpio = filtroTipo.trim().toLowerCase().replace('s', '');

                if (tipoLimpio !== filtroLimpio) {
                    mostrar = false;
                }
            }

            // Filtro por proveedor/cliente
            if (mostrar && filtroProovedorCliente !== 'Todos') {
                const campo = filtroTipo === 'Ingresos' ? 'proovedor' : 'cliente';
                const valorRegistro = registroData.cliente_proovedor.trim().split('(')[0].trim();
                const valorFiltro = filtroProovedorCliente.trim();

                if (valorRegistro !== valorFiltro) {
                    mostrar = false;
                }
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


    botonesTipo.forEach(boton => {
        boton.addEventListener('click', async () => { // Agregar async aquí
            botonesTipo.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');

            const tipoFiltro = boton.textContent.trim();

            actualizarSelectProovedorCliente(tipoFiltro);
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });
    document.querySelector('.proovedor-cliente').addEventListener('change', aplicarFiltros);




    function info(event) {
        const registroId = event.currentTarget.dataset.id;
        const registro = registrosAlmacen.find(r => r.id === registroId);  // Changed from registrosProduccion

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Info registro almacén</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> ID: </strong>${registro.id}</span>
                <span class="fecha"><strong><i class='bx bx-calendar'></i> Fecha - Hora: </strong>${registro.fecha_hora}</span>
                <span class="valor ${registro.tipo.toLowerCase()}"><strong>Tipo: </strong>${registro.tipo}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles del movimiento</p>
            <div class="campo-vertical">
                <span class="valor"><strong>Nombre movimiento: </strong>${registro.nombre_movimiento}</span>
                <span class="valor"><strong>Cliente/Proveedor: </strong>${registro.cliente_proovedor.split('(')[0].trim()}</span>
                <span class="valor"><strong>Operario: </strong>${registro.operario}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Productos y cantidades</p>
            <div class="campo-vertical">
                ${registro.productos.split(';').map((producto, index) => {
                    const cantidad = registro.cantidades.split(';')[index] || 'N/A';
                    return `
                        <span class="producto"><strong>${producto.trim()}</strong>${cantidad.trim()} Und.</span>
                    `;
                }).join('')}
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles financieros</p>
            <div class="campo-vertical">
                <span class="valor"><strong>Subtotal: </strong>Bs. ${parseFloat(registro.subtotal).toFixed(2)}</span>
                <span class="valor"><strong>Descuento: </strong>Bs. ${parseFloat(registro.descuento).toFixed(2)}</span>
                <span class="valor"><strong>Aumento: </strong>Bs. ${parseFloat(registro.aumento).toFixed(2)}</span>
                <span class="valor total"><strong>Total: </strong>Bs. ${parseFloat(registro.total).toFixed(2)}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Observaciones</p>
            <div class="campo-vertical">
                 <span class="valor"><strong>Observaciones: </strong>${registro.observaciones || 'Ninguna'}</span>
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
