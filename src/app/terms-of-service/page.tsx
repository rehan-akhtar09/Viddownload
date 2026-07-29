import { Scale } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Scale className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Terms of Service</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Last updated: July 2026</p>
          </div>
        </div>

        <section className="space-y-6 text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            By accessing or using VeloDown (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">1. Service Description</h2>
            <p>
              VeloDown provides a video downloading tool that allows users to download videos from publicly accessible URLs for personal use. The Service is provided &quot;as is&quot; without any warranties.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">2. User Responsibilities</h2>
            <p>You agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Use the Service only for lawful purposes and in accordance with applicable laws</li>
              <li>Not use the Service to download copyrighted content without authorization</li>
              <li>Not interfere with or disrupt the Service or servers</li>
              <li>Not attempt to gain unauthorized access to any part of the Service</li>
              <li>Not use the Service for commercial purposes without prior written consent</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">3. Intellectual Property</h2>
            <p>
              The VeloDown name, logo, and website design are our intellectual property. You may not reproduce, distribute, or create derivative works without our permission. Content downloaded through the Service remains the intellectual property of its respective owners.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">4. Limitation of Liability</h2>
            <p>
              VeloDown shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. The Service is provided for personal use only.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">5. Termination</h2>
            <p>
              We reserve the right to terminate or suspend access to the Service at any time, without prior notice, for any reason, including violation of these Terms.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">6. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">7. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">8. Contact</h2>
            <p>
              For questions about these Terms, contact us at{' '}
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
