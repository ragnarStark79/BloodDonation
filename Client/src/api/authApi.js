import client from "./client";

export const authApi = {
    login: async (email, password, role) => {
        const res = await client.post("https://blood-donation-lac.vercel.app/api/login", { Email: email, Password: password, Role: role });
        return res.data;
    },
    signup: async (data) => {
        const res = await client.post("/api/signup", data);
        return res.data;
    },
    refresh: async (refreshToken) => {
        const res = await client.post("/api/refresh", { refreshToken });
        return res.data;
    },
    me: async () => {
        const res = await client.get("/api/auth/me");
        return res.data;
    },
    changePassword: async (currentPassword, newPassword, confirmPassword) => {
        const res = await client.post("/api/change-password", {
            currentPassword,
            newPassword,
            confirmPassword
        });
        return res.data;
    },
    deleteAccount: async () => {
        const res = await client.delete("/api/delete-account");
        return res.data;
    },
    forgotPassword: async (email) => {
        const res = await client.post("/api/forgot-password", { email });
        return res.data;
    }
};

export default authApi;
