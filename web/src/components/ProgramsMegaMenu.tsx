import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  BriefcaseBusiness,
  Building2,
  Cloud,
  Code2,
  Cpu,
  Database,
  HeartPulse,
  LineChart,
  Megaphone,
  Paintbrush,
  PhoneCall,
  Search,
  ServerCog,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench
} from "lucide-react";
import { allPrograms, programCategories, type Program } from "../data/siteContent";

type ProgramsMegaMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onTalkToExpert: () => void;
};

function categoryLabel(domain: string) {
  if (domain.includes("Computer")) {
    return "Computer Science";
  }

  if (domain.includes("Electrical")) {
    return "Electrical & Electronics";
  }

  if (domain.includes("Mechanical")) {
    return "Mechanical";
  }

  return domain;
}

function CategoryIcon({ domain }: { domain: string }) {
  if (domain.includes("Computer")) {
    return <Code2 size={18} />;
  }

  if (domain.includes("Electrical")) {
    return <Cpu size={18} />;
  }

  if (domain.includes("Mechanical")) {
    return <Wrench size={18} />;
  }

  if (domain.includes("Healthcare")) {
    return <HeartPulse size={18} />;
  }

  return <BriefcaseBusiness size={18} />;
}

function ProgramIcon({ program }: { program: Program }) {
  const content = `${program.title} ${program.tags.join(" ")} ${program.domain}`.toLowerCase();

  if (content.includes("ai") || content.includes("rag") || content.includes("copilot")) {
    return <Bot size={24} />;
  }

  if (content.includes("full stack") || content.includes("web") || content.includes("react")) {
    return <Code2 size={24} />;
  }

  if (content.includes("cloud") || content.includes("aws")) {
    return <Cloud size={24} />;
  }

  if (content.includes("devops") || content.includes("docker")) {
    return <ServerCog size={24} />;
  }

  if (content.includes("security") || content.includes("cyber")) {
    return <ShieldCheck size={24} />;
  }

  if (content.includes("android")) {
    return <Smartphone size={24} />;
  }

  if (content.includes("graphic") || content.includes("design")) {
    return <Paintbrush size={24} />;
  }

  if (content.includes("data") || content.includes("analytics") || content.includes("sql")) {
    return <Database size={24} />;
  }

  if (content.includes("stock") || content.includes("finance")) {
    return <LineChart size={24} />;
  }

  if (content.includes("marketing")) {
    return <Megaphone size={24} />;
  }

  if (content.includes("management") || content.includes("hr")) {
    return <BriefcaseBusiness size={24} />;
  }

  if (content.includes("electrical") || content.includes("embedded") || content.includes("vlsi")) {
    return <Cpu size={24} />;
  }

  if (content.includes("mechanical") || content.includes("civil") || content.includes("cad")) {
    return <Building2 size={24} />;
  }

  return <Sparkles size={24} />;
}

export function ProgramsMegaMenu({ isOpen, onClose, onTalkToExpert }: ProgramsMegaMenuProps) {
  const [activeDomain, setActiveDomain] = useState(programCategories[0]?.domain ?? "");
  const [query, setQuery] = useState("");

  const filteredPrograms = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (cleanQuery) {
      return allPrograms.filter((program) => {
        const searchable = [
          program.title,
          program.domain,
          program.shortDescription,
          program.level,
          program.certification,
          ...program.tags,
          ...program.skills
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(cleanQuery);
      });
    }

    return programCategories.find((category) => category.domain === activeDomain)?.programs ?? allPrograms;
  }, [activeDomain, query]);

  if (!isOpen) {
    return null;
  }

  return (
    <section className="program-mega" aria-label="Programs menu">
      <div className="program-mega__shell">
        <div className="program-mega__top">
          <div className="program-mega__heading">
            <span aria-hidden="true" />
            <strong>Programs</strong>
            <em>Real projects - Rubric evaluation - Career outcomes</em>
          </div>

          <label className="program-mega__search">
            <Search size={22} />
            <input
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search programs..."
            />
          </label>

          <button
            className="program-mega__cta"
            type="button"
            onClick={() => {
              onClose();
              onTalkToExpert();
            }}
          >
            <PhoneCall size={22} />
            Request Callback
          </button>
        </div>

        <div className="program-mega__tabs" role="tablist" aria-label="Program domains">
          {programCategories.map((category) => {
            const isActive = category.domain === activeDomain && !query.trim();

            return (
              <button
                key={category.domain}
                className={isActive ? "is-active" : undefined}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setQuery("");
                  setActiveDomain(category.domain);
                }}
              >
                <CategoryIcon domain={category.domain} />
                {categoryLabel(category.domain)}
                <span>{category.programs.length}</span>
              </button>
            );
          })}
        </div>

        <div className="program-mega__grid-wrap">
          <div className="program-mega__grid">
            {filteredPrograms.map((program) => (
              <Link key={program.slug} className="program-mega__card" to={`/programs/${program.slug}`} onClick={onClose}>
                <span className="program-mega__icon" aria-hidden="true">
                  <ProgramIcon program={program} />
                </span>
                <span className="program-mega__copy">
                  <strong>{program.title}</strong>
                  <small>{program.shortDescription}</small>
                  <span className="program-mega__chips">
                    <em>Certification</em>
                    <em>Expert-led</em>
                  </span>
                </span>
              </Link>
            ))}

            {!filteredPrograms.length ? (
              <div className="program-mega__empty">
                <strong>No programs found</strong>
                <span>Try searching AI, cloud, data, finance, CAD, or marketing.</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
