import { createContext } from "react";


export const AppContext = createContext()

const AppContextProvider = (props) =>{

    const currency = '$'

    const calculateAge = (dob) => {
        const today = new Date()
        const birthdate = new Date(dob)

        let age = today.getFullYear()-birthdate.getFullYear()
        return age
    }

    const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Nov",
    "Dec",
  ];

  const slotDateFormat = (slotDate) => {
    const dateArr = slotDate.split("_");
    return dateArr[0] + " " + months[Number(dateArr[1])] + " " + dateArr[2];
  };
    
    const value = {
        calculateAge,slotDateFormat,
        currency
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider
