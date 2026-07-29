import { Copyright } from 'lucide-react';

export default function DMCA() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20 space-y-8">
        <div className="flex items-center gap-3 pb-6 border-b border-black/10 dark:border-white/10">
          <div className="h-10 w-10 rounded-xl bg-red-600/10 flex items-center justify-center">
            <Copyright className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">DMCA Policy</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Copyright Infringement Notice</p>
          </div>
        </div>

        <section className="space-y-6 text-sm md:text-base leading-relaxed text-neutral-600 dark:text-neutral-300">
          <p>
            VeloDown respects the intellectual property rights of others and expects its users to do the same. In accordance with the Digital Millennium Copyright Act (DMCA), we will respond promptly to notices of alleged copyright infringement.
          </p>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Notice of Infringement</h2>
            <p>
              If you believe that your copyrighted work has been used in a way that constitutes copyright infringement, please provide our designated copyright agent with the following information:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Your physical or electronic signature</li>
              <li>Identification of the copyrighted work claimed to be infringed</li>
              <li>Identification of the material that is claimed to be infringing and information reasonably sufficient to locate it</li>
              <li>Your contact information, including address, telephone number, and email</li>
              <li>A statement that you have a good faith belief that the use is not authorized by the copyright owner</li>
              <li>A statement, under penalty of perjury, that the information in the notice is accurate</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Designated Copyright Agent</h2>
            <p>
              Please send DMCA notices to:
            </p>
            <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-black/10 dark:border-white/10">
              <p className="font-medium text-neutral-900 dark:text-white">VeloDown Copyright Agent</p>
              <a href="mailto:rehan.ibex04@gmail.com" className="text-red-600 dark:text-red-400 hover:underline">
                rehan.ibex04@gmail.com
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Counter-Notice</h2>
            <p>
              If you believe that material you posted was removed by mistake, you may submit a counter-notice containing your physical or electronic signature, identification of the removed material, a statement under penalty of perjury that you have a good faith belief the material was removed by mistake, and your contact information.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Repeat Infringers</h2>
            <p>
              VeloDown reserves the right to terminate the accounts of users who are repeat infringers of intellectual property rights.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Disclaimer</h2>
            <p>
              VeloDown is a video downloading tool that processes publicly accessible URLs. We do not host, store, or distribute copyrighted content. Users are responsible for ensuring they have the right to download any content and must comply with applicable copyright laws.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
