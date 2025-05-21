let clientes = [];
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
    } finally {
        ocultarCarga();
    }
}



function renderInitialHTML() {

    const contenido = document.querySelector('.anuncio .contenido');
    const initialHTML = `  
        <div class="encabezado">
            <h1 class="titulo">Almacén General</h1>
            <button class="btn close" onclick="cerrarAnuncioManual('anuncio')"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno almacen-general">
            <div class="entrada">
                <i class='bx bx-search'></i>
                <div class="input">
                    <p class="detalle">Buscar</p>
                    <input type="text" class="buscar-cliente" placeholder="">
                </div>
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
                <i class='bx bx-id-card' style="font-size: 50px;opacity:0.5"></i>
                <p style="text-align: center; color: #555;">¡Ups!, No se encontraron clientes segun tu busqueda o filtrado.</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="btn-crear-cliente btn orange"> <i class='bx bx-plus'></i> Crear nuevo cliente</button>
        </div>
    `;
    contenido.innerHTML = initialHTML;
}
export async function mostrarClientes() {
    mostrarAnuncio();
    renderInitialHTML();
    setTimeout(() => {
        configuracionesEntrada();
    }, 100)

    const [clientes] = await Promise.all([
        obtenerClientes()
    ]);

    updateHTMLWithData();
    eventosClientes();
    ;
}
function updateHTMLWithData() {

    const productosContainer = document.querySelector('.productos-container');
    const productosHTML = clientes.map(cliente => `
        <div class="registro-item" data-id="${cliente.id}">
            <div class="header">
                <i class='bx bx-id-card'></i>
                <div class="info-header">
                    <span class="id">${cliente.id}<span class="valor">${cliente.direccion}</span></span>
                    <span class="nombre"><strong>${cliente.nombre}</strong></span>
                    <span class="fecha">${cliente.telefono}-${cliente.zona}</span>
                </div>
            </div>
        </div>
    `).join('');
    productosContainer.innerHTML = productosHTML;
}


function eventosClientes() {
    const inputBusqueda = document.querySelector('.buscar-cliente');
    const btnNuevoCliente = document.querySelector('.btn-crear-cliente');
    const items = document.querySelectorAll('.registro-item');

    items.forEach(item => {
        item.addEventListener('click', function () {
            const clienteId = this.dataset.id;
            window.info(clienteId);
        });
    });


    inputBusqueda.addEventListener('input', (e) => {
        aplicarFiltros();
    });
    inputBusqueda.addEventListener('focus', function() {
        this.select();
    });
    function aplicarFiltros() {
        const busqueda = normalizarTexto(inputBusqueda.value);
        const items = document.querySelectorAll('.registro-item');
        const mensajeNoEncontrado = document.querySelector('.no-encontrado');

        // Animación de ocultar todos
        items.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(-20px)';
            item.style.transition = 'all 0.3s ease';
        });

        setTimeout(() => {
            let hayResultados = false;

            items.forEach(item => {
                const cliente = clientes.find(c => c.id === item.dataset.id);
                const coincide = cliente && (
                    normalizarTexto(cliente.nombre).includes(busqueda) ||
                    normalizarTexto(cliente.telefono).includes(busqueda) ||
                    normalizarTexto(cliente.direccion).includes(busqueda) ||
                    normalizarTexto(cliente.zona).includes(busqueda)
                );

                item.style.display = coincide ? 'flex' : 'none';
                if (coincide) hayResultados = true;
            });

            // Animación escalonada para los resultados
            document.querySelectorAll('.registro-item[style*="display: flex"]').forEach((item, index) => {
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'translateY(0)';
                }, index * 50);
            });

            // Control del mensaje "no encontrado"
            mensajeNoEncontrado.style.display = hayResultados ? 'none' : 'block';
        }, 300);
    }
    function normalizarTexto(texto) {
        return (texto || '').toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-_\s]+/g, '');
    }

    
    window.info = function (clienteId) {
        const cliente = clientes.find(r => r.id === clienteId);
        if (!cliente) return;

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">${cliente.nombre}</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncio');"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal"><i class='bx bx-chevron-right'></i>Información del cliente</p>
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${cliente.id}</span>
                    <span class="nombre"><strong><i class='bx bx-user'></i> Nombre: </strong>${cliente.nombre}</span>
                    <span class="nombre"><strong><i class='bx bx-phone'></i> Teléfono: </strong>${cliente.telefono || 'No registrado'}</span>
                    <span class="nombre"><strong><i class='bx bx-map'></i> Dirección: </strong>${cliente.direccion || 'No registrada'}</span>
                    <span class="nombre"><strong><i class='bx bx-map-pin'></i> Zona: </strong>${cliente.zona || 'No registrada'}</span>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-editar btn blue" data-id="${cliente.id}"><i class='bx bx-edit'></i></button>
                <button class="btn-eliminar btn red" data-id="${cliente.id}"><i class="bx bx-trash"></i></button>
                <button class="btn-historial btn yellow" data-id="${cliente.id}"><i class="bx bx-history"></i></button>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnEditar = contenido.querySelector('.btn-editar');
        const btnEliminar = contenido.querySelector('.btn-eliminar');
        const btnHistorial = contenido.querySelector('.btn-historial');

        btnEditar.addEventListener('click', () => editar(cliente));
        btnEliminar.addEventListener('click', () => eliminar(cliente));
        btnHistorial.addEventListener('click', () => verHistorial(cliente));

        async function eliminar(cliente) {
    
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
                <div class="encabezado">
                    <h1 class="titulo">Eliminar cliente</h1>
                    <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
                </div>
                <div class="relleno">
                    <p class="normal"><i class='bx bx-chevron-right'></i> Información del cliente</p>
                    <div class="campo-vertical">
                        <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${cliente.id}</span>
                        <span class="nombre"><strong><i class='bx bx-user'></i> Nombre: </strong>${cliente.nombre}</span>
                        <span class="nombre"><strong><i class='bx bx-phone'></i> Teléfono: </strong>${cliente.telefono || 'No registrado'}</span>
                        <span class="nombre"><strong><i class='bx bx-map'></i> Dirección: </strong>${cliente.direccion || 'No registrada'}</span>
                        <span class="nombre"><strong><i class='bx bx-map-pin'></i> Zona: </strong>${cliente.zona || 'No registrada'}</span>
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
                    <button class="btn-eliminar-cliente-confirmar btn red"><i class="bx bx-trash"></i> Eliminar</button>
                </div>
            `;
            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();
    
            const btnEliminarCliente = contenido.querySelector('.btn-eliminar-cliente-confirmar');
            btnEliminarCliente.addEventListener('click', async () => {
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
                    const response = await fetch(`/eliminar-cliente/${clienteId}`, {
                        method: 'DELETE'
                    });
    
                    if (response.ok) {
                        
                        mostrarNotificacion({
                            message: 'Cliente eliminado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        ocultarCarga();
                        ocultarAnuncioSecond();
                        await mostrarClientes();
                    } else {
                        throw new Error('Error al eliminar el cliente');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al eliminar el cliente',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function editar(cliente) {
    
            const contenido = document.querySelector('.anuncio-tercer .contenido');
            const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Editar cliente</h1>
                <button class="btn close" onclick="cerrarAnuncioManual('anuncioTercer');"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información del cliente</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Nombre</p>
                        <input class="editar-nombre" type="text" value="${cliente.nombre}" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-phone'></i>
                    <div class="input">
                        <p class="detalle">Teléfono</p>
                        <input class="editar-telefono" type="text" value="${cliente.telefono || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map'></i>
                    <div class="input">
                        <p class="detalle">Dirección</p>
                        <input class="editar-direccion" type="text" value="${cliente.direccion || ''}">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map-pin'></i>
                    <div class="input">
                        <p class="detalle">Zona</p>
                        <input class="editar-zona" type="text" value="${cliente.zona || ''}">
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
                <button class="btn-guardar-cliente btn orange"><i class="bx bx-save"></i> Guardar cambios</button>
            </div>
        `;
            contenido.innerHTML = registrationHTML;
            mostrarAnuncioTercer();
    
            const btnGuardarCliente = contenido.querySelector('.btn-guardar-cliente');
            btnGuardarCliente.addEventListener('click', async () => {
                const nombre = document.querySelector('.editar-nombre').value.trim();
                const telefono = document.querySelector('.editar-telefono').value.trim();
                const direccion = document.querySelector('.editar-direccion').value.trim();
                const zona = document.querySelector('.editar-zona').value.trim();
                const motivo = document.querySelector('.motivo').value.trim();
    
                if (!nombre) {
                    mostrarNotificacion({
                        message: 'El nombre es obligatorio',
                        type: 'warning',
                        duration: 3500
                    });
                    return;
                }
    
                try {
                    mostrarCarga();
                    const response = await fetch(`/editar-cliente/${clienteId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nombre, telefono, direccion, zona, motivo })
                    });
    
                    if (response.ok) {
                        mostrarNotificacion({
                            message: 'Cliente actualizado correctamente',
                            type: 'success',
                            duration: 3000
                        });
                        ocultarCarga();
                        ocultarAnuncioSecond();
                        await mostrarClientes();
                    } else {
                        throw new Error('Error al actualizar el cliente');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion({
                        message: error.message || 'Error al actualizar el cliente',
                        type: 'error',
                        duration: 3500
                    });
                } finally {
                    ocultarCarga();
                }
            });
        }
        async function verHistorial(cliente) {
            ocultarAnuncioSecond();
            mostrarMovimientosAlmacen(cliente.nombre);
        }
    }
    btnNuevoCliente.addEventListener('click', crearCliente);
    async function crearCliente() {
        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Crear nuevo cliente</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información del cliente</p>
                <div class="entrada">
                    <i class='bx bx-user'></i>
                    <div class="input">
                        <p class="detalle">Nombre</p>
                        <input class="nuevo-nombre" type="text" required>
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-phone'></i>
                    <div class="input">
                        <p class="detalle">Teléfono</p>
                        <input class="nuevo-telefono" type="text">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map'></i>
                    <div class="input">
                        <p class="detalle">Dirección</p>
                        <input class="nuevo-direccion" type="text">
                    </div>
                </div>
                <div class="entrada">
                    <i class='bx bx-map-pin'></i>
                    <div class="input">
                        <p class="detalle">Zona</p>
                        <input class="nuevo-zona" type="text">
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="btn-guardar-nuevo-cliente btn orange"><i class="bx bx-save"></i> Guardar cliente</button>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnGuardarNuevoCliente = contenido.querySelector('.btn-guardar-nuevo-cliente');
        btnGuardarNuevoCliente.addEventListener('click', async () => {
            const nombre = document.querySelector('.nuevo-nombre').value.trim();
            const telefono = document.querySelector('.nuevo-telefono').value.trim();
            const direccion = document.querySelector('.nuevo-direccion').value.trim();
            const zona = document.querySelector('.nuevo-zona').value.trim();

            if (!nombre) {
                mostrarNotificacion({
                    message: 'El nombre es obligatorio',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/agregar-cliente', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, telefono, direccion, zona })
                });

                if (response.ok) {
                    mostrarNotificacion({
                        message: 'Cliente creado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                    ocultarCarga();
                    ocultarAnuncioSecond();
                    await mostrarClientes();
                } else {
                    throw new Error('Error al crear el cliente');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al crear el cliente',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        });
    }

    aplicarFiltros();
}
