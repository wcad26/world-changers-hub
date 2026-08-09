import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";
import {
  FileText,
  UserCheck,
  ShieldCheck,
  HeartHandshake,
  MessageSquareQuote,
  Ban,
  Copyright,
  AlertTriangle,
  Scale,
  RefreshCw,
} from "lucide-react";

const sections: LegalSection[] = [
  {
    icon: FileText,
    title: "Acceptance of these terms",
    description: "The agreement between you and World Changers Association",
    body: (
      <p>
        These terms govern your use of the World Changers Association ("WCA") website and the member,
        regional, group and administrative portals available on it. By accessing or using the services,
        you agree to these terms. If you do not agree, please do not use the services.
      </p>
    ),
  },
  {
    icon: UserCheck,
    title: "Accounts and eligibility",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>You must provide accurate, current information when registering as a member, visitor or event attendee.</li>
        <li>You are responsible for keeping your login credentials confidential and for activity carried out under your account.</li>
        <li>Accounts for children are created and managed by a parent, guardian or authorised leader.</li>
        <li>We may suspend or close an account that is inactive, duplicated, or used in breach of these terms.</li>
      </ul>
    ),
  },
  {
    icon: ShieldCheck,
    title: "Roles and access",
    body: (
      <p>
        Some areas of the platform are restricted to leaders and administrators. Access is granted by
        role and, for regional roles, may require approval by a super administrator. You agree to use
        any elevated access only for legitimate association purposes, and to treat member records you
        can see as confidential.
      </p>
    ),
  },
  {
    icon: HeartHandshake,
    title: "Events, pledges and giving",
    body: (
      <>
        <p>
          Event registrations, pledges and donations recorded through the platform reflect the details
          you submit. Event schedules, venues and pricing may change, and registration may be limited by
          capacity.
        </p>
        <p>
          Pledges are a statement of intent to give and are recorded for planning purposes. Gifts are
          generally non-refundable; if you believe a gift was recorded in error, contact us and we will
          review it in good faith.
        </p>
      </>
    ),
  },
  {
    icon: MessageSquareQuote,
    title: "Feedback, testimonials and other content",
    body: (
      <p>
        When you submit feedback, a testimony or other content, you confirm it is your own and you grant
        WCA permission to store it and, where you have shared a testimony, to publish it — with or
        without attribution as indicated in the form. Testimonials are reviewed before appearing
        publicly, and we may edit for length and clarity or decline to publish.
      </p>
    ),
  },
  {
    icon: Ban,
    title: "Acceptable use",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Do not submit false, misleading, abusive, hateful, obscene or unlawful content.</li>
        <li>Do not impersonate another person or register on someone's behalf without their consent.</li>
        <li>Do not attempt to access accounts, records or areas you are not authorised to use.</li>
        <li>Do not disrupt, scrape, overload or reverse engineer the services.</li>
        <li>Do not use contact details obtained through the platform for unrelated marketing.</li>
      </ul>
    ),
  },
  {
    icon: Copyright,
    title: "Intellectual property",
    body: (
      <p>
        The site, its design, text, logos, teaching materials, certificates and media are owned by WCA or
        its licensors. You may view and share material for personal, non-commercial ministry use with
        attribution. Any other reproduction or commercial use requires our written permission.
      </p>
    ),
  },
  {
    icon: AlertTriangle,
    title: "Availability and disclaimers",
    body: (
      <p>
        The services are provided on an "as is" and "as available" basis. We work to keep the platform
        running reliably, but we do not guarantee uninterrupted access or that every record is free of
        error. Counselling, teaching and other content offered through the platform is pastoral in
        nature and is not a substitute for professional medical, legal or financial advice.
      </p>
    ),
  },
  {
    icon: Scale,
    title: "Liability",
    body: (
      <p>
        To the maximum extent permitted by applicable law, WCA and its leaders, volunteers and staff are
        not liable for indirect or consequential loss arising from your use of the services. Nothing in
        these terms limits liability that cannot be limited by law.
      </p>
    ),
  },
  {
    icon: RefreshCw,
    title: "Changes and contact",
    body: (
      <p>
        We may update these terms as our services develop; the "last updated" date above will change when
        we do, and continued use means you accept the revised terms. Questions can be sent to{" "}
        <a href="mailto:info@wcaglobal.org">info@wcaglobal.org</a>.
      </p>
    ),
  },
];

const Terms = () => (
  <LegalPageLayout
    badge="Legal"
    title="Terms of Service"
    subtitle="The rules that apply when you use the World Changers Association website and portals."
    lastUpdated="9 August 2026"
    sections={sections}
  />
);

export default Terms;
