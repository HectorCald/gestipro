// Anuncios
const estadoAnuncios = {
    anuncioVisible: false,
    anuncioSecondVisible: false,
    anuncioTercerVisible: false,
    nivelActual: 0,
    ignorarProximoPopstate: false,
    sincronizandoHistorial: false
};
function obtenerEstadoRealDOM() {
    return {
        normal: document.querySelector('.anuncio')?.style.display === 'flex',
        second: document.querySelector('.anuncio-second')?.style.display === 'flex',
        tercer: document.querySelector('.anuncio-tercer')?.style.display === 'flex'
    };
}
function calcularNivelReal(estadoDOM) {
    if (estadoDOM.tercer) return 3;
    if (estadoDOM.second) return 2;
    if (estadoDOM.normal) return 1;
    return 0;
}
function cerrarAnunciosPorNivel(nivelObjetivo) {
    const estadoDOM = obtenerEstadoRealDOM();
    
    // Cerrar anuncios según el nivel objetivo
    if (estadoDOM.tercer && nivelObjetivo < 3) {
        ocultarAnuncioTercerFisico();
    }
    if (estadoDOM.second && nivelObjetivo < 2) {
        ocultarAnuncioSecondFisico();
    }
    if (estadoDOM.normal && nivelObjetivo < 1) {
        ocultarAnuncioFisico();
    }
    
    // Actualizar estado interno
    actualizarEstadoInterno();
}
function ocultarAnuncioFisico() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = document.querySelector('.anuncio .contenido');
    const btni = document.querySelector('.btn-flotante-salidas');
    const btns = document.querySelector('.btn-flotante-ingresos');
    const btnp = document.querySelector('.btn-flotante-pedidos');

    if (btni) btni.style.display = 'none';
    if (btns) btns.style.display = 'none';
    if (btnp) btnp.style.display = 'none';

    if (anuncio && anuncio.style.display !== 'none') {
        anuncio.style.display = 'none';
        if (contenido) {
            contenido.style.paddingBottom = '80px';
            contenido.innerHTML = '';
        }
    }
}
function ocultarAnuncioSecondFisico() {
    const anuncio = document.querySelector('.anuncio-second');
    const contenido = document.querySelector('.anuncio-second .contenido');

    if (anuncio && anuncio.style.display !== 'none') {
        anuncio.style.display = 'none';
        if (contenido) {
            contenido.style.paddingBottom = '80px';
            contenido.innerHTML = '';
        }
    }
}
function ocultarAnuncioTercerFisico() {
    const anuncio = document.querySelector('.anuncio-tercer');
    const contenido = document.querySelector('.anuncio-tercer .contenido');

    if (anuncio && anuncio.style.display !== 'none') {
        anuncio.style.display = 'none';
        if (contenido) {
            contenido.style.paddingBottom = '80px';
            contenido.innerHTML = '';
        }
    }
}
function actualizarEstadoInterno() {
    const estadoDOM = obtenerEstadoRealDOM();
    
    estadoAnuncios.anuncioVisible = estadoDOM.normal;
    estadoAnuncios.anuncioSecondVisible = estadoDOM.second;
    estadoAnuncios.anuncioTercerVisible = estadoDOM.tercer;
    estadoAnuncios.nivelActual = calcularNivelReal(estadoDOM);
}
function sincronizarHistorial(nivelDestino, forzarReemplazo = false) {
    if (estadoAnuncios.sincronizandoHistorial) return;
    
    estadoAnuncios.sincronizandoHistorial = true;
    
    try {
        const estadoHistorial = history.state?.nivel || 0;
        
        if (estadoHistorial !== nivelDestino || forzarReemplazo) {
            // Si el nivel del historial es mayor, necesitamos ir hacia atrás
            const diferencia = estadoHistorial - nivelDestino;
            
            if (diferencia > 0) {
                estadoAnuncios.ignorarProximoPopstate = true;
                history.go(-diferencia);
            } else if (diferencia < 0) {
                // Si necesitamos ir hacia adelante, mejor reemplazamos
                history.replaceState({ nivel: nivelDestino }, '');
            } else if (forzarReemplazo) {
                history.replaceState({ nivel: nivelDestino }, '');
            }
        }
    } finally {
        // Usar setTimeout para asegurar que se resetee después del popstate
        setTimeout(() => {
            estadoAnuncios.sincronizandoHistorial = false;
        }, 50);
    }
}
window.addEventListener('popstate', (event) => {
    // Si acabamos de ignorar un popstate, salir
    if (estadoAnuncios.ignorarProximoPopstate) {
        estadoAnuncios.ignorarProximoPopstate = false;
        return;
    }
    
    // Si estamos sincronizando, salir
    if (estadoAnuncios.sincronizandoHistorial) {
        return;
    }

    const nivelDestino = event.state?.nivel || 0;
    const estadoDOM = obtenerEstadoRealDOM();
    const nivelActualDOM = calcularNivelReal(estadoDOM);
    
    // Solo proceder si realmente necesitamos cerrar algo
    if (nivelActualDOM > nivelDestino) {
        cerrarAnunciosPorNivel(nivelDestino);
    }
});
export async function mostrarAnuncio() {
    const anuncio = document.querySelector('.anuncio');
    
    if (anuncio && anuncio.style.display !== 'flex') {
        anuncio.style.display = 'flex';
        actualizarEstadoInterno();
        
        // Solo agregar al historial si realmente cambiamos de nivel
        if (estadoAnuncios.nivelActual === 1 && (history.state?.nivel || 0) < 1) {
            history.pushState({ nivel: 1, tipo: 'anuncio' }, '');
        }
    }
}
export async function mostrarAnuncioSecond() {
    const anuncio = document.querySelector('.anuncio-second');
    
    if (anuncio && anuncio.style.display !== 'flex') {
        anuncio.style.display = 'flex';
        actualizarEstadoInterno();
        
        // Solo agregar al historial si realmente cambiamos de nivel
        if (estadoAnuncios.nivelActual === 2 && (history.state?.nivel || 0) < 2) {
            history.pushState({ nivel: 2, tipo: 'anuncioSecond' }, '');
        }
    }
    configuracionesEntrada();
}
export async function mostrarAnuncioTercer() {
    const anuncio = document.querySelector('.anuncio-tercer');
    
    if (anuncio && anuncio.style.display !== 'flex') {
        anuncio.style.display = 'flex';
        actualizarEstadoInterno();
        
        // Solo agregar al historial si realmente cambiamos de nivel
        if (estadoAnuncios.nivelActual === 3 && (history.state?.nivel || 0) < 3) {
            history.pushState({ nivel: 3, tipo: 'anuncioTercer' }, '');
        }
    }
    configuracionesEntrada();
}
export async function ocultarAnuncio() {
    cerrarAnunciosPorNivel(0);
    sincronizarHistorial(0, true);
}
export async function ocultarAnuncioSecond() {
    const estadoDOM = obtenerEstadoRealDOM();
    const nivelDestino = estadoDOM.normal ? 1 : 0;
    cerrarAnunciosPorNivel(nivelDestino);
    sincronizarHistorial(nivelDestino, true);
}
export async function ocultarAnuncioTercer() {
    const estadoDOM = obtenerEstadoRealDOM();
    let nivelDestino = 0;
    if (estadoDOM.second) nivelDestino = 2;
    else if (estadoDOM.normal) nivelDestino = 1;
    
    cerrarAnunciosPorNivel(nivelDestino);
    sincronizarHistorial(nivelDestino, true);
}
export function cerrarAnuncioManual(tipo) {
    const estadoDOM = obtenerEstadoRealDOM();
    let nivelDestino = 0;
    
    switch (tipo) {
        case 'anuncioTercer':
            if (estadoDOM.tercer) {
                nivelDestino = estadoDOM.second ? 2 : (estadoDOM.normal ? 1 : 0);
                ocultarAnuncioTercerFisico();
            }
            break;
            
        case 'anuncioSecond':
            if (estadoDOM.second) {
                nivelDestino = estadoDOM.normal ? 1 : 0;
                ocultarAnuncioSecondFisico();
            }
            break;
            
        case 'anuncio':
            // Cerrar todos
            ocultarAnuncioTercerFisico();
            ocultarAnuncioSecondFisico();
            ocultarAnuncioFisico();
            nivelDestino = 0;
            break;
    }
    
    actualizarEstadoInterno();
    sincronizarHistorial(nivelDestino, true);
}
export function resetearEstadoAnuncios() {
    cerrarAnunciosPorNivel(0);
    estadoAnuncios.ignorarProximoPopstate = false;
    estadoAnuncios.sincronizandoHistorial = false;
    history.replaceState({ nivel: 0 }, '');
}



export function mostrarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'flex';
}
export function ocultarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'none';
}


export function crearNotificacion() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}
export function mostrarNotificacion({ message, type = 'info', duration = 3000 }) {
    const container = document.querySelector('.notification-container') || crearNotificacion();

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let timeoutId;

    function startDragging(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        notification.classList.add('dragging');
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const diffX = currentX - startX;

        if (diffX > 0) {
            // Mantener la posición vertical mientras se arrastra horizontalmente
            notification.style.transform = `translateY(10px) translateX(${diffX}px)`;
        }
    }

    function endDragging() {
        if (!isDragging) return;
        isDragging = false;
        notification.classList.remove('dragging');

        const diffX = currentX - startX;
        if (diffX > 200) {
            notification.classList.add('slide-right');
            setTimeout(() => notification.remove(), 300);
        } else {
            // Restaurar la posición original manteniendo el translateY
            notification.style.transform = 'translateY(20px)';
            notification.style.transition = 'transform 0.3s ease-out';
            setTimeout(() => {
                notification.style.transition = '';
                timeoutId = setTimeout(closeNotification, duration);
            }, 300);
        }
    }

    function closeNotification() {
        if (notification.parentElement && !isDragging) {
            notification.classList.add('hide');
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, { once: true });
        }
    }

    notification.addEventListener('mousedown', startDragging);
    notification.addEventListener('touchstart', startDragging, { passive: true });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDragging);
    document.addEventListener('touchend', endDragging);

    container.appendChild(notification);
    notification.offsetHeight;
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    timeoutId = setTimeout(closeNotification, duration);
}


export function configuracionesEntrada() {
    const inputs = document.querySelectorAll('.entrada .input input, .entrada .input select');

    inputs.forEach(input => {
        const label = input.previousElementSibling;

        // Verificar el estado inicial
        if (input.value.trim() !== '') {
            label.style.transform = 'translateY(-75%) scale(0.85)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
        }

        input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-75%) scale(0.85)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                label.style.transform = 'translateY(-50%)';
                label.style.color = 'var(--cero-color)';
                label.style.fontWeight = '400';
            }
        });

        // Para los select, también manejar el evento de cambio
        if (input.tagName.toLowerCase() === 'select') {
            input.addEventListener('change', () => {
                if (input.value.trim()) {
                    label.style.transform = 'translateY(-75%) scale(0.85)';
                    label.style.color = 'var(--cuarto-color)';
                    label.style.fontWeight = '600';
                    label.style.zIndex = '5';
                } else {
                    label.style.transform = 'translateY(-50%)';
                    label.style.color = 'var(--cero-color)';
                    label.style.fontWeight = '400';
                }
            });
        }
    });

    // Limpiar input de email
    const clearInputButton = document.querySelector('.clear-input');
    if (clearInputButton) {
        clearInputButton.addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.querySelector('.email');
            const label = emailInput.previousElementSibling;
            emailInput.value = '';

            // Forzar la actualización del label
            label.style.top = '50%';
            label.style.fontSize = 'var(--text-subtitulo)';
            label.style.color = 'var(--cero-color)';
            label.style.fontWeight = '400';

            // Disparar evento blur manualmente
            const blurEvent = new Event('blur');
            emailInput.dispatchEvent(blurEvent);

            // Disparar evento focus manualmente
            emailInput.focus();
            const focusEvent = new Event('focus');
            emailInput.dispatchEvent(focusEvent);
        });
    }

    // Mostrar/ocultar contraseña para el formulario de inicio de sesión
    document.querySelectorAll('.toggle-password').forEach(toggleButton => {
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            const passwordInput = toggleButton.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = toggleButton.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    const savedCredentials = JSON.parse(localStorage.getItem('credentials'));
    if (savedCredentials) {
        document.querySelector('.email').value = savedCredentials.email;
        document.querySelector('.password').value = savedCredentials.password;
    }
}
export async function registrarHistorial(origen, suceso, detalle) {
    try {
        mostrarCarga();
        const response = await fetch('/registrar-historial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origen,
                suceso,
                detalle
            })
        });

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            mostrarNotificacion({
                message: data.error || 'Error al registrar historial',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al registrar historial:', error);
        mostrarNotificacion({
            message: 'Error al registrar historial',
            type: 'error',
            duration: 3500
        });
        return false;
    } finally {
        ocultarCarga();
    }
}

export function exportarArchivos(rExp, registrosAExportar) {
    const registrosVisibles = Array.from(document.querySelectorAll('.registro-item'))
        .filter(item => item.style.display !== 'none')
        .map(item => {
            const registro = registrosAExportar.find(r => r.id === item.dataset.id);
            if (rExp === 'produccion') {
                return {
                    'ID': registro.id,
                    'Fecha': registro.fecha,
                    'Producto': registro.producto,
                    'Lote': registro.lote,
                    'Gramos': registro.gramos,
                    'Proceso': registro.proceso,
                    'Microondas': registro.microondas,
                    'Envases Terminados': registro.envases_terminados,
                    'Fecha Vencimiento': registro.fecha_vencimiento,
                    'Nombre': registro.nombre,
                    'Cantidad Real': registro.c_real,
                    'Fecha Verificación': registro.fecha_verificacion || 'Pendiente',
                    'Observaciones': registro.observaciones || 'Sin observaciones',
                };
            } else if (rExp === 'almacen') {
                const registrosVisibles = Array.from(document.querySelectorAll('.registro-item'))
                    .filter(item => item.style.display !== 'none')
                    .map(item => registrosAExportar.find(r => r.id === item.dataset.id));

                // Procesar cada registro visible individualmente
                registrosVisibles.forEach(registro => {
                    const productos = registro.productos.split(';');
                    const cantidades = registro.cantidades.split(';');
                    const preciosUnitarios = registro.precios_unitarios.split(';');

                    const subtitulos = [
                        { 'Productos': 'Producto', 'Cantidad': 'Cantidad', 'Precio Unitario': 'Precio Unitario', 'Subtotal': 'Subtotal' }
                    ];

                    const datosExportar = productos.map((producto, index) => ({
                        'Productos': producto.trim(),
                        'Cantidad': cantidades[index] ? cantidades[index].trim() : 'N/A',
                        'Precio Unitario': preciosUnitarios[index] ? preciosUnitarios[index].trim() : 'N/A',
                        'Subtotal': parseFloat(cantidades[index] || 0) * parseFloat(preciosUnitarios[index] || 0),
                    }));

                    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
                    const nombreArchivo = `Registro_${registro.id}_${fecha}.xlsx`;

                    const worksheet = XLSX.utils.json_to_sheet([...subtitulos, ...datosExportar], { header: ['Productos', 'Cantidad', 'Precio Unitario', 'Subtotal'] });

                    const maxLengths = {};
                    [...subtitulos, ...datosExportar].forEach(row => {
                        Object.keys(row).forEach(key => {
                            const valueLength = row[key].toString().length;
                            if (!maxLengths[key] || valueLength > maxLengths[key]) {
                                maxLengths[key] = valueLength;
                            }
                        });
                    });

                    worksheet['!cols'] = Object.keys(maxLengths).map(key => ({ wch: maxLengths[key] + 2 }));

                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const address = XLSX.utils.encode_cell({ c: C, r: 2 });
                        if (!worksheet[address]) continue;
                        worksheet[address].s = {
                            fill: { fgColor: { rgb: "D9D9D9" } },
                            font: { color: { rgb: "000000" }, bold: true }
                        };
                    }

                    XLSX.utils.sheet_add_aoa(worksheet, [
                        [`${registro.fecha_hora}`, `ID: ${registro.id}`, `Cliente/Proovedor:`, `${registro.cliente_proovedor}`, `${registro.nombre_movimiento}`]
                    ], { origin: 'A1' });

                    const headerRow = [
                        `${registro.fecha_hora}`,
                        `ID: ${registro.id}`,
                        `Operario: ${registro.operario}`,
                        `Cliente/Proveedor:`,
                        `${registro.nombre_movimiento}`
                    ];

                    headerRow.forEach((value, index) => {
                        const length = value.length;
                        if (!worksheet['!cols'][index] || worksheet['!cols'][index].wch < length) {
                            worksheet['!cols'][index] = { wch: length };
                        }
                    });

                    XLSX.utils.sheet_add_aoa(worksheet, [
                        [`Obs: ${registro.observaciones || 'Ninguna'}`, ``, `Total: ${registro.total}`, `Descuento: ${registro.descuento}`, `Aumento: ${registro.aumento}`]
                    ], { origin: `A${productos.length + 4}` });

                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registro');
                    XLSX.writeFile(workbook, nombreArchivo);
                });

                mostrarNotificacion({
                    message: `Se descargaron ${registrosVisibles.length} registros en archivos separados`,
                    type: 'success',
                    duration: 3000
                });
            } else if (rExp === 'conteo') {
                // Obtener registros visibles
                const registrosVisibles = Array.from(document.querySelectorAll('.registro-item'))
                    .filter(item => item.style.display !== 'none')
                    .map(item => registrosAExportar.find(r => r.id === item.dataset.id));

                // Procesar cada registro visible
                for (const registro of registrosVisibles) {
                    const productos = registro.productos.split(';');
                    const sistema = registro.sistema.split(';');
                    const fisico = registro.fisico.split(';');
                    const diferencias = sistema.map((s, i) => parseInt(fisico[i] || 0) - parseInt(s || 0));

                    const subtitulos = [
                        { 'Productos': 'Producto', 'Sistema': 'Sistema', 'Físico': 'Físico', 'Diferencia': 'Diferencia' }
                    ];

                    const datosExportar = productos.map((producto, index) => ({
                        'Productos': producto.trim(),
                        'Sistema': sistema[index] ? sistema[index].trim() : '0',
                        'Físico': fisico[index] ? fisico[index].trim() : '0',
                        'Diferencia': diferencias[index]
                    }));

                    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
                    const nombreArchivo = `Conteo_${registro.id}_${fecha}.xlsx`;

                    const worksheet = XLSX.utils.json_to_sheet([...subtitulos, ...datosExportar],
                        { header: ['Productos', 'Sistema', 'Físico', 'Diferencia'] });

                    // Ajustar anchos de columna
                    const maxLengths = {};
                    [...subtitulos, ...datosExportar].forEach(row => {
                        Object.keys(row).forEach(key => {
                            const valueLength = row[key].toString().length;
                            if (!maxLengths[key] || valueLength > maxLengths[key]) {
                                maxLengths[key] = valueLength;
                            }
                        });
                    });

                    worksheet['!cols'] = Object.keys(maxLengths).map(key => ({ wch: maxLengths[key] + 2 }));

                    // Dar formato al encabezado
                    const range = XLSX.utils.decode_range(worksheet['!ref']);
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const address = XLSX.utils.encode_cell({ c: C, r: 0 });
                        if (!worksheet[address]) continue;
                        worksheet[address].s = {
                            fill: { fgColor: { rgb: "D9D9D9" } },
                            font: { color: { rgb: "000000" }, bold: true }
                        };
                    }

                    // Agregar información del conteo en la parte superior
                    XLSX.utils.sheet_add_aoa(worksheet, [
                        [`Fecha: ${registro.fecha}`, `ID: ${registro.id}`, `Nombre: ${registro.nombre || 'Sin nombre'}`]
                    ], { origin: 'A1' });

                    // Agregar observaciones al final
                    XLSX.utils.sheet_add_aoa(worksheet, [
                        [`Observaciones: ${registro.observaciones || 'Ninguna'}`]
                    ], { origin: `A${datosExportar.length + 4}` });

                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conteo');
                    XLSX.writeFile(workbook, nombreArchivo);
                }

                mostrarNotificacion({
                    message: `Se descargaron ${registrosVisibles.length} registros en archivos separados`,
                    type: 'success',
                    duration: 3000
                });
                return;
            }
        });

    // Generar nombre del archivo con la fecha actual
    const fecha = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const nombreArchivo = `Registros_${fecha}.xlsx`;

    // Crear y descargar el archivo Excel
    const worksheet = XLSX.utils.json_to_sheet(registrosVisibles);

    // Ajustar el ancho de las columnas
    const wscols = Object.keys(registrosVisibles[0] || {}).map(() => ({ wch: 15 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros');
    XLSX.writeFile(workbook, nombreArchivo);

    mostrarNotificacion({
        message: 'Descarga exitosa de los registros',
        type: 'success',
        duration: 3000
    });
}