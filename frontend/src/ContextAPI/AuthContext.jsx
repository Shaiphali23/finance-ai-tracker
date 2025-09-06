import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  // Get API URL with fallback
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
    }
  }, [token]);

  useEffect(() => {
    checkAuthStatus();
  }, [token]);

  const checkAuthStatus = async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/profile`);
      setUser(response.data.user);
    } catch (error) {
      console.error("Auth check error:", error);
      // If token is invalid, clear it
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
      // If we already have a token from Google, use it directly
      if (googleToken) {
        // Verify the token and get user data
        const response = await axios.get(`${API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${googleToken}` },
        });

        localStorage.setItem("token", googleToken);
        setToken(googleToken);
        setUser(response.data.user);
        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${googleToken}`;

        return { success: true };
      }

      // when we don't have a token
      const response = await axios.post(`${API_URL}/auth/google`, {
        token: googleToken,
      });

      const { token: jwtToken, user: userData } = response.data;
      localStorage.setItem("token", jwtToken);
      setToken(jwtToken);
      setUser(userData);
      axios.defaults.headers.common["Authorization"] = `Bearer ${jwtToken}`;

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
      // Clear local storage and state
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  const value = {
    user,
    loginWithGoogle,
    logout,
    loading,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
