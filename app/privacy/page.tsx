import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy explaining how YourThumb processes information.",
};

const sections = [
  {
    title: "1. Who This Policy Covers",
    body: [
      "This Privacy Policy explains how YourThumb, an independently operated team product based in India, processes information when you use the YourThumb website, account, generation workflows, payments, integrations, and related services (collectively, the “Service”).",
      "YourThumb is designed for users worldwide. Privacy and data-protection rights can differ by country, and mandatory rights that apply to you are not removed by this Policy.",
    ],
  },
  {
    title: "2. Information We Receive",
    body: [
      "Account and authentication information can include the email address associated with your account and, where made available by the authentication provider, your name or other basic profile information needed to maintain your account.",
      "User-provided creative information can include videos or video-derived frames, images, reference thumbnails, assets, titles, prompts, scripts or supporting video-context information, creative directions, selected concepts, thumbnail text, background instructions, and other material you submit while using a workflow.",
      "Service records can include generation identifiers, generation workflow and status, selected titles or concepts, generated-output references, retry or processing information, and other records needed to operate and troubleshoot the Service.",
      "Payment and commercial records can include payment provider identifiers, order identifiers, payment status, currency, amount, plan or tier information, credit or generation quantities, refund identifiers, timestamps, referral attribution, and related reconciliation data. YourThumb does not intentionally store your full payment-card credentials.",
      "Referral-program information can include an affiliate code, referring-user relationship, unpaid commission balance, and a payout address if you participate in the program.",
      "If you connect Canva, we receive and store the OAuth credentials and integration information needed to maintain the authorized Canva connection, together with records of Canva export jobs and related design or asset identifiers.",
    ],
  },
  {
    title: "3. How We Use Information",
    body: [
      "We use information to create and maintain accounts, authenticate users, receive uploads, operate the thumbnail workflow, perform ideation and generation, save and retrieve project state, render outputs, provide optional Canva handoff, process and reconcile payments, manage credits and referrals, provide support, prevent abuse and fraud, secure the Service, troubleshoot failures, and comply with legal obligations.",
      "We may also use operational records to understand failures, improve reliability, and protect the integrity of the Service. We do not describe this as permission to use your underlying creative material for unrelated advertising purposes.",
    ],
  },
  {
    title: "4. Google Sign-In",
    body: [
      "If you choose to sign in with Google, YourThumb uses Google authentication through Supabase. The authentication flow provides the information needed to authenticate and create or maintain your YourThumb account, which can include your email address and basic profile information made available by Google.",
      "YourThumb does not request access to unrelated Google services such as your Gmail messages, contacts, or Google Drive files through the sign-in flow described in this application.",
      "Google processes information under Google's own privacy policy and terms. Your use of Google authentication is also subject to Google's policies.",
    ],
  },
  {
    title: "5. AI Processing and OpenAI",
    body: [
      "YourThumb uses third-party AI services, including OpenAI, to provide parts of the ideation and image-generation workflow. Depending on the workflow you select, the information sent for processing can include textual creative inputs, titles, concepts, prompts, and images or other content needed to create or transform a requested thumbnail.",
      "The information sent to an AI provider is used to perform the requested Service operation and can also be subject to that provider's own security, abuse-prevention, retention, and privacy practices. YourThumb does not promise that a third-party provider will follow a data-retention policy that is more restrictive than the provider's current contractual or technical terms.",
      "You should avoid submitting highly sensitive or confidential information unless you have decided that doing so is appropriate for the workflow you are requesting.",
    ],
  },
  {
    title: "6. Supabase, Hosting, and Infrastructure",
    body: [
      "YourThumb uses Supabase for authentication, database services, and object storage. User records, generation records, storage objects, and integration information can therefore be processed through Supabase infrastructure.",
      "The Service is hosted and deployed using Vercel, and uses GitHub-hosted workflow processing for certain rendering or background jobs. Information necessary to host the application, deploy code, execute a requested generation or render job, monitor reliability, and protect the Service may be processed by these infrastructure providers. We do not intend this description to mean that every provider receives every category of your information; access depends on the function being performed.",
      "Third-party providers operate according to their own contracts, security controls, and privacy policies.",
    ],
  },
  {
    title: "7. Canva Integration",
    body: [
      "If you choose to connect Canva, YourThumb uses Canva's authorization flow and the permissions you grant to support the Canva export workflow. The application requests permissions related to reading and writing assets, reading and writing design content, reading design metadata, and reading your Canva profile display name so the dashboard can identify the connected account.",
      "YourThumb may store Canva access and refresh credentials and their expiration information so that the authorized integration can continue to operate. The connected Canva display name is retrieved from Canva for the dashboard connection status and is not persisted as a separate YourThumb profile field. YourThumb also stores export-job information such as status, asset or design identifiers, titles, and error information needed to complete or troubleshoot the handoff.",
      "Canva is an independent service and controls its own processing of information within Canva.",
    ],
  },
  {
    title: "8. Payments and Refund Processing",
    body: [
      "Razorpay processes INR payments for YourThumb, and PayPal processes USD payments when that checkout option is used. Depending on the provider and transaction, YourThumb receives payment and order identifiers, capture or refund identifiers, payment status, currency, amount, purchased tier, and related timestamps so that it can verify, fulfill, reconcile, and refund transactions. YourThumb does not intentionally store full payment-card credentials; payment methods are handled by the payment provider.",
      "A payment can be captured before the corresponding purchase is fulfilled. Where a captured payment cannot be fulfilled, the application may record the payment, mark a refund as pending, initiate a refund through the relevant provider, and later record the refund result. Payment and reconciliation records may be retained as described in this Privacy Policy and as required for legal, accounting, fraud-prevention, and dispute-resolution purposes.",
    ],
  },
  {
    title: "9. Referral and Payout Information",
    body: [
      "If you participate in the referral program, YourThumb can process your affiliate code, referring-user attribution, unpaid commission balance, and payout address. We use that information to attribute qualifying purchases, maintain commission records, investigate abuse, and manage payouts.",
    ],
  },
  {
    title: "10. Storage and Retention",
    body: [
      "YourThumb has a defined retention model for generation-related creative data. Generation sessions and their temporary frame/background/staging assets are designed around a 48-hour session window. Generated thumbnails and saved reference thumbnails are generally retained for 30–31 days before automated cleanup processes remove them. The exact cleanup time can vary with the scheduled cleanup cycle.",
      "Account, authentication, payment, referral, security, fraud-prevention, and legal records can be retained for longer where needed to operate the Service, resolve disputes, comply with financial or legal requirements, preserve auditability, or protect the Service.",
      "Retention can also be affected by operational backups, provider systems, pending disputes, or legal requirements. The exact deletion time for an individual record can therefore differ from the normal product retention window.",
    ],
  },
  {
    title: "11. Account Deletion and Data Requests",
    body: [
      "YourThumb does not currently provide a complete self-service account-deletion control in the product. You may request account deletion, access, correction, or other privacy assistance by emailing yourthumbtech@gmail.com.",
      "When a deletion request is received, we may need to verify the request and may retain information that we are legally required or reasonably permitted to keep for payment reconciliation, fraud prevention, security, dispute resolution, tax or accounting purposes, or other lawful reasons.",
      "Deletion of an account does not necessarily mean immediate deletion from third-party systems that independently control their own records.",
    ],
  },
  {
    title: "12. Automatic Showcase of Generated Thumbnails",
    body: [
      "YourThumb automatically reserves the right to publicly display generated thumbnails created through the Service for the limited purpose of demonstrating, showcasing, or promoting the YourThumb service. This is described in the Terms of Service.",
      "This automatic showcase permission applies to the generated thumbnail itself. It does not by itself grant YourThumb permission to use your underlying uploaded video, source frame, reference image, personal information, or other unrelated User Content for promotional purposes.",
    ],
  },
  {
    title: "13. International Processing",
    body: [
      "Because YourThumb is offered worldwide and uses third-party infrastructure and service providers, information may be processed or stored in countries other than the country where you live. The relevant service providers may have operations or infrastructure in multiple jurisdictions.",
      "Where applicable law provides specific requirements for international transfers or cross-border processing, we will apply the safeguards required for those circumstances to the extent they apply to YourThumb.",
    ],
  },
  {
    title: "14. Security",
    body: [
      "We use technical and organizational measures designed to protect information against unauthorized access, loss, misuse, or alteration. However, no internet-based system or third-party service can be guaranteed to be completely secure.",
      "You are responsible for keeping control of your account access and for choosing what content you submit to an internet-based AI service.",
    ],
  },
  {
    title: "15. Children and Minors",
    body: [
      "YourThumb does not impose a general 18+ restriction. However, children and minors remain subject to any age, parental-consent, data-protection, or other requirements that apply under the laws of their country or region.",
      "If applicable law requires a parent, guardian, or other authorization for the processing of a minor's personal data, the required authorization must be obtained before using the Service in a manner covered by that requirement.",
    ],
  },
  {
    title: "16. Your Privacy Rights",
    body: [
      "Depending on where you live and which laws apply, you may have rights such as access, correction, deletion, restriction, objection, portability, withdrawal of consent where consent is the basis of processing, and the right to complain to a regulator or supervisory authority.",
      "To ask about or exercise privacy rights, contact yourthumbtech@gmail.com. We may need to verify your identity and account ownership before completing a request.",
    ],
  },
  {
    title: "17. Legal Bases and Applicable Law",
    body: [
      "The legal basis for processing personal data can differ by jurisdiction and by processing activity. Depending on the circumstance, processing may be necessary to provide a requested service, perform or administer a contract, process a payment, protect the Service, comply with law, respond to a request, or rely on another lawful basis recognized in the applicable jurisdiction.",
    ],
  },
  {
    title: "18. Changes to This Policy",
    body: [
      "We may update this Privacy Policy when the Service, third-party providers, data practices, or legal requirements change. The current version will be posted on this page with a revised effective date.",
    ],
  },
  {
    title: "19. Privacy Questions and Complaints",
    body: [
      "For privacy questions, data requests, complaints, or concerns about personal-data processing, contact: yourthumbtech@gmail.com.",
      "For account, payment, or general Service support, you can use the Support page or email yourthumbtech@gmail.com." ,
    ],
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#f4f4f2] text-[#101010] dark:bg-zinc-950 dark:text-white">
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/" aria-label="YourThumb home">
            <BrandMark size={32} />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-black/50 transition hover:text-black dark:text-white/45 dark:hover:text-white">
            <ArrowLeft className="size-4" /> Back home
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">LEGAL / PRIVACY</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl">Privacy Policy.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-black/55 dark:text-white/50">
            Effective date: September 9, 2026. This Privacy Policy explains how YourThumb processes information in connection with the Service.
          </p>
        </div>

        <div className="mt-14 border-t border-black/10 dark:border-white/10">
          {sections.map((section) => (
            <section key={section.title} className="grid gap-5 border-b border-black/10 py-9 dark:border-white/10 sm:grid-cols-[290px_1fr] sm:gap-8">
              <h2 className="text-lg font-black tracking-[-0.025em]">{section.title}</h2>
              <div className="max-w-3xl space-y-4 text-sm leading-7 text-black/62 dark:text-white/55">
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-black/55 dark:text-white/50">
          <Link href="/terms" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Terms of Service <ArrowUpRight className="size-4" /></Link>
          <Link href="/" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">YourThumb <ArrowUpRight className="size-4" /></Link>
          <Link href="/support" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Support <ArrowUpRight className="size-4" /></Link>
          <a href="mailto:yourthumbtech@gmail.com" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Contact <ArrowUpRight className="size-4" /></a>
        </div>
      </section>
    </main>
  );
}
