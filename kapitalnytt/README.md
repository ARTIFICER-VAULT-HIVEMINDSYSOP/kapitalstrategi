# Kapitalnytt och Urbergsskölden

Två egna sektioner, med varsitt namn och sidhuvud. De länkar inte till varandra, inte till nyhetsbrevet och inte till någon kundlista. Svenska är språk om inget annat står i `sprak`.

Motorn ligger i `kapitalnytt/` (`engine.mjs`, `build.mjs`, `check.mjs`, `kapitalnytt.test.mjs`) och läser båda mapparna. Utseende ligger som `modul.css` och `modul.js` i varje mapp.

## Tre pelare i Kapitalnytt

1. Kapitalallokering och balans: strategier, spridning, ombalansering och tidshorisont. Det som är värt att veta när kapital ska fördelas för en bättre balans.
2. Marknadsinformation och analys som visar urval och analys, med handel och tillväxt i fokus. Tillväxt skrivs i samma mening som risk.
3. Texter som väcker intresse för utbildningar, tjänster och de licenser arbetet gäller.

Kategorier: `kapitalallokering`, `tillvaxtstrategier`, `balans-och-riskspridning`, `marknadslage`, `marknadsanalys`, `begrepp-skola`.

## Urbergsskölden

Routen är `/urbergsskolden/`. Ämnet är den fennoskandiska urbergsskölden. Urberget är den långa grunden för historia och fornminnen, för jakt, natur och råvarornas kretslopp, och för energi och resurshushållning. Sektionen kan också ta upp nyheter om historia och om värden bortom enbart fysiska tillgångar. Fakta om berget källhänvisas, till exempel till SGU.

Kategorier: `historia-och-fornminnen`, `jakt-och-natur`, `ravaror-och-kretslopp`, `energi-och-resurshushallning`, `historienyheter`.

## Frontmatter

Varje inlägg är `inlagg/*.md` med ett litet huvud mellan `---`.

| Fält | Betydelse |
| --- | --- |
| `titel` | Rubrik |
| `datum` | Dag, `YYYY-MM-DD` |
| `publiceras` | `YYYY-MM-DDTHH:MM` i Europe/Stockholm, utan tidszonsetikett |
| `status` | `utkast` eller `godkand` |
| `forfattare` | Namn på raden |
| `sammanfattning` | Ingress |
| `kategori` | En av sektionens kategorier |
| `taggar` | Lista |
| `sprak` | `sv` om fältet saknas |
| `data` | `VERKLIG`, `SIMULERAD` eller `ingen` |
| `kallor` | Lista. Tom lista skrivs `[]` |
| `bild` | `status`, `kalla`, `credit`, `licens`, `src` |
| `koppling` | `utbildning`, `tjanst`, `licens` eller `ingen` |
| `cta` | Valfri `text` och intern `url` |
| `marknadsforing` | `true` eller `false` |
| `finans` | `true` eller `false`. I Kapitalnytt gäller finansreglerna alltid |
| `mar` | Krävs när kategorin är `marknadsanalys` |
| `kulturarv` | Krävs för `historia-och-fornminnen`, med minst `lamning` |

En bild visas bara när `bild.status` är `godkand`, `kalla` är `egen`, `unsplash`, `pexels` eller `wikimedia`, och `credit`, `licens` och `src` alla är ifyllda. En liten creditrad under bilden visas när licensen kräver det, det vill säga CC BY eller CC BY-SA. Övriga licenser ligger kvar i frontmatter och syns inte på sidan.

## Flöde

1. En robot skriver ett utkast med `status: utkast`. Robotar sätter aldrig `godkand`.
2. Ägaren läser texten och sätter `status: godkand` i en pull request som i praktiken är en rad.
3. Nästa körning publicerar inlägget när `publiceras` har passerat, klockan 06:47 sommartid och 05:47 vintertid. En push till `main` som rör `inlagg/` kör samma byggsteg, men ett inlägg väntar ändå tills `publiceras` har passerat.

`amnesforslag.md` i varje mapp är bara förslag. Filen renderas inte och ska inte länkas.

## MAR-information

För `kategori: marknadsanalys` krävs `mar` med `upphov`, `framstalld`, `spridd`, `metod`, `intressekonflikter` och `innehav`. Rutan heter MAR-information, ligger en gång längst ned i inlägget och är kompakt. `framstalld` är tiden då analysen framställdes och `spridd` är tiden för första spridning. Båda visas var för sig, utan tidszonsetikett. `kallor` från frontmatter står i samma ruta, inte som en egen rubrik. Källor krävs fortfarande i frontmatter även om de inte ritas ut på andra inlägg.

## Marknadsföring

När inlägget har `cta` eller `marknadsforing: true` står **Marknadsföring** intill rubriken. En `cta` får bara publiceras när `marknadsforing` är `true`. Texten pekar på en informationssida om utbildning, tjänst eller licens. Den får inte peka på en mäklare, en order eller säga att läsaren ska agera nu. En utmärkelse från en utbildning beskrivs aldrig som licens eller auktorisation.

## Regelefterlevnad

Kontrollen ger fel för godkända inlägg och bara varning för utkast.

- Orden ÖB och paper, mäklarnamn och mäklardomäner, uppmaningar i stil med att köpa eller sälja nu, «redo att handla» och «godkänd för signaler».
- Kursmål, riktkurs, «köp under», samt stop eller target tillsammans med siffror.
- Ord om avkastning, vinst eller tillväxt utan ett riskord i samma mening.
- Löften om säker eller garanterad vinst.
- Tidszonsetiketter (CET, CEST, UTC, GMT).
- Marknadsanalys utan källor, eller siffror utan `data: VERKLIG` eller `data: SIMULERAD`.
- MAR-fält som saknas.
- En cta utan `marknadsforing: true`, eller en cta som är extern eller pekar på en mäklare.
- Bild utan credit eller licens.
- Brutna interna länkar i den genererade utdatan. Externa länkar ger varning.
- Den bestämda formen av ordet magasin (magasin direkt följt av et).
- Renderad text om att sidan inte är rådgivning, en rubrik Källor utanför MAR-rutan, samt TODO, ordet internt, ÖB och interna signaturer (ChatGPT, Anthropic, Claude, Cursor). Ett bolagsnamn i en notis, till exempel OpenAI, är tillåtet.

Kapitalnytt bär riskmeningen «Allt sparande och all investering innebär risk: värdet kan både stiga och sjunka, och du kan förlora pengar.» Den meningen sitter i MAR-rutan på marknadsanalys, och som en kort rad på övriga Kapitalnytt-sidor. Urbergsskölden visar den bara när `finans` är `true`. Historia, natur och energi utan den markeringen har ingen sådan rad. Källistor ritas inte ut. `kallor` ska ändå finnas i frontmatter när kontrollen kräver dem.

## Urbergsskölden utöver det

- `kulturarv` för fornminnen. Koordinater (latitud och longitud, RT90, SWEREF och liknande tal) får inte publiceras, på grund av plundringsrisk och kulturmiljölagen.
- Fakta behöver `kallor` i frontmatter, till exempel Riksantikvarieämbetet, Fornsök, ett museum eller SGU. Listan publiceras inte som egen sektion.
- Jakt hålls inom laglig jakt och viltvård.
- Påståenden om energi i procent eller kronor behöver en källa eller `data: SIMULERAD`, och får inte vara ett löfte.
- `finans: true` slår på samma finansregler och samma riskmening som i Kapitalnytt. Övriga inlägg i historia, natur och energi har ingen sådan rad.

## Kommandon

```bash
node --test kapitalnytt/
node kapitalnytt/check.mjs
node kapitalnytt/build.mjs
```

`kapitalnytt/package.json` har inga beroenden. Den finns så att `node --test kapitalnytt/` startar testfilen.

Bygget skriver `index.html` med kategorifilter, `<slug>/index.html`, `feed.xml` och `sitemap.xml` i varje sektionsmapp. Bara godkända inlägg som har förfallit till publicering kommer med. Utkast ger en tom lista.

## Manuell uppsättning

1. GitHub → Settings → Actions → General → Workflow permissions → Read and write permissions. Utan det kan arbetsflödet inte committa utdata eller starta `pages.yml`.
2. Branch protection på `main` behöver släppa igenom committen från GitHub Actions, annars stannar de schemalagda sidorna. En push med `GITHUB_TOKEN` startar inte `pages.yml`. Arbetsflödet kör därför `gh workflow run pages.yml` efter en commit, eftersom `workflow_dispatch` gör det.
3. Om kontrollen faller på `main` eller i schemat öppnas eller uppdateras ett ärende med etiketten `kapitalnytt-underhall`. Då publiceras ingenting.

Arbetsflödet är `.github/workflows/magasin.yml`. I en pull request körs bara test och kontroll.

## Korslänk

Navigeringen har ingen länk mellan Kapitalnytt och Urbergsskölden. Om du vill att läsaren ska kunna gå från den ena sektionen till den andra kan en diskret länk läggas i sidfoten senare. Det är ett ägarbeslut och är inte infört.
