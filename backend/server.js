import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

//app config
const app = express()
const port = process.env.PORT
connectDB()
connectCloudinary()

//middleware
app.use(express.json())
app.use(cors())

//api endpoints

// --- Health‑check route ------------------------------
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
// -----------------------------------------------------

app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)

app.get('/',(req,res)=>{
    res.send("API CHAL RAHA HAI")
})

app.listen(port,()=>{
    console.log(`server is running on http://localhost:${port}`)
})