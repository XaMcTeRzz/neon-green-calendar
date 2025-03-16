import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Ініціалізація теми
const initializeTheme = () => {
  const root = window.document.documentElement;
  const savedTheme = localStorage.getItem("theme") as "dark" | "light" | "system" | null;
  
  if (savedTheme) {
    if (savedTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.toggle("dark", systemTheme === "dark");
    } else {
      root.classList.toggle("dark", savedTheme === "dark");
    }
  } else {
    // За замовчуванням використовуємо темну тему
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
};

// Ініціалізуємо тему перед рендерингом додатку
initializeTheme();

// Встановлюємо слухач для автоматичної зміни теми при зміні системних налаштувань
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "system") {
    document.documentElement.classList.toggle("dark", e.matches);
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
