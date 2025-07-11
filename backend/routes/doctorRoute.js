import express from 'express'
import { doctorAppointments, doctorLogin, doctorsList } from '../controllers/doctorController.js';
import { authDoctor } from '../middleware/authDoctor.js';

const doctorRouter = express.Router();

doctorRouter.get('/list',doctorsList);
doctorRouter.post('/login',doctorLogin);
doctorRouter.get('/appointments',authDoctor,doctorAppointments)

export default doctorRouter