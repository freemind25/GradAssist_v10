import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale, ArrowLeft, FileText, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: "Conditions d'utilisation — GradeAssist",
  description:
    "Conditions d'utilisation de GradeAssist : accès à l'application, connexion à Google Drive, responsabilités et droits des utilisateurs.",
};

const LAST_UPDATED = '10/09/2026';
const CONTACT_EMAIL = 'rackho2002@gmail.com';

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-semibold text-foreground border-b pb-2">{title}</h2>
      <div className="space-y-3 text-sm sm:text-base leading-relaxed text-foreground/90">{children}</div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

export default function ConditionsPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[hsl(var(--header-gradient-from))] to-[hsl(var(--header-gradient-to))] text-primary-foreground">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <Scale className="w-7 h-7 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conditions d&apos;utilisation</h1>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Dernière mise à jour : {LAST_UPDATED}
              </p>
            </div>
          </div>
          <p className="max-w-3xl text-sm sm:text-base text-primary-foreground/90">
            Bienvenue sur <strong>GradeAssist</strong>. En accédant à cette application ou en l&apos;utilisant, vous acceptez les présentes conditions d&apos;utilisation. Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser l&apos;application.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        <nav aria-label="Sommaire" className="mb-10 rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" aria-hidden="true" /> Sommaire
          </p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2 text-foreground/80">
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#objet">1. Objet de l&apos;application</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#acces">2. Accès à l&apos;application</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#drive">3. Fonctionnalité de connexion à Google Drive</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#utilisation">4. Utilisation autorisée</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#contenu">5. Contenu et données saisies par l&apos;utilisateur</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#propriete">6. Propriété intellectuelle</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#disponibilite">7. Disponibilité du service</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#responsabilite">8. Limitation de responsabilité</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#resiliation">9. Suspension ou résiliation</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#modifications">10. Modification des conditions</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#contact">11. Contact</a></li>
          </ol>
        </nav>

        <div className="space-y-10">
          <Section id="objet" title="1. Objet de l'application">
            <p>
              <strong>GradeAssist</strong> est une application de gestion de classe destinée aux enseignants, permettant notamment de générer des rapports et, sur option, de les sauvegarder directement dans le Google Drive personnel de l&apos;enseignant.
            </p>
          </Section>

          <Section id="acces" title="2. Accès à l'application">
            <ul className="space-y-2">
              <Bullet>L&apos;application est destinée à un usage par des enseignants dans le cadre de leur activité pédagogique.</Bullet>
              <Bullet>L&apos;accès peut nécessiter la création d&apos;un compte ou l&apos;authentification via un compte Google existant.</Bullet>
              <Bullet>Chaque utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité effectuée depuis son compte.</Bullet>
            </ul>
          </Section>

          <Section id="drive" title="3. Fonctionnalité de connexion à Google Drive">
            <ul className="space-y-2">
              <Bullet>La connexion à Google Drive est facultative et activée uniquement à l&apos;initiative de l&apos;enseignant.</Bullet>
              <Bullet>
                Une fois connectée, cette fonctionnalité permet à l&apos;application de créer et gérer des fichiers de rapports dans le Drive de l&apos;enseignant, dans la limite des autorisations accordées (accès restreint aux fichiers créés par l&apos;application, scope <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">drive.file</code>).
              </Bullet>
              <Bullet>
                L&apos;enseignant peut révoquer cet accès à tout moment, depuis l&apos;application ou depuis les paramètres de son compte Google. Le fonctionnement de cette intégration est détaillé dans notre{' '}
                <Link href="/confidentialite" className="text-accent underline underline-offset-4">
                  Politique de confidentialité
                </Link>
                .
              </Bullet>
            </ul>
          </Section>

          <Section id="utilisation" title="4. Utilisation autorisée">
            <p>
              L&apos;utilisateur s&apos;engage à utiliser l&apos;application uniquement à des fins légitimes et pédagogiques, et notamment à :
            </p>
            <ul className="space-y-2">
              <Bullet>Ne pas tenter d&apos;accéder à des comptes, données ou fonctionnalités auxquels il n&apos;est pas autorisé.</Bullet>
              <Bullet>Ne pas perturber, surcharger ou tenter de contourner la sécurité de l&apos;application.</Bullet>
              <Bullet>Ne pas utiliser l&apos;application pour stocker ou diffuser du contenu illicite, diffamatoire ou portant atteinte aux droits de tiers.</Bullet>
              <Bullet>Respecter la réglementation applicable à la protection des données des élèves dont il assure le suivi via l&apos;application.</Bullet>
            </ul>
          </Section>

          <Section id="contenu" title="5. Contenu et données saisies par l'utilisateur">
            <ul className="space-y-2">
              <Bullet>
                L&apos;utilisateur reste seul responsable de l&apos;exactitude et de la légalité du contenu qu&apos;il saisit dans l&apos;application (informations de classe, rapports, données relatives aux élèves).
              </Bullet>
              <Bullet>
                L&apos;utilisateur garantit disposer des autorisations nécessaires pour traiter les données qu&apos;il saisit, conformément à la réglementation applicable dans son établissement.
              </Bullet>
            </ul>
          </Section>

          <Section id="propriete" title="6. Propriété intellectuelle">
            <p>
              L&apos;application, son code, son interface et ses éléments graphiques sont la propriété de <strong>GradeAssist / M.SADI</strong> ou de ses concédants de licence. Aucune disposition des présentes conditions ne confère à l&apos;utilisateur un droit de propriété sur l&apos;application elle-même.
            </p>
            <p>
              Les rapports et contenus générés par l&apos;utilisateur via l&apos;application, ainsi que les fichiers sauvegardés sur son propre Google Drive, restent la propriété de l&apos;utilisateur.
            </p>
          </Section>

          <Section id="disponibilite" title="7. Disponibilité du service">
            <p>
              Nous nous efforçons d&apos;assurer la disponibilité et le bon fonctionnement de l&apos;application, sans toutefois garantir un accès ininterrompu ou exempt d&apos;erreurs. L&apos;application peut être temporairement suspendue pour maintenance ou mise à jour.
            </p>
          </Section>

          <Section id="responsabilite" title="8. Limitation de responsabilité">
            <p>
              Dans la mesure permise par la loi applicable, <strong>GradeAssist / M.SADI</strong> ne pourra être tenu responsable des dommages indirects résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser l&apos;application, y compris en cas de perte de données consécutive à un dysfonctionnement de l&apos;intégration avec des services tiers (dont Google Drive).
            </p>
            <p>L&apos;utilisateur reste responsable de conserver ses propres sauvegardes des données qu&apos;il juge critiques.</p>
          </Section>

          <Section id="resiliation" title="9. Suspension ou résiliation">
            <p>
              Nous nous réservons le droit de suspendre ou de résilier l&apos;accès d&apos;un utilisateur en cas de non-respect des présentes conditions, notamment en cas d&apos;usage abusif ou illicite de l&apos;application.
            </p>
            <p>
              L&apos;utilisateur peut cesser d&apos;utiliser l&apos;application à tout moment et demander la suppression de son compte et de ses données associées.
            </p>
          </Section>

          <Section id="modifications" title="10. Modification des conditions">
            <p>
              Ces conditions peuvent être modifiées à tout moment. La date de dernière mise à jour figure en haut de ce document. La poursuite de l&apos;utilisation de l&apos;application après modification vaut acceptation des nouvelles conditions.
            </p>
          </Section>

          <Section id="contact" title="11. Contact">
            <p>
              Pour toute question relative aux présentes conditions d&apos;utilisation, contactez-nous à :{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent underline underline-offset-4">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </Section>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Retour à l&apos;application
          </Link>
          <Link
            href="/confidentialite"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent/10 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-accent" aria-hidden="true" /> Politique de confidentialité
          </Link>
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GradeAssist. Tous droits réservés.</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <Link href="/confidentialite" className="hover:text-accent underline-offset-4 hover:underline">Politique de confidentialité</Link>
          <Link href="/conditions" className="hover:text-accent underline-offset-4 hover:underline">Conditions d&apos;utilisation</Link>
        </p>
      </footer>
    </div>
  );
}
