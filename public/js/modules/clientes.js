let clientes = [];
async function obtenerClientes() {
    try {
        mostrarCarga();
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



export async function mostrarClientes() {
    await obtenerClientes();

    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Clientes</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="buscador">
                <input type="text" class="buscar-cliente" placeholder="Buscar...">
                <i class='bx bx-search'></i>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Lista de clientes</p>
                ${clientes.map(cliente => `
                <div class="registro-item" data-id="${cliente.id}">
                    <div class="header">
                        <span class="nombre">${cliente.id}<span class="valor">${cliente.direccion}</span></span>
                        <span class="valor" color var><strong>${cliente.nombre}</strong></span>
                        <span class="fecha">${cliente.telefono}-${cliente.zona}</span>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info-cliente btn-icon gray" data-id="${cliente.id}"><i class='bx bx-info-circle'></i></button>
                        <button class="btn-editar-cliente btn-icon blue" data-id="${cliente.id}"><i class='bx bx-edit'></i></button>
                        <button class="btn-eliminar-cliente btn-icon red" data-id="${cliente.id}"><i class="bi bi-trash-fill"></i></button>
                        <button class="btn-eliminar-cliente btn-icon green" data-id="${cliente.id}"><i class='bx bx-history'></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="anuncio-botones">
            <button class="btn-crear-cliente btn orange"> <i class='bx bx-plus'></i> Crear nuevo cliente</button>
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    eventosClientes();
}
function eventosClientes() {
    const botonesEliminar = document.querySelectorAll('.btn-eliminar-cliente');
    const botonesEditar = document.querySelectorAll('.btn-editar-cliente');
    const botonesInfo = document.querySelectorAll('.btn-info-cliente');
    const inputBusqueda = document.querySelector('.buscar-cliente');
    const iconoBusqueda = document.querySelector('.buscador i');
    const btnNuevoCliente = document.querySelector('.btn-crear-cliente');

    btnNuevoCliente.addEventListener('click', crearCliente);

    const items = document.querySelectorAll('.registro-item');

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

    inputBusqueda.addEventListener('input', (e) => {
        const busqueda = normalizarTexto(e.target.value);
        iconoBusqueda.className = busqueda ? 'bx bx-x' : 'bx bx-search-alt-2';

        const filas = document.querySelectorAll('.registro-item'); // Cambiado de '.fila' a '.registro-item'
        filas.forEach(fila => {
            const cliente = clientes.find(c => c.id === fila.dataset.id);
            const textoNombre = normalizarTexto(cliente.nombre);
            const textoTelefono = normalizarTexto(cliente.telefono);
            const textoDireccion = normalizarTexto(cliente.direccion);
            const textoZona = normalizarTexto(cliente.zona);

            if (!busqueda ||
                textoNombre.includes(busqueda) ||
                textoTelefono.includes(busqueda) ||
                textoDireccion.includes(busqueda) ||
                textoZona.includes(busqueda)) {
                fila.style.display = '';
            } else {
                fila.style.display = 'none';
            }
        });
    });

    iconoBusqueda.addEventListener('click', () => {
        if (inputBusqueda.value) {
            inputBusqueda.value = '';
            iconoBusqueda.className = 'bx bx-search-alt-2';
            document.querySelectorAll('.fila').forEach(fila => {
                fila.style.display = '';
            });
        }
    });

    function normalizarTexto(texto) {
        return (texto || '').toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-_\s]+/g, '');
    }

    botonesInfo.forEach(btn => {
        btn.addEventListener('click', info);
    });

    botonesEliminar.forEach(btn => {
        btn.addEventListener('click', eliminar);
    });

    botonesEditar.forEach(btn => {
        btn.addEventListener('click', editar);
    });

    async function info(event) {
        const clienteId = event.currentTarget.dataset.id;
        const cliente = clientes.find(c => c.id === clienteId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Info cliente</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información del cliente</p>
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${cliente.id}</span>
                    <span class="nombre"><strong><i class='bx bx-user'></i> Nombre: </strong>${cliente.nombre}</span>
                    <span class="nombre"><strong><i class='bx bx-phone'></i> Teléfono: </strong>${cliente.telefono || 'No registrado'}</span>
                    <span class="nombre"><strong><i class='bx bx-map'></i> Dirección: </strong>${cliente.direccion || 'No registrada'}</span>
                    <span class="nombre"><strong><i class='bx bx-map-pin'></i> Zona: </strong>${cliente.zona || 'No registrada'}</span>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();
    }

    async function eliminar(event) {
        const clienteId = event.currentTarget.dataset.id;
        const cliente = clientes.find(c => c.id === clienteId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar cliente</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
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
        mostrarAnuncioSecond();

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
                    await mostrarClientes();
                    ocultarAnuncioSecond();
                    mostrarNotificacion({
                        message: 'Cliente eliminado correctamente',
                        type: 'success',
                        duration: 3000
                    });
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

    async function editar(event) {
        const clienteId = event.currentTarget.dataset.id;
        const cliente = clientes.find(c => c.id === clienteId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Editar cliente</h1>
            <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
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
        mostrarAnuncioSecond();

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
                    await mostrarClientes();
                    ocultarAnuncioSecond();
                    mostrarNotificacion({
                        message: 'Cliente actualizado correctamente',
                        type: 'success',
                        duration: 3000
                    });
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
                    await mostrarClientes();
                    ocultarAnuncioSecond();
                    mostrarNotificacion({
                        message: 'Cliente creado correctamente',
                        type: 'success',
                        duration: 3000
                    });
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
}
