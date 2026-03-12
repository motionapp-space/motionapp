import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24">
      <article className="space-y-10">
        {/* Header */}
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-foreground">
            Privacy Policy
          </h1>
          <p className="text-sm text-muted-foreground">Last updated: March 2026</p>
        </header>

        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">1. Introduction</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            This Privacy Policy explains how Motion collects, uses, and protects personal data when users access the platform available at{" "}
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
            Motion is committed to respecting user privacy and protecting personal information.
          </p>
        </section>

        {/* 2. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">2. Information We Collect</h2>
          <p className="font-medium text-foreground">Information provided by professionals</p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Sports professionals may provide information such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Name</li>
            <li>Email address</li>
            <li>Professional information</li>
            <li>Client information</li>
            <li>Training data and progress records</li>
          </ul>
          <p className="font-medium text-foreground">Client information</p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professionals may upload information about their clients, including:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Name</li>
            <li>Contact information</li>
            <li>Training data</li>
            <li>Training performance records</li>
            <li>Goals and progress</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Professionals are responsible for ensuring that they have the right to upload and manage this information.
          </p>
        </section>

        {/* 3. How We Use Information */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">3. How We Use Information</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            We use personal data to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Provide and operate the Motion platform</li>
            <li>Enable professionals to manage their clients</li>
            <li>Allow scheduling and training tracking</li>
            <li>Improve the functionality of the service</li>
            <li>Analyze platform usage</li>
          </ul>
        </section>

        {/* 4. Analytics */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">4. Analytics</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion uses analytics tools to understand how the platform is used and to improve the service.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            These tools may collect information such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Pages visited</li>
            <li>Device type</li>
            <li>General location data</li>
            <li>Interaction with the platform</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Analytics tools may include services such as Google Analytics or other analytics providers.
          </p>
        </section>

        {/* 5. Data Hosting */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">5. Data Hosting</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion uses cloud infrastructure providers to operate the platform.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Currently this includes services such as:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Vercel</li>
            <li>Supabase</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            These providers host and process data on secure servers.
          </p>
        </section>

        {/* 6. Data Sharing */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">6. Data Sharing</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion does not sell personal data.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Data may be shared only when necessary to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Provide the platform functionality</li>
            <li>Operate infrastructure and hosting services</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        {/* 7. Data Security */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">7. Data Security</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion takes reasonable technical and organizational measures to protect personal data from unauthorized access, loss, or misuse.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            However, no online service can guarantee absolute security.
          </p>
        </section>

        {/* 8. Data Retention */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">8. Data Retention</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Personal data is stored for as long as necessary to operate the platform and provide services to users.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Users may request deletion of their data by contacting support.
          </p>
        </section>

        {/* 9. User Rights */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">9. User Rights</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Depending on applicable laws, users may have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-base leading-relaxed text-muted-foreground">
            <li>Access their personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of their data</li>
            <li>Object to certain types of data processing</li>
          </ul>
          <p className="text-base leading-relaxed text-muted-foreground">
            Requests may be sent to the support email listed below.
          </p>
        </section>

        {/* 10. Changes to this Policy */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">10. Changes to this Policy</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            Motion may update this Privacy Policy as the platform evolves.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground">
            Updates will be published on the website.
          </p>
        </section>

        {/* 11. Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
          <p className="text-base leading-relaxed text-muted-foreground">
            For privacy questions or data requests, contact:
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
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Privacy Policy
          </a>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
            Terms
          </a>
        </footer>
      </article>
    </main>
  );
};

export default Privacy;
