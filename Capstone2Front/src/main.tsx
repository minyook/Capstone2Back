import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FoldersProvider } from "./context/FoldersContext";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FoldersProvider>
          <App />
        </FoldersProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
