/**
 * UK bank map (Bankkarta Storbritannien). A British-market counterpart of the
 * Swedish bank map, with the same sections, fields, scores (1–5), flags,
 * categories, views and bank-map-* classes. Mounts directly after the Swedish
 * .bank-map section while it is on the page. Swedish and English text; other
 * locales follow the Swedish map's rule (locale "uk" = Ukrainian shows English).
 * Market "UK" (country field) is not the same thing as locale "uk".
 * Facts are checked against the linked public sources (FCA, PRA, FSCS, banks).
 */
(function () {
  "use strict";

  var HOST_ID = "bank-map-uk";

  var UPDATED = "2026-10-17";

  function c(score, sv, en) {
    return { score: score, noteSv: sv, noteEn: en };
  }

  var FP_SV = "Faster Payments (nära realtid, dygnet runt) mellan brittiska konton; CHAPS för stora belopp samma dag, ofta mot avgift. Beloppsgränser sätts per bank och kanal – kontrollera hos banken.";
  var FP_EN = "Faster Payments (near real time, 24/7) between UK accounts; CHAPS for large same-day amounts, often for a fee. Limits are set per bank and channel – check with the bank.";
  var FSCS_SV = "Insättningar skyddas av FSCS upp till 120 000 £ per person och banklicens (sedan 1 dec 2025).";
  var FSCS_EN = "Deposits are protected by the FSCS up to £120,000 per person per banking licence (since 1 Dec 2025).";

  var BANKS = [
    {
      id: "uk-hsbc", name: "HSBC UK", category: "storbank", country: "UK", website: "https://www.hsbc.co.uk",
      summarySv: "Brittisk storbank inom HSBC-koncernen (grundad 1865 i Hongkong, huvudkontor i London). HSBC UK Bank plc är den ringinhägnade privatkundsbanken med säte i Birmingham. First Direct är ett varumärke under samma licens.",
      summaryEn: "UK major bank within the HSBC group (founded 1865 in Hong Kong, headquartered in London). HSBC UK Bank plc is the ring-fenced retail bank based in Birmingham. First Direct is a brand under the same licence.",
      ownershipSv: "Helägt dotterbolag till HSBC Holdings plc (börsnoterat i London och Hongkong). First Direct delar banklicens med HSBC UK – FSCS-taket gäller sammanlagt.",
      ownershipEn: "Wholly owned subsidiary of HSBC Holdings plc (listed in London and Hong Kong). First Direct shares the banking licence with HSBC UK – the FSCS limit applies in total.",
      processSv: "OSINT 2026: PRA bötfällde HSBC 57,4 mn £ (jan 2024) för brister i att identifiera och märka insättningar som omfattas av FSCS. " + FP_SV + " Standardkonto utan månadsavgift finns; premiumkonton kostar.",
      processEn: "OSINT 2026: the PRA fined HSBC £57.4m (Jan 2024) for failures in identifying and marking FSCS-eligible deposits. " + FP_EN + " A standard account without a monthly fee exists; premium accounts cost.",
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; premium- och paketkonton kostar. Utlandsbetalningar och valutaväxling dyrare än fintech.", "Standard account without a monthly fee; premium and packaged accounts cost. Cross-border payments and FX costlier than fintech."),
        withdrawals: c(3, "Faster Payments och kontantuttag fungerar i vardag. Stora belopp kan kräva CHAPS eller extra kontroll.", "Faster Payments and cash work day-to-day. Large amounts may need CHAPS or extra checks."),
        rules: c(3, "Tydliga villkor och FSCS-skydd. PRA-böter 2024 gällde just insättningsskyddets märkning.", "Clear terms and FSCS protection. The 2024 PRA fine concerned deposit-protection marking itself.")
      },
      flags: ["public-scrutiny", "payment-account", "high-fee-risk"], tags: ["storbank", "uk", "fscs", "first-direct", "faster-payments"], order: 10
    },
    {
      id: "uk-barclays", name: "Barclays", category: "storbank", country: "UK", website: "https://www.barclays.co.uk",
      summarySv: "Brittisk storbank med rötter till 1690, huvudkontor i London. Privatkunder i Barclays Bank UK PLC; investmentbank i Barclays Bank PLC. Driver Tesco Banks tidigare bankverksamhet sedan nov 2024.",
      summaryEn: "UK major bank with roots back to 1690, headquartered in London. Retail customers in Barclays Bank UK PLC; investment bank in Barclays Bank PLC. Runs Tesco Bank's former banking business since Nov 2024.",
      ownershipSv: "Börsnoterat Barclays PLC (London). Spritt institutionellt ägande – ingen statlig ägare.",
      ownershipEn: "Listed Barclays PLC (London). Widely held by institutions – no state owner.",
      processSv: "OSINT 2026: FCA bötfällde Barclays sammanlagt 42 mn £ (juli 2025) för brister i hanteringen av penningtvättsrisker kring två företagskunder. " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Barclays a total of £42m (July 2025) for failings in handling money-laundering risk around two business customers. " + FP_EN,
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; tilläggspaket kostar. Utlandsbetalningar och FX dyrare än fintech.", "Standard account without a monthly fee; add-on packs cost. Cross-border and FX costlier than fintech."),
        withdrawals: c(3, "Faster Payments, kort och kontant i vardag. Stora eller ovanliga belopp kan granskas manuellt.", "Faster Payments, cards and cash day-to-day. Large or unusual amounts may be reviewed manually."),
        rules: c(2, "FSCS-skydd och tydliga villkor, men upprepade FCA-böter för kontroller mot ekonomisk brottslighet (2015, 2022, 2025) ger strikt riskmotor.", "FSCS protection and clear terms, but repeated FCA fines on financial-crime controls (2015, 2022, 2025) mean a strict risk engine.")
      },
      flags: ["aml-fine", "public-scrutiny", "payment-account"], tags: ["storbank", "uk", "aml", "fscs", "tesco-bank", "faster-payments"], order: 20
    },
    {
      id: "uk-lloyds", name: "Lloyds Bank", category: "storbank", country: "UK", website: "https://www.lloydsbank.com",
      summarySv: "Brittisk storbank grundad 1765 i Birmingham, huvudkontor i London. Största bankkoncernen för brittiska privatkunder; Halifax och Bank of Scotland ingår i samma koncern.",
      summaryEn: "UK major bank founded 1765 in Birmingham, headquartered in London. Largest banking group for UK retail customers; Halifax and Bank of Scotland are in the same group.",
      ownershipSv: "Börsnoterat Lloyds Banking Group plc (London). Staten sålde sina sista aktier 2017 efter krisräddningen 2008. Varumärken: Lloyds, Halifax, Bank of Scotland, Scottish Widows m.fl.",
      ownershipEn: "Listed Lloyds Banking Group plc (London). The state sold its last shares in 2017 after the 2008 rescue. Brands: Lloyds, Halifax, Bank of Scotland, Scottish Widows et al.",
      processSv: "OSINT 2026: FCA bötfällde Lloyds Bank och Bank of Scotland 105 mn £ (juli 2014) för manipulation av LIBOR och repo-räntan i Bank of Englands likviditetsprogram. Koncernen berörs av FCA:s ersättningsprogram för bilfinansiering (Black Horse). " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Lloyds Bank and Bank of Scotland £105m (July 2014) for manipulating LIBOR and the repo rate in the Bank of England liquidity scheme. The group is affected by the FCA motor-finance redress scheme (Black Horse). " + FP_EN,
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; Club-konton med månadsavgift och villkor. FX dyrare än fintech.", "Standard account without a monthly fee; Club accounts with a monthly fee and conditions. FX costlier than fintech."),
        withdrawals: c(3, "Stort kontors- och uttagsnät. Faster Payments i vardag; stora belopp kan kräva CHAPS eller kontroll.", "Large branch and cash network. Faster Payments day-to-day; large amounts may need CHAPS or checks."),
        rules: c(3, "FSCS-skydd. Lloyds Bank och Bank of Scotland (inkl. Halifax) är olika licenser – kontrollera hur FSCS-taket räknas.", "FSCS protection. Lloyds Bank and Bank of Scotland (incl. Halifax) are different licences – check how the FSCS limit counts.")
      },
      flags: ["public-scrutiny", "consumer-credit", "payment-account"], tags: ["storbank", "uk", "fscs", "halifax", "bank-of-scotland", "bilfinans"], order: 30
    },
    {
      id: "uk-halifax", name: "Halifax / Bank of Scotland", category: "storbank", country: "UK", website: "https://www.halifax.co.uk",
      summarySv: "Halifax (grundad 1853 som byggnadsförening i Halifax) och Bank of Scotland (grundad 1695 i Edinburgh) är varumärken inom Lloyds Banking Group. Halifax är Storbritanniens största bolånegivare.",
      summaryEn: "Halifax (founded 1853 as a building society in Halifax) and Bank of Scotland (founded 1695 in Edinburgh) are brands within Lloyds Banking Group. Halifax is the UK's largest mortgage lender.",
      ownershipSv: "Del av Lloyds Banking Group plc. Halifax är en division av Bank of Scotland plc – de delar banklicens, så FSCS-taket på 120 000 £ gäller sammanlagt.",
      ownershipEn: "Part of Lloyds Banking Group plc. Halifax is a division of Bank of Scotland plc – they share a banking licence, so the £120,000 FSCS limit applies in total.",
      processSv: "OSINT 2026: omfattas av koncernens FCA-ärenden (bl.a. LIBOR/repo-böterna 2014 riktade mot Bank of Scotland plc). " + FP_SV,
      processEn: "OSINT 2026: covered by the group's FCA matters (incl. the 2014 LIBOR/repo fine aimed at Bank of Scotland plc). " + FP_EN,
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; konton med belöning kräver insättningsvillkor eller avgift.", "Standard account without a monthly fee; reward accounts need deposit conditions or a fee."),
        withdrawals: c(3, "Brett kontorsnät, Faster Payments i vardag. Stora belopp kan kräva extra kontroll.", "Wide branch network, Faster Payments day-to-day. Large amounts may need extra checks."),
        rules: c(3, "FSCS-skydd, men delad licens mellan Halifax och Bank of Scotland – sprid inte buffert mellan dem i tron att det ger dubbelt skydd.", "FSCS protection, but a shared licence between Halifax and Bank of Scotland – do not split a buffer between them expecting double cover.")
      },
      flags: ["public-scrutiny", "consumer-credit", "payment-account"], tags: ["storbank", "uk", "bolan", "fscs", "lloyds"], order: 40
    },
    {
      id: "uk-natwest", name: "NatWest", category: "storbank", country: "UK", website: "https://www.natwest.com",
      summarySv: "Brittisk storbank (National Westminster Bank, bildad 1968 genom sammanslagning, med äldre rötter). Koncernen NatWest Group har huvudkontor i Edinburgh och omfattar även Royal Bank of Scotland, Ulster Bank och Coutts.",
      summaryEn: "UK major bank (National Westminster Bank, formed by a 1968 merger, with older roots). NatWest Group is headquartered in Edinburgh and also includes Royal Bank of Scotland, Ulster Bank and Coutts.",
      ownershipSv: "Börsnoterat NatWest Group plc (London). Helt privatägt igen sedan 30 maj 2025, då staten sålde sina sista aktier från krisräddningen 2008.",
      ownershipEn: "Listed NatWest Group plc (London). Fully privately owned again since 30 May 2025, when the state sold its last shares from the 2008 rescue.",
      processSv: "OSINT 2026: dömdes i brottmål och fick 264,8 mn £ i böter (dec 2021) för brott mot penningtvättsreglerna (en företagskund inom guldhandel). " + FP_SV,
      processEn: "OSINT 2026: criminally convicted and fined £264.8m (Dec 2021) for breaching the money-laundering regulations (a gold-trading business customer). " + FP_EN,
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; Reward-konton med månadsavgift. FX dyrare än fintech.", "Standard account without a monthly fee; Reward accounts with a monthly fee. FX costlier than fintech."),
        withdrawals: c(3, "Faster Payments och kontant i vardag. Kontantinsättningar och stora flöden granskas hårt efter domen 2021.", "Faster Payments and cash day-to-day. Cash deposits and large flows are scrutinised closely after the 2021 conviction."),
        rules: c(2, "FSCS-skydd och tydliga villkor, men första brittiska bank som dömts enligt penningtvättsreglerna – räkna med strikt KYC.", "FSCS protection and clear terms, but the first UK bank convicted under the money-laundering regulations – expect strict KYC.")
      },
      flags: ["aml-fine", "public-scrutiny", "payment-account"], tags: ["storbank", "uk", "aml", "fscs", "rbs", "faster-payments"], order: 50
    },
    {
      id: "uk-santander", name: "Santander UK", category: "storbank", country: "UK", website: "https://www.santander.co.uk",
      summarySv: "Brittiska dotterbanken till spanska Banco Santander, huvudkontor i London. Köpte TSB (klart 30 april 2026) och blev då tredje största bank i Storbritannien räknat på privatkunders lönekontosaldon.",
      summaryEn: "UK subsidiary of Spain's Banco Santander, headquartered in London. Bought TSB (completed 30 April 2026) and became the UK's third-largest bank by personal current account balances.",
      ownershipSv: "Santander UK plc ägs av Santander UK Group Holdings, i sin tur ägt av Banco Santander S.A. (Spanien). TSB förblir egen bank med egen licens tills den planerade överföringen till Santander UK (första halvåret 2027).",
      ownershipEn: "Santander UK plc is owned by Santander UK Group Holdings, in turn owned by Banco Santander S.A. (Spain). TSB remains a separate bank with its own licence until the planned transfer into Santander UK (first half of 2027).",
      processSv: "OSINT 2026: FCA bötfällde Santander UK 107,8 mn £ (dec 2022) för upprepade brister i penningtvättskontrollerna i företagsbanken. " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Santander UK £107.8m (Dec 2022) for repeated anti-money-laundering failures in business banking. " + FP_EN,
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; Edge-konton med månadsavgift och cashback. FX dyrare än fintech.", "Standard account without a monthly fee; Edge accounts with a monthly fee and cashback. FX costlier than fintech."),
        withdrawals: c(3, "Faster Payments i vardag. Stora eller ovanliga belopp kan stoppas för kontroll.", "Faster Payments day-to-day. Large or unusual amounts may be held for checks."),
        rules: c(3, "FSCS-skydd. Efter TSB-köpet har Santander UK och TSB separata licenser fram till överföringen – FSCS-taket räknas per licens.", "FSCS protection. After the TSB deal Santander UK and TSB have separate licences until the transfer – the FSCS limit counts per licence.")
      },
      flags: ["aml-fine", "public-scrutiny", "consumer-credit"], tags: ["storbank", "uk", "spanien", "tsb", "fscs", "aml"], order: 60
    },
    {
      id: "uk-tsb", name: "TSB", category: "storbank", country: "UK", website: "https://www.tsb.co.uk",
      summarySv: "Brittisk privatkundsbank med rötter i sparbanksrörelsen (1810), huvudkontor i Edinburgh. Ägs av Santander UK sedan 30 april 2026.",
      summaryEn: "UK retail bank with roots in the savings-bank movement (1810), headquartered in Edinburgh. Owned by Santander UK since 30 April 2026.",
      ownershipSv: "Helägt av Santander UK plc (köpt från spanska Sabadell för 2,65 md £). Egen bank och licens tills planerad överföring till Santander UK första halvåret 2027.",
      ownershipEn: "Wholly owned by Santander UK plc (bought from Spain's Sabadell for £2.65bn). Separate bank and licence until the planned transfer into Santander UK in the first half of 2027.",
      processSv: "OSINT 2026: FCA och PRA bötfällde TSB 48,65 mn £ (dec 2022) för den misslyckade IT-migreringen 2018, då många kunder inte kom åt sina konton. " + FP_SV,
      processEn: "OSINT 2026: the FCA and PRA fined TSB £48.65m (Dec 2022) for the failed 2018 IT migration, when many customers could not access their accounts. " + FP_EN,
      compare: {
        premiums: c(3, "Standardkonto utan månadsavgift; belöningskonton med villkor.", "Standard account without a monthly fee; reward accounts with conditions."),
        withdrawals: c(3, "Faster Payments och kontor. Inför den planerade överföringen till Santander UK: håll koll på information från banken.", "Faster Payments and branches. Ahead of the planned transfer to Santander UK: watch for notices from the bank."),
        rules: c(3, "FSCS-skydd med egen licens fram till överföringen. Driftstörningen 2018 är bakgrund till regulatorernas krav på operativ motståndskraft.", "FSCS protection with its own licence until the transfer. The 2018 outage is background to regulators' operational-resilience demands.")
      },
      flags: ["public-scrutiny", "payment-account"], tags: ["storbank", "uk", "santander", "it-migrering", "fscs"], order: 70
    },
    {
      id: "uk-standard-chartered", name: "Standard Chartered", category: "storbank", country: "UK", website: "https://www.sc.com",
      summarySv: "Internationell bank med huvudkontor i London (bildad 1969 genom sammanslagning av Standard Bank och Chartered Bank). Verksamheten ligger främst i Asien, Afrika och Mellanöstern – ingen vanlig privatkundsbank i Storbritannien.",
      summaryEn: "International bank headquartered in London (formed in 1969 by merging Standard Bank and Chartered Bank). Operations mainly in Asia, Africa and the Middle East – not a regular UK retail bank.",
      ownershipSv: "Börsnoterat Standard Chartered PLC (London och Hongkong). Temasek (Singapore) har länge varit en av de största ägarna.",
      ownershipEn: "Listed Standard Chartered PLC (London and Hong Kong). Temasek (Singapore) has long been one of the largest holders.",
      processSv: "OSINT 2026: FCA bötfällde Standard Chartered 102,2 mn £ (april 2019) för brister i penningtvättskontrollerna (Förenade Arabemiraten och korrespondentbank i Storbritannien).",
      processEn: "OSINT 2026: the FCA fined Standard Chartered £102.2m (April 2019) for anti-money-laundering failings (UAE branches and UK correspondent banking).",
      compare: {
        premiums: c(2, "Inriktad på företag, institutioner och förmögna kunder utanför Storbritannien. Inget brett utbud av gratiskonton för brittiska privatkunder.", "Focused on corporates, institutions and wealthy clients outside the UK. No broad free-account offer for UK retail customers."),
        withdrawals: c(2, "Inte en vardagsbank i Storbritannien – betalningstjänsterna är främst för företag och internationella flöden.", "Not a UK day-to-day bank – payment services are mainly for corporates and international flows."),
        rules: c(2, "Omfattande regelverk på flera marknader; historik av stora böter i Storbritannien och USA för penningtvätts- och sanktionsbrister.", "Extensive rules across many markets; history of large UK and US fines for AML and sanctions failings.")
      },
      flags: ["aml-fine", "public-scrutiny"], tags: ["storbank", "uk", "internationell", "asien", "aml"], order: 80
    },
    {
      id: "uk-nationwide", name: "Nationwide Building Society", category: "sparbank", country: "UK", website: "https://www.nationwide.co.uk",
      summarySv: "Världens största byggnadsförening (building society), medlemsägd, huvudkontor i Swindon. Erbjuder lönekonton, sparande och bolån. Köpte Virgin Money (klart 1 okt 2024).",
      summaryEn: "The world's largest building society, member-owned, headquartered in Swindon. Offers current accounts, savings and mortgages. Bought Virgin Money (completed 1 Oct 2024).",
      ownershipSv: "Ömsesidigt ägd av sina medlemmar – inte börsnoterad. Virgin Money ägs av Nationwide; verksamheten fördes över juridiskt till Nationwide 2 april 2026.",
      ownershipEn: "Mutually owned by its members – not listed. Virgin Money is owned by Nationwide; its business was legally transferred to Nationwide on 2 April 2026.",
      processSv: "OSINT 2026: FCA bötfällde Nationwide 44 mn £ (dec 2025) för brister i kontrollerna mot ekonomisk brottslighet 2016–2021, bl.a. privatkonton som användes för företagsverksamhet. " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Nationwide £44m (Dec 2025) for financial-crime control failings 2016–2021, incl. personal accounts used for business activity. " + FP_EN,
      compare: {
        premiums: c(4, "Standardkonto utan månadsavgift; medlemsägd modell med medlemsförmåner. Avgiftsbaserade konton finns också.", "Standard account without a monthly fee; mutual model with member benefits. Fee-based accounts also exist."),
        withdrawals: c(3, "Stort kontorsnät, Faster Payments i vardag. Privatkonton för företagsverksamhet bryter mot villkoren och kan stoppas.", "Large branch network, Faster Payments day-to-day. Using personal accounts for business breaches the terms and may be stopped."),
        rules: c(3, "FSCS-skydd. Efter Virgin Money-överföringen: kontrollera om dina konton nu räknas under samma licens för FSCS-taket.", "FSCS protection. After the Virgin Money transfer: check whether your accounts now count under the same licence for the FSCS limit.")
      },
      flags: ["aml-fine", "payment-account", "alt-liquidity"], tags: ["sparbank", "uk", "building-society", "medlemsagd", "virgin-money", "fscs"], order: 90
    },
    {
      id: "uk-virgin-money", name: "Virgin Money", category: "nisch", country: "UK", website: "https://uk.virginmoney.com",
      summarySv: "Brittiskt bankvarumärke (lönekonton, kreditkort, sparande, bolån), sedan 1 okt 2024 en del av Nationwide.",
      summaryEn: "UK banking brand (current accounts, credit cards, savings, mortgages), part of Nationwide since 1 Oct 2024.",
      ownershipSv: "Ägs av Nationwide Building Society. Juridisk överföring av verksamheten till Nationwide klar 2 april 2026; varumärket används vidare.",
      ownershipEn: "Owned by Nationwide Building Society. Legal transfer of the business to Nationwide completed 2 April 2026; the brand continues.",
      processSv: "OSINT 2026: kunderna har fått information om överföringen till Nationwide. " + FP_SV,
      processEn: "OSINT 2026: customers have been informed about the transfer to Nationwide. " + FP_EN,
      compare: {
        premiums: c(3, "Konton utan månadsavgift finns; kreditkort och lån med vanliga avgifter och räntor.", "Accounts without a monthly fee exist; credit cards and loans with usual fees and rates."),
        withdrawals: c(3, "Faster Payments i vardag. Under integrationen kan kontouppgifter och appar ändras – följ bankens besked.", "Faster Payments day-to-day. During integration account details and apps may change – follow the bank's notices."),
        rules: c(3, "FSCS-skydd. Kontrollera hur FSCS-taket räknas tillsammans med Nationwide efter överföringen.", "FSCS protection. Check how the FSCS limit counts together with Nationwide after the transfer.")
      },
      flags: ["consumer-credit", "payment-account"], tags: ["nisch", "uk", "nationwide", "kreditkort", "fscs"], order: 100
    },
    {
      id: "uk-coventry", name: "Coventry Building Society", category: "sparbank", country: "UK", website: "https://www.coventrybuildingsociety.co.uk",
      summarySv: "Medlemsägd byggnadsförening med huvudkontor i Coventry, inriktad på sparande och bolån. Äger Co-operative Bank sedan 1 jan 2025.",
      summaryEn: "Member-owned building society headquartered in Coventry, focused on savings and mortgages. Owns the Co-operative Bank since 1 Jan 2025.",
      ownershipSv: "Ömsesidigt ägd av sina medlemmar – inte börsnoterad.",
      ownershipEn: "Mutually owned by its members – not listed.",
      processSv: "OSINT 2026: tyngdpunkt på sparkonton och bolån snarare än vardagskonton. " + FSCS_SV,
      processEn: "OSINT 2026: focus on savings accounts and mortgages rather than day-to-day accounts. " + FSCS_EN,
      compare: {
        premiums: c(4, "Sparkonton utan kontoavgift; villkor (uttagsbegränsningar, bindningstid) styr räntan.", "Savings accounts without account fees; conditions (withdrawal limits, fixed terms) drive the rate."),
        withdrawals: c(3, "Uttag från sparkonton kan vara begränsade eller kräva uppsägningstid beroende på konto.", "Withdrawals from savings accounts may be limited or require notice depending on the account."),
        rules: c(4, "Tydliga produktvillkor och FSCS-skydd. Medlemsägd modell.", "Clear product terms and FSCS protection. Mutual model.")
      },
      flags: ["alt-liquidity"], tags: ["sparbank", "uk", "building-society", "medlemsagd", "spar", "co-op-bank"], order: 110
    },
    {
      id: "uk-yorkshire", name: "Yorkshire Building Society", category: "sparbank", country: "UK", website: "https://www.ybs.co.uk",
      summarySv: "En av Storbritanniens största byggnadsföreningar, medlemsägd, huvudkontor i Bradford. Inriktad på sparande och bolån; varumärken även Chelsea och Norwich & Peterborough.",
      summaryEn: "One of the UK's largest building societies, member-owned, headquartered in Bradford. Focused on savings and mortgages; brands also include Chelsea and Norwich & Peterborough.",
      ownershipSv: "Ömsesidigt ägd av sina medlemmar – inte börsnoterad. Varumärkena delar licens – FSCS-taket gäller sammanlagt.",
      ownershipEn: "Mutually owned by its members – not listed. The brands share a licence – the FSCS limit applies in total.",
      processSv: "OSINT 2026: sparande och bolån snarare än vardagsbank. " + FSCS_SV,
      processEn: "OSINT 2026: savings and mortgages rather than day-to-day banking. " + FSCS_EN,
      compare: {
        premiums: c(4, "Sparkonton utan kontoavgift; räntan beror på uttagsvillkor och bindning.", "Savings accounts without account fees; the rate depends on withdrawal terms and fixing."),
        withdrawals: c(3, "Uttag kan vara begränsade per år eller kräva uppsägning beroende på konto.", "Withdrawals may be limited per year or need notice depending on the account."),
        rules: c(4, "Tydliga villkor och FSCS-skydd. Medlemsägd modell.", "Clear terms and FSCS protection. Mutual model.")
      },
      flags: ["alt-liquidity"], tags: ["sparbank", "uk", "building-society", "medlemsagd", "spar"], order: 120
    },
    {
      id: "uk-skipton", name: "Skipton Building Society", category: "sparbank", country: "UK", website: "https://www.skipton.co.uk",
      summarySv: "Medlemsägd byggnadsförening grundad 1853 med huvudkontor i Skipton, North Yorkshire. Inriktad på sparande och bolån.",
      summaryEn: "Member-owned building society founded in 1853, headquartered in Skipton, North Yorkshire. Focused on savings and mortgages.",
      ownershipSv: "Ömsesidigt ägd av sina medlemmar – inte börsnoterad. Koncernen äger även fastighetsmäklarkedjan Connells.",
      ownershipEn: "Mutually owned by its members – not listed. The group also owns the estate-agency chain Connells.",
      processSv: "OSINT 2026: sparande och bolån snarare än vardagsbank. " + FSCS_SV,
      processEn: "OSINT 2026: savings and mortgages rather than day-to-day banking. " + FSCS_EN,
      compare: {
        premiums: c(4, "Sparkonton utan kontoavgift; räntan beror på villkor.", "Savings accounts without account fees; the rate depends on terms."),
        withdrawals: c(3, "Uttagsvillkor varierar per konto (fria uttag, begränsade eller med uppsägning).", "Withdrawal terms vary per account (free, limited or with notice)."),
        rules: c(4, "Tydliga villkor och FSCS-skydd. Medlemsägd modell.", "Clear terms and FSCS protection. Mutual model.")
      },
      flags: ["alt-liquidity"], tags: ["sparbank", "uk", "building-society", "medlemsagd", "spar"], order: 130
    },
    {
      id: "uk-coop-bank", name: "The Co-operative Bank", category: "nisch", country: "UK", website: "https://www.co-operativebank.co.uk",
      summarySv: "Brittisk bank med huvudkontor i Manchester och etisk policy som profil. Ägs av Coventry Building Society sedan 1 jan 2025.",
      summaryEn: "UK bank headquartered in Manchester, known for its ethical policy. Owned by Coventry Building Society since 1 Jan 2025.",
      ownershipSv: "Helägt dotterbolag till Coventry Building Society (medlemsägd).",
      ownershipEn: "Wholly owned subsidiary of Coventry Building Society (member-owned).",
      processSv: "OSINT 2026: banken behåller eget varumärke inom Coventry-koncernen. " + FP_SV,
      processEn: "OSINT 2026: the bank keeps its own brand within the Coventry group. " + FP_EN,
      compare: {
        premiums: c(3, "Lönekonton med och utan månadsavgift; etisk policy styr vilka kunder och sektorer banken finansierar.", "Current accounts with and without a monthly fee; an ethical policy governs which customers and sectors the bank finances."),
        withdrawals: c(3, "Faster Payments i vardag; mindre kontorsnät än storbankerna.", "Faster Payments day-to-day; smaller branch network than the majors."),
        rules: c(3, "FSCS-skydd. Kapitalkrisen 2013 ledde till omstrukturering och nya ägare.", "FSCS protection. The 2013 capital crisis led to restructuring and new owners.")
      },
      flags: ["payment-account", "public-scrutiny"], tags: ["nisch", "uk", "etisk", "coventry", "fscs"], order: 140
    },
    {
      id: "uk-metro", name: "Metro Bank", category: "nisch", country: "UK", website: "https://www.metrobankonline.co.uk",
      summarySv: "Brittisk bank som öppnade 2010 i London – den första nya high street-banken på över hundra år – med kontor öppna sju dagar i veckan.",
      summaryEn: "UK bank that opened in London in 2010 – the first new high-street bank in over a century – with branches open seven days a week.",
      ownershipSv: "Metro Bank Holdings PLC. Sedan kapitalanskaffningen 2023 äger ett privat investeringsbolag majoriteten av aktierna.",
      ownershipEn: "Metro Bank Holdings PLC. Since the 2023 capital raise a private investment company has held the majority of the shares.",
      processSv: "OSINT 2026: FCA bötfällde Metro Bank 16,7 mn £ (nov 2024) för att transaktionsövervakningen missade över 60 miljoner transaktioner värda över 51 md £ 2016–2020. " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Metro Bank £16.7m (Nov 2024) because transaction monitoring missed over 60 million transactions worth over £51bn in 2016–2020. " + FP_EN,
      compare: {
        premiums: c(3, "Lönekonto utan månadsavgift; personlig service i kontor. Utlandsbetalningar kostar.", "Current account without a monthly fee; in-branch service. Cross-border payments cost."),
        withdrawals: c(3, "Kontor öppna även helger; Faster Payments i vardag. Stora belopp kan granskas.", "Branches open at weekends; Faster Payments day-to-day. Large amounts may be reviewed."),
        rules: c(2, "FSCS-skydd, men FCA-böter för övervakningsbrister och kapitalproblem 2023 – följ bankens rapporter.", "FSCS protection, but an FCA fine for monitoring failings and capital issues in 2023 – follow the bank's reports.")
      },
      flags: ["aml-fine", "public-scrutiny", "payment-account"], tags: ["nisch", "uk", "aml", "kontor", "fscs"], order: 150
    },
    {
      id: "uk-coutts", name: "Coutts", category: "nisch", country: "UK", website: "https://www.coutts.com",
      summarySv: "Privatbank grundad 1692 i London, inriktad på förmögna kunder. Del av NatWest Group.",
      summaryEn: "Private bank founded in 1692 in London, serving wealthy clients. Part of NatWest Group.",
      ownershipSv: "Coutts & Co ägs av NatWest Group plc (börsnoterat, helt privatägt sedan maj 2025).",
      ownershipEn: "Coutts & Co is owned by NatWest Group plc (listed, fully privately owned since May 2025).",
      processSv: "OSINT 2026: dåvarande FSA bötfällde Coutts 8,75 mn £ (mars 2012) för brister i penningtvättskontrollerna kring högriskkunder. Bankens kontostängningar granskades offentligt 2023.",
      processEn: "OSINT 2026: the then FSA fined Coutts £8.75m (March 2012) for anti-money-laundering failings with high-risk clients. The bank's account closures were publicly scrutinised in 2023.",
      compare: {
        premiums: c(1, "Höga krav på tillgångar eller inkomst för att bli kund; avgifter för förvaltning och tjänster.", "High asset or income requirements to become a client; fees for management and services."),
        withdrawals: c(3, "Personlig rådgivare och betalningar via Faster Payments/CHAPS. Stora belopp hanteras manuellt.", "Personal banker and payments via Faster Payments/CHAPS. Large amounts handled manually."),
        rules: c(2, "FSCS-skydd – kontrollera på FSCS hur licensen räknas inom NatWest Group. Banken väljer kunder snävt och kan avsluta relationer.", "FSCS protection – check on the FSCS how the licence counts within NatWest Group. The bank selects clients narrowly and can end relationships.")
      },
      flags: ["aml-fine", "public-scrutiny", "high-fee-risk"], tags: ["nisch", "uk", "private-banking", "natwest", "aml"], order: 160
    },
    {
      id: "uk-tesco-bank", name: "Tesco Bank", category: "nisch", country: "UK", website: "https://www.tescobank.com",
      summarySv: "Bankvarumärke kopplat till matkedjan Tesco, huvudkontor i Edinburgh. Kreditkort, lån och sparande drivs sedan 1 nov 2024 av Barclays.",
      summaryEn: "Banking brand linked to the Tesco supermarket chain, headquartered in Edinburgh. Credit cards, loans and savings have been run by Barclays since 1 Nov 2024.",
      ownershipSv: "Barclays köpte Tescos bankverksamhet (kreditkort, privatlån, insättningar) med klart 1 nov 2024, med ett tioårigt samarbete om varumärket. Tesco behåller bl.a. försäkring och valutaväxling under Tesco Bank-namnet.",
      ownershipEn: "Barclays bought Tesco's banking business (credit cards, personal loans, deposits), completed 1 Nov 2024, with a ten-year brand partnership. Tesco keeps e.g. insurance and travel money under the Tesco Bank name.",
      processSv: "OSINT 2026: kunder överförs till Barclays genom en överföringsordning – läs bankens information. Clubcard-förmåner kopplade till korten.",
      processEn: "OSINT 2026: customers are moved to Barclays via a transfer scheme – read the bank's information. Clubcard benefits linked to the cards.",
      compare: {
        premiums: c(4, "Kreditkort och sparande utan kontoavgift; Clubcard-poäng som förmån.", "Credit cards and savings without account fees; Clubcard points as a benefit."),
        withdrawals: c(3, "Inget lönekonto; sparkonton med överföring till eget konto. Uttagsvillkor per konto.", "No current account; savings with transfers to your own account. Withdrawal terms per account."),
        rules: c(3, "FSCS-skydd. Efter överföringen kan konton räknas under Barclays licens – kontrollera FSCS-taket.", "FSCS protection. After the transfer accounts may count under Barclays' licence – check the FSCS limit.")
      },
      flags: ["consumer-credit", "alt-liquidity"], tags: ["nisch", "uk", "tesco", "barclays", "kreditkort", "andra-bank"], order: 170
    },
    {
      id: "uk-close-brothers", name: "Close Brothers", category: "nisch", country: "UK", website: "https://www.closebrothers.com",
      summarySv: "Bank- och finansgrupp grundad 1878, huvudkontor i London. Utlåning till företag och bilfinansiering samt sparkonton.",
      summaryEn: "Banking and finance group founded in 1878, headquartered in London. Lending to businesses and motor finance, plus savings accounts.",
      ownershipSv: "Börsnoterat Close Brothers Group plc (London).",
      ownershipEn: "Listed Close Brothers Group plc (London).",
      processSv: "OSINT 2026: berörs av FCA:s ersättningsprogram för bilfinansiering (infört 30 mars 2026; delar har pausats efter rättsliga invändningar). Bolaget har uppskattat kostnaden till cirka 320 mn £. " + FSCS_SV,
      processEn: "OSINT 2026: affected by the FCA motor-finance redress scheme (introduced 30 March 2026; parts paused after legal challenges). The company has estimated the cost at about £320m. " + FSCS_EN,
      compare: {
        premiums: c(4, "Sparkonton utan kontoavgift (ofta med uppsägningstid eller bindning).", "Savings accounts without account fees (often notice or fixed-term)."),
        withdrawals: c(3, "Sparkonton med uppsägningstid – pengarna är inte omedelbart tillgängliga.", "Notice savings accounts – money is not instantly available."),
        rules: c(3, "FSCS-skydd. Bilfinansieringsärendet ger större regulatorisk osäkerhet.", "FSCS protection. The motor-finance issue adds regulatory uncertainty.")
      },
      flags: ["public-scrutiny", "consumer-credit", "alt-liquidity"], tags: ["nisch", "uk", "bilfinans", "spar", "fscs"], order: 180
    },
    {
      id: "uk-osb", name: "OSB Group (Kent Reliance, Charter Savings Bank)", category: "nisch", country: "UK", website: "https://www.osb.co.uk",
      summarySv: "Specialiserad bolåne- och sparbank med huvudkontor i Chatham, Kent. Sparande via varumärkena Kent Reliance och Charter Savings Bank.",
      summaryEn: "Specialist mortgage and savings bank headquartered in Chatham, Kent. Savings via the Kent Reliance and Charter Savings Bank brands.",
      ownershipSv: "Börsnoterat OSB GROUP PLC (London). OneSavings Bank (Kent Reliance) och Charter Court Financial Services (Charter Savings Bank) har separata licenser.",
      ownershipEn: "Listed OSB GROUP PLC (London). OneSavings Bank (Kent Reliance) and Charter Court Financial Services (Charter Savings Bank) have separate licences.",
      processSv: "OSINT 2026: inriktad på hyresfastighetslån och specialbolån; sparkonton finansierar utlåningen. " + FSCS_SV,
      processEn: "OSINT 2026: focused on buy-to-let and specialist mortgages; savings accounts fund the lending. " + FSCS_EN,
      compare: {
        premiums: c(4, "Sparkonton utan kontoavgift; konkurrenskraftiga villkor är affärsmodellen.", "Savings accounts without account fees; competitive terms are the business model."),
        withdrawals: c(3, "Många konton med bindning eller uppsägningstid; uttag till eget nominerat konto.", "Many fixed-term or notice accounts; withdrawals to your own nominated account."),
        rules: c(3, "FSCS-skydd per licens (Kent Reliance respektive Charter Savings Bank).", "FSCS protection per licence (Kent Reliance and Charter Savings Bank respectively).")
      },
      flags: ["alt-liquidity"], tags: ["nisch", "uk", "spar", "bolan", "fscs"], order: 190
    },
    {
      id: "uk-shawbrook", name: "Shawbrook", category: "nisch", country: "UK", website: "https://www.shawbrook.co.uk",
      summarySv: "Specialiserad brittisk bank för utlåning till småföretag, fastigheter och privatpersoner, finansierad med sparkonton.",
      summaryEn: "Specialist UK bank lending to SMEs, property and consumers, funded with savings accounts.",
      ownershipSv: "Börsnoterat Shawbrook Group plc – noterades på Londonbörsen hösten 2025 (kortnamn SHAW).",
      ownershipEn: "Listed Shawbrook Group plc – listed on the London Stock Exchange in autumn 2025 (ticker SHAW).",
      processSv: "OSINT 2026: sparkonton finansierar utlåningen. " + FSCS_SV,
      processEn: "OSINT 2026: savings accounts fund the lending. " + FSCS_EN,
      compare: {
        premiums: c(4, "Sparkonton utan kontoavgift.", "Savings accounts without account fees."),
        withdrawals: c(3, "Bindning eller uppsägningstid på många konton; uttag till nominerat konto.", "Fixed term or notice on many accounts; withdrawals to a nominated account."),
        rules: c(3, "FSCS-skydd. Tydliga produktvillkor.", "FSCS protection. Clear product terms.")
      },
      flags: ["alt-liquidity", "consumer-credit"], tags: ["nisch", "uk", "spar", "smaforetag", "fscs"], order: 200
    },
    {
      id: "uk-monzo", name: "Monzo", category: "neobank", country: "UK", website: "https://monzo.com",
      summarySv: "Brittisk appbank grundad 2015 i London. Lönekonto, sparande och lån i appen, utan kontor.",
      summaryEn: "UK app bank founded in 2015 in London. Current account, savings and loans in the app, no branches.",
      ownershipSv: "Monzo Bank Ltd – privat, riskkapitalfinansierat bolag (inte börsnoterat).",
      ownershipEn: "Monzo Bank Ltd – private, venture-backed company (not listed).",
      processSv: "OSINT 2026: FCA bötfällde Monzo 21 mn £ (juli 2025) för svaga kontroller mot ekonomisk brottslighet 2018–2020 och för att ha öppnat konton för över 34 000 högriskkunder trots ett förbud. " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Monzo £21m (July 2025) for weak financial-crime controls 2018–2020 and for opening accounts for over 34,000 high-risk customers despite a restriction. " + FP_EN,
      compare: {
        premiums: c(5, "Grundkonto utan månadsavgift och 0 % valutapåslag på kortköp utomlands; betalabonnemang med extra funktioner.", "Basic account without a monthly fee and 0% FX mark-up on card spending abroad; paid plans with extras."),
        withdrawals: c(3, "Faster Payments i appen. Kontantinsättning via ombud mot avgift. Konton kan frysas under granskning.", "Faster Payments in the app. Cash deposits via agents for a fee. Accounts may be frozen during reviews."),
        rules: c(3, "Full bank med FSCS-skydd. FCA-böterna 2025 visar historisk svaghet i onboarding och övervakning.", "Full bank with FSCS protection. The 2025 FCA fine shows historical weakness in onboarding and monitoring.")
      },
      flags: ["aml-fine", "public-scrutiny", "alt-liquidity"], tags: ["neobank", "uk", "app", "aml", "fscs"], order: 210
    },
    {
      id: "uk-starling", name: "Starling Bank", category: "neobank", country: "UK", website: "https://www.starlingbank.com",
      summarySv: "Brittisk appbank grundad 2014 i London. Lönekonto och företagskonto i appen, utan kontor.",
      summaryEn: "UK app bank founded in 2014 in London. Personal and business accounts in the app, no branches.",
      ownershipSv: "Starling Bank Ltd – privat bolag (inte börsnoterat).",
      ownershipEn: "Starling Bank Ltd – private company (not listed).",
      processSv: "OSINT 2026: FCA bötfällde Starling 29 mn £ (okt 2024) för brister i sanktionsscreening och för att ha öppnat över 54 000 konton för högriskkunder trots en begränsning. " + FP_SV,
      processEn: "OSINT 2026: the FCA fined Starling £29m (Oct 2024) for sanctions-screening failings and for opening over 54,000 accounts for high-risk customers despite a restriction. " + FP_EN,
      compare: {
        premiums: c(5, "Lönekonto utan månadsavgift; inga avgifter på kortköp utomlands.", "Current account without a monthly fee; no fees on card spending abroad."),
        withdrawals: c(3, "Faster Payments i appen; kontant via Post Office. Konton kan frysas under granskning.", "Faster Payments in the app; cash via the Post Office. Accounts may be frozen during reviews."),
        rules: c(3, "Full bank med FSCS-skydd. FCA-böterna 2024 gällde sanktionsscreening och tillväxt utan tillräckliga kontroller.", "Full bank with FSCS protection. The 2024 FCA fine concerned sanctions screening and growth without adequate controls.")
      },
      flags: ["aml-fine", "public-scrutiny", "alt-liquidity"], tags: ["neobank", "uk", "app", "aml", "fscs"], order: 220
    },
    {
      id: "uk-chase", name: "Chase UK", category: "neobank", country: "UK", website: "https://www.chase.co.uk",
      summarySv: "Digital bank från amerikanska JPMorgan Chase, lanserad i Storbritannien i september 2021. Endast app, utan kontor.",
      summaryEn: "Digital bank from US JPMorgan Chase, launched in the UK in September 2021. App only, no branches.",
      ownershipSv: "Drivs av J.P. Morgan Europe Limited, helägt av JPMorgan Chase & Co. (börsnoterat i New York).",
      ownershipEn: "Operated by J.P. Morgan Europe Limited, wholly owned by JPMorgan Chase & Co. (listed in New York).",
      processSv: "OSINT 2026: appbaserad onboarding; avgiftsfritt lönekonto var lanseringserbjudandet. " + FP_SV,
      processEn: "OSINT 2026: app-based onboarding; a fee-free current account was the launch offer. " + FP_EN,
      compare: {
        premiums: c(5, "Lönekonto utan månadsavgift och 0 % valutapåslag på kortköp utomlands; sparkonton och belöningar med villkor.", "Current account without a monthly fee and 0% FX mark-up on card spending abroad; savings and rewards with conditions."),
        withdrawals: c(3, "Faster Payments i appen. Ingen kontantinsättning via egna kontor.", "Faster Payments in the app. No cash deposits via own branches."),
        rules: c(4, "FSCS-skydd. Del av en av världens största bankkoncerner.", "FSCS protection. Part of one of the world's largest banking groups.")
      },
      flags: ["alt-liquidity", "payment-account"], tags: ["neobank", "uk", "app", "jpmorgan", "fscs"], order: 230
    },
    {
      id: "uk-revolut", name: "Revolut (UK)", category: "neobank", country: "UK", website: "https://www.revolut.com/en-GB/",
      summarySv: "Finansapp med huvudkontor i London. Revolut Bank UK Ltd fick full brittisk banklicens 11 mars 2026 efter mobiliseringsfasen (licens med begränsningar sedan juli 2024).",
      summaryEn: "Finance app headquartered in London. Revolut Bank UK Ltd received a full UK banking licence on 11 March 2026 after the mobilisation phase (restricted licence since July 2024).",
      ownershipSv: "Revolut Ltd – privat bolag (inte börsnoterat). Brittiska kunder flyttas stegvis från e-penningkonto (safeguarding) till bankkonto med FSCS-skydd.",
      ownershipEn: "Revolut Ltd – private company (not listed). UK customers are moved in stages from e-money accounts (safeguarding) to bank accounts with FSCS protection.",
      processSv: "OSINT 2026: Bank of Lithuania bötfällde EU-banken Revolut Bank UAB 3,5 mn € (april 2025) för brister i penningtvättskontrollerna. Kontrollera i appen vilken enhet ditt konto ligger i (Revolut Bank UK Ltd eller Revolut Ltd). " + FP_SV,
      processEn: "OSINT 2026: the Bank of Lithuania fined the EU bank Revolut Bank UAB €3.5m (April 2025) for anti-money-laundering failings. Check in the app which entity your account sits in (Revolut Bank UK Ltd or Revolut Ltd). " + FP_EN,
      compare: {
        premiums: c(4, "Grundplan utan månadsavgift; betalplaner med mer FX och förmåner. Valutaväxling billig inom planens gränser.", "Basic plan without a monthly fee; paid plans with more FX and perks. FX cheap within plan limits."),
        withdrawals: c(3, "Faster Payments i appen. Konton kan frysas under granskning; stora belopp kräver ofta underlag.", "Faster Payments in the app. Accounts may be frozen during reviews; large amounts often need documentation."),
        rules: c(3, "Full bank sedan mars 2026, men migreringen pågår – FSCS gäller först när kontot ligger i Revolut Bank UK Ltd.", "Full bank since March 2026, but migration is ongoing – FSCS applies only once the account is in Revolut Bank UK Ltd.")
      },
      flags: ["public-scrutiny", "alt-liquidity", "fx-focus"], tags: ["neobank", "uk", "app", "fx", "fscs", "licens"], order: 240
    },
    {
      id: "uk-wise", name: "Wise", category: "fintech", country: "UK", website: "https://wise.com/gb/",
      summarySv: "Fintech för flervaluta och internationella överföringar, grundad 2011 i London (inte en bank). Stark på FX – inte ersättning för vardagsbank.",
      summaryEn: "Fintech for multi-currency and international transfers, founded in 2011 in London (not a bank). Strong on FX – not a substitute for day-to-day banking.",
      ownershipSv: "Wise Group plc. Primärnotering flyttad till Nasdaq (11 maj 2026, kortnamn WSE) med kvarvarande sekundärnotering i London. I Storbritannien är Wise ett e-penninginstitut: kundmedel skyddas genom safeguarding, inte FSCS.",
      ownershipEn: "Wise Group plc. Primary listing moved to Nasdaq (11 May 2026, ticker WSE) with a secondary listing kept in London. In the UK Wise is an e-money institution: customer funds are protected by safeguarding, not the FSCS.",
      processSv: "OSINT 2026: kärna = mittkurs + synlig avgift. Gränser och KYC skärps med volym; kontostopp vid riskflaggor förekommer. Använd som rörlighetsverktyg – parkera inte hela bufferten.",
      processEn: "OSINT 2026: core = mid-market rate + visible fee. Limits and KYC tighten with volume; freezes on risk flags occur. Use as a mobility tool – do not park the whole buffer.",
      compare: {
        premiums: c(5, "Mittkurs och synlig avgift – ofta billigare än storbankens dolda valutapåslag.", "Mid-market rate and visible fee – often cheaper than a major bank's hidden FX mark-up."),
        withdrawals: c(4, "Överföringar är kärnprodukten; brittiska överföringar via Faster Payments. Stora belopp kräver verifiering.", "Transfers are the core product; UK transfers via Faster Payments. Large amounts need verification."),
        rules: c(4, "Tydliga avgiftsregler. Safeguarding är inte samma sak som FSCS-skyddat bankkonto.", "Clear fee rules. Safeguarding is not the same as an FSCS-protected bank account.")
      },
      flags: ["fx-focus", "alt-liquidity", "soft-block"], tags: ["fintech", "uk", "fx", "safeguarding", "uttag"], order: 250
    }
  ];

  function en(id, bankId, kind, date, titleSv, titleEn, bodySv, bodyEn, url, label) {
    return { id: id, bankId: bankId, kind: kind, date: date, titleSv: titleSv, titleEn: titleEn, bodySv: bodySv, bodyEn: bodyEn, sourceUrl: url, sourceLabel: label };
  }

  var ENTRIES = [
    en("uk-entry-method", "uk-hsbc", "compare", "2026-10-17", "Så läser du betygsskalan (1–5)", "How to read the score scale (1–5)",
      "Samma skala som den svenska bankkartan: 5 = mer kundvänligt i praktiken (lägre avgifter/friktion, tydligare regler, enklare uttag). 1 = mer friktion eller kostnad. Betygen är pedagogiska bedömningar utifrån länkade offentliga källor – inte FCA- eller PRA-betyg.",
      "Same scale as the Swedish bank map: 5 = more customer-friendly in practice (lower fees/friction, clearer rules, easier withdrawals). 1 = more friction or cost. Scores are educational assessments based on the linked public sources – not FCA or PRA ratings.", null, null),
    en("uk-entry-fscs", "uk-hsbc", "source", "2025-12-01", "FSCS: insättningsskydd 120 000 £ från 1 dec 2025", "FSCS: deposit protection £120,000 from 1 Dec 2025",
      "FSCS skyddar insättningar hos brittiska banker, byggnadsföreningar och kreditföreningar upp till 120 000 £ per person och licens (tidigare 85 000 £). Varumärken med samma licens räknas som en bank. Gäller alla banker i den brittiska bankkartan utom Wise (safeguarding).",
      "The FSCS protects deposits at UK banks, building societies and credit unions up to £120,000 per person per licence (previously £85,000). Brands sharing a licence count as one bank. Applies to every bank in the UK bank map except Wise (safeguarding).",
      "https://www.fscs.org.uk/what-we-cover/banks-building-societies-credit-unions/deposit-limit/", "FSCS"),
    en("uk-entry-hsbc-pra", "uk-hsbc", "source", "2024-01-30", "PRA: böter 57,4 mn £ för brister i insättningsskyddet", "PRA: £57.4m fine for deposit-protection failings",
      "PRA bötfällde HSBC Bank plc och HSBC UK Bank plc 57 417 500 £ för historiska brister i att identifiera insättningar som omfattas av FSCS och i att informera kunder.",
      "The PRA fined HSBC Bank plc and HSBC UK Bank plc £57,417,500 for historical failures in identifying FSCS-eligible deposits and notifying customers.",
      "https://www.bankofengland.co.uk/news/2024/january/pra-fines-hsbc-for-failures-in-deposit-protection-identification-and-notifcation", "Bank of England / PRA"),
    en("uk-entry-barclays-fca", "uk-barclays", "source", "2025-07-16", "FCA: böter 42 mn £ för penningtvättsrisker", "FCA: £42m fine for money-laundering risk failings",
      "FCA bötfällde Barclays Bank UK PLC och Barclays Bank PLC sammanlagt 42 mn £ för två separata fall av bristande hantering av risker för ekonomisk brottslighet.",
      "The FCA fined Barclays Bank UK PLC and Barclays Bank PLC a total of £42m for two separate cases of poor handling of financial-crime risk.",
      "https://www.fca.org.uk/news/press-releases/fca-fines-barclays-42-million-poor-handling-financial-crime-risks", "FCA"),
    en("uk-entry-barclays-tesco", "uk-barclays", "news", "2024-11-01", "Barclays tar över Tesco Banks bankverksamhet", "Barclays takes over Tesco Bank's banking business",
      "Barclays slutförde köpet av Tescos bankverksamhet (kreditkort, privatlån och insättningar) 1 nov 2024 och inledde ett tioårigt samarbete under Tesco Bank-varumärket.",
      "Barclays completed the purchase of Tesco's banking business (credit cards, personal loans and deposits) on 1 Nov 2024 and began a ten-year partnership under the Tesco Bank brand.",
      "https://home.barclays/news/press-releases/2024/11/completion-of-the-acquisition-of-tesco-s-retail-banking-business/", "Barclays"),
    en("uk-entry-lloyds-libor", "uk-lloyds", "source", "2014-07-28", "FCA: böter 105 mn £ för LIBOR- och repo-manipulation", "FCA: £105m fine for LIBOR and repo-rate manipulation",
      "FCA bötfällde Lloyds Bank och Bank of Scotland sammanlagt 105 mn £ för manipulation av repo-räntan i Bank of Englands Special Liquidity Scheme och av LIBOR.",
      "The FCA fined Lloyds Bank and Bank of Scotland a total of £105m for manipulating the repo rate in the Bank of England's Special Liquidity Scheme and LIBOR.",
      "https://www.fca.org.uk/news/press-releases/lloyds-banking-group-fined-%C2%A3105m-serious-libor-and-other-benchmark-failings", "FCA"),
    en("uk-entry-lloyds-brands", "uk-halifax", "source", "2026-10-17", "Lloyds Banking Group: varumärken", "Lloyds Banking Group: brands",
      "Koncernens varumärkessida listar bl.a. Lloyds, Halifax, Bank of Scotland och Scottish Widows. Kontrollera på FSCS hur licenserna delas innan du sprider buffert.",
      "The group's brand page lists e.g. Lloyds, Halifax, Bank of Scotland and Scottish Widows. Check on the FSCS how licences are shared before splitting a buffer.",
      "https://www.lloydsbankinggroup.com/who-we-are/our-brands.html", "Lloyds Banking Group"),
    en("uk-entry-natwest-aml", "uk-natwest", "source", "2021-12-13", "Dom: böter 264,8 mn £ för brott mot penningtvättsreglerna", "Court: £264.8m fine for money-laundering regulation offences",
      "NatWest dömdes efter FCA:s åtal till böter på 264,8 mn £ för att inte ha följt penningtvättsreglerna i förhållande till en företagskund inom guldhandel.",
      "Following an FCA prosecution, NatWest was fined £264.8m for failing to comply with the money-laundering regulations in relation to a gold-trading business customer.",
      "https://www.fca.org.uk/news/press-releases/natwest-fined-264.8million-anti-money-laundering-failures", "FCA"),
    en("uk-entry-natwest-private", "uk-natwest", "news", "2025-05-30", "NatWest helt privatägt igen", "NatWest fully privately owned again",
      "Staten sålde sina sista aktier i NatWest Group 30 maj 2025, nästan 17 år efter krisräddningen 2008.",
      "The state sold its last shares in NatWest Group on 30 May 2025, almost 17 years after the 2008 rescue.",
      "https://www.natwestgroup.com/news-and-insights/latest-stories/our-updates/2025/may/natwest-group-returns-to-full-private-ownership.html", "NatWest Group"),
    en("uk-entry-santander-aml", "uk-santander", "source", "2022-12-09", "FCA: böter 107,8 mn £ för penningtvättsbrister", "FCA: £107.8m fine for AML failings",
      "FCA bötfällde Santander UK 107 793 300 £ för upprepade brister i penningtvättskontrollerna i företagsbanken 2012–2017.",
      "The FCA fined Santander UK £107,793,300 for repeated anti-money-laundering failings in business banking 2012–2017.",
      "https://www.fca.org.uk/news/press-releases/fca-fines-santander-uk-repeated-anti-money-laundering-failures", "FCA"),
    en("uk-entry-santander-tsb", "uk-santander", "news", "2026-05-01", "Santander UK slutför köpet av TSB", "Santander UK completes the TSB acquisition",
      "Köpet slutfördes 30 april 2026 efter godkännande från PRA och ECB. Inga omedelbara förändringar för kunderna; TSB förblir egen bank tills överföringen som planeras till första halvåret 2027.",
      "The deal completed on 30 April 2026 after PRA and ECB approval. No immediate change for customers; TSB remains a separate bank until the transfer planned for the first half of 2027.",
      "https://www.santander.co.uk/about-santander/media-centre/press-releases/santander-uk-completes-cash-acquisition-of-tsb-banking", "Santander UK"),
    en("uk-entry-tsb-it", "uk-tsb", "source", "2022-12-20", "FCA/PRA: böter 48,65 mn £ för IT-migreringen 2018", "FCA/PRA: £48.65m fine for the 2018 IT migration",
      "FCA och PRA bötfällde TSB sammanlagt 48,65 mn £ för brister i operativ motståndskraft vid IT-migreringen i april 2018.",
      "The FCA and PRA fined TSB a total of £48.65m for operational-resilience failings in the April 2018 IT migration.",
      "https://www.fca.org.uk/news/press-releases/tsb-fined-48m-operational-resilience-failings", "FCA"),
    en("uk-entry-tsb-santander", "uk-tsb", "news", "2026-05-01", "Nu en del av Santander UK", "Now part of Santander UK",
      "Santander UK slutförde köpet av TSB 30 april 2026. TSB förblir egen bank tills den planerade överföringen till Santander UK.",
      "Santander UK completed the purchase of TSB on 30 April 2026. TSB remains a separate bank until the planned transfer into Santander UK.",
      "https://www.santander.co.uk/about-santander/media-centre/press-releases/santander-uk-completes-cash-acquisition-of-tsb-banking", "Santander UK"),
    en("uk-entry-sc-aml", "uk-standard-chartered", "source", "2019-04-09", "FCA: böter 102,2 mn £ för penningtvättsbrister", "FCA: £102.2m fine for AML failings",
      "FCA bötfällde Standard Chartered Bank 102 163 200 £ för brister i kundkännedom och övervakning (Förenade Arabemiraten 2009–2014, korrespondentbank i Storbritannien 2010–2013).",
      "The FCA fined Standard Chartered Bank £102,163,200 for customer due diligence and monitoring failings (UAE 2009–2014, UK correspondent banking 2010–2013).",
      "https://www.fca.org.uk/news/press-releases/fca-fines-standard-chartered-bank-102-2-million-poor-aml-controls", "FCA"),
    en("uk-entry-nationwide-fca", "uk-nationwide", "source", "2025-12-12", "FCA: böter 44 mn £ för brister mot ekonomisk brottslighet", "FCA: £44m fine for financial-crime control failings",
      "FCA bötfällde Nationwide 44 078 500 £ för otillräckliga system och kontroller mot ekonomisk brottslighet oktober 2016–juli 2021.",
      "The FCA fined Nationwide £44,078,500 for inadequate anti-financial-crime systems and controls October 2016–July 2021.",
      "https://www.fca.org.uk/news/press-releases/fca-fines-nationwide-44m-failings-financial-crime-controls", "FCA"),
    en("uk-entry-virgin-transfer", "uk-virgin-money", "news", "2026-04-02", "Virgin Money överförd till Nationwide", "Virgin Money transferred to Nationwide",
      "Nationwide köpte Virgin Money 1 okt 2024; den juridiska överföringen av verksamheten till Nationwide slutfördes 2 april 2026.",
      "Nationwide bought Virgin Money on 1 Oct 2024; the legal transfer of the business to Nationwide completed on 2 April 2026.",
      "https://www.nationwide.co.uk/nationwide-and-virgin-money-transfer", "Nationwide"),
    en("uk-entry-coop-coventry", "uk-coop-bank", "news", "2025-01-02", "Coventry Building Society köper Co-operative Bank", "Coventry Building Society buys the Co-operative Bank",
      "Köpet slutfördes 1 jan 2025; Co-operative Bank blev ett helägt dotterbolag till Coventry Building Society.",
      "The deal completed on 1 Jan 2025; the Co-operative Bank became a wholly owned subsidiary of Coventry Building Society.",
      "https://www.co-operativebank.co.uk/about-us/press-release/2025/coventry-building-society-completes-acquisition-of-the-co-operative-bank/", "The Co-operative Bank"),
    en("uk-entry-coventry-coop", "uk-coventry", "news", "2025-01-02", "Äger Co-operative Bank sedan 2025", "Owns the Co-operative Bank since 2025",
      "Coventry Building Society slutförde köpet av Co-operative Bank 1 jan 2025.",
      "Coventry Building Society completed the purchase of the Co-operative Bank on 1 Jan 2025.",
      "https://www.co-operativebank.co.uk/about-us/press-release/2025/coventry-building-society-completes-acquisition-of-the-co-operative-bank/", "The Co-operative Bank"),
    en("uk-entry-metro-fca", "uk-metro", "source", "2024-11-12", "FCA: böter 16,7 mn £ för transaktionsövervakning", "FCA: £16.7m fine for transaction monitoring",
      "FCA bötfällde Metro Bank 16,7 mn £ eftersom över 60 miljoner transaktioner värda över 51 md £ inte övervakades korrekt 2016–2020.",
      "The FCA fined Metro Bank £16.7m because over 60 million transactions worth over £51bn were not properly monitored in 2016–2020.",
      "https://www.fca.org.uk/news/press-releases/fca-fines-metro-bank-16m-financial-crime-failings", "FCA"),
    en("uk-entry-coutts-fsa", "uk-coutts", "source", "2012-03-26", "FSA: böter 8,75 mn £ för penningtvättskontroller", "FSA: £8.75m fine for AML controls",
      "Dåvarande Financial Services Authority bötfällde Coutts & Co 8,75 mn £ för brister i penningtvättskontrollerna kring högriskkunder.",
      "The then Financial Services Authority fined Coutts & Co £8.75m for anti-money-laundering failings with high-risk clients.",
      "https://www.fca.org.uk/publication/final-notices/coutts-mar12.pdf", "FCA (Final Notice)"),
    en("uk-entry-tesco-barclays", "uk-tesco-bank", "news", "2024-11-01", "Bankverksamheten såld till Barclays", "Banking business sold to Barclays",
      "Barclays slutförde köpet av Tescos bankverksamhet 1 nov 2024; produkterna marknadsförs vidare under Tesco Bank-namnet i ett tioårigt samarbete.",
      "Barclays completed the purchase of Tesco's banking business on 1 Nov 2024; products continue to be marketed under the Tesco Bank name in a ten-year partnership.",
      "https://home.barclays/news/press-releases/2024/11/completion-of-the-acquisition-of-tesco-s-retail-banking-business/", "Barclays"),
    en("uk-entry-close-motor", "uk-close-brothers", "source", "2026-03-30", "FCA:s ersättningsprogram för bilfinansiering", "FCA motor-finance redress scheme",
      "FCA:s policy PS26/3 inför ett ersättningsprogram för bilfinansiering. Close Brothers är en av de långivare som berörs.",
      "The FCA policy PS26/3 introduces a motor-finance redress scheme. Close Brothers is one of the lenders affected.",
      "https://www.fca.org.uk/publications/policy-statements/ps26-3-motor-finance-consumer-redress-scheme", "FCA"),
    en("uk-entry-shawbrook-ipo", "uk-shawbrook", "news", "2025-11-04", "Noterad på Londonbörsen", "Listed on the London Stock Exchange",
      "Shawbrook Group plc togs upp till handel på Londonbörsens huvudlista efter börsintroduktionen hösten 2025.",
      "Shawbrook Group plc was admitted to trading on the London Stock Exchange main market after its IPO in autumn 2025.",
      "https://www.lse.co.uk/rns/admission-to-trading-on-the-london-stock-exchange-q7ypmgb4v27sfs3.html", "LSE RNS"),
    en("uk-entry-monzo-fca", "uk-monzo", "source", "2025-07-08", "FCA: böter 21 mn £ för brister mot ekonomisk brottslighet", "FCA: £21m fine for financial-crime control failings",
      "FCA bötfällde Monzo 21 091 300 £ för otillräckliga kontroller 2018–2020 och för att upprepade gånger ha brutit mot ett krav att inte öppna konton för högriskkunder.",
      "The FCA fined Monzo £21,091,300 for inadequate controls 2018–2020 and for repeatedly breaching a requirement not to open accounts for high-risk customers.",
      "https://www.fca.org.uk/news/press-releases/fca-fines-monzo-21m-failings-financial-crime-controls", "FCA"),
    en("uk-entry-starling-fca", "uk-starling", "source", "2024-10-02", "FCA: böter 29 mn £ för sanktionsscreening", "FCA: £29m fine for sanctions screening",
      "FCA bötfällde Starling Bank 28,96 mn £ för brister i system och kontroller mot ekonomisk brottslighet, bl.a. sanktionsscreening.",
      "The FCA fined Starling Bank £28.96m for failings in financial-crime systems and controls, incl. sanctions screening.",
      "https://www.fca.org.uk/news/press-releases/fca-fines-starling-bank-failings-financial-crime-systems-and-controls", "FCA"),
    en("uk-entry-chase-launch", "uk-chase", "news", "2021-09-21", "Chase lanseras i Storbritannien", "Chase launches in the UK",
      "JPMorgan Chase lanserade sin digitala bank i Storbritannien i september 2021.",
      "JPMorgan Chase launched its digital bank in the UK in September 2021.",
      "https://www.chase.co.uk/gb/en/media/chase-arrives-in-the-uk/", "Chase UK"),
    en("uk-entry-revolut-licence", "uk-revolut", "news", "2026-03-11", "Full brittisk banklicens", "Full UK banking licence",
      "PRA lät Revolut Bank UK Ltd lämna mobiliseringsfasen och starta som fullt licensierad bank. Befintliga kunder flyttas stegvis till bankkonton med FSCS-skydd.",
      "The PRA allowed Revolut Bank UK Ltd to exit the mobilisation phase and launch as a fully licensed bank. Existing customers are moved in stages to FSCS-protected bank accounts.",
      "https://www.revolut.com/blog/post/is-revolut-a-fully-licensed-bank-in-the-uk/", "Revolut"),
    en("uk-entry-revolut-lt", "uk-revolut", "source", "2025-04-08", "Litauen: böter 3,5 mn € (EU-banken)", "Lithuania: €3.5m fine (EU bank)",
      "Bank of Lithuania bötfällde Revolut Bank UAB 3,5 mn € för brister i penningtvättskontrollerna. Gäller EU-banken, inte den brittiska enheten.",
      "The Bank of Lithuania fined Revolut Bank UAB €3.5m for anti-money-laundering failings. Concerns the EU bank, not the UK entity.",
      "https://www.reuters.com/technology/lithuania-fines-revolut-35-million-euros-money-laundering-prevention-failures-2025-04-08/", "Reuters"),
    en("uk-entry-wise-nasdaq", "uk-wise", "news", "2026-05-11", "Primärnotering flyttad till Nasdaq", "Primary listing moved to Nasdaq",
      "Wise flyttade sin primärnotering från Londonbörsen till Nasdaq 11 maj 2026 och behåller en sekundärnotering i London.",
      "Wise moved its primary listing from the London Stock Exchange to Nasdaq on 11 May 2026 and keeps a secondary listing in London.",
      "https://www.nasdaq.com/press-release/wise-debuts-us-listing-nasdaq-2026-05-11", "Nasdaq")
  ];

  var CATEGORIES = {
    storbank: { sv: "Storbank", en: "Major bank" },
    nisch: { sv: "Nischbank", en: "Niche bank" },
    neobank: { sv: "Neobank / app", en: "Neobank / app" },
    sparbank: { sv: "Sparbank / building society", en: "Savings bank / building society" },
    "broker-bank": { sv: "Mäklare / bank", en: "Broker / bank" },
    utland: { sv: "Utland / EU", en: "Foreign / EU" },
    fintech: { sv: "Fintech / betal", en: "Fintech / payments" }
  };

  var FLAGS = {
    "aml-fine": { sv: "AML-sanktioner (offentligt)", en: "AML sanctions (public)", tone: "warn" },
    "account-freeze": { sv: "Kontostopp rapporterat", en: "Account freezes reported", tone: "warn" },
    "soft-block": { sv: "Mjuk blockad / friktion", en: "Soft block / friction", tone: "warn" },
    "payment-account": { sv: "Betalkonto", en: "Payment account", tone: "info" },
    "high-fee-risk": { sv: "Avgiftsrisk", en: "Fee risk", tone: "info" },
    "alt-liquidity": { sv: "Alternativ likviditet", en: "Alt. liquidity", tone: "ok" },
    "public-scrutiny": { sv: "Offentlig granskning", en: "Public scrutiny", tone: "warn" },
    "fx-focus": { sv: "FX / valutaväxling", en: "FX focus", tone: "info" },
    "consumer-credit": { sv: "Konsumentkredit", en: "Consumer credit", tone: "info" }
  };

  var KINDS = {
    news: { sv: "Nyhet", en: "News" },
    testimony: { sv: "Vittnesmål", en: "Testimony" },
    process: { sv: "Process / OSINT", en: "Process / OSINT" },
    source: { sv: "Källa", en: "Source" },
    compare: { sv: "Jämförelse", en: "Compare" }
  };

  var PILLARS = {
    premiums: { sv: "Premier & avgifter", en: "Fees & premiums" },
    withdrawals: { sv: "Uttag", en: "Withdrawals" },
    rules: { sv: "Regler", en: "Rules" }
  };

  var STR = {
    eyebrow: { sv: "Jämförelse · Storbritannien", en: "Comparison · United Kingdom" },
    title: { sv: "Brittiska banker – premier, uttag och regler", en: "UK banks – fees, withdrawals and rules" },
    lead: {
      sv: "Bankkartan för den brittiska marknaden, i samma format som den svenska: HSBC, Barclays, Lloyds, Halifax/Bank of Scotland, NatWest, Santander UK, TSB, Standard Chartered, Nationwide, Virgin Money, byggnadsföreningarna Coventry, Yorkshire och Skipton, Co-operative Bank, Metro Bank, Coutts, Tesco Bank, Close Brothers, OSB, Shawbrook, Monzo, Starling, Chase UK, Revolut och Wise. Tillsyn: Bank of England (PRA) och FCA. Insättningsgaranti: FSCS.",
      en: "The bank map for the UK market, in the same format as the Swedish one: HSBC, Barclays, Lloyds, Halifax/Bank of Scotland, NatWest, Santander UK, TSB, Standard Chartered, Nationwide, Virgin Money, the Coventry, Yorkshire and Skipton building societies, the Co-operative Bank, Metro Bank, Coutts, Tesco Bank, Close Brothers, OSB, Shawbrook, Monzo, Starling, Chase UK, Revolut and Wise. Supervision: Bank of England (PRA) and the FCA. Deposit guarantee: the FSCS."
    },
    updated: { sv: "Senast uppdaterad", en: "Last updated" },
    disclaimer: {
      sv: "Pedagogisk jämförelse (betyg 1–5) – inte FCA- eller PRA-betyg, inte investeringsråd och inte juridisk bedömning av enskilda ärenden. Böter, ägarförändringar och skyddsnivåer är hämtade från länkade offentliga källor. Villkor, gränser och avgifter ändras. Kontrollera alltid primärkälla.",
      en: "Educational comparison (scores 1–5) – not an FCA or PRA rating, not investment advice and not a legal assessment of individual cases. Fines, ownership changes and protection levels come from the linked public sources. Terms, limits and fees change. Always check primary sources."
    },
    scoreLegendTitle: { sv: "Betyg 1–5 (kundvänlighet i praktiken)", en: "Scores 1–5 (customer-friendliness in practice)" },
    scoreLegend: {
      sv: "5 = lägre friktion / tydligare / mer förutsägbart. 1 = mer kostnad eller friktion. Tre pelare: premier & avgifter · uttag · regler.",
      en: "5 = lower friction / clearer / more predictable. 1 = more cost or friction. Three pillars: fees & premiums · withdrawals · rules."
    },
    view: { sv: "Vy", en: "View" },
    viewCompare: { sv: "Jämför", en: "Compare" },
    viewDetail: { sv: "Detalj", en: "Detail" },
    search: { sv: "Sök bank", en: "Search bank" },
    searchPh: { sv: "Sök namn, uttag, avgift, process…", en: "Search name, withdrawal, fee, process…" },
    category: { sv: "Kategori", en: "Category" },
    allCategories: { sv: "Alla kategorier", en: "All categories" },
    sort: { sv: "Sortera", en: "Sort" },
    sortAvg: { sv: "Snittbetyg", en: "Average score" },
    sortName: { sv: "Namn", en: "Name" },
    colBank: { sv: "Bank", en: "Bank" },
    colAvg: { sv: "Snitt", en: "Avg" },
    empty: { sv: "Inga banker matchar filtret.", en: "No banks match the filter." },
    tableHint: { sv: "Klicka på banknamn för detalj, ägarstruktur, OSINT och poster.", en: "Click a bank name for detail, ownership, OSINT and entries." },
    website: { sv: "Webbplats", en: "Website" },
    ownership: { sv: "Ägarstruktur", en: "Ownership" },
    process: { sv: "Process / OSINT", en: "Process / OSINT" },
    entries: { sv: "Nyheter, vittnesmål & källor", en: "News, testimonies & sources" },
    filterKind: { sv: "Filtrera typ", en: "Filter type" },
    allKinds: { sv: "Alla typer", en: "All types" },
    noEntries: { sv: "Inga poster ännu för den här banken.", en: "No entries yet for this bank." }
  };

  var state = { view: "compare", search: "", category: "all", sort: "avg", kind: "all", selected: null };
  var host = null;
  var placing = false;
  var results = null;
  var sortLabel = null;
  var toggleButtons = {};

  function isEnglish() {
    var value = (document.documentElement.lang || "sv").toLowerCase();
    return value.indexOf("en") === 0 || value.indexOf("uk") === 0 || value === "ua";
  }

  function t(isEn, key) {
    var row = STR[key];
    if (!row) return key;
    return isEn ? row.en : row.sv;
  }

  function lbl(map, key, isEn) {
    var row = map[key];
    if (!row) return key;
    return isEn ? row.en : row.sv;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function avg(compare) {
    return (compare.premiums.score + compare.withdrawals.score + compare.rules.score) / 3;
  }

  function scoreWord(value, isEn) {
    var n = Math.round(value);
    if (isEn) return n >= 5 ? "Strong" : n >= 4 ? "Good" : n >= 3 ? "Mixed" : n >= 2 ? "Weak" : "Poor";
    return n >= 5 ? "Stark" : n >= 4 ? "Bra" : n >= 3 ? "Blandad" : n >= 2 ? "Svag" : "Låg";
  }

  function ordered() {
    return BANKS.slice().sort(function (a, b) {
      return a.order - b.order || a.name.localeCompare(b.name, "sv");
    });
  }

  function filtered() {
    var q = state.search.trim().toLowerCase();
    var list = ordered().filter(function (b) {
      if (state.category !== "all" && b.category !== state.category) return false;
      if (!q) return true;
      return [b.name, b.summarySv, b.summaryEn, b.processSv, b.processEn, b.ownershipSv, b.ownershipEn,
        b.compare.premiums.noteSv, b.compare.withdrawals.noteSv, b.compare.rules.noteSv]
        .concat(b.tags, b.flags).join(" ").toLowerCase().indexOf(q) !== -1;
    });
    var key = state.sort;
    list.sort(function (a, b) {
      if (key === "name") return a.name.localeCompare(b.name, "sv");
      if (key === "premiums" || key === "withdrawals" || key === "rules") return b.compare[key].score - a.compare[key].score;
      return avg(b.compare) - avg(a.compare);
    });
    return list;
  }

  function current(list) {
    var all = ordered();
    for (var i = 0; i < all.length; i++) if (all[i].id === state.selected) return all[i];
    return list[0] || all[0] || null;
  }

  function scoreCell(pillar, isEn) {
    var cell = el("div", "bank-map-score-cell");
    cell.append(el("span", "bank-map-score bank-map-score--" + pillar.score, String(pillar.score)));
    var note = isEn ? pillar.noteEn : pillar.noteSv;
    var span = el("span", "bank-map-score-note muted", note.slice(0, 72) + (note.length > 72 ? "…" : ""));
    span.title = note;
    cell.append(span);
    return cell;
  }

  function pillarCard(title, pillar, isEn) {
    var card = el("div", "bank-map-pillar-card");
    var top = el("div", "bank-map-pillar-top");
    top.append(el("strong", null, title));
    top.append(el("span", "bank-map-score bank-map-score--" + pillar.score, pillar.score + "/5"));
    card.append(top);
    card.append(el("p", "muted", isEn ? pillar.noteEn : pillar.noteSv));
    return card;
  }

  function miniScores(compare) {
    var span = el("span", "bank-map-mini-scores");
    [["P", "premiums"], ["U", "withdrawals"], ["R", "rules"]].forEach(function (p) {
      var s = el("span", null, String(compare[p[1]].score));
      s.title = p[0];
      span.append(s);
    });
    return span;
  }

  function renderCompare(list, isEn) {
    var wrap = el("div", "bank-map-table-wrap");
    var table = el("table", "bank-map-table");
    var thead = el("thead");
    var hr = el("tr");
    [t(isEn, "colBank"), lbl(PILLARS, "premiums", isEn), lbl(PILLARS, "withdrawals", isEn), lbl(PILLARS, "rules", isEn), t(isEn, "colAvg")]
      .forEach(function (label) {
        var th = el("th", null, label);
        th.scope = "col";
        hr.append(th);
      });
    thead.append(hr);
    table.append(thead);
    var tbody = el("tbody");
    list.forEach(function (b) {
      var a = avg(b.compare);
      var tr = el("tr");
      var th = el("th");
      th.scope = "row";
      var btn = el("button", "bank-map-table-name", b.name);
      btn.type = "button";
      btn.addEventListener("click", function () {
        state.selected = b.id;
        setView("detail");
      });
      th.append(btn, el("span", "muted bank-map-table-cat", lbl(CATEGORIES, b.category, isEn)));
      tr.append(th);
      ["premiums", "withdrawals", "rules"].forEach(function (k) {
        var td = el("td");
        td.append(scoreCell(b.compare[k], isEn));
        tr.append(td);
      });
      var tdAvg = el("td");
      tdAvg.append(el("span", "bank-map-score bank-map-score--" + Math.round(a), a.toFixed(1)));
      tdAvg.append(el("span", "muted bank-map-score-word", scoreWord(a, isEn)));
      tr.append(tdAvg);
      tbody.append(tr);
    });
    table.append(tbody);
    wrap.append(table);
    if (!list.length) wrap.append(el("p", "muted bank-map-empty", t(isEn, "empty")));
    wrap.append(el("p", "muted bank-map-table-hint", t(isEn, "tableHint")));
    return wrap;
  }

  function renderDetail(list, isEn) {
    var layout = el("div", "bank-map-layout");
    var sel = current(list);
    var ul = el("ul", "bank-map-list");
    ul.setAttribute("role", "listbox");
    ul.setAttribute("aria-label", t(isEn, "title"));
    list.forEach(function (b) {
      var active = sel && sel.id === b.id;
      var li = el("li");
      var btn = el("button", "bank-map-item" + (active ? " is-active" : ""));
      btn.type = "button";
      btn.setAttribute("role", "option");
      btn.setAttribute("aria-selected", active ? "true" : "false");
      btn.addEventListener("click", function () {
        state.selected = b.id;
        paint();
      });
      btn.append(el("span", "bank-map-item-name", b.name));
      btn.append(el("span", "bank-map-item-meta muted", lbl(CATEGORIES, b.category, isEn) + " · " + avg(b.compare).toFixed(1) + "/5"));
      var flags = el("span", "bank-map-item-flags");
      flags.append(miniScores(b.compare));
      btn.append(flags);
      li.append(btn);
      ul.append(li);
    });
    if (!list.length) ul.append(el("li", "muted bank-map-empty", t(isEn, "empty")));
    layout.append(ul);
    if (!sel) return layout;

    var art = el("article", "bank-map-detail card");
    art.setAttribute("aria-live", "polite");
    var head = el("header", "bank-map-detail-head");
    var hd = el("div");
    hd.append(el("h4", null, sel.name));
    hd.append(el("p", "muted", lbl(CATEGORIES, sel.category, isEn) + " · " + sel.country + " · " + t(isEn, "colAvg") + " " + avg(sel.compare).toFixed(1) + "/5"));
    head.append(hd);
    if (sel.website) {
      var a = el("a", "btn sm", t(isEn, "website") + " ↗");
      a.href = sel.website;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      head.append(a);
    }
    art.append(head);
    art.append(el("p", "bank-map-summary", isEn ? sel.summaryEn : sel.summarySv));
    var flagsDiv = el("div", "bank-map-flags");
    sel.flags.forEach(function (f) {
      var meta = FLAGS[f];
      if (meta) flagsDiv.append(el("span", "bank-map-flag bank-map-flag--" + meta.tone, isEn ? meta.en : meta.sv));
    });
    art.append(flagsDiv);
    var pillars = el("div", "bank-map-pillars");
    ["premiums", "withdrawals", "rules"].forEach(function (k) {
      pillars.append(pillarCard(lbl(PILLARS, k, isEn), sel.compare[k], isEn));
    });
    art.append(pillars);
    art.append(el("h5", "bank-map-subh", t(isEn, "ownership")));
    art.append(el("p", "muted bank-map-process", isEn ? sel.ownershipEn : sel.ownershipSv));
    art.append(el("h5", "bank-map-subh", t(isEn, "process")));
    art.append(el("p", "muted bank-map-process", isEn ? sel.processEn : sel.processSv));

    var eh = el("div", "bank-map-entries-head");
    eh.append(el("h5", "bank-map-subh", t(isEn, "entries")));
    var kindSel = el("select");
    kindSel.setAttribute("aria-label", t(isEn, "filterKind"));
    var optAll = el("option", null, t(isEn, "allKinds"));
    optAll.value = "all";
    kindSel.append(optAll);
    Object.keys(KINDS).forEach(function (k) {
      var o = el("option", null, lbl(KINDS, k, isEn));
      o.value = k;
      kindSel.append(o);
    });
    kindSel.value = state.kind;
    kindSel.addEventListener("change", function () {
      state.kind = kindSel.value;
      paint();
    });
    eh.append(kindSel);
    art.append(eh);

    var entries = ENTRIES.filter(function (e) {
      return e.bankId === sel.id && (state.kind === "all" || e.kind === state.kind);
    }).sort(function (x, y) {
      return x.date < y.date ? 1 : x.date > y.date ? -1 : 0;
    });
    if (!entries.length) {
      art.append(el("p", "muted", t(isEn, "noEntries")));
    } else {
      var list2 = el("ul", "bank-map-entries");
      entries.forEach(function (e) {
        var li = el("li", "bank-map-entry");
        var meta = el("div", "bank-map-entry-meta");
        meta.append(el("span", "bank-map-kind bank-map-kind--" + e.kind, lbl(KINDS, e.kind, isEn)));
        var time = el("time", "mono muted", e.date);
        time.dateTime = e.date;
        meta.append(time);
        li.append(meta);
        li.append(el("strong", null, isEn ? e.titleEn : e.titleSv));
        li.append(el("p", "muted", isEn ? e.bodyEn : e.bodySv));
        if (e.sourceUrl) {
          var p = el("p", "bank-map-source");
          var link = el("a", null, (e.sourceLabel || e.sourceUrl) + " ↗");
          link.href = e.sourceUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          p.append(link);
          li.append(p);
        }
        list2.append(li);
      });
      art.append(list2);
    }
    layout.append(art);
    return layout;
  }

  function setView(view) {
    state.view = view;
    paint();
  }

  function paint() {
    if (!host || !results) return;
    var isEn = host.dataset.lang === "en";
    Object.keys(toggleButtons).forEach(function (k) {
      toggleButtons[k].className = "btn sm" + (state.view === k ? " primary" : "");
    });
    if (sortLabel) sortLabel.hidden = state.view !== "compare";
    var list = filtered();
    results.replaceChildren(state.view === "compare" ? renderCompare(list, isEn) : renderDetail(list, isEn));
  }

  function render(isEn) {
    host.dataset.lang = isEn ? "en" : "sv";
    host.lang = isEn ? "en" : "sv";
    host.replaceChildren();

    var header = el("header", "bank-map-head");
    var hdiv = el("div");
    hdiv.append(el("p", "eyebrow", t(isEn, "eyebrow")));
    var h3 = el("h3", null, t(isEn, "title"));
    h3.id = "bank-map-uk-title";
    hdiv.append(h3);
    hdiv.append(el("p", "muted bank-map-lead", t(isEn, "lead")));
    header.append(hdiv);
    header.append(el("p", "muted bank-map-meta mono", t(isEn, "updated") + ": " + UPDATED));
    host.append(header);

    host.append(el("p", "bank-map-uk-disclaimer muted", t(isEn, "disclaimer")));
    var legend = el("div", "bank-map-score-legend");
    legend.setAttribute("role", "note");
    legend.append(el("strong", null, t(isEn, "scoreLegendTitle")));
    legend.append(el("span", "muted", t(isEn, "scoreLegend")));
    host.append(legend);

    var toolbar = el("div", "bank-map-toolbar");
    var toggle = el("div", "bank-map-view-toggle");
    toggle.setAttribute("role", "group");
    toggle.setAttribute("aria-label", t(isEn, "view"));
    toggleButtons = {};
    [["compare", "viewCompare"], ["detail", "viewDetail"]].forEach(function (v) {
      var b = el("button", "btn sm", t(isEn, v[1]));
      b.type = "button";
      b.addEventListener("click", function () {
        setView(v[0]);
      });
      toggleButtons[v[0]] = b;
      toggle.append(b);
    });
    toolbar.append(toggle);

    var searchLabel = el("label", "bank-map-search");
    searchLabel.append(el("span", "sr-only", t(isEn, "search")));
    var input = el("input");
    input.type = "search";
    input.value = state.search;
    input.placeholder = t(isEn, "searchPh");
    input.autocomplete = "off";
    input.addEventListener("input", function () {
      state.search = input.value;
      paint();
    });
    searchLabel.append(input);
    toolbar.append(searchLabel);

    var catLabel = el("label", "bank-map-filter");
    catLabel.append(el("span", "muted", t(isEn, "category")));
    var catSel = el("select");
    var allOpt = el("option", null, t(isEn, "allCategories"));
    allOpt.value = "all";
    catSel.append(allOpt);
    var seen = {};
    ordered().forEach(function (b) {
      if (seen[b.category]) return;
      seen[b.category] = true;
      var o = el("option", null, lbl(CATEGORIES, b.category, isEn));
      o.value = b.category;
      catSel.append(o);
    });
    catSel.value = state.category;
    catSel.addEventListener("change", function () {
      state.category = catSel.value;
      paint();
    });
    catLabel.append(catSel);
    toolbar.append(catLabel);

    sortLabel = el("label", "bank-map-filter");
    sortLabel.append(el("span", "muted", t(isEn, "sort")));
    var sortSel = el("select");
    [["avg", t(isEn, "sortAvg")], ["premiums", lbl(PILLARS, "premiums", isEn)], ["withdrawals", lbl(PILLARS, "withdrawals", isEn)],
      ["rules", lbl(PILLARS, "rules", isEn)], ["name", t(isEn, "sortName")]].forEach(function (o) {
      var opt = el("option", null, o[1]);
      opt.value = o[0];
      sortSel.append(opt);
    });
    sortSel.value = state.sort;
    sortSel.addEventListener("change", function () {
      state.sort = sortSel.value;
      paint();
    });
    sortLabel.append(sortSel);
    toolbar.append(sortLabel);
    host.append(toolbar);

    results = el("div", "bank-map-uk-results");
    host.append(results);
    paint();
  }

  function ensure() {
    if (placing) return;
    placing = true;
    try {
      var swedish = document.querySelector("section.bank-map:not(#" + HOST_ID + ")");
      if (!swedish || !swedish.isConnected) {
        if (host && host.isConnected) host.remove();
        return;
      }
      if (!host) {
        host = document.createElement("section");
        host.id = HOST_ID;
        host.className = "bank-map bank-map--uk";
        host.setAttribute("aria-labelledby", "bank-map-uk-title");
      }
      if (swedish.nextElementSibling !== host) swedish.after(host);
      var isEn = isEnglish();
      if (host.dataset.lang !== (isEn ? "en" : "sv") || host.childElementCount === 0) render(isEn);
    } finally {
      placing = false;
    }
  }

  var observer = new MutationObserver(function () {
    ensure();
  });

  function start() {
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["lang"],
      childList: true,
      subtree: true
    });
    ensure();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
