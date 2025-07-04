import jwt from 'jsonwebtoken'

export const authUser = async (req,res,next) =>{
    try {
        const {token} = req.headers
        if(!token){
            return res.json({
                success:false,
                message:'Not authorized login again'
            })
        }

        const token_decode = jwt.verify(token,process.env.JWT_SECRET)
        
        if (!req.body) {
            req.body = {};
        }
        req.body.userId = token_decode.id
        next()
        
    } catch (error) {
       console.log(error)
       res.json({
        success:false,
        message:error.message
       }) 
    }
}