import axios from "axios";
import { useState } from "react";
import { createContext } from "react";
import { toast } from "react-toastify";


export const DoctorContext = createContext()

const DoctorContextProvider = (props) =>{

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dToken,setDToken] = useState(localStorage.getItem('dToken')?localStorage.getItem('dToken'):'')
    const [appointments,setAppointments] = useState([])

    const getAppointments = async()=>{
        try {
            const {data} = await axios.get(backendUrl+'/api/doctor/appointments',{headers:{dToken}})

            if(data.success){
                setAppointments(data.appointments.reverse())
                console.log(data.appointments.reverse())
            }else{
                toast.error(data.message)
            }
            
        } catch (error) {
            toast.error(error)
        }
    }
    
    const value = {
        backendUrl,dToken,setDToken,
        getAppointments,appointments,
        setAppointments
    }



    return(
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )
}

export default DoctorContextProvider