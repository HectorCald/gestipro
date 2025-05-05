import express from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = 'una_clave_secreta_muy_larga_y_segura_2024';

const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,  // Actualizado para coincidir con .env
    null,
    process.env.GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
);

// Move login route
router.post('/login', async (req, res) => {
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

// Move register route
router.post('/register', async (req, res) => {
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

// Move check-email route
router.post('/check-email', async (req, res) => {
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

// Move logout route
router.post('/cerrar-sesion', (req, res) => {
    res.clearCookie('token');
    res.json({ mensaje: 'Sesión cerrada correctamente' });
});

export default router;