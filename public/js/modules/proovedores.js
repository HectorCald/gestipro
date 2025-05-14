let proovedores = [];
async function obtenerProovedores() {
    try {
        mostrarCarga();
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
        ocultarCarga();
    }
}



export async function mostrarProovedores() {
    await obtenerProovedores();

    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Proovedores</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="buscador">
                <input type="text" class="buscar-proovedor" placeholder="Buscar...">
                <i class='bx bx-search'></i>
            </div>
            <p class="normal"><i class='bx bx-chevron-right'></i>Lista de proovedores</p>
                ${proovedores.map(proovedor => `
                <div class="registro-item" data-id="${proovedor.id}">
                    <div class="header">
                        <span class="nombre">${proovedor.id}<span class="valor">${proovedor.direccion}</span></span>
                        <span class="valor"><strong>${proovedor.nombre}</strong></span>
                        <span class="fecha">${proovedor.telefono}-${proovedor.zona}</span>
                    </div>
                    <div class="registro-acciones">
                        <button class="btn-info-proovedor btn-icon gray" data-id="${proovedor.id}"><i class='bx bx-info-circle'></i>Info</button>
                        <button class="btn-editar-proovedor btn-icon blue" data-id="${proovedor.id}"><i class='bx bx-edit'></i> Editar</button>
                        <button class="btn-eliminar-proovedor btn-icon red" data-id="${proovedor.id}"><i class="bx bx-trash"></i> Eliminar</button>
                        <button class="btn-historial-proovedor btn-icon orange" data-id="${proovedor.id}"><i class='bx bx-history'></i>Historial</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="anuncio-botones">
            <button class="btn-crear-proovedor btn orange"> <i class='bx bx-plus'></i> Crear nuevo proovedor</button>
        </div>
    `;
    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    eventosProovedores();
}
function eventosProovedores() {
    const botonesEliminar = document.querySelectorAll('.btn-eliminar-proovedor');
    const botonesEditar = document.querySelectorAll('.btn-editar-proovedor');
    const botonesInfo = document.querySelectorAll('.btn-info-proovedor');
    const inputBusqueda = document.querySelector('.buscar-proovedor');
    const iconoBusqueda = document.querySelector('.buscador i');
    const btnNuevoCliente = document.querySelector('.btn-crear-proovedor');

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
            const proovedor = proovedores.find(c => c.id === fila.dataset.id);
            const textoNombre = normalizarTexto(proovedor.nombre);
            const textoTelefono = normalizarTexto(proovedor.telefono);
            const textoDireccion = normalizarTexto(proovedor.direccion);
            const textoZona = normalizarTexto(proovedor.zona);

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
        const proovedorId = event.currentTarget.dataset.id;
        const proovedor = proovedores.find(p => p.id === proovedorId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Info proovedor</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno verificar-registro">
                <p class="normal"><i class='bx bx-chevron-right'></i>Información del proovedor</p>
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${proovedor.id}</span>
                    <span class="nombre"><strong><i class='bx bx-user'></i> Nombre: </strong>${proovedor.nombre}</span>
                    <span class="nombre"><strong><i class='bx bx-phone'></i> Teléfono: </strong>${proovedor.telefono || 'No registrado'}</span>
                    <span class="nombre"><strong><i class='bx bx-map'></i> Dirección: </strong>${proovedor.direccion || 'No registrada'}</span>
                    <span class="nombre"><strong><i class='bx bx-map-pin'></i> Zona: </strong>${proovedor.zona || 'No registrada'}</span>
                </div>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();
    }

    async function eliminar(event) {
        const proovedorId = event.currentTarget.dataset.id;
        const proovedor = proovedores.find(p => p.id === proovedorId);

        const contenido = document.querySelector('.anuncio-second .contenido');
        const registrationHTML = `
            <div class="encabezado">
                <h1 class="titulo">Eliminar cliente</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información del proovedor</p>
                <div class="campo-vertical">
                    <span class="nombre"><strong><i class='bx bx-id-card'></i> Id: </strong>${proovedor.id}</span>
                    <span class="nombre"><strong><i class='bx bx-user'></i> Nombre: </strong>${proovedor.nombre}</span>
                    <span class="nombre"><strong><i class='bx bx-phone'></i> Teléfono: </strong>${proovedor.telefono || 'No registrado'}</span>
                    <span class="nombre"><strong><i class='bx bx-map'></i> Dirección: </strong>${proovedor.direccion || 'No registrada'}</span>
                    <span class="nombre"><strong><i class='bx bx-map-pin'></i> Zona: </strong>${proovedor.zona || 'No registrada'}</span>
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
                <button class="btn-eliminar-proovedor-confirmar btn red"><i class="bx bx-trash"></i> Eliminar</button>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnEliminarProovedor = contenido.querySelector('.btn-eliminar-proovedor-confirmar');
        btnEliminarProovedor.addEventListener('click', async () => {
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
                const response = await fetch(`/eliminar-proovedor/${proovedorId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await mostrarProovedores();
                    ocultarAnuncioSecond();
                    mostrarNotificacion({
                        message: 'Proovedor eliminado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error('Error al eliminar el proovedor');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al eliminar el proovedor',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        });
    }

    async function editar(event) {
        const proovedorId = event.currentTarget.dataset.id;
        const proovedor = proovedores.find(p => p.id === proovedorId);

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
                    <input class="editar-nombre" type="text" value="${proovedor.nombre}" required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-phone'></i>
                <div class="input">
                    <p class="detalle">Teléfono</p>
                    <input class="editar-telefono" type="text" value="${proovedor.telefono || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-map'></i>
                <div class="input">
                    <p class="detalle">Dirección</p>
                    <input class="editar-direccion" type="text" value="${proovedor.direccion || ''}">
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-map-pin'></i>
                <div class="input">
                    <p class="detalle">Zona</p>
                    <input class="editar-zona" type="text" value="${proovedor.zona || ''}">
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
            <button class="btn-guardar-proovedor btn orange"><i class="bx bx-save"></i> Guardar cambios</button>
        </div>
    `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnGuardarProveedor = contenido.querySelector('.btn-guardar-proovedor');
        btnGuardarProveedor.addEventListener('click', async () => {
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
                const response = await fetch(`/editar-proovedor/${proovedorId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, telefono, direccion, zona, motivo })
                });

                if (response.ok) {
                    await mostrarProovedores();
                    ocultarAnuncioSecond();
                    mostrarNotificacion({
                        message: 'Proovedor actualizado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error('Error al actualizar el proovedor');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al actualizar el proovedor',
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
                <h1 class="titulo">Crear nuevo proovedor</h1>
                <button class="btn close" onclick="ocultarAnuncioSecond();"><i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="normal"><i class='bx bx-chevron-right'></i> Información del proovedor</p>
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
                <button class="btn-guardar-nuevo-proovedor btn orange"><i class="bx bx-save"></i> Guardar cliente</button>
            </div>
        `;
        contenido.innerHTML = registrationHTML;
        mostrarAnuncioSecond();

        const btnGuardarNuevoProovedor = contenido.querySelector('.btn-guardar-nuevo-proovedor');
        btnGuardarNuevoProovedor.addEventListener('click', async () => {
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
                const response = await fetch('/agregar-proovedor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ nombre, telefono, direccion, zona })
                });

                if (response.ok) {
                    await mostrarProovedores();
                    ocultarAnuncioSecond();
                    mostrarNotificacion({
                        message: 'Proovedor creado correctamente',
                        type: 'success',
                        duration: 3000
                    });
                } else {
                    throw new Error('Error al crear el proovedor');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: error.message || 'Error al crear el proovedor',
                    type: 'error',
                    duration: 3500
                });
            } finally {
                ocultarCarga();
            }
        });
    }
}
