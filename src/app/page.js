"use client"; // Necesario para usar hooks y localStorage
import { useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Obtener datos del usuario del localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className={styles.container}>
      <h1>Bienvenido al Dashboard</h1>
      
      {userData ? (
        <div className={styles.userInfo}>
          <p>Has iniciado sesión como: <strong>{userData.username}</strong></p>
          <p>Tu ID de usuario es: <strong>{userData.userId}</strong></p>
        </div>
      ) : (
        <p>No se encontraron datos de usuario. Por favor inicia sesión.</p>
      )}
      
      <p>Selecciona una opción del menú lateral.</p>
    </div>
  );
}