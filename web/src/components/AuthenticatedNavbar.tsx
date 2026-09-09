import { AdminWorkspaceSearch } from "./AdminWorkspaceSearch";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, ChevronDown, LayoutDashboard, LifeBuoy, LogOut, UserRound } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import { env } from "../config/env";
import { useAuth } from "../features/auth/context/useAuth";
import { studentLmsApi } from "../features/lms/api/lmsApi";
import type { NotificationResponse } from "../features/lms/api/lmsTypes";

export function AuthenticatedNavbar() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const actionsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const user = auth.user;
  const isStudent = user?.roles.includes("Student") ?? false;
  const profilePath = "/profile";
  const supportPath = isStudent && user?.onboardingStatus !== "Completed"
    ? "/request-callback"
    : "/dashboard?section=Support";
  const profilePhotoUrl = user?.profilePhotoUrl ? toApiFileUrl(user.profilePhotoUrl) : "";
  const initials = useMemo(() => getInitials(user?.fullName), [user?.fullName]);
  const unreadCount = notifications.filter((notification) => notification.status !== "Read").length;

  useEffect(() => {
    setNotificationsOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isStudent || user?.onboardingStatus !== "Completed") {
      setNotifications([]);
      return;
    }

    let mounted = true;
    studentLmsApi
      .getDashboard()
      .then((response) => {
        if (mounted) {
          setNotifications(response.data.notifications.slice(0, 6));
        }
      })
      .catch(() => {
        if (mounted) {
          setNotifications([]);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isStudent, user?.onboardingStatus]);

  useEffect(() => {
    function closeMenus(event: PointerEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function markNotificationRead(notification: NotificationResponse) {
    if (notification.status !== "Read") {
      try {
        await studentLmsApi.markNotificationRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? { ...item, status: "Read" } : item))
        );
      } catch {
        return;
      }
    }

    if (notification.actionUrl?.startsWith("/") && !notification.actionUrl.startsWith("//")) {
      navigate(notification.actionUrl);
    }
  }

  async function logout() {
    setIsLoggingOut(true);
    try {
      await auth.logout();
    } finally {
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }

  if (!user) {
    return null;
  }

  return (
    <header className="auth-nav">
      <div className="auth-nav__inner">
        <Link className="auth-nav__brand" to="/dashboard" aria-label="Joviq workspace">
          <BrandLogo compact />
          <div>
            <strong>Joviq Technologies</strong>
            <small>{user.roles[0] ?? "Member"} workspace</small>
          </div>
        </Link>

        {user.roles.includes("Admin") ? <AdminWorkspaceSearch /> : null}
        <div className="auth-nav__actions" ref={actionsRef}>
          <Link
            className={`auth-nav__support-link ${location.pathname === "/dashboard" && new URLSearchParams(location.search).get("section") === "Support" ? "is-active" : ""}`}
            to={supportPath}
            aria-label="Open support"
            title="Support"
          >
            <LifeBuoy size={18} />
            <span>Support</span>
          </Link>

          <div className="auth-nav__menu-wrap">
            <button
              className={`auth-nav__icon-button ${notificationsOpen ? "is-active" : ""}`}
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationsOpen}
              title="Notifications"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setProfileOpen(false);
              }}
            >
              <Bell size={19} />
              {unreadCount ? <span className="auth-nav__badge">{Math.min(unreadCount, 9)}</span> : null}
            </button>

            {notificationsOpen ? (
              <section className="auth-nav__popover auth-nav__notifications" aria-label="Notifications">
                <header>
                  <div>
                    <strong>Notifications</strong>
                    <span>{unreadCount ? `${unreadCount} unread` : "You are all caught up"}</span>
                  </div>
                  <Bell size={18} />
                </header>
                <div className="auth-nav__notification-list">
                  {notifications.length ? notifications.map((notification) => (
                    <button
                      className={notification.status === "Read" ? "is-read" : ""}
                      key={notification.id}
                      type="button"
                      onClick={() => void markNotificationRead(notification)}
                    >
                      <span className="auth-nav__notification-status">
                        {notification.status === "Read" ? <Check size={13} /> : null}
                      </span>
                      <span>
                        <strong>{notification.title}</strong>
                        <small>{notification.body}</small>
                        <time>{formatNotificationTime(notification.createdAt)}</time>
                      </span>
                    </button>
                  )) : (
                    <div className="auth-nav__empty-notifications">
                      <Bell size={22} />
                      <strong>No new notifications</strong>
                      <span>Important learning updates will appear here.</span>
                    </div>
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <div className="auth-nav__menu-wrap">
            <button
              className={`auth-nav__profile-button ${profileOpen ? "is-active" : ""}`}
              type="button"
              aria-label="Open profile menu"
              aria-expanded={profileOpen}
              onClick={() => {
                setProfileOpen((current) => !current);
                setNotificationsOpen(false);
              }}
            >
              <span className={`auth-nav__avatar ${profilePhotoUrl ? "has-photo" : ""}`}>
                {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : initials}
              </span>
              <span className="auth-nav__identity">
                <strong>{user.fullName}</strong>
                <small>{user.roles.join(" / ")}</small>
              </span>
              <ChevronDown size={16} />
            </button>

            {profileOpen ? (
              <section className="auth-nav__popover auth-nav__profile-menu" aria-label="Profile menu">
                <div className="auth-nav__profile-summary">
                  <span className={`auth-nav__avatar auth-nav__avatar--large ${profilePhotoUrl ? "has-photo" : ""}`}>
                    {profilePhotoUrl ? <img src={profilePhotoUrl} alt="" /> : initials}
                  </span>
                  <div>
                    <strong>{user.fullName}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <Link to={profilePath}>
                  <UserRound size={17} />
                  Profile
                </Link>
                <Link to="/dashboard">
                  <LayoutDashboard size={17} />
                  Open dashboard
                </Link>
                <button type="button" onClick={() => void logout()} disabled={isLoggingOut}>
                  <LogOut size={17} />
                  {isLoggingOut ? "Signing out..." : "Logout"}
                </button>
              </section>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function toApiFileUrl(path: string) {
  return /^https?:\/\//i.test(path) ? path : `${env.apiBaseUrl}${path}`;
}

function getInitials(name?: string) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return (parts.slice(0, 2).map((part) => part.charAt(0)).join("") || "J").toUpperCase();
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}
