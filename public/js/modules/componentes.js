export async function mostrarAnuncio() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.transform = 'translateX(100%)';
    anuncio.style.display = 'flex';
    anuncio.offsetHeight;
    anuncio.classList.add('slide-in');

    // Agregar estado al historial
    const currentState = history.state || {};
    window.history.pushState({ ...currentState, anuncioAbierto: true }, '');

    // Manejar el botón atrás
    const handlePopState = async () => {
        const anuncioVisible = document.querySelector('.anuncio')?.style.display === 'flex';
        if (anuncioVisible) {
            await ocultarAnuncio();
            anuncio.removeEventListener('touchstart', handleTouchStart);
            anuncio.removeEventListener('touchmove', handleTouchMove);
        }
    };

    window.removeEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePopState, { once: true });

    // Solo agregamos el evento de clic si no es la selección inicial de empresa
    const isSpreadsheetSelection = anuncio.querySelector('#spreadsheet-select');
    if (!isSpreadsheetSelection) {
        anuncio.addEventListener('click', async (e) => {
            if (e.target === anuncio) {
                e.preventDefault();
                await ocultarAnuncio();
                anuncio.removeEventListener('touchstart', handleTouchStart);
                anuncio.removeEventListener('touchmove', handleTouchMove);
                history.back();
            }
        });

        const contenido = anuncio.querySelector('.contenido');
        if (contenido) {
            contenido.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    configuracionesEntrada();
}
export async function mostrarAnuncioSecond() {
    const anuncio = document.querySelector('.anuncio-second');
    anuncio.style.transform = 'translateX(100%)';
    anuncio.style.display = 'flex';
    anuncio.offsetHeight;
    anuncio.classList.add('slide-in');


    // Agregar estado al historial
    const currentState = history.state || {};
    window.history.pushState({ ...currentState, anuncioAbierto: true }, '');

    // Manejar el botón atrás
    const handlePopState = async () => {
        const anuncioVisible = document.querySelector('.anuncio')?.style.display === 'flex';
        if (anuncioVisible) {
            await ocultarAnuncioSecond();
            anuncio.removeEventListener('touchstart', handleTouchStart);
            anuncio.removeEventListener('touchmove', handleTouchMove);
        }
    };

    window.removeEventListener('popstate', handlePopState);
    window.addEventListener('popstate', handlePopState, { once: true });

    // Solo agregamos el evento de clic si no es la selección inicial de empresa
    const isSpreadsheetSelection = anuncio.querySelector('#spreadsheet-select');
    if (!isSpreadsheetSelection) {
        anuncio.addEventListener('click', async (e) => {
            if (e.target === anuncio) {
                e.preventDefault();
                await ocultarAnuncioSecond();
                anuncio.removeEventListener('touchstart', handleTouchStart);
                anuncio.removeEventListener('touchmove', handleTouchMove);
                history.back();
            }
        });

        const contenido = anuncio.querySelector('.contenido');
        if (contenido) {
            contenido.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }
    }
    configuracionesEntrada();
}
export async function ocultarAnuncio() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = document.querySelector('.anuncio .contenido');

    if (!anuncio || anuncio.style.display === 'none') return;
    
    anuncio.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 300));
    anuncio.style.display = 'none';
    anuncio.classList.remove('slide-out', 'slide-in');
    contenido.style.paddingBottom = '75px';
}
export async function ocultarAnuncioSecond() {
    const anuncio = document.querySelector('.anuncio-second');
    const contenido = document.querySelector('.anuncio-second .contenido');

    if (!anuncio || anuncio.style.display === 'none') return;
    
    anuncio.classList.add('slide-out');
    await new Promise(resolve => setTimeout(resolve, 300));
    anuncio.style.display = 'none';
    anuncio.classList.remove('slide-out', 'slide-in');
    contenido.style.paddingBottom = '75px';
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


export function configuracionesEntrada() {
    const inputs = document.querySelectorAll('.entrada .input input, .entrada .input select');

    inputs.forEach(input => {
        const label = input.previousElementSibling;
        
        // Verificar el estado inicial
        if (input.value.trim() !== '') {
            label.style.transform = 'translateY(-100%) scale(0.85)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
        }

        input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-100%) scale(0.85)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
            label.style.zIndex = '5';
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                label.style.transform = 'translateY(-50%)';
                label.style.color = 'var(--cero-color)';
                label.style.fontWeight = '400';
            }
        });

        // Para los select, también manejar el evento de cambio
        if (input.tagName.toLowerCase() === 'select') {
            input.addEventListener('change', () => {
                if (input.value.trim()) {
                    label.style.transform = 'translateY(-100%) scale(0.85)';
                    label.style.color = 'var(--cuarto-color)';
                    label.style.fontWeight = '600';
                    label.style.zIndex = '5';
                } else {
                    label.style.transform = 'translateY(-50%)';
                    label.style.color = 'var(--cero-color)';
                    label.style.fontWeight = '400';
                }
            });
        }
    });

    // Limpiar input de email
    const clearInputButton = document.querySelector('.clear-input');
    if (clearInputButton) {
        clearInputButton.addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.querySelector('.email');
            const label = emailInput.previousElementSibling;
            emailInput.value = '';

            // Forzar la actualización del label
            label.style.top = '50%';
            label.style.fontSize = 'var(--text-subtitulo)';
            label.style.color = 'var(--cero-color)';
            label.style.fontWeight = '400';

            // Disparar evento blur manualmente
            const blurEvent = new Event('blur');
            emailInput.dispatchEvent(blurEvent);

            // Disparar evento focus manualmente
            emailInput.focus();
            const focusEvent = new Event('focus');
            emailInput.dispatchEvent(focusEvent);
        });
    }

    // Mostrar/ocultar contraseña para el formulario de inicio de sesión
    document.querySelectorAll('.toggle-password').forEach(toggleButton => {
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            const passwordInput = toggleButton.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = toggleButton.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    const savedCredentials = JSON.parse(localStorage.getItem('credentials'));
    if (savedCredentials) {
        document.querySelector('.email').value = savedCredentials.email;
        document.querySelector('.password').value = savedCredentials.password;
    }
}
export async function registrarHistorial(origen, suceso, detalle) {
    try {
        mostrarCarga();
        const response = await fetch('/registrar-historial', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origen,
                suceso,
                detalle
            })
        });

        const data = await response.json();

        if (data.success) {
            return true;
        } else {
            mostrarNotificacion({
                message: data.error || 'Error al registrar historial',
                type: 'error',
                duration: 3500
            });
            return false;
        }
    } catch (error) {
        console.error('Error al registrar historial:', error);
        mostrarNotificacion({
            message: 'Error al registrar historial',
            type: 'error',
            duration: 3500
        });
        return false;
    } finally {
        ocultarCarga();
    }
}