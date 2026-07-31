// Lliçons del tutorial interactiu. Cada lliçó munta una posició al tauler 9x9 i
// demana a l'aprenent una jugada concreta, que es valida amb el motor de regles.
// Contingut de formes basat en les notes del vault (boca del tigre, junta de
// bambú, triangle buit) i els manuals de Go del projecte.

export type Goal = "capture" | "atari" | "doubleAtari" | "exact";

export interface Lesson {
  id: string;
  title: string;
  intro: string; // explicació del concepte
  task: string; // instrucció concreta
  success: string; // missatge quan s'encerta
  wrong?: string; // pista quan s'erra amb una jugada legal
  black: string[]; // pedres negres (vèrtexs "E5")
  white: string[]; // pedres blanques
  goal: Goal;
  accept: string[]; // jugades correctes (per a "exact"); orientatives per als altres
  avoid?: { vertex: string; message: string }; // jugada temptadora però dolenta
}

export const LESSONS: Lesson[] = [
  // ---------- Fonaments ----------
  {
    id: "llibertats",
    title: "Llibertats i captura",
    intro:
      "Cada pedra té llibertats: els punts buits del costat (a dalt, a baix, esquerra i dreta). Quan tapes l'última llibertat d'una pedra enemiga, la captures i la retires del tauler.",
    task: "La pedra blanca del centre només té una llibertat. Captura-la.",
    success: "Molt bé! En omplir la seva última llibertat, la pedra blanca ha quedat capturada.",
    wrong: "Fixa't en quin punt buit toca la pedra blanca: aquella és la seva última llibertat.",
    black: ["D5", "F5", "E6"],
    white: ["E5"],
    goal: "capture",
    accept: ["E4"],
  },
  {
    id: "cadena",
    title: "Capturar una cadena",
    intro:
      "Dues o més pedres del mateix color connectades formen una cadena i comparteixen les llibertats. Es capturen totes de cop quan s'omple l'última llibertat compartida.",
    task: "Les dues pedres blanques formen una cadena en atari. Captura-la sencera.",
    success: "Perfecte! Una sola jugada ha capturat tota la cadena blanca.",
    wrong: "La cadena blanca comparteix una única llibertat. Troba-la.",
    black: ["D5", "F5", "E6", "D4", "F4"],
    white: ["E5", "E4"],
    goal: "capture",
    accept: ["E3"],
  },
  {
    id: "atari",
    title: "Posar en atari",
    intro:
      "«Atari» vol dir que una pedra o cadena té una sola llibertat: està a punt de ser capturada. Amenaçar amb atari és una de les eines tàctiques bàsiques.",
    task: "La pedra blanca té dues llibertats. Deixa-la en atari (amb una sola).",
    success: "Exacte! Ara la pedra blanca està en atari i l'amenaces de captura.",
    wrong: "Has de treure-li una de les dues llibertats perquè només li'n quedi una.",
    black: ["D5", "E6"],
    white: ["E5"],
    goal: "atari",
    accept: ["E4", "F5"],
  },
  {
    id: "doble-atari",
    title: "Doble atari",
    intro:
      "El doble atari amenaça dues pedres alhora amb una sola jugada: l'enemic només en pot salvar una, així que segur que en captures alguna. És una tàctica molt rendible.",
    task: "Juga el punt que deixa en atari les DUES pedres blanques a la vegada.",
    success: "Brillant! Doble atari: l'enemic només en pot salvar una i tu captures l'altra.",
    wrong: "Busca el punt que toca les dues pedres blanques i els treu una llibertat a cadascuna.",
    black: ["C4", "D3", "G4", "F3"],
    white: ["D4", "F4"],
    goal: "doubleAtari",
    accept: ["E4"],
  },
  {
    id: "ko",
    title: "El ko",
    intro:
      "El ko és una situació on es podria capturar i recapturar la mateixa pedra indefinidament. La regla del ko ho prohibeix: després de capturar, l'adversari no pot recuperar la posició immediatament; ha de jugar en un altre lloc primer.",
    task: "Captura la pedra blanca del ko jugant a l'única llibertat que li queda.",
    success:
      "Molt bé! L'has capturada. Pel ko, ara Blanc NO pot recapturar de seguida: primer hauria de jugar en un altre lloc.",
    wrong: "La pedra blanca està en atari: busca la seva última llibertat.",
    black: ["C5", "D4", "D6"],
    white: ["D5", "E4", "E6", "F5"],
    goal: "capture",
    accept: ["E5"],
  },

  // ---------- Formes i tècnica ----------
  {
    id: "extensio",
    title: "Estendre's (nobi)",
    intro:
      "Quan l'enemic toca la teva pedra, sovint la millor resposta és estendre-la (nobi): afegir-hi una pedra al costat per fer el grup sòlid i amb més llibertats. Simple i fort.",
    task: "La blanca ha tocat la teva pedra. Reforça't estenent en línia (per exemple D3, C4 o E4).",
    success: "Bé! Estendre't dona un grup sòlid, difícil d'atacar.",
    wrong: "Afegeix una pedra tocant la teva D4 per fer-la més forta.",
    black: ["D4"],
    white: ["D5"],
    goal: "exact",
    accept: ["D3", "C4", "E4"],
  },
  {
    id: "hane",
    title: "Tombar per la punta (hane)",
    intro:
      "El «hane» és jugar en diagonal tocant l'enemic, envoltant-lo per la punta. És més agressiu que estendre: guanya terreny i pressiona, tot i que deixa un punt de tall a vigilar.",
    task: "Fes un hane sobre la pedra blanca: tomba per la punta (E5 o E3).",
    success: "Molt bé! El hane envolta la blanca i et dona iniciativa.",
    wrong: "Juga en diagonal des de la teva D4, tocant la blanca per dalt o per baix.",
    black: ["D4"],
    white: ["E4"],
    goal: "exact",
    accept: ["E5", "E3"],
  },
  {
    id: "connectar",
    title: "Connectar un punt de tall",
    intro:
      "Dues pedres separades per un espai tenen un «punt de tall»: si l'enemic hi juga, les parteix i les debilita. Connectar-les a temps les fa una sola cadena forta (com la junta de bambú del vault).",
    task: "L'enemic amenaça de tallar les teves dues pedres. Connecta-les pel punt de tall.",
    success: "Perfecte! Ara C4 i E4 són una sola cadena: l'enemic ja no les pot separar.",
    wrong: "El punt que uneix les teves dues pedres és entre elles.",
    black: ["C4", "E4"],
    white: ["D5"],
    goal: "exact",
    accept: ["D4"],
  },
  {
    id: "boca-tigre",
    title: "La boca del tigre",
    intro:
      "La «boca del tigre» són tres pedres que envolten un punt. Si l'enemic hi juga a dins, queda immediatament en atari. És una forma de connexió molt sòlida.",
    task: "Una pedra blanca ha entrat a la boca del tigre i està en atari. Captura-la.",
    success: "Molt bé! La boca del tigre castiga qui hi entra: pedra blanca capturada.",
    wrong: "La pedra blanca de dins la boca només té una llibertat. Tapa-la.",
    black: ["C4", "E4", "D5"],
    white: ["D4"],
    goal: "capture",
    accept: ["D3"],
  },
  {
    id: "triangle-buit",
    title: "Evita el triangle buit",
    intro:
      "El «triangle buit» són tres pedres en forma de L amb el quart punt del quadrat buit. És la forma dolenta per excel·lència: poques llibertats i molt ineficient. Val més estendre's cap a fora.",
    task: "Tens pedres a D4, D5 i E5. Estén el grup amb una bona forma (per exemple F5 o D6).",
    success: "Bé! Estendre's cap a fora dona una forma eficient i amb més llibertats.",
    wrong: "Prova una extensió cap a fora, com F5 o D6.",
    black: ["D4", "D5", "E5"],
    white: [],
    goal: "exact",
    accept: ["F5", "D6", "C4", "E6"],
    avoid: {
      vertex: "E4",
      message:
        "Jugar a E4 faria un triangle buit (les quatre caselles del quadrat amb tres pedres i un buit). És una forma ineficient: evita-la!",
    },
  },
  {
    id: "dos-ulls",
    title: "Fer dos ulls",
    intro:
      "Un grup amb dos «ulls» (dos espais buits separats i propis) és viu: no es pot capturar mai, perquè l'enemic no pot omplir els dos alhora. Amb un sol ull gros, encara es pot morir.",
    task: "El grup negre té un espai interior de tres. Juga el punt vital per fer-ne dos ulls.",
    success: "Perfecte! Ara el grup negre té dos ulls separats: és viu i no es pot capturar.",
    wrong: "Juga al centre de l'espai interior perquè quedin dos ulls a banda i banda.",
    black: [
      "B4", "C4", "D4", "E4", "F4",
      "B5", "F5",
      "B6", "C6", "D6", "E6", "F6",
    ],
    white: [],
    goal: "exact",
    accept: ["D5"],
  },

  // ---------- Estratègia ----------
  {
    id: "cantonades",
    title: "Primer les cantonades",
    intro:
      "Fer territori és més fàcil a les cantonades (les vores t'ajuden a tancar), després als costats, i el més difícil al centre. Per això les partides comencen ocupant cantonades.",
    task: "Fes una bona jugada d'obertura ocupant una cantonada (un punt 3-3: C3, G3, C7 o G7).",
    success: "Bona estratègia! Les cantonades són la manera més eficient de començar a fer territori.",
    wrong: "Juga en una cantonada, en un punt còmode com C3, G3, C7 o G7.",
    black: [],
    white: [],
    goal: "exact",
    accept: ["C3", "G3", "C7", "G7"],
  },
  {
    id: "obertura",
    title: "Obertura en 9×9",
    intro:
      "En un tauler petit el centre pesa molt. Les primeres jugades solen anar al punt central (tengen) o als punts d'estrella, buscant equilibri entre territori i influència.",
    task: "Fes una bona primera jugada: el centre (E5) o un punt d'estrella (C3, G3, C7, G7).",
    success: "Bona obertura! Has ocupat un punt important per al joc en 9×9.",
    wrong: "En 9×9, el centre i els punts d'estrella són les millors obertures.",
    black: [],
    white: [],
    goal: "exact",
    accept: ["E5", "C3", "G3", "C7", "G7"],
  },
];
