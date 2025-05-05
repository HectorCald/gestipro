import { crearNotificacion, mostrarNotificacion, mostrarAnuncio, ocultarAnuncio, mostrarCarga, ocultarCarga, configuracionesEntrada } from './modules/componentes.js'
import { crearHome } from './modules/home.js';
import { crearNav } from './modules/nav.js'
import { crearPerfil } from './modules/perfil.js';
import { flotante } from './modules/flotante.js';

window.crearNotificacion = crearNotificacion
window.mostrarNotificacion = mostrarNotificacion


window.ocultarAnuncio = ocultarAnuncio
window.mostrarAnuncio = mostrarAnuncio

window.mostrarCarga = mostrarCarga
window.ocultarCarga = ocultarCarga
window.configuracionesEntrada = configuracionesEntrada


document.addEventListener('DOMContentLoaded',async () => {
    await flotante();
    await crearNav();
    await crearHome();
    await crearPerfil();
});






