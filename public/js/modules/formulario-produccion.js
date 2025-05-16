let productosGlobal = recuperarProductosLocal();

function recuperarProductosLocal() {
    const productosGuardados = localStorage.getItem('damabrava_productos');
    if (productosGuardados) {
        return JSON.parse(productosGuardados);
    }
    return [];
}
function limpiarProductosLocal() {
    localStorage.removeItem('damabrava_productos');
    productosGlobal = [];
}



export async function mostrarFormularioProduccion() {
    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Nueva producción</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p class="normal"><i class='bx bx-chevron-right'></i>Registro</p>
            <div class="entrada">
                <i class="ri-box-3-line"></i>
                <div class="input">
                    <p class="detalle">Producto</p>
                    <input class="producto" type="text" autocomplete="off" placeholder=" " required>
                </div>
            </div>
            <div class="sugerencias" id="productos-list"></div>
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
            <div class="entrada" style="display:none">
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
        </div>
        <div class="anuncio-botones">
            <button id="btn-registrar" class="btn orange"><i class="bx bx-notepad"></i> Registrar</button>
        </div>
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();
    evetosFormularioProduccion();
}
function evetosFormularioProduccion() {
    const selectMicroondas = document.querySelector('.select');
    const entradaTiempo = document.querySelector('.microondas').closest('.entrada');
    const productoInput = document.querySelector('.entrada .producto');
    const sugerenciasList = document.querySelector('#productos-list');
    const gramajeInput = document.querySelector('.entrada .gramaje');
    const registrar = document.querySelector('#btn-registrar');

    function normalizarTexto(texto) {
        return texto
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
            .replace(/[-\s]+/g, ""); // Eliminar guiones y espacios
    }

    entradaTiempo.style.display = 'none';

    selectMicroondas.addEventListener('change', () => {
        if (selectMicroondas.value === 'Si') {
            entradaTiempo.style.display = 'flex';
        } else {
            entradaTiempo.style.display = 'none';
        }
    });
    productoInput.addEventListener('input', (e) => {
        const valor = normalizarTexto(e.target.value);

        sugerenciasList.innerHTML = '';

        if (valor) {
            const sugerencias = productosGlobal.filter(p =>
                normalizarTexto(p.producto).includes(valor)
            ).slice(0, 5);

            if (sugerencias.length) {
                sugerenciasList.style.display = 'flex';
                sugerencias.forEach(p => {
                    const div = document.createElement('div');
                    div.classList.add('item');
                    div.textContent = p.producto + ' ' + p.gramos + 'gr.';
                    div.onclick = () => {
                        productoInput.value = p.producto;
                        sugerenciasList.style.display = 'none';
                        gramajeInput.value = p.gramos;
                        const event = new Event('focus');
                        gramajeInput.dispatchEvent(event);
                    };
                    sugerenciasList.appendChild(div);
                });
            }
        } else {
            sugerenciasList.style.display = 'none';
        }
    });


    registrar.addEventListener('click', async () => {
        // Get all form values
        const producto = productoInput.value.trim();
        const lote = document.querySelector('.entrada .lote').value; // Fixed selector
        const gramos = gramajeInput.value;
        const proceso = document.querySelector('.proceso').value;
        const microondas = selectMicroondas.value;
        const tiempo = document.querySelector('.microondas').value;
        const envasados = document.querySelector('.envasados').value;
        const vencimiento = document.querySelector('.vencimiento').value;

        // Individual field validations
        if (!producto) {
            mostrarNotificacion({
                message: 'Ingrese el producto',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (!lote) {
            mostrarNotificacion({
                message: 'Ingrese el lote',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (!gramos) {
            mostrarNotificacion({
                message: 'Ingrese el gramaje',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (!proceso) {
            mostrarNotificacion({
                message: 'Seleccione el proceso',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (!microondas) {
            mostrarNotificacion({
                message: 'Seleccione si usa microondas',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (microondas === 'Si' && !tiempo) {
            mostrarNotificacion({
                message: 'Ingrese el tiempo de microondas',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (!envasados) {
            mostrarNotificacion({
                message: 'Ingrese la cantidad de envases',
                type: 'error',
                duration: 3500
            });
            return;
        }

        if (!vencimiento) {
            mostrarNotificacion({
                message: 'Seleccione la fecha de vencimiento',
                type: 'error',
                duration: 3500
            });
            return;
        }

        // Validate product exists
        const productoExiste = productosGlobal.some(p =>
            normalizarTexto(p.producto) === normalizarTexto(producto)
        );

        if (!productoExiste) {
            mostrarNotificacion({
                message: 'El producto no existe en el inventario',
                type: 'error',
                duration: 3500
            });
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/registrar-produccion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    producto,
                    lote,
                    gramos,
                    proceso,
                    microondas,
                    tiempo: microondas === 'No' ? 'No' : tiempo,
                    envasados,
                    vencimiento
                })
            });

            const data = await response.json();

            if (data.success) {
                await obtenerMisRegistros();
                ocultarAnuncio();
                mostrarNotificacion({
                    message: 'Producción registrada correctamente',
                    type: 'success',
                    duration: 3000
                });
            } else {
                throw new Error(data.error || 'Error al registrar la producción');
            }
        } catch (error) {
            console.error('Error en registro:', error);
            mostrarNotificacion({
                message: error.message || 'Error al registrar la producción',
                type: 'error',
                duration: 3500
            });
        }finally{
            ocultarCarga();
        }
    });
}




