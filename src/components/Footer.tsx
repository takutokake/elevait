import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-[#101c22] border-t border-gray-200 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#333333] dark:text-white">Elevait</h3>
            <p className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80">
              Unlock your product management potential with personalized coaching and exclusive opportunities.
            </p>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#333333] dark:text-white">Platform</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/coaches" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Find Coaches
                </Link>
              </li>
              <li>
                <Link href="/jobs" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#333333] dark:text-white">Support</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mentor/apply" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Become a Coach
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#333333] dark:text-white">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy-policy" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-[#333333]/80 dark:text-[#F5F5F5]/80 hover:text-[#0ea5e9] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-gray-200 dark:border-gray-800 pt-8">
          <p className="text-xs text-center text-[#333333]/60 dark:text-[#F5F5F5]/60">
            © {new Date().getFullYear()} Elevait. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
