import React from 'react';

export default function PrivacyAndTerms() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans dir-ltr">
      <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden p-6 sm:p-10">
        
        {/* Header Banner */}
        <div className="border-b border-slate-800 pb-8 mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-400 tracking-tight">
            Zunexa AI
          </h1>
          <p className="text-lg text-slate-300 font-medium mt-1">
            Terms of Service & Privacy Policy Document
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-md border border-slate-800">
            <span>Effective Date: August 28, 2026</span>
            <span>•</span>
            <span>Version 1.0</span>
            <span>•</span>
            <span>Standard Operating Terms</span>
          </div>
        </div>

        {/* Introduction */}
        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          Welcome to <strong className="text-white">Zunexa AI</strong>. These Terms of Service and Privacy Policy govern your access to and use of the Zunexa AI application, platform, and content generation services. By registering an account or utilizing our services, you expressly agree to comply with and be bound by the terms contained herein.
        </p>

        {/* Callout Notice */}
        <div className="bg-sky-950/40 border-l-4 border-sky-500 p-4 rounded-r-md mb-8 text-xs sm:text-sm text-sky-200">
          <strong>Notice:</strong> Zunexa AI is an automated content generation platform supporting multiple regional and international languages, including Moroccan Darija, Gulf Arabic, Franco-Arabe, French, and English.
        </div>

        {/* Part 1: Terms of Service */}
        <section className="mb-10">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-md font-bold text-sm tracking-wider uppercase mb-6">
            Part I: Terms of Service
          </div>

          <div className="space-y-6 text-sm sm:text-base text-slate-300">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                1. Acceptance of Terms
              </h2>
              <p>By creating an account, logging into, or interacting with Zunexa AI, you acknowledge that you have read, understood, and agreed to these Terms of Service. If you do not agree to these terms, you must immediately cease all usage of the platform.</p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                2. Age & Minimum Eligibility
              </h2>
              <p>You must be at least 13 years of age (or 16 years of age where required by local regulations) to access and use Zunexa AI. Minors using the platform must do so under the supervision and consent of a parent or legal guardian.</p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                3. AI Output Disclaimer & Accuracy
              </h2>
              <p className="mb-2">Zunexa AI utilizes advanced artificial intelligence models to process inputs and generate text and project management material.</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong className="text-slate-200">Automated Nature:</strong> Outputs are generated algorithmically and may occasionally contain inaccuracies, incomplete information, or unexpected errors.</li>
                <li><strong className="text-slate-200">User Verification:</strong> You are solely responsible for reviewing, validating, and verifying the accuracy and appropriateness of any generated content prior to its commercial or personal publication.</li>
                <li><strong className="text-slate-200">No Liability:</strong> Zunexa AI accepts no liability or legal responsibility for decisions, business operations, or actions taken based upon AI-generated outputs.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                4. Intellectual Property & Asset Ownership
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong className="text-slate-200">Your Inputs & Outputs:</strong> You retain full ownership of the text prompts, inputs, and generated project assets created under your account.</li>
                <li><strong className="text-slate-200">Platform IP:</strong> Zunexa AI retains exclusive ownership of the platform's codebase, UI/UX designs, system architectures, database schemas, logos, and visual styling (including Zalij Mode styling).</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                5. Acceptable Use & Prohibited Conduct
              </h2>
              <p className="mb-2">You agree to use Zunexa AI strictly for lawful purposes. Prohibited activities include, but are not limited to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>Generating illegal, defamatory, hateful, fraudulent, or harassing material.</li>
                <li>Attempting to reverse-engineer, decompile, or extract the platform's source code or underlying system prompts.</li>
                <li>Bypassing security controls, authentication protocols, or system rate limits.</li>
                <li>Automating interactions or scraping platform resources without authorization.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                6. Rate Limits & Fair Use Policy
              </h2>
              <p>To preserve performance and ensure equitable system access across all users, Zunexa AI reserves the right to enforce usage quotas, token allocations, API rate limits, or concurrency restrictions on accounts without prior notification.</p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                7. Limitation of Liability & Availability
              </h2>
              <p>The service is provided on an <strong className="text-slate-200">"AS IS"</strong> and <strong className="text-slate-200">"AS AVAILABLE"</strong> basis. Zunexa AI makes no guarantees regarding uninterrupted uptime or error-free execution. To the fullest extent permitted by applicable law, Zunexa AI is not liable for indirect, incidental, consequential damages, or loss of data resulting from server downtime or service outages.</p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                8. Account Termination & Suspension
              </h2>
              <p>Zunexa AI reserves the right to suspend or permanently terminate any user account at its discretion, without prior notice, in the event of a breach of these Terms or suspected system abuse.</p>
            </div>
          </div>
        </section>

        {/* Part 2: Privacy Policy */}
        <section className="mb-10">
          <div className="bg-slate-800 text-white px-4 py-2 rounded-md font-bold text-sm tracking-wider uppercase mb-6">
            Part II: Privacy Policy
          </div>

          <div className="space-y-6 text-sm sm:text-base text-slate-300">
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                1. Information We Collect
              </h2>
              <p className="mb-2">We collect minimal data required to provide, secure, and optimize Zunexa AI services:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong className="text-slate-200">Account Information:</strong> Email address, username, authentication metadata, and user preferences.</li>
                <li><strong className="text-slate-200">Platform Content:</strong> Prompts, text inputs, generated outputs, project metadata, and saved workflows.</li>
                <li><strong className="text-slate-200">Technical Logs:</strong> IP addresses, browser specifications, device identifiers, and request logs.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                2. How We Use Collected Data
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li>To execute AI generation tasks, maintain project workspaces, and deliver platform features.</li>
                <li>To monitor performance, protect system security, and manage server infrastructure.</li>
                <li>To communicate essential administrative notices, technical updates, and support communications.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                3. Third-Party Infrastructure & Data Processing
              </h2>
              <p>Zunexa AI relies on secure third-party infrastructure (such as cloud database providers like Supabase and AI model execution providers) to process inputs and host data. Your data may be transmitted through and processed on secure servers maintained by these authorized service partners solely for service delivery. <strong className="text-white">Zunexa AI does not sell your personal data to third parties.</strong></p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                4. Data Security & Legal Compliance
              </h2>
              <p>We enforce administrative and technical safeguards to protect data integrity. For users located in Morocco or internationally, Zunexa AI respects applicable data protection principles, including key directives aligned with Moroccan Law No. 09.08 concerning the protection of individuals with regard to the processing of personal data.</p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                5. User Data Rights
              </h2>
              <p>You maintain the right to inspect, update, or request the permanent deletion of your account and personal data from our systems. Requests can be submitted directly via the support channel outlined below.</p>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white mb-2 border-b border-slate-800 pb-1">
                6. Modifications to Policy & Terms
              </h2>
              <p>Zunexa AI reserves the right to modify these Terms of Service and Privacy Policy at any time. Updated documents become effective immediately upon posting to the platform. Continued use of Zunexa AI constitutes full acceptance of the revised policy.</p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-5">
          <h3 className="text-base font-semibold text-white mb-1">Contact & Support</h3>
          <p className="text-sm text-slate-400">
            For questions, support, or data privacy requests regarding Zunexa AI, please contact: <strong className="text-sky-400">support@zunexa.ai</strong>
          </p>
        </div>

      </div>
    </div>
  );
}
