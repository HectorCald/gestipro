import { crearNotificacion, mostrarNotificacion, mostrarAnuncio, ocultarAnuncio, mostrarCarga, ocultarCarga, configuracionesEntrada } from './modules/componentes.js'
import { crearHome, mostrarHome } from './modules/home.js';
import { crearNav } from './modules/nav.js'
import { crearPerfil } from './modules/perfil.js';
import { flotante } from './modules/flotante.js';
import { mostrarFormularioProduccion } from './modules/formulario-produccion.js'

window.crearHome = crearHome
window.mostrarHome = mostrarHome

window.crearNotificacion = crearNotificacion
window.mostrarNotificacion = mostrarNotificacion


window.ocultarAnuncio = ocultarAnuncio
window.mostrarAnuncio = mostrarAnuncio

window.mostrarCarga = mostrarCarga
window.ocultarCarga = ocultarCarga
window.configuracionesEntrada = configuracionesEntrada

window.mostrarFormularioProduccion = mostrarFormularioProduccion

document.addEventListener('DOMContentLoaded', async () => {
    await crearNav();
    flotante();
    crearHome();
    crearPerfil();
});






