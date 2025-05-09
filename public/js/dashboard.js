import { crearNotificacion, mostrarNotificacion, mostrarAnuncio, ocultarAnuncio, mostrarCarga, ocultarCarga, configuracionesEntrada, mostrarAnuncioSecond, ocultarAnuncioSecond, registrarHistorial} from './modules/componentes.js'
import { crearNav} from './modules/nav.js'
import { crearHome, mostrarHome } from './modules/home.js';
import { crearPerfil } from './modules/perfil.js';
import { crearNotificaciones }from './modules/notificaciones.js'
import { flotante } from './modules/flotante.js';
import { mostrarFormularioProduccion } from './modules/formulario-produccion.js'
import { mostrarVerificacion } from './modules/verificar-registros.js'
import { mostrarAlmacenGeneral } from './modules/almacen-general.js'


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

window.mostrarFormularioProduccion = mostrarFormularioProduccion

window.mostrarVerificacion = mostrarVerificacion

window.crearNotificaciones = crearNotificaciones

window.mostrarAlmacenGeneral = mostrarAlmacenGeneral


document.addEventListener('DOMContentLoaded', async () => {
    flotante();
    await crearNav();
    await crearHome();
    await crearPerfil();
    await crearNotificaciones();
});





