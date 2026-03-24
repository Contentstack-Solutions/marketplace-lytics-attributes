import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./containers/App/App";
import "@contentstack/venus-components/build/main.css";
import "./index.css";

// Normalize double slashes in pathname (base_url trailing slash + path leading slash)
if (window.location.pathname.includes("//")) {
  window.history.replaceState(
    null,
    "",
    window.location.pathname.replace(/\/\/+/g, "/") + window.location.search + window.location.hash
  );
}

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
