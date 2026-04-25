import { Router } from 'express';
import healthCheck from './health-check.js';
import whatsappRouter from './whatsapp.js';

const router = Router();

export default () => {
    router.get('/health', healthCheck);
    router.use('/send-whatsapp', whatsappRouter);

    return router;
};
