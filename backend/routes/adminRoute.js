import express from 'express'
import { addDoctor, adminDashboard, adminLogin, allAppoitments, allDoctors, appointmentCancel } from '../controllers/adminController.js'
import upload from '../middleware/multer.js'
import { authAdmin } from '../middleware/authAdmin.js'
import { changeAvailabity } from '../controllers/doctorController.js'

const adminRouter = express.Router()

adminRouter.post('/add-doctor',authAdmin,upload.single('image'),addDoctor)
adminRouter.post('/login',adminLogin)
adminRouter.post('/all-doctors',authAdmin,allDoctors)
adminRouter.post('/change-availability',authAdmin,changeAvailabity)
adminRouter.get('/all-appointments',authAdmin,allAppoitments)
adminRouter.post('/cancel-appointment',authAdmin,appointmentCancel)
adminRouter.get('/dashboard',authAdmin,adminDashboard)

export default adminRouter