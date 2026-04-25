import * as React from "react";
import { withPrefix, useStaticQuery, graphql } from "gatsby";
import TermsPopup from "./TermsPopup";
import FeedbackButton from "./FeedbackButton";

interface UsaHockeyGoldBannerProps {
  showCopyright?: boolean;
  showTerms?: boolean;
}

/**
 * USA Hockey Goaltending Gold Certification banner component.
 * Displays the Gold Level Coach certification badge alongside program information.
 * Used in the welcome section of the home page and as a footer on all other pages.
 */
export default function UsaHockeyGoldBanner({
  showCopyright = false,
  showTerms = false,
}: UsaHockeyGoldBannerProps) {
  const data = useStaticQuery(graphql`
    query {
      site {
        siteMetadata {
          copyrightYear
        }
      }
    }
  `);
  return (
    <>
      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="flex-shrink-0">
          <img
            src={withPrefix("/images/usahockey/usahockey-gold-certification.png")}
            alt="USA Hockey Goaltending Gold Level Coach Certification"
            width={120}
            height={120}
            className="max-w-full h-auto"
          />
        </div>
        <div className="flex-1">
          <p className="text-lg">
            This website was developed as part of the{" "}
            <a
              href="https://lms.usahockeylearningcenter.com/pages/36/goalie-development"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold hover:opacity-80"
            >
              USA Hockey Goaltending Gold Certification Program
            </a>
            {". "}All capstone projects for the program must improve the future of the position and
            produce a resource that will be shared and can be repeated by all coaches across the
            country. The goal of this website is to inform and equip clubs and coaches to best
            develop their goalies, and to help all goalies reach their full potential. This website
            lowers the barriers to all coaches becoming goalie coaches!
          </p>
        </div>
      </div>
      {showCopyright && (
        <p className="text-center text-sm mt-4 opacity-80">
          © {data.site.siteMetadata.copyrightYear} Patrick Boyle, Katie Jablynski, and James
          Kujawski
        </p>
      )}
      {showTerms && (
        <div className="text-center mt-2 flex items-center justify-center gap-3">
          <TermsPopup />
          <FeedbackButton />
        </div>
      )}
    </>
  );
}
