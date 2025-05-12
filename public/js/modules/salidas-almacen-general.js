let productos = [];
let etiquetas = [];
let precios = [];
let clientes = [];
let usuarioInfo = recuperarUsuarioLocal();
let carritoSalidas = new Map(JSON.parse(localStorage.getItem('damabrava_carrito') || '[]'));

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


async function obtenerAlmacenGeneral() {
    try {
        mostrarCarga();
        await obtenerEtiquetas();
        await obtenerPrecios();
        await obtenerClientes();
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




export async function mostrarSalidas() {
    await obtenerAlmacenGeneral();
    const contenido = document.querySelector('.anuncio .contenido');
    const etiquetasUnicas = [...new Set(etiquetas.map(etiqueta => etiqueta.etiqueta))];
    const preciosOpciones = precios.map((precio, index) => {
        const primerPrecio = precio.precio.split(';')[0].split(',')[0];
        return `<option value="${precio.id}" ${index === 1 ? 'selected' : ''}>${primerPrecio}</option>`;
    }).join('');


    const registrationHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Salidas de almacen</h1>
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
            <div class="filtros-opciones cantidad-filter" style="overflow:hidden">
                <button class="btn-filtro"><i class='bx bx-sort-down'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-up'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-a-z'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                <select class="precios-select" style="width:100%">
                    ${preciosOpciones}
                </select>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Productos</p>
                ${productos.map(producto => `
                <div class="registro-item" data-id="${producto.id}">
                    <div class="header">
                        <div class="nombre">${producto.id}
                            <div class="precio-cantidad">
                                <span class="valor stock">${producto.stock} Und.</span>
                                <span class="valor precio">Bs/.${producto.precios.split(';')[0].split(',')[1]}</span>
                            </div>
                        </div>
                        <span class="valor producto-header" color var><strong>${producto.producto} - ${producto.gramos}gr.</strong></span>
                        <span class="fecha">${producto.etiquetas.split(';').join(' • ')}</span>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-salida btn-icon blue" data-id="${producto.id}"><i class='bx bx-transfer-alt'></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();

    const selectPrecios = document.querySelector('.precios-select');
    if (selectPrecios) {
        selectPrecios.dispatchEvent(new Event('change'));
    }

    const { aplicarFiltros } = eventosSalidas();
    aplicarFiltros('Todos', 'Todos');

    contenido.style.paddingBottom = '10px';
}
function eventosSalidas() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-opciones.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-opciones.cantidad-filter .btn-filtro');
    const selectPrecios = document.querySelector('.precios-select');
    const inputBusqueda = document.querySelector('.buscar-producto');
    const iconoBusqueda = document.querySelector('.almacen-general .buscador i');
    const botonFlotante = document.createElement('button');
    botonFlotante.className = 'btn-flotante-salidas';
    botonFlotante.innerHTML = '<i class="bx bx-cart"></i>';
    document.body.appendChild(botonFlotante);

    // Actualizar el botón flotante al inicio
    actualizarBotonFlotante();

    botonFlotante.addEventListener('click', mostrarCarritoSalidas);

    // Agregar eventos a los items
    const items = document.querySelectorAll('.registro-item');
    items.forEach(item => {
        item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
    });

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
    botonesCantidad.forEach((boton, index) => {
        boton.addEventListener('click', () => {
            // Remover clase 'activado' de todos los botones de cantidad
            botonesCantidad.forEach(b => b.classList.remove('activado'));
            // Agregar clase 'activado' al botón clickeado
            boton.classList.add('activado');

            const registros = Array.from(document.querySelectorAll('.registro-item'));

            switch (index) {
                case 0: // Mayor a menor cantidad
                    registros.sort((a, b) => {
                        const stockA = parseInt(a.querySelector('.stock').textContent);
                        const stockB = parseInt(b.querySelector('.stock').textContent);
                        return stockB - stockA;
                    });
                    break;
                case 1: // Menor a mayor cantidad
                    registros.sort((a, b) => {
                        const stockA = parseInt(a.querySelector('.stock').textContent);
                        const stockB = parseInt(b.querySelector('.stock').textContent);
                        return stockA - stockB;
                    });
                    break;
                case 2: // A-Z
                    registros.sort((a, b) => {
                        const nombreA = a.querySelector('.producto-header').textContent.toLowerCase();
                        const nombreB = b.querySelector('.producto-header').textContent.toLowerCase();
                        return nombreA.localeCompare(nombreB);
                    });
                    break;
                case 3: // Z-A
                    registros.sort((a, b) => {
                        const nombreA = a.querySelector('.producto-header').textContent.toLowerCase();
                        const nombreB = b.querySelector('.producto-header').textContent.toLowerCase();
                        return nombreB.localeCompare(nombreA);
                    });
                    break;
            }

            // Reordenar los elementos en el DOM
            const contenedor = document.querySelector('.relleno.almacen-general');
            registros.forEach(registro => {
                contenedor.appendChild(registro);
            });
        });
    });


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


    function agregarAlCarrito(productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;

        if (carritoSalidas.has(productoId)) {
            mostrarNotificacion({
                message: 'Producto ya agregado al carrito',
                type: 'warning',
                duration: 2000
            });
            return;
        }

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

        carritoSalidas.set(productoId, {
            ...producto,
            cantidad: 1,
            subtotal: parseFloat(producto.precios.split(';')[0].split(',')[1])
        });

        actualizarCarritoLocal();
        actualizarBotonFlotante();
        mostrarNotificacion({
            message: 'Producto agregado al carrito',
            type: 'info',
            duration: 2000
        });
    }
    function actualizarBotonFlotante() {
        const botonFlotante = document.querySelector('.btn-flotante-salidas');
        if (!botonFlotante) return;

        botonFlotante.style.display = carritoSalidas.size > 0 ? 'flex' : 'none';
        botonFlotante.innerHTML = `
            <i class="bx bx-cart"></i>
            <span class="cantidad">${carritoSalidas.size}</span>
        `;
    }
    function mostrarCarritoSalidas() {
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (!anuncioSecond) return;

        const subtotal = Array.from(carritoSalidas.values()).reduce((sum, item) => sum + (item.cantidad * item.subtotal), 0);
        let descuento = 0;
        let aumento = 0;

        anuncioSecond.innerHTML = `
            <div class="encabezado">
                <h1 class="titulo">Carrito de Salidas</h1>
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
                                    <input type="number" value="${item.cantidad}" min="1" max="${item.stock}"
                                        onfocus="this.select()"
                                        onchange="actualizarCantidad('${item.id}', this.value)">
                                    <button class="btn-cantidad"style="color:var(--success)" onclick="ajustarCantidad('${item.id}', 1)">+</button>
                                </div>
                            </div>
                            <div class="subtotal-delete">
                                <div class="info-valores">
                                    <p class="stock-disponible">${item.stock - item.cantidad} Und.</p>
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
                            <p class="detalle">Selecciona un cliente</p>
                            <select class="select-cliente" required>
                                <option value=""></option>
                                ${clientes.map(cliente => `
                                    <option value="${cliente.id}">${cliente.nombre}</option>
                                `).join('')}
                            </select>
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
                <button class="btn-procesar-salida btn orange"><i class='bx bx-export'></i> Procesar Salida</button>
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
            carritoSalidas.clear();
            actualizarCarritoLocal(); // Guardar en localStorage
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
        if (nuevaCantidad > 0 && nuevaCantidad <= item.stock) {
            item.cantidad = nuevaCantidad;
            actualizarCarritoLocal(); // Guardar en localStorage
            actualizarCarritoUI();
        }
    };
    window.actualizarCantidad = (id, valor) => {
        const item = carritoSalidas.get(id);
        if (!item) return;

        const cantidad = parseInt(valor);
        if (cantidad > 0 && cantidad <= item.stock) {
            item.cantidad = cantidad;
            actualizarCarritoLocal(); // Agregamos esta línea
            actualizarCarritoUI();
        }
    };
    window.eliminarDelCarrito = (id) => {
        const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
        if (itemToRemove) {
            itemToRemove.style.height = `${itemToRemove.offsetHeight}px`; // Fijar altura inicial
            itemToRemove.classList.add('eliminar-item');

            setTimeout(() => {
                itemToRemove.style.height = '0';
                itemToRemove.style.margin = '0';
                itemToRemove.style.padding = '0';

                setTimeout(() => {
                    carritoSalidas.delete(id);
                    actualizarCarritoLocal();
                    actualizarBotonFlotante();
                    itemToRemove.remove();

                    if (carritoSalidas.size === 0) {
                        ocultarAnuncioSecond();
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
    function actualizarCarritoUI() {
        if (carritoSalidas.size === 0) {
            ocultarAnuncioSecond();
            return;
        }

        // En lugar de recargar todo el carrito, actualizamos solo los valores necesarios
        const items = document.querySelectorAll('.carrito-item');
        items.forEach(item => {
            const id = item.dataset.id;
            const producto = carritoSalidas.get(id);
            if (producto) {
                const cantidadInput = item.querySelector('input[type="number"]');
                const stockDisponible = item.querySelector('.stock-disponible');
                const subtotalElement = item.querySelector('.subtotal');

                cantidadInput.value = producto.cantidad;
                stockDisponible.textContent = `${producto.stock - producto.cantidad} Und.`;
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
    selectPrecios.addEventListener('change', () => {
        const ciudadSeleccionada = selectPrecios.options[selectPrecios.selectedIndex].text;

        // Actualizar precios en el carrito
        carritoSalidas.forEach((item, id) => {
            const preciosProducto = item.precios.split(';');
            const precioSeleccionado = preciosProducto.find(p => p.split(',')[0] === ciudadSeleccionada);
            item.subtotal = precioSeleccionado ? parseFloat(precioSeleccionado.split(',')[1]) : 0;
        });

        actualizarCarritoUI();
    });
    function actualizarCarritoLocal() {
        localStorage.setItem('damabrava_carrito', JSON.stringify(Array.from(carritoSalidas.entries())));
    }



    return { aplicarFiltros };
}
