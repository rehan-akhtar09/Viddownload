import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Privacy Policy</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Last updated: July 2026</p>
          </div>
        </div>

        <section className="space-y-6 text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            VeloDown (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website and services.
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">1. Information We Collect</h2>
            <p>
              <strong>Personal Information:</strong> We may collect personal information such as your name and email address when you voluntarily submit it through our contact form.
            </p>
            <p>
              <strong>Usage Data:</strong> We automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring URLs, and pages visited.
            </p>
            <p>
              <strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your experience, analyze trends, and administer the website.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">2. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">3. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, conducting our business, or servicing you, provided they agree to keep your information confidential.
            </p>
            <p>
              We may disclose your information if required by law or in response to valid legal requests by public authorities.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">5. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">6. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under 13. We do not knowingly collect personal information from children. If we become aware of such collection, we will delete it promptly.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">7. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of changes by updating the &quot;Last updated&quot; date at the top of this page.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:rehan.ibex04@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
                rehan.ibex04@gmail.com
              </a>.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
