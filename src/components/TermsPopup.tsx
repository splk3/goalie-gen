import * as React from "react"

export default function TermsPopup() {
  const [isOpen, setIsOpen] = React.useState<boolean>(false)

  const openTerms = () => setIsOpen(true)
  const closeTerms = () => setIsOpen(false)

  // Handle Escape key to close modal
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        closeTerms()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  return (
    <>
      <button
        onClick={openTerms}
        className="text-usa-white hover:text-gray-300 dark:text-gray-300 dark:hover:text-white underline transition-colors"
      >
        Terms of Use
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={closeTerms}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-3xl w-full shadow-2xl my-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-heading"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6">
              <h2 id="terms-heading" className="text-3xl font-bold text-usa-blue dark:text-blue-400 mb-2">
                Terms of Use
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Effective Date: January 8, 2026
              </p>
            </div>

            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6 text-gray-700 dark:text-gray-300">
              {/* Acceptance of Terms */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  1. Acceptance of Terms
                </h3>
                <p className="mb-2">
                  By accessing and using Goalie Gen (the "Site"), you acknowledge that you have read, 
                  understood, and agree to be bound by these Terms of Use. Your use of the Site 
                  constitutes your acceptance of these terms. If you do not agree to these terms, 
                  please do not use the Site.
                </p>
              </section>

              {/* Informational Purpose */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  2. Informational Purpose
                </h3>
                <p className="mb-2">
                  The Site provides informational content, tools, and resources related to youth ice 
                  hockey goaltending development. All content, plans, drills, and materials are 
                  provided for educational and informational purposes only.
                </p>
              </section>

              {/* User Responsibility */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  3. User Responsibility
                </h3>
                <p className="mb-2">
                  <strong className="text-usa-red dark:text-red-400">
                    YOU ARE SOLELY RESPONSIBLE FOR YOUR USE OF THE SITE AND ALL INFORMATION, 
                    PLANS, AND RESOURCES OBTAINED FROM IT.
                  </strong>
                </p>
                <p className="mb-2">
                  You acknowledge and agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    You must review all resources, plans, drills, and materials for accuracy, 
                    appropriateness, and safety before implementation.
                  </li>
                  <li>
                    You are responsible for verifying that any training plans or drills are 
                    appropriate for the skill level, age, and physical condition of participants.
                  </li>
                  <li>
                    You should consult with qualified hockey coaches, trainers, and medical 
                    professionals before implementing any training programs.
                  </li>
                  <li>
                    You assume all risks associated with the use of information from this Site.
                  </li>
                  <li>
                    The Site operators are not responsible for any injuries, damages, or losses 
                    that may result from your use or misuse of the information provided.
                  </li>
                </ul>
              </section>

              {/* No Professional Advice */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  4. No Professional Advice
                </h3>
                <p className="mb-2">
                  The content on this Site does not constitute professional coaching, medical, or 
                  legal advice. The Site is not a substitute for professional consultation with 
                  qualified coaches, trainers, or medical professionals. Always seek the advice of 
                  qualified professionals regarding athletic training, injury prevention, and player 
                  development.
                </p>
              </section>

              {/* As-Is and As-Available */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  5. "As-Is" and "As-Available" Basis
                </h3>
                <p className="mb-2">
                  The Site and all content, materials, and tools are provided on an "AS-IS" and 
                  "AS-AVAILABLE" basis without warranties of any kind, either express or implied. 
                  We do not warrant that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The Site will be uninterrupted, secure, or error-free</li>
                  <li>The information provided will be accurate, complete, or current</li>
                  <li>Any defects or errors will be corrected</li>
                  <li>The Site or its content will meet your specific requirements</li>
                </ul>
              </section>

              {/* Limitation of Liability */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  6. Limitation of Liability
                </h3>
                <p className="mb-2">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, THE SITE OPERATORS SHALL NOT BE LIABLE 
                  FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY 
                  LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS 
                  OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE 
                  SITE OR ANY CONTENT OBTAINED FROM THE SITE.
                </p>
              </section>

              {/* User Conduct */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  7. User Conduct
                </h3>
                <p className="mb-2">
                  You agree to use the Site only for lawful purposes and in a manner that does not 
                  infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of 
                  the Site. You may not use the Site in any way that could damage, disable, 
                  overburden, or impair the Site or interfere with any other party's use of the Site.
                </p>
              </section>

              {/* Intellectual Property */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  8. Intellectual Property
                </h3>
                <p className="mb-2">
                  All content on this Site, including but not limited to text, graphics, logos, 
                  images, and software, is the property of Patrick Boyle, Katie Jablynski, and James Kujawski and of their respective content suppliers. 
                  This content is protected by copyright and other intellectual property laws. The content is 
                  provided for your personal, non-commercial use only.
                </p>
              </section>

              {/* Privacy Policy */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  9. Privacy Policy
                </h3>
                <p className="mb-3">
                  Your use of the Site is also governed by our privacy practices:
                </p>
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Data Collection and Usage</h4>
                  <p className="mb-2">
                    Site usage is tracked for analytics and diagnostic purposes to help improve 
                    the Site. Information such as team names and plan settings may be collected, 
                    but no individual player names, contact details, or other direct personal 
                    identifiers are recorded.
                  </p>
                  <p className="mb-2">
                    We use this information solely to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Improve site functionality and user experience</li>
                    <li>Understand how users interact with our tools and resources</li>
                    <li>Identify and fix technical issues</li>
                    <li>Generate aggregate statistics about site usage</li>
                  </ul>
                  <p className="mt-2">
                    We do not sell, rent, or share your information with third parties for 
                    marketing purposes.
                  </p>
                </div>
              </section>

              {/* Changes to Terms */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  10. Changes to Terms
                </h3>
                <p className="mb-2">
                  We reserve the right to modify these Terms of Use at any time. Any changes will 
                  be effective immediately upon posting to the Site. Your continued use of the Site 
                  after any such changes constitutes your acceptance of the new Terms of Use.
                </p>
              </section>

              {/* Contact Information */}
              <section>
                <h3 className="text-xl font-semibold text-usa-blue dark:text-blue-400 mb-3">
                  11. Contact Information
                </h3>
                <p className="mb-2">
                  If you have any questions about these Terms of Use, please contact us through 
                  the GitHub repository at{" "}
                  <a 
                    href="https://github.com/splk3/goalie-gen" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-usa-blue dark:text-blue-400 hover:underline"
                  >
                    https://github.com/splk3/goalie-gen
                  </a>.
                </p>
              </section>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeTerms}
                className="bg-usa-blue hover:bg-blue-900 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
