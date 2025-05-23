let usuarioInfo = recuperarUsuarioLocal();
let pedidosGlobal = [];
let productos = [];
let proovedoresAcopioGlobal = [];
let mensajeCompras = localStorage.getItem('damabrava_mensaje_compras') || 'Se compro:\n• Sin compras registradas';
let carritoIngresosAcopio = new Map(JSON.parse(localStorage.getItem('damabrava_ingreso_acopio') || '[]'));
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
async function obtenerAlmacenAcopio() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-productos-acopio');
        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();

        if (data.success) {
            productos = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            return true;
        } else {
            throw new Error(data.error || 'Error al obtener los productos');
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        mostrarNotificacion({
            message: 'Error al obtener los productos de acopio',
            type: 'error',
            duration: 3500
        });
        return false;
    } finally {
        ocultarCarga();
    }
}



function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Pedidos</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
            <button class="btn filtros" onclick="mostrarFormatoCompras()"><i class='bx bx-comment-detail'></i></button>
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
            <button id="exportar-excel" class="btn orange" style="margin-bottom:10px"><i class='bx bx-download'></i> Descargar pedidos</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
    contenido.style.paddingBottom = '80px';
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
                    `<span class="cantidad-pedida">(${pedido.cantidadIngresada || 'No registrado'} Kg.) </span>` :
                    pedido.estado.toLowerCase() === 'no llego' ?
                        `<span class="cantidad-pedida">(${pedido.cantidadEntregadaUnd || 'No registrado'}) </span>` : ''
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
    const registrosAExportar = pedidosGlobal;

    const botonesNombre = document.querySelectorAll('.filtros-opciones.nombre .btn-filtro');
    const botonesEstado = document.querySelectorAll('.filtros-opciones.estado .btn-filtro');


    const items = document.querySelectorAll('.registro-item');
    const inputBusqueda = document.querySelector('.buscar-pedido');
    const botonCalendario = document.querySelector('.btn-calendario');

    const contenedor = document.querySelector('.relleno');
    contenedor.addEventListener('scroll', () => {
        const yaExiste = contenedor.querySelector('.scroll-top');

        if (contenedor.scrollTop > 100) {
            if (!yaExiste) {
                const boton = document.createElement('button');
                boton.className = 'scroll-top';
                boton.innerHTML = '<i class="fas fa-arrow-up"></i>';
                boton.onclick = () => scrollToTop('.relleno');
                contenedor.appendChild(boton);
            }
        } else {
            // Si vuelve arriba, ocultamos el botón si existe
            if (yaExiste) {
                yaExiste.remove();
            }
        }
    });

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
                <span class="valor"><strong><i class='bx bx-package'></i> Cantidad ingresada(KG): </strong>${registro.cantidadIngresada || 'No registrado'}</span>
                <span class="observaciones"><strong><i class='bx bx-comment-detail'></i> Observaciones ingreso: </strong>${registro.observacionesIngresado || 'Sin observaciones'}</span>
            </div>
            ` : ''}
        </div>
        <div class="anuncio-botones">
            ${registro.estado === 'Pendiente' ? `
                <button class="btn-entregar btn green" data-id="${registro.id}"><i class='bx bx-check-circle'></i> Entregar</button>
            ` : ''}
            ${registro.estado === 'Recibido' ? `
                <button class="btn-ingresar btn blue" data-id="${registro.id}"><i class='bx bx-log-in'></i></button>
                <button class="btn-rechazar btn yellow" data-id="${registro.id}"><i class='bx bx-block'></i></button>
            ` : ''}
            ${registro.estado === 'No llego' ? `
                <button class="btn-llego btn yellow" data-id="${registro.id}"><i class='bx bx-check-circle'></i></button>
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
        const btnRechazar = contenido.querySelector('.btn-rechazar');
        const btnLlego = contenido.querySelector('.btn-llego');


        btnEditar.addEventListener('click', () => editar(registro));
        btnEliminar.addEventListener('click', () => eliminar(registro));
        if (btnEntregar) {
            btnEntregar.addEventListener('click', () => entregar(registro));
        }
        if (btnIngresar) {
            btnIngresar.addEventListener('click', () => ingresar(registro));
        }
        if (btnRechazar) {
            btnRechazar.addEventListener('click', () => rechazar(registro));
        }
        if (btnLlego) {
            btnLlego.addEventListener('click', () => llego(registro));
        }

        function eliminar(registro) {
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Eliminar pedido</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-horizontal">
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Cantidad pedida: </strong>${registro.cantidadPedida}</span>
                    <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
                    <span class="estado ${registro.estado.toLowerCase()}"><strong><i class='bx bx-check-circle'></i> Estado: </strong>${registro.estado}</span>
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

                    const response = await fetch(`/eliminar-pedido/${registro.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ motivo })
                    });

                    if (!response.ok) {
                        throw new Error('Error en la respuesta del servidor');
                    }

                    const data = await response.json();

                    if (data.success) {
                        mostrarNotificacion({
                            message: 'Pedido eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        ocultarCarga();
                        ocultarAnuncioSecond();
                        await mostrarPedidos();
                    } else {
                        throw new Error(data.error || 'Error al eliminar el pedido');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar el pedido',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            }
        }
        async function editar(registro) {
            await obtenerAlmacenAcopio();
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Editar pedido</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-pedido">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información básica</p>
            <div class="entrada">
                <i class='bx bx-package'></i>
                <div class="input">
                    <p class="detalle">Producto</p>
                    <input class="producto-pedido" type="text" value="${registro.producto}">
                </div>
            </div>
            <div class="sugerencias" id="productos-list"></div>
            <div class="entrada">
                <i class='bx bx-package'></i>
                <div class="input">
                    <p class="detalle">Cantidad Pedida</p>
                    <input class="cantidad-pedida" type="text" value="${registro.cantidadPedida}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Observaciones Pedido</p>
                    <input class="obs-pedido" type="text" value="${registro.observacionesPedido || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-check-circle'></i>
                <div class="input">
                    <p class="detalle">Estado</p>
                    <select class="estado" required>
                        <option value="${registro.estado}" selected>${registro.estado}</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="No llego">No llego</option>
                        <option value="Recibido">Recibido</option>
                        <option value="Rechazado">Rechazado</option>
                        <option value="Ingresado">Ingresado</option>
                    </select>
                </div>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Información de compra</p>
            <div class="entrada">
                <i class='bx bx-package'></i>
                <div class="input">
                    <p class="detalle">Cantidad Entregada (Kg)</p>
                    <input class="cant-entr-kg" type="text" value="${registro.cantidadEntregadaKg || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-store'></i>
                <div class="input">
                    <p class="detalle">Proveedor</p>
                    <input class="proovedor" type="text" value="${registro.proovedor || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-money'></i>
                <div class="input">
                    <p class="detalle">Precio</p>
                    <input class="precio" type="text" value="${registro.precio || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Observaciones Compras</p>
                    <input class="obs-compras" type="text" value="${registro.observacionesCompras || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-package'></i>
                <div class="input">
                    <p class="detalle">Cantidad Entregada (Unidades)</p>
                    <input class="cant-entrg-und" type="text" value="${registro.cantidadEntregadaUnd || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-car'></i>
                <div class="input">
                    <p class="detalle">Transporte/Otros</p>
                    <input class="trasp-otros" type="text" value="${registro.transporteOtros || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-check-circle'></i>
                <div class="input">
                    <p class="detalle">Estado Compra</p>
                    <input class="estado-compra" type="text" value="${registro.estadoCompra}">
                </div>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Información de ingreso</p>
            <div class="entrada">
                <i class='bx bx-package'></i>
                <div class="input">
                    <p class="detalle">Cantidad Ingresada</p>
                    <input class="cant-ingre" type="text" value="${registro.cantidadIngresada || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Observaciones Ingreso</p>
                    <input class="obs-ingre" type="text" value="${registro.observacionesIngresado}">
                </div>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Ingresa el motivo de la edición</p>
            <div class="entrada">
                <i class='bx bx-comment-detail'></i>
                <div class="input">
                    <p class="detalle">Motivo de edición</p>
                    <input class="motivo" type="text" required>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-guardar-edicion btn blue"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();
            const productoInput = document.querySelector('.entrada .producto-pedido');
            const sugerenciasList = document.querySelector('#productos-list');

            function normalizarTexto(texto) {
                return texto.toString()
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/[-_\s]+/g, '');
            }

            productoInput.addEventListener('input', (e) => {
                const valor = normalizarTexto(e.target.value);

                sugerenciasList.innerHTML = '';

                if (valor) {
                    const sugerencias = productos.filter(p =>
                        normalizarTexto(p.producto).includes(valor)
                    ).slice(0, 5);

                    if (sugerencias.length) {
                        sugerenciasList.style.display = 'flex';
                        sugerencias.forEach(p => {
                            const div = document.createElement('div');
                            div.classList.add('item');
                            div.textContent = p.producto;
                            div.onclick = () => {
                                productoInput.value = p.producto;
                                sugerenciasList.style.display = 'none';
                                window.idPro = p.id;
                                const event = new Event('focus');
                                gramajeInput.dispatchEvent(event);
                            };
                            sugerenciasList.appendChild(div);
                        });
                    }
                } else {
                    sugerenciasList.style.display = 'none';
                }
            });

            const btnGuardar = contenido.querySelector('.btn-guardar-edicion');
            btnGuardar.addEventListener('click', confirmarEdicion);

            async function confirmarEdicion() {
                try {
                    const datosActualizados = {
                        idProducto: window.idPro,
                        productoPedido: document.querySelector('.editar-pedido .producto-pedido').value,
                        cantidadPedida: document.querySelector('.editar-pedido .cantidad-pedida').value,
                        observacionesPedido: document.querySelector('.editar-pedido .obs-pedido').value,
                        estado: document.querySelector('.editar-pedido .estado').value,
                        cantidadEntregadaKg: document.querySelector('.editar-pedido .cant-entr-kg').value,
                        proovedor: document.querySelector('.editar-pedido .proovedor').value,
                        precio: document.querySelector('.editar-pedido .precio').value,
                        observacionesCompras: document.querySelector('.editar-pedido .obs-compras').value,
                        cantidadEntregadaUnd: document.querySelector('.editar-pedido .cant-entrg-und').value,
                        transporteOtros: document.querySelector('.editar-pedido .trasp-otros').value,
                        estadoCompra: document.querySelector('.editar-pedido .estado-compra').value,
                        cantidadIngresada: document.querySelector('.editar-pedido .cant-ingre').value,
                        observacionesIngresado: document.querySelector('.editar-pedido .obs-ingre').value,
                        motivo: document.querySelector('.editar-pedido .motivo').value
                    };
                    console.log(datosActualizados);

                    if (!datosActualizados.motivo) {
                        mostrarNotificacion({
                            message: 'Debe ingresar el motivo de la edición',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }

                    mostrarCarga();

                    const response = await fetch(`/editar-pedido/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datosActualizados)
                    });

                    const data = await response.json();

                    if (data.success) {
                        mostrarNotificacion({
                            message: 'Pedido actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        ocultarCarga();
                        ocultarAnuncioSecond();
                        await mostrarPedidos();
                    } else {
                        throw new Error(data.error || 'Error al actualizar el pedido');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al actualizar el pedido',
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
                try {
                    const cantidadKg = document.querySelector('.verificar-registro .cantidad-kg').value;
                    const cantidadUnd = document.querySelector('.verificar-registro .cantidad-und').value;
                    const unidadMedida = document.querySelector('.verificar-registro .unidad-medida').value;
                    const proovedor = document.querySelector('.verificar-registro .proovedor').value;
                    const precio = document.querySelector('.verificar-registro .precio').value;
                    const transporteOtros = document.querySelector('.verificar-registro .transporte').value;
                    const estadoCompra = document.querySelector('.verificar-registro .estado-compra').value;
                    const observaciones = document.querySelector('.verificar-registro .observaciones').value;

                    // Basic validations
                    if (!cantidadKg || !cantidadUnd || !proovedor || !precio) {
                        mostrarNotificacion({
                            message: 'Por favor complete todos los campos requeridos',
                            type: 'warning',
                            duration: 3500
                        });
                        return;
                    }

                    mostrarCarga();

                    const response = await fetch(`/entregar-pedido/${registro.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cantidadKg: parseFloat(cantidadKg),
                            cantidadUnidad: parseInt(cantidadUnd),
                            unidadMedida,
                            proovedor,
                            precio: parseFloat(precio),
                            transporteOtros: transporteOtros || '',
                            estadoCompra,
                            observaciones: observaciones || 'Sin observaciones'
                        })
                    });

                    const data = await response.json();

                    if (data.success) {
                        // Update message format
                        if (mensajeCompras === 'Se compro:\n• Sin compras registradas') {
                            mensajeCompras = 'Se compro:\n';
                        }
                        mensajeCompras = mensajeCompras.replace(/\n\nSe compro en la App de TotalProd.$/, '');
                        mensajeCompras = mensajeCompras.replace(/\n$/, '');
                        mensajeCompras += `\n• ${registro.producto} - ${cantidadUnd} ${unidadMedida} (${estadoCompra})`;
                        mensajeCompras += '\n\nSe compro en la App de TotalProd.';

                        localStorage.setItem('damabrava_mensaje_compras', mensajeCompras);

                        mostrarNotificacion({
                            message: 'Pedido entregado correctamente',
                            type: 'success',
                            duration: 3000
                        });

                        ocultarCarga();
                        ocultarAnuncioTercer();
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
        async function ingresar(registro) {
            mostrarCarga();
            mostrarIngresosAcopio(registro.idProducto, registro.id);
        }
        async function rechazar(registro) {
            const contenido = document.querySelector('.anuncio-second .contenido');
            const html = `
        <div class="encabezado">
            <h1 class="titulo">Rechazar Pedido ${registro.id}</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información del pedido</p>
            <div class="campo-horizontal">
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${registro.id}</span>
                    <span class="valor"><strong><i class='bx bx-package'></i> Cantidad pedida: </strong>${registro.cantidadPedida}</span>
                    <span class="valor"><strong><i class='bx bx-calendar'></i> Fecha: </strong>${registro.fecha}</span>
                    <span class="estado ${registro.estado.toLowerCase()}"><strong><i class='bx bx-check-circle'></i> Estado: </strong>${registro.estado}</span>
                </div>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Motivo de la eliminación</p>
                <div class="entrada">
                    <i class='bx bx-comment-detail'></i>
                    <div class="input">
                        <p class="detalle">Motivo</p>
                        <input class="input-motivo" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn red" onclick="confirmarRechazo('${registro.id}')"><i class='bx bx-x-circle'></i> Confirmar Rechazo</button>
        </div>

    `;
            contenido.innerHTML = html;
            mostrarAnuncioSecond();
            window.confirmarRechazo = async function (idPedido) {
                const motivo = document.querySelector('.input-motivo').value;
    
                if (!motivo) {
                    mostrarNotificacion({
                        message: 'Debe ingresar un motivo de rechazo',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }
    
                try {
                    mostrarCarga();
                    const response = await fetch(`/rechazar-pedido/${idPedido}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ motivo })
                    });
    
                    const data = await response.json();
                    if (data.success) {
                        mostrarNotificacion({
                            message: 'Pedido rechazado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        ocultarCarga();
                        cerrarAnuncioManual('anuncioTercer');
                        cerrarAnuncioManual('anuncioSecond');
                        await mostrarPedidos();
                    }
                } catch (error) {
                    mostrarNotificacion({
                        message: 'Error al rechazar el pedido',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            };
        }
        async function llego(registro) {

            try {
                mostrarCarga();
                const response = await fetch(`/llego-pedido/${registro.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await response.json();
                if (data.success) {
                    mostrarNotificacion({
                        message: 'Se cambio el estado a llego',
                        type: 'success',
                        duration: 3000
                    });
                    ocultarCarga();
                    cerrarAnuncioManual('anuncioTercer');
                    cerrarAnuncioManual('anuncioSecond');
                    await mostrarPedidos();
                }
            } catch (error) {
                mostrarNotificacion({
                    message: 'Error al rechazar el pedido',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        };

    }
    function mostrarMensajeCompras() {
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        const formatoHTML = `
    <div class="encabezado">
        <h1 class="titulo">Compras Registradas</h1>
        <button class="btn close" onclick="cerrarAnuncioManual('anuncioSecond')">
            <i class="fas fa-arrow-right"></i>
        </button>
    </div>
    <div class="relleno">
        <div class="formato-pedido">
            <div contenteditable="true" style="min-height: fit-content; white-space: pre-wrap; font-family: Arial, sans-serif; text-align: left; padding: 15px;">${mensajeCompras}</div>
        </div>
    </div>
    <div class="anuncio-botones" style="display: flex; gap: 10px;">
        <button class="btn blue" onclick="limpiarFormatoCompras()">
            <i class="fas fa-broom"></i> Limpiar
        </button>
        <button class="btn green" onclick="compartirFormatoCompras()">
            <i class="fas fa-share-alt"></i> Compartir
        </button>
    </div>
`;

        anuncioSecond.innerHTML = formatoHTML;
        mostrarAnuncioSecond();
    }
    window.limpiarFormatoCompras = function () {
        mensajeCompras = 'Se compro:\n• Sin compras registradas';
        localStorage.setItem('damabrava_mensaje_compras', mensajeCompras);
        const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
        if (formatoDiv) {
            formatoDiv.innerHTML = mensajeCompras;
        }
    };
    window.compartirFormatoCompras = async function () {
        const formatoDiv = document.querySelector('.formato-pedido div[contenteditable]');
        if (!formatoDiv) return;

        const texto = encodeURIComponent(formatoDiv.innerText);
        window.open(`https://wa.me/?text=${texto}`, '_blank');
    };
    window.mostrarFormatoCompras = function () {
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (!anuncioSecond) return;
        mostrarMensajeCompras();
    };
    btnExcel.addEventListener('click', () => exportarArchivos('produccion', registrosAExportar));
    aplicarFiltros();
}
