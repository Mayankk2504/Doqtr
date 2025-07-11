import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'

// API to register user

export const  registerUser = async (req,res)=>{
    try {
        
        const {name , email, password } = req.body

        // checking all the fields
        if(!name || !email || !password){
            res.json({
                success:false,
                message:"Missing field"
            })
        }

        // validating email
        if(!validator.isEmail(email)){
            res.json({
                success:false,
                message:"enter a valid email"
            })
        }

        // validating password
        if(password.length < 8){
            res.json({
                success:false,
                message:"enter a strong password"
            })
        }

        //hashing password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const userdata = {
            name,
            email,
            password:hashedPassword
        }

        const newUser = new userModel(userdata)
        const user = await newUser.save();
        console.log(user)

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET)

        res.json({
            success:true,
            token
        })

    } catch (error) {
        console.log(error)
        res.json({
            success:false,
            message:error.message
        })
    }
}

export const loginUser = async (req,res)=>{

    try {
        const {email, password} = req.body

        if(!email || !password){
            res.json({
                success:false,
                message:"missing credentials"
            })
        }

        const user = await userModel.findOne({email})
        
        if(!user){
            res.json({
                success:false,
                message:"user not found"
            })
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(isMatch){
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
            res.json({
                success:true,
                token
            })
        }else{
            res.json({
                success:false,
                message:"wrong password"
            })
        }
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}
// API to get profile
export const getProfile = async(req,res)=>{
    try {
        const {userId} = req.body
        const userData = await userModel.findById(userId).select('-password')

        res.json({
            success:true,
            userData
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to update profle

export const updateProfile = async (req,res)=>{
    try {
       
        const {userId,name,phone,dob,address,gender} = req.body
        const imageFile = req.file;


        if(!name || !phone || !dob || !address || !gender){
            res.json({
                success:false,
                message:"data missing"
            })
        }

        await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address),dob,gender})

        if(imageFile){

            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
            const imageUrl = imageUpload.secure_url
            

            await userModel.findByIdAndUpdate(userId,{image:imageUrl})
        }

        res.json({
            success:true,
            message:"profile updated successfully"
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to book appointment

export const bookAppointment = async (req,res) =>{
    try {
        
        const {userId,docId,slotDate,slotTime} = req.body

        const docData = await doctorModel.findById(docId).select('-password')

        if(!docData.available){
            return res.json({
                success:false,
                message:"doctor not available"
            })
        }

        let slots_booked = docData.slots_booked;

        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({
                    success:false,
                    message:"slot not available"
                })
            }else{
                slots_booked[slotDate].push(slotTime)
            }
        }else{
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')

        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            doctorData:docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date:Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        await doctorModel.findByIdAndUpdate(docId,{slots_booked})

        res.json({
            success:true,
            message:'Appointment booked'
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// API to get all appointments of user
export const listAppointments = async (req,res) =>{
    try {
        const {userId} = req.body
        const appointments = await appointmentModel.find({userId})

        res.json({
            success:true,
            appointments
        })
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

export const cancelAppointment = async(req,res)=>{
    try {

        const {userId,appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        //verify appointment user
        if(appointmentData.userId !== userId){
            return res.json({
                success:false,
                message:'Unauthorize action'
            })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        // realising doctor slot
        const {docId, slotDate,slotTime} = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e=>e!==slotTime)

        await doctorModel.findByIdAndUpdate(docId,{slots_booked})


        res.json({
            success:true,
            message:"Appointment cancelled"
        })

        
    } catch (error) {
       console.log(error)
        res.json({success:false,message:error.message}) 
    }
}

const razorpayInstance = new razorpay({
    key_id:process.env.RZP_KEY_ID,
    key_secret:process.env.RZP_KEY_SECRET
})

export const paymentRazorpay = async (req,res)=>{
    try {
        const {appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        if(!appointmentData || appointmentData.cancelled){
            return res.json({
                success:false,
                message:"Appointment cancelled or not found"
            })
        }

        //creating options for razorpay payment
        const options = {
            amount:appointmentData.amount*100,
            currency:process.env.CURRENCY,
            receipt:appointmentId,
        }

        const order = await razorpayInstance.orders.create(options)

        res.json({
            success:true,
            order
        })
    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message}) 
    }
}

// API to verify payment of razorpay

export const verifyRazorpay = async(req,res)=>{
    try {
        const {razorpay_order_id}=req.body
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)

        if(orderInfo.status === 'paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true})
            res.json({
                success:true,
                message:'Payment successful'
            })
        }else{
            res.json({
                success:false,
                message:'Payment failed'
            })
        }



    } catch (error) {
        console.log(error)
        res.json({success:false,message: error.message}) 
    }
}
