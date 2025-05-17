let productos = [];
let etiquetas = [];
let precios = [];
let proovedores = [];
let usuarioInfo = recuperarUsuarioLocal();
let carritoSalidas = new Map(JSON.parse(localStorage.getItem('damabrava_carrito_ingresos') || '[]'));
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
    }
}
async function obtenerAlmacenGeneral() {
    try {
        mostrarCarga();
        await obtenerEtiquetas();
        await obtenerPrecios();
        await obtenerProovedores();
        const response = await fetch('/obtener-productos');
        const data = await response.json();

        if (data.success) {
            productos = data.productos.sort((a, b) => {
                const idA = parseInt(a.id.split('-')[1]);
                const idB = parseInt(b.id.split('-')[1]);
                return idB - idA;
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


export async function mostrarIngresos(busquedaProducto = '') {
    await obtenerAlmacenGeneral();

    const contenido = document.querySelector('.anuncio .contenido');
    const etiquetasUnicas = [...new Set(etiquetas.map(etiqueta => etiqueta.etiqueta))];
    const preciosOpciones = precios.map((precio, index) => {
        const primerPrecio = precio.precio.split(';')[0].split(',')[0];
        return `<option value="${precio.id}" ${index === 1 ? 'selected' : ''}>${primerPrecio}</option>`;
    }).join('');

    const registrationHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Ingresos de almacen</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno almacen-general">
            <div class="buscador">
                <input type="text" class="buscar-producto" placeholder="Buscar..." value="${busquedaProducto}">
                <i class='bx bx-search lupa2' style="right:0"></i>
            </div>
            <div class="filtros-opciones etiquetas-filter">
                <button class="btn-filtro activado">Todos</button>
                ${etiquetasUnicas.map(etiqueta => `
                    <button class="btn-filtro">${etiqueta}</button>
                `).join('')}
            </div>
            <div class="filtros-opciones cantidad-filter" style="overflow:hidden">
                <button class="btn-filtro"><i class='bx bx-sort-down'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-up'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-a-z'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                <select class="precios-select" style="width:100%">
                    ${preciosOpciones}
                </select>
            </div>

                ${productos.map(producto => `
                <div class="registro-item" data-id="${producto.id}">
                    <div class="header">
                        <i class='bx bx-package'></i>
                        <div class="info-header">
                            <span class="id">${producto.id}
                                <div class="precio-cantidad">
                                    <span class="valor stock">${producto.stock} Und.</span>
                                    <span class="valor precio">Bs/.${producto.precios.split(';')[0].split(',')[1]}</span>
                                    <span class="carrito-cantidad"></span>
                                </div>
                            </span>
                            <span class="nombre"><strong>${producto.producto} - ${producto.gramos}gr.</strong></span>
                            <span class="etiquetas">${producto.etiquetas.split(';').join(' • ')}</span>
                        </div>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-salida btn-icon blue" data-id="${producto.id}"><i class='bx bx-transfer-alt'></i></button>
                    </div>
                </div>
            `).join('')}
            <p class="no-encontrado" style="text-align: center; font-size: 15px; color: #777; width:100%; padding:15px; display:none">
                <i class='bx bx-box' style="font-size: 2rem; display: block; margin-bottom: 8px;"></i>
                ¡Ups! No encontramos productos que coincidan con tu búsqueda o filtrado.
            </p>

        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();

    carritoSalidas.forEach((item, id) => {
        const headerCounter = document.querySelector(`.registro-item[data-id="${id}"] .carrito-cantidad`);
        if (headerCounter) {
            headerCounter.textContent = item.cantidad;
        }
    });

    const selectPrecios = document.querySelector('.precios-select');
    if (selectPrecios) {
        selectPrecios.dispatchEvent(new Event('change'));
    }


    eventosIngresos();
    aplicarFiltros('Todos', 'Todos');
    contenido.style.paddingBottom = '10px';
}
function eventosIngresos() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-opciones.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-opciones.cantidad-filter .btn-filtro');
    const selectPrecios = document.querySelector('.precios-select');

    const inputBusqueda = document.querySelector('.buscar-producto');
    const iconoBusqueda = document.querySelector('.almacen-general .buscador .lupa2');

    const botonFlotante = document.createElement('button');
    const items = document.querySelectorAll('.registro-item');


    let filtroNombreActual = 'Todos';

    botonFlotante.className = 'btn-flotante-ingresos';
    botonFlotante.innerHTML = '<i class="fas fa-arrow-down"></i>';
    document.body.appendChild(botonFlotante);

    selectPrecios.addEventListener('change', () => {
        const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex].text;

        // Actualizar precios en el carrito y en los items mostrados
        carritoSalidas.forEach((item, id) => {
            const preciosProducto = item.precios.split(';');
            const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
            item.subtotal = precioSeleccionado ? parseFloat(precioSeleccionado.split(',')[1]) : 0;
        });

        // Actualizar precios mostrados en los items
        document.querySelectorAll('.registro-item').forEach(registro => {
            const id = registro.dataset.id;
            const producto = productos.find(p => p.id === id);
            if (producto) {
                const preciosProducto = producto.precios.split(';');
                const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
                const precio = precioSeleccionado ? parseFloat(precioSeleccionado.split(',')[1]) : 0;
                const precioSpan = registro.querySelector('.precio');
                if (precioSpan) {
                    precioSpan.textContent = `Bs/.${precio.toFixed(2)}`;
                }
            }
        });

        actualizarCarritoUI();
    });
    actualizarBotonFlotante();
    botonFlotante.addEventListener('click', mostrarCarritoIngresos);
    items.forEach(item => {
        item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
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
    function aplicarFiltros() {
        const registros = document.querySelectorAll('.registro-item');
        const busqueda = normalizarTexto(inputBusqueda.value);
        const precioSeleccionado = selectPrecios.options[selectPrecios.selectedIndex].text;
        const botonCantidadActivo = document.querySelector('.filtros-opciones.cantidad-filter .btn-filtro.activado');

        // Ocultar todos con animación
        registros.forEach(registro => {
            registro.style.opacity = '0';
            registro.style.transform = 'translateY(-20px)';
        });

        setTimeout(() => {
            // Ocultar elementos y procesar filtros
            registros.forEach(registro => registro.style.display = 'none');

            // Filtrar y ordenar
            const productosFiltrados = Array.from(registros).filter(registro => {
                const producto = productos.find(p => p.id === registro.dataset.id);
                const etiquetasProducto = producto.etiquetas.split(';').map(e => e.trim());
                let mostrar = true;

                if (filtroNombreActual !== 'Todos') {
                    mostrar = mostrar && etiquetasProducto.includes(filtroNombreActual);
                }

                if (busqueda) {
                    mostrar = mostrar && (
                        normalizarTexto(producto.producto).includes(busqueda) ||
                        normalizarTexto(producto.gramos.toString()).includes(busqueda) ||
                        normalizarTexto(producto.codigo_barras).includes(busqueda) ||
                        normalizarTexto(producto.etiquetas).includes(busqueda)
                    );
                }

                return mostrar;
            });

            // Ordenamiento
            if (botonCantidadActivo) {
                const index = Array.from(botonesCantidad).indexOf(botonCantidadActivo);
                switch (index) {
                    case 0: productosFiltrados.sort((a, b) => parseInt(b.querySelector('.stock').textContent) - parseInt(a.querySelector('.stock').textContent)); break;
                    case 1: productosFiltrados.sort((a, b) => parseInt(a.querySelector('.stock').textContent) - parseInt(b.querySelector('.stock').textContent)); break;
                    case 2: productosFiltrados.sort((a, b) => a.querySelector('.nombre strong').textContent.localeCompare(b.querySelector('.nombre strong').textContent)); break;
                    case 3: productosFiltrados.sort((a, b) => b.querySelector('.nombre strong').textContent.localeCompare(a.querySelector('.nombre strong').textContent)); break;
                }
            }

            // Mostrar elementos filtrados con animación
            productosFiltrados.forEach((registro, index) => {
                registro.style.display = 'flex';
                registro.style.opacity = '0';
                registro.style.transform = 'translateY(20px)';

                setTimeout(() => {
                    registro.style.opacity = '1';
                    registro.style.transform = 'translateY(0)';
                }, 0); // Animación simultánea
            });

            // Reordenar en el DOM y actualizar precios
            const contenedor = document.querySelector('.relleno.almacen-general');
            productosFiltrados.forEach(registro => {
                const producto = productos.find(p => p.id === registro.dataset.id);
                if (precioSeleccionado) {
                    const preciosProducto = producto.precios.split(';');
                    const precioFiltrado = preciosProducto.find(p => p.split(',')[0] === precioSeleccionado);
                    if (precioFiltrado) {
                        const precio = parseFloat(precioFiltrado.split(',')[1]);
                        registro.querySelector('.precio').textContent = `Bs/.${precio.toFixed(2)}`;
                    }
                }
                contenedor.appendChild(registro);
            });

            // Mensaje vacío
            const mensajeNoEncontrado = document.querySelector('.no-encontrado');
            mensajeNoEncontrado.style.display = productosFiltrados.length === 0 ? 'block' : 'none';

        }, 200); // Tiempo de espera para la animación de ocultamiento
    }
    iconoBusqueda.addEventListener('click', () => {
        if (inputBusqueda.value) {
            inputBusqueda.value = '';
            const mensajeNoEncontrado = document.querySelector('.no-encontrado');
            mensajeNoEncontrado.style.display = 'none';
            iconoBusqueda.className = 'bx bx-search lupa2';
            aplicarFiltros();
        }
    })
    inputBusqueda.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value);
        iconoBusqueda.className = busqueda ? 'bx bx-x lupa2' : 'bx bx-search lupa2';
        aplicarFiltros();
    });
    botonesEtiquetas.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesEtiquetas.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });
    botonesCantidad.forEach(boton => {
        boton.addEventListener('click', () => {
            botonesCantidad.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');
            aplicarFiltros();
        });
    });
    selectPrecios.addEventListener('change', aplicarFiltros);
    

    function agregarAlCarrito(productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;

        // Vibrar el dispositivo si es compatible
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        // Agregar efecto visual al item
        const item = document.querySelector(`.registro-item[data-id="${productoId}"]`);
        if (item) {
            item.classList.add('agregado-al-carrito');
            setTimeout(() => {
                item.classList.remove('agregado-al-carrito');
            }, 500);
        }

        if (carritoSalidas.has(productoId)) {
            const itemCarrito = carritoSalidas.get(productoId);
            itemCarrito.cantidad += 1;
            // Actualizar el contador y stock en el header
            if (item) {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                const stockSpan = item.querySelector('.stock');
                if (cantidadSpan) cantidadSpan.textContent = itemCarrito.cantidad;
                // Mostrar el stock actual + cantidad a ingresar
                if (stockSpan) stockSpan.textContent = `${parseInt(producto.stock) + itemCarrito.cantidad} Und.`;
            }
        } else {
            carritoSalidas.set(productoId, {
                ...producto,
                cantidad: 1,
                subtotal: parseFloat(producto.precios.split(';')[0].split(',')[1])
            });
            // Actualizar el contador y stock en el header
            if (item) {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                const stockSpan = item.querySelector('.stock');
                if (cantidadSpan) cantidadSpan.textContent = '1';
                // Mostrar el stock actual + 1
                if (stockSpan) stockSpan.textContent = `${parseInt(producto.stock) + 1} Und.`;
            }
        }
        actualizarCarritoLocalIngresos();
        actualizarBotonFlotante();
        actualizarCarritoUI();
    }
    window.eliminarDelCarrito = (id) => {
        const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
        const item = carritoSalidas.get(id);

        // Actualizar contador y stock en el header
        const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);
        if (headerItem && item) {
            const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
            const stockSpan = headerItem.querySelector('.stock');
            if (cantidadSpan) cantidadSpan.textContent = '';
            if (stockSpan) stockSpan.textContent = `${item.stock} Und.`;
        }

        if (itemToRemove) {
            itemToRemove.style.height = `${itemToRemove.offsetHeight}px`;
            itemToRemove.classList.add('eliminar-item');

            setTimeout(() => {
                itemToRemove.style.height = '0';
                itemToRemove.style.margin = '0';
                itemToRemove.style.padding = '0';

                setTimeout(() => {
                    carritoSalidas.delete(id);
                    actualizarCarritoLocalIngresos();
                    actualizarBotonFlotante();
                    itemToRemove.remove();

                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }

                    if (carritoSalidas.size === 0) {
                        ocultarAnuncioSecond();
                        mostrarNotificacion({
                            message: 'Carrito vacío',
                            type: 'info',
                            duration: 2000
                        });
                        return;
                    }

                    // Actualizar totales
                    const subtotal = Array.from(carritoSalidas.values())
                        .reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
                    const totalElement = document.querySelector('.total-final');
                    const subtotalElement = document.querySelector('.campo-vertical span:first-child');

                    if (subtotalElement && totalElement) {
                        subtotalElement.innerHTML = `<strong>Subtotal: </strong>Bs/.${subtotal.toFixed(2)}`;
                        totalElement.innerHTML = `<strong>Total Final: </strong>Bs/.${subtotal.toFixed(2)}`;

                        const descuentoInput = document.querySelector('.descuento');
                        const aumentoInput = document.querySelector('.aumento');
                        if (descuentoInput && aumentoInput) {
                            const descuentoValor = parseFloat(descuentoInput.value) || 0;
                            const aumentoValor = parseFloat(aumentoInput.value) || 0;
                            const totalCalculado = subtotal - descuentoValor + aumentoValor;
                            totalElement.innerHTML = `<strong>Total Final: </strong>Bs/.${totalCalculado.toFixed(2)}`;
                        }
                    }
                }, 300);
            }, 0);
        }
    };
    function actualizarBotonFlotante() {
        const botonFlotante = document.querySelector('.btn-flotante-ingresos');
        if (!botonFlotante) return;

        botonFlotante.style.display = carritoSalidas.size > 0 ? 'flex' : 'none';
        botonFlotante.innerHTML = `
            <i class="fas fa-arrow-down"></i>
            <span class="cantidad">${carritoSalidas.size}</span>
        `;
    }
    function mostrarCarritoIngresos() {
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (!anuncioSecond) return;

        const subtotal = Array.from(carritoSalidas.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
        let descuento = 0;
        let aumento = 0;

        anuncioSecond.innerHTML = `
            <div class="encabezado">
                <h1 class="titulo">Carrito de Ingresos</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
                <button class="btn filtros limpiar"><i class="fas fa-broom"></i></button>
            </div>
            <div class="relleno">
                <div class="carrito-items">
                ${Array.from(carritoSalidas.values()).map(item => `
                    <div class="carrito-item" data-id="${item.id}">
                        <div class="item-info">
                            <h3>${item.producto} - ${item.gramos}gr</h3>
                            <div class="cantidad-control">
                                <button class="btn-cantidad" style="color:var(--error)" onclick="ajustarCantidad('${item.id}', -1)">-</button>
                                <input type="number" value="${item.cantidad}" min="1"
                                    onfocus="this.select()"
                                    onchange="actualizarCantidad('${item.id}', this.value)">
                                <button class="btn-cantidad"style="color:var(--success)" onclick="ajustarCantidad('${item.id}', 1)">+</button>
                            </div>
                        </div>
                        <div class="subtotal-delete">
                            <div class="info-valores">
                                <p class="stock-disponible">${parseInt(item.stock) + parseInt(item.cantidad)} Und.</p>
                                <p class="subtotal">Bs/.${(item.cantidad * item.subtotal).toFixed(2)}</p>
                            </div>
                            <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">
                                <i class="bx bx-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
                    <div class="carrito-total">
                    <div class="campo-vertical">
                        <span><strong>Subtotal: </strong>Bs/.${subtotal.toFixed(2)}</span>
                        <span class="total-final"><strong>Total Final: </strong>Bs/.${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="campo-horizontal">
                        <div class="entrada">
                            <i class='bx bx-purchase-tag-alt'></i>
                            <div class="input">
                                <p class="detalle">Descuento</p>
                                <input class="descuento" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                        <div class="entrada">
                            <i class='bx bx-plus'></i>
                            <div class="input">
                                <p class="detalle">Aumento</p>
                                <input class="aumento" type="number" autocomplete="off" placeholder=" " required>
                            </div>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-user'></i>
                        <div class="input">
                            <p class="detalle">Selecciona proovedor</p>
                            <select class="select-proovedor" required>
                                <option value=""></option>
                                ${proovedores.map(proovedor => `
                                    <option value="${proovedor.nombre}(${proovedor.id})">${proovedor.nombre}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-label'></i>
                        <div class="input">
                            <p class="detalle">Nombre del movimiento</p>
                            <input class="nombre-movimiento" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                    <div class="entrada">
                        <i class='bx bx-comment-detail'></i>
                        <div class="input">
                            <p class="detalle">Observaciones</p>
                            <input class="Observaciones" type="text" autocomplete="off" placeholder=" " required>
                        </div>
                    </div>
                </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-procesar-salida btn orange" onclick="registrarIngreso()"><i class='bx bx-import'></i> Procesar Ingresos</button>
            </div>
        `;

        mostrarAnuncioSecond();

        const inputDescuento = anuncioSecond.querySelector('.descuento');
        const inputAumento = anuncioSecond.querySelector('.aumento');
        const totalFinal = anuncioSecond.querySelector('.total-final');

        function actualizarTotal() {
            const descuentoValor = parseFloat(inputDescuento.value) || 0;
            const aumentoValor = parseFloat(inputAumento.value) || 0;
            const totalCalculado = subtotal - descuentoValor + aumentoValor;

            totalFinal.innerHTML = `<strong>Total Final: </strong>Bs/.${totalCalculado.toFixed(2)}`;
        }

        inputDescuento.addEventListener('input', actualizarTotal);
        inputAumento.addEventListener('input', actualizarTotal);

        const botonLimpiar = anuncioSecond.querySelector('.btn.filtros.limpiar');
        botonLimpiar.addEventListener('click', () => {
            carritoSalidas.forEach((item, id) => {
                const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);
                if (headerItem) {
                    const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                    const stockSpan = headerItem.querySelector('.stock');
                    if (cantidadSpan) cantidadSpan.textContent = '';
                    if (stockSpan) stockSpan.textContent = `${item.stock} Und.`;
                }
            });

            carritoSalidas.clear();
            document.querySelector('.btn-flotante-ingresos').style.display = 'none';
            actualizarCarritoLocalIngresos();
            actualizarBotonFlotante();
            ocultarAnuncioSecond();
            mostrarNotificacion({
                message: 'Carrito limpiado exitosamente',
                type: 'success',
                duration: 2000
            });
        });

    }
    window.ajustarCantidad = (id, delta) => {
        const item = carritoSalidas.get(id);
        if (!item) return;

        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > 0) { // Removemos el límite superior ya que es un ingreso
            item.cantidad = nuevaCantidad;
            // Actualizar contador y stock en el header
            const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);
            if (headerItem) {
                const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                const stockSpan = headerItem.querySelector('.stock');
                if (cantidadSpan) cantidadSpan.textContent = nuevaCantidad;
                if (stockSpan) stockSpan.textContent = `${parseInt(item.stock) + nuevaCantidad} Und.`;
            }
            actualizarCarritoLocalIngresos();
            actualizarCarritoUI();
        }
    };
    window.actualizarCantidad = (id, valor) => {
        const item = carritoSalidas.get(id);
        if (!item) return;

        const cantidad = parseInt(valor);
        if (cantidad > 0 && cantidad <= item.stock) {
            item.cantidad = cantidad;
            // Actualizar contador en el header
            const headerCounter = document.querySelector(`.registro-item[data-id="${id}"] .carrito-cantidad`);
            if (headerCounter) {
                headerCounter.textContent = cantidad;
            }
            actualizarCarritoLocalIngresos();
            actualizarCarritoUI();
        }
    };
    function actualizarCarritoUI() {
        if (carritoSalidas.size === 0) {
            ocultarAnuncioSecond();
            document.querySelector('.btn-flotante-ingresos').style.display = 'none';
            return;
        }

        const items = document.querySelectorAll('.carrito-item');
        items.forEach(item => {
            const id = item.dataset.id;
            const producto = carritoSalidas.get(id);
            if (producto) {
                const cantidadInput = item.querySelector('input[type="number"]');
                const stockDisponible = item.querySelector('.stock-disponible');
                const subtotalElement = item.querySelector('.subtotal');

                cantidadInput.value = producto.cantidad;
                // Mostrar el stock final (actual + cantidad a ingresar)
                stockDisponible.textContent = `${parseInt(producto.stock) + producto.cantidad} Und.`;
                subtotalElement.textContent = `Bs/.${(producto.cantidad * producto.subtotal).toFixed(2)}`;
            }
        });

        // Actualizar el total
        const subtotal = Array.from(carritoSalidas.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
        const totalElement = document.querySelector('.total-final');
        const subtotalElement = document.querySelector('.campo-vertical span:first-child');

        subtotalElement.innerHTML = `<strong>Subtotal: </strong>Bs/.${subtotal.toFixed(2)}`;
        totalElement.innerHTML = `<strong>Total Final: </strong>Bs/.${subtotal.toFixed(2)}`;

        // Mantener los valores de descuento y aumento
        const descuentoInput = document.querySelector('.descuento');
        const aumentoInput = document.querySelector('.aumento');
        if (descuentoInput && aumentoInput) {
            const descuentoValor = parseFloat(descuentoInput.value) || 0;
            const aumentoValor = parseFloat(aumentoInput.value) || 0;
            const totalCalculado = subtotal - descuentoValor + aumentoValor;
            totalElement.innerHTML = `<strong>Total Final: </strong>Bs/.${totalCalculado.toFixed(2)}`;
        }
    }
    function actualizarCarritoLocalIngresos() {
        localStorage.setItem('damabrava_carrito_ingresos', JSON.stringify(Array.from(carritoSalidas.entries())));
    }


    async function registrarIngreso() {
        const proovedorSelect = document.querySelector('.select-proovedor');
        const nombreMovimiento = document.querySelector('.nombre-movimiento');
        if (!proovedorSelect.value) {
            mostrarNotificacion({
                message: 'Seleccione un prooveedor antes de continuar',
                type: 'error',
                duration: 3000
            });
            return;
        }
        if (!nombreMovimiento.value) {
            mostrarNotificacion({
                message: 'Ingrese un nombre para el movimiento',
                type: 'error',
                duration: 3000
            });
            return;
        }

        const registroIngreso = {
            fechaHora: new Date().toLocaleString(),
            tipo: 'Ingreso',
            productos: Array.from(carritoSalidas.values()).map(item => `${item.producto} - ${item.gramos}gr`).join(';'),
            cantidades: Array.from(carritoSalidas.values()).map(item => item.cantidad).join(';'),
            operario: `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
            clienteId: proovedorSelect.value,
            nombre_movimiento: nombreMovimiento.value,
            subtotal: Array.from(carritoSalidas.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0),
            descuento: parseFloat(document.querySelector('.descuento').value) || 0,
            aumento: parseFloat(document.querySelector('.aumento').value) || 0,
            total: 0,
            observaciones: document.querySelector('.Observaciones').value || 'Ninguna',
            precios_unitarios: Array.from(carritoSalidas.values())
            .map(item => parseFloat(item.subtotal).toFixed(2))
            .join(';')
        };

        registroIngreso.total = registroIngreso.subtotal - registroIngreso.descuento + registroIngreso.aumento;

        try {
            mostrarCarga();

            // Primero registramos el movimiento
            const response = await fetch('/registrar-movimiento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                },
                body: JSON.stringify(registroIngreso)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error en la respuesta del servidor');
            }

            // Actualizar el stock en Almacen general
            const actualizacionesStock = Array.from(carritoSalidas.values()).map(item => ({
                id: item.id,
                cantidad: item.cantidad
            }));

            const responseStock = await fetch('/actualizar-stock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                },
                body: JSON.stringify({
                    actualizaciones: actualizacionesStock,
                    tipo: 'ingreso'  // Especificamos que es un ingreso
                })
            });

            const dataStock = await responseStock.json();

            if (!responseStock.ok || !dataStock.success) {
                throw new Error(dataStock.error || 'Error al actualizar el stock');
            }

            // Limpiar carrito y actualizar UI
            carritoSalidas.clear();
            localStorage.removeItem('damabrava_carrito_ingresos');
            document.querySelector('.btn-flotante-ingresos').style.display = 'none';


            mostrarNotificacion({
                message: 'Ingreso registrado exitosamente',
                type: 'success',
                duration: 3000
            });

            await mostrarIngresos();
            ocultarAnuncioSecond();

        } catch (error) {
            console.error('Error al procesar el ingreso:', error);
            mostrarNotificacion({
                message: 'Error al procesar el ingreso: ' + error.message,
                type: 'error',
                duration: 3500
            });
        } finally {
            ocultarCarga();
        }
    }
    window.registrarIngreso = registrarIngreso;
    return { aplicarFiltros };
}
