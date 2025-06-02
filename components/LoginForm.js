"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./login.module.css";

export default function LoginForm() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Validación básica
      if (!userId || !password) {
        setError("Por favor ingresa tu ID y contraseña");
        setIsLoading(false);
        return;
      }

       const apiUrl = `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/users/${userId}`;
      // Llamada al backend
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error("Usuario no encontrado");
      }

      const userData = await response.json();

      // Comparación de contraseñas (en producción usaría bcrypt.compare)
      if (password === userData.password) {
        // Almacenar datos relevantes del usuario
        localStorage.setItem("auth", "true");
        localStorage.setItem("user", JSON.stringify({
          userId: userData.userId,
          username: userData.username,
          fullName: userData.fullName,
          email: userData.email,
          photoUrl: userData.photoUrl
        }));
        
        router.push("/dashboard");
      } else {
        setError("Contraseña incorrecta");
      }
    } catch (error) {
      console.error("Error en login:", error);
      setError(error.message || "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginCard} onSubmit={handleLogin}>
        <h2>Iniciar sesión</h2>
        <p className={styles.subtitle}>Ingresa tus credenciales para acceder</p>
        
        {error && (
          <div className={styles.error}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className={styles.inputGroup}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.inputIcon}>
            <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <input
            type="text"
            placeholder="ID de usuario"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className={styles.inputField}
          />
        </div>

        <div className={styles.inputGroup}>
          <FiLock className={styles.inputIcon} />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.inputField}
          />
          <button 
            type="button" 
            className={styles.passwordToggle}
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        <button 
          type="submit" 
          className={styles.loginButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner}></span>
          ) : (
            "Entrar"
          )}
        </button>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.registerButton}
            onClick={() => router.push("/register")}
          >
            ¿No tienes cuenta? Regístrate
          </button>
          <button
            type="button"
            className={styles.forgotPassword}
            onClick={() => router.push("/forgot-password")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
    </div>
  );
}