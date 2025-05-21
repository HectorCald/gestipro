// Mantener un registro del estado actual
const estadoAnuncios = {
    anuncioVisible: false,
    anuncioSecondVisible: false,
    anuncioTercerVisible: false,
    nivelActual: 0,
    procesandoCierreManual: false  // Flag para evitar conflictos
};

// Controlador global para eventos de popstate
window.addEventListener('popstate', (event) => {
    // Si estamos procesando un cierre manual, no hacer nada
    if (estadoAnuncios.procesandoCierreManual) {
        estadoAnuncios.procesandoCierreManual = false;
        return;
    }
    
    const estado = event.state || {};
    const nivelAnterior = estado.nivel || 0;
    
    // Determinar qué anuncio cerrar basado en el nivel del historial
    if (estadoAnuncios.nivelActual === 3 && nivelAnterior <= 2) {
        // Si estamos en nivel 3 (anuncioTercer visible) y volvemos a nivel 2 o menos
        ocultarAnuncioTercerInterno();
        estadoAnuncios.anuncioTercerVisible = false;
        estadoAnuncios.nivelActual = nivelAnterior;
    }
    else if (estadoAnuncios.nivelActual === 2 && nivelAnterior <= 1) {
        // Si estamos en nivel 2 (anuncioSecond visible) y volvemos a nivel 1 o 0
        ocultarAnuncioSecondInterno();
        estadoAnuncios.anuncioSecondVisible = false;
        estadoAnuncios.nivelActual = nivelAnterior;
    } 
    else if (estadoAnuncios.nivelActual === 1 && nivelAnterior === 0) {
        // Si estamos en nivel 1 (solo anuncio visible) y volvemos a nivel 0
        ocultarAnuncioInterno();
        estadoAnuncios.anuncioVisible = false;
        estadoAnuncios.nivelActual = 0;
    }

    const anuncioTercer = document.querySelector('.anuncio-tercer');
    const anuncioSecond = document.querySelector('.anuncio-second');
    const anuncio = document.querySelector('.anuncio');
    
    // Cierre forzado si hay discrepancia entre estado y DOM
    if (anuncioTercer && anuncioTercer.style.display === 'flex' && estadoAnuncios.nivelActual < 3) {
        ocultarAnuncioTercerInterno();
    }
    if (anuncioSecond && anuncioSecond.style.display === 'flex' && estadoAnuncios.nivelActual < 2) {
        ocultarAnuncioSecondInterno();
    }
    if (anuncio && anuncio.style.display === 'flex' && estadoAnuncios.nivelActual < 1) {
        ocultarAnuncioInterno();
    }
});

export async function mostrarAnuncio() {
    const anuncio = document.querySelector('.anuncio');
    
    if (anuncio && anuncio.style.display !== 'flex') {
        anuncio.style.display = 'flex';
        
        // Actualizar estado y agregar entrada en el historial solo si aún no está visible
        if (!estadoAnuncios.anuncioVisible) {
            estadoAnuncios.anuncioVisible = true;
            estadoAnuncios.nivelActual = 1;
            
            // Añadir estado al historial
            history.pushState({ nivel: 1, tipo: 'anuncio' }, '');
        }
    }
}

export async function mostrarAnuncioSecond() {
    const anuncio = document.querySelector('.anuncio-second');
    
    if (anuncio && anuncio.style.display !== 'flex') {
        anuncio.style.display = 'flex';
        
        // Actualizar estado y agregar entrada en el historial solo si aún no está visible
        if (!estadoAnuncios.anuncioSecondVisible) {
            estadoAnuncios.anuncioSecondVisible = true;
            estadoAnuncios.nivelActual = 2;
            
            // Añadir estado al historial
            history.pushState({ nivel: 2, tipo: 'anuncioSecond' }, '');
        }
    }
    
    // Configurar entrada si es necesario
    configuracionesEntrada();
}

export async function mostrarAnuncioTercer() {
    const anuncio = document.querySelector('.anuncio-tercer');
    
    if (anuncio && anuncio.style.display !== 'flex') {
        anuncio.style.display = 'flex';
        
        // Actualizar estado y agregar entrada en el historial solo si aún no está visible
        if (!estadoAnuncios.anuncioTercerVisible) {
            estadoAnuncios.anuncioTercerVisible = true;
            estadoAnuncios.nivelActual = 3;
            
            // Añadir estado al historial
            history.pushState({ nivel: 3, tipo: 'anuncioTercer' }, '');
        }
    }
    configuracionesEntrada();
}

export async function ocultarAnuncio() {
    ocultarAnuncioInterno();
}

export async function ocultarAnuncioSecond() {
    ocultarAnuncioSecondInterno();
}

export async function ocultarAnuncioTercer() {
    ocultarAnuncioTercerInterno();
}

// Funciones internas que no modifican el historial (usadas por popstate)
async function ocultarAnuncioInterno() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = document.querySelector('.anuncio .contenido');
    const btni = document.querySelector('.btn-flotante-salidas');
    const btns = document.querySelector('.btn-flotante-ingresos');
    const btnp = document.querySelector('.btn-flotante-pedidos');

    // Asegúrate de ocultar los botones flotantes
    if (btni) btni.style.display = 'none';
    if (btns) btns.style.display = 'none';
    if (btnp) btnp.style.display = 'none';

    if (!anuncio || anuncio.style.display === 'none') return;
    
    // Ocultar y limpiar el anuncio
    anuncio.style.display = 'none';
    
    if (contenido) {
        contenido.style.paddingBottom = '75px';
        contenido.innerHTML = ''; // Limpiar el contenido
    }
    
    // Actualizar estado
    estadoAnuncios.anuncioVisible = false;
    
    // Actualizar nivel según qué anuncios siguen visibles
    if (estadoAnuncios.anuncioTercerVisible) {
        estadoAnuncios.nivelActual = 3;
    } else if (estadoAnuncios.anuncioSecondVisible) {
        estadoAnuncios.nivelActual = 2;
    } else {
        estadoAnuncios.nivelActual = 0;
    }
}

async function ocultarAnuncioSecondInterno() {
    const anuncio = document.querySelector('.anuncio-second');
    const contenido = document.querySelector('.anuncio-second .contenido');

    if (!anuncio || anuncio.style.display === 'none') return;

    // Ocultar y limpiar el anuncio secundario
    anuncio.style.display = 'none';
    
    if (contenido) {
        contenido.style.paddingBottom = '75px';
        contenido.innerHTML = ''; // Limpiar el contenido
    }
    
    // Actualizar estado
    estadoAnuncios.anuncioSecondVisible = false;
    
    // Actualizar nivel según qué anuncios siguen visibles
    if (estadoAnuncios.anuncioTercerVisible) {
        estadoAnuncios.nivelActual = 3;
    } else if (estadoAnuncios.anuncioVisible) {
        estadoAnuncios.nivelActual = 1;
    } else {
        estadoAnuncios.nivelActual = 0;
    }
}

async function ocultarAnuncioTercerInterno() {
    const anuncio = document.querySelector('.anuncio-tercer');
    const contenido = document.querySelector('.anuncio-tercer .contenido');

    if (!anuncio || anuncio.style.display === 'none') return;

    // Ocultar y limpiar el anuncio tercer
    anuncio.style.display = 'none';
    
    if (contenido) {
        contenido.style.paddingBottom = '75px';
        contenido.innerHTML = ''; // Limpiar el contenido
    }
    
    // Actualizar estado
    estadoAnuncios.anuncioTercerVisible = false;
    
    // Actualizar nivel según qué anuncios siguen visibles
    if (estadoAnuncios.anuncioSecondVisible) {
        estadoAnuncios.nivelActual = 2;
    } else if (estadoAnuncios.anuncioVisible) {
        estadoAnuncios.nivelActual = 1;
    } else {
        estadoAnuncios.nivelActual = 0;
    }
}

// Función para cerrar manualmente un anuncio (por ejemplo, con un botón de cerrar)
export function cerrarAnuncioManual(tipo) {
    // Marcar que estamos procesando un cierre manual
    estadoAnuncios.procesandoCierreManual = true;
    
    if (tipo === 'anuncioTercer' && estadoAnuncios.anuncioTercerVisible) {
        ocultarAnuncioTercerInterno();
        
        // Navegar hacia atrás en el historial
        if (estadoAnuncios.nivelActual === 3) {
            history.back();
        }
    }
    else if (tipo === 'anuncioSecond' && estadoAnuncios.anuncioSecondVisible) {
        ocultarAnuncioSecondInterno();
        
        // Navegar hacia atrás en el historial sin disparar el evento popstate
        if (estadoAnuncios.nivelActual === 2) {
            history.back();
        }
    } 
    else if (tipo === 'anuncio' && estadoAnuncios.anuncioVisible) {
        // Calcular cuántos anuncios están abiertos para cerrar todos
        let nivelesPorRetroceder = estadoAnuncios.nivelActual;
        
        // Cerrar todos los anuncios visibles
        if (estadoAnuncios.anuncioTercerVisible) {
            ocultarAnuncioTercerInterno();
            estadoAnuncios.anuncioTercerVisible = false;
        }
        if (estadoAnuncios.anuncioSecondVisible) {
            ocultarAnuncioSecondInterno();
            estadoAnuncios.anuncioSecondVisible = false;
        }
        if (estadoAnuncios.anuncioVisible) {
            ocultarAnuncioInterno();
            estadoAnuncios.anuncioVisible = false;
        }
        
        // Nuevo: Resetear el historial completamente
        if (nivelesPorRetroceder > 0) {
            history.go(-nivelesPorRetroceder);
            // Forzar un reemplazo del estado actual
            history.replaceState({ nivel: 0, tipo: 'base' }, '');
        }
        estadoAnuncios.nivelActual = 0;
    }
}

// Función de utilidad para limpiar el estado (úsala si necesitas resetear todo)
export function resetearEstadoAnuncios() {
    estadoAnuncios.anuncioVisible = false;
    estadoAnuncios.anuncioSecondVisible = false;
    estadoAnuncios.anuncioTercerVisible = false;
    estadoAnuncios.nivelActual = 0;
    estadoAnuncios.procesandoCierreManual = false;
    
    // Ocultar físicamente los anuncios
    const anuncio = document.querySelector('.anuncio');
    const anuncioSecond = document.querySelector('.anuncio-second');
    const anuncioTercer = document.querySelector('.anuncio-tercer');
    
    if (anuncio) anuncio.style.display = 'none';
    if (anuncioSecond) anuncioSecond.style.display = 'none';
    if (anuncioTercer) anuncioTercer.style.display = 'none';
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
            label.style.transform = 'translateY(-90%) scale(0.75)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
        }

        input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-90%) scale(0.75)';
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
                    label.style.transform = 'translateY(-90%) scale(0.75)';
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