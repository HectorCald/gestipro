let usuarioInfo = {
    nombre: '',
    apellido: '',
    email: '',
    foto: '',
    rol: '',
    estado: '',
    plugins: ''
};
async function obtenerUsuario() {
    try {
        const response = await fetch('/obtener-usuario-actual');
        const data = await response.json();

        if (data.success) {
            const nombreCompleto = data.usuario.nombre.split(' ');
            usuarioInfo = {
                nombre: nombreCompleto[0] || '',
                apellido: nombreCompleto[1] || '',
                email: data.usuario.email,
                rol: data.usuario.rol,
                estado: data.usuario.estado,
                plugins: data.usuario.plugins
            };

            // Procesar la foto
            if (!data.usuario.foto || data.usuario.foto === './icons/icon.png') {
                usuarioInfo.foto = './icons/icon.png';
            } else if (data.usuario.foto.startsWith('data:image')) {
                usuarioInfo.foto = data.usuario.foto;
            } else {
                try {
                    const imgResponse = await fetch(data.usuario.foto);
                    if (!imgResponse.ok) throw new Error('Error al cargar la imagen');
                    const blob = await imgResponse.blob();
                    usuarioInfo.foto = URL.createObjectURL(blob);
                } catch (error) {
                    console.error('Error loading image:', error);
                    usuarioInfo.foto = './icons/icon.png';
                }
            }
            return true;
        } else {
            mostrarNotificacion({
                message: 'Error al obtener datos del usuario',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        mostrarNotificacion({
            message: 'Error al obtener datos del usuario',
            type: 'error',
            duration: 3500
        });
        return false;
    }
}
export async function crearNotificaciones() {
    const view = document.querySelector('.notificacion-view');
    await obtenerUsuario();
    mostrarNotificaciones(view);
}
function mostrarNotificaciones(view) {
    const notificacion = `
        <h1 class="titulo"><i class='bx bx-bell'></i> Notificaciones</h1>
        <p class="normal">Notificaciones</p>
        <div class="notificaciones">
            <div class="notificacion">
                <i class='bx bx-edit'></i>
                <div class="notificacion-info">
                    <div class="cabeza">
                        <p class="suceso">Edición</p>
                        <p class="fecha">09/05/2025</p>
                    </div>
                    <p class="detalle">Se edito tu registro por que estaba mal el lote del regsitro paprika 30gr lote numero: 3545</p>
                </div>
            </div>
        </div>
    `;
    view.innerHTML = notificacion;
}