import express from 'express';
import { requireAuth } from '../routes/ruta-middleware.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

router.get('/dashboard_otro', requireAuth, (req, res) => {
    res.render('dashboard_otro');
});

export default router;