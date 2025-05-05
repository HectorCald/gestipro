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
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion({
                    message: 'Error de conexión con el servidor',
                    type: 'error',
                    duration: 4000
                });
            } finally {

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
    const anuncio = document.querySelector('.anuncio');
    const registrationHTML = `
        <div class="contenido">
            <h1 class="bienvenida">Registrate en Gestipro</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
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
                    <input class="password-registro" type="password" placeholder=" " required>
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
            <button id="register-button" class="btn orange">Solicitar unirme</button>
        </div>
        
    `;

    anuncio.innerHTML = registrationHTML;
    mostrarAnuncio();

    eventosFormularioRegistro();

}
function eventosFormularioRegistro() {
    crearNotificacion();
    const registerButton = document.getElementById('register-button');
    const inputs = document.querySelectorAll('.entrada .input input');
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    const nombreInput = document.querySelector('.entrada:nth-child(3) .input .nombre');
    const apellidoInput = document.querySelector('.entrada:nth-child(4) .input .nombre');
    const emailInput = document.querySelector('.email-registro');
    const passwordInput = document.querySelector('.password-registro');
    const empresaInput = document.querySelector('.empresa');


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
        if (!email || email.trim() === '') {
            validationIcon.className = '';
            validationIcon.classList.add('validation-icon', 'fas', 'fa-times', 'error');
            return;
        }

        try {
            validationIcon.className = '';
            validationIcon.classList.add('validation-icon', 'fas', 'fa-spinner', 'fa-spin');

            const response = await fetch('/check-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) throw new Error('Error en la petición');

            const data = await response.json();

            if (data.exists) {
                validationIcon.className = '';
                validationIcon.classList.add('validation-icon', 'fas', 'fa-times', 'error');
                mostrarNotificacion({
                    message: 'Este usuario ya existe',
                    type: 'warning',
                    duration: 3000
                });
            } else {
                validationIcon.className = '';
                validationIcon.classList.add('validation-icon', 'fas', 'fa-check', 'success');
            }
        } catch (error) {
            console.error('Error:', error);
            validationIcon.className = '';
            validationIcon.classList.add('validation-icon', 'fas', 'fa-exclamation-triangle', 'warning');
        }
    }, 500);

    emailInput.addEventListener('input', (e) => {
        validateEmail(e.target.value);
    });


    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const passwordInput = e.currentTarget.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = e.currentTarget.querySelector('i');

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



    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const requirements = {
            length: password.length >= 8,
            letters: /[a-zA-Z]/.test(password),
            numbers: /[0-9]/.test(password)
        };

        const requirementElements = document.querySelectorAll('.requirement');
        requirementElements[0].className = `requirement ${requirements.length ? 'valid' : 'invalid'}`;
        requirementElements[0].querySelector('i').className = `fas ${requirements.length ? 'fa-check' : 'fa-times'}`;

        requirementElements[1].className = `requirement ${requirements.letters ? 'valid' : 'invalid'}`;
        requirementElements[1].querySelector('i').className = `fas ${requirements.letters ? 'fa-check' : 'fa-times'}`;

        requirementElements[2].className = `requirement ${requirements.numbers ? 'valid' : 'invalid'}`;
        requirementElements[2].querySelector('i').className = `fas ${requirements.numbers ? 'fa-check' : 'fa-times'}`;
    });
    registerButton.addEventListener('click', async () => {
        const nombre = nombreInput.value.trim();
        const apellido = apellidoInput.value.trim();
        const nombreCompleto = `${nombre} ${apellido}`.trim();
        const email = emailInput.value;
        const password = passwordInput.value;
        const empresa = empresaInput.value;



        // Validate that all fields are complete
        if (!nombre || !apellido || !email || !password || !empresa) {
            mostrarNotificacion({
                message: 'Por favor, complete todos los campos',
                type: 'warning',
                duration: 3500
            });
            return;
        }

        // Validate email format
        if (email.includes(' ')) {
            mostrarNotificacion({
                message: 'El usuario/email no debe contener espacios',
                type: 'warning',
                duration: 3500
            });
            return;
        }


        // Validate password requirements
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

        // Validate that the email does not exist
        const validationIcon = emailInput.parentElement.querySelector('.validation-icon');
        if (validationIcon && validationIcon.classList.contains('error')) {
            mostrarNotificacion({
                message: 'El email o usuario ya está registrado',
                type: 'warning',
                duration: 3500
            });
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: nombreCompleto, // Enviamos el nombre completo
                    email,
                    password,
                    empresa
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion({
                    message: data.message || '¡Registro exitoso!',
                    type: 'success',
                    duration: 4000
                });
                ocultarAnuncio();
            } else {
                mostrarNotificacion({
                    message: data.error || 'Error en el registro',
                    type: 'error',
                    duration: 4000
                });
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion({
                message: 'Error de conexión',
                type: 'error',
                duration: 4000
            });
        } finally {
            ocultarCarga();
        }
    });
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
}

/* ==================== FORMULARIO DE OLVIDO DE CONTRASEÑA ==================== */
function crearFormularioContraseña() {
    const anuncio = document.querySelector('.anuncio');
    const forgotPasswordHTML = `
        <div class="contenido">
            <h1 class="bienvenida">Olvidaste tu contraseña?</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <p class="subtitulo">Ingresa tu correo electrónico para recibir un código de verificación</p>
            <div class="entrada">
                <i class='bx bx-envelope'></i>
                <div class="input">
                    <p class="detalle">Email</p>
                    <input class="email-recuperacion" type="email" placeholder=" " required>
                </div>
            </div>
            <button id="send-code-button" class="btn orange">Enviar Código</button>
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
    const anuncio = document.querySelector('.anuncio');
    const companyInfoHTML = `
        <div class="contenido">
            <h1 class="bienvenida">Información</h1>
            <button class="btn close" onclick="ocultarAnuncio();"><i class="fas fa-arrow-right"></i></button>
            <p>Desarrollamos sistemas a medida para optimizar tus procesos.</p>
            <p>Quieres agregar tu empresa a la comunidad de Gestipro?</p>
            <p>Contactanos.</p>
            <button class="btn green" onclick="window.open('https://wa.me/+59169713972?text=Más%20información%20sobre%20Gestipro%20por%20favor', '_blank')">Contactar por WhatsApp</button>
        </div>
    `;

    anuncio.innerHTML = companyInfoHTML;
    mostrarAnuncio();
}



document.addEventListener('DOMContentLoaded', () => {
    inicializarApp();
});
