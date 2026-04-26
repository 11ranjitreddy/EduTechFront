import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);
import { AUTH_URL as BASE_URL } from '../config/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('edtech_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
        setLoading(false);
    }, []);

    // =========================
    // LOGIN
    // =========================
    const login = async (email, password) => {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        // ✅ Handle rate limiting (429)
        if (response.status === 429) {
            throw new Error('Too many attempts. Please wait 1 minute.');
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        const result = data.data;

        // ✅ If MFA required
        if (result.requiresMfa) {
            return {
                requires2fa: true,
                isSetupRequired: result.mfaSetupRequired,
                email,
                role: result.role
            };
        }

        // ✅ Normal login (no MFA)
        const userData = {
            email,
            role: result.role,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            name: email.split('@')[0]
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('edtech_user', JSON.stringify(userData));

        return { role: result.role };
    };

    // =========================
    // SETUP MFA
    // =========================
    const setupMfa = async (email) => {
        const response = await fetch(`${BASE_URL}/setup-mfa?email=${email}`, {
            method: 'POST'
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'MFA setup failed');

        return data.data;
    };

    // =========================
    // VERIFY MFA
    // =========================
    const verify2fa = async (email, otp) => {
        const response = await fetch(`${BASE_URL}/verify-mfa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code: otp })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'MFA verification failed');

        const result = data.data;

        const userData = {
            email,
            role: result.role,   // ✅ role from backend
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            name: email.split('@')[0]
        };

        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem('edtech_user', JSON.stringify(userData));

        return userData; // ✅ return full userData so Login.jsx can check role
    };

    // =========================
    // LOGOUT
    // =========================
    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('edtech_user');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated,
                login,
                setupMfa,
                verify2fa,
                logout,
                loading
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);