import Link from "next/link";
import Header from "@/components/Header-simple";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="bg-white dark:bg-[#101c22] min-h-screen flex flex-col">
      <Header variant="landing" />
      <div className="flex-1 py-16 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-3 text-center">
          <p className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <span className="text-[#0ea5e9] font-semibold">Terms of Service</span>
            <span className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <span>Conditions for using Elevait</span>
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#333333] dark:text-white sm:text-5xl">
            Elevait Terms and Participant Responsibilities
          </h1>
          <p className="text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80 max-w-3xl mx-auto">
            These terms govern your access to Elevait&apos;s coaching, onboarding, and booking tools. By creating an account or scheduling a session, you agree to the obligations below.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Accounts and Eligibility</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <ul className="list-disc pl-6 space-y-2">
              <li>You must provide accurate information during sign-up and onboarding, including your email address and role preferences.</li>
              <li>You are responsible for maintaining the confidentiality of your Supabase-backed credentials and for all activity on your account.</li>
              <li>Account access may be suspended or terminated if information is false, incomplete, or if the platform is misused.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Onboarding Obligations</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Students:</strong> Provide truthful details about your interests, school affiliations, track, focus areas, and pricing expectations so mentors can tailor guidance.
              </li>
              <li>
                <strong>Mentors:</strong> Share accurate professional background, experience level, focus areas, availability, and pricing so learners can make informed booking decisions.
              </li>
              <li>Optional profile images you upload must be owned by you and appropriate for a professional setting.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Bookings, Availability, and Cancellations</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <ul className="list-disc pl-6 space-y-2">
              <li>Session requests must fit within a mentor&apos;s published availability windows; overlapping or invalid requests will be rejected.</li>
              <li>Bookings record time ranges, time zones, and contact details so both parties can coordinate. Keep this information current.</li>
              <li>Mentors may approve or decline requests. If a session is cancelled, related availability may reopen for others.</li>
              <li>Payment status tracking is supported, but actual payment processing may be handled outside the platform unless otherwise specified.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Coaching Results Disclaimer</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <p>
              <strong>Elevait is not responsible for any results, outcomes, or consequences that arise from coaching sessions.</strong> While our mentors provide guidance and advice based on their experience, we make no guarantees regarding:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Job offers, interview success, or career advancement outcomes</li>
              <li>The accuracy, completeness, or applicability of advice provided by mentors</li>
              <li>Any decisions you make based on coaching sessions</li>
              <li>The quality or effectiveness of individual coaching sessions</li>
            </ul>
            <p>
              You acknowledge that coaching is advisory in nature and that all career decisions and their consequences remain your sole responsibility. Mentors are independent professionals sharing their perspectives, not employees or agents of Elevait.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Use of the Platform</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <ul className="list-disc pl-6 space-y-2">
              <li>Use Elevait solely for professional coaching, mentorship, and related job preparation activities.</li>
              <li>Do not attempt to bypass scheduling safeguards, share malicious content, or misuse session notes and contact details.</li>
              <li>Respect the privacy of other users—information shared within a booking is only for coordinating and conducting that session.</li>
              <li>We may update features (such as onboarding flows, availability tools, or booking validations) to improve reliability and user experience.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Data Practices</h2>
          <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
            Account data, onboarding details, availability, bookings, and uploaded avatars are stored in Supabase. By using Elevait you consent to this storage and to our processing of the information you provide to operate the service. For details on collection, use, and retention, review our <Link className="text-[#0ea5e9] font-semibold" href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Termination</h2>
          <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
            We may suspend or terminate accounts that violate these terms, misuse booking tools, or compromise platform integrity. You may request account deletion at any time, understanding this may limit access to past bookings or stored information.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Contact</h2>
          <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
            For questions about these terms, please reach out through the support options available in your Elevait account.
          </p>
          <div className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">
            <p>Last updated: {new Date().getFullYear()}</p>
          </div>
        </section>
      </div>
      </div>
      <Footer />
    </div>
  );
}
