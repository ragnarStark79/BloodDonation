import express from "express";
import cors from "cors";
import { auth } from "../Middleware/auth.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../modules/User.js";
import Admin from "../modules/Admin.js";
import bloodbank from "../modules/BloodBank.js";
import Hospital from "../modules/Hospital.js";
import Donor from "../modules/donor.js";
import { env } from "../config/env.js";
import { ACCOUNT_STATUS, ROLES, VERIFICATION_STATUS } from "../config/constants.js";

const router = express.Router();

// Helpers
const mapIncomingRole = (role = "") => {
  const r = (role || "").toLowerCase();
  if (r === "donar" || r === "donor") return { legacy: "donor", canonical: ROLES.DONOR };
  if (r === "hospital" || r === "bloodbank" || r === "organization")
    return { legacy: r === "bloodbank" ? "bloodbank" : "hospital", canonical: ROLES.ORGANIZATION };
  if (r === "admin") return { legacy: "admin", canonical: ROLES.ADMIN };
  return { legacy: r, canonical: r.toUpperCase() };
};

const signTokens = (payload) => {
  const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenTtl });
  const refreshToken = jwt.sign({ ...payload, type: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.refreshTokenTtl,
  });
  return { accessToken, refreshToken };
};

// Signup
router.post("/signup", async (req, res) => {
  const {
    Name,
    Email,
    Password,
    ConfirmPassword,
    City,
    PhoneNumber,
    Role,
    Bloodgroup,
    Dateofbirth,
    // New unified organization fields
    organizationType,
    organizationName,
    Licensenumber,
    Address,
    // Legacy fields (backward compatibility)
    Bankname,
    BankAddress,
    Hospitalname,
    Department,
    HospitalAddress,
    // Admin fields
    Adminname,
    Admincode,
  } = req.body;

  try {
    const { legacy, canonical } = mapIncomingRole(Role);

    // Check if user already exists
    let user = await User.findOne({ Email });
    if (user) {

      return res.status(400).json({ msg: "User already exists" });
    }

    // Password validation
    if (Password !== ConfirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    if (!Password || Password.length < 8) {
      return res.status(400).json({ msg: "Password must be at least 8 characters" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Build user object
    const userData = {
      Name,
      Email,
      Password: hashedPassword,
      City,
      PhoneNumber,
      Role: legacy,
      verificationStatus: VERIFICATION_STATUS.PENDING,
      accountStatus: ACCOUNT_STATUS.ACTIVE,
    };

    // Add role-specific fields to User model
    if (canonical === ROLES.DONOR) {
      userData.bloodGroup = Bloodgroup;
      userData.DateOfBirth = Dateofbirth;
    } else if (canonical === ROLES.ORGANIZATION) {
      // Handle new unified organization signup
      if (organizationType && organizationName) {
        userData.organizationType = organizationType; // HOSPITAL or BANK
        userData.organizationName = organizationName;
        userData.licenseNo = Licensenumber;
      } else {
        // Backward compatibility: handle legacy hospital/bloodbank signup
        if (legacy === "hospital") {
          userData.organizationType = "HOSPITAL";
          userData.organizationName = Hospitalname;
          userData.licenseNo = Licensenumber;
        } else if (legacy === "bloodbank") {
          userData.organizationType = "BANK";
          userData.organizationName = Bankname;
          userData.licenseNo = Licensenumber;
        }
      }
    }

    // Create user in User collection
    user = new User(userData);
    await user.save();
    const user_Id = user._id;

    // Prepare role-specific data for legacy collections (backward compatibility)
    let Extra = {};

    if (legacy === "donor") {
      Extra = { Bloodgroup, Dateofbirth };
      await Donor.create({ user_Id, ...Extra });
    } else if (legacy === "admin") {
      Extra = { Adminname, Admincode, Address };
      await Admin.create({ user_Id, ...Extra });
    } else if (legacy === "hospital") {
      // For backward compatibility, still create legacy documents
      Extra = {
        Hospitalname: organizationName || Hospitalname,
        Department: Department || "General",
        HospitalAddress: Address || HospitalAddress
      };
      await Hospital.create({ user_Id, ...Extra });
    } else if (legacy === "bloodbank") {
      Extra = {
        Bankname: organizationName || Bankname,
        Licensenumber,
        BankAddress: Address || BankAddress
      };
      await bloodbank.create({ user_Id, ...Extra });
    }

    const tokenPayload = {
      email: Email,
      role: canonical,
      userId: user_Id,
      organizationType: userData.organizationType // Add organizationType to token
    };
    const { accessToken, refreshToken } = signTokens(tokenPayload);

    res.json({
      message: "User Registered Successfully",
      Token: accessToken,
      RefreshToken: refreshToken,
      Role: legacy,
      role: canonical,
      Name: Name,
      verificationStatus: user.verificationStatus,
    });
  } catch (err) {

    res.status(500).json({ message: "Server error during signup", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { Email, Password, Role } = req.body;

  try {
    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(403).json({ msg: "Invalid Email or password" });
    }

    const { legacy, canonical } = mapIncomingRole(Role);
    // Legacy support: if canonical role is DONOR, allow user role to be "donar" or "donor"
    const userRole = (user.Role || "").toLowerCase();
    const isValidDonor = canonical === ROLES.DONOR && (userRole === "donar" || userRole === "donor");



    if (!isValidDonor && userRole !== legacy) {
      return res.status(403).json({ msg: "Role does not match! Please select correct role." });
    }

    if (user.accountStatus === ACCOUNT_STATUS.BLOCKED || user.accountStatus === ACCOUNT_STATUS.DELETED) {
      return res.status(403).json({ msg: "Account is blocked or deleted" });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokenPayload = {
      email: user.Email,
      role: canonical,
      userId: user._id,
      organizationType: user.organizationType // Add organizationType to token
    };
    const { accessToken, refreshToken } = signTokens(tokenPayload);

    res.json({
      message: "Login Successful",
      Token: accessToken,
      RefreshToken: refreshToken,
      Role: user.Role,
      role: canonical,
      Name: user.Name,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
    });
  } catch (err) {

    res.status(500).json({ message: "Server error" });
  }
});

// Get current user
router.get("/auth/me", auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-Password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const { canonical } = mapIncomingRole(user.Role);

    // Build response with organization-specific fields for ORGANIZATION role
    const response = {
      userId: user._id,
      email: user.Email,
      Email: user.Email, // Keep for compatibility
      name: user.Name,
      Name: user.Name, // Keep for compatibility
      City: user.City,
      PhoneNumber: user.PhoneNumber,
      role: canonical,
      legacyRole: user.Role,
      verificationStatus: user.verificationStatus,
      accountStatus: user.accountStatus,
      createdAt: user.createdAt,
    };

    // Add organization-specific fields if user is an organization
    if (canonical === 'ORGANIZATION') {
      response.organizationType = user.organizationType;
      response.organizationName = user.organizationName;
      response.licenseNo = user.licenseNo;
      response.verifiedAt = user.verifiedAt;
      response.rejectionReason = user.rejectionReason;
    }

    // Add donor-specific fields
    if (canonical === 'DONOR') {
      response.bloodGroup = user.bloodGroup;
      response.lastDonationDate = user.lastDonationDate;
      response.eligible = user.eligible;
    }

    res.json(response);
  } catch (err) {

    res.status(500).json({ message: "Server error" });
  }
});

// Token refresh
router.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ msg: "Refresh token is required" });
  }
  try {
    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    if (decoded.type !== "refresh") {
      return res.status(400).json({ msg: "Invalid refresh token" });
    }
    const payload = { email: decoded.email, role: decoded.role, userId: decoded.userId };
    const accessToken = jwt.sign(payload, env.jwtSecret, { expiresIn: env.accessTokenTtl });
    res.json({ Token: accessToken });
  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired refresh token" });
  }
});

// FORGOT PASSWORD ROUTE - legacy simple reset
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  try {
    const user = await User.findOne({ Email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: false,
        message: "Email not found in our system",
      });
    }

    const newPassword =
      Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.Password = hashedPassword;
    await user.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "your-email@gmail.com",
        pass: process.env.EMAIL_PASS || "your-app-password",
      },
    });

    const roleMap = {
      donor: "Donor",
      hospital: "Hospital",
      bloodbank: "Blood Bank",
      admin: "Administrator",
    };
    const userRole = roleMap[user.Role] || user.Role;

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Blood Donation App" <no-reply@liforce.com>',
      to: email,
      subject: "Password Reset - Blood Donation App",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">🩸 Blood Donation App</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="padding: 30px; background: #fff; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; color: #333;">Hello <strong style="color: #d32f2f;">${user.Name}</strong>,</p>
            
            <div style="margin: 15px 0; display: inline-block;">
              <span style="background: #e3f2fd; color: #1976d2; padding: 6px 15px; border-radius: 20px; font-size: 14px; font-weight: bold;">
                ${userRole}
              </span>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              We received a request to reset your password. Your new temporary password is below:
            </p>
            
            <div style="background: linear-gradient(135deg, #fff3e0, #ffecb3); border: 2px dashed #ff9800; padding: 20px; margin: 25px 0; text-align: center; border-radius: 10px;">
              <p style="margin: 0 0 10px 0; color: #333; font-weight: bold;">Your New Password:</p>
              <div style="font-family: 'Courier New', monospace; font-size: 24px; color: #d32f2f; font-weight: bold; letter-spacing: 2px; padding: 10px; background: white; border-radius: 5px; display: inline-block;">
                ${newPassword}
              </div>
            </div>
            
            <div style="background: #f3f3f3; padding: 20px; border-radius: 8px; margin: 25px 0;">
              <p style="margin: 0 0 15px 0; color: #d32f2f; font-weight: bold;">⚠️ Important Instructions:</p>
              <ul style="margin: 0; padding-left: 20px; color: #555;">
                <li style="margin-bottom: 8px;">Use this password to login to your account</li>
                <li style="margin-bottom: 8px;">Change your password immediately after login</li>
                <li style="margin-bottom: 8px;">Do not share this password with anyone</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173/login"}" style="background: linear-gradient(135deg, #d32f2f, #b71c1c); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 15px rgba(211, 47, 47, 0.3);">
                Login to Your Account
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
              <p style="color: #777; font-size: 14px; margin-bottom: 5px;"><strong>Account Details:</strong></p>
              <p style="color: #555; font-size: 14px; margin: 5px 0;">Name: ${user.Name}</p>
              <p style="color: #555; font-size: 14px; margin: 5px 0;">Email: ${email}</p>
              <p style="color: #555; font-size: 14px; margin: 5px 0;">City: ${user.City}</p>
              <p style="color: #555; font-size: 14px; margin: 5px 0;">Role: ${userRole}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px; line-height: 1.5;">
                If you didn't request this password reset, please ignore this email.<br>
                This is an automated message. Please do not reply.<br>
                © ${new Date().getFullYear()} Blood Donation App. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return res.json({
      success: true,
      message: `Password reset email sent to ${email}. Please check your inbox.`,
      userRole: user.Role,
    });
  } catch (err) {


    if (err.code === "EAUTH") {
      return res.json({
        success: false,
        message: "Email service error. Please try again later.",
      });
    }

    return res.json({
      success: false,
      message: "Server error. Please try again.",
    });
  }
});

// Change Password
router.post("/change-password", auth(), async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.userId;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.Password);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.Password = hashedPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {

    res.status(500).json({ message: "Server error" });
  }
});

// Update Profile (for organizations)
router.put("/profile", auth([ROLES.ORGANIZATION]), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organizationName, Name, Email, PhoneNumber, City, licenseNo } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update fields if provided
    if (organizationName !== undefined) user.organizationName = organizationName;
    if (Name !== undefined) user.Name = Name;
    if (PhoneNumber !== undefined) user.PhoneNumber = PhoneNumber;
    if (City !== undefined) user.City = City;
    if (licenseNo !== undefined) user.licenseNo = licenseNo;

    // Email update requires additional validation
    if (Email && Email !== user.Email) {
      const existingUser = await User.findOne({ Email });
      if (existingUser && existingUser._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Email already in use by another account" });
      }
      user.Email = Email;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        organizationName: user.organizationName,
        Name: user.Name,
        Email: user.Email,
        PhoneNumber: user.PhoneNumber,
        City: user.City,
        licenseNo: user.licenseNo
      }
    });
  } catch (err) {

    res.status(500).json({ message: "Server error" });
  }
});

// Real implementation follows in next tool call after I add the import.


// Delete Account (Soft Delete)
router.delete("/delete-account", auth(), async (req, res) => {
  try {
    const userId = req.user.userId;

    // Soft delete: Change account status to DELETED
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.accountStatus = ACCOUNT_STATUS.DELETED;

    await user.save();

    res.json({ message: "Account deleted successfully" });
  } catch (err) {

    res.status(500).json({ message: "Server error" });
  }
});

export default router;