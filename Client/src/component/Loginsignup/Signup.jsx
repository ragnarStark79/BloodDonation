import { useState, useReducer } from "react";
import InputField from "./InputField";
import TextArea from "./TextArea";
import Checkbox from "./Checkbox";
import { useNavigate } from "react-router-dom";
import authApi from "../../api/authApi";
import { toast } from "sonner";
import bgImage from "./img.png";

import {
  Mail, Lock, User, Phone, MapPin, Calendar,
  Heart, Building2, ShieldCheck, Stethoscope
} from "lucide-react";

// Reducer
const formReducer = (state, action) => {
  switch (action.type) {
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    default:
      return state;
  }
};

// Initial form state
const initialFormState = {
  Name: "",
  Email: "",
  Password: "",
  ConfirmPassword: "",
  City: "",
  PhoneNumber: "",
  Role: "",

  // Donor
  Bloodgroup: "",
  Dateofbirth: "",

  // Organization (unified)
  organizationType: "",
  organizationName: "",
  Licensenumber: "",
  Address: "",

  // Admin
  Adminname: "",
  Admincode: "",
};

const Signup = () => {
  const [role, setRole] = useState("");
  const [formData, dispatch] = useReducer(formReducer, initialFormState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    dispatch({
      type: "UPDATE_FIELD",
      field: e.target.name,
      value: e.target.value,
    });
    // Clear error for this field when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const SelectStyle =
    "w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-none transition-all duration-200 appearance-none cursor-pointer";

  const validateForm = () => {
    const newErrors = {};

    // Common field validation
    if (!formData.Name.trim()) newErrors.Name = "Name is required";
    if (!formData.Email.trim()) {
      newErrors.Email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Invalid email format";
    }

    if (!formData.Password) {
      newErrors.Password = "Password is required";
    } else if (formData.Password.length < 8) {
      newErrors.Password = "Password must be at least 8 characters";
    }

    if (formData.Password !== formData.ConfirmPassword) {
      newErrors.ConfirmPassword = "Passwords do not match";
    }

    if (!formData.City.trim()) newErrors.City = "City is required";

    if (!formData.PhoneNumber.trim()) {
      newErrors.PhoneNumber = "Phone number is required";
    } else if (!/^[+]?[\d\s-()]{10,}$/.test(formData.PhoneNumber)) {
      newErrors.PhoneNumber = "Invalid phone number format";
    }

    if (!formData.Role) newErrors.Role = "Please select a role";

    // Role-specific validation
    if (formData.Role === "donor") {
      if (!formData.Bloodgroup) newErrors.Bloodgroup = "Blood group is required";
      if (!formData.Dateofbirth) newErrors.Dateofbirth = "Date of birth is required";
    }

    if (formData.Role === "organization") {
      if (!formData.organizationType) newErrors.organizationType = "Organization type is required";
      if (!formData.organizationName?.trim()) newErrors.organizationName = "Organization name is required";
      if (!formData.Licensenumber?.trim()) newErrors.Licensenumber = "License number is required";
      if (!formData.Address?.trim()) newErrors.Address = "Address is required";
    }

    if (formData.Role === "admin") {
      if (!formData.Admincode?.trim()) newErrors.Admincode = "Admin code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    try {
      setLoading(true);
      await authApi.signup(formData);
      toast.success("Account created successfully! Please login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.response?.data?.msg || "Signup failed. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center font-outfit relative overflow-hidden"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center"
      }}
    >
      <div className="w-full max-w-4xl mx-auto animate-fade-in py-4 relative z-10">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-red-50 p-4 text-center relative overflow-hidden border-b border-red-100">
            <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
              <Heart size={80} className="text-red-900" />
            </div>

            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-2 shadow-sm">
              <Heart size={24} />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Join the Movement
            </h2>
            <p className="text-sm text-gray-600">
              Create an account to make a difference
            </p>
          </div>

          <div className="p-4 md:p-6">
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={handleSignup}>

              {/* Common Fields */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <InputField icon={User} label="Full Name" name="Name" type="text" required placeholder="John Doe" value={formData.Name} onChange={handleChange} />
                  {errors.Name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Name}</p>}
                </div>

                <div>
                  <InputField icon={Mail} label="Email" value={formData.Email} name="Email" type="email" required placeholder="john@example.com" onChange={handleChange} />
                  {errors.Email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Email}</p>}
                </div>

                <div>
                  <InputField icon={Lock} label="Password" value={formData.Password} name="Password" type="password" required placeholder="Min 8 characters" onChange={handleChange} />
                  {errors.Password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Password}</p>}
                </div>

                <div>
                  <InputField icon={Lock} label="Confirm Password" name="ConfirmPassword" type="password" value={formData.ConfirmPassword} required placeholder="Match password" onChange={handleChange} />
                  {errors.ConfirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.ConfirmPassword}</p>}
                </div>

                <div>
                  <InputField icon={MapPin} label="City" name="City" value={formData.City} type="text" required placeholder="New York" onChange={handleChange} />
                  {errors.City && <p className="text-red-500 text-xs mt-1 ml-1">{errors.City}</p>}
                </div>

                <div>
                  <InputField icon={Phone} label="Phone Number" value={formData.PhoneNumber} name="PhoneNumber" type="text" required placeholder="+1 234 567 890" onChange={handleChange} />
                  {errors.PhoneNumber && <p className="text-red-500 text-xs mt-1 ml-1">{errors.PhoneNumber}</p>}
                </div>

                {/* Role */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                    Select Your Role <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <select
                      required
                      className={SelectStyle}
                      name="Role"
                      value={formData.Role}
                      onChange={(e) => {
                        setRole(e.target.value);
                        handleChange(e);
                      }}
                    >
                      <option value="">Choose a role...</option>
                      <option value="donor">🩸 Donor</option>
                      <option value="organization">🏥 Organization (Hospital/Blood Bank)</option>
                      <option value="admin">👨‍💼 Admin</option>
                    </select>
                  </div>
                  {errors.Role && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Role}</p>}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 h-px bg-gray-100 my-1"></div>

              {/* Donor Fields */}
              {role === "donor" && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                      Blood Group <span className="text-red-500">*</span>
                    </label>

                    <select className={SelectStyle} name="Bloodgroup" value={formData.Bloodgroup} onChange={handleChange}>
                      <option value="">Select Blood Group</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                    {errors.Bloodgroup && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Bloodgroup}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <InputField icon={Calendar} label="Date of Birth" value={formData.Dateofbirth} name="Dateofbirth" type="date" required onChange={handleChange} />
                    {errors.Dateofbirth && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Dateofbirth}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1 mt-1">
                    <Checkbox label="I am eligible to donate blood according to health guidelines" required />
                    <Checkbox label="I agree to be contacted for emergency donation requests" required />
                  </div>
                </div>
              )}

              {/* Organization Fields (Hospital or Blood Bank) */}
              {role === "organization" && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                  {/* Organization Type Selector */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 ml-1">
                      Organization Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={SelectStyle}
                      name="organizationType"
                      value={formData.organizationType || ''}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Organization Type</option>
                      <option value="HOSPITAL">Hospital</option>
                      <option value="BANK">Blood Bank</option>
                    </select>
                    {errors.organizationType && <p className="text-red-500 text-xs mt-1 ml-1">{errors.organizationType}</p>}
                  </div>

                  <div>
                    <InputField
                      icon={Building2}
                      label="Organization Name"
                      value={formData.organizationName || ''}
                      name="organizationName"
                      type="text"
                      required
                      onChange={handleChange}
                      placeholder="Enter organization name"
                    />
                    {errors.organizationName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.organizationName}</p>}
                  </div>

                  <div>
                    <InputField
                      icon={ShieldCheck}
                      label="License Number"
                      value={formData.Licensenumber || ''}
                      name="Licensenumber"
                      type="text"
                      required
                      onChange={handleChange}
                      placeholder="Registration/License No."
                    />
                    {errors.Licensenumber && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Licensenumber}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <TextArea
                      label="Organization Address"
                      name="Address"
                      value={formData.Address || ''}
                      required
                      onChange={handleChange}
                      placeholder="Complete address with street, city, state"
                    />
                    {errors.Address && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Address}</p>}
                  </div>
                </div>
              )}

              {/* Admin */}
              {role === "admin" && (
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-in">
                  <div>
                    <InputField icon={User} label="Admin Name" value={formData.Adminname || ''} name="Adminname" type="text" required onChange={handleChange} placeholder="Your admin name" />
                    {errors.Adminname && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Adminname}</p>}
                  </div>

                  <div>
                    <InputField icon={Lock} label="Admin Code" value={formData.Admincode || ''} name="Admincode" type="text" required onChange={handleChange} placeholder="Secret admin code" />
                    {errors.Admincode && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Admincode}</p>}
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <TextArea label="Organization Address" value={formData.Address || ''} name="Address" required onChange={handleChange} placeholder="Admin office address" />
                    {errors.Address && <p className="text-red-500 text-xs mt-1 ml-1">{errors.Address}</p>}
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 text-white font-bold rounded-lg shadow-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>

                <p className="text-center mt-3 text-sm text-gray-600">
                  Already have an account?
                  <button
                    type="button"
                    className="font-semibold text-red-600 hover:underline ml-1"
                    onClick={() => navigate("/login")}
                  >
                    Login
                  </button>
                </p>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;