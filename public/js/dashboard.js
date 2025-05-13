import { crearNotificacion, mostrarNotificacion, mostrarAnuncio, ocultarAnuncio, mostrarCarga, ocultarCarga, configuracionesEntrada, mostrarAnuncioSecond, ocultarAnuncioSecond, registrarHistorial} from './modules/componentes.js'
import { crearNav} from './modules/nav.js'
import { crearHome, mostrarHome } from './modules/home.js';
import { crearPerfil } from './modules/perfil.js';
import { crearNotificaciones }from './modules/notificaciones.js'
import { flotante } from './modules/flotante.js';
import { mostrarFormularioProduccion } from './modules/formulario-produccion.js'
import { mostrarVerificacion } from './modules/verificar-registros.js'
import { mostrarAlmacenGeneral } from './modules/almacen-general.js'
import { mostrarSalidas } from './modules/salidas-almacen-general.js';
import { mostrarIngresos } from './modules/ingresos-almacen-general.js';
import { mostrarClientes } from './modules/clientes.js';
import { mostrarProovedores } from './modules/proovedores.js';
import { mostrarHacerPedido } from './modules/hacer-pedido.js';
import { mostrarAlmacenAcopio } from './modules/almacen-acopio.js';
import { mostrarMovimientosAlmacen } from './modules/registros-almacen.js';


window.crearHome = crearHome
window.mostrarHome = mostrarHome


window.crearNotificacion = crearNotificacion
window.mostrarNotificacion = mostrarNotificacion


window.ocultarAnuncio = ocultarAnuncio
window.mostrarAnuncio = mostrarAnuncio
window.mostrarAnuncioSecond = mostrarAnuncioSecond
window.ocultarAnuncioSecond = ocultarAnuncioSecond


window.mostrarCarga = mostrarCarga
window.ocultarCarga = ocultarCarga
window.configuracionesEntrada = configuracionesEntrada
window.registrarHistorial = registrarHistorial
window.crearNotificaciones = crearNotificaciones


window.mostrarFormularioProduccion = mostrarFormularioProduccion
window.mostrarVerificacion = mostrarVerificacion


window.mostrarAlmacenGeneral = mostrarAlmacenGeneral
window.mostrarSalidas = mostrarSalidas
window.mostrarIngresos = mostrarIngresos
window.mostrarMovimientosAlmacen = mostrarMovimientosAlmacen
window.mostrarClientes = mostrarClientes
window.mostrarProovedores = mostrarProovedores


window.mostrarHacerPedido = mostrarHacerPedido
window.mostrarAlmacenAcopio = mostrarAlmacenAcopio


document.addEventListener('DOMContentLoaded', async () => {
    flotante();
    await crearNav();
    await crearHome();
    await crearPerfil();
    await crearNotificaciones();
});