import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { ComponentType } from "react";
import { AdminSummary } from "./AdminSummary";

type Item = {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number;
  detail: string;
  tone: string;
};

type Priority = {
  icon: ComponentType<{ size?: number }>;
  label: string;
  value: number;
  module: string;
};

type ActionItem = {
  icon: ComponentType<{ size?: number }>;
  label: string;
  detail: string;
  value: number;
  module: string;
};

type AcademyOverviewProps = {
  revenue: number;
  revenueRecords: { date: string; amount: number }[];
  kpis: Item[];
  priorities: Priority[];
  actionItems: ActionItem[];
  loading: boolean;
  openModule: (module: string) => void;
  enrollmentDates: string[];
  paymentDates: string[];
};

export function AcademyOverview({
  kpis,
  priorities,
  actionItems,
  loading,
  openModule,
  enrollmentDates,
  paymentDates,
  revenue,
  revenueRecords,
}: AcademyOverviewProps) {
  const [period, setPeriod] = useState("month");
  const now = new Date();
  const start =
    period === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  const days =
    period === "month"
      ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      : 7;
  const series = [
    { name: "Enrollments", color: "#8057ff", dates: enrollmentDates },
    { name: "Payments", color: "#009c91", dates: paymentDates },
  ].map((item) => ({
    ...item,
    values: Array.from({ length: days }, (_, day) =>
      item.dates.filter(
        (value) =>
          new Date(value) >= start &&
          new Date(value) <
            new Date(
              start.getFullYear(),
              start.getMonth(),
              start.getDate() + day + 1,
            ),
      ).length,
    ),
  }));
  const maximum = Math.max(4, ...series.flatMap((item) => item.values));

  return (
    <section className="academy-overview" aria-busy={loading}>
      <AdminSummary
        kpis={kpis}
        revenue={revenue}
        revenueRecords={revenueRecords}
        enrollmentDates={enrollmentDates}
        loading={loading}
        openModule={openModule}
      />

      <div className="academy-panels">
        <article className="academy-panel academy-system">
          <header>
            <span className="academy-icon">
              <BookOpen size={25} />
            </span>
            <div>
              <h2>System Overview</h2>
              <p>Track your academy&apos;s key metrics and growth.</p>
            </div>
            <select
              aria-label="Chart period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            >
              <option value="month">This Month</option>
              <option value="week">Last 7 Days</option>
            </select>
          </header>
          <svg
            className="academy-chart"
            viewBox="0 0 640 225"
            role="img"
            aria-label="Cumulative enrollments and verified payments for the selected period"
          >
            <defs>
              {series.map((item, index) => (
                <linearGradient
                  id={`academy-fill-${index}`}
                  key={item.name}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={item.color} stopOpacity=".18" />
                  <stop offset="100%" stopColor={item.color} stopOpacity=".015" />
                </linearGradient>
              ))}
            </defs>
            {[0, 1, 2, 3, 4].map((tick) => (
              <g key={tick}>
                <line
                  x1="38"
                  x2="624"
                  y1={180 - tick * 39}
                  y2={180 - tick * 39}
                  stroke="#e9edf5"
                />
                <text x="26" y={184 - tick * 39} textAnchor="end">
                  {Math.round((maximum * tick) / 4)}
                </text>
              </g>
            ))}
            {Array.from({ length: 7 }, (_, index) => {
              const day = Math.round((index * (days - 1)) / 6);
              return (
                <g key={index}>
                  <line
                    x1={38 + index * 97.66}
                    x2={38 + index * 97.66}
                    y1="24"
                    y2="180"
                    stroke="#edf0f7"
                  />
                  <text x={38 + index * 97.66} y="204" textAnchor="middle">
                    {new Date(
                      start.getFullYear(),
                      start.getMonth(),
                      start.getDate() + day,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </text>
                </g>
              );
            })}
            {series.map((item, index) => {
              const points = item.values
                .map(
                  (value, day) =>
                    `${38 + (day * 586) / (days - 1)},${180 - (value / maximum) * 156}`,
                )
                .join(" ");
              return (
                <g key={item.name}>
                  <polygon
                    points={`38,180 ${points} 624,180`}
                    fill={`url(#academy-fill-${index})`}
                  />
                  <polyline
                    className="academy-chart-line"
                    key={period}
                    points={points}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="2"
                    pathLength="1"
                  />
                  {item.values.map((value, day) =>
                    day % Math.max(1, Math.floor(days / 8)) === 0 ||
                    day === days - 1 ? (
                      <circle
                        key={day}
                        cx={38 + (day * 586) / (days - 1)}
                        cy={180 - (value / maximum) * 156}
                        r="3"
                        fill={item.color}
                        stroke="white"
                      >
                        <title>
                          {item.name}: {value}
                        </title>
                      </circle>
                    ) : null,
                  )}
                </g>
              );
            })}
          </svg>
          <div className="academy-legend">
            {series.map((item) => (
              <span key={item.name}>
                <i style={{ background: item.color }} />
                {item.name}
              </span>
            ))}
          </div>
        </article>

        <article className="academy-panel">
          <header>
            <span className="academy-icon academy-icon--amber">
              <Zap size={25} />
            </span>
            <div>
              <h2>Needs Attention</h2>
              <p>Items that may require your action.</p>
            </div>
          </header>
          <div className="academy-priorities">
            {priorities.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => openModule(item.module)}>
                  <Icon size={21} />
                  <span>{item.label}</span>
                  <strong>{loading ? "—" : item.value}</strong>
                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>
        </article>

        <article className="academy-panel academy-action-center">
          <header>
            <span className="academy-icon">
              <Zap size={25} />
            </span>
            <div>
              <h2>Admin Action Center</h2>
              <p>Quick access to the tasks that matter most.</p>
            </div>
          </header>
          <div className="academy-priorities academy-action-list">
            {actionItems.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.label} onClick={() => openModule(item.module)}>
                  <Icon size={20} />
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </span>
                  <strong>{loading ? "—" : item.value}</strong>
                  <ChevronRight size={17} />
                </button>
              );
            })}
          </div>
        </article>
      </div>

      <footer className="academy-banner">
        <div className="academy-banner-art" aria-hidden="true">
          <BarChart3 size={57} />
        </div>
        <div>
          <strong>Everything you need to manage and grow your academy.</strong>
          <p>
            Manage programs, track enrollments, handle payments and build a better
            learning experience.
          </p>
        </div>
        <button onClick={() => openModule("Categories")}>
          <BriefcaseBusiness size={18} />
          Manage catalog
          <ArrowRight size={19} />
        </button>
      </footer>
    </section>
  );
}
