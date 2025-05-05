export function mostrarFormularioProduccion() {
    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Nueva producción</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="entrada">
                <i class="ri-box-3-line"></i>
                <div class="input">
                    <p class="detalle">Producto</p>
                    <input class="producto" type="text" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class="ri-scales-line"></i>

                <div class="input">
                    <p class="detalle">Gramaje</p>
                    <input class="gramaje" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-spreadsheet'></i>
                <div class="input">
                    <p class="detalle">Lote:</p>
                    <input class="lote" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-git-compare'></i>
                <div class="input">
                    <p class="detalle">Proceso</p>
                    <select class="proceso" required>
                        <option value="" disabled selected></option>
                        <option value="Cernido">Cernido</option>
                        <option value="Seleccion">Selección</option>
                        <option value="Ninguno">Ninguno</option>
                    </select>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-bowl-hot'></i>
                <div class="input">
                    <p class="detalle">Microondas</p>
                    <select class="select" required>
                        <option value="" disabled selected></option>
                        <option value="Si">Si</option>
                        <option value="No">No</option>
                    </select>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-time'></i>
                <div class="input">
                    <p class="detalle">Tiempo</p>
                    <input class="microondas" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bxs-cube-alt'></i>
                <div class="input">
                    <p class="detalle">Envases terminados</p>
                    <input class="envasados" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-calendar'></i>
                <div class="input">
                    <p class="detalle">vencimiento</p>
                    <input class="vencimiento" type="month" placeholder=" " required>
                </div>
            </div>
            
            <button id="btn-guardar" class="btn green">Registrar</button>
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    evetosFormularioProduccion();
}
function evetosFormularioProduccion() {
    const selectMicroondas = document.querySelector('.select');
    const entradaTiempo = document.querySelector('.microondas').closest('.entrada');

    // Initially hide the "Tiempo" input
    entradaTiempo.style.display = 'none';

    selectMicroondas.addEventListener('change', () => {
        if (selectMicroondas.value === 'Si') {
            entradaTiempo.style.display = 'flex';
        } else {
            entradaTiempo.style.display = 'none';
        }
    });
}