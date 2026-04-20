import * as React from "react";
import { Link } from "gatsby";
import Logo from "./Logo";
import DarkModeToggle from "./DarkModeToggle";
import UsaHockeyGoldBanner from "./UsaHockeyGoldBanner";

interface PageLayoutProps {
  children: React.ReactNode;
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-usa-white dark:bg-gray-900 transition-colors">
      <header className="bg-usa-blue dark:bg-gray-800 text-usa-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link to="/">
              <Logo variant="full" format="png" className="w-32 md:w-48 lg:w-64" />
            </Link>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">{children}</main>

      <footer className="bg-usa-blue dark:bg-gray-800 text-usa-white py-8 mt-12">
        <div className="container mx-auto px-4">
          <UsaHockeyGoldBanner showCopyright showTerms />
        </div>
      </footer>
    </div>
  );
}
