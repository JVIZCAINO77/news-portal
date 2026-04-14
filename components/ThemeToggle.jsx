'use client';
// components/ThemeToggle.jsx — Forzar siempre modo claro
import { useEffect } from 'react';

export default function ThemeToggle() {
  useEffect(() => {
    // Siempre forzar modo claro, eliminar cualquier preferencia guardada
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
  }, []);

  // No renderiza ningún botón — solo limpia el tema
  return null;
}
