// Kurskort för Robban. Fakta är hämtade från lektionerna Bankernas historia och Marknadens framtid.
export const COURSES = [
  {
    "id": "bankernas-historia",
    "title": "Bankernas historia",
    "summary": "Riksbanken 1668, Bank of England 1694, familjen Rothschild och 1800-talets banker, delreservsystemet, Federal Reserve 1913 och IMF från Bretton Woods 1944, och hur det hänger ihop i dag.",
    "lessons": [
      {
        "id": "bank-01-riksbanken-1668",
        "title": "01 · Riksbanken 1668 – från de första sedlarna till världens äldsta centralbank",
        "summary": "Stockholms Banco gav ut Europas första sedlar 1661. Ur den erfarenheten grundades Riksens Ständers Bank 1668, i dag Sveriges riksbank.",
        "bullets": [
          "beskriva hur Stockholms Banco gav ut Europas första sedlar,",
          "förklara hur Riksbanken grundades 1668,",
          "nämna Riksbankens inflationsmål i dag.",
          "Sveriges riksbank: Historia – https://www.riksbank.se/sv/om-riksbanken/historia/",
          "Sveriges riksbank: Sveriges riksbank grundas (1668) – https://www.riksbank.se/sv/om-riksbanken/historia/historisk-tidslinje/1600-1699/sveriges-riksbank-grundas/",
          "Sveriges riksbank: 1661 – Premiär för sedlar i Europa – https://www.riksbank.se/sv/om-riksbanken/historia/historisk-tidslinje/1600-1699/premiar-for-sedlar-i-europa/"
        ],
        "questions": [
          {
            "prompt": "Vad hette Sveriges första bank?",
            "explanation": "Johan Palmstruch fick privilegier 1656 för det som blev Stockholms Banco.",
            "options": [
              {
                "text": "Riksens Ständers Bank",
                "correct": false
              },
              {
                "text": "Stockholms Banco",
                "correct": true
              },
              {
                "text": "Sveriges riksbank",
                "correct": false
              },
              {
                "text": "Skånska privatbanken",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad var kreditivsedlarna?",
            "explanation": "Kreditivsedlarna lämnades ut som lån och användes som betalning.",
            "options": [
              {
                "text": "Europas första sedlar, utgivna av Stockholms Banco 1661",
                "correct": true
              },
              {
                "text": "Riksbankens första mynt",
                "correct": false
              },
              {
                "text": "Statsobligationer från 1789",
                "correct": false
              },
              {
                "text": "Kvitton från guldsmeder i London",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilket år beslutade riksdagen att grunda Riksens Ständers Bank?",
            "explanation": "Banken grundades 1668 och fick namnet Sveriges riksbank 1867.",
            "options": [
              {
                "text": "1656",
                "correct": false
              },
              {
                "text": "1694",
                "correct": false
              },
              {
                "text": "1668",
                "correct": true
              },
              {
                "text": "1867",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilket mål har Riksbanken för inflationen i dag?",
            "explanation": "Målet är 2 procent per år för KPIF.",
            "options": [
              {
                "text": "0 procent",
                "correct": false
              },
              {
                "text": "2 procent per år, mätt med KPIF",
                "correct": true
              },
              {
                "text": "5 procent per år",
                "correct": false
              },
              {
                "text": "Samma som Federal Reserve",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "bank-02-bank-of-england-1694",
        "title": "02 · Bank of England 1694 – banken som lånade ut till staten",
        "summary": "Guldsmeder, ett statslån på 1,2 miljoner pund och en bank som med tiden blev Storbritanniens centralbank.",
        "bullets": [
          "förklara varför Bank of England grundades 1694,",
          "beskriva guldsmedernas roll i tidig engelsk bankverksamhet,",
          "nämna några viktiga steg fram till dagens självständiga centralbank.",
          "Bank of England: Our history – https://www.bankofengland.co.uk/about/history",
          "Bank of England Museum: Why was the Bank of England founded? (2021) – https://www.bankofengland.co.uk/museum/online-collections/blog/why-was-the-bank-of-england-founded",
          "Bank of England: How is the Bank of England independent of the Government? – https://www.bankofengland.co.uk/explainers/how-is-the-bank-of-england-independent-of-the-government"
        ],
        "questions": [
          {
            "prompt": "Varför grundades Bank of England 1694?",
            "explanation": "Allmänheten lånade staten 1,2 miljoner pund och blev delägare i banken.",
            "options": [
              {
                "text": "För att ge ut mynt till kolonierna",
                "correct": false
              },
              {
                "text": "För att låna staten pengar till kriget mot Frankrike",
                "correct": true
              },
              {
                "text": "För att ersätta Riksbanken",
                "correct": false
              },
              {
                "text": "För att driva börsen i London",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur mycket lånade allmänheten ut till staten när banken bildades?",
            "explanation": "Beloppet samlades in på 11 dagar.",
            "options": [
              {
                "text": "1,2 miljoner pund",
                "correct": true
              },
              {
                "text": "12 000 pund",
                "correct": false
              },
              {
                "text": "4 miljoner pund",
                "correct": false
              },
              {
                "text": "120 miljoner pund",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad hände med guldsmedernas kvitton?",
            "explanation": "Kvittona på förvarade mynt började användas som betalning.",
            "options": [
              {
                "text": "De brändes varje år",
                "correct": false
              },
              {
                "text": "De började cirkulera som ett slags pengar",
                "correct": true
              },
              {
                "text": "De blev aktier i Bank of England",
                "correct": false
              },
              {
                "text": "De användes bara inom familjen",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Sedan när sätter Bank of England räntan självständigt?",
            "explanation": "Självständigheten i penningpolitiken gäller sedan maj 1997.",
            "options": [
              {
                "text": "1694",
                "correct": false
              },
              {
                "text": "1844",
                "correct": false
              },
              {
                "text": "1946",
                "correct": false
              },
              {
                "text": "1997",
                "correct": true
              }
            ]
          }
        ]
      },
      {
        "id": "bank-03-rothschild-1800-talet",
        "title": "03 · Familjen Rothschild och 1800-talets europeiska banker",
        "summary": "Mayer Amschel Rothschild och hans fem söner byggde bankhus i fem städer och skötte statslån, guldtransporter och järnvägsfinansiering.",
        "bullets": [
          "beskriva hur familjen Rothschild byggde bankhus i fem europeiska städer,",
          "ge exempel på statslån och uppdrag som familjens banker skötte,",
          "förklara hur familjens verksamhet följde industrialiseringen.",
          "Encyclopaedia Britannica (J. Bouvier): Rothschild family (uppd. 2026-09-26) – https://www.britannica.com/topic/Rothschild-family",
          "The Rothschild Archive: London banking house – https://www.rothschildarchive.org/business/n_m_rothschild_and_sons_london",
          "The Rothschild Archive: Rothschild and gold – https://www.rothschildarchive.org/business/n_m_rothschild_and_sons_london/rothschild_and_gold"
        ],
        "questions": [
          {
            "prompt": "I vilken stad började familjen Rothschilds bankhus?",
            "explanation": "Mayer Amschel Rothschild grundade bankhuset i Frankfurt tillsammans med sina fem söner.",
            "options": [
              {
                "text": "London",
                "correct": false
              },
              {
                "text": "Paris",
                "correct": false
              },
              {
                "text": "Frankfurt am Main",
                "correct": true
              },
              {
                "text": "Wien",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilket uppdrag fick Nathan Rothschild av den brittiska regeringen i januari 1814?",
            "explanation": "Generalkommissarie Herries anlitade Nathan för att skaffa guld till armén.",
            "options": [
              {
                "text": "Att bygga en järnväg",
                "correct": false
              },
              {
                "text": "Att skaffa guld- och silvermynt till Wellingtons armé",
                "correct": true
              },
              {
                "text": "Att grunda Bank of England",
                "correct": false
              },
              {
                "text": "Att köpa aktier i Suezkanalen",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur många statslån gav Nathans Londonhus ut mellan 1818 och 1835?",
            "explanation": "Londonhuset gav ut 26 brittiska och utländska statslån.",
            "options": [
              {
                "text": "2",
                "correct": false
              },
              {
                "text": "26",
                "correct": true
              },
              {
                "text": "260",
                "correct": false
              },
              {
                "text": "6",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad användes lånet på 4 miljoner pund till 1875?",
            "explanation": "Lånet gick till Disraeli för köpet av Suezaktierna och återbetalades inom fem månader.",
            "options": [
              {
                "text": "Den brittiska regeringens köp av khedivens aktier i Suezkanalbolaget",
                "correct": true
              },
              {
                "text": "Frankrikes befrielselån",
                "correct": false
              },
              {
                "text": "Bygget av New Court",
                "correct": false
              },
              {
                "text": "Kriget mot Napoleon",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "bank-04-rothschild-efter-1800-talet",
        "title": "04 · Rothschildhusen efter 1800-talet – en bankvärld i förändring",
        "summary": "Aktiebanker och insättningsbanker växte fram. Rothschildhusen i Neapel, Frankfurt, Wien och Paris avvecklades, såldes eller förstatligades, och 1989 öppnade ett nytt kontor i Frankfurt.",
        "bullets": [
          "beskriva hur nya typer av banker växte fram efter 1850,",
          "nämna vad som hände med husen i Neapel, Frankfurt, Wien och Paris,",
          "förklara hur bankverksamheten återkom till Frankfurt 1989.",
          "Encyclopaedia Britannica (J. Bouvier): Rothschild family (uppd. 2026-09-26) – https://www.britannica.com/topic/Rothschild-family",
          "The Rothschild Archive: The Naples house, C M de Rothschild e figli – https://www.rothschildarchive.org/business/c_m_de_rothschild_and_figli_naples",
          "The Rothschild Archive: Rothschild Timeline – https://www.rothschildarchive.org/exhibitions/timeline"
        ],
        "questions": [
          {
            "prompt": "Vilket av Rothschildhusen avvecklades först?",
            "explanation": "Efter Italiens enande avvecklades huset i Neapel 1863.",
            "options": [
              {
                "text": "London",
                "correct": false
              },
              {
                "text": "Neapel, 1863",
                "correct": true
              },
              {
                "text": "Paris",
                "correct": false
              },
              {
                "text": "Wien",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Varför likviderades Frankfurthuset 1901?",
            "explanation": "Wilhelm Carl von Rothschild dog 1901 och familjen beslöt att likvidera banken.",
            "options": [
              {
                "text": "Den siste delägaren dog och Frankfurt hade fått mindre betydelse som finanscentrum",
                "correct": true
              },
              {
                "text": "Huset flyttade till New York",
                "correct": false
              },
              {
                "text": "Det slogs ihop med Bank of England",
                "correct": false
              },
              {
                "text": "Det köptes av Riksbanken",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad hände med Banque Rothschild i Paris 1981–1982?",
            "explanation": "Banque Rothschild var en av 39 banker som förstatligades.",
            "options": [
              {
                "text": "Banken flyttade till London",
                "correct": false
              },
              {
                "text": "Banken blev centralbank",
                "correct": false
              },
              {
                "text": "Banken förstatligades av den franska regeringen",
                "correct": true
              },
              {
                "text": "Banken börsnoterades i USA",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilka typer av banker växte fram från 1850-talet?",
            "explanation": "Britannica beskriver hur nya aktiebanker och insättningsbanker växte i England, Frankrike och de tyska staterna.",
            "options": [
              {
                "text": "Tempelbanker",
                "correct": false
              },
              {
                "text": "Aktiebanker och insättningsbanker",
                "correct": true
              },
              {
                "text": "Kryptobanker",
                "correct": false
              },
              {
                "text": "Centralbanker i varje stad",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "bank-05-delreservsystemet",
        "title": "05 · Delreservsystemet – hur bankpengar skapas",
        "summary": "Så skapar banker pengar när de lånar ut, vad reservkrav och kapitalkrav är, och hur insättningsgarantin skyddar sparare.",
        "bullets": [
          "förklara vad ett reservkrav och ett delreservsystem är,",
          "beskriva hur banker skapar pengar när de lånar ut,",
          "nämna vad som begränsar bankernas utlåning i dag.",
          "Centralbankspengar: sedlar, mynt och bankernas pengar på konton i Riksbankens betalningssystem RIX.",
          "Bankpengar: pengar på konton i vanliga banker. De är en fordran på banken.",
          "Enligt Bank of England (2014) spelar reservkrav en liten roll i penningpolitiken i de flesta avancerade ekonomier."
        ],
        "questions": [
          {
            "prompt": "Vad händer enligt Bank of England när en bank lämnar ett lån?",
            "explanation": "Lånet skapar en motsvarande insättning, alltså nya pengar.",
            "options": [
              {
                "text": "Banken hämtar pengarna från Riksbanken",
                "correct": false
              },
              {
                "text": "Banken skapar samtidigt en lika stor insättning på låntagarens konto",
                "correct": true
              },
              {
                "text": "Banken trycker nya sedlar",
                "correct": false
              },
              {
                "text": "Banken säljer guld",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur stor del av pengarna i Sverige är kontanter enligt Riksbanken?",
            "explanation": "Den allra största delen av pengarna finns på bankkonton.",
            "options": [
              {
                "text": "Ungefär hälften",
                "correct": false
              },
              {
                "text": "Ungefär 25 procent",
                "correct": false
              },
              {
                "text": "Ungefär 1,5 procent",
                "correct": true
              },
              {
                "text": "Ungefär 97 procent",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad begränsar bankernas utlåning enligt Riksbanken?",
            "explanation": "Regler, efterfrågan och styrräntan sätter ramarna.",
            "options": [
              {
                "text": "Krav på kapital och likviditet, efterfrågan på lån och styrräntans påverkan",
                "correct": true
              },
              {
                "text": "Bara mängden guld i valven",
                "correct": false
              },
              {
                "text": "Antalet bankkontor",
                "correct": false
              },
              {
                "text": "Vädret",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilket reservkrav har Federal Reserve haft sedan den 26 mars 2020?",
            "explanation": "Fed sänkte reservkraven till noll procent för alla inlåningsinstitut.",
            "options": [
              {
                "text": "10 procent",
                "correct": false
              },
              {
                "text": "3 procent",
                "correct": false
              },
              {
                "text": "20 procent",
                "correct": false
              },
              {
                "text": "0 procent",
                "correct": true
              }
            ]
          },
          {
            "prompt": "Vad är bankpengar?",
            "explanation": "Pengar på ett bankkonto är en fordran på banken.",
            "options": [
              {
                "text": "Sedlar från Riksbanken",
                "correct": false
              },
              {
                "text": "En fordran på den bank där pengarna finns",
                "correct": true
              },
              {
                "text": "Guldmynt",
                "correct": false
              },
              {
                "text": "Aktier i banken",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "bank-06-federal-reserve-1913",
        "title": "06 · Federal Reserve 1913 – USA:s centralbank",
        "summary": "Krisen 1907, Aldrich–Vreeland Act och Federal Reserve Act 1913 – och hur Federal Reserve är uppbyggt i dag.",
        "bullets": [
          "beskriva vilken kris som ledde fram till Federal Reserve,",
          "förklara hur systemet med regionala banker och en central styrelse växte fram,",
          "nämna Federal Reserves mål och uppbyggnad i dag.",
          "Board of Governors i Washington D.C.: 7 ledamöter med förskjutna mandat på 14 år, nominerade av presidenten och godkända av senaten.",
          "12 Federal Reserve Banks med 24 filialer runt om i landet.",
          "FOMC (Federal Open Market Committee): 12 röstande ledamöter som beslutar om penningpolitiken vid minst åtta möten per år."
        ],
        "questions": [
          {
            "prompt": "Vilken kris ledde fram till arbetet med en amerikansk centralbank?",
            "explanation": "Efter 1907 antogs Aldrich–Vreeland Act och en kommission tillsattes.",
            "options": [
              {
                "text": "Finanskrisen 1907",
                "correct": true
              },
              {
                "text": "Börskraschen 1929",
                "correct": false
              },
              {
                "text": "Krisen 2008",
                "correct": false
              },
              {
                "text": "Söderhavsbubblan 1720",
                "correct": false
              }
            ]
          },
          {
            "prompt": "När undertecknades Federal Reserve Act?",
            "explanation": "President Wilson undertecknade lagen den 23 december 1913.",
            "options": [
              {
                "text": "4 juli 1900",
                "correct": false
              },
              {
                "text": "23 december 1913",
                "correct": true
              },
              {
                "text": "15 augusti 1971",
                "correct": false
              },
              {
                "text": "27 juli 1694",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur många regionala Federal Reserve Banks finns i dag?",
            "explanation": "Systemet har 12 Reserve Banks med 24 filialer.",
            "options": [
              {
                "text": "5",
                "correct": false
              },
              {
                "text": "7",
                "correct": false
              },
              {
                "text": "12",
                "correct": true
              },
              {
                "text": "50",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilka mål har kongressen gett Federal Reserve?",
            "explanation": "FOMC arbetar mot maximal sysselsättning och prisstabilitet.",
            "options": [
              {
                "text": "Högsta möjliga börskurser",
                "correct": false
              },
              {
                "text": "Maximal sysselsättning och prisstabilitet",
                "correct": true
              },
              {
                "text": "Fast guldpris",
                "correct": false
              },
              {
                "text": "Fast växelkurs mot pundet",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "bank-07-bretton-woods-imf",
        "title": "07 · Bretton Woods 1944 och IMF",
        "summary": "44 länder möttes i Bretton Woods 1944. Resultatet blev IMF, det som i dag är Världsbanksgruppen och ett växelkurssystem knutet till dollarn och guldet.",
        "bullets": [
          "beskriva vad som beslutades i Bretton Woods 1944,",
          "förklara hur växelkurssystemet med dollar och guld fungerade,",
          "nämna IMF:s uppgifter och hur Sverige blev medlem.",
          "Internationella valutafonden (IMF), som skulle övervaka växelkurserna och låna ut reservvalutor till länder med underskott i betalningsbalansen.",
          "Internationella banken för återuppbyggnad och utveckling, i dag Världsbanksgruppen, som skulle stödja återuppbyggnaden efter kriget och utvecklingen i mindre utvecklade länder.",
          "Sveriges riksbank: Historisk tidslinje – https://www.riksbank.se/sv/om-riksbanken/historia/historisk-tidslinje/"
        ],
        "questions": [
          {
            "prompt": "Hur många länder deltog i Bretton Woods-konferensen 1944?",
            "explanation": "Delegater från 44 länder deltog. 730 var antalet delegater.",
            "options": [
              {
                "text": "12",
                "correct": false
              },
              {
                "text": "44",
                "correct": true
              },
              {
                "text": "191",
                "correct": false
              },
              {
                "text": "730",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilka två institutioner beslutades i Bretton Woods?",
            "explanation": "IMF och Internationella banken för återuppbyggnad och utveckling.",
            "options": [
              {
                "text": "Federal Reserve och Bank of England",
                "correct": false
              },
              {
                "text": "BIS och ECB",
                "correct": false
              },
              {
                "text": "IMF och det som i dag är Världsbanksgruppen",
                "correct": true
              },
              {
                "text": "Riksbanken och Riksgälden",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Till vilket pris var dollarn knuten till guld?",
            "explanation": "Dollarn var fast mot guld till 35 dollar per uns.",
            "options": [
              {
                "text": "20 dollar per uns",
                "correct": false
              },
              {
                "text": "35 dollar per uns",
                "correct": true
              },
              {
                "text": "100 dollar per uns",
                "correct": false
              },
              {
                "text": "1 dollar per gram",
                "correct": false
              }
            ]
          },
          {
            "prompt": "När stängde president Nixon guldfönstret?",
            "explanation": "Beslutet i augusti 1971 inledde slutet på Bretton Woods-systemet.",
            "options": [
              {
                "text": "Den 15 augusti 1971",
                "correct": true
              },
              {
                "text": "1944",
                "correct": false
              },
              {
                "text": "1958",
                "correct": false
              },
              {
                "text": "1992",
                "correct": false
              }
            ]
          },
          {
            "prompt": "När blev Sverige medlem i IMF?",
            "explanation": "Sveriges medlemskap gäller från den 31 augusti 1951.",
            "options": [
              {
                "text": "1945",
                "correct": false
              },
              {
                "text": "1951",
                "correct": true
              },
              {
                "text": "1973",
                "correct": false
              },
              {
                "text": "1995",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "bank-08-sa-hanger-det-ihop",
        "title": "08 · Så hänger det ihop i dag",
        "summary": "Tidslinje, dagens centralbanker, BIS, Baselkommittén och IMF – och Bankkartan med en jämförelse av dagens banker.",
        "bullets": [
          "beskriva hur centralbankerna arbetar i dag,",
          "förklara hur centralbanker, affärsbanker, BIS och IMF hänger ihop,",
          "hitta en uppdaterad jämförelse av dagens banker i Bankkartan.",
          "1661 – Stockholms Banco ger ut Europas första sedlar",
          "1668 – Riksens Ständers Bank, i dag Riksbanken, grundas",
          "1694 – Bank of England grundas"
        ],
        "questions": [
          {
            "prompt": "Vem bestämmer Bank of Englands inflationsmål?",
            "explanation": "Regeringen sätter målet på 2 procent. Bank of England sätter räntan för att nå det.",
            "options": [
              {
                "text": "Den brittiska regeringen",
                "correct": true
              },
              {
                "text": "IMF",
                "correct": false
              },
              {
                "text": "Federal Reserve",
                "correct": false
              },
              {
                "text": "Bankernas styrelser",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad är BIS?",
            "explanation": "BIS tjänar centralbanker och främjar samarbete mellan dem.",
            "options": [
              {
                "text": "En vanlig sparbank",
                "correct": false
              },
              {
                "text": "En bank för centralbanker, ägd av 63 centralbanker",
                "correct": true
              },
              {
                "text": "En del av Riksbanken",
                "correct": false
              },
              {
                "text": "En börs i Basel",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur många medlemsländer har IMF i dag?",
            "explanation": "IMF har 191 medlemmar.",
            "options": [
              {
                "text": "44",
                "correct": false
              },
              {
                "text": "63",
                "correct": false
              },
              {
                "text": "191",
                "correct": true
              },
              {
                "text": "29",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilka skapar största delen av pengarna i dag?",
            "explanation": "Bankinsättningar är den största delen av pengarna och skapas främst genom utlåning.",
            "options": [
              {
                "text": "Affärsbankerna, när de lånar ut",
                "correct": true
              },
              {
                "text": "IMF",
                "correct": false
              },
              {
                "text": "Guldgruvor",
                "correct": false
              },
              {
                "text": "BIS",
                "correct": false
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": "marknadens-framtid",
    "title": "Marknadens framtid",
    "summary": "Från böckerna till den delade ledgern: algoritmer och AI, krypto, e-kronan och den digitala euron, ICO, självförvar och vad källorna säger om nästa steg.",
    "lessons": [
      {
        "id": "mf-01-fran-bocker-till-ledger",
        "title": "01 · Från böckerna till ledgern – återblick på skepp och korsfarare",
        "summary": "Tempelriddarnas konton, VOC:s aktiebok och bankernas böcker – den röda tråden från pappersbok till delad ledger.",
        "bullets": [
          "beskriva hur tempelriddarna och VOC förde böcker över andras pengar och andelar,",
          "förklara vad en ledger är,",
          "följa den röda tråden från pappersböcker till digitala och delade ledgers.",
          "Lektion 02: algoritmer och AI lägger order, och företagen för register över sin handel.",
          "Lektion 03: krypto bygger på en ledger som delas mellan deltagarna i ett nätverk.",
          "Lektion 04: en CBDC är centralbankspengar i digital form. Den digitala euron är tänkt att föras på en central plattform som Eurosystemet driver."
        ],
        "questions": [
          {
            "prompt": "Vem anlitade tempelriddarna som bankirer?",
            "explanation": "Ordens nätverk av förråd och säkra transporter gjorde den attraktiv som bankir åt kungar och pilgrimer.",
            "options": [
              {
                "text": "Bara köpmän i Amsterdam",
                "correct": false
              },
              {
                "text": "Både kungar och pilgrimer",
                "correct": true
              },
              {
                "text": "Bara Riksbanken",
                "correct": false
              },
              {
                "text": "VOC:s aktieägare",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur kunde Tempelherrarna betala ut pengar på en annan ort?",
            "explanation": "Delisle beskriver betalningar på avstånd genom korrespondens och bokföring, så att pengarna kunde stå kvar.",
            "options": [
              {
                "text": "Genom brev och bokföringsposter mellan ordens hus",
                "correct": true
              },
              {
                "text": "Genom att trycka sedlar",
                "correct": false
              },
              {
                "text": "Via en börs i Amsterdam",
                "correct": false
              },
              {
                "text": "Genom en centralbank",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Var fanns ägandet i VOC?",
            "explanation": "VOC gav ut kvitton, och bokhållarna förde in insatser och ägarbyten i böckerna.",
            "options": [
              {
                "text": "I aktiebrev som delades ut",
                "correct": false
              },
              {
                "text": "I kompaniets böcker, där varje insats och ägarbyte fördes in",
                "correct": true
              },
              {
                "text": "Hos Riksbanken",
                "correct": false
              },
              {
                "text": "I en blockkedja",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad är en blockkedja enligt NIST?",
            "explanation": "NIST beskriver blockkedjor som delade digitala ledgers där ändringar syns och är svåra att genomföra.",
            "options": [
              {
                "text": "En pappersbok i ett bankvalv",
                "correct": false
              },
              {
                "text": "En digital ledger som delas mellan många datorer",
                "correct": true
              },
              {
                "text": "Ett aktiebrev från VOC",
                "correct": false
              },
              {
                "text": "Ett kreditkort",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "mf-02-algoritmer-och-ai",
        "title": "02 · Algoritmisk handel och AI – robotarna på marknaden",
        "summary": "Vad algoritmisk handel och högfrekvenshandel är enligt MiFID II, vilka krav som gäller och hur ESMA, FSB och BIS ser på AI.",
        "bullets": [
          "förklara vad algoritmisk handel och högfrekvenshandel är enligt EU:s regler,",
          "beskriva vilka krav som gäller för företag som handlar algoritmiskt,",
          "beskriva hur AI används i finanssektorn och vad myndigheterna följer.",
          "infrastruktur som minimerar fördröjningar, till exempel servrar placerade nära handelsplatsen,",
          "systemet bestämmer order helt automatiskt för enskilda affärer,",
          "många meddelanden per dag i form av order, noteringar och makuleringar."
        ],
        "questions": [
          {
            "prompt": "Vad är algoritmisk handel enligt MiFID II?",
            "explanation": "Definitionen gäller algoritmer som bestämmer om, när, till vilket pris och i vilken mängd en order läggs.",
            "options": [
              {
                "text": "All handel via internet",
                "correct": false
              },
              {
                "text": "Handel där en datoralgoritm automatiskt bestämmer orderns detaljer",
                "correct": true
              },
              {
                "text": "Handel med kryptotillgångar",
                "correct": false
              },
              {
                "text": "Handel som bara sker på natten",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad förväntar sig ESMA av företag som använder AI i investeringstjänster?",
            "explanation": "ESMA:s uttalande från 2024 betonar organisation, uppträdande och kundens bästa.",
            "options": [
              {
                "text": "Att de följer MiFID II, bland annat skyldigheten att agera i kundens bästa intresse",
                "correct": true
              },
              {
                "text": "Att de slutar använda algoritmer",
                "correct": false
              },
              {
                "text": "Att AI fattar alla beslut",
                "correct": false
              },
              {
                "text": "Att kunderna själva kontrollerar AI",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilken sårbarhet lyfter FSB fram?",
            "explanation": "FSB nämner leverantörskoncentration, samvariation på marknaderna, cyberrisker och modellrisk.",
            "options": [
              {
                "text": "För få datorer i världen",
                "correct": false
              },
              {
                "text": "Beroende av ett fåtal leverantörer av AI-tjänster",
                "correct": true
              },
              {
                "text": "Att sedlar försvinner",
                "correct": false
              },
              {
                "text": "Att börser stänger på helger",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "mf-03-krypto",
        "title": "03 · Krypto – en ledger som delas",
        "summary": "Vad en kryptotillgång är, hur Bitcoin för en gemensam bok, stablecoins och NFT, och EU:s MiCA-förordning.",
        "bullets": [
          "förklara vad en kryptotillgång är,",
          "beskriva hur Bitcoin använder en delad ledger,",
          "nämna olika typer av kryptotillgångar,",
          "berätta vad EU:s MiCA-förordning innebär.",
          "Bitcoin är den mest kända och största kryptotillgången.",
          "Stablecoins följer värdet på en eller flera officiella valutor eller andra tillgångar, till exempel guld."
        ],
        "questions": [
          {
            "prompt": "Hur beskriver Finansinspektionen en kryptotillgång?",
            "explanation": "Definitionen finns på FI:s konsumentsida om kryptotillgångar.",
            "options": [
              {
                "text": "En aktie i en bank",
                "correct": false
              },
              {
                "text": "En digital representation av ett värde eller en rättighet som överförs och lagras med blockkedjeteknik",
                "correct": true
              },
              {
                "text": "En sedel från Riksbanken",
                "correct": false
              },
              {
                "text": "Ett sparkonto",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur enas deltagarna i Bitcoin om vilka transaktioner som gäller?",
            "explanation": "Nakamoto beskriver en gemensam historik över i vilken ordning transaktionerna kom in.",
            "options": [
              {
                "text": "En bank bestämmer",
                "correct": false
              },
              {
                "text": "Transaktionerna tillkännages offentligt och deltagarna enas om en gemensam historik",
                "correct": true
              },
              {
                "text": "Varje användare för en egen bok",
                "correct": false
              },
              {
                "text": "Riksbanken godkänner varje transaktion",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad kännetecknar en stablecoin?",
            "explanation": "Finansinspektionen beskriver stablecoins som kryptotillgångar som följer en valuta eller en annan tillgång.",
            "options": [
              {
                "text": "Den följer värdet på en eller flera officiella valutor eller andra tillgångar",
                "correct": true
              },
              {
                "text": "Den ges ut av en centralbank",
                "correct": false
              },
              {
                "text": "Den är en aktie",
                "correct": false
              },
              {
                "text": "Den kan bara användas offline",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad gör MiCA-förordningen?",
            "explanation": "MiCA stärker bland annat konsumentskyddet och insynen.",
            "options": [
              {
                "text": "Den inför euron i Sverige",
                "correct": false
              },
              {
                "text": "Den gäller bara aktier",
                "correct": false
              },
              {
                "text": "Den ger enhetliga regler i EU för företag som ger ut eller erbjuder tjänster med kryptotillgångar",
                "correct": true
              },
              {
                "text": "Den bestämmer priset på bitcoin",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "mf-04-cbdc",
        "title": "04 · CBDC – e-kronan och den digitala euron",
        "summary": "Var arbetet med e-kronan står, hur den digitala euron är tänkt att fungera och när den kan komma, och en jämförelse med krypto och bankpengar.",
        "bullets": [
          "förklara vad en CBDC (digitala centralbankspengar) är,",
          "berätta var arbetet med e-kronan står,",
          "beskriva hur den digitala euron är tänkt att fungera och när den kan komma,",
          "jämföra krypto, CBDC och bankpengar.",
          "Den digitala euron skulle vara lagligt betalningsmedel, och en digital euro är alltid värd en euro.",
          "Den skulle kunna användas både online och offline. Vid betalningar offline känner bara betalaren och mottagaren till transaktionsuppgifterna."
        ],
        "questions": [
          {
            "prompt": "Vem skulle ge ut e-kronor?",
            "explanation": "E-kronor skulle vara digitala kronor utgivna av Riksbanken.",
            "options": [
              {
                "text": "Affärsbankerna",
                "correct": false
              },
              {
                "text": "Riksbanken",
                "correct": true
              },
              {
                "text": "ECB",
                "correct": false
              },
              {
                "text": "Ett kryptonätverk",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vem beslutar om Sverige ska införa e-kronor?",
            "explanation": "Riksbanken beskriver införandet som ett politiskt beslut.",
            "options": [
              {
                "text": "Bankerna",
                "correct": false
              },
              {
                "text": "ECB",
                "correct": false
              },
              {
                "text": "Politikerna, genom riksdagen",
                "correct": true
              },
              {
                "text": "Finansinspektionen",
                "correct": false
              }
            ]
          },
          {
            "prompt": "När siktar ECB på att vara redo för en första utgivning av den digitala euron?",
            "explanation": "Piloten planeras till andra halvåret 2027, och målet för en möjlig utgivning är 2029.",
            "options": [
              {
                "text": "2025",
                "correct": false
              },
              {
                "text": "2027",
                "correct": false
              },
              {
                "text": "2029, om EU-förordningen antas före slutet av 2026",
                "correct": true
              },
              {
                "text": "2040",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilket påstående om den digitala euron stämmer enligt ECB?",
            "explanation": "Den digitala euron skulle fungera online och offline och komplettera kontanterna.",
            "options": [
              {
                "text": "Den betalar hög ränta",
                "correct": false
              },
              {
                "text": "Den kan användas offline, och en digital euro är alltid värd en euro",
                "correct": true
              },
              {
                "text": "Den är en kryptotillgång",
                "correct": false
              },
              {
                "text": "Den ersätter sedlarna",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "mf-05-ico-och-tokens",
        "title": "05 · ICO och tokens – nya andelar i boken",
        "summary": "Vad en ICO är, olika slags tokens och whitepapers enligt MiCA. Fördjupning finns i kursen ICO & tokenerbjudanden.",
        "bullets": [
          "förklara vad en ICO är,",
          "beskriva olika slags tokens,",
          "berätta var du hittar whitepapers enligt MiCA.",
          "en del ger tillgång till en tjänst eller produkt som utgivaren utvecklar,",
          "en del ger rösträtt eller en andel av framtida intäkter,",
          "en del handlas på särskilda handelsplatser efter utgivningen."
        ],
        "questions": [
          {
            "prompt": "Vad är en ICO enligt ESMA?",
            "explanation": "ICO kallas också token sale.",
            "options": [
              {
                "text": "En börsintroduktion av en bank",
                "correct": false
              },
              {
                "text": "Ett sätt att ta in pengar från allmänheten med coins eller tokens",
                "correct": true
              },
              {
                "text": "En centralbanksvaluta",
                "correct": false
              },
              {
                "text": "En försäkring",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vem ansvarar för innehållet i ett whitepaper enligt MiCA?",
            "explanation": "Whitepapers i ESMA:s register är utgivarens ansvar.",
            "options": [
              {
                "text": "ESMA",
                "correct": false
              },
              {
                "text": "Riksbanken",
                "correct": false
              },
              {
                "text": "Utgivaren eller den som erbjuder kryptotillgången",
                "correct": true
              },
              {
                "text": "Köparen",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilken koppling finns mellan en ICO och VOC:s aktiebok?",
            "explanation": "VOC förde in insatserna i sina böcker, och en ICO skapar tokens i en ledger.",
            "options": [
              {
                "text": "Båda för in nya andelar i en bok, VOC i en pappersbok och en ICO i en digital ledger",
                "correct": true
              },
              {
                "text": "Båda gavs ut av Riksbanken",
                "correct": false
              },
              {
                "text": "Båda handlades bara offline",
                "correct": false
              },
              {
                "text": "Båda saknade ägare",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "mf-06-sjalvforvar-kall-planbok",
        "title": "06 · Självförvar och kall plånbok",
        "summary": "Självförvar, varm och kall plånbok, varför offline-nycklar minskar attackytan och hur du gör en säker backup av återställningsfrasen.",
        "bullets": [
          "förklara vad självförvar innebär,",
          "beskriva skillnaden mellan varm och kall plånbok,",
          "förklara varför nycklar som förvaras offline minskar attackytan,",
          "göra en säker backup av en återställningsfras.",
          "Anslutning – Varm plånbok: Uppkopplad mot internet · Kall plånbok: Offline, frånkopplad från internet",
          "Används för – Varm plånbok: Snabb åtkomst, mindre belopp och pengar i rörelse · Kall plånbok: Hög säkerhet, större belopp som ligger still"
        ],
        "questions": [
          {
            "prompt": "Vad innebär självförvar?",
            "explanation": "Vid självförvar ligger nyckelhantering, backup och signering hos användaren.",
            "options": [
              {
                "text": "Du skapar, förvarar och säkerhetskopierar dina nycklar själv och godkänner varje transaktion",
                "correct": true
              },
              {
                "text": "Banken förvarar allt åt dig",
                "correct": false
              },
              {
                "text": "Nycklarna ligger hos en börs",
                "correct": false
              },
              {
                "text": "Du delar nycklarna med supporten",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad kännetecknar en kall plånbok?",
            "explanation": "En kall plånbok är frånkopplad från internet och kräver till exempel en knapptryckning eller en lokal PIN-kod för att signera.",
            "options": [
              {
                "text": "Den är alltid uppkopplad",
                "correct": false
              },
              {
                "text": "Den används bara för små belopp",
                "correct": false
              },
              {
                "text": "Nycklarna förvaras offline och signering kräver ett fysiskt steg",
                "correct": true
              },
              {
                "text": "Den sköts av en bank",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Varför minskar offline-nycklar attackytan?",
            "explanation": "Att hålla privata nycklar offline minskar risken för intrång kraftigt, även om en angripare tar kontroll över datorn.",
            "options": [
              {
                "text": "Nyckeln finns på färre ställen som går att nå via internet, även om datorn angrips",
                "correct": true
              },
              {
                "text": "De gör transaktioner snabbare",
                "correct": false
              },
              {
                "text": "De ersätter återställningsfrasen",
                "correct": false
              },
              {
                "text": "De höjer värdet på tillgångarna",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Hur gör du en säker backup av återställningsfrasen?",
            "explanation": "Frasen är huvudnyckeln till plånboken. Skriv ned den, håll den offline och behåll den för dig själv.",
            "options": [
              {
                "text": "Tar en skärmdump som sparas i molnet",
                "correct": false
              },
              {
                "text": "Skriver ned den och förvarar kopian säkert, för dig själv",
                "correct": true
              },
              {
                "text": "Mejlar den till supporten",
                "correct": false
              },
              {
                "text": "Delar den i en chatt",
                "correct": false
              }
            ]
          }
        ]
      },
      {
        "id": "mf-07-framtiden-enligt-kallorna",
        "title": "07 · Framtiden enligt källorna",
        "summary": "BIS unified ledger och tokenisering, ECB:s och Riksbankens planer, ESMA:s tillsyn av AI och tokenisering – och ledgerns tidslinje.",
        "bullets": [
          "återge hur BIS beskriver framtidens penning- och finanssystem,",
          "nämna de planer som ECB, Riksbanken och ESMA själva har publicerat,",
          "följa ledgerns tidslinje från 1100-talet till i dag.",
          "ECB: en pilot med den digitala euron under andra halvåret 2027 och beredskap för en möjlig första utgivning 2029, om EU-förordningen antas före slutet av 2026.",
          "Riksbanken: följer arbetet med den digitala euron och har föreslagit en utredning om de lagändringar som behövs för en e-krona.",
          "ESMA: inför från 2027 en ny prioritering i tillsynen för digital innovation, med fokus först på hur företagen använder AI och tokenisering."
        ],
        "questions": [
          {
            "prompt": "Vad är en «unified ledger» enligt BIS?",
            "explanation": "BIS beskrev idén 2023 som en ny typ av finansiell infrastruktur.",
            "options": [
              {
                "text": "En ny kryptovaluta",
                "correct": false
              },
              {
                "text": "En plattform som samlar centralbankspengar, tokeniserade bankinsättningar och tokeniserade tillgångar",
                "correct": true
              },
              {
                "text": "En bokföringsbok i en bank",
                "correct": false
              },
              {
                "text": "En aktiebok från VOC",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vilka tre krav prövar BIS stablecoins mot?",
            "explanation": "BIS bedömer att stablecoins uppfyller kraven i otillräcklig grad för att bära penningsystemet.",
            "options": [
              {
                "text": "Pris, volym och hastighet",
                "correct": false
              },
              {
                "text": "Singleness, elasticity och integrity",
                "correct": true
              },
              {
                "text": "Ränta, skatt och avgift",
                "correct": false
              },
              {
                "text": "Guld, silver och koppar",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad fokuserar ESMA:s nya tillsynsprioritering från 2027 på först?",
            "explanation": "ESMA vill att tillsynen har kunskap och kapacitet för nya tekniker.",
            "options": [
              {
                "text": "Sedlar och mynt",
                "correct": false
              },
              {
                "text": "Hur företagen använder AI och tokenisering",
                "correct": true
              },
              {
                "text": "Fastighetspriser",
                "correct": false
              },
              {
                "text": "Guldreserver",
                "correct": false
              }
            ]
          },
          {
            "prompt": "Vad är den röda tråden i kursen?",
            "explanation": "Tråden går från tempelherrarnas konton och VOC:s bok till delade och digitala ledgers.",
            "options": [
              {
                "text": "Ledgern, en betrodd bok över vem som äger vad",
                "correct": true
              },
              {
                "text": "Guld som enda säkra tillgång",
                "correct": false
              },
              {
                "text": "Att robotar ersätter människor",
                "correct": false
              },
              {
                "text": "Att allt blir kontantlöst",
                "correct": false
              }
            ]
          }
        ]
      }
    ]
  }
];
