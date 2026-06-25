import type { ReactNode } from "react";

function navTo(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new Event("choicepath:navigate"));
}

function NavLink({ href, children, exact = false }: { href: string; children: ReactNode; exact?: boolean }) {
  const current = window.location.pathname;
  const active = exact ? current === href : current === href || current.startsWith(`${href}/`);
  const cls = `px-4 py-2 rounded-md font-semibold text-sm sm:text-base transition-colors ${
    active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
  }`;

  return (
    <a
      href={href}
      className={cls}
      onClick={(e) => {
        e.preventDefault();
        navTo(href);
      }}
    >
      {children}
    </a>
  );
}

export function AppNav() {
  return (
    <nav className="w-full border-b bg-card sticky top-0 z-10">
      <div className="max-w-screen-2xl mx-auto flex items-center gap-2 p-3 flex-wrap">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navTo("/");
          }}
          className="text-xl font-extrabold mr-auto"
        >
          🎯 ChoicePath
        </a>
        <NavLink href="/" exact>Class Board</NavLink>
        <NavLink href="/attendance">Attendance</NavLink>
        <NavLink href="/settings">Settings</NavLink>
      </div>
    </nav>
  );
}
