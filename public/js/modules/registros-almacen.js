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
            registrosAlmacen = data.movimientos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Orden descendente por número de ID
            });
            return true;

        } else {
            throw new Error(data.error || 'Error al obtener los productos');
        }
    } catch (error) {
        console.error('Error al obtener registros:', error);
        mostrarNotificacion({
            message: 'Error al obtener registros',
            type: 'error',
            duration: 3500
        });
        return false;
    }
    finally {
        ocultarCarga();
    }
}


export async function mostrarMovimientosAlmacen(nombre = '') {
    mostrarAnuncio();
    await obtenerRegistrosAlmacen();

    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Registros de movimientos</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="entrada">
                <i class='bx bx-search'></i>
                <div class="input">
                    <p class="detalle">Buscar</p>
                    <input type="text" class="buscar-registro-almacen" placeholder="">
                </div>
                <button class="btn-calendario"><i class='bx bx-calendar'></i></button>
            </div>
            <div class="filtros-opciones tipo">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">Ingresos</button>
                <button class="btn-filtro">Salidas</button>
                <select class="proovedor-cliente" style="width:100%">
                    <option value="Todos" class="defecto">Todos</option>
                </select>
            </div>
                ${registrosAlmacen.map(registro => `
                <div class="registro-item" data-id="${registro.id}">
                    <div class="header">
                        <i class='bx bx-box'></i>
                        <div class="info-header">
                            <span class="id">${registro.id}<span class="valor ${registro.tipo}">${registro.tipo}</span></span>
                            <span class="nombre"><strong>${registro.nombre_movimiento}</strong></span>
                            <span class="fecha">${registro.fecha_hora}</span>
                        </div>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info btn-icon gray" data-id="${registro.id}"><i class='bx bx-info-circle'></i>Info</button>
                        <button class="btn-editar btn-icon blue" data-id="${registro.id}"><i class='bx bx-edit'></i> Editar</button>
                        <button class="btn-eliminar btn-icon red" data-id="${registro.id}"><i class="bx bx-trash"></i> Eliminar</button>
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

    
    eventosRegistrosAlmacen();
    setTimeout(() => {
        configuracionesEntrada();
    }, 100);
}
function eventosRegistrosAlmacen() {
    const btnExcel = document.getElementById('exportar-excel');
    const registrosAExportar = registrosAlmacen;

    const botonesTipo = document.querySelectorAll('.filtros-opciones.tipo .btn-filtro');

    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    const botonesEditar = document.querySelectorAll('.btn-editar');
    const botonesInfo = document.querySelectorAll('.btn-info');

    const items = document.querySelectorAll('.registro-item');

    const inputBusqueda = document.querySelector('.buscar-registro-almacen');
    const botonCalendario = document.querySelector('.btn-calendario');

    let filtroNombreActual = 'Todos';
    let filtroFechaInstance = null;
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
    botonesTipo.forEach(boton => {
        boton.addEventListener('click', async () => {
            botonesTipo.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');

            const tipoFiltro = boton.textContent.trim().toLowerCase();

            if (tipoFiltro === 'ingresos') {
                filtroNombreActual = 'ingreso';
            }
            else if (tipoFiltro === 'salidas') {
                filtroNombreActual = 'salida';
            }
            else if (tipoFiltro === 'todos') {
                filtroNombreActual = 'todos';
            }

            aplicarFiltros();
            actualizarSelectProovedorCliente(filtroNombreActual);
            await scrollToCenter(boton, boton.parentElement);
        });
    });

    function normalizarTexto(texto) {
        return texto.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
            .replace(/[-_\s]+/g, ''); // Eliminar guiones, guiones bajos y espacios
    }
    function aplicarFiltros() {
        const filtroTipo = filtroNombreActual;
        const fechasSeleccionadas = filtroFechaInstance?.selectedDates || [];
        const busqueda = normalizarTexto(inputBusqueda.value);
        const proveedorClienteSeleccionado = normalizarTexto(document.querySelector('.proovedor-cliente').value);
        const items = document.querySelectorAll('.registro-item');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Primero, filtrar todos los registros
        const registrosFiltrados = Array.from(items).map(registro => {
            const registroData = registrosAlmacen.find(r => r.id === registro.dataset.id);
            if (!registroData) return { elemento: registro, mostrar: false };

            let mostrar = true;

            // Filtro por tipo (Ingresos/Salidas)
            if (filtroTipo !== 'todos') {
                const tipoRegistro = normalizarTexto(registroData.tipo);
                if (filtroTipo === 'ingreso') {
                    mostrar = (tipoRegistro === 'ingreso');
                } else if (filtroTipo === 'salida') {
                    mostrar = (tipoRegistro === 'salida');
                }
            }

            // Filtro por proveedor/cliente
            if (mostrar && proveedorClienteSeleccionado !== 'todos') {
                const nombreCompleto = normalizarTexto(registroData.cliente_proovedor.split('(')[0]);
                mostrar = nombreCompleto.includes(proveedorClienteSeleccionado);
            }

            // Filtro de fechas
            if (mostrar && fechasSeleccionadas.length === 2) {
                const [fechaPart] = registroData.fecha_hora.split(','); // Dividir por coma primero
                const [dia, mes, anio] = fechaPart.trim().split('/'); // Quitar espacios y dividir
                const fechaRegistro = new Date(anio, mes - 1, dia);
                const fechaInicio = fechasSeleccionadas[0];
                const fechaFin = fechasSeleccionadas[1];
                mostrar = fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
            }

            // Filtro de búsqueda
            if (mostrar && busqueda) {
                const textoRegistro = [
                    registroData.id,
                    registroData.nombre_movimiento,
                    registroData.tipo,
                    registroData.fecha_hora,
                    registroData.cliente_proovedor
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
    function scrollToCenter(boton, contenedorPadre) {
        const scrollLeft = boton.offsetLeft - (contenedorPadre.offsetWidth / 2) + (boton.offsetWidth / 2);
        contenedorPadre.scrollTo({
            left: scrollLeft,
            behavior: 'smooth'
        });
    }
    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function() {
        this.select();
    });

    document.querySelector('.proovedor-cliente').addEventListener('change', aplicarFiltros);
    function actualizarSelectProovedorCliente(tipoFiltro) {
        const select = document.querySelector('.proovedor-cliente');
        select.innerHTML = '<option value="Todos" class="defecto">Todos</option>';

        if (tipoFiltro === 'ingreso') {
            proovedores.forEach(proovedor => {
                select.innerHTML += `
                <option value="${proovedor.nombre}">${proovedor.nombre}</option>
            `;
            });
            const defectoOption = select.querySelector('.defecto');
            if (defectoOption) {
                defectoOption.textContent = 'Proveedores';
            }
            filtroNombreActual = 'ingreso';
        }
        else if (tipoFiltro === 'salida') {
            clientes.forEach(cliente => {
                select.innerHTML += `
                <option value="${cliente.nombre}">${cliente.nombre}</option>
            `;
            });
            const defectoOption = select.querySelector('.defecto');
            if (defectoOption) {
                defectoOption.textContent = 'Clientes';
            }
            filtroNombreActual = 'salida';
        }
        else if (tipoFiltro === 'Todos') {
            filtroNombreActual = 'Todos';
        }
    }


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
            <p class="normal"><i class='bx bx-chevron-right'></i>Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> ID: </strong>${registro.id}</span>
                <span class="fecha"><strong><i class='bx bx-calendar'></i> Fecha - Hora: </strong>${registro.fecha_hora}</span>
                <span class="valor ${registro.tipo.toLowerCase()}"><strong><i class='bx bx-transfer'></i> Tipo: </strong>${registro.tipo}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles del movimiento</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-id-card'></i> Nombre movimiento: </strong>${registro.nombre_movimiento}</span>
                <span class="valor"><strong><i class='bx bx-user'></i> Cliente/Proveedor: </strong>${registro.cliente_proovedor.split('(')[0].trim()}</span>
                <span class="valor"><strong><i class='bx bx-user-circle'></i> Responsable: </strong>${registro.operario}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Productos y cantidades</p>
            <div class="campo-vertical">
                ${registro.productos.split(';').map((producto, index) => {
            const cantidad = registro.cantidades.split(';')[index] || 'N/A';
            return `
                        <span class="producto"><strong><i class='bx bx-box'></i> ${producto.trim()}</strong>${cantidad.trim()} Und.</span>
                    `;
        }).join('')}
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles financieros</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-dollar-circle'></i> Subtotal: </strong>Bs. ${registro.subtotal}</span>
                <span class="valor"><strong><i class='bx bx-tag'></i> Descuento: </strong>Bs. ${registro.descuento}</span>
                <span class="valor"><strong><i class='bx bx-trending-up'></i> Aumento: </strong>Bs. ${registro.aumento}</span>
                <span class="valor total"><strong><i class='bx bx-money'></i> Total: </strong>Bs. ${registro.total}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Observaciones</p>
            <div class="campo-vertical">
                 <span class="valor"><strong><i class='bx bx-comment-detail'></i> Observaciones: </strong>${registro.observaciones || 'Ninguna'}</span>
            </div>
           
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();
    }
    function eliminar(event) {
        const registroId = event.currentTarget.dataset.id;
        const registro = registrosAlmacen.find(r => r.id === registroId);  // Changed 

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Eliminar registro</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> ID: </strong>${registro.id}</span>
                <span class="fecha"><strong><i class='bx bx-calendar'></i> Fecha - Hora: </strong>${registro.fecha_hora}</span>
                <span class="valor ${registro.tipo.toLowerCase()}"><strong><i class='bx bx-transfer'></i> Tipo: </strong>${registro.tipo}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles del movimiento</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-id-card'></i> Nombre movimiento: </strong>${registro.nombre_movimiento}</span>
                <span class="valor"><strong><i class='bx bx-user'></i> Cliente/Proveedor: </strong>${registro.cliente_proovedor.split('(')[0].trim()}</span>
                <span class="valor"><strong><i class='bx bx-user-circle'></i> Responsable: </strong>${registro.operario}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Productos y cantidades</p>
            <div class="campo-vertical">
                ${registro.productos.split(';').map((producto, index) => {
            const cantidad = registro.cantidades.split(';')[index] || 'N/A';
            return `
                        <span class="producto"><strong><i class='bx bx-box'></i> ${producto.trim()}</strong>${cantidad.trim()} Und.</span>
                    `;
        }).join('')}
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles financieros</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-dollar-circle'></i> Subtotal: </strong>Bs. ${parseFloat(registro.subtotal).toFixed(2)}</span>
                <span class="valor"><strong><i class='bx bx-tag'></i> Descuento: </strong>Bs. ${parseFloat(registro.descuento).toFixed(2)}</span>
                <span class="valor"><strong><i class='bx bx-trending-up'></i> Aumento: </strong>Bs. ${parseFloat(registro.aumento).toFixed(2)}</span>
                <span class="valor total"><strong><i class='bx bx-money'></i> Total: </strong>Bs. ${parseFloat(registro.total).toFixed(2)}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Observaciones</p>
            <div class="campo-vertical">
                 <span class="valor"><strong><i class='bx bx-comment-detail'></i> Observaciones: </strong>${registro.observaciones || 'Ninguna'}</span>
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
                const response = await fetch(`/eliminar-registro-almacen/${registroId}`, {
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
                    await mostrarMovimientosAlmacen();
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
        const registro = registrosAlmacen.find(r => r.id === registroId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Editar registro almacén</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-produccion">
        <p class="normal"><i class='bx bx-chevron-right'></i>Información basica</p>
            <div class="entrada">
                <i class='bx bx-id-card'></i>
                <div class="input">
                    <p class="detalle">Nombre del movimiento</p>
                    <input class="nombre-movimiento" value="${registro.nombre_movimiento}" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Cliente/Proovedor</p>
                    <select class="cliente">
                        <option value="${registro.cliente_proovedor}">${registro.cliente_proovedor.split('(')[0].trim()}</option>
                        ${registro.tipo.toLowerCase() === 'salida'
                ? clientes.map(c => `<option value="${c.nombre}(${c.id})">${c.nombre}</option>`).join('')
                : proovedores.map(p => `<option value="${p.nombre}(${p.id})">${p.nombre}</option>`).join('')
            }
                    </select>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-user-circle'></i>
                <div class="input">
                    <p class="detalle">Responsable</p>
                    <input class="responsable" type="text" value="${registro.operario}" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Productos y cantidades</p>
            ${registro.productos.split(';').map((producto, index) => `
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" value="${producto.trim()}" autocomplete="off">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-hash'></i>
                    <div class="input">
                        <p class="detalle">Cantidad</p>
                        <input class="cantidad" type="number" value="${registro.cantidades.split(';')[index]?.trim() || ''}">
                    </div>
                </div>
            `).join('')}            

            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles financieros</p>
            <div class="entrada">
                <i class='bx bx-dollar'></i>
                <div class="input">
                    <p class="detalle">Subtotal (Bs)</p>
                    <input type="number" step="0.01" class="subtotal" value="${parseFloat(registro.subtotal).toFixed(2)}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-minus-circle'></i>
                <div class="input">
                    <p class="detalle">Descuento (Bs)</p>
                    <input type="number" step="0.01" class="descuento" value="${parseFloat(registro.descuento).toFixed(2)}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-plus-circle'></i>
                <div class="input">
                    <p class="detalle">Aumento (Bs)</p>
                    <input type="number" step="0.01" class="aumento" value="${parseFloat(registro.aumento).toFixed(2)}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-money'></i>
                <div class="input">
                    <p class="detalle">Total (Bs)</p>
                    <input type="number" step="0.01" class="total" value="${parseFloat(registro.total).toFixed(2)}">
                </div>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Otros</p>

            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Observaciones</p>
                    <input class="observaciones" type="text" autocomplete="off" value="${registro.observaciones}" placeholder=" " required>
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
            <button class="btn-editar-movimiento btn orange"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnEditar = contenido.querySelector('.btn-editar-movimiento');
        btnEditar.addEventListener('click', confirmarEdicion);

        async function confirmarEdicion() {
            const motivo = document.querySelector('.motivo').value.trim();
            // Agregar protección para valores undefined
            const productos = Array.from(document.querySelectorAll('.producto'))
                .map(input => input?.value?.trim() || '')  // <-- Agregar operador opcional
                .filter(val => val !== '')
                .join(';');

            const cantidades = Array.from(document.querySelectorAll('.cantidad'))
                .map(input => input?.value?.trim() || '')  // <-- Agregar operador opcional
                .filter(val => val !== '')
                .join(';');

            if (!motivo) {
                mostrarNotificacion({
                    message: 'Debe completar el motivo de edición',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch(`/editar-registro-almacen/${registroId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        nombre_movimiento: document.querySelector('.nombre-movimiento').value.trim(),
                        cliente_proovedor: document.querySelector('.cliente').value,
                        operario: document.querySelector('.responsable').value.trim(),
                        productos,
                        cantidades,
                        subtotal: parseFloat(document.querySelector('.subtotal').value),
                        descuento: parseFloat(document.querySelector('.descuento').value),
                        aumento: parseFloat(document.querySelector('.aumento').value),
                        total: parseFloat(document.querySelector('.total').value),
                        observaciones: document.querySelector('.observaciones').value.trim(),
                        motivo
                    })
                });

                if (!response.ok) throw new Error('Error en la respuesta del servidor');

                const data = await response.json();

                if (data.success) {
                    await mostrarMovimientosAlmacen();
                    mostrarNotificacion({
                        message: 'Registro actualizado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                    ocultarAnuncioSecond();
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


    btnExcel.addEventListener('click', () => exportarArchivos('almacen', registrosAExportar));
    aplicarFiltros();
}
