export default function handler(req, res) {
  // Autoriser CORS pour votre frontend
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // Fausses données (Mock) générées à partir de votre flux XML
  const items = [
    {
      title: "Morocco advances health digitalization with strategic agreements at GITEX Future Health Africa",
      link: "https://en.yabiladi.com/articles/details/193960/morocco-advances-health-digitalization-with.html",
      pubDate: "2026-05-06T14:52:03Z",
      description: "This agreement seeks to create an integrated institutional framework for the development and implementation of innovative solutions in telemedicine..."
    },
    {
      title: "Cispe lance un cadre auditable contre le «sovereignty washing» des services cloud",
      link: "https://www.ictjournal.ch/news/2026-05-06/cispe-lance-un-cadre-auditable-contre-le-sovereignty-washing-des-services-cloud",
      pubDate: "2026-05-06T13:53:31Z",
      description: "L'association européenne Cispe lance un framework auditable destiné à clarifier les revendications de souveraineté."
    },
    {
      title: "A-rticle - #Fr Signature d'une convention cadre entre l'EPST Centre de Développement...",
      link: "https://www.facebook.com/ScientificPublication/",
      pubDate: "2026-05-06T13:33:50Z",
      description: "framework partnership agreement in the fields of science, technology, and particularly renewable energies. This framework agreement establishes a..."
    },
    {
      title: "Learn Next.js: React Framework - App Store",
      link: "https://apps.apple.com/rw/app/learn-next-js-react-framework/id6443595563?l=fr-FR",
      pubDate: "2026-05-06T13:02:23Z",
      description: "Master Next.js, the world's most popular React framework for building production-ready web applications! Whether you're a React developer looking to..."
    },
    {
      title: "European Commission Round Table, Brussels, 4 May: Towards a European Business Code...",
      link: "https://www.ohada.com/actualite/8273/european-commission-round-table-brussels-4-may-towards-a-european-business-code-and-a-28th-regime.html",
      pubDate: "2026-05-06T12:03:53Z",
      description: "Such an additional optional legal framework, as proposed by the Association Henri Capitant, would help remedy the legal fragmentation of the Single..."
    }
  ];

  res.status(200).json({ status: "ok", items });
}