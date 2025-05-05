export function crearHome() {
    const view = document.querySelector('.home-view');
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
                        <p class="estado">Estado: <strong>Pendiente</strong></p>
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
                        <p class="estado">Estado: <strong>Pendiente</strong></p>
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
                        <p class="estado">Estado: <strong>Pendiente</strong></p>
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
                        <p class="estado">Estado: <strong>Pendiente</strong></p>
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
                        <p class="estado">Estado: <strong>Pendiente</strong></p>
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
                        <p class="estado">Estado: <strong>Pendiente</strong></p>
                    </div>
                </div>
            </div>
        </div>
        
    `;

    view.innerHTML = home;

}