import mongoose from "mongoose";
import { env } from "./env.js";

const connectdb = async () => {
  try {
    console.log("Mongo URI:", env.mongoUri);
    await mongoose.connect(env.mongoUri+'BloodDonation');
    console.log("Database Connected");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

export default connectdb;
