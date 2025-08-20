import React, { useState } from "react";
import "../styles/LoginPage.css"; // Assuming you have a CSS file for styling

const LoginPage = ({ onLogin }) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Handle login logic here
        setError("");
        try {
            await onLogin(username, password);
        } catch (err) {
            setError(err.message || "Login failed");
        }
    };

    return (
        <div className="login-bg">
            <div className="login-container">
                <h2 className="login-title">Sign In</h2>
                {error && <div style={{color:"#c00", marginBottom:8}}>{error}</div>}
                <form className="login-form" onSubmit={handleSubmit}>
                    <label htmlFor="username" className="login-label">
                        Username
                    </label>
                    <input
                        type="text"
                        id="username"
                        className="login-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        required
                    />
                    <label htmlFor="password" className="login-label">
                        Password
                    </label>
                    <input
                        type="password"
                        id="password"
                        className="login-input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                    <button type="submit" className="login-btn">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;