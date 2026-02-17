import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de VeloCard.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 pb-24">
      <h1 className="text-3xl font-bold mb-8">Conditions d&apos;utilisation</h1>
      <div className="space-y-6 text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">1. Acceptation</h2>
          <p>En utilisant VeloCard, vous acceptez les présentes conditions. Si vous n&apos;acceptez pas, veuillez ne pas utiliser le service.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">2. Description du service</h2>
          <p>VeloCard est une application qui transforme vos activités cyclistes en carte de joueur avec des statistiques. Le service est gratuit dans sa version de base.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">3. Compte utilisateur</h2>
          <p>Vous devez connecter un compte Strava, Garmin ou Wahoo pour utiliser VeloCard. Vous êtes responsable de la sécurité de votre compte.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">4. Utilisation acceptable</h2>
          <p>Vous vous engagez à ne pas utiliser le service à des fins illégales, à ne pas tricher dans les classements, et à respecter les autres utilisateurs.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">5. Propriété intellectuelle</h2>
          <p>VeloCard et son contenu sont protégés par le droit d&apos;auteur. Les cartes générées restent votre propriété pour un usage personnel.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">6. Limitation de responsabilité</h2>
          <p>VeloCard est fourni &quot;tel quel&quot;. Nous ne garantissons pas l&apos;exactitude des statistiques calculées.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">7. Modification</h2>
          <p>Nous nous réservons le droit de modifier ces conditions. Les utilisateurs seront informés des changements significatifs.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">8. Contact</h2>
          <p>Pour toute question : contact@velocard.app</p>
        </section>
      </div>
    </div>
  );
}
