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
export function crearHome() {
    const view = document.querySelector('.home-view');
    obtenerUsuario().then(() => mostrarHome(view));
}
function mostrarHome(view) {
    const home = `
        <h1 class="titulo"><i class='bx bx-home'></i> Inicio</h1>
        <div class="seccion1">
            <h2 class="subtitulo">Tus funciones</h2>
            <div class="funciones-rol">
                <div class="funcion">
                    <i class='bx bx-plus'></i>
                    <p class="nombre">Formulario</p>
                    <p class="detalle">Nuevo registro de producción</p>
                </div>
                <div class="funcion">
                    <i class='bx bx-plus'></i>
                    <p class="nombre">Formulario</p>
                    <p class="detalle">Nuevo registro de producción</p>
                </div>
                <div class="funcion">
                    <i class='bx bx-plus'></i>
                    <p class="nombre">Formulario</p>
                    <p class="detalle">Nuevo registro de producción</p>
                </div>
                <div class="funcion">
                    <i class='bx bx-plus'></i>
                    <p class="nombre">Formulario</p>
                    <p class="detalle">Nuevo registro de producción</p>
                </div>
            </div>
        </div>
        <div class="seccion3">
            <h2 class="subtitulo">Tus destacados</h2>
            <div class="destacados">
                <div class="destacado">
                    <p class="cantidad  green">10</p>
                    <p class="tipo">Verificados</p>
                </div>

                <div class="destacado">
                    <p class="cantidad  blue">44</p>
                    <p class="tipo">Total registros</p>
                </div>

                <div class="destacado">
                    <p class="cantidad yellow">34</p>
                    <p class="tipo">No verificados</p>
                </div>
            </div>
        </div>
        <div class="seccion2">
            <h2 class="subtitulo">Tus registros</h2>
            <div class="filtros-opciones estado">
                <button class="btn-filtro activado">Todos</button>
                <button class="btn-filtro">No verificados</button>
                <button class="btn-filtro">Verificados</button>
            </div>
            <div class="filtros-opciones tiempo">
                <button class="btn-filtro activado">7 dias</button>
                <button class="btn-filtro">15 dias</button>
                <button class="btn-filtro">1 mes</button>
                <button class="btn-filtro">3 meses</button>
                <button class="btn-filtro">6 meses</button>
                <button class="btn-filtro">1 año</button>
            </div>
            <p class="aviso">Registros de <span>7 dias</span></p>
            <div class="registros">
                <div class="registro">
                    <div class="info">
                        <p class="fecha">03-04-2025</p>
                        <p class="producto">Aji amarillo picante 13gr.</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Envasados: <strong>1000 Und.</strong></p>
                        <p class="lote">Lote: <strong>00565</strong></p>
                        <p class="estado verificado">Estado: <strong>Verificado</strong></p>
                    </div>
                </div>
                <div class="registro">
                    <div class="info">
                        <p class="fecha">03-04-2025</p>
                        <p class="producto">Aji amarillo picante 13gr.</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Envasados: <strong>1000 Und.</strong></p>
                        <p class="lote">Lote: <strong>00565</strong></p>
                        <p class="estado pendiente">Estado: <strong>Pendiente</strong></p>
                    </div>
                </div>
                <div class="registro">
                    <div class="info">
                        <p class="fecha">03-04-2025</p>
                        <p class="producto">Aji amarillo picante 13gr.</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Envasados: <strong>1000 Und.</strong></p>
                        <p class="lote">Lote: <strong>00565</strong></p>
                        <p class="estado verificado">Estado: <strong>Verificado</strong></p>
                    </div>
                </div>
                <div class="registro">
                    <div class="info">
                        <p class="fecha">03-04-2025</p>
                        <p class="producto">Aji amarillo picante 13gr.</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Envasados: <strong>1000 Und.</strong></p>
                        <p class="lote">Lote: <strong>00565</strong></p>
                        <p class="estado verificado">Estado: <strong>Verificado</strong></p>
                    </div>
                </div>
                <div class="registro">
                    <div class="info">
                        <p class="fecha">03-04-2025</p>
                        <p class="producto">Aji amarillo picante 13gr.</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Envasados: <strong>1000 Und.</strong></p>
                        <p class="lote">Lote: <strong>00565</strong></p>
                        <p class="estado verificado">Estado: <strong>Verificado</strong></p>
                    </div>
                </div>
                <div class="registro">
                    <div class="info">
                        <p class="fecha">03-04-2025</p>
                        <p class="producto">Aji amarillo picante 13gr.</p>
                    </div>
                    <div class="detalles">
                        <p class="cantidad">Envasados: <strong>1000 Und.</strong></p>
                        <p class="lote">Lote: <strong>00565</strong></p>
                        <p class="estado pendiente">Estado: <strong>Pendiente</strong></p>
                    </div>
                </div>
            </div>
        </div>
        
    `;

    view.innerHTML = home;

}
