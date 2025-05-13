let productos = [];
let etiquetasAcopio = [];
let usuarioInfo = recuperarUsuarioLocal();
let carritoPedidos = new Map(JSON.parse(localStorage.getItem('damabrava_carrito_pedidos') || '[]'));

function recuperarUsuarioLocal() {
    const usuarioGuardado = localStorage.getItem('damabrava_usuario');
    if (usuarioGuardado) {
        return JSON.parse(usuarioGuardado);
    }
    return null;
}

async function obtenerEtiquetasAcopio() {
    try {
        const response = await fetch('/obtener-etiquetas-acopio');
        const data = await response.json();

        if (data.success) {
            etiquetasAcopio = data.etiquetas.sort((a, b) => {
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

async function obtenerAlmacenAcopio() {
    try {
        mostrarCarga();
        await obtenerEtiquetasAcopio();
        const response = await fetch('/obtener-productos-acopio');
        const data = await response.json();

        if (data.success) {
            productos = data.productos.map(producto => {
                return {
                    id: producto.id,
                    producto: producto.producto,
                    bruto: producto.bruto || '0-1',
                    prima: producto.prima || '0-1',
                    etiquetas: producto.etiquetas || ''
                };
            }).sort((a, b) => {
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

export async function mostrarHacerPedido(busquedaProducto = '') {
    await obtenerAlmacenAcopio();

    const contenido = document.querySelector('.anuncio .contenido');
    const etiquetasUnicas = [...new Set(productos.map(p => p.etiquetas.split(';'))
        .flat()
        .filter(etiqueta => etiqueta.trim() !== '')
    )];
    const registrationHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Realizar Pedido</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno almacen-acopio">
            <div class="buscador">
                <input type="text" class="buscar-producto-acopio" placeholder="Buscar..." value="${busquedaProducto}">
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
                <button class="btn-filtro" title="Mayor a menor"><i class='bx bx-sort-down'></i></button>
                <button class="btn-filtro" title="Menor a mayor"><i class='bx bx-sort-up'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-a-z'></i></button>
                <button class="btn-filtro"><i class='bx bx-sort-z-a'></i></button>
                <button class="btn-filtro" title="Bruto">Bruto</button>
                <button class="btn-filtro" title="Prima">Prima</button>
            </div>

            <p class="normal"><i class='bx bx-chevron-right'></i>Productos</p>
            ${productos.map(producto => {
        // Calcular totales de bruto y prima
        const totalBruto = producto.bruto.split(';')
            .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);
        const totalPrima = producto.prima.split(';')
            .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

        return `
                    <div class="registro-item" data-id="${producto.id}">
                        <div class="header">
                            <div class="nombre">
                                <span class="id-producto">${producto.id}</span>
                                <div class="precio-cantidad">
                                    <span class="valor stock">${totalBruto.toFixed(2)} Kg.</span>
                                    <span class="carrito-cantidad"></span>
                                </div>
                            </div>
                            <span class="valor producto-header"><strong>${producto.producto}</strong></span>
                            <span class="fecha">${producto.etiquetas.split(';').join(' • ')}</span>
                        </div>
                        <div class="registro-acciones">
                            <button class="btn-pedido btn-icon green" data-id="${producto.id}">
                                <i class='bx bx-cart-add'></i>
                            </button>
                        </div>
                    </div>`;
    }).join('')}
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();

    carritoPedidos.forEach((item, id) => {
        const headerCounter = document.querySelector(`.registro-item[data-id="${id}"] .carrito-cantidad`);
        if (headerCounter) {
            headerCounter.textContent = item.cantidad;
        }
    });

    const { aplicarFiltros } = eventosPedidos();
    aplicarFiltros('Todos');

    contenido.style.paddingBottom = '10px';

    if (busquedaProducto) {
        const inputBusqueda = document.querySelector('.buscar-producto-acopio');
        const iconoBusqueda = document.querySelector('.buscador .buscador i');
        inputBusqueda.dispatchEvent(new Event('input'));
        iconoBusqueda.className = 'bx bx-x';
    }
}

function eventosPedidos() {
    const botonesEtiquetas = document.querySelectorAll('.filtros-opciones.etiquetas-filter .btn-filtro');
    const botonesCantidad = document.querySelectorAll('.filtros-opciones.cantidad-filter .btn-filtro');
    const inputBusqueda = document.querySelector('.buscar-producto-acopio');
    const iconoBusqueda = document.querySelector('.almacen-acopio .buscador i');
    const botonFlotante = document.createElement('button');

    botonFlotante.className = 'btn-flotante-pedidos';
    botonFlotante.innerHTML = '<i class="bx bx-cart"></i>';
    document.body.appendChild(botonFlotante);

    actualizarBotonFlotante();
    botonFlotante.addEventListener('click', mostrarCarritoPedidos);

    const items = document.querySelectorAll('.registro-item');
    items.forEach(item => {
        item.addEventListener('click', () => agregarAlCarrito(item.dataset.id));
    });

    inputBusqueda.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value);
        iconoBusqueda.className = busqueda ? 'bx bx-x' : 'bx bx-search';

        if (busqueda) {
            iconoBusqueda.className = 'bx bx-x';
            botonesEtiquetas.forEach(btn => btn.classList.remove('activado'));
        } else {
            iconoBusqueda.className = 'bx bx-search';
            document.querySelector('.btn-filtro').classList.add('activado');
        }

        const registros = document.querySelectorAll('.registro-item');
        registros.forEach(registro => {
            const producto = productos.find(p => p.id === registro.dataset.id);
            const textoProducto = normalizarTexto(producto.producto);
            const etiquetas = normalizarTexto(producto.etiquetas);
            const idProducto = normalizarTexto(producto.id);

            if (!busqueda ||
                textoProducto.includes(busqueda) ||
                idProducto.includes(busqueda) ||
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
            document.querySelectorAll('.registro-item').forEach(registro => {
                registro.style.display = '';
            });
            document.querySelector('.btn-filtro').classList.add('activado');
        }
    });

    function normalizarTexto(texto) {
        return texto.toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-_\s]+/g, '');
    }
    let pesoMostrado = 'bruto';
    botonesCantidad.forEach((boton, index) => {
        boton.addEventListener('click', () => {
            botonesCantidad.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');

            const registros = Array.from(document.querySelectorAll('.registro-item'));

            // Handle weight display switches
            if (index === 4) { // Bruto button
                pesoMostrado = 'bruto';
                registros.forEach(registro => {
                    const producto = productos.find(p => p.id === registro.dataset.id);
                    const totalBruto = producto.bruto.split(';')
                        .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);
                    const stockSpan = registro.querySelector('.valor.stock');
                    stockSpan.textContent = `${totalBruto.toFixed(2)} Kg.`;
                });
                return;
            } else if (index === 5) { // Prima button
                pesoMostrado = 'prima';
                registros.forEach(registro => {
                    const producto = productos.find(p => p.id === registro.dataset.id);
                    const totalPrima = producto.prima.split(';')
                        .reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);
                    const stockSpan = registro.querySelector('.valor.stock');
                    stockSpan.textContent = `${totalPrima.toFixed(2)} Kg.`;
                });
                return;
            }

            // Handle sorting
            switch (index) {
                case 0: // Mayor a menor
                    registros.sort((a, b) => {
                        const productoA = productos.find(p => p.id === a.dataset.id);
                        const productoB = productos.find(p => p.id === b.dataset.id);

                        const totalA = pesoMostrado === 'bruto' ?
                            productoA.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0) :
                            productoA.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

                        const totalB = pesoMostrado === 'bruto' ?
                            productoB.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0) :
                            productoB.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

                        return totalB - totalA;
                    });
                    break;
                case 1: // Menor a mayor
                    registros.sort((a, b) => {
                        const productoA = productos.find(p => p.id === a.dataset.id);
                        const productoB = productos.find(p => p.id === b.dataset.id);

                        const totalA = pesoMostrado === 'bruto' ?
                            productoA.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0) :
                            productoA.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

                        const totalB = pesoMostrado === 'bruto' ?
                            productoB.bruto.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0) :
                            productoB.prima.split(';').reduce((sum, lote) => sum + parseFloat(lote.split('-')[0]), 0);

                        return totalA - totalB;
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

            const contenedor = document.querySelector('.relleno.almacen-acopio');
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
            inputBusqueda.value = '';
            iconoBusqueda.className = 'bx bx-search';

            botonesEtiquetas.forEach(b => b.classList.remove('activado'));
            boton.classList.add('activado');

            filtroNombreActual = boton.textContent.trim();
            aplicarFiltros();
            scrollToCenter(boton, boton.parentElement);
        });
    });





    function agregarAlCarrito(productoId) {
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;

        if (navigator.vibrate) {
            navigator.vibrate(100);
        }

        const item = document.querySelector(`.registro-item[data-id="${productoId}"]`);
        if (item) {
            item.classList.add('agregado-al-carrito');
            setTimeout(() => {
                item.classList.remove('agregado-al-carrito');
            }, 500);
        }

        if (carritoPedidos.has(productoId)) {
            const itemCarrito = carritoPedidos.get(productoId);
            itemCarrito.cantidad += 1;
            if (item) {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = itemCarrito.cantidad;
            }
        } else {
            carritoPedidos.set(productoId, {
                ...producto,
                cantidad: 1
            });
            if (item) {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = '1';
            }
        }
        actualizarCarritoLocal();
        actualizarBotonFlotante();
        actualizarCarritoUI();
    }
    window.eliminarDelCarrito = (id) => {
        const itemToRemove = document.querySelector(`.carrito-item[data-id="${id}"]`);
        const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);

        if (headerItem) {
            const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
            if (cantidadSpan) cantidadSpan.textContent = '';
        }

        if (itemToRemove) {
            itemToRemove.style.height = `${itemToRemove.offsetHeight}px`;
            itemToRemove.classList.add('eliminar-item');

            setTimeout(() => {
                itemToRemove.style.height = '0';
                itemToRemove.style.margin = '0';
                itemToRemove.style.padding = '0';

                setTimeout(() => {
                    carritoPedidos.delete(id);
                    actualizarCarritoLocal();
                    actualizarBotonFlotante();
                    itemToRemove.remove();

                    if (navigator.vibrate) {
                        navigator.vibrate(50);
                    }

                    if (carritoPedidos.size === 0) {
                        ocultarAnuncioSecond();
                        mostrarNotificacion({
                            message: 'Carrito vacío',
                            type: 'info',
                            duration: 2000
                        });
                    }
                }, 300);
            }, 0);
        }
    };
    function actualizarBotonFlotante() {
        const botonFlotante = document.querySelector('.btn-flotante-pedidos');
        if (!botonFlotante) return;

        botonFlotante.style.display = carritoPedidos.size > 0 ? 'flex' : 'none';
        botonFlotante.innerHTML = `
            <i class="bx bx-cart"></i>
            <span class="cantidad">${carritoPedidos.size}</span>
        `;
    }
    function mostrarCarritoPedidos() {
        const anuncioSecond = document.querySelector('.anuncio-second .contenido');
        if (!anuncioSecond) return;

        anuncioSecond.innerHTML = `
            <div class="encabezado">
                <h1 class="titulo">Carrito de Pedidos</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
                <button class="btn filtros limpiar"><i class="fas fa-broom"></i></button>
            </div>
            <div class="relleno">
                <div class="carrito-items">
                    ${Array.from(carritoPedidos.values()).map(item => `
                        <div class="carrito-item" data-id="${item.id}">
                            <div class="item-info">
                                <h3>${item.producto}</h3>
                                <div class="cantidad-control">
                                    <button class="btn-cantidad" style="color:var(--error)" onclick="ajustarCantidad('${item.id}', -1)">-</button>
                                    <input type="number" value="${item.cantidad}" min="1"
                                        onfocus="this.select()"
                                        onchange="actualizarCantidad('${item.id}', this.value)">
                                    <button class="btn-cantidad" style="color:var(--success)" onclick="ajustarCantidad('${item.id}', 1)">+</button>
                                </div>
                            </div>
                            <div class="subtotal-delete">
                                <div class="info-valores">
                                    <select class="unidad">
                                        <option value="Bolsas">Bls.</option>
                                        <option value="Arrobas">@</option>
                                        <option value="Libras">Lbrs.</option>
                                        <option value="Cajas">Cjs.</option>
                                        <option value="Kilos">Kg.</option>
                                        <option value="Quintales">qq.</option>
                                        <option value="Unidades">Und.</option>
                                    </select>
                                    <input type="text" class="detalle" placeholder="Detalle">
                                </div>
                                <button class="btn-eliminar" onclick="eliminarDelCarrito('${item.id}')">
                                    <i class="bx bx-trash"></i>
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-procesar-pedido btn green" onclick="registrarPedido()">
                    <i class='bx bx-check'></i> Procesar Pedido
                </button>
            </div>
        `;

        mostrarAnuncioSecond();

        const botonLimpiar = anuncioSecond.querySelector('.btn.filtros.limpiar');
        botonLimpiar.addEventListener('click', () => {
            carritoPedidos.forEach((item, id) => {
                const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);
                if (headerItem) {
                    const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                    if (cantidadSpan) cantidadSpan.textContent = '';
                }
            });

            carritoPedidos.clear();
            actualizarCarritoLocal();
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
        const item = carritoPedidos.get(id);
        if (!item) return;

        const nuevaCantidad = item.cantidad + delta;
        if (nuevaCantidad > 0) {
            item.cantidad = nuevaCantidad;
            const headerItem = document.querySelector(`.registro-item[data-id="${id}"]`);
            if (headerItem) {
                const cantidadSpan = headerItem.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = nuevaCantidad;
            }
            actualizarCarritoLocal();
            actualizarCarritoUI();
        }
    };
    window.actualizarCantidad = (id, valor) => {
        const item = carritoPedidos.get(id);
        if (!item) return;

        const cantidad = parseInt(valor);
        if (cantidad > 0) {
            item.cantidad = cantidad;
            const headerCounter = document.querySelector(`.registro-item[data-id="${id}"] .carrito-cantidad`);
            if (headerCounter) {
                headerCounter.textContent = cantidad;
            }
            actualizarCarritoLocal();
            actualizarCarritoUI();
        }
    };
    function actualizarCarritoUI() {
        if (carritoPedidos.size === 0) {
            ocultarAnuncioSecond();
            document.querySelector('.btn-flotante-pedidos').style.display = 'none';
            return;
        }

        const items = document.querySelectorAll('.carrito-item');
        items.forEach(item => {
            const id = item.dataset.id;
            const producto = carritoPedidos.get(id);
            if (producto) {
                const cantidadInput = item.querySelector('input[type="number"]');
                cantidadInput.value = producto.cantidad;
            }
        });
    }
    function actualizarCarritoLocal() {
        localStorage.setItem('damabrava_carrito_pedidos', JSON.stringify(Array.from(carritoPedidos.entries())));
    }


    async function registrarPedido() {
        const nombrePedido = document.querySelector('.nombre-pedido');
        if (!nombrePedido.value) {
            mostrarNotificacion({
                message: 'Ingrese un nombre para el pedido',
                type: 'error',
                duration: 3000
            });
            return;
        }

        const registroPedido = {
            fechaHora: new Date().toLocaleString(),
            tipo: 'Pedido',
            productos: Array.from(carritoPedidos.values()).map(item => item.id).join(';'),
            cantidades: Array.from(carritoPedidos.values()).map(item => item.cantidad).join(';'),
            operario: `${usuarioInfo.nombre} ${usuarioInfo.apellido}`,
            nombre_pedido: nombrePedido.value,
            observaciones: document.querySelector('.observaciones').value || 'Ninguna',
            estado: 'Pendiente'
        };

        try {
            mostrarCarga();
            const response = await fetch('/registrar-pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('damabrava_token')}`
                },
                body: JSON.stringify(registroPedido)
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Error en la respuesta del servidor');
            }

            carritoPedidos.clear();
            localStorage.removeItem('damabrava_carrito_pedidos');

            document.querySelectorAll('.registro-item').forEach(item => {
                const cantidadSpan = item.querySelector('.carrito-cantidad');
                if (cantidadSpan) cantidadSpan.textContent = '';
            });

            actualizarCarritoUI();
            ocultarAnuncioSecond();

            mostrarNotificacion({
                message: 'Pedido registrado exitosamente',
                type: 'success',
                duration: 3000
            });

        } catch (error) {
            console.error('Error al registrar pedido:', error);
            mostrarNotificacion({
                message: error.message || 'Error al procesar el pedido',
                type: 'error',
                duration: 4000
            });
        } finally {
            ocultarCarga();
        }
    }
    window.registrarPedido = registrarPedido;

    return { aplicarFiltros };
}