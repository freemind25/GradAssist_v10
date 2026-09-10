import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, FileText, Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — GradeAssist',
  description:
    "Politique de confidentialité de GradeAssist : collecte, utilisation et protection des données lors de l'utilisation de la connexion à Google Drive.",
};

const LAST_UPDATED = '10/09/2026';
const APP_URL = 'https://grad-assist-v10.vercel.app';
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

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative overflow-hidden bg-gradient-to-r from-[hsl(var(--header-gradient-from))] to-[hsl(var(--header-gradient-to))] text-primary-foreground">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <ShieldCheck className="w-7 h-7 text-accent" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Politique de confidentialité</h1>
              <p className="text-sm text-primary-foreground/80 mt-1">
                Dernière mise à jour : {LAST_UPDATED}
              </p>
            </div>
          </div>
          <p className="max-w-3xl text-sm sm:text-base text-primary-foreground/90">
            Cette politique de confidentialité décrit comment <a href={APP_URL} className="underline decoration-accent/60 underline-offset-4 hover:text-accent">GradeAssist</a> (« l&apos;application », « nous ») collecte, utilise et protège les données lors de l&apos;utilisation de la fonctionnalité de connexion à Google Drive.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-4xl">
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold text-amber-600 dark:text-amber-400 mb-1">Note avant publication</p>
          <p className="text-foreground/80">
            Les champs entre crochets de la version originale (<span className="font-mono text-xs">[GradAssist]</span>, <span className="font-mono text-xs">[rackho2002@gmail.com]</span>, <span className="font-mono text-xs">[10.09.2026]</span>) ont été remplacés par les informations réelles. L&apos;application traitant des données concernant les élèves (notes, noms, évaluations contenues dans les rapports), la section 6 est conservée.
          </p>
        </div>

        <nav aria-label="Sommaire" className="mb-10 rounded-xl border bg-card p-5">
          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" aria-hidden="true" /> Sommaire
          </p>
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2 text-foreground/80">
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#qui-sommes-nous">1. Qui nous sommes</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#donnees-collectees">2. Données que nous collectons</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#pourquoi">3. Pourquoi nous collectons ces données</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#google-policy">4. Respect de la politique Google relative aux données utilisateur</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#stockage">5. Stockage et sécurité des données</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#eleves">6. Données concernant les élèves</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#tiers">7. Partage des données avec des tiers</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#conservation">8. Durée de conservation</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#revocation">9. Révoquer l&apos;accès à tout moment</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#droits">10. Droits des utilisateurs</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#modifications">11. Modifications de cette politique</a></li>
            <li><a className="hover:text-accent underline-offset-4 hover:underline" href="#contact">12. Contact</a></li>
          </ol>
        </nav>

        <div className="space-y-10">
          <Section id="qui-sommes-nous" title="1. Qui nous sommes">
            <p>
              <strong>GradeAssist</strong> est une application de gestion de classe destinée aux enseignants. Cette politique concerne spécifiquement la fonctionnalité permettant à chaque enseignant de connecter son propre compte Google afin de sauvegarder des rapports dans son Google Drive personnel.
            </p>
          </Section>

          <Section id="donnees-collectees" title="2. Données que nous collectons">
            <p>Lorsqu&apos;un enseignant connecte son compte Google, nous accédons uniquement aux informations suivantes :</p>
            <ul className="space-y-2">
              <Bullet>
                <strong>Informations de profil de base :</strong> nom et adresse e-mail associés au compte Google, utilisés pour identifier l&apos;enseignant dans l&apos;application.
              </Bullet>
              <Bullet>
                <strong>Accès limité à Google Drive (scope <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">drive.file</code>) :</strong> cet accès nous permet uniquement de créer, lire et modifier les fichiers que l&apos;application elle-même a créés dans le Drive de l&apos;enseignant. Nous n&apos;avons aucun accès aux autres fichiers, dossiers ou données présents sur le Drive de l&apos;enseignant.
              </Bullet>
            </ul>
            <p>Nous ne collectons ni ne demandons jamais le mot de passe du compte Google de l&apos;enseignant.</p>
          </Section>

          <Section id="pourquoi" title="3. Pourquoi nous collectons ces données">
            <p>Ces données sont utilisées exclusivement pour :</p>
            <ul className="space-y-2">
              <Bullet>Identifier l&apos;enseignant dans l&apos;application.</Bullet>
              <Bullet>Sauvegarder automatiquement les rapports de classe générés par l&apos;application dans le Google Drive personnel de l&apos;enseignant, à sa demande.</Bullet>
            </ul>
          </Section>

          <Section id="google-policy" title="4. Respect de la politique Google relative aux données utilisateur">
            <p>
              L&apos;utilisation et le transfert des informations reçues des API Google par <strong>GradeAssist</strong> respectent la{' '}
              <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4 hover:decoration-2">
                Google API Services User Data Policy
              </a>
              , y compris les exigences de <em>Limited Use</em> (usage limité) :
            </p>
            <ul className="space-y-2">
              <Bullet>Les données obtenues via l&apos;API Google Drive ne sont utilisées que pour fournir ou améliorer les fonctionnalités visibles par l&apos;utilisateur, décrites dans cette politique.</Bullet>
              <Bullet>Ces données ne sont jamais vendues.</Bullet>
              <Bullet>Ces données ne sont jamais utilisées à des fins publicitaires.</Bullet>
              <Bullet>Ces données ne sont jamais utilisées pour entraîner des modèles d&apos;intelligence artificielle génériques ou non liés à la fonctionnalité concernée.</Bullet>
              <Bullet>L&apos;accès à ces données par des personnes (employés, prestataires) est limité aux cas où cela est nécessaire à des fins de sécurité, de conformité légale ou de support technique à la demande de l&apos;utilisateur.</Bullet>
            </ul>
          </Section>

          <Section id="stockage" title="5. Stockage et sécurité des données">
            <ul className="space-y-2">
              <Bullet>Les jetons d&apos;accès (tokens) permettant à l&apos;application de communiquer avec le Drive de l&apos;enseignant sont stockés de manière chiffrée sur nos serveurs.</Bullet>
              <Bullet>Ces jetons ne sont jamais transmis ou exposés côté navigateur (frontend).</Bullet>
              <Bullet>Nous mettons en œuvre des mesures de sécurité raisonnables pour protéger les données contre l&apos;accès non autorisé, la perte ou la divulgation.</Bullet>
            </ul>
          </Section>

          <Section id="eleves" title="6. Données concernant les élèves">
            <p>
              Les rapports générés et sauvegardés par l&apos;application peuvent contenir des informations relatives aux élèves (par exemple des données de suivi de classe), saisies par l&apos;enseignant lui-même. Ces informations restent sous le contrôle exclusif de l&apos;enseignant : elles sont stockées uniquement dans le Google Drive personnel de cet enseignant, et <strong>GradeAssist</strong> n&apos;y accède pas au-delà de leur transmission technique lors de la sauvegarde.
            </p>
            <p>
              Il appartient à l&apos;enseignant, en tant que responsable pédagogique, de respecter les règles applicables à la protection des données de ses élèves dans le cadre de son établissement.
            </p>
          </Section>

          <Section id="tiers" title="7. Partage des données avec des tiers">
            <p>
              Nous ne vendons, ne louons et ne partageons vos données avec aucun tiers à des fins commerciales ou publicitaires. Les seules communications de données ont lieu avec les services Google (Google Drive API), strictement nécessaires au fonctionnement de la fonctionnalité de sauvegarde.
            </p>
          </Section>

          <Section id="conservation" title="8. Durée de conservation">
            <p>
              Les jetons d&apos;accès et informations de profil associés sont conservés tant que l&apos;enseignant utilise la fonctionnalité de connexion à Google Drive. Ils sont supprimés dès que l&apos;enseignant révoque l&apos;accès (voir <a href="#revocation" className="text-accent underline underline-offset-4">section 9</a>) ou demande la suppression de son compte.
            </p>
          </Section>

          <Section id="revocation" title="9. Révoquer l'accès à tout moment">
            <p>Chaque enseignant peut révoquer à tout moment l&apos;accès de <strong>GradeAssist</strong> à son compte Google, de deux manières :</p>
            <ul className="space-y-2">
              <Bullet>Depuis les paramètres de l&apos;application (option de déconnexion du Drive).</Bullet>
              <Bullet>
                Directement depuis la page de gestion des accès tiers de son compte Google :{' '}
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                  https://myaccount.google.com/permissions
                </a>
                .
              </Bullet>
            </ul>
          </Section>

          <Section id="droits" title="10. Droits des utilisateurs">
            <p>
              Conformément à la réglementation applicable en matière de protection des données, chaque enseignant peut demander à accéder à ses données, les rectifier, les faire supprimer, ou s&apos;opposer à leur traitement, en nous contactant à l&apos;adresse indiquée ci-dessous.
            </p>
          </Section>

          <Section id="modifications" title="11. Modifications de cette politique">
            <p>
              Cette politique peut être mise à jour périodiquement. La date de dernière mise à jour figure en haut de ce document. Nous encourageons les utilisateurs à la consulter régulièrement.
            </p>
          </Section>

          <Section id="contact" title="12. Contact">
            <p>
              Pour toute question relative à cette politique de confidentialité ou à l&apos;utilisation de vos données, contactez-nous à :{' '}
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
            href="/conditions"
            className="inline-flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent/10 transition-colors"
          >
            <Scale className="w-4 h-4 text-accent" aria-hidden="true" /> Conditions d&apos;utilisation
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
