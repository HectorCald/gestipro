export async function mostrarAnuncio() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.transform = 'translateX(100%)';
    anuncio.style.display = 'flex';
    // Force reflow
    anuncio.offsetHeight;
    anuncio.classList.add('slide-in');

    // Solo agregamos el evento de clic si no es la selección inicial de empresa
    const isSpreadsheetSelection = anuncio.querySelector('#spreadsheet-select');
    if (!isSpreadsheetSelection) {
        anuncio.addEventListener('click', (e) => {
            if (e.target === anuncio) {
                e.preventDefault();
                ocultarAnuncio();
            }
        });

        const contenido = anuncio.querySelector('.contenido');
        if (contenido) {
            contenido.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
}
export async function ocultarAnuncio() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.classList.add('slide-out');
    // Wait for animation to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    anuncio.style.display = 'none';
    anuncio.classList.remove('slide-out', 'slide-in');
}



export function mostrarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'flex';
}
export function ocultarCarga() {
    const cargaDiv = document.querySelector('.carga');
    cargaDiv.style.display = 'none';
}


export function crearNotificacion() {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
    return container;
}
export function mostrarNotificacion({ message, type = 'info', duration = 3000 }) {
    const container = document.querySelector('.notification-container') || crearNotificacion();

    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="${icons[type]}"></i>
        <span>${message}</span>
    `;

    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let timeoutId;

    function startDragging(e) {
        isDragging = true;
        startX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
        notification.classList.add('dragging');
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    }

    function drag(e) {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const diffX = currentX - startX;

        if (diffX > 0) {
            // Mantener la posición vertical mientras se arrastra horizontalmente
            notification.style.transform = `translateY(10px) translateX(${diffX}px)`;
        }
    }

    function endDragging() {
        if (!isDragging) return;
        isDragging = false;
        notification.classList.remove('dragging');

        const diffX = currentX - startX;
        if (diffX > 200) {
            notification.classList.add('slide-right');
            setTimeout(() => notification.remove(), 300);
        } else {
            // Restaurar la posición original manteniendo el translateY
            notification.style.transform = 'translateY(20px)';
            notification.style.transition = 'transform 0.3s ease-out';
            setTimeout(() => {
                notification.style.transition = '';
                timeoutId = setTimeout(closeNotification, duration);
            }, 300);
        }
    }

    function closeNotification() {
        if (notification.parentElement && !isDragging) {
            notification.classList.add('hide');
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => {
                notification.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, { once: true });
        }
    }

    notification.addEventListener('mousedown', startDragging);
    notification.addEventListener('touchstart', startDragging, { passive: true });
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDragging);
    document.addEventListener('touchend', endDragging);

    container.appendChild(notification);
    notification.offsetHeight;
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });

    timeoutId = setTimeout(closeNotification, duration);
}