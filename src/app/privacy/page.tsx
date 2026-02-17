import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment VeloCard collecte, utilise et protège vos données.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 pb-24">
      <h1 className="text-3xl font-bold mb-8">Politique de confidentialité</h1>
      <div className="space-y-6 text-text-secondary leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">1. Données collectées</h2>
          <p>VeloCard collecte les données suivantes via les API Strava, Garmin et Wahoo : activités sportives (distance, dénivelé, vitesse, durée), profil public (nom, photo), et données de géolocalisation des parcours.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">2. Utilisation des données</h2>
          <p>Vos données sont utilisées pour calculer vos statistiques de carte, alimenter les classements, et permettre les interactions sociales (duels, clubs, guerres).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">3. Partage des données</h2>
          <p>Vos données ne sont jamais vendues. Elles sont partagées uniquement dans le cadre des fonctionnalités sociales de l&apos;app (classements, duels, profils publics).</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">4. Conservation</h2>
          <p>Vos données sont conservées tant que votre compte est actif. Vous pouvez demander leur suppression à tout moment.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">5. Vos droits (RGPD)</h2>
          <p>Vous avez le droit d&apos;accéder, rectifier, exporter et supprimer vos données personnelles. Rendez-vous dans Paramètres → Confidentialité pour exercer ces droits.</p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-2">6. Contact</h2>
          <p>Pour toute question : contact@velocard.app</p>
        </section>
      </div>
    </div>
  );
}
