
let productos = [];
let etiquetas = [];
let precios = [];
let usuarioInfo = recuperarUsuarioLocal();
function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}

async function obtenerEtiquetas() {
    try {
        const response = await fetch('/obtener-etiquetas');
        const data = await response.json();

        if (data.success) {
            etiquetas = data.etiquetas.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener etiquetas',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener etiquetas:', error);
        mostrarNotificacion({
            message: 'Error al obtener etiquetas',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}
async function obtenerPrecios() {
    try {
        const response = await fetch('/obtener-precios');
        const data = await response.json();

        if (data.success) {
            precios = data.precios.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener precios',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener precios:', error);
        mostrarNotificacion({
            message: 'Error al obtener precios',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}
async function obtenerAlmacenGeneral() {
    try {
        mostrarCarga();
        await obtenerEtiquetas();
        await obtenerPrecios();
        const response = await fetch('/obtener-productos');
        const data = await response.json();

        if (data.success) {
            // Guardar los productos en la variable global y ordenarlos por ID
            productos = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA; // Orden descendente por número de ID
            });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener productos del almacén',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener productos:', error);
        mostrarNotificacion({
            message: 'Error al obtener productos del almacén',
            type: 'error',
            duration: 3500
        });
        return false;
    } finally {
        ocultarCarga();
    }
}


export async function mostrarAlmacenGeneral() {
    await obtenerAlmacenGeneral();
    const contenido = document.querySelector('.anuncio .contenido');
    // Usar etiquetas en lugar de nombres para los filtros
    const etiquetasUnicas = [...new Set(etiquetas.map(etiqueta => etiqueta.etiqueta))];
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Almacén General</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <button class="btn filtros"><i class='bx bx-filter'></i></button>
        </div>
        <div class="relleno almacen-general">
            <div class="buscador">
                <input type="text" class="buscar-producto" placeholder="Buscar...">
                <i class='bx bx-search'></i>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Filtros</p>
            <div class="filtros-opciones etiquetas-filter">
                <button class="btn-filtro activado">Todos</button>
                ${etiquetasUnicas.map(etiqueta => `
                    <button class="btn-filtro">${etiqueta}</button>
                `).join('')}
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Productos</p>
                ${productos.map(producto => `
                <div class="registro-item" data-id="${producto.id}">
                    <div class="header">
                        <span class="nombre">${producto.id}<span class="valor stock">${producto.stock} Und.</span></span>
                        <span class="valor" color var><strong>${producto.producto} - ${producto.gramos}gr.</strong></span>
                        <span class="fecha">${producto.etiquetas.split(';').join(' • ')}</span>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info btn-icon gray" data-id="${producto.id}"><i class='bx bx-info-circle'></i></button>
                        <button class="btn-editar btn-icon blue" data-id="${producto.id}"><i class='bx bx-edit'></i></button>
                        <button class="btn-eliminar btn-icon red" data-id="${producto.id}"><i class="bi bi-trash-fill"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="anuncio-botones">
            <button class="btn-crear-producto btn orange"> <i class='bx bx-plus'></i> Crear producto</button>
            <button class="btn-etiquetas btn especial"><i class='bx bx-purchase-tag'></i>  Etiquetas</button>
        </div>
        
    `;
    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    const { aplicarFiltros } = eventosAlmacenGeneral();

    aplicarFiltros('Todos', 'Todos');
}
function eventosAlmacenGeneral() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-opciones.etiquetas-filter .btn-filtro');

    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    const botonesEditar = document.querySelectorAll('.btn-editar');
    const botonesInfo = document.querySelectorAll('.btn-info');

    const filtros = document.querySelector('.filtros');

    const btnCrearProducto = document.querySelector('.btn-crear-producto');
    const btnEtiquetas = document.querySelector('.btn-etiquetas');

    const items = document.querySelectorAll('.registro-item');

    const inputBusqueda = document.querySelector('.buscar-producto');
    const iconoBusqueda = document.querySelector('.almacen-general .buscador i');


    inputBusqueda.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value);
        iconoBusqueda.className = busqueda ? 'bx bx-x' : 'bx bx-search';

        // Cambiar icono y clase según si hay texto
        if (busqueda) {
            iconoBusqueda.className = 'bx bx-x';
            botonesEtiquetas.forEach(btn => {
                btn.classList.remove('activado');
            });
        } else {
            iconoBusqueda.className = 'bx bx-search';
            // Reactivar el filtro "Todos" cuando se limpia la búsqueda
            document.querySelector('.btn-filtro').classList.add('activado');
        }

        const registros = document.querySelectorAll('.registro-item');
        registros.forEach(registro => {
            const producto = productos.find(p => p.id === registro.dataset.id);
            const textoProducto = normalizarTexto(producto.producto);
            const codigoBarras = normalizarTexto(producto.codigo_barras);
            const etiquetas = normalizarTexto(producto.etiquetas);

            if (!busqueda ||
                textoProducto.includes(busqueda) ||
                codigoBarras.includes(busqueda) ||
                etiquetas.includes(busqueda)) {
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
    btnCrearProducto.addEventListener('click', crearProducto);
    btnEtiquetas.addEventListener('click', gestionarEtiquetas);



    let filtroNombreActual = 'Todos';


    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');

        registros.forEach(registro => {
            const registroId = registro.dataset.id;
            const producto = productos.find(p => p.id === registroId);
            const etiquetasProducto = producto.etiquetas.split(';').map(e => e.trim());

            let mostrar = true;

            // Si hay un filtro activo que no sea 'Todos'
            if (filtroNombreActual !== 'Todos') {
                mostrar = etiquetasProducto.includes(filtroNombreActual);
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
    botonesEtiquetas.forEach(boton => {
        boton.addEventListener('click', () => {
            // Limpiar input de búsqueda
            inputBusqueda.value = '';
            iconoBusqueda.className = 'bx bx-search';

            // Remover clase 'activado' de todos los botones
            botonesEtiquetas.forEach(b => b.classList.remove('activado'));
            // Agregar clase 'activado' al botón clickeado
            boton.classList.add('activado');

            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });
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


    function info(event) {
        const registroId = event.currentTarget.dataset.id;
        const producto = productos.find(r => r.id === registroId);

        // Procesar los precios
        const preciosFormateados = producto.precios.split(';')
            .filter(precio => precio.trim()) // Eliminar elementos vacíos
            .map(precio => {
                const [ciudad, valor] = precio.split(',');
                return `<span class="valor"><strong><i class='bx bx-store'></i> ${ciudad}: </strong>Bs/.${valor}</span>`;
            })
            .join('');
        const etiquetasFormateados = producto.etiquetas.split(';')
            .filter(precio => precio.trim()) // Eliminar elementos vacíos
            .map(precio => {
                const [valor] = precio.split(';');
                return `<span class="valor"><strong><i class='bx bx-tag'></i> ${valor}</span>`;
            })
            .join('');
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Info producto</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno verificar-registro">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${producto.id}</span>
                <span class="nombre"><strong><i class='bx bx-cube'></i> Producto: </strong>${producto.producto}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${producto.gramos}gr.</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Stock: </strong>${producto.stock} Und.</span>
                <span class="valor"><strong><i class='bx bx-hash'></i> Codigo: </strong>${producto.codigo_barras} Und.</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles adicionales</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-hash'></i> Cantidad por grupo: </strong>${producto.cantidadxgrupo}</span>
                <span class="valor"><strong><i class='bx bx-list-ul'></i> Lista: </strong>${producto.lista}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Alamcen Index: </strong>${producto.alm_acopio_producto}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Precios</p>
            <div class="campo-vertical">
                ${preciosFormateados}
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Etiquetas</p>
            <div class="campo-vertical">
                ${etiquetasFormateados}
            </div>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        contenido.style.paddingBottom = '10px';
        mostrarAnuncioSecond();
    }
    function eliminar(event) {
        const registroId = event.currentTarget.dataset.id;
        const producto = productos.find(r => r.id === registroId);

        // Procesar los precios
        const preciosFormateados = producto.precios.split(';')
            .filter(precio => precio.trim()) // Eliminar elementos vacíos
            .map(precio => {
                const [ciudad, valor] = precio.split(',');
                return `<span class="valor"><strong><i class='bx bx-store'></i> ${ciudad}: </strong>Bs/.${valor}</span>`;
            })
            .join('');
        const etiquetasFormateados = producto.etiquetas.split(';')
            .filter(precio => precio.trim()) // Eliminar elementos vacíos
            .map(precio => {
                const [valor] = precio.split(';');
                return `<span class="valor"><strong><i class='bx bx-tag'></i> ${valor}</span>`;
            })
            .join('');

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Eliminar producto</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i> Información básica</p>
            <div class="campo-vertical">
                <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${producto.id}</span>
                <span class="nombre"><strong><i class='bx bx-cube'></i> Producto: </strong>${producto.producto}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Información del producto</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class="ri-scales-line"></i> Gramaje: </strong>${producto.gramos}gr.</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Stock: </strong>${producto.stock} Und.</span>
                <span class="valor"><strong><i class='bx bx-hash'></i> Codigo: </strong>${producto.codigo_barras} Und.</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Detalles adicionales</p>
            <div class="campo-vertical">
                <span class="valor"><strong><i class='bx bx-hash'></i> Cantidad por grupo: </strong>${producto.cantidadxgrupo}</span>
                <span class="valor"><strong><i class='bx bx-list-ul'></i> Lista: </strong>${producto.lista}</span>
                <span class="valor"><strong><i class='bx bx-package'></i> Alamcen Index: </strong>${producto.alm_acopio_producto}</span>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i> Precios</p>
            <div class="campo-vertical">
                ${preciosFormateados}
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Etiquetas</p>
            <div class="campo-vertical">
                ${etiquetasFormateados}
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
            <button class="btn-eliminar-producto btn red"><i class="bi bi-trash-fill"></i> Eliminar</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnEliminar = contenido.querySelector('.btn-eliminar-producto');
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
        const producto = productos.find(r => r.id === registroId);

        // Procesar las etiquetas actuales del producto
        const etiquetasProducto = producto.etiquetas.split(';').filter(e => e.trim());
        const etiquetasHTML = etiquetasProducto.map(etiqueta => `
        <div class="etiqueta-item" data-valor="${etiqueta}">
            <i class='bx bx-purchase-tag'></i>
            <span>${etiqueta}</span>
            <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
        </div>
    `).join('');

        // Procesar los precios del producto
        // Procesar los precios del producto
        const preciosFormateados = producto.precios.split(';')
            .filter(precio => precio.trim())
            .map(precio => {
                const [ciudad, valor] = precio.split(',');
                return `<div class="entrada">
                            <i class='bx bx-store'></i>
                            <div class="input">
                                <p class="detalle">${ciudad}</p>
                                <input class="precio-input" data-ciudad="${ciudad}" type="number" value="${valor}" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>`;
            })
            .join('');

        // Lista de etiquetas disponibles (excluyendo las ya seleccionadas)
        const etiquetasDisponibles = etiquetas
            .map(e => e.etiqueta)
            .filter(e => !etiquetasProducto.includes(e));

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Editar producto</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-produccion">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información basica</p>
                <div class="entrada">
                    <i class='bx bx-cube'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" type="text" value="${producto.producto}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class="ri-scales-line"></i>
                    <div class="input">
                        <p class="detalle">Gramaje</p>
                        <input class="gramaje" type="number" value="${producto.gramos}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles adicionales</p>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Stock</p>
                        <input class="stock" type="number" value="${producto.stock}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-barcode'></i>
                    <div class="input">
                        <p class="detalle">Código de barras</p>
                        <input class="codigo-barras" type="text" value="${producto.codigo_barras}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-list-ul'></i>
                    <div class="input">
                        <p class="detalle">Lista</p>
                        <input class="lista" type="text" value="${producto.lista}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad por grupo</p>
                        <input class="cantidad-grupo" type="number" value="${producto.cantidadxgrupo}" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Etiquetas</p>
            <div class="etiquetas-container">
                <div class="etiquetas-actuales">
                    ${etiquetasHTML}
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-purchase-tag'></i>
                <div class="input">
                    <p class="detalle">Selecciona nueva etiqueta</p>
                    <select class="select-etiqueta" required>
                    ${etiquetasDisponibles.map(etiqueta =>
            `<option value="${etiqueta}">${etiqueta}</option>`
        ).join('')}
                    </select>
                    <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
                </div>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Precios</p>
                ${preciosFormateados}

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

        // Eventos para manejar etiquetas
        const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-etiqueta');
        const selectEtiqueta = contenido.querySelector('.select-etiqueta');
        const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

        btnAgregarEtiqueta.addEventListener('click', () => {
            const etiquetaSeleccionada = selectEtiqueta.value;
            if (etiquetaSeleccionada) {
                const nuevaEtiqueta = document.createElement('div');
                nuevaEtiqueta.className = 'etiqueta-item';
                nuevaEtiqueta.dataset.valor = etiquetaSeleccionada;
                nuevaEtiqueta.innerHTML = `
                <i class='bx bx-purchase-tag'></i>
                <span>${etiquetaSeleccionada}</span>
                <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
            `;
                etiquetasActuales.appendChild(nuevaEtiqueta);
                selectEtiqueta.querySelector(`option[value="${etiquetaSeleccionada}"]`).remove();
                selectEtiqueta.value = '';
            }
        });

        // Eventos para quitar etiquetas
        etiquetasActuales.addEventListener('click', (e) => {
            if (e.target.closest('.btn-quitar-etiqueta')) {
                const etiquetaItem = e.target.closest('.etiqueta-item');
                const valorEtiqueta = etiquetaItem.dataset.valor;
                const option = document.createElement('option');
                option.value = valorEtiqueta;
                option.textContent = valorEtiqueta;
                selectEtiqueta.appendChild(option);
                etiquetaItem.remove();
            }
        });

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
    function crearProducto() {

        const preciosFormateados = precios.map(precio => {
            return `<div class="entrada">
                        <i class='bx bx-store'></i>
                        <div class="input">
                            <p class="detalle">${precio.precio}</p>
                            <input class="precio-input" data-ciudad="${precio.precio}" type="number" value="" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>`;
        }).join('');

        // Lista de todas las etiquetas disponibles
        const etiquetasDisponibles = etiquetas.map(e => e.etiqueta);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Nuevo producto</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-produccion">
            <p class="normal"><i class='bx bx-chevron-right'></i>Información basica</p>
                <div class="entrada">
                    <i class='bx bx-cube'></i>
                    <div class="input">
                        <p class="detalle">Producto</p>
                        <input class="producto" type="text"  autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class="ri-scales-line"></i>
                    <div class="input">
                        <p class="detalle">Gramaje</p>
                        <input class="gramaje" type="number"  autocomplete="off" placeholder=" " required>
                    </div>
                </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Detalles adicionales</p>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Stock</p>
                        <input class="stock" type="number"  autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-barcode'></i>
                    <div class="input">
                        <p class="detalle">Código de barras</p>
                        <input class="codigo-barras" type="number" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-list-ul'></i>
                    <div class="input">
                        <p class="detalle">Lista</p>
                        <input class="lista" type="text" autocomplete="off" placeholder=" " required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-package'></i>
                    <div class="input">
                        <p class="detalle">Cantidad por grupo</p>
                        <input class="cantidad-grupo" type="number"  autocomplete="off" placeholder=" " required>
                    </div>
                </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Etiquetas</p>
            <div class="etiquetas-container">
                <div class="etiquetas-actuales">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-purchase-tag'></i>
                <div class="input">
                    <p class="detalle">Selecciona nueva etiqueta</p>
                    <select class="select-etiqueta" required>
                        <option value=""></option>
                        ${etiquetasDisponibles.map(etiqueta =>
            `<option value="${etiqueta}">${etiqueta}</option>`
        ).join('')}
                    </select>
                    <button type="button" class="btn-agregar-etiqueta"><i class='bx bx-plus'></i></button>
                </div>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Precios</p>
                ${preciosFormateados}

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
            <button class="btn-editar-registro btn orange"><i class="bx bx-plus"></i> Crear producto</button>
        </div>
    `;

        contenido.innerHTML = registrationHTML;

        // Eventos para manejar etiquetas
        const btnAgregarEtiqueta = contenido.querySelector('.btn-agregar-etiqueta');
        const selectEtiqueta = contenido.querySelector('.select-etiqueta');
        const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');

        btnAgregarEtiqueta.addEventListener('click', () => {
            const etiquetaSeleccionada = selectEtiqueta.value;
            if (etiquetaSeleccionada) {
                const nuevaEtiqueta = document.createElement('div');
                nuevaEtiqueta.className = 'etiqueta-item';
                nuevaEtiqueta.dataset.valor = etiquetaSeleccionada;
                nuevaEtiqueta.innerHTML = `
                <i class='bx bx-purchase-tag'></i>
                <span>${etiquetaSeleccionada}</span>
                <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
            `;
                etiquetasActuales.appendChild(nuevaEtiqueta);
                selectEtiqueta.querySelector(`option[value="${etiquetaSeleccionada}"]`).remove();
                selectEtiqueta.value = '';
            }
        });

        // Eventos para quitar etiquetas
        etiquetasActuales.addEventListener('click', (e) => {
            if (e.target.closest('.btn-quitar-etiqueta')) {
                const etiquetaItem = e.target.closest('.etiqueta-item');
                const valorEtiqueta = etiquetaItem.dataset.valor;
                const option = document.createElement('option');
                option.value = valorEtiqueta;
                option.textContent = valorEtiqueta;
                selectEtiqueta.appendChild(option);
                etiquetaItem.remove();
            }
        });

        mostrarAnuncioSecond();

        // Agregar evento al botón guardar
        const btnEditar = contenido.querySelector('.btn-editar-registro');
        btnEditar.addEventListener('click', confirmarCreacion);

        async function confirmarCreacion() {
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
    function gestionarEtiquetas() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const etiquetasHTML = etiquetas.map(etiqueta => `
            <div class="etiqueta-item" data-id="${etiqueta.id}">
                <i class='bx bx-purchase-tag'></i>
                <span>${etiqueta.etiqueta}</span>
                <button type="button" class="btn-quitar-etiqueta"><i class='bx bx-x'></i></button>
            </div>
        `).join('');

        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Gestionar Etiquetas</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno editar-produccion">
            <p class="normal"><i class='bx bx-chevron-right'></i>Etiquetas existentes</p>
            <div class="etiquetas-container">
                <div class="etiquetas-actuales">
                    ${etiquetasHTML}
                </div>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Agregar nueva etiqueta</p>
            <div class="entrada">
                <i class='bx bx-purchase-tag'></i>
                <div class="input">
                    <p class="detalle">Nueva etiqueta</p>
                    <input class="nueva-etiqueta" type="text" autocomplete="off" placeholder=" " required>
                    <button type="button" class="btn-agregar-etiqueta-temp"><i class='bx bx-plus'></i></button>
                </div>
            </div>
        </div>
        `;

        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();


        const btnAgregarTemp = contenido.querySelector('.btn-agregar-etiqueta-temp');
        const etiquetasActuales = contenido.querySelector('.etiquetas-actuales');


        btnAgregarTemp.addEventListener('click', async () => {
            const nuevaEtiqueta = document.querySelector('.nueva-etiqueta').value.trim();
            if (nuevaEtiqueta) {
                try {
                    mostrarCarga();
                    const response = await fetch('/agregar-etiqueta', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ etiqueta: nuevaEtiqueta })
                    });

                    if (!response.ok) throw new Error('Error al agregar etiqueta');

                    const data = await response.json();
                    if (data.success) {
                        await obtenerEtiquetas();
                        document.querySelector('.nueva-etiqueta').value = '';
                        mostrarNotificacion({
                            message: 'Etiqueta agregada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        gestionarEtiquetas(); // Refresh the view
                        await mostrarAlmacenGeneral();
                    }
                } catch (error) {
                    mostrarNotificacion({
                        message: error.message,
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            }
        });
        etiquetasActuales.addEventListener('click', async (e) => {
            if (e.target.closest('.btn-quitar-etiqueta')) {
                try {
                    const etiquetaItem = e.target.closest('.etiqueta-item');
                    const etiquetaId = etiquetaItem.dataset.id;

                    mostrarCarga();
                    const response = await fetch(`/eliminar-etiqueta/${etiquetaId}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) throw new Error('Error al eliminar etiqueta');

                    const data = await response.json();
                    if (data.success) {
                        await obtenerEtiquetas();
                        mostrarNotificacion({
                            message: 'Etiqueta eliminada correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        gestionarEtiquetas(); // Refresh the view
                        await mostrarAlmacenGeneral();
                    }
                } catch (error) {
                    mostrarNotificacion({
                        message: error.message,
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            }
        });
    }

    return { aplicarFiltros };
}
