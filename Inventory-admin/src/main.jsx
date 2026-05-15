import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <StrictMode>
  <AuthProvider>
      <ThemeProvider>
        <App />
        <ToastContainer position="top-right" autoClose={2000} />
      </ThemeProvider>
      </AuthProvider>
    </StrictMode>
  </BrowserRouter>,
);
