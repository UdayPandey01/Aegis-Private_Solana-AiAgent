// components/Footer.tsx
"use client"

import Link from "next/link"
import { Shield, Github, Twitter, MessageCircle } from "lucide-react"

export function Footer() {
  return (
    <footer id="community" className="relative border-t border-white/10 py-16 overflow-hidden bg-black">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-3 mb-4">
              <Shield className="h-7 w-7 text-white" />
              <span className="font-heading text-2xl font-semibold text-slate-50">
                AEGIS
              </span>
            </Link>
            <p className="font-sans text-base text-slate-400 max-w-md">
              Private, autonomous trading agents for Solana. Built on zero-knowledge proofs and confidential computation.
            </p>
          </div>

          <FooterLinks title="Product" links={[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How It Works" },
              { href: "/app/marketplace", label: "Agent Templates" },
              { href: "/app", label: "Launch App" },
          ]} />
          
          <FooterLinks title="Resources" links={[
              { href: "#", label: "Documentation" },
              { href: "#", label: "API Reference" },
              { href: "#", label: "Discord" },
              { href: "#", label: "GitHub" },
          ]} />
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex space-x-4 order-2 sm:order-1 mt-4 sm:mt-0">
              <SocialLink href="#"><Twitter className="h-5 w-5" /></SocialLink>
              <SocialLink href="#"><Github className="h-5 w-5" /></SocialLink>
              <SocialLink href="#"><MessageCircle className="h-5 w-5" /></SocialLink>
          </div>
          <p className="font-sans text-sm text-slate-500 order-1 sm:order-2">
            © {new Date().getFullYear()} Aegis. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

const FooterLinks = ({ title, links }) => (
    <div>
        <h3 className="font-heading font-semibold mb-4 text-slate-50">{title}</h3>
        <ul className="space-y-3">
            {links.map(link => (
                <li key={link.label}>
                    <Link href={link.href} className="font-sans text-sm text-slate-400 hover:text-white transition-colors">
                        {link.label}
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);

const SocialLink = ({ href, children }) => (
    <Link href={href} className="text-slate-400 hover:text-white transition-colors">
        {children}
    </Link>
)