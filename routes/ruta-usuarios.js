import express from 'express';
import { google } from 'googleapis';
import { requireAuth } from '../routes/ruta-middleware.js';

const router = express.Router();

const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,  // Actualizado para coincidir con .env
    null,
    process.env.GOOGLE_PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
);

router.get('/obtener-usuario-actual', requireAuth, async (req, res) => {
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

router.post('/actualizar-usuario', requireAuth, async (req, res) => {
    const { email, spreadsheetId } = req.user;
    const { nombre, apellido, foto, passwordActual, passwordNueva } = req.body;

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
            let passwordToSave = currentRow[0]; // Mantener contraseña actual por defecto

            // Verificar y actualizar contraseña si se proporciona
            if (passwordActual && passwordNueva) {
                if (passwordActual !== currentRow[0]) {
                    return res.status(400).json({
                        success: false,
                        error: 'La contraseña actual es incorrecta'
                    });
                }
                passwordToSave = passwordNueva;
            }

            // Procesar foto si se proporciona
            if (foto) {
                if (foto.length > 2000000) {
                    return res.status(400).json({
                        success: false,
                        error: 'La imagen es demasiado grande'
                    });
                }
                fotoToSave = foto;
            }

            const updateValues = [
                [
                    passwordToSave,    // Contraseña (A)
                    `${nombre} ${apellido}`, // Nombre completo (B)
                    currentRow[2],     // Rol (C)
                    currentRow[3],     // Estado (D)
                    currentRow[4],     // Plugins (E)
                    email,             // Email (F)
                    fotoToSave         // Foto (G)
                ]
            ];

            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId,
                range: `Usuarios!A${rowIndex + 2}:G${rowIndex + 2}`,
                valueInputOption: 'RAW',
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

export default router;