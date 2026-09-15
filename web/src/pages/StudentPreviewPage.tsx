import { Link } from "react-router-dom";
import { BrandLogo } from "../components/BrandLogo";
import { DashboardPage } from "./DashboardPage";

export function StudentPreviewPage() {
  return <div className="authenticated-app">
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, padding: "16px 28px", background: "white", borderBottom: "1px solid #e8e5f5", flexWrap: "wrap" }}>
      <Link to="/"><BrandLogo compact /></Link>
      <span>Student dashboard · Design preview · Sample data</span>
      <Link to="/login?role=student">Student login</Link>
    </header>
    <DashboardPage studentPreview />
  </div>;
}
