import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("admin@acme.com");
    const [password, setPassword] = useState("password");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e) {
        e.preventDefault();

        setLoading(true);
        setError("");

        try {
            const response = await api.post("/login", {
                email,
                password
            });

            localStorage.setItem(
                "token",
                response.data.token
            );

            navigate("/dashboard");

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Login failed"
            );
        }

        setLoading(false);
    }


    return (
        <div className="login-page">

            <div className="login-card">

                <h1>PulseDesk</h1>

                <p>
                    Sign in to your support desk
                </p>


                <form onSubmit={handleLogin}>

                    <label>Email</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                        placeholder="Enter email"
                    />


                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                        placeholder="Enter password"
                    />


                    {
                        error &&
                        <div className="error">
                            {error}
                        </div>
                    }


                    <button disabled={loading}>
                        {
                            loading
                            ? "Signing in..."
                            : "Sign In"
                        }
                    </button>

                </form>


                <div className="demo">
                    Demo:
                    <br/>
                    admin@acme.com / password
                </div>

            </div>

        </div>
    );
}
