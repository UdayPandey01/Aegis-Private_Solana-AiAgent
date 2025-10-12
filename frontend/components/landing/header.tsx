"use client";
import { useState } from "react";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "../../components/ui/resizeable-navbar";

import { CustomWalletButton } from "../ui/CustomWalletButton";

export function NavbarDemo() {
  const navItems = [
    { name: "Problem", link: "#problem" },
    { name: "Solution", link: "#solution" },
    { name: "Agents", link: "#agents" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <div className="fixed top-0 left-0 w-full z-50">
        <Navbar>
          <NavBody>
            <NavbarLogo />
            <NavItems items={navItems} />
            <div className="relative z-50 flex items-center gap-4">
              <CustomWalletButton />
            </div>
          </NavBody>

          <MobileNav>
            <MobileNavHeader>
              <NavbarLogo />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </MobileNavHeader>

            <MobileNavMenu
              isOpen={isMobileMenuOpen}
              onClose={() => setIsMobileMenuOpen(false)}
            >
              {navItems.map((item, idx) => (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="relative text-neutral-600 dark:text-neutral-300"
                >
                  <span className="block">{item.name}</span>
                </a>
              ))}
              <div className="flex w-full flex-col gap-4">
                <CustomWalletButton />
              </div>
            </MobileNavMenu>
          </MobileNav>
        </Navbar>
      </div>
    </div>
  );
}
