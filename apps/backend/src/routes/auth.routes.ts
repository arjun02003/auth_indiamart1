import { Router } from 'express';
import { login, getMe, updateProfile, changePassword, listUsers, createUser } from '../controllers/auth.controller';

const router = Router();
router.post('/login', login);
router.get('/me', getMe);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/users', listUsers);
router.post('/users', createUser);
export default router;
