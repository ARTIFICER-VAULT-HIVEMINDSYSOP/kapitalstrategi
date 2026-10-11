/**
 * Gemensam konfiguration för de två sektionerna.
 * Sidorna länkar inte till varandra.
 */
export const origin = "https://kapitalstrategi.com";

export const FINANCE_DISCLAIMER =
  "Allt sparande och all investering innebär risk: värdet kan både stiga och sjunka, och du kan förlora pengar.";

export const sections = {
  kapitalnytt: {
    id: "kapitalnytt",
    namn: "Kapitalnytt",
    dir: "kapitalnytt",
    route: "/kapitalnytt/",
    tagline: "Allokering, marknad och kunskap",
    beskrivning:
      "Kapitalallokering och balans, marknadsinformation och analys, samt utbildningar, tjänster och licenser.",
    finansAlltid: true,
    fornminneKategori: "",
    jaktKategori: "",
    energiKategori: "",
    kategorier: {
      kapitalallokering: "Kapitalallokering",
      tillvaxtstrategier: "Tillväxtstrategier",
      "balans-och-riskspridning": "Balans och riskspridning",
      marknadslage: "Marknadsläge",
      marknadsanalys: "Marknadsanalys",
      "begrepp-skola": "Begrepp och skola",
    },
    om: [
      "Kapitalnytt är en egen sektion med eget namn och eget sidhuvud.",
      "Den första pelaren är kapitalallokering och balans: strategier, spridning, ombalansering och tidshorisont. Tillväxt hör ihop med risk, eftersom värdet kan både stiga och sjunka.",
      "Den andra pelaren är marknadsinformation och analys, så att urval och analys syns, med handel och tillväxt i fokus och med risken kvar i bilden.",
      "Den tredje pelaren väcker intresse för utbildningar, tjänster och de licenser arbetet gäller. En utmärkelse från en utbildning är inte en licens eller auktorisation.",
    ],
  },
  urbergsskolden: {
    id: "urbergsskolden",
    namn: "Urbergsskölden",
    dir: "urbergsskolden",
    route: "/urbergsskolden/",
    tagline: "Den fennoskandiska urbergsskölden",
    beskrivning:
      "Den fennoskandiska urbergsskölden som lång grund för historia, fornminnen, jakt, natur, råvaror, energi och resurshushållning.",
    finansAlltid: false,
    fornminneKategori: "historia-och-fornminnen",
    jaktKategori: "jakt-och-natur",
    energiKategori: "energi-och-resurshushallning",
    kategorier: {
      "historia-och-fornminnen": "Historia och fornminnen",
      "jakt-och-natur": "Jakt och natur",
      "ravaror-och-kretslopp": "Råvaror och kretslopp",
      "energi-och-resurshushallning": "Energi och resurshushållning",
      historienyheter: "Historienyheter",
    },
    om: [
      "Urbergsskölden är en egen sektion om den fennoskandiska urbergsskölden.",
      "Urberget är den långa grunden för historia och fornminnen, för jakt, natur och råvarornas kretslopp, och för energi och resurshushållning.",
      "Sektionen kan också ta upp nyheter som hör ihop med historia och med värden bortom enbart fysiska tillgångar.",
      "Fakta om berget källhänvisas, till exempel till SGU. Fornminnen skrivs utan koordinater. Jakt hålls inom laglig jakt och viltvård.",
      "När ett inlägg rör placering av kapital sätts finans, och då syns risktexten. Historia, natur och energi utan den markeringen har ingen sådan text.",
    ],
  },
};
