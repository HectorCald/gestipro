/* ==================== IMPORTACIONES==================== */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

/* ==================== CONFIGURACIÓN INICIAL ==================== */
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = 'secret-totalprod-hcco';

/* ==================== CONFIGURACIÓN DE GOOGLE SHEETS ==================== */
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'damabrava@producciondb.iam.gserviceaccount.com',
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/spreadsheets"
    ]
});

/* ==================== MIDDLEWARES Y CONFIGURACIÓN DE APP ==================== */
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(join(__dirname, 'public'), {
    setHeaders: (res, path) => {
        // Cabecera para evitar caché
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        } else if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.json')) {
            if (path.includes('assetlinks.json')) {
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Access-Control-Allow-Origin', '*');
            } else {
                res.setHeader('Content-Type', 'application/manifest+json');
            }
        }
    }
}));
app.use('/.well-known', express.static(join(__dirname, 'public/.well-known')));
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

/* ==================== FUNCIONES DE UTILIDAD ==================== */
function requireAuth(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.redirect('/');
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}
/* ==================== RUTAS DE VISTAS ==================== */
app.get('/', (req, res) => {
    const token = req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            // Determine dashboard URL based on spreadsheet ID from token
            const dashboardUrl = decoded.spreadsheetId === process.env.SPREADSHEET_ID_1
                ? '/dashboard'
                : '/dashboard_otro';
            return res.redirect(dashboardUrl);
        } catch (error) {
            // Token inválido, continuar al login
        }
    }

    res.render('login');
});
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard')
});
app.get('/dashboard_otro', requireAuth, (req, res) => {
    res.render('dashboard_otro')
});

/* ==================== RUTAS DE AUTENTICACION ==================== */
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const spreadsheetIds = [
        process.env.SPREADSHEET_ID_1,
        process.env.SPREADSHEET_ID_2
    ];
    try {
        const sheets = google.sheets({ version: 'v4', auth });

        for (const spreadsheetId of spreadsheetIds) {
            try {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: 'Usuarios!A2:F'
                });

                const rows = response.data.values || [];

                const usuario = rows.find(row => {
                    if (row && row.length >= 6) {
                        return row[0] === password && row[5] === email;
                    }
                    return false;
                });

                if (usuario) {
                    if (usuario[3] === 'Activo') {
                        const token = jwt.sign(
                            {
                                email: usuario[5],
                                nombre: usuario[1],
                                spreadsheetId
                            },
                            JWT_SECRET,
                            { expiresIn: '744h' }
                        );

                        res.cookie('token', token, {
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 días en milisegundos
                        });


                        // Determine dashboard URL based on spreadsheet ID
                        const dashboardUrl = spreadsheetId === process.env.SPREADSHEET_ID_1 ? '/dashboard' : '/dashboard_otro';

                        return res.json({
                            success: true,
                            redirect: dashboardUrl,
                            user: {
                                nombre: usuario[1],
                                email: usuario[5]
                            }
                        });
                    } else {
                        return res.json({
                            success: false,
                            error: 'Su cuenta está siendo procesada.',
                            status: 'pending'
                        });
                    }
                }
            } catch (sheetError) {
                console.error(`Error accessing spreadsheet ${spreadsheetId}:`, sheetError);
            }
        }

        return res.json({
            success: false,
            error: 'Contraseña o usuario incorrectos'
        });

    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({
            success: false,
            error: 'Error en el servidor'
        });
    }
});
app.post('/check-email', async (req, res) => {
    const { email } = req.body;

    // List of all spreadsheet IDs
    const spreadsheetIds = [
        process.env.SPREADSHEET_ID_1,
        process.env.SPREADSHEET_ID_2
        // Add more spreadsheet IDs as needed
    ];

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        for (const spreadsheetId of spreadsheetIds) {
            try {
                const response = await sheets.spreadsheets.values.get({
                    spreadsheetId: spreadsheetId,
                    range: 'Usuarios!F2:F'
                });

                const emails = response.data.values || [];
                const exists = emails.some(row => row[0]?.toLowerCase() === email.toLowerCase());

                if (exists) {
                    return res.json({ exists: true });
                }
            } catch (sheetError) {
                console.error(`Error accessing spreadsheet ${spreadsheetId}:`, sheetError);
            }
        }

        return res.json({ exists: false });

    } catch (error) {
        console.error('Error al verificar email:', error);
        return res.status(500).json({
            error: 'Error al verificar el email',
            exists: false
        });
    }
});
app.post('/register', async (req, res) => {
    const { nombre, email, password, empresa } = req.body;

    // Predefined list of companies and their spreadsheet IDs
    const companies = {
        '12345': process.env.SPREADSHEET_ID_1,
        '6789': process.env.SPREADSHEET_ID_2
    };

    // Validate if the company exists
    const spreadsheetId = companies[empresa];
    if (!spreadsheetId) {
        return res.json({
            success: false,
            error: 'El ID de la empresa es incorrecto o no existe'
        });
    }

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Prepare the new user data
        const nuevoUsuario = [
            password,         // CONTRASEÑA (A)
            nombre,          // NOMBRE (B)
            '',             // ROL (C) - vacío
            'Pendiente',    // ESTADO (D)
            '',             // PLUGINS (E) - vacío
            email           // EMAIL-USUARIO (F)
        ];

        // Add the user to the spreadsheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId, // Use the ID based on the company
            range: 'Usuarios!A:F',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [nuevoUsuario]
            }
        });

        return res.json({ success: true, message: 'Solicitud realizada exitosamente' });
    } catch (error) {
        console.error('Error en el registro:', error);
        return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});
app.post('/cerrar-sesion', (req, res) => {
    res.clearCookie('token');
    res.json({ mensaje: 'Sesión cerrada correctamente' });
});

/* ==================== RUTAS DE HISTORIAL ==================== */
app.post('/registrar-historial', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { origen, suceso, detalle } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Get last ID to generate new one
        const lastIdResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Historial!A2:A'
        });

        const lastId = lastIdResponse.data.values ?
            Math.max(...lastIdResponse.data.values.map(row => parseInt(row[0].split('-')[1]) || 0)) : 0;
        const newId = `HI-${(lastId + 1).toString().padStart(3, '0')}`;

        const newRow = [
            newId,              // ID
            origen,            // ORIGEN
            suceso,            // SUCESO
            detalle            // DETALLE
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Historial!A:D',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [newRow]
            }
        });

        res.json({
            success: true,
            message: 'Historial registrado correctamente'
        });

    } catch (error) {
        console.error('Error al registrar historial:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar el historial'
        });
    }
});
app.get('/obtener-historial', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Historial!A2:E' // Columns A through E
        });

        const rows = response.data.values || [];

        // Map the data to the specified format
        const historial = rows.map(row => ({
            id: row[0] || '',
            fecha: row[1] || '',
            destino: row[2] || '',
            suceso: row[3] || '',
            detalle: row[4] || ''
        }));

        res.json({
            success: true,
            historial
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el historial'
        });
    }
});

/* ==================== OBTENER USARIO ACTUAL Y ACTULIZAR USARIO ACTUAL ==================== */
app.get('/obtener-usuario-actual', requireAuth, async (req, res) => {
    const { email, spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Usuarios!A2:G'  // Make sure we're getting all columns including the photo
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[5] === email);

        if (usuario) {
            // Ensure all fields are properly handled
            const userInfo = {
                nombre: usuario[1] || '',
                rol: usuario[2] || '',
                estado: usuario[3] || '',
                plugins: usuario[4] || '',
                email: usuario[5] || '',
                foto: usuario[6] || './icons/icon.png'  // Default photo if none exists
            };

            res.json({
                success: true,
                usuario: userInfo
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del usuario'
        });
    }
});
app.post('/actualizar-usuario', requireAuth, async (req, res) => {
    const { email, spreadsheetId } = req.user;
    const { nombre, apellido, passwordActual, passwordNueva, foto } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener fila actual
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Usuarios!A2:G',
        });

        const rows = response.data.values || [];
        const userRow = rows.find(row => row[5] === email); // Email está en columna F (índice 5)

        if (!userRow) {
            return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        // Validar contraseña actual si se está cambiando
        if (passwordNueva) {
            if (passwordActual !== userRow[0]) {
                return res.status(400).json({
                    success: false,
                    error: 'Contraseña actual incorrecta'
                });
            }

            if (passwordNueva.length < 8) {
                return res.status(400).json({
                    success: false,
                    error: 'La nueva contraseña debe tener al menos 8 caracteres'
                });
            }
        }

        // Actualizar datos
        const updateData = [
            passwordNueva || userRow[0], // Columna A: Contraseña
            `${nombre} ${apellido}`.trim(), // Columna B: Nombre completo
            userRow[2], // Columna C: Mantener rol
            userRow[3], // Columna D: Mantener estado
            userRow[4], // Columna E: Mantener plugins
            email, // Columna F: Email
            foto || userRow[6] // Columna G: Foto
        ];

        const rowIndex = rows.findIndex(row => row[5] === email) + 2; // +2 porque la hoja empieza en fila 2

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Usuarios!A${rowIndex}:G${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [updateData] }
        });

        res.json({ success: true });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            error: 'Error interno del servidor'
        });
    }
});
app.get('/obtener-usuarios-produccion', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Usuarios!A2:F' // Get all relevant user columns
        });

        const rows = response.data.values || [];

        // Filter users with "Producción" role and map to desired format
        const usuarios = rows
            .filter(row => row[2] === 'Producción') // Column C contains the role
            .map(row => ({
                id: row[0] || '',        // Password/ID
                nombre: row[1] || '',     // Name
                rol: row[2] || '',        // Role
                estado: row[3] || '',     // Status
                plugins: row[4] || '',    // Plugins
                email: row[5] || ''       // Email
            }));

        res.json({
            success: true,
            usuarios
        });

    } catch (error) {
        console.error('Error al obtener usuarios de producción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los usuarios de producción'
        });
    }
});

/* ==================== RUTAS DE PRODUCCIÓN ==================== */
app.get('/obtener-registros-produccion', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Produccion!A2:O' // Columnas desde A hasta N (14 columnas)
        });

        const rows = response.data.values || [];

        // Mapear los datos a un formato más legible
        const registros = rows.map(row => ({
            id: row[0] || '',
            fecha: row[1] || '',
            idProducto: row[2] || '',
            producto: row[3] || '',
            lote: row[4] || '',
            gramos: row[5] || '',
            proceso: row[6] || '',
            microondas: row[7] || '',
            envases_terminados: row[8] || '',
            fecha_vencimiento: row[9] || '',
            nombre: row[10] || '',
            user: row[11] || '',
            c_real: row[12] || '',
            fecha_verificacion: row[13] || '',
            observaciones: row[14] || '',
            pagado: row[15] || '',
        }));

        res.json({
            success: true,
            registros
        });

    } catch (error) {
        console.error('Error al obtener registros de producción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los registros de producción'
        });
    }
});
app.post('/registrar-produccion', requireAuth, async (req, res) => {
    const { spreadsheetId, email, nombre } = req.user;
    const { producto, idProducto, lote, gramos, proceso, microondas, tiempo, envasados, vencimiento } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Validate required fields
        if (!producto || !lote || !gramos || !proceso || !envasados || !vencimiento) {
            console.log('Error: Campos requeridos faltantes');
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son requeridos'
            });
        }

        const lastIdResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Produccion!A2:A'
        }).catch(error => {
            console.error('Error al obtener último ID:', error);
            throw new Error('Error al acceder a la hoja de cálculo');
        });

        const lastId = lastIdResponse.data.values ?
            Math.max(...lastIdResponse.data.values.map(row => parseInt(row[0].split('-')[1]) || 0)) : 0;
        const newId = `RP-${(lastId + 1).toString().padStart(3, '0')}`;

        const currentDate = new Date().toLocaleDateString('es-ES');
        const microondasValue = microondas === 'Si' ? tiempo : 'No';

        const newRow = [
            newId,              // ID
            currentDate,        // FECHA
            idProducto,                 // ID
            producto,           // PRODUCTO
            lote,              // LOTE
            gramos,            // GR.
            proceso,           // PROCESO
            microondasValue,   // MICR.
            envasados,         // ENVS. TERM.
            vencimiento,       // FECHA VENC.
            nombre,            // NOMBRE
            email              // USER
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Produccion!A:L',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [newRow]
            }
        }).catch(error => {
            console.error('Error al insertar datos:', error);
            throw new Error('Error al insertar datos en la hoja de cálculo');
        });

        res.json({
            success: true,
            message: 'Producción registrada correctamente',
            data: {
                id: newId,
                fecha: currentDate
            }
        });

    } catch (error) {
        console.error('Error detallado al registrar producción:', {
            error: error.message,
            stack: error.stack,
            spreadsheetId,
            timestamp: new Date().toISOString()
        });

        res.status(500).json({
            success: false,
            error: 'Error al registrar la producción: ' + error.message
        });
    }
});
app.get('/obtener-mis-registros-produccion', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const userEmail = req.user.email;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Produccion!A2:O'
        });

        const rows = response.data.values || [];

        // Filtrar solo los registros del usuario actual
        const misRegistros = rows
            .filter(row => row[11] === userEmail) // La columna C (índice 2) contiene el email del usuario
            .map(row => ({
                id: row[0] || '',
                fecha: row[1] || '',
                idProducto: row[2] || '',
                producto: row[3] || '',
                lote: row[4] || '',
                gramos: row[5] || '',
                proceso: row[6] || '',
                microondas: row[7] || '',
                envases_terminados: row[8] || '',
                fecha_vencimiento: row[9] || '',
                nombre: row[10] || '',
                user: row[11] || '',
                c_real: row[12] || '',
                fecha_verificacion: row[13] || '',
                observaciones: row[14] || '',
                pagado: row[15] || '',
            }));

        res.json({
            success: true,
            registros: misRegistros
        });

    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los registros'
        });
    }
});


/* ==================== RUTAS DE AlMACEN ==================== */
app.delete('/eliminar-registro-produccion/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los registros
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Produccion!A2:O'
        });

        const rows = response.data.values || [];
        // Buscar el índice exacto del registro por su ID completo
        const rowIndex = rows.findIndex(row => row[0] && row[0].toString() === id.toString());

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        // Obtener el ID de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const produccionSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Produccion'
        );

        if (!produccionSheet) {
            return res.status(404).json({
                success: false,
                error: 'Hoja de Producción no encontrada'
            });
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: produccionSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 por el encabezado
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({
            success: true,
            message: 'Registro eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el registro'
        });
    }
});
app.put('/editar-registro-produccion/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;
    const { producto, gramos, lote, proceso, microondas, envases_terminados, fecha_vencimiento, verificado, observaciones } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los registros
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Produccion!A2:O'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] && row[0].toString() === id.toString());

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        // Mantener los valores existentes que no se actualizan
        const existingRow = rows[rowIndex];
        const updatedRow = [
            id,                             // ID
            existingRow[1],                 // FECHA
            existingRow[2],
            producto,                       // PRODUCTO
            lote,                 // LOTE
            gramos,                         // GRAMOS
            proceso,                        // PROCESO
            microondas,                     // MICROONDAS
            envases_terminados,             // ENVASES TERMINADOS
            fecha_vencimiento,              // FECHA VENCIMIENTO
            existingRow[10],                 // NOMBRE
            existingRow[11],
            verificado,                // C_REAL
            existingRow[13],                // FECHA_VERIFICACION
            observaciones,                // OBSERVACIONES
        ];

        // Actualizar la fila
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Produccion!A${rowIndex + 2}:O${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow]
            }
        });

        res.json({
            success: true,
            message: 'Registro actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el registro'
        });
    }
});
app.put('/verificar-registro-produccion/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;
    const { cantidad_real, observaciones } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener registros actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Produccion!A2:O'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] && row[0].toString() === id.toString());

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        // Mantener valores existentes y actualizar solo los campos de verificación
        const existingRow = rows[rowIndex];
        const currentDate = new Date().toLocaleDateString('es-ES');

        const updatedRow = [
            ...existingRow.slice(0, 12),    // Mantener datos hasta la columna 10
            cantidad_real,                   // Cantidad real verificada
            currentDate,                     // Fecha de verificación
            observaciones                 // Observaciones
        ];

        // Actualizar la fila
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Produccion!A${rowIndex + 2}:O${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow]
            }
        });

        res.json({
            success: true,
            message: 'Registro verificado correctamente'
        });

    } catch (error) {
        console.error('Error al verificar registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al verificar el registro'
        });
    }
});
app.get('/obtener-productos', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Almacen general!A2:M' // Ahora incluye la columna L para la imagen
        });

        const rows = response.data.values || [];

        // Mapear los datos al formato especificado
        const productos = rows.map(row => ({
            id: row[0] || '',
            producto: row[1] || '',
            gramos: row[2] || '',
            stock: row[3] || '',
            cantidadxgrupo: row[4] || '',
            lista: row[5] || '',
            codigo_barras: row[6] || '',
            precios: row[7] || '',
            etiquetas: row[8] || '',
            acopio_id: row[9] || '',
            alm_acopio_producto: row[10] || '',
            imagen: row[11] || './icons/default-product.png', // Valor por defecto si no hay imagen
            uSueltas: row[12] || ''
        }));

        res.json({
            success: true,
            productos
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los productos'
        });
    }
});
app.post('/crear-producto', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { producto, gramos, stock, cantidadxgrupo, lista, codigo_barras, precios, etiquetas, acopio_id, alm_acopio_producto } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Validar campos requeridos
        if (!producto || !gramos || !stock || !cantidadxgrupo || !lista) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos obligatorios deben ser completados'
            });
        }

        // Get last ID to generate new one
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen general!A2:A'
        });

        const rows = response.data.values || [];
        const lastId = rows.length > 0 ?
            Math.max(...rows.map(row => parseInt(row[0].split('-')[1]) || 0)) : 0;
        const newId = `PG-${(lastId + 1).toString().padStart(3, '0')}`;

        const newRow = [
            newId,                  // ID
            producto,               // PRODUCTO
            gramos,                 // GR.
            stock,                  // STOCK
            cantidadxgrupo,         // GRUP
            lista,                  // LISTA
            codigo_barras || 'no definido', // C. BARRAS
            precios,                // PRECIOS
            etiquetas,              // ETIQUETAS
            acopio_id || '',        // ACOPIO ID
            alm_acopio_producto || 'No hay índice seleccionado', // ALM-ACOPIO NOMBRE
            './icons/default-product.png'  // Imagen por defecto
        ];

        // Append the new row at the end
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Almacen general!A2:L',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [newRow] }
        });

        res.json({
            success: true,
            message: 'Producto creado correctamente',
        });

    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear el producto'
        });
    }
});
app.delete('/eliminar-producto/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get spreadsheet info
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const almacenSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Almacen general'
        );

        if (!almacenSheet) {
            throw new Error('Hoja de Almacén general no encontrada');
        }

        // Get current products
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen general!A2:L'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: almacenSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 for header row
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Producto eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar el producto' });
    }
});
app.put('/actualizar-producto/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const { producto, gramos, stock, cantidadxgrupo, lista, codigo_barras, precios, etiquetas, acopio_id, alm_acopio_producto, imagen, uSueltas } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener productos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen general!A2:N' // Cambiado a N para incluir todas las columnas
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Producto no encontrado' });
        }

        const updatedRow = [
            id,                     // ID
            producto,               // PRODUCTO
            gramos,                 // GR.
            stock,                  // STOCK
            cantidadxgrupo,         // GRUP
            lista,                  // LISTA
            codigo_barras || 'no definido', // C. BARRAS
            precios,                // PRECIOS
            etiquetas,              // ETIQUETAS
            acopio_id || '',        // ACOPIO ID
            alm_acopio_producto || 'No hay índice seleccionado', // ALM-ACOPIO NOMBRE
            imagen,
            uSueltas        // UNIDADES SUELTAS
        ];

        // Actualizar el rango para incluir todas las columnas necesarias
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Almacen general!A${rowIndex + 2}:N${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [updatedRow] }
        });

        res.json({
            success: true,
            message: 'Producto actualizado correctamente',
            producto: updatedRow
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar el producto' });
    }
});
app.post('/actualizar-stock', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;  // Obtener el ID del usuario autenticado
        const { actualizaciones, tipo } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales de Almacen general
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,  // Usar el spreadsheetId del usuario
            range: 'Almacen general!A:D'
        });

        const rows = response.data.values || [];
        const updates = [];

        // Procesar cada actualización
        for (const actualizacion of actualizaciones) {
            const rowIndex = rows.findIndex(row => row[0] === actualizacion.id);
            if (rowIndex !== -1) {
                const stockActual = parseInt(rows[rowIndex][3]) || 0;
                const nuevoStock = tipo === 'salida'
                    ? stockActual - actualizacion.cantidad
                    : stockActual + actualizacion.cantidad;

                updates.push({
                    range: `Almacen general!D${rowIndex + 1}`,
                    values: [[nuevoStock.toString()]]
                });
            }
        }

        // Actualizar el stock en la hoja
        if (updates.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,  // Usar el spreadsheetId del usuario
                resource: {
                    valueInputOption: 'USER_ENTERED',
                    data: updates
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/* ==================== RUTAS DE CONTEOS DE AlMACEN ==================== */
app.post('/registrar-conteo', requireAuth, async (req, res) => {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = req.user.spreadsheetId;

        // Obtener el último ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Conteo!A2:A'
        });

        const rows = response.data.values || [];
        let lastId = 0;

        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1][0];
            lastId = parseInt(lastRow.split('-')[1]) || 0;
        }

        const newId = `CONT-${lastId + 1}`;
        const fecha = new Date().toLocaleString('es-ES');
        const { nombre, productos, sistema, fisico, diferencia, observaciones } = req.body;

        const values = [[
            newId,
            fecha,
            nombre,
            productos,
            sistema,
            fisico,
            diferencia,
            observaciones || ''
        ]];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Conteo!A2:G',
            valueInputOption: 'USER_ENTERED',
            resource: { values }
        });

        res.json({ success: true, message: 'Conteo registrado correctamente' });
    } catch (error) {
        console.error('Error al registrar conteo:', error);
        res.status(500).json({ success: false, error: 'Error al registrar el conteo' });
    }
});
app.get('/obtener-registros-conteo', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Conteo!A2:H' // Columnas A hasta G
        });

        const rows = response.data.values || [];

        // Mapear los datos a un formato más legible
        const registros = rows.map(row => ({
            id: row[0] || '',
            fecha: row[1] || '',
            nombre: row[2] || '',
            productos: row[3] || '',
            sistema: row[4] || '',
            fisico: row[5] || '',
            diferencia: row[6] || '',
            observaciones: row[7] || ''
        }));

        res.json({
            success: true,
            registros
        });

    } catch (error) {
        console.error('Error al obtener registros de conteo:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los registros de conteo'
        });
    }
});
app.delete('/eliminar-conteo/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const { motivo } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Conteo!A2:A'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Conteo no encontrado' });
        }

        // Obtener información del sheet
        const almacenSheet = await sheets.spreadsheets.get({
            spreadsheetId,
            ranges: ['Conteo']
        });

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: almacenSheet.data.sheets[0].properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 por el encabezado
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true, message: 'Conteo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar conteo:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar el conteo' });
    }
});
app.put('/editar-conteo/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const { nombre, observaciones, motivo } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener datos actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Conteo!A2:H'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Conteo no encontrado' });
        }

        // Actualizar solo el nombre y observaciones
        const updatedRow = [
            id,                     // ID
            rows[rowIndex][1],      // Fecha (mantener)
            nombre,                 // Nombre actualizado
            rows[rowIndex][3],      // Productos (mantener)
            rows[rowIndex][4],      // Sistema (mantener)
            rows[rowIndex][5],      // Físico (mantener)
            rows[rowIndex][6],      // Diferencia (mantener)
            observaciones           // Observaciones actualizadas
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Conteo!A${rowIndex + 2}:H${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [updatedRow] }
        });

        res.json({ success: true, message: 'Conteo actualizado correctamente' });
    } catch (error) {
        console.error('Error al editar conteo:', error);
        res.status(500).json({ success: false, error: 'Error al editar el conteo' });
    }
});

/* ==================== RUTAS DE MOVIMIENTOS DE AlMACEN ==================== */
app.get('/obtener-movimientos-almacen', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Movimientos alm-gral!A2:N' // Columns A through H
        });

        const rows = response.data.values || [];

        // Map the data to a more readable format
        const movimientos = rows.map(row => ({
            id: row[0] || '',
            fecha_hora: row[1] || '',
            tipo: row[2] || '',
            productos: row[3] || '',
            cantidades: row[4] || '',
            operario: row[5] || '',
            cliente_proovedor: row[6] || '',
            nombre_movimiento: row[7] || '',
            subtotal: row[8] || '',
            descuento: row[9] || '',
            aumento: row[10] || '',
            total: row[11] || '',
            observaciones: row[12] || '',
            precios_unitarios: row[13] || ''
        }));

        res.json({
            success: true,
            movimientos
        });

    } catch (error) {
        console.error('Error al obtener movimientos de almacén:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los movimientos de almacén'
        });
    }
});
app.post('/registrar-movimiento', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { fechaHora, tipo, productos, cantidades, operario, clienteId, nombre_movimiento, subtotal, descuento, aumento, total, observaciones, precios_unitarios } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Generar nuevo ID
        const lastIdResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Movimientos alm-gral!A2:A'
        });

        const lastId = lastIdResponse.data.values ?
            Math.max(...lastIdResponse.data.values.map(row => parseInt(row[0]?.split('-')[1]) || 0)) : 0;
        const newId = `MAG-${lastId + 1}`;

        // Registrar movimiento
        const newMovimiento = [
            newId,
            fechaHora,
            tipo,
            productos,
            cantidades,
            operario,
            clienteId,
            nombre_movimiento,
            subtotal,
            descuento,
            aumento,
            total,
            observaciones,
            precios_unitarios
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Movimientos alm-gral!A2:N',
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newMovimiento] }
        });

        res.json({
            success: true,
            id: newId,
            message: 'Movimiento registrado correctamente'
        });

    } catch (error) {
        console.error('Error en registrar movimiento:', error);
        res.status(500).json({
            success: false,
            error: `Error interno: ${error.message || 'Consulte los logs para más detalles'}`
        });
    }
});
app.delete('/eliminar-registro-almacen/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los registros
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Movimientos alm-gral!A2:M'
        });

        const rows = response.data.values || [];
        // Buscar el índice exacto del registro por su ID completo
        const rowIndex = rows.findIndex(row => row[0] && row[0].toString() === id.toString());

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        // Obtener el ID de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const produccionSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Movimientos alm-gral'
        );

        if (!produccionSheet) {
            return res.status(404).json({
                success: false,
                error: 'Hoja de Movimeintos no encontrada'
            });
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: produccionSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 por el encabezado
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({
            success: true,
            message: 'Registro eliminado correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar registro:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el registro'
        });
    }
});
app.put('/editar-registro-almacen/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;
    const {
        nombre_movimiento,
        cliente_proovedor,
        operario,
        productos,
        cantidades,
        subtotal,
        descuento,
        aumento,
        total,
        observaciones,
    } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current almacen records
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Movimientos alm-gral!A2:M'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Registro no encontrado'
            });
        }

        // Prepare updated row data
        const updatedRow = [
            id,
            rows[rowIndex][1], // Keep original fecha_hora
            rows[rowIndex][2], // Keep original tipo
            productos,
            cantidades,
            operario,
            cliente_proovedor,
            nombre_movimiento,
            subtotal,
            descuento,
            aumento,
            total,
            observaciones
        ];

        // Update the row
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Movimientos alm-gral!A${rowIndex + 2}:M${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow]
            }
        });

        res.json({
            success: true,
            message: 'Registro de almacén actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar registro de almacén:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el registro de almacén'
        });
    }
});

/* ==================== RUTAS ETIQUETAS DE AlMACEN ==================== */
app.get('/obtener-etiquetas', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Etiquetas!A2:B' // Columnas A y B para ID y ETIQUETA
        });

        const rows = response.data.values || [];

        const etiquetas = rows.map(row => ({
            id: row[0] || '',
            etiqueta: row[1] || ''
        }));

        res.json({
            success: true,
            etiquetas
        });

    } catch (error) {
        console.error('Error al obtener etiquetas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las etiquetas'
        });
    }
});
app.post('/agregar-etiqueta', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { etiqueta } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get existing tags to calculate next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Etiquetas!A2:B'
        });

        const rows = response.data.values || [];
        const nextId = rows.length > 0 ?
            parseInt(rows[rows.length - 1][0].split('-')[1]) + 1 : 1;

        const newTag = [`ET-${nextId.toString().padStart(3, '0')}`, etiqueta];

        // Append the new tag
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Etiquetas!A2:B',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [newTag] }
        });

        res.json({ success: true, id: newTag[0], etiqueta });
    } catch (error) {
        console.error('Error al agregar etiqueta:', error);
        res.status(500).json({ success: false, error: 'Error al agregar etiqueta' });
    }
});
app.delete('/eliminar-etiqueta/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current tags
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Etiquetas!A2:B'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Etiqueta no encontrada' });
        }

        // Clear the specific row
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `Etiquetas!A${rowIndex + 2}:B${rowIndex + 2}`
        });

        // Get remaining tags and reorder them
        const remainingTags = rows.filter((_, index) => index !== rowIndex);
        if (remainingTags.length > 0) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: 'Etiquetas!A2:B'
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Etiquetas!A2',
                valueInputOption: 'RAW',
                resource: { values: remainingTags }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar etiqueta:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar etiqueta' });
    }
});

/* ==================== RUTAS PRECIOS DE AlMACEN ==================== */
app.get('/obtener-precios', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Precios!A2:B' // Columnas A y B para ID y PRECIO
        });

        const rows = response.data.values || [];

        const precios = rows.map(row => ({
            id: row[0] || '',
            precio: row[1] || ''
        }));

        res.json({
            success: true,
            precios
        });

    } catch (error) {
        console.error('Error al obtener precios:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los precios'
        });
    }
});
app.post('/agregar-precio', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { precio } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Agregar nuevo precio a la hoja de Precios
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Precios!A2:B'
        });

        const rows = response.data.values || [];
        const nextId = rows.length > 0 ?
            parseInt(rows[rows.length - 1][0].split('-')[1]) + 1 : 1;

        const newPrice = [`PR-${nextId.toString().padStart(3, '0')}`, precio];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Precios!A2:B',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [newPrice] }
        });

        // Actualizar todos los productos en Almacen general
        const productosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen general!A2:L'
        });

        const productos = productosResponse.data.values || [];
        const actualizaciones = productos.map((producto, index) => {
            const preciosActuales = producto[7] || '';
            const nuevosPrecios = preciosActuales ?
                `${preciosActuales};${precio},0` :
                `${precio},0`;

            return {
                range: `Almacen general!H${index + 2}`,
                values: [[nuevosPrecios]]
            };
        });

        if (actualizaciones.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: actualizaciones
                }
            });
        }

        res.json({ success: true, id: newPrice[0], precio });
    } catch (error) {
        console.error('Error al agregar precio:', error);
        res.status(500).json({ success: false, error: 'Error al agregar precio' });
    }
});
app.delete('/eliminar-precio/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener precios actuales
        const preciosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Precios!A2:B'
        });

        const precios = preciosResponse.data.values || [];
        const precioIndex = precios.findIndex(row => row[0] === id);

        if (precioIndex === -1) {
            return res.status(404).json({ success: false, error: 'Precio no encontrado' });
        }

        // Eliminar el precio de la hoja
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `Precios!A${precioIndex + 2}:B${precioIndex + 2}`
        });

        // Actualizar productos en Almacen general
        const productosResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen general!A2:L'
        });

        const productos = productosResponse.data.values || [];
        const actualizaciones = productos.map((producto, index) => {
            const preciosActuales = producto[7] || '';
            const preciosArray = preciosActuales.split(';').filter(p => !p.startsWith(precios[precioIndex][1] + ','));
            const nuevosPrecios = preciosArray.join(';');

            return {
                range: `Almacen general!H${index + 2}`,
                values: [[nuevosPrecios]]
            };
        });

        if (actualizaciones.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                resource: {
                    valueInputOption: 'RAW',
                    data: actualizaciones
                }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar precio:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar precio' });
    }
});

/* ==================== RUTAS CLIENTES DE AlMACEN ==================== */
app.get('/obtener-clientes', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Clientes!A2:F'
        });

        const rows = response.data.values || [];
        const clientes = rows.map(row => ({
            id: row[0] || '',
            nombre: row[1] || '',
            telefono: row[2] || '',
            direccion: row[3] || '',
            zona: row[4] || '',
            pedidos_id: row[5] || '',
        }));

        res.json({
            success: true,
            clientes
        });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener clientes'
        });
    }
});
app.post('/agregar-cliente', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { nombre, telefono, direccion, zona } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener clientes actuales para calcular el siguiente ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Clientes!A2:E'
        });

        const rows = response.data.values || [];
        const nextId = rows.length > 0 ?
            parseInt(rows[rows.length - 1][0].split('-')[1]) + 1 : 1;

        const newClient = [
            `CL-${nextId.toString().padStart(3, '0')}`,
            nombre,
            telefono || '',
            direccion || '',
            zona || ''
        ];

        // Agregar el nuevo cliente
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Clientes!A2:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [newClient] }
        });

        res.json({
            success: true,
            cliente: {
                id: newClient[0],
                nombre,
                telefono,
                direccion,
                zona
            }
        });
    } catch (error) {
        console.error('Error al agregar cliente:', error);
        res.status(500).json({ success: false, error: 'Error al agregar cliente' });
    }
});
app.delete('/eliminar-cliente/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener información de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const clientesSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Clientes'
        );

        if (!clientesSheet) {
            return res.status(404).json({
                success: false,
                error: 'Hoja de Clientes no encontrada'
            });
        }

        // Obtener clientes actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Clientes!A2:E'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Cliente no encontrado'
            });
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: clientesSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 por el encabezado
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar cliente'
        });
    }
});
app.put('/editar-cliente/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;
    const { nombre, telefono, direccion, zona, motivo } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los clientes
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Clientes!A2:E'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Cliente no encontrado'
            });
        }

        // Actualizar la fila con los nuevos datos
        const updatedRow = [
            id,         // ID
            nombre,     // Nombre
            telefono,   // Teléfono
            direccion,  // Dirección
            zona        // Zona
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Clientes!A${rowIndex + 2}:E${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow]
            }
        });

        console.log(`Cliente ${id} actualizado con motivo: ${motivo}`);

        res.json({
            success: true,
            message: 'Cliente actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el cliente'
        });
    }
});

/* ==================== RUTAS PROOVEDORES DE AlMACEN ==================== */
app.get('/obtener-proovedores', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Proovedores!A2:E'
        });

        const rows = response.data.values || [];
        const proovedores = rows.map(row => ({
            id: row[0] || '',
            nombre: row[1] || '',
            telefono: row[2] || '',
            direccion: row[3] || '',
            zona: row[4] || ''
        }));

        res.json({
            success: true,
            proovedores
        });
    } catch (error) {
        console.error('Error al obtener proovedores:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener proovedores'
        });
    }
});
app.post('/agregar-proovedor', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { nombre, telefono, direccion, zona } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener clientes actuales para calcular el siguiente ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Proovedores!A2:E'
        });

        const rows = response.data.values || [];
        const nextId = rows.length > 0 ?
            parseInt(rows[rows.length - 1][0].split('-')[1]) + 1 : 1;

        const newProv = [
            `PRV-${nextId.toString().padStart(3, '0')}`,
            nombre,
            telefono || '',
            direccion || '',
            zona || ''
        ];

        // Agregar el nuevo cliente
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Proovedores!A2:E',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [newProv] }
        });

        res.json({
            success: true,
            cliente: {
                id: newProv[0],
                nombre,
                telefono,
                direccion,
                zona
            }
        });
    } catch (error) {
        console.error('Error al agregar proovedor:', error);
        res.status(500).json({ success: false, error: 'Error al agregar proovedor' });
    }
});
app.delete('/eliminar-proovedor/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener información de la hoja
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const clientesSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Proovedores'
        );

        if (!clientesSheet) {
            return res.status(404).json({
                success: false,
                error: 'Hoja de Clientes no encontrada'
            });
        }

        // Obtener clientes actuales
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Proovedores!A2:E'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Proovedor no encontrado'
            });
        }

        // Eliminar la fila
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: clientesSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1, // +1 por el encabezado
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar proovedor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar proovedor'
        });
    }
});
app.put('/editar-proovedor/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;
    const { nombre, telefono, direccion, zona, motivo } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Obtener todos los clientes
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Proovedores!A2:E'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Proovedor no encontrado'
            });
        }

        // Actualizar la fila con los nuevos datos
        const updatedRow = [
            id,         // ID
            nombre,     // Nombre
            telefono,   // Teléfono
            direccion,  // Dirección
            zona        // Zona
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Proovedores!A${rowIndex + 2}:E${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [updatedRow]
            }
        });

        console.log(`Proovedor ${id} actualizado con motivo: ${motivo}`);

        res.json({
            success: true,
            message: 'Proovedor actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar proovedor:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el proovedor'
        });
    }
});

/* ==================== RUTAS DE ACOPIO ==================== */
app.get('/obtener-productos-acopio', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Almacen acopio!A2:E'
        });

        const rows = response.data.values || [];

        const productos = rows.map(row => ({
            id: row[0] || '',
            producto: row[1] || '',
            bruto: row[2] || '0-1',  // Default value if empty
            prima: row[3] || '0-1',   // Default value if empty
            etiquetas: row[4] || ''
        }));

        res.json({
            success: true,
            productos
        });

    } catch (error) {
        console.error('Error al obtener productos de acopio:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los productos de acopio'
        });
    }
});
app.post('/crear-producto-acopio', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const sheets = google.sheets({ version: 'v4', auth });
        const { producto, pesoBruto, loteBruto, pesoPrima, lotePrima, etiquetas } = req.body;

        // Get current products to determine next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen acopio!A2:E'  // Fixed sheet name
        });

        const values = response.data.values || [];
        const lastId = values.length > 0 ?
            Math.max(...values.map(row => parseInt(row[0].split('-')[1]))) : 0;
        const newId = `PB-${(lastId + 1).toString().padStart(3, '0')}`;

        // Format weights with their lots
        const brutoFormatted = `${pesoBruto}-${loteBruto}`;
        const primaFormatted = `${pesoPrima}-${lotePrima}`;

        // Add new product
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Almacen acopio!A2:E',  // Fixed sheet name
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [[newId, producto, brutoFormatted, primaFormatted, etiquetas]]
            }
        });

        res.json({ success: true, id: newId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, error: 'Error al crear el producto' });
    }
});
app.delete('/eliminar-producto-acopio/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get spreadsheet info
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId
        });

        const almacenSheet = spreadsheet.data.sheets.find(
            sheet => sheet.properties.title === 'Almacen acopio'
        );

        if (!almacenSheet) {
            return res.status(404).json({
                success: false,
                error: 'Hoja de Almacén acopio no encontrada'
            });
        }

        // Get current products
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen acopio!A2:E'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Delete the row
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: almacenSheet.properties.sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex + 1,
                            endIndex: rowIndex + 2
                        }
                    }
                }]
            }
        });

        res.json({
            success: true,
            message: 'Producto eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el producto'
        });
    }
});
app.put('/editar-producto-acopio/:id', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;
    const { id } = req.params;
    const { producto, bruto, prima, etiquetas, motivo } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current products
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Almacen acopio!A2:E'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({
                success: false,
                error: 'Producto no encontrado'
            });
        }

        // Update the row (columns: A=ID, B=Producto, C=Bruto, D=Prima, E=Etiquetas)
        const updatedRow = [id, producto, bruto, prima, etiquetas];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Almacen acopio!A${rowIndex + 2}:E${rowIndex + 2}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values: [updatedRow] }
        });

        console.log(`Producto ${id} actualizado con motivo: ${motivo}`);

        res.json({
            success: true,
            message: 'Producto actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el producto'
        });
    }
});

/* ==================== RUTAS DE ACOPIO ==================== */
app.get('/obtener-etiquetas-acopio', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Etiquetas acopio!A2:B' // Columnas A y B para ID y ETIQUETA
        });

        const rows = response.data.values || [];

        const etiquetas = rows.map(row => ({
            id: row[0] || '',
            etiqueta: row[1] || ''
        }));

        res.json({
            success: true,
            etiquetas
        });

    } catch (error) {
        console.error('Error al obtener etiquetas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener las etiquetas'
        });
    }
});
app.post('/agregar-etiqueta-acopio', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { etiqueta } = req.body;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get existing tags to calculate next ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Etiquetas acopio!A2:B'
        });

        const rows = response.data.values || [];
        const nextId = rows.length > 0 ?
            parseInt(rows[rows.length - 1][0].split('-')[1]) + 1 : 1;

        const newTag = [`ETA-${nextId.toString().padStart(3, '0')}`, etiqueta];

        // Append the new tag
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Etiquetas acopio!A2:B',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [newTag] }
        });

        res.json({ success: true, id: newTag[0], etiqueta });
    } catch (error) {
        console.error('Error al agregar etiqueta:', error);
        res.status(500).json({ success: false, error: 'Error al agregar etiqueta' });
    }
});
app.delete('/eliminar-etiqueta-acopio/:id', requireAuth, async (req, res) => {
    try {
        const { spreadsheetId } = req.user;
        const { id } = req.params;
        const sheets = google.sheets({ version: 'v4', auth });

        // Get current tags
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Etiquetas acopio!A2:B'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[0] === id);

        if (rowIndex === -1) {
            return res.status(404).json({ success: false, error: 'Etiqueta no encontrada' });
        }

        // Clear the specific row
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: `Etiquetas acopio!A${rowIndex + 2}:B${rowIndex + 2}`
        });

        // Get remaining tags and reorder them
        const remainingTags = rows.filter((_, index) => index !== rowIndex);
        if (remainingTags.length > 0) {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: 'Etiquetas acopio!A2:B'
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Etiquetas acopio!A2',
                valueInputOption: 'RAW',
                resource: { values: remainingTags }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar etiqueta:', error);
        res.status(500).json({ success: false, error: 'Error al eliminar etiqueta' });
    }
});



/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server running in port: ${port}`);
    });
}

export default app;