import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service governing the use of YourThumb.",
};

const terms = [
  {
    title: "1. About YourThumb",
    body: [
      "YourThumb is an independently operated team product based in India that provides a workflow for developing and producing YouTube thumbnail concepts and images. The product is designed around practical thumbnail-production experience, including work with YouTube channels reaching nearly 7.5M collective subscribers. In these Terms, “YourThumb”, “we”, “us”, and “our” refer to the YourThumb service and its operator.",
      "YourThumb is offered internationally. These Terms are intended to apply globally, but mandatory consumer, privacy, data-protection, and other rights in your country may apply to you regardless of anything in these Terms.",
    ],
  },
  {
    title: "2. Acceptance of These Terms",
    body: [
      "By accessing or using YourThumb, creating an account, or purchasing or using any paid feature, you agree to these Terms and any policies specifically incorporated into them. If you do not agree, do not use the Service.",
      "When you continue with Google during account sign-in, the sign-in flow also presents the Terms of Service and Privacy Policy for your review.",
    ],
  },
  {
    title: "3. Eligibility and Age",
    body: [
      "YourThumb does not impose a general 18+ restriction. However, you may use the Service only if you are legally permitted to do so under the laws applicable to you. Where local law requires parental, guardian, or other authorization for a minor to use an online service or for personal data to be processed, that requirement applies.",
      "You are responsible for ensuring that your use of YourThumb complies with the laws that apply to you.",
    ],
  },
  {
    title: "4. Accounts and Authentication",
    body: [
      "You may access YourThumb through Google authentication. The account information made available through that authentication flow is used to create and maintain your YourThumb account.",
      "You are responsible for activity occurring through your account and for maintaining access to the account you use to sign in. Do not attempt to access another person's account or provide false information to obtain access.",
    ],
  },
  {
    title: "5. The Service and Creative Workflow",
    body: [
      "YourThumb provides a thumbnail workflow that can include video or frame context, ideation, creative direction, a review or checkpoint stage, rendering, refinement, and optional Canva handoff. The available workflows, models, integrations, limits, pricing, and technical implementation may change over time.",
      "YourThumb is a creative-assistance service. It does not guarantee that any generated thumbnail will perform well on YouTube or any other platform, or that a particular thumbnail will increase clicks, views, subscribers, watch time, revenue, or other business results.",
    ],
  },
  {
    title: "6. User Content and Your Rights",
    body: [
      "You may provide videos, frames, images, reference thumbnails, text, titles, prompts, assets, and other material (“User Content”). You retain the rights you already have in your User Content.",
      "You grant YourThumb a limited, non-exclusive, worldwide, royalty-free license to host, store, reproduce, transmit, transform, analyze, and otherwise process User Content only as reasonably necessary to operate the Service, provide the requested workflows, maintain security, troubleshoot and improve the reliability of the Service, comply with law, and use the third-party services described in the Privacy Policy.",
      "You represent that you have the rights, permissions, or other lawful basis needed to submit the User Content to YourThumb for these purposes. In particular, you must not upload material that you are not permitted to process or use.",
    ],
  },
  {
    title: "7. Generated Outputs",
    body: [
      "YourThumb may use automated systems and third-party AI services to create, edit, or transform outputs. AI-generated results can be inaccurate, unexpected, similar to results generated for other users, or unsuitable for a particular use.",
      "Subject to applicable law and any rights of third parties, YourThumb does not claim ownership of a generated thumbnail solely because it was generated through the Service. You are responsible for reviewing the output and for determining whether and how you may publish, license, sell, or otherwise use it.",
      "The fact that YourThumb does not claim ownership of a generated output does not mean that the output is automatically free of third-party intellectual-property, privacy, publicity, trademark, or other restrictions, or that every jurisdiction will recognize copyright in AI-generated material.",
    ],
  },
  {
    title: "8. Automatic Showcase of Generated Thumbnails",
    body: [
      "By using YourThumb to generate a thumbnail, you grant YourThumb a limited, non-exclusive, worldwide, royalty-free right to publicly display the generated thumbnail solely to demonstrate, showcase, or promote the YourThumb service and the type of work it can produce.",
      "This permission applies automatically to generated thumbnails. It does not, by itself, grant YourThumb a right to use your underlying uploaded videos, source frames, reference images, personal information, or other User Content for unrelated promotional purposes.",
      "You should not submit confidential material if you do not want the resulting generated thumbnail to be eligible for public showcase under this section.",
    ],
  },
  {
    title: "9. Acceptable Use",
    body: [
      "You must use YourThumb lawfully and responsibly. You may not use the Service to infringe intellectual-property, privacy, publicity, or other rights; impersonate or deceptively represent another person or organization; facilitate fraud or abuse; submit malicious code; interfere with the Service; bypass usage or security controls; or otherwise use the Service in a way that violates applicable law.",
      "You are responsible for checking that your proposed thumbnail, source material, reference material, and final use are lawful and appropriate for publication.",
    ],
  },
  {
    title: "10. Paid Plans, Credits, Pricing, and Expiration",
    body: [
      "YourThumb offers generation credits through the plans presented in the Service. The current catalog includes a Trial Pack, Starter, Creator, Growth, Pro, and a 5-generation add-on. The exact price displayed at purchase controls the purchase transaction.",
      "The current published credit periods are: Trial Pack — 1 generation with a 7-day validity period; Starter — 5 generations with a 30-day validity period; Creator — 10 generations with a 30-day validity period; Growth — 20 generations with a 30-day validity period; Pro — 30 generations with a 30-day validity period. The 5-generation add-on is available only in eligible active-pack situations and is designed to use the current pack expiry rather than create a new expiry period.",
      "Unused generation credits may expire when the applicable pack period ends. Unless required otherwise by applicable law or expressly stated at purchase, expired credits have no cash value and are not automatically converted into a refund.",
      "We may change pricing or plan structure prospectively. The price presented and accepted for a particular purchase governs that purchase, subject to payment-provider processing and any applicable correction or refund rights.",
    ],
  },
  {
    title: "11. Payments, Failed Fulfillment, and Refunds",
    body: [
      "INR payments are processed through Razorpay, and USD payments are processed through PayPal when that checkout option is offered. YourThumb does not intentionally store your full payment-card credentials; we receive payment and transaction information needed to create orders, verify payments, reconcile transactions, fulfill credits, and process refunds.",
      "A payment can be captured before YourThumb successfully fulfills the related purchase. If a captured payment cannot be fulfilled because a validation, eligibility, reconciliation, or other service condition prevents crediting the purchase, YourThumb may reject the purchase and initiate a refund through the payment provider that processed the transaction.",
      "If an automatic refund is initiated, the refund may remain pending while the payment provider processes it. You should not submit a duplicate payment merely because an earlier payment has not yet been fulfilled, unless YourThumb instructs you to do so.",
      "Refund rights that cannot legally be excluded are preserved. Where YourThumb publishes a separate refund or cancellation policy, that policy forms part of these Terms and governs to the extent it addresses the relevant transaction.",
    ],
  },
  {
    title: "12. Referral and Affiliate Program",
    body: [
      "YourThumb may offer a referral or affiliate program under which qualifying referrals can be attributed to a participant and commissions can accrue. Participation may require an affiliate code and a payout address.",
      "Referral attribution, commission eligibility, commission amounts, payout timing, fraud checks, reversals, and program rules may be applied or adjusted according to the program terms and the Service's reconciliation records. Self-referrals, fabricated transactions, abuse, or attempts to manipulate attribution may result in disqualification, reversal of commissions, suspension, or termination.",
    ],
  },
  {
    title: "13. Canva and Other Third-Party Services",
    body: [
      "YourThumb uses third-party services to operate specific parts of the product. These may include Google for sign-in; Supabase for authentication, database and storage; OpenAI for AI features; Razorpay for INR payments; PayPal for USD payments; Canva when you choose its integration; and Vercel and GitHub for hosting, deployment, and certain background workflows. Each provider receives or processes information only as needed for its role, subject to the relevant integration and configuration, and operates under its own terms and privacy policies. The providers and features used may change as the Service evolves; the Privacy Policy describes the current data-processing purposes in more detail.",
      "If you connect Canva, YourThumb may use the permissions you authorize to transfer generated artwork and create or manage the related Canva asset/design workflow. YourThumb may store the OAuth credentials needed to maintain the authorized connection. Canva remains an independent third-party service.",
      "YourThumb is not responsible for outages, policy changes, account restrictions, security incidents, or other events within a third-party service that are outside YourThumb's reasonable control.",
    ],
  },
  {
    title: "14. Intellectual Property in YourThumb",
    body: [
      "YourThumb and its software, code, branding, logos, visual identity, interface, documentation, and other service materials are owned by YourThumb or its licensors, except for User Content and other material that belongs to users or third parties.",
      "Except as expressly permitted by these Terms, you may not copy, redistribute, reverse engineer, resell, or exploit the Service or its proprietary components without permission.",
    ],
  },
  {
    title: "15. Service Availability and AI Limitations",
    body: [
      "YourThumb is provided on an “as is” and “as available” basis to the maximum extent permitted by applicable law. We do not promise uninterrupted availability, error-free operation, permanent availability of any feature, or that every request will produce a usable output.",
      "AI-generated content can contain factual mistakes, visual errors, unwanted artifacts, biased or unexpected elements, or material that resembles existing content. You must review outputs before publishing or relying on them.",
    ],
  },
  {
    title: "16. Disclaimers and Limitation of Liability",
    body: [
      "To the maximum extent permitted by applicable law, YourThumb disclaims warranties that cannot lawfully be implied, including warranties relating to fitness for a particular purpose, merchantability, non-infringement, uninterrupted availability, or particular performance results.",
      "To the maximum extent permitted by applicable law, YourThumb will not be liable for indirect, incidental, special, consequential, exemplary, or loss-of-profit damages arising from or related to the Service. Nothing in these Terms limits liability that cannot lawfully be limited or excluded.",
      "Nothing in these Terms is intended to make the Service legally consequence-free merely because it is independently developed. The applicable law of the relevant jurisdiction controls the extent to which any disclaimer or limitation is enforceable.",
    ],
  },
  {
    title: "17. Suspension and Termination",
    body: [
      "We may suspend, restrict, or terminate access where reasonably necessary to protect the Service, prevent abuse or fraud, enforce these Terms, respond to security risks, comply with law, or manage operational risk.",
      "You may stop using YourThumb at any time. Termination does not automatically erase transaction, security, or other records that we are permitted or required to retain, and it does not remove obligations that by their nature should survive termination.",
    ],
  },
  {
    title: "18. Account Deletion Requests",
    body: [
      "YourThumb does not currently provide a complete self-service account-deletion control in the product. You may request deletion of your account and associated personal data by contacting us at yourthumbtech@gmail.com.",
      "Some records may need to be retained for legal, accounting, fraud-prevention, security, dispute-resolution, or payment-reconciliation purposes, subject to applicable law.",
    ],
  },
  {
    title: "19. Governing Law and Mandatory Rights",
    body: [
      "Subject to mandatory protections and rights that apply to you under the laws of your country or region, these Terms are intended to be governed by the laws of India. Any exclusive jurisdiction or dispute-resolution arrangement should be understood subject to applicable mandatory consumer and other statutory rights.",
    ],
  },
  {
    title: "20. Changes to These Terms",
    body: [
      "We may update these Terms when the Service, payment structure, integrations, data practices, or legal requirements change. We will post the revised version on this page and update the effective date. Your continued use of the Service after an update may constitute acceptance to the extent permitted by applicable law.",
    ],
  },
  {
    title: "21. Contact, Questions, and Complaints",
    body: [
      "For questions, complaints, legal notices, account-deletion requests, payment issues, or other support matters relating to YourThumb, contact: yourthumbtech@gmail.com.",
      "When sending a complaint or legal request, include enough information for us to identify the relevant account, transaction, generation, or issue without sending sensitive information that we do not need.",
    ],
  },
] as const;

export default function TermsPage() {
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
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#d92727]">LEGAL / TERMS</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-6xl">Terms of Service.</h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-black/55 dark:text-white/50">
            Effective date: September 9, 2026. These Terms govern your use of the YourThumb Service.
          </p>
        </div>

        <div className="mt-14 border-t border-black/10 dark:border-white/10">
          {terms.map((section) => (
            <section key={section.title} className="grid gap-5 border-b border-black/10 py-9 dark:border-white/10 sm:grid-cols-[290px_1fr] sm:gap-8">
              <h2 className="text-lg font-black tracking-[-0.025em]">{section.title}</h2>
              <div className="max-w-3xl space-y-4 text-sm leading-7 text-black/62 dark:text-white/55">
                {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-black/55 dark:text-white/50">
          <Link href="/privacy" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Privacy Policy <ArrowUpRight className="size-4" /></Link>
          <Link href="/" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">YourThumb <ArrowUpRight className="size-4" /></Link>
          <Link href="/support" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Support <ArrowUpRight className="size-4" /></Link>
          <a href="mailto:yourthumbtech@gmail.com" className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white">Contact <ArrowUpRight className="size-4" /></a>
        </div>
      </section>
    </main>
  );
}
