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
const JWT_SECRET = 'una_clave_secreta_muy_larga_y_segura_2024';

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
        return res.status(401).json({ error: 'No autorizado' });
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
    res.render('login')
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
                            { expiresIn: '24h' }
                        );

                        res.cookie('token', token, { 
                            httpOnly: true,
                            secure: process.env.NODE_ENV === 'production',
                            sameSite: 'strict'
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
            producto: row[2] || '',
            lote: row[3] || '',
            gramos: row[4] || '',
            proceso: row[5] || '',
            microondas: row[6] || '',
            envases_terminados: row[7] || '',
            fecha_vencimiento: row[8] || '',
            nombre: row[9] || '',
            c_real: row[10] || '',
            fecha_verificacion: row[11] || '',
            observaciones: row[12] || '',
            pagado: row[13] || '',
            user: row[14] || ''
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
    const { spreadsheetId, email, nombre } = req.user;  // Add nombre from token
    const { producto, lote, gramos, proceso, microondas, tiempo, envasados, vencimiento } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get last ID to generate new one
        const lastIdResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Produccion!A2:A'
        });

        const lastId = lastIdResponse.data.values ? 
            Math.max(...lastIdResponse.data.values.map(row => parseInt(row[0].split('-')[1]) || 0)) : 0;
        const newId = `RP-${(lastId + 1).toString().padStart(3, '0')}`;
        
        const currentDate = new Date().toLocaleDateString('es-ES');
        const microondasValue = microondas === 'Si' ? tiempo : 'No';

        const newRow = [
            newId,              // ID
            currentDate,        // FECHA
            producto,           // PRODUCTO
            lote,              // LOTE
            gramos,            // GR.
            proceso,           // PROCESO
            microondasValue,   // MICR.
            envasados,         // ENVS. TERM.
            vencimiento,       // FECHA VENC.
            nombre,            // NOMBRE (using nombre from token)
            '',                // C. REAL
            '',                // FECHA VER.
            '',                // OBSERVACIONES
            'Pendiente',       // PAGADO
            email              // USER
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: spreadsheetId,
            range: 'Produccion!A:O',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            resource: {
                values: [newRow]
            }
        });

        res.json({
            success: true,
            message: 'Producción registrada correctamente'
        });

    } catch (error) {
        console.error('Error al registrar producción:', error);
        res.status(500).json({
            success: false,
            error: 'Error al registrar la producción'
        });
    }
});


/* ==================== RUTAS DE AlMACEN ==================== */
app.get('/obtener-movimientos-almacen', requireAuth, async (req, res) => {
    const { spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Movimientos alm-gral!A2:K' // Columns A through H
        });

        const rows = response.data.values || [];
        
        // Map the data to a more readable format
        const movimientos = rows.map(row => ({
            id: row[0] || '',
            fecha_hora: row[1] || '',
            tipo: row[2] || '',
            producto: row[3] || '',
            cantidad: row[4] || '',
            operario: row[5] || '',
            almacen: row[6] || '',
            motivo: row[7] || '',
            origen: row[8] || '',
            destino: row[9] || '',
            observaciones: row[10] || ''
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
    const { producto, gramos,lote, proceso, microondas, envases_terminados, fecha_vencimiento, verificado, observaciones } = req.body;

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
            producto,                       // PRODUCTO
            lote,                 // LOTE
            gramos,                         // GRAMOS
            proceso,                        // PROCESO
            microondas,                     // MICROONDAS
            envases_terminados,             // ENVASES TERMINADOS
            fecha_vencimiento,              // FECHA VENCIMIENTO
            existingRow[9],                 // NOMBRE
            verificado,                // C_REAL
            existingRow[11],                // FECHA_VERIFICACION
            observaciones,                // OBSERVACIONES
            existingRow[13],                // PAGADO
            existingRow[14]                 // USER
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
            ...existingRow.slice(0, 10),    // Mantener datos hasta la columna 10
            cantidad_real,                   // Cantidad real verificada
            currentDate,                     // Fecha de verificación
            observaciones,                   // Observaciones
            ...existingRow.slice(13)         // Mantener resto de datos
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
            range: 'Almacen general!A2:L' // Ahora incluye la columna L para la imagen
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
            imagen: row[11] || './icons/default-product.png' // Valor por defecto si no hay imagen
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






/* ==================== INICIALIZACIÓN DEL SERVIDOR ==================== */
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port}`);
  });
}

export default app;