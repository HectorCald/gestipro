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
app.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard')
});
app.get('/dashboard_otro', requireAuth, (req, res) => {
    res.render('dashboard_otro')
});
app.post('/register', async (req, res) => {
    const { nombre, email, password, empresa } = req.body;

    // Predefined list of companies and their spreadsheet IDs
    const companies = {
        'damabrava': process.env.SPREADSHEET_ID_1,
        'cocacola': process.env.SPREADSHEET_ID_2
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





app.get('/obtner-usuarios', requireAuth, async (req, res) => {
    const { email, spreadsheetId } = req.user;

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Usuarios!A2:G'  // Extended range to include potential photo column
        });

        const rows = response.data.values || [];
        const usuario = rows.find(row => row[5] === email);  // Match by email

        if (usuario) {
            const userInfo = {
                password: usuario[0],
                nombre: usuario[1],
                rol: usuario[2],
                estado: usuario[3],
                plugins: usuario[4],
                email: usuario[5],
                foto: usuario[6] || './icons/icon.png'  // Default photo if none exists
            };
            
            res.json({ success: true, data: userInfo });
        } else {
            res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

    } catch (error) {
        console.error('Error al obtener información del usuario:', error);
        res.status(500).json({ success: false, error: 'Error al obtener datos del usuario' });
    }
});
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
    const { nombre, apellido, nuevoEmail, foto } = req.body;

    try {
        const sheets = google.sheets({ version: 'v4', auth });
        
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: 'Usuarios!A2:G'
        });

        const rows = response.data.values || [];
        const rowIndex = rows.findIndex(row => row[5] === email);

        if (rowIndex !== -1) {
            const currentRow = rows[rowIndex];
            let fotoToSave = currentRow[6] || './icons/icon.png';

            // Procesar la foto si se proporciona una nueva
            if (foto) {
                // Verificar si es una URL o base64
                if (foto.startsWith('data:image')) {
                    fotoToSave = foto;
                } else {
                    fotoToSave = foto;
                }
            }

            const updateValues = [
                [
                    `${nombre || currentRow[1].split(' ')[0]} ${apellido || currentRow[1].split(' ')[1] || ''}`,
                    currentRow[2],
                    currentRow[3],
                    currentRow[4],
                    nuevoEmail || currentRow[5],
                    fotoToSave
                ]
            ];

            const updateRange = `Usuarios!B${rowIndex + 2}:G${rowIndex + 2}`;
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: updateRange,
                valueInputOption: 'RAW',  // Cambiado a RAW para mejor manejo de strings largos
                resource: {
                    values: updateValues
                }
            });

            res.json({ 
                success: true, 
                message: 'Usuario actualizado correctamente' 
            });
        } else {
            res.status(404).json({ 
                success: false, 
                error: 'Usuario no encontrado' 
            });
        }
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error al actualizar el usuario' 
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