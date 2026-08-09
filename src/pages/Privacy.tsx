import LegalPageLayout, { LegalSection } from "@/components/legal/LegalPageLayout";
import {
  Shield,
  Database,
  Target,
  Share2,
  Lock,
  Clock,
  UserCheck,
  Baby,
  Cookie,
  RefreshCw,
} from "lucide-react";

const sections: LegalSection[] = [
  {
    icon: Shield,
    title: "Overview",
    description: "Who we are and what this notice covers",
    body: (
      <p>
        World Changers Association ("WCA", "we", "us") operates this website and the member, regional
        and administrative portals available on it. This notice explains what personal information we
        collect through these services, why we collect it, and the choices you have. It applies to
        visitors, members, event attendees and donors who use our online services.
      </p>
    ),
  },
  {
    icon: Database,
    title: "Information we collect",
    description: "Data you give us and data created as you use the site",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><strong>Identity and contact details</strong> — name, email address, phone number, gender, date of birth, city and region, submitted during registration or profile updates.</li>
        <li><strong>Membership information</strong> — fellowship or group, discipleship progress, attendance records and related records you or an administrator enter.</li>
        <li><strong>Event information</strong> — pre-registration details, lodging and travel preferences, meal preferences, allergies and health challenges you choose to share, and family or relationship links used for accommodation planning.</li>
        <li><strong>Giving information</strong> — pledges and donation records, amounts and currency. Where a payment provider is used, card and banking details are handled by that provider, not stored by us.</li>
        <li><strong>Feedback and testimonials</strong> — responses submitted through our event feedback forms, which may be submitted anonymously.</li>
        <li><strong>Account and technical data</strong> — login credentials managed by our authentication provider, and standard technical information such as browser type and language preference.</li>
      </ul>
    ),
  },
  {
    icon: Target,
    title: "How we use your information",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li>To register and manage members, visitors and event attendees.</li>
        <li>To plan and run events, including lodging, catering and children's programmes.</li>
        <li>To record attendance, issue certificates and badges, and track discipleship progress.</li>
        <li>To administer pledges, donations and fundraising campaigns.</li>
        <li>To communicate with you about events, activities and requests you submit.</li>
        <li>To improve our programmes using aggregated feedback and reports.</li>
        <li>To secure our services and prevent misuse.</li>
      </ul>
    ),
  },
  {
    icon: Share2,
    title: "Sharing your information",
    body: (
      <>
        <p>
          We do not sell your personal information. Access is limited to authorised leaders and
          administrators of your region or group, on a need-to-know basis for the purposes described
          above.
        </p>
        <p>
          We use service providers to operate the platform, including hosting, database and
          authentication services, email delivery, and — where applicable — payment processing. These
          providers process data on our instructions. We may also disclose information where required
          by law.
        </p>
      </>
    ),
  },
  {
    icon: Lock,
    title: "Security",
    body: (
      <p>
        We apply access controls so that users only reach the records their role permits, and
        administrative areas require authentication. No online service can be guaranteed to be
        completely secure, so please use a strong password and let us know immediately if you believe
        your account has been compromised.
      </p>
    ),
  },
  {
    icon: Clock,
    title: "How long we keep information",
    body: (
      <p>
        Membership, attendance, certificate and giving records are kept for as long as you remain part
        of the association and afterwards where we need them for legitimate administrative, historical
        or legal reasons. Feedback submitted anonymously cannot be traced back to you and is retained
        in aggregate form.
      </p>
    ),
  },
  {
    icon: UserCheck,
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You may request access to the personal information we hold about you, ask us to correct
          inaccurate details, or request deletion of your personal data. Members can also update many
          details themselves through the profile update page.
        </p>
        <p>
          To make a request, email <a href="mailto:info@wcaglobal.org">info@wcaglobal.org</a>. We may
          need to verify your identity before acting on a request.
        </p>
      </>
    ),
  },
  {
    icon: Baby,
    title: "Children",
    body: (
      <p>
        Information about children is submitted by a parent, guardian or authorised leader, and is used
        only for programme participation, care and safety — for example children's class attendance,
        meals and allergy awareness. Parents may ask us to review or delete their child's information at
        any time.
      </p>
    ),
  },
  {
    icon: Cookie,
    title: "Cookies and local storage",
    body: (
      <p>
        We use cookies and browser storage that are necessary for the site to function, such as keeping
        you signed in and remembering your language preference. We do not use them to build advertising
        profiles.
      </p>
    ),
  },
  {
    icon: RefreshCw,
    title: "Changes and contact",
    body: (
      <p>
        We may update this notice as our services evolve; the "last updated" date above will change when
        we do. Questions about this notice can be sent to{" "}
        <a href="mailto:info@wcaglobal.org">info@wcaglobal.org</a>.
      </p>
    ),
  },
];

const Privacy = () => (
  <LegalPageLayout
    badge="Legal"
    title="Privacy Policy"
    subtitle="How World Changers Association collects, uses and protects the information you share with us."
    lastUpdated="9 August 2026"
    sections={sections}
  />
);

export default Privacy;
