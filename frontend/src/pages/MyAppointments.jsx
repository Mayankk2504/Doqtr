import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";
import { useEffect } from "react";

const MyAppointments = () => {
  const { backendUrl, token, getDoctorsData } = useContext(AppContext);

  const navigate = useNavigate();

  const [appointmets, setAppointments] = useState([]);
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

  const getAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/user/appointments", {
        headers: { token },
      });

      if (data.success) {
        setAppointments(data.appointments.reverse());
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/cancel-appointment",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        toast.success(data.message);
        getAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const initpay = (order) => {
    const options = {
      key: import.meta.env.VITE_RZP_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: "Appointmrent payment",
      description: "Appointment payment",
      order_id: order.id,
      receipt: order.receipt,
      handler: async (response) => {
        console.log(response);

        try {
          const { data } = await axios.post(
            backendUrl + "/api/user/verifyRazorpay",
            response,
            { headers: { token } }
          );
          if (data.success) {
            getAppointments();
            navigate("/my-appointments");
            toast.success(data.message);
          } else {
            console.log(error);
            toast.error(data.message);
          }
        } catch (error) {
          console.log(error);
          toast.error(error.message);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const appointmetRazorpay = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/user/payment-razorpay",
        { appointmentId },
        { headers: { token } }
      );

      if (data.success) {
        initpay(data.order);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (token) {
      getAppointments();
    }
  }, [token]);

  return (
    token && (
      <div>
        <p className="pd-3 mt-12 font-medium text-zinc-700 border-b">
          My Appointments
        </p>
        <div>
          {appointmets.map((item, index) => (
            <div
              className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b"
              key={index}
            >
              <div>
                <img
                  className="w-32 bg-indigo-50"
                  src={item.doctorData.image}
                  alt=""
                />
              </div>
              <div className="flex-1 text-sm text-zinc-600">
                <p className="text-neutral-800 font-semibold">
                  {item.doctorData.name}
                </p>
                <p>{item.speciality}</p>
                <p className="text-zinc-700 font-medium mt-1">Address:</p>
                <p className="text-xs">{item.doctorData.address.line1}</p>
                <p className="text-xs">{item.doctorData.address.line2}</p>
                <p className="text-xs mt-1">
                  <span className="text-sm text-neutral-800 font-medium">
                    Date & Time
                  </span>{" "}
                  {slotDateFormat(item.slotDate)} | {item.slotTime}
                </p>
              </div>
              <div></div>
              <div className="flex flex-col gap-2 justify-end">
                {item.payment && !item.cancelled && (
                  <button className="sm:min-w-48 py-2 border rounded text-stone-500 bg-indigo-50">
                    Paid
                  </button>
                )}
                {!item.cancelled && !item.payment && (
                  <button
                    onClick={() => appointmetRazorpay(item._id)}
                    className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded cursor-pointer hover:bg-primary hover:text-white transition-all duration-300"
                  >
                    Pay online
                  </button>
                )}
                {!item.cancelled && (
                  <button
                    onClick={() => {
                      cancelAppointment(item._id);
                    }}
                    className="text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded cursor-pointer hover:bg-red-500 hover:text-white transition-all duration-300"
                  >
                    Cancel appointment
                  </button>
                )}
                {item.cancelled && (
                  <button className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500">
                    Appointment cancelled
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );
};

export default MyAppointments;
