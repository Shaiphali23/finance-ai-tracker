import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Set axios defaults whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Check user auth status on mount or token change
  useEffect(() => {
    checkAuthStatus();
  }, [token]);

  const checkAuthStatus = async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
      const response = await axios.get(`${API_URL}/auth/profile`);
      setUser(response.data.user);
      setToken(storedToken);
    } catch (error) {
      console.error("Auth check error:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        delete axios.defaults.headers.common["Authorization"];
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleToken) => {
    try {
      if (!googleToken) {
        return { success: false, message: "No Google token provided" };
      }

      // Exchange Google token for backend JWT
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: googleToken,
      });

      const { token: jwtToken, user: userData } = response.data;

      // Store JWT and set axios headers
      localStorage.setItem("token", jwtToken);
      setToken(jwtToken);
      setUser(userData);
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;
      axios.defaults.withCredentials = true;

      return { success: true };
    } catch (error) {
      console.error("Google login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const value = { user, loginWithGoogle, logout, loading, token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
