/* ==================== COMPONENTES ==================== */
import { crearNotificacion, mostrarNotificacion } from './modules/componentes.js'
import { mostrarAnuncio, ocultarAnuncio } from './modules/componentes.js'
import { mostrarCarga, ocultarCarga } from './modules/componentes.js'

window.crearNotificacion = crearNotificacion
window.mostrarNotificacion = mostrarNotificacion


window.ocultarAnuncio = ocultarAnuncio
window.mostrarAnuncio = mostrarAnuncio

window.mostrarCarga = mostrarCarga
window.ocultarCarga = ocultarCarga


/* ==================== FUNCION DE LOS LABELS ==================== */
function configuracionesEntrada() {
    const inputs = document.querySelectorAll('.entrada .input input');
    const loginButton = document.getElementById('loginButton');

    // Auto-login con credenciales guardadas
    const savedCredentials = JSON.parse(localStorage.getItem('credentials'));
    if (savedCredentials) {
        document.querySelector('.email').value = savedCredentials.email;
        document.querySelector('.password').value = savedCredentials.password;

        // Intentar auto-login después de 500ms (tiempo para cargar la página)
        setTimeout(() => {
            if (savedCredentials.email && savedCredentials.password && loginButton) {
                loginButton.click();
            }
        }, 500);
    }

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

    inputs.forEach(input => {
        const label = input.previousElementSibling;

        // Verificar el estado inicial
        if (input.value.trim() !== '') {
            label.style.transform = 'translateY(-100%) scale(0.85)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
        }

        input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-100%) scale(0.85)';
            label.style.color = 'var(--cuarto-color)';
            label.style.fontWeight = '600';
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                label.style.transform = 'translateY(-50%)';
                label.style.color = 'var(--cero-color)';
                label.style.fontWeight = '400';
            }
        });
    });
}

/* ==================== FUNCITION DEL LOGIN ==================== */
function iniciarSesion() {
    const loginButton = document.getElementById('loginButton');

    if (loginButton) {
        loginButton.addEventListener('click', async () => {
            const email = document.querySelector('.email').value;
            const password = document.querySelector('.password').value;
            const rememberMe = document.querySelector('.checkbox input').checked;

            // Basic validation
            if (!email || !password) {
                mostrarNotificacion({
                    message: 'Por favor, complete todos los campos',
                    type: 'warning',
                    duration: 3500
                });
                return;
            }

            // Remove any spaces from email/username
            const cleanEmail = email.trim();

            try {
                mostrarCarga();
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: cleanEmail,
                        password
                    })
                });

                if (!response.ok) {
                    throw new Error('Error en la conexión');
                }

                const data = await response.json();

                if (data.success) {
                    if (rememberMe) {
                        localStorage.setItem('credentials', JSON.stringify({
                            email: cleanEmail,
                            password
                        }));
                    } else {
                        localStorage.removeItem('credentials');
                    }

                    mostrarNotificacion({
                        message: '¡Inicio de sesión exitoso!',
                        type: 'success',
                        duration: 2000
                    });

                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1000);
                } else {
                    // Verificar si es un mensaje de cuenta en proceso
                    if (data.status === 'pending') {
                        mostrarNotificacion({
                            message: data.error,
                            type: 'info',  // Cambiamos el tipo a info
                            duration: 5000  // Aumentamos la duración para este tipo de mensaje
                        });
                    } else {

                        mostrarNotificacion({
                            message: data.error || 'Credenciales incorrectas',
                            type: 'error',
                            duration: 4000
                        });
                        ocultarCarga();
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: 'Error de conexión con el servidor',
                    type: 'error',
                    duration: 4000
                });
                ocultarCarga();
            }
        });

        // Add enter key support for login
        document.querySelectorAll('.email, .password').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    loginButton.click();
                }
            });
        });
    }
}
/* ==================== INICIALIZACIÓN DE LA APP ==================== */
function inicializarApp() {

    const registerLink = document.querySelector('.sin-cuenta span');
    const forgotPasswordLink = document.querySelector('.olvido');
    const moreInfoLink = document.querySelector('.registro.mas-info');

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            crearFormularioContraseña();
        });
    }
    if (registerLink) {
        registerLink.addEventListener('click', (e) => {
            e.preventDefault();
            crearFormularioRegistro();
        });
    }

    if (moreInfoLink) {
        moreInfoLink.addEventListener('click', (e) => {
            e.preventDefault();
            crearFormularioInfo();
        });
    }

    iniciarSesion();
    configuracionesEntrada();
    crearNotificacion();
}

/* ==================== FORMULARIO DE REGISTRO ==================== */
function crearFormularioRegistro() {
    const contenido = document.querySelector('.anuncio .contenido');
    const registrationHTML = `
        <div class="encabezado">
            <h1 class="titulo">Crear cuenta</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
        <p class="normal"><i class='bx bx-chevron-right'></i> Ingresa la información</p>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Nombre</p>
                    <input class="nombre" type="text" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-user'></i>
                <div class="input">
                    <p class="detalle">Apellido</p>
                    <input class="nombre" type="text" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-envelope'></i>
                <div class="input">
                    <p class="detalle">Email/Usuario</p>
                    <input class="email-registro" type="email" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-building'></i>
                <div class="input">
                    <p class="detalle">ID de la Empresa</p>
                    <input class="empresa" type="number" inputmode="numeric" pattern="[0-9]*" placeholder=" " required>
                </div>
            </div>
            <div class="entrada">
                <i class='bx bx-lock'></i>
                <div class="input">
                    <p class="detalle">Contraseña</p>
                    <input class="password-registro" type="password" placeholder=" " autocomplete="new-password" required>
                    <button class="toggle-password"><i class="fas fa-eye"></i></button>
                </div>
            </div>
            <div class="password-requirements campo-vertical">
                <p>Requisitos de contraseña: </p>
                <p class="requirement invalid item">
                    <i class="fas fa-times"></i>
                    Mínimo 8 caracteres
                </p>
                <p class="requirement invalid item">
                    <i class="fas fa-times"></i>
                    Debe contener letras
                </p>
                <p class="requirement invalid item">
                    <i class="fas fa-times"></i>
                    Debe contener números
                </p>
            </div>
            
        </div>
        <div class="anuncio-botones">
            <button id="register-button" class="btn orange"><i class="bx bx-user-plus"></i> Registrarme</button>
        </div>
        
    `;

    contenido.innerHTML = registrationHTML;
    mostrarAnuncio();

    eventosFormularioRegistro();

}
function eventosFormularioRegistro() {
    crearNotificacion();
    const nombreInput = document.querySelector('.entrada:nth-child(2) .input .nombre');  // Corregido el selector
    const apellidoInput = document.querySelector('.entrada:nth-child(3) .input .nombre'); // Corregido el selector
    const emailInput = document.querySelector('.email-registro');
    const passwordInput = document.querySelector('.password-registro');
    const empresaInput = document.querySelector('.empresa');
    const registerButton = document.getElementById('register-button');


    [nombreInput, apellidoInput].forEach(input => {
        input.addEventListener('input', (e) => {
            const words = e.target.value.split(' ');
            const capitalizedWords = words.map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            );
            e.target.value = capitalizedWords.join(' ');
        });
    });

    const emailContainer = emailInput.parentElement;
    const validationIcon = document.createElement('i');
    validationIcon.className = 'validation-icon fas';
    emailContainer.appendChild(validationIcon);

    let timeoutId;
    const debounce = (func, delay) => {
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func(...args), delay);
        };
    };

    const validateEmail = debounce(async (email) => {
        try {
            validationIcon.className = 'validation-icon fas fa-spinner fa-spin';
            
            const response = await fetch('/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) throw new Error('Error en la petición');

            validationIcon.className = `validation-icon fas ${data.exists ? 'fa-times error' : 'fa-check success'}`;
            
            if (data.exists) {
                mostrarNotificacion({
                    message: 'Este usuario ya existe',
                    type: 'warning',
                    duration: 3000
                });
            }
        } catch (error) {
            console.error('Error:', error);
            validationIcon.className = 'validation-icon fas fa-exclamation-triangle warning';
        }
    }, 500);

    emailInput.addEventListener('input', (e) => {
        const email = e.target.value.trim();
        
        // Limpiar espacios automáticamente
        if (email !== e.target.value) {
            e.target.value = email;
        }
        
        if (email) {
            validateEmail(email);
        } else {
            validationIcon.className = 'validation-icon fas fa-times error';
        }
    });


    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const requirements = {
            length: password.length >= 8,
            letters: /[a-zA-Z]/.test(password),
            numbers: /[0-9]/.test(password)
        };

        document.querySelectorAll('.requirement').forEach((elem, index) => {
            const isValid = Object.values(requirements)[index];
            elem.className = `requirement ${isValid ? 'valid' : 'invalid'} item`;
            elem.querySelector('i').className = `fas ${isValid ? 'fa-check' : 'fa-times'}`;
        });
    });
    registerButton.addEventListener('click', async () => {
        const nombre = nombreInput.value.trim();
        const apellido = apellidoInput.value.trim();
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        const email = emailInput.value;
        const password = passwordInput.value;
        const empresa = empresaInput.value;

        // Validar campos vacíos
        if (!nombre || !apellido || !email || !password || !empresa) {
            mostrarNotificacion({
                message: 'Por favor, complete todos los campos',
                type: 'warning',
                duration: 3500
            });
            return;
        }

        // Validar formato de email
        if (email.includes(' ')) {
            mostrarNotificacion({
                message: 'El usuario/email no debe contener espacios',
                type: 'warning',
                duration: 3500
            });
            return;
        }

        // Validar requisitos de contraseña
        const passwordRequirements = {
            length: password.length >= 8,
            letters: /[a-zA-Z]/.test(password),
            numbers: /[0-9]/.test(password)
        };

        if (!Object.values(passwordRequirements).every(Boolean)) {
            mostrarNotificacion({
                message: 'La contraseña debe cumplir con todos los requisitos',
                type: 'warning',
                duration: 4000
            });
            return;
        }

        // Verificar email antes de registrar
        try {
            mostrarCarga();
            const checkEmailResponse = await fetch('/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const emailData = await checkEmailResponse.json();
            if (emailData.exists) {
                mostrarNotificacion({
                    message: 'Este usuario ya existe',
                    type: 'warning',
                    duration: 3500
                });
                ocultarCarga();
                return;
            }

            // Si el email no existe, proceder con el registro
            const registerResponse = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nombreCompleto,
                    email,
                    password,
                    empresa
                })
            });

            const registerData = await registerResponse.json();
            if (registerData.success) {
                mostrarNotificacion({
                    message: registerData.message || '¡Registro exitoso!',
                    type: 'success',
                    duration: 4000
                });
                ocultarAnuncio();
            } else {
                throw new Error(registerData.error || 'Error en el registro');
            }
        } catch (error) {
            mostrarNotificacion({
                message: error.message || 'Error al registrar usuario',
                type: 'error',
                duration: 4000
            });
        } finally {
            ocultarCarga();
        }
    });
}

/* ==================== FORMULARIO DE OLVIDO DE CONTRASEÑA ==================== */
function crearFormularioContraseña() {
    const anuncio = document.querySelector('.anuncio .contenido');
    const forgotPasswordHTML = `
        <div class="encabezado">
            <h1 class="titulo">Recuperación de contraseña</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p><i class='bx bx-chevron-right'></i> Ingresa tu correo electrónico para recibir un código de verificación</p>
            <div class="entrada">
                <i class='bx bx-envelope'></i>
                <div class="input">
                    <p class="detalle">Email</p>
                    <input class="email-recuperacion" type="email" placeholder=" " required>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button id="send-code-button" class="btn orange"><i class="bx bx-envelope"></i> Enviar Código</button>
        </div>
    `;

    anuncio.innerHTML = forgotPasswordHTML;
    mostrarAnuncio();

    eventosFormularioContraseña();
}
function eventosFormularioContraseña() {
    const sendCodeButton = document.getElementById('send-code-button');
    const inputs = document.querySelectorAll('.entrada .input input');

    inputs.forEach(input => {
        const label = input.previousElementSibling;

        // Verificar el estado inicial
        if (input.value.trim() !== '') {
            label.style.transform = 'translateY(-100%) scale(0.85)';
            label.style.color = 'var(--tercer-color)';
            label.style.fontWeight = '600';
        }

        input.addEventListener('focus', () => {
            label.style.transform = 'translateY(-100%) scale(0.85)';
            label.style.color = 'var(--tercer-color)';
            label.style.fontWeight = '600';
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                label.style.transform = 'translateY(-50%)';
                label.style.color = 'var(--cero-color)';
                label.style.fontWeight = '400';
            }
        });
    });
    sendCodeButton.addEventListener('click', async () => {
        const email = document.querySelector('.email-recuperacion').value;

        try {
            mostrarCarga();
            const response = await fetch('/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (data.success) {
                renderVerificationCodeForm(email);
            } else {
                alert(data.error || 'Error al enviar el código');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al enviar el código');
        } finally {
            ocultarCarga();
        }
    });
}

/* ==================== FORMULARIO DE INGRESO DE CODIGO DE RESETEO ==================== */
function renderVerificationCodeForm(email) {
    const anuncio = document.querySelector('.anuncio');
    const verificationHTML = `
        <div class="contenido">
            <h2>Verificar Código</h2>
            <p class="subtitulo">Ingresa el código enviado a tu correo electrónico</p>
            <div class="entrada">
                <i class='bx bx-check-circle'></i>
                <div class="input">
                    <p class="detalle">Código de Verificación</p>
                    <input class="codigo-verificacion" type="text" placeholder=" " required>
                </div>
            </div>
            <button id="verify-code-button" class="btn orange">Verificar Código</button>
            <button id="cancel-verification" class="btn gray">Cancelar</button>
            <p class="resend">¿No recibiste el código? <span id="resend-code">Reenviar</span></p>
        </div>
    `;

    anuncio.innerHTML = verificationHTML;
    setupVerificationCodeListeners(email);
}
function setupVerificationCodeListeners(email) {
    const verifyButton = document.getElementById('verify-code-button');
    const resendButton = document.getElementById('resend-code');
    const inputs = document.querySelectorAll('.entrada .input input');

    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const label = input.previousElementSibling;
            label.style.top = '0';
            label.style.fontSize = '12px';
            label.style.color = 'var(--tercer-color)';
            label.style.fontWeight = '600';
        });

        input.addEventListener('blur', () => {
            const label = input.previousElementSibling;
            if (!input.value) {
                label.style.top = '50%';
                label.style.fontSize = 'var(--text-subtitulo)';
                label.style.color = 'var(--cero-color)';
                label.style.fontWeight = '400';
            }
        });
    });

    verifyButton.addEventListener('click', async () => {
        const code = document.querySelector('.codigo-verificacion').value;

        try {
            mostrarCarga();
            const response = await fetch('/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, code })
            });

            const data = await response.json();
            if (data.success) {
                alert('Código verificado correctamente');
                // Here you can redirect to password reset page or show password reset form
                ocultarAnuncio();
            } else {
                alert(data.error || 'Código inválido');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al verificar el código');
        } finally {
            ocultarCarga();
        }
    });

    resendButton.addEventListener('click', async () => {
        try {
            mostrarCarga();
            const response = await fetch('/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            if (data.success) {
                alert('Código reenviado correctamente');
            } else {
                alert(data.error || 'Error al reenviar el código');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al reenviar el código');
        } finally {
            ocultarCarga();
        }
    });

}


function crearFormularioInfo() {
    const anuncio = document.querySelector('.anuncio .contenido');
    const companyInfoHTML = `
         <div class="encabezado">
            <h1 class="titulo">Información</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p><i class='bx bx-chevron-right'></i>  Desarrollamos sistemas a medida para optimizar tus procesos.</p>
            <p><i class='bx bx-chevron-right'></i>  Quieres agregar tu empresa a la comunidad de Gestipro?</p>
            <p><i class='bx bx-chevron-right'></i>  Contactanos.</p>
            <button class="btn orange" onclick="window.open('https://wa.me/+59169713972?text=Más%20información%20sobre%20Gestipro%20por%20favor', '_blank')">Contactar por WhatsApp</button>
        </div>
    `;

    anuncio.innerHTML = companyInfoHTML;
    mostrarAnuncio();
}

function setTheme(theme) {
    const root = document.documentElement;
    localStorage.setItem('theme', theme);

    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        root.setAttribute('data-theme', theme);
    }
}
function verificarTemaInicial() {
    const savedTheme = localStorage.getItem('theme');
    if (!savedTheme) {
        localStorage.setItem('theme', 'system');
    }
    setTheme(savedTheme || 'system');
}
document.addEventListener('DOMContentLoaded', async () => {
    await verificarTemaInicial();
    inicializarApp();
});
