import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  CheckCircle2,
  Clock3,
  Laptop,
  LogOut,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  UserRound
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ToastMessage } from "../components/ToastMessage";
import { env } from "../config/env";
import { authApi } from "../features/auth/api/authApi";
import type { AccountProfile, SessionResponse } from "../features/auth/api/authTypes";
import { useAuth } from "../features/auth/context/useAuth";
import { formatApiError } from "../lib/api/httpClient";
import { DashboardSidebar, type PrimaryRole } from "./DashboardPage";

type MessageState = { tone: "success" | "error"; text: string } | null;

type ProfileForm = {
  fullName: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
};

const emptyForm: ProfileForm = {
  fullName: "",
  phoneNumber: "",
  dateOfBirth: "",
  address: "",
  city: "",
  state: ""
};

export function ProfilePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const primaryRole: PrimaryRole = auth.user?.roles.includes("Admin") ? "Admin" : "Student";
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingSessions, setIsRefreshingSessions] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [profileTab, setProfileTab] = useState("personal");
  const [compactSessions, setCompactSessions] = useState(() => { try { return localStorage.getItem("joviq-compact-sessions") === "true"; } catch { return false; } });
  const [isSaving, setIsSaving] = useState(false);
  const [actionSessionId, setActionSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  const hydrateProfile = useCallback((nextProfile: AccountProfile) => {
    setProfile(nextProfile);
    setForm({
      fullName: nextProfile.fullName,
      phoneNumber: nextProfile.phoneNumber ?? "",
      dateOfBirth: nextProfile.dateOfBirth ?? "",
      address: nextProfile.address ?? "",
      city: nextProfile.city ?? "",
      state: nextProfile.state ?? ""
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const [profileResponse, sessionsResponse] = await Promise.all([authApi.getProfile(), authApi.getSessions()]);
      hydrateProfile(profileResponse.data);
      setSessions(sessionsResponse.data);
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsLoading(false);
    }
  }, [hydrateProfile]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const profilePhotoUrl = profile?.profilePhotoUrl ? toApiFileUrl(profile.profilePhotoUrl) : "";
  const initials = useMemo(() => getInitials(profile?.fullName ?? auth.user?.fullName), [auth.user?.fullName, profile?.fullName]);
  const currentSession = sessions.find((session) => session.isCurrent);
  const otherSessionCount = Math.max(sessions.length - (currentSession ? 1 : 0), 0);

  function openDashboardModule(module: string) {
    navigate(module === "Overview" ? "/dashboard" : `/dashboard?section=${encodeURIComponent(module)}`);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.fullName.trim().length < 2) {
      setMessage({ tone: "error", text: "Full name must contain at least 2 characters." });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await authApi.updateProfile({
        fullName: form.fullName.trim(),
        phoneNumber: optionalText(form.phoneNumber),
        dateOfBirth: optionalText(form.dateOfBirth),
        address: optionalText(form.address),
        city: optionalText(form.city),
        state: optionalText(form.state)
      });
      hydrateProfile(response.data);
      setEditingDetails(false);
      await auth.loadMe();
      setMessage({ tone: "success", text: "Your profile details were saved." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsSaving(false);
    }
  }

  async function refreshSessions() {
    setIsRefreshingSessions(true);
    setMessage(null);

    try {
      const response = await authApi.getSessions();
      setSessions(response.data);
      setMessage({ tone: "success", text: "Device sessions refreshed." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setIsRefreshingSessions(false);
    }
  }

  async function signOutSession(session: SessionResponse) {
    setActionSessionId(session.id);
    setMessage(null);

    try {
      if (session.isCurrent) {
        await auth.logout();
        navigate("/login", { replace: true });
        return;
      }

      await authApi.revokeSession(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setMessage({ tone: "success", text: `${getDeviceName(session)} was signed out.` });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionSessionId(null);
    }
  }

  async function signOutOtherDevices() {
    if (!otherSessionCount) {
      return;
    }

    setActionSessionId("other-devices");
    setMessage(null);

    try {
      await authApi.revokeOtherSessions();
      setSessions((current) => current.filter((session) => session.isCurrent));
      setMessage({ tone: "success", text: "All other devices were signed out." });
    } catch (error) {
      setMessage({ tone: "error", text: formatApiError(error) });
    } finally {
      setActionSessionId(null);
    }
  }

  if (isLoading) {
    return (
      <ProfileWorkspace role={primaryRole} onModuleChange={openDashboardModule}>
        <main className="profile-page profile-page--loading">
          <RefreshCw className="spin" size={28} />
          <span>Loading your profile...</span>
        </main>
      </ProfileWorkspace>
    );
  }

  if (!profile) {
    return (
      <ProfileWorkspace role={primaryRole} onModuleChange={openDashboardModule}>
        <main className="profile-page profile-page--loading">
          <section className="profile-empty-state">
            <UserRound size={30} />
            <h1>Profile could not be loaded.</h1>
            {message ? <p>{message.text}</p> : null}
            <button className="primary-action profile-empty-state__button" type="button" onClick={() => void loadProfile()}>
              Try again
            </button>
          </section>
        </main>
      </ProfileWorkspace>
    );
  }

  return (
    <ProfileWorkspace role={primaryRole} onModuleChange={openDashboardModule}>
      <main className={`profile-page ${primaryRole === "Admin" ? "admin-profile-reference" : ""} ${compactSessions ? "profile-compact-sessions" : ""}`}>
      <section className="profile-page__hero">
        <div>
          <span className="eyebrow"><Link to="/dashboard">Dashboard</Link> / Profile</span>
          <h1>Your profile</h1>
          <p>Manage your personal details and account settings.</p>
        </div>
        <div className="profile-page__hero-badge">
          <ShieldCheck size={19} />
          <span>
            <strong>Account protected</strong>
            <small>{sessions.length} active device{sessions.length === 1 ? "" : "s"}</small>
          </span>
        </div>
      </section>

      <ToastMessage message={message} onDismiss={() => setMessage(null)} />

      <div className="profile-page__layout">
        <aside className="profile-page__summary">
          <div className={`profile-page__avatar ${profilePhotoUrl ? "has-photo" : ""}`}>
            {profilePhotoUrl ? <img src={profilePhotoUrl} alt={`${profile.fullName} profile`} /> : initials}
          </div>
          <span className="eyebrow">{profile.roles.join(" / ")}</span>
          <h2>{profile.fullName}</h2>
          <p>{profile.email}</p>
          <div className="profile-page__status-list">
            <span><CheckCircle2 size={15} /> {formatStatus(profile.accountStatus)}</span>
            <span><Mail size={15} /> {profile.emailConfirmed ? "Email verified" : "Email pending"}</span>
            <span><Phone size={15} /> {profile.phoneNumber ? "Phone added" : "Phone not added"}</span>
          </div>
          <div className="profile-page__summary-actions">
            <Link className="secondary-action" to="/dashboard">Back to dashboard</Link>
            {profile.roles.includes("Student") ? (
              <Link className="profile-page__text-link" to="/student/onboarding">Manage learning profile</Link>
            ) : null}
          </div>
        </aside>

        <div className="profile-page__content">
          <section className="profile-panel profile-personal">
            {primaryRole === "Admin" && <nav className="admin-profile-tabs" aria-label="Profile sections"><button type="button" aria-pressed={profileTab === "personal"} onClick={() => setProfileTab("personal")}><UserRound size={16}/>Personal Details</button><button type="button" aria-pressed={profileTab === "security"} onClick={() => { setProfileTab("security"); document.querySelector(".profile-sessions")?.scrollIntoView({behavior:"smooth",block:"center"}); }}><ShieldCheck size={16}/>Security</button><button type="button" aria-pressed={profileTab === "preferences"} onClick={() => setProfileTab("preferences")}>Preferences</button></nav>}
            {profileTab === "preferences" && primaryRole === "Admin" ? <div className="admin-profile-preferences"><h2>Display preferences</h2><label><input type="checkbox" checked={compactSessions} onChange={event=>{setCompactSessions(event.target.checked);try { localStorage.setItem("joviq-compact-sessions",String(event.target.checked)); } catch { /* Preference still applies for this session. */ }}}/> Compact device session list</label><p>Saved for this browser.</p></div> : <>
            <header className="profile-panel__header">
              <div>
                <span className="eyebrow">Personal details</span>
                <h2>Personal Information</h2>
                <p>These details are used across your account and learning workspace.</p>
              </div>
              {primaryRole === "Admin" ? <button type="button" className="secondary-action" onClick={()=>{if(editingDetails)hydrateProfile(profile);setEditingDetails(value=>!value);}}>{editingDetails ? "Cancel editing" : "Edit Details"}</button> : <UserRound size={22} />}
            </header>

            <form className="profile-form" onSubmit={saveProfile}><fieldset disabled={primaryRole === "Admin" && !editingDetails}>
              <label>
                Full name
                <input
                  autoComplete="name"
                  maxLength={160}
                  required
                  value={form.fullName}
                  onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                />
              </label>
              <label>
                Email address
                <input autoComplete="email" disabled value={profile.email} />
                <small className="profile-form__hint">Email changes require verification and are not available here.</small>
              </label>
              <label>
                Phone number
                <input
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={16}
                  placeholder="+91 98765 43210"
                  value={form.phoneNumber}
                  onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
                />
              </label>
              <label>
                Date of birth
                <input
                  max={new Date().toISOString().slice(0, 10)}
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => setForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                />
              </label>
              <label>
                City
                <input
                  autoComplete="address-level2"
                  maxLength={120}
                  placeholder="Hyderabad"
                  value={form.city}
                  onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                />
              </label>
              <label>
                State
                <input
                  autoComplete="address-level1"
                  maxLength={120}
                  placeholder="Telangana"
                  value={form.state}
                  onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                />
              </label>
              <label className="profile-form__wide">
                Address
                <textarea
                  autoComplete="street-address"
                  maxLength={500}
                  placeholder="House, street, area"
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                />
              </label>
              <div className="profile-form__actions">
                <span>Changes are saved securely to your account.</span>
                <button className="primary-action" type="submit" disabled={isSaving}>
                  <Save size={17} />
                  {isSaving ? "Saving..." : "Save details"}
                </button>
              </div>
            </fieldset></form></>}
          </section>

          <section className="profile-panel profile-sessions">
            <header className="profile-panel__header profile-sessions__header">
              <div>
                <span className="eyebrow">Security</span>
                <h2>Where you’re signed in</h2>
                <p>Review active devices and sign out anything you no longer use.</p>
              </div>
              <button className="icon-action" type="button" onClick={() => void refreshSessions()} disabled={isRefreshingSessions} title="Refresh device sessions">
                <RefreshCw className={isRefreshingSessions ? "spin" : ""} size={18} />
              </button>
            </header>

            <div className="profile-sessions__toolbar">
              <span><ShieldCheck size={16} /> {sessions.length} active device{sessions.length === 1 ? "" : "s"}</span>
              <button className="secondary-action" type="button" onClick={() => void signOutOtherDevices()} disabled={!otherSessionCount || actionSessionId !== null}>
                <LogOut size={16} />
                {actionSessionId === "other-devices" ? "Signing out..." : "Sign out other devices"}
              </button>
            </div>

            <div className="profile-sessions__grid">
              {sessions.length ? sessions.map((session) => (
                <SessionTile
                  key={session.id}
                  session={session}
                  isBusy={actionSessionId === session.id || actionSessionId === "other-devices"}
                  onSignOut={() => void signOutSession(session)}
                />
              )) : (
                <div className="profile-sessions__empty">
                  <Laptop size={25} />
                  <strong>No active device sessions</strong>
                  <span>Sign in again to create a new secure session.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      </main>
    </ProfileWorkspace>
  );
}

function ProfileWorkspace({
  role,
  onModuleChange,
  children
}: {
  role: PrimaryRole;
  onModuleChange: (module: string) => void;
  children: ReactNode;
}) {
  return (
    <div className={`profile-workspace dashboard-shell dashboard-shell--${role.toLowerCase()}`}>
      <DashboardSidebar activeModule="__profile__" onModuleChange={onModuleChange} role={role} />
      <section className="profile-workspace__main">{children}</section>
    </div>
  );
}

function SessionTile({
  session,
  isBusy,
  onSignOut
}: {
  session: SessionResponse;
  isBusy: boolean;
  onSignOut: () => void;
}) {
  const DeviceIcon = /android|iphone|ipad|mobile/i.test(`${session.operatingSystem} ${session.browser}`) ? Smartphone : Laptop;

  return (
    <article className={`profile-session-tile ${session.isCurrent ? "is-current" : ""}`}>
      <div className="profile-session-tile__icon"><DeviceIcon size={21} /></div>
      <div className="profile-session-tile__body">
        <div className="profile-session-tile__title-row">
          <h3>{getDeviceName(session)}</h3>
          {session.isCurrent ? <span className="profile-session-tile__current">This device</span> : null}
        </div>
        <p>{[session.browser, session.operatingSystem].filter(Boolean).join(" · ") || "Browser details unavailable"}</p>
        <div className="profile-session-tile__meta">
          <span><Clock3 size={13} /> Last active {formatDate(session.lastSeenAt ?? session.createdAt)}</span>
          {session.ipAddress ? <span><MapPin size={13} /> {session.ipAddress}</span> : null}
        </div>
      </div>
      <button className="profile-session-tile__signout" type="button" onClick={onSignOut} disabled={isBusy}>
        <LogOut size={15} />
        {isBusy ? "Signing out..." : "Sign out"}
      </button>
    </article>
  );
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed || null;
}

function toApiFileUrl(path: string) {
  return /^https?:\/\//i.test(path) ? path : `${env.apiBaseUrl}${path}`;
}

function getInitials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (parts.slice(0, 2).map((part) => part.charAt(0)).join("") || "J").toUpperCase();
}

function getDeviceName(session: SessionResponse) {
  const storedName = session.deviceName?.trim();
  if (storedName && !/^Joviq Web(?: OAuth)?$/i.test(storedName)) {
    return storedName;
  }

  return [session.browser, session.operatingSystem].filter(Boolean).join(" on ") || storedName || "Unknown device";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function formatStatus(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
