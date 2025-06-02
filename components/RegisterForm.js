"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiMail, FiPhone, FiHome, FiMapPin, FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./register.module.css";

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: "",
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    rfc: "",
    gender: "M",
    address: {
      country: "México",
      zipCode: "",
      state: "",
      city: "",
      street: ""
    }
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes("address.")) {
      const addressField = name.split(".")[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validación básica
      if (!formData.userId || !formData.password || !formData.email) {
        throw new Error("ID, contraseña y email son obligatorios");
      }

      const response = await fetch(
        `https://inaz0pox7i.execute-api.us-east-1.amazonaws.com/dev/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            phone: parseInt(formData.phone),
            zipCode: parseInt(formData.address.zipCode)
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al registrar usuario");
      }

      setSuccess("Registro exitoso! Redirigiendo...");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Crear nueva cuenta</h2>
        <p className={styles.subtitle}>Completa todos los campos para registrarte</p>

        {error && (
          <div className={styles.error}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.success}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{success}</span>
          </div>
        )}

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información básica</h3>
          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              name="userId"
              placeholder="ID de usuario"
              value={formData.userId}
              onChange={handleChange}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={handleChange}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiLock className={styles.inputIcon} />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={handleChange}
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

          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              name="fullName"
              placeholder="Nombre completo"
              value={formData.fullName}
              onChange={handleChange}
              required
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiMail className={styles.inputIcon} />
            <input
              type="email"
              name="email"
              placeholder="Correo electrónico"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.inputField}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Información adicional</h3>
          <div className={styles.inputGroup}>
            <FiPhone className={styles.inputIcon} />
            <input
              type="tel"
              name="phone"
              placeholder="Teléfono"
              value={formData.phone}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <input
              type="text"
              name="rfc"
              placeholder="RFC"
              value={formData.rfc}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiUser className={styles.inputIcon} />
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className={styles.inputField}
            >
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
              <option value="O">Otro</option>
            </select>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Dirección</h3>
          <div className={styles.inputGroup}>
            <FiMapPin className={styles.inputIcon} />
            <input
              type="text"
              name="address.country"
              placeholder="País"
              value={formData.address.country}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiMapPin className={styles.inputIcon} />
            <input
              type="text"
              name="address.zipCode"
              placeholder="Código postal"
              value={formData.address.zipCode}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiMapPin className={styles.inputIcon} />
            <input
              type="text"
              name="address.state"
              placeholder="Estado"
              value={formData.address.state}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiMapPin className={styles.inputIcon} />
            <input
              type="text"
              name="address.city"
              placeholder="Ciudad"
              value={formData.address.city}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>

          <div className={styles.inputGroup}>
            <FiHome className={styles.inputIcon} />
            <input
              type="text"
              name="address.street"
              placeholder="Calle y número"
              value={formData.address.street}
              onChange={handleChange}
              className={styles.inputField}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className={styles.spinner}></span>
          ) : (
            "Registrarse"
          )}
        </button>

        <p className={styles.loginLink}>
          ¿Ya tienes una cuenta?{" "}
          <button 
            type="button" 
            className={styles.loginLinkButton}
            onClick={() => router.push("/login")}
          >
            Inicia sesión
          </button>
        </p>
      </form>
    </div>
  );
}