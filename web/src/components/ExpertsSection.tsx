import { useState } from "react";
import { ArrowRight, GraduationCap, Pause, Play, ShieldCheck, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
const brands = [
 {name:"Microsoft",file:"microsoft.png",tag:"Build what's next",url:"https://www.microsoft.com"},
 {name:"Meta",file:"meta.svg",tag:"Shape the future",url:"https://about.meta.com"},
 {name:"Apple",file:"apple.svg",tag:"Design for impact",url:"https://www.apple.com"},
 {name:"Amazon",file:"amazon.svg",tag:"Innovate at scale",url:"https://www.amazon.com"},
 {name:"Google",file:"google.svg",tag:"Create for everyone",url:"https://www.google.com"},
 {name:"Adobe",file:"adobe.svg",tag:"Turn ideas into reality",url:"https://www.adobe.com"},
 {name:"Figma",file:"figma.svg",tag:"Design together",url:"https://www.figma.com",word:true},
 {name:"Notion",file:"notion.svg",tag:"Organize your thinking",url:"https://www.notion.com",word:true},
 {name:"OpenAI",file:"openai.svg",tag:"Build with AI",url:"https://openai.com",word:true},
 {name:"Spotify",file:"spotify.svg",tag:"Power amazing experiences",url:"https://www.spotify.com",word:true}
];
export function ExpertsSection(){
 const [paused,setPaused]=useState(false);
 return <section id="features" className="innovators" aria-labelledby="innovators-title">
 <div className="innovators__inner"><div className="innovators__copy"><span className="innovators__eyebrow"><UsersRound size={18}/>LEARN FROM THE BEST</span><h2 id="innovators-title">Learn from experts<br/>who build <span>what's next.</span></h2><p>Gain knowledge from industry leaders and<br className="innovators__break"/> work with tools trusted by the world's most<br className="innovators__break"/> innovative teams.</p><div className="innovators__proof">{[{icon:GraduationCap,text:<>Industry-Leading<br/>Expertise</>},{icon:UsersRound,text:<>Real-World<br/>Learning</>},{icon:ShieldCheck,text:<>Trusted<br/>by Top Companies</>}].map((item,index)=>{const Icon=item.icon;return <div key={index}><span><Icon size={23}/></span><small>{item.text}</small></div>})}</div></div>
 <div className="innovators__showcase"><div className="innovators__top"><span className="innovators__scribble" aria-hidden="true">Trusted by<br/>Global Innovators<svg viewBox="0 0 50 55"><path d="M4 4 Q42 8 38 45 M30 37 L38 46 L45 37"/></svg></span></div>
 <div className={`innovators__marquees ${paused?"is-paused":""}`} aria-label="Global brands and tools">{[brands.slice(0,5),brands.slice(5)].map((row,rowIndex)=><div className="innovators__window" key={rowIndex}><div className="innovators__track">{[0,1].map(copy=><div className="innovators__group" key={copy} aria-hidden={copy===1?true:undefined}>{row.map((brand,index)=><a className={`innovators__card ${rowIndex===0&&index===0?"innovators__card--featured":""}`} key={brand.name} href={brand.url} target="_blank" rel="noreferrer" tabIndex={copy===1?-1:0} aria-label={brand.name+": "+brand.tag}><span className={`innovators__logo ${brand.word?"innovators__logo--word":""} innovators__logo--${brand.name.toLowerCase()}`}><img src={"/assets/company-logos/"+brand.file} alt={brand.word?"":brand.name} loading="lazy"/>{brand.word?<b>{brand.name}</b>:null}</span><span className="innovators__tag">{brand.tag}<i><ArrowRight size={16}/></i></span></a>)}</div>)}</div></div>)}</div>
 <div className="innovators__bottom"><Link to="/programs"><span><UsersRound size={19}/></span><small>Same tools. <strong>Real skills. A brighter you.</strong></small><ArrowRight size={19}/></Link><button onClick={()=>setPaused(value=>!value)} aria-label={paused?"Play brand animation":"Pause brand animation"} aria-pressed={paused}>{paused?<Play size={15}/>:<Pause size={15}/>}</button></div></div></div><span className="innovators__corner innovators__corner--left" aria-hidden="true">Learn<br/>Grow<br/>Lead</span><span className="innovators__corner innovators__corner--right" aria-hidden="true">Skills<br/>for a better<br/>tomorrow</span></section>
}
