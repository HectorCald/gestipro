let usuarioInfo = recuperarUsuarioLocal();
let historialNotificaciones = [];
async function obtenerHistorial() {
    try {
        const response = await fetch('/obtener-historial');
        const data = await response.json();

        if (data.success) {
            historialNotificaciones = data.historial
                .filter(notif => notif.destino === usuarioInfo.email)
                .sort((a, b) => {
                    const [diaA, mesA, anioA] = a.fecha.split('/');
                    const [diaB, mesB, anioB] = b.fecha.split('/');
                    const fechaA = new Date(anioA, mesA - 1, diaA);
                    const fechaB = new Date(anioB, mesB - 1, diaB);
                    return fechaB - fechaA;
                });
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener historial',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener historial:', error);
        mostrarNotificacion({
            message: 'Error al obtener historial',
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


export async function crearNotificaciones() {
    const view = document.querySelector('.notificacion-view');
    await obtenerHistorial();
    mostrarNotificaciones(view);
}
function obtenerIcono(suceso) {
    const iconos = {
        'Edición': 'edit',
        'Creación': 'plus-circle',
        'Eliminación': 'trash',
        'Verificación': 'check-circle',
        'Error': 'error-circle',
        'Información': 'info-circle'
    };
    return iconos[suceso] || 'bell';
}
function mostrarNotificaciones(view) {
    const notificacionesHTML = historialNotificaciones.map(notif => `
        <div class="notificacion">
            <i class='bx bx-${obtenerIcono(notif.suceso)}'></i>
            <div class="notificacion-info">
                <div class="cabeza">
                    <p class="suceso ${notif.suceso}">${notif.suceso}</p>
                    <p class="fecha">${notif.fecha}</p>
                </div>
                <p class="detalle">${notif.detalle}</p>
            </div>
        </div>
    `).join('');

    const notificacion = `
        <h1 class="titulo"><i class='bx bx-bell'></i> Notificaciones</h1>
        <p class="normal">Notificaciones</p>
        <div class="notificaciones">
            ${historialNotificaciones.length > 0 ? notificacionesHTML : `
                <div class="notificacion">
                    <i class='bx bx-bell-off'></i>
                    <div class="notificacion-info">
                        <div class="cabeza">
                            <p class="suceso">Sin notificaciones</p>
                            <p class="fecha">${new Date().toLocaleDateString()}</p>
                        </div>
                        <p class="detalle">No hay notificaciones disponibles</p>
                    </div>
                </div>
            `}
        </div>
    `;
    view.innerHTML = notificacion;
}