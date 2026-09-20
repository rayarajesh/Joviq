import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/global.css";
import "./styles/admin-dashboard.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

import "./styles/home-hero.css";
import "./styles/typography.css";
import "./styles/experts-section.css";
import "./styles/pricing-refresh.css";
import "./styles/program-directory.css";
import "./styles/certificate-refresh.css";
import "./styles/journey-refresh.css";
import "./styles/testimonials-refresh.css";
import "./styles/home-polish.css";
import "./styles/navbar-refresh.css";
import "./styles/programs-page.css";
import "./styles/home-sections.css";
import "./styles/responsive.css";
