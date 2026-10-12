# Portfolio d'Aly-Ba Dramé

Site statique HTML/CSS/JavaScript, publié depuis la branche `main` sur Vercel.

## Vérification et publication

Node.js 22 ou ultérieur suffit. Aucune dépendance npm à installer.

```sh
npm test
npm run build
npm run preview
```

La prévisualisation est accessible sur `http://127.0.0.1:8124` et applique les
en-têtes de `vercel.json`. Vercel ne publie que `dist/`, généré à partir de la liste
explicite des ressources dans `scripts/build.mjs`. Ajouter une nouvelle page ou
un script à cette liste avant de le publier. Les fichiers de travail, sauvegardes
et anciennes API ne font pas partie de la sortie. `.vercelignore` complète cette
séparation pour les envois de sources.

## Sécurité et services externes

- Aucun JavaScript distant ni script inline. Les scripts sont servis sur le même
  domaine ; la CSP interdit les scripts externes, les objets et l'intégration en iframe.
- Les styles inline restent autorisés pour les graphiques de la démo et les styles
  existants. Cette exception ne s'applique pas aux scripts.
- Google Fonts reste autorisé pour les feuilles de style et polices. Le formulaire
  conserve son destinataire Formspree, accessible aussi sans JavaScript. Vérifier
  la propriété du formulaire et ses destinataires dans le compte Formspree.
- Les exports CSV neutralisent les valeurs textuelles pouvant devenir des formules.
- Les dépendances JavaScript locales gardent leurs versions d'origine. Leurs sources
  et empreintes figurent dans `assets/vendor/vendor-manifest.json`. Les avis de licence
  et README des éditeurs accompagnent les fichiers. Pour les mettre à jour, vérifier
  l'intégrité de l'archive npm, conserver les licences et actualiser le manifeste.
- Les contrôles des comptes GitHub/Vercel et la suppression d'anciens déploiements
  se font dans leurs consoles. Un nouveau déploiement ne modifie pas les anciennes URL.

Le renforcement du site ne garantit pas son reclassement par une messagerie.
Conserver le message de blocage exact pour adresser une demande à l'éditeur concerné.

Template d'origine : [BootstrapMade MyResume](https://bootstrapmade.com/free-html-bootstrap-template-my-resume/).
