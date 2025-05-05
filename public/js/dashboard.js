import { crearHome } from './modules/home.js';
import { crearNav } from './modules/nav.js'
import { crearPerfil } from './modules/perfil.js';
import { flotante } from './modules/flotante.js';

document.addEventListener('DOMContentLoaded', () => {
    flotante();
    crearNav();
    crearHome();
    crearPerfil();
});






