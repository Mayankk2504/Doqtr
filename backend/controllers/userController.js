import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'

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