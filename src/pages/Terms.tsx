import { Link } from "react-router-dom";

const Terms = () => {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <article className="space-y-10">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            Terms and Conditions
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
        </header>

        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            These Terms and Conditions govern the use of Motion, a cloud-based software platform available at{" "}
            <a
              href="https://www.motionapp.xyz"
              className="underline text-foreground hover:text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://www.motionapp.xyz
            </a>
            .
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion provides digital tools that help sports professionals manage clients, training programs, and scheduling in one place.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            By accessing or using the platform, you agree to be bound by these Terms.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            If you do not agree with these Terms, you should not use Motion.
          </p>
        </section>

        {/* 2. Description of the Service */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Description of the Service</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion is a Software-as-a-Service (SaaS) platform designed for sports professionals.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            The platform allows professionals to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Manage client profiles</li>
            <li>Schedule and manage appointments</li>
            <li>Create and assign training programs</li>
            <li>Track training sessions and progress</li>
            <li>Store training media (videos, documents, images)</li>
            <li>Track payments and lesson packages</li>
            <li>Allow clients to book sessions</li>
            <li>Provide feedback to clients</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion may also provide a client interface that allows athletes to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Book training sessions</li>
            <li>Record training activities</li>
            <li>Share training results with their coach</li>
            <li>Track personal progress and goals</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion only provides the software infrastructure and does not provide coaching or sports services.
          </p>
        </section>

        {/* 3. Eligibility */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. Eligibility</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            The platform is intended for use by sports professionals and their clients.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professionals may create client profiles and accounts on behalf of their clients.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users are responsible for ensuring that the information they provide is accurate and lawful.
          </p>
        </section>

        {/* 4. Professional Responsibility */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Professional Responsibility</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Sports professionals using Motion act as independent service providers.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion does not supervise, manage, or control the services provided by professionals to their clients.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professionals are solely responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>The services they provide</li>
            <li>The training programs they assign</li>
            <li>The safety and wellbeing of their clients</li>
            <li>Compliance with applicable laws and professional obligations</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion does not provide medical, health, or coaching advice.
          </p>
        </section>

        {/* 5. User Accounts */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. User Accounts</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professional accounts are currently created by invitation.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users must keep their login credentials secure and confidential.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users are responsible for all activity occurring under their account.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion may suspend or terminate accounts that misuse the platform or violate these Terms.
          </p>
        </section>

        {/* 6. Client Data */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Client Data</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professionals may upload and manage information related to their clients, including personal data and training information.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professionals are responsible for ensuring that they have the appropriate rights and permissions to upload and manage this information.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion processes this information only to provide the platform functionality.
          </p>
        </section>

        {/* 7. Payments */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">7. Payments</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion currently does not process payments between professionals and clients.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            The platform may allow professionals to record payment information for internal tracking purposes only.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Any financial transactions between professionals and clients occur outside the platform and are solely their responsibility.
          </p>
        </section>

        {/* 8. Availability of the Service */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">8. Availability of the Service</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion aims to provide a reliable and accessible service.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            However, the platform is provided "as is" and "as available".
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion does not guarantee uninterrupted access or that the service will always be error-free.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            The platform may be modified, updated, or temporarily unavailable due to maintenance or technical reasons.
          </p>
        </section>

        {/* 9. Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">9. Intellectual Property</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            All rights related to the Motion platform, including software, design, branding, and content, belong to Motion or its licensors.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users may not copy, distribute, modify, or reverse engineer any part of the platform without permission.
          </p>
        </section>

        {/* 10. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">10. Limitation of Liability</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            To the maximum extent permitted by law, Motion is not responsible for:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>The services provided by sports professionals</li>
            <li>Injuries, damages, or losses resulting from training activities</li>
            <li>The accuracy of information uploaded by users</li>
            <li>Disputes between professionals and clients</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users agree that the platform is used at their own risk.
          </p>
        </section>

        {/* 11. Termination */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">11. Termination</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion may suspend or terminate access to the platform if users violate these Terms or misuse the service.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users may stop using the platform at any time.
          </p>
        </section>

        {/* 12. Changes to the Terms */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">12. Changes to the Terms</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion may update these Terms from time to time.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            When significant changes occur, users may be notified through the platform or website.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Continued use of the platform after changes means acceptance of the updated Terms.
          </p>
        </section>

        {/* 13. Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">13. Contact</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            For questions regarding these Terms, contact:
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            <a
              href="mailto:2andreaconti@gmail.com"
              className="underline text-foreground hover:text-primary"
            >
              2andreaconti@gmail.com
            </a>
          </p>
        </section>

        {/* Footer links */}
        <footer className="pt-6 flex items-center gap-4 text-sm text-muted-foreground">
          <Link to="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          <Link to="/terms" className="underline hover:text-foreground">
            Terms
          </Link>
        </footer>
      </article>
    </main>
  );
};

export default Terms;
