import Link from "next/link";
import Header from "@/components/Header-simple";
import Footer from "@/components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white dark:bg-[#101c22] min-h-screen flex flex-col">
      <Header variant="landing" />
      <div className="flex-1 py-16 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="space-y-3 text-center">
          <p className="inline-flex items-center gap-x-2 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <span className="text-[#0ea5e9] font-semibold">Privacy Policy</span>
            <span className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
            <span>How Elevait handles your data</span>
          </p>
          <h1 className="text-4xl font-black tracking-tight text-[#333333] dark:text-white sm:text-5xl">
            Your Privacy, Security, and Control
          </h1>
          <p className="text-lg text-[#333333]/80 dark:text-[#F5F5F5]/80 max-w-3xl mx-auto">
            This Privacy Policy explains what information Elevait collects, how we use it to power coaching and job-matching experiences, and the choices available to you.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Information We Collect</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <p>
              We collect only the data needed to operate the platform and connect learners with mentors:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account details:</strong> When you sign up or log in through Supabase authentication, we receive your email address and handle password-based or OAuth sign-ins to verify your identity and manage sessions.
              </li>
              <li>
                <strong>Profile information:</strong> During onboarding we store the details you provide to personalize matches—students share interests, school affiliations, preferred track, focus areas, and price ranges, while mentors share role details, experience, LinkedIn URLs, focus areas, rates, and alumni schools.
              </li>
              <li>
                <strong>Booking and availability data:</strong> Scheduling data includes mentor availability ranges, booked session times, time zones, contact details (email and optional phone), and any session notes you add when requesting or documenting a session.
              </li>
              <li>
                <strong>Uploads:</strong> If you add a profile image, we store it in Supabase Storage alongside your account ID.
              </li>
              <li>
                <strong>Support and diagnostics:</strong> We log limited technical metadata (such as request status and errors) to troubleshoot issues and keep the service reliable.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">How We Use Information</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide authentication, keep you signed in, and secure your account.</li>
              <li>Match learners and mentors based on the focus areas, experience, and pricing information supplied during onboarding.</li>
              <li>Schedule, manage, and record the status of bookings, including handling approvals or declines and updating availability.</li>
              <li>Display profile and session details to the counterparties involved in a booking so they can prepare for the session.</li>
              <li>Improve reliability through logging and health checks that verify database, storage, and booking functions are operating correctly.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">How We Share Information</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <p>
              We share data only as needed to deliver the service:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>With session participants:</strong> Mentors and learners can see relevant booking details (times, time zones, contact info, and notes) for sessions they are part of.
              </li>
              <li>
                <strong>With our infrastructure provider:</strong> Authentication, database storage, and file uploads are handled by Supabase. Your account data, profile details, availability, bookings, and uploaded avatars are stored and secured there.
              </li>
              <li>
                <strong>For compliance and safety:</strong> We may access or preserve information to comply with legal obligations or investigate misuse of the platform.
              </li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Data Retention</h2>
          <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
            Profile, booking, and availability records are retained for your ongoing use of the platform and to maintain accurate session histories. You may request deletion of your account; doing so may limit or remove access to historical booking data where permitted.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Your Choices and Controls</h2>
          <div className="space-y-3 text-[#333333]/80 dark:text-[#F5F5F5]/80">
            <ul className="list-disc pl-6 space-y-2">
              <li>Update your profile details at any time through the onboarding and dashboard experiences.</li>
              <li>Modify availability or booking requests to control when sessions can be scheduled.</li>
              <li>Request account deletion to remove your profile and authentication credentials from the service.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Security</h2>
          <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
            We rely on Supabase authentication, database policies, and storage access controls to protect your account and files. We also validate booking requests to prevent overlapping sessions and maintain accurate availability, helping keep your scheduling data consistent and secure.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-[#333333] dark:text-white">Contact</h2>
          <p className="text-[#333333]/80 dark:text-[#F5F5F5]/80">
            If you have questions about this policy or how your information is handled, please reach out through the support channels provided in your Elevait account.
          </p>
          <div className="text-sm text-[#333333]/60 dark:text-[#F5F5F5]/60">
            <p>Last updated: {new Date().getFullYear()}</p>
            <p>
              Need legal terms instead? Visit our <Link className="text-[#0ea5e9] font-semibold" href="/terms">Terms of Service</Link>.
            </p>
          </div>
        </section>
      </div>
      </div>
      <Footer />
    </div>
  );
}
