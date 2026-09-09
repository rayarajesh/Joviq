import { useState } from "react";
import { Search } from "lucide-react";
import { Link } from "react-router-dom";
const sections = ["Students", "Programs", "Payments", "Categories", "Curriculum", "Projects", "Certificates", "Enrollments", "Coupons", "Audit Logs"];
export function AdminWorkspaceSearch() {
 const [query,setQuery]=useState("");
 const matches=sections.filter(item=>item.toLowerCase().includes(query.trim().toLowerCase()));
 return <div className="admin-search"><Search size={20}/><input aria-label="Search workspace sections" placeholder="Search students, programs, payments..." value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Escape")setQuery("");}}/>{query.trim()?<div className="admin-search-results">{matches.map(item=><Link key={item} to={"/dashboard?section="+encodeURIComponent(item)} onClick={()=>setQuery("")}>{item}</Link>)}{matches.length===0?<span>No matching sections</span>:null}</div>:null}</div>
}
