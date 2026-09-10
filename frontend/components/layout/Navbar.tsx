"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/buttonVariants";
import { Logomark } from "@/components/ui/Logomark";
import { cn } from "@/lib/utils";

// The wallet stack (~180 kB gzip) is the single heaviest thing the app loads.
// Keeping it behind next/dynamic means every route — including `/`, which has
// no wallet interaction at all — paints and hydrates without it.
const NavbarWallet = dynamic(
  () => import("../wallet/NavbarWallet").then((mod) => mod.NavbarWallet),
  {
    ssr: false,
    loading: () => <div className="h-[34px] w-[118px] rounded-md bg-raised" />,
  }
);

// Dashboard leads: it is the destination a returning visitor is here for,
// and everything after it reads outward — the open market, then the pitch.
const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Browse Tasks", href: "/browse" },
  { label: "How it works", href: "/#how-it-works" },
];

// A hash link is a scroll target on the home page, never a "current page".
// Route links stay lit across their children, so /browse/42 still marks Browse
// Tasks — the old `pathname === href` left every task detail page with no nav
// state at all.
function isActive(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const createTaskLink = { label: "Post a Task", href: "/create-task" };

const WORDMARK = "font-display text-[15px] font-semibold tracking-[0.08em] text-hi";

function DesktopNavLink({
  link,
  active,
}: {
  link: { label: string; href: string };
  active: boolean;
}) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex items-center self-stretch px-2.5 text-[13px] tracking-[-0.01em] transition-colors duration-150",
        // Underline grows from the left on hover, stays put on the active page
        "after:absolute after:inset-x-2.5 after:bottom-0 after:h-[2px] after:bg-hi after:origin-left after:transition-transform after:duration-200 after:ease-out-quart motion-reduce:after:transition-none",
        active
          ? "text-hi after:scale-x-100"
          : "text-lo after:scale-x-0 hover:text-hi hover:after:scale-x-100 focus-visible:text-hi focus-visible:after:scale-x-100"
      )}
    >
      {link.label}
    </Link>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (drawerOpen) dialogRef.current?.showModal();
  }, [drawerOpen]);

  // Close the drawer on navigation; no-op when already closed.
  useEffect(() => {
    dialogRef.current?.close();
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-line bg-ink">
        <div className="mx-auto flex h-[52px] max-w-[1280px] items-center justify-between px-6">
          {/* Left: wordmark + primary nav */}
          <div className="flex items-stretch gap-8 self-stretch">
            <Link
              href="/"
              className={cn(
                WORDMARK,
                "flex items-center gap-2 transition-opacity duration-150 hover:opacity-80"
              )}
            >
              <Logomark className="size-[18px]" />
              CLIXO
            </Link>

            <div className="hidden items-stretch gap-0.5 md:flex">
              {navLinks.map((link) => (
                <DesktopNavLink
                  key={link.href}
                  link={link}
                  active={isActive(pathname, link.href)}
                />
              ))}
            </div>
          </div>

          {/* Right: CTA + wallet + hamburger (mobile) */}
          <div className="flex items-center gap-3">
            <Link
              href={createTaskLink.href}
              className={cn(
                buttonVariants({ variant: "primary", size: "sm" }),
                "hidden md:inline-flex"
              )}
            >
              {createTaskLink.label}
            </Link>

            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-line md:block"
            />

            <NavbarWallet />

            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation"
              aria-expanded={drawerOpen}
              className="flex cursor-pointer items-center justify-center p-1.5 text-lo transition-colors duration-100 hover:text-hi md:hidden"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer — native modal dialog: Escape, focus trap, and inert
          background come for free. Content mounts only while open. */}
      <dialog
        ref={dialogRef}
        aria-label="Navigation"
        onClose={() => setDrawerOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.close();
        }}
        className="fixed top-0 right-0 bottom-0 left-auto m-0 h-dvh max-h-none w-[280px] max-w-none translate-x-0 border-l border-line bg-surface p-0 text-lo transition-transform duration-[250ms] ease-[cubic-bezier(0.16,1,0.3,1)] starting:translate-x-full motion-reduce:transition-none backdrop:bg-[rgba(12,12,14,0.75)]"
      >
        {drawerOpen && (
          <div className="flex h-full flex-col">
            {/* Drawer header */}
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-line px-5">
              <span className={cn(WORDMARK, "flex items-center gap-2")}>
                <Logomark className="size-[18px]" />
                CLIXO
              </span>
              <button
                onClick={() => dialogRef.current?.close()}
                aria-label="Close navigation"
                className="flex cursor-pointer items-center p-1 text-dim transition-colors duration-100 hover:text-hi"
              >
                <X size={16} />
              </button>
            </div>

            {/* Drawer links */}
            <nav className="grow divide-y divide-subtle p-3">
              {navLinks.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => dialogRef.current?.close()}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block px-3 py-3 text-sm transition-colors duration-100",
                      active ? "text-hi" : "text-lo hover:text-hi focus-visible:text-hi"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer CTA + wallet */}
            <div className="flex shrink-0 flex-col gap-3 border-t border-line px-5 py-4">
              <Link
                href={createTaskLink.href}
                onClick={() => dialogRef.current?.close()}
                className={buttonVariants({ variant: "primary", className: "w-full" })}
              >
                {createTaskLink.label}
              </Link>
              {/* Drawer instance is a second mount of the same shared config —
                  the navbar instance above already owns the reconnect. */}
              <NavbarWallet reconnectOnMount={false} />
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

export default Navbar;
