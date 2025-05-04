import { crearHome } from './modules/home.js';
import { crearNav } from './modules/nav.js'
window.crearHome = crearHome;

document.addEventListener('DOMContentLoaded', () => {
    crearNav();
    crearHome();
});






