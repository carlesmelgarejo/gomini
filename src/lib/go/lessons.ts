// Lliçons del tutorial interactiu. Cada lliçó munta una posició al tauler i
// demana una jugada concreta, validada amb el motor de regles. Els textos estan
// localitzats (ca/es/en). Formes basades en les notes del vault.

export type Goal = "capture" | "atari" | "doubleAtari" | "exact";

// Text localitzat.
export interface Loc {
  ca: string;
  es: string;
  en: string;
}

export interface Lesson {
  id: string;
  title: Loc;
  intro: Loc;
  task: Loc;
  success: Loc;
  wrong?: Loc;
  black: string[];
  white: string[];
  goal: Goal;
  accept: string[];
  avoid?: { vertex: string; message: Loc };
}

export const LESSONS: Lesson[] = [
  {
    id: "llibertats",
    title: {
      ca: "Llibertats i captura",
      es: "Libertades y captura",
      en: "Liberties and capture",
    },
    intro: {
      ca: "Cada pedra té llibertats: els punts buits del costat (a dalt, a baix, esquerra i dreta). Quan tapes l'última llibertat d'una pedra enemiga, la captures i la retires del tauler.",
      es: "Cada piedra tiene libertades: los puntos vacíos contiguos (arriba, abajo, izquierda y derecha). Cuando tapas la última libertad de una piedra enemiga, la capturas y la retiras del tablero.",
      en: "Each stone has liberties: the empty points next to it (up, down, left and right). When you fill an enemy stone's last liberty, you capture it and remove it from the board.",
    },
    task: {
      ca: "La pedra blanca del centre només té una llibertat. Captura-la.",
      es: "La piedra blanca del centro solo tiene una libertad. Captúrala.",
      en: "The white stone in the centre has only one liberty. Capture it.",
    },
    success: {
      ca: "Molt bé! En omplir la seva última llibertat, la pedra blanca ha quedat capturada.",
      es: "¡Muy bien! Al llenar su última libertad, la piedra blanca ha quedado capturada.",
      en: "Well done! By filling its last liberty, the white stone is captured.",
    },
    wrong: {
      ca: "Fixa't en quin punt buit toca la pedra blanca: aquella és la seva última llibertat.",
      es: "Fíjate en qué punto vacío toca la piedra blanca: esa es su última libertad.",
      en: "Look at which empty point the white stone touches: that's its last liberty.",
    },
    black: ["D5", "F5", "E6"],
    white: ["E5"],
    goal: "capture",
    accept: ["E4"],
  },
  {
    id: "cadena",
    title: {
      ca: "Capturar una cadena",
      es: "Capturar una cadena",
      en: "Capturing a chain",
    },
    intro: {
      ca: "Dues o més pedres del mateix color connectades formen una cadena i comparteixen les llibertats. Es capturen totes de cop quan s'omple l'última llibertat compartida.",
      es: "Dos o más piedras del mismo color conectadas forman una cadena y comparten las libertades. Se capturan todas a la vez cuando se llena la última libertad compartida.",
      en: "Two or more connected stones of the same colour form a chain and share liberties. They're all captured at once when the last shared liberty is filled.",
    },
    task: {
      ca: "Les dues pedres blanques formen una cadena en atari. Captura-la sencera.",
      es: "Las dos piedras blancas forman una cadena en atari. Captúrala entera.",
      en: "The two white stones form a chain in atari. Capture the whole chain.",
    },
    success: {
      ca: "Perfecte! Una sola jugada ha capturat tota la cadena blanca.",
      es: "¡Perfecto! Una sola jugada ha capturado toda la cadena blanca.",
      en: "Perfect! A single move captured the entire white chain.",
    },
    wrong: {
      ca: "La cadena blanca comparteix una única llibertat. Troba-la.",
      es: "La cadena blanca comparte una única libertad. Encuéntrala.",
      en: "The white chain shares a single liberty. Find it.",
    },
    black: ["D5", "F5", "E6", "D4", "F4"],
    white: ["E5", "E4"],
    goal: "capture",
    accept: ["E3"],
  },
  {
    id: "atari",
    title: {
      ca: "Posar en atari",
      es: "Poner en atari",
      en: "Putting in atari",
    },
    intro: {
      ca: "«Atari» vol dir que una pedra o cadena té una sola llibertat: està a punt de ser capturada. Amenaçar amb atari és una de les eines tàctiques bàsiques.",
      es: "«Atari» significa que una piedra o cadena tiene una sola libertad: está a punto de ser capturada. Amenazar con atari es una de las herramientas tácticas básicas.",
      en: "“Atari” means a stone or chain has only one liberty: it's about to be captured. Threatening atari is one of the basic tactical tools.",
    },
    task: {
      ca: "La pedra blanca té dues llibertats. Deixa-la en atari (amb una sola).",
      es: "La piedra blanca tiene dos libertades. Déjala en atari (con una sola).",
      en: "The white stone has two liberties. Put it in atari (leave it with one).",
    },
    success: {
      ca: "Exacte! Ara la pedra blanca està en atari i l'amenaces de captura.",
      es: "¡Exacto! Ahora la piedra blanca está en atari y la amenazas de captura.",
      en: "Exactly! The white stone is now in atari, threatened with capture.",
    },
    wrong: {
      ca: "Has de treure-li una de les dues llibertats perquè només li'n quedi una.",
      es: "Debes quitarle una de las dos libertades para que solo le quede una.",
      en: "Take away one of its two liberties so it has only one left.",
    },
    black: ["D5", "E6"],
    white: ["E5"],
    goal: "atari",
    accept: ["E4", "F5"],
  },
  {
    id: "doble-atari",
    title: {
      ca: "Doble atari",
      es: "Doble atari",
      en: "Double atari",
    },
    intro: {
      ca: "El doble atari amenaça dues pedres alhora amb una sola jugada: l'enemic només en pot salvar una, així que segur que en captures alguna. És una tàctica molt rendible.",
      es: "El doble atari amenaza dos piedras a la vez con una sola jugada: el enemigo solo puede salvar una, así que seguro que capturas alguna. Es una táctica muy rentable.",
      en: "A double atari threatens two stones at once with a single move: your opponent can only save one, so you're sure to capture something. A very profitable tactic.",
    },
    task: {
      ca: "Juga el punt que deixa en atari les DUES pedres blanques a la vegada.",
      es: "Juega el punto que deja en atari las DOS piedras blancas a la vez.",
      en: "Play the point that puts BOTH white stones in atari at once.",
    },
    success: {
      ca: "Brillant! Doble atari: l'enemic només en pot salvar una i tu captures l'altra.",
      es: "¡Brillante! Doble atari: el enemigo solo puede salvar una y tú capturas la otra.",
      en: "Brilliant! Double atari: your opponent saves one and you capture the other.",
    },
    wrong: {
      ca: "Busca el punt que toca les dues pedres blanques i els treu una llibertat a cadascuna.",
      es: "Busca el punto que toca las dos piedras blancas y les quita una libertad a cada una.",
      en: "Find the point that touches both white stones and removes a liberty from each.",
    },
    black: ["C4", "D3", "G4", "F3"],
    white: ["D4", "F4"],
    goal: "doubleAtari",
    accept: ["E4"],
  },
  {
    id: "ko",
    title: { ca: "El ko", es: "El ko", en: "The ko" },
    intro: {
      ca: "El ko és una situació on es podria capturar i recapturar la mateixa pedra indefinidament. La regla del ko ho prohibeix: després de capturar, l'adversari no pot recuperar la posició immediatament; ha de jugar en un altre lloc primer.",
      es: "El ko es una situación donde se podría capturar y recapturar la misma piedra indefinidamente. La regla del ko lo prohíbe: tras capturar, el adversario no puede recuperar la posición de inmediato; debe jugar en otro lugar primero.",
      en: "A ko is a situation where the same stone could be captured and recaptured forever. The ko rule forbids it: after a capture, the opponent can't restore the position immediately; they must play elsewhere first.",
    },
    task: {
      ca: "Captura la pedra blanca del ko jugant a l'única llibertat que li queda.",
      es: "Captura la piedra blanca del ko jugando en la única libertad que le queda.",
      en: "Capture the white ko stone by playing its only remaining liberty.",
    },
    success: {
      ca: "Molt bé! L'has capturada. Pel ko, ara Blanc NO pot recapturar de seguida: primer hauria de jugar en un altre lloc.",
      es: "¡Muy bien! La has capturado. Por el ko, ahora Blanco NO puede recapturar enseguida: primero debería jugar en otro lugar.",
      en: "Well done! You captured it. By the ko rule, White can NOT recapture right away: they'd have to play elsewhere first.",
    },
    wrong: {
      ca: "La pedra blanca està en atari: busca la seva última llibertat.",
      es: "La piedra blanca está en atari: busca su última libertad.",
      en: "The white stone is in atari: find its last liberty.",
    },
    black: ["C5", "D4", "D6"],
    white: ["D5", "E4", "E6", "F5"],
    goal: "capture",
    accept: ["E5"],
  },
  {
    id: "extensio",
    title: {
      ca: "Estendre's (nobi)",
      es: "Extenderse (nobi)",
      en: "Extending (nobi)",
    },
    intro: {
      ca: "Quan l'enemic toca la teva pedra, sovint la millor resposta és estendre-la (nobi): afegir-hi una pedra al costat per fer el grup sòlid i amb més llibertats. Simple i fort.",
      es: "Cuando el enemigo toca tu piedra, a menudo la mejor respuesta es extenderla (nobi): añadir una piedra al lado para hacer el grupo sólido y con más libertades. Simple y fuerte.",
      en: "When the opponent touches your stone, often the best reply is to extend (nobi): add a stone alongside to make the group solid with more liberties. Simple and strong.",
    },
    task: {
      ca: "La blanca ha tocat la teva pedra. Reforça't estenent en línia (per exemple D3, C4 o E4).",
      es: "La blanca ha tocado tu piedra. Refuérzate extendiéndote en línea (por ejemplo D3, C4 o E4).",
      en: "White has touched your stone. Reinforce by extending in a line (e.g. D3, C4 or E4).",
    },
    success: {
      ca: "Bé! Estendre't dona un grup sòlid, difícil d'atacar.",
      es: "¡Bien! Extenderte da un grupo sólido, difícil de atacar.",
      en: "Good! Extending gives a solid group that's hard to attack.",
    },
    wrong: {
      ca: "Afegeix una pedra tocant la teva D4 per fer-la més forta.",
      es: "Añade una piedra tocando tu D4 para hacerla más fuerte.",
      en: "Add a stone touching your D4 to make it stronger.",
    },
    black: ["D4"],
    white: ["D5"],
    goal: "exact",
    accept: ["D3", "C4", "E4"],
  },
  {
    id: "hane",
    title: {
      ca: "Tombar per la punta (hane)",
      es: "Doblar por la punta (hane)",
      en: "Turning the corner (hane)",
    },
    intro: {
      ca: "El «hane» és jugar en diagonal tocant l'enemic, envoltant-lo per la punta. És més agressiu que estendre: guanya terreny i pressiona, tot i que deixa un punt de tall a vigilar.",
      es: "El «hane» es jugar en diagonal tocando al enemigo, rodeándolo por la punta. Es más agresivo que extenderse: gana terreno y presiona, aunque deja un punto de corte que vigilar.",
      en: "A “hane” is playing diagonally against the enemy, wrapping around it. More aggressive than extending: it gains ground and pressures, though it leaves a cutting point to watch.",
    },
    task: {
      ca: "Fes un hane sobre la pedra blanca: tomba per la punta (E5 o E3).",
      es: "Haz un hane sobre la piedra blanca: dobla por la punta (E5 o E3).",
      en: "Play a hane over the white stone: turn the corner (E5 or E3).",
    },
    success: {
      ca: "Molt bé! El hane envolta la blanca i et dona iniciativa.",
      es: "¡Muy bien! El hane rodea a la blanca y te da iniciativa.",
      en: "Great! The hane wraps around White and gives you initiative.",
    },
    wrong: {
      ca: "Juga en diagonal des de la teva D4, tocant la blanca per dalt o per baix.",
      es: "Juega en diagonal desde tu D4, tocando la blanca por arriba o por abajo.",
      en: "Play diagonally from your D4, touching White above or below.",
    },
    black: ["D4"],
    white: ["E4"],
    goal: "exact",
    accept: ["E5", "E3"],
  },
  {
    id: "connectar",
    title: {
      ca: "Connectar un punt de tall",
      es: "Conectar un punto de corte",
      en: "Connecting a cutting point",
    },
    intro: {
      ca: "Dues pedres separades per un espai tenen un «punt de tall»: si l'enemic hi juga, les parteix i les debilita. Connectar-les a temps les fa una sola cadena forta (com la junta de bambú).",
      es: "Dos piedras separadas por un espacio tienen un «punto de corte»: si el enemigo juega ahí, las parte y las debilita. Conectarlas a tiempo las hace una sola cadena fuerte (como la junta de bambú).",
      en: "Two stones with a gap between them have a “cutting point”: if the enemy plays there, it splits and weakens them. Connecting in time makes them one strong chain (like the bamboo joint).",
    },
    task: {
      ca: "L'enemic amenaça de tallar les teves dues pedres. Connecta-les pel punt de tall.",
      es: "El enemigo amenaza con cortar tus dos piedras. Conéctalas por el punto de corte.",
      en: "The enemy threatens to cut your two stones. Connect them at the cutting point.",
    },
    success: {
      ca: "Perfecte! Ara C4 i E4 són una sola cadena: l'enemic ja no les pot separar.",
      es: "¡Perfecto! Ahora C4 y E4 son una sola cadena: el enemigo ya no puede separarlas.",
      en: "Perfect! C4 and E4 are now one chain: the enemy can't split them anymore.",
    },
    wrong: {
      ca: "El punt que uneix les teves dues pedres és entre elles.",
      es: "El punto que une tus dos piedras está entre ellas.",
      en: "The point that joins your two stones is between them.",
    },
    black: ["C4", "E4"],
    white: ["D5"],
    goal: "exact",
    accept: ["D4"],
  },
  {
    id: "boca-tigre",
    title: {
      ca: "La boca del tigre",
      es: "La boca del tigre",
      en: "The tiger's mouth",
    },
    intro: {
      ca: "La «boca del tigre» són tres pedres que envolten un punt. Si l'enemic hi juga a dins, queda immediatament en atari. És una forma de connexió molt sòlida.",
      es: "La «boca del tigre» son tres piedras que rodean un punto. Si el enemigo juega dentro, queda inmediatamente en atari. Es una forma de conexión muy sólida.",
      en: "The “tiger's mouth” is three stones surrounding a point. If the enemy plays inside, it's immediately in atari. A very solid connecting shape.",
    },
    task: {
      ca: "Una pedra blanca ha entrat a la boca del tigre i està en atari. Captura-la.",
      es: "Una piedra blanca ha entrado en la boca del tigre y está en atari. Captúrala.",
      en: "A white stone entered the tiger's mouth and is in atari. Capture it.",
    },
    success: {
      ca: "Molt bé! La boca del tigre castiga qui hi entra: pedra blanca capturada.",
      es: "¡Muy bien! La boca del tigre castiga a quien entra: piedra blanca capturada.",
      en: "Great! The tiger's mouth punishes whoever enters: white stone captured.",
    },
    wrong: {
      ca: "La pedra blanca de dins la boca només té una llibertat. Tapa-la.",
      es: "La piedra blanca dentro de la boca solo tiene una libertad. Tápala.",
      en: "The white stone inside the mouth has only one liberty. Fill it.",
    },
    black: ["C4", "E4", "D5"],
    white: ["D4"],
    goal: "capture",
    accept: ["D3"],
  },
  {
    id: "triangle-buit",
    title: {
      ca: "Evita el triangle buit",
      es: "Evita el triángulo vacío",
      en: "Avoid the empty triangle",
    },
    intro: {
      ca: "El «triangle buit» són tres pedres en forma de L amb el quart punt del quadrat buit. És la forma dolenta per excel·lència: poques llibertats i molt ineficient. Val més estendre's cap a fora.",
      es: "El «triángulo vacío» son tres piedras en forma de L con el cuarto punto del cuadrado vacío. Es la forma mala por excelencia: pocas libertades y muy ineficiente. Es mejor extenderse hacia fuera.",
      en: "The “empty triangle” is three stones in an L with the fourth square point empty. The bad shape par excellence: few liberties and very inefficient. Better to extend outward.",
    },
    task: {
      ca: "Tens pedres a D4, D5 i E5. Estén el grup amb una bona forma (per exemple F5 o D6).",
      es: "Tienes piedras en D4, D5 y E5. Extiende el grupo con una buena forma (por ejemplo F5 o D6).",
      en: "You have stones at D4, D5 and E5. Extend the group with good shape (e.g. F5 or D6).",
    },
    success: {
      ca: "Bé! Estendre's cap a fora dona una forma eficient i amb més llibertats.",
      es: "¡Bien! Extenderse hacia fuera da una forma eficiente y con más libertades.",
      en: "Good! Extending outward gives an efficient shape with more liberties.",
    },
    wrong: {
      ca: "Prova una extensió cap a fora, com F5 o D6.",
      es: "Prueba una extensión hacia fuera, como F5 o D6.",
      en: "Try an outward extension, like F5 or D6.",
    },
    black: ["D4", "D5", "E5"],
    white: [],
    goal: "exact",
    accept: ["F5", "D6", "C4", "E6"],
    avoid: {
      vertex: "E4",
      message: {
        ca: "Jugar a E4 faria un triangle buit (les quatre caselles del quadrat amb tres pedres i un buit). És una forma ineficient: evita-la!",
        es: "Jugar en E4 haría un triángulo vacío (las cuatro casillas del cuadrado con tres piedras y un hueco). Es una forma ineficiente: ¡evítala!",
        en: "Playing E4 would make an empty triangle (the four square points with three stones and a gap). It's inefficient: avoid it!",
      },
    },
  },
  {
    id: "dos-ulls",
    title: {
      ca: "Fer dos ulls",
      es: "Hacer dos ojos",
      en: "Making two eyes",
    },
    intro: {
      ca: "Un grup amb dos «ulls» (dos espais buits separats i propis) és viu: no es pot capturar mai, perquè l'enemic no pot omplir els dos alhora. Amb un sol ull gros, encara es pot morir.",
      es: "Un grupo con dos «ojos» (dos espacios vacíos separados y propios) está vivo: no se puede capturar nunca, porque el enemigo no puede llenar los dos a la vez. Con un solo ojo grande, aún puede morir.",
      en: "A group with two “eyes” (two separate own empty spaces) is alive: it can never be captured, because the enemy can't fill both at once. With a single big eye, it can still die.",
    },
    task: {
      ca: "El grup negre té un espai interior de tres. Juga el punt vital per fer-ne dos ulls.",
      es: "El grupo negro tiene un espacio interior de tres. Juega el punto vital para hacer dos ojos.",
      en: "The black group has an inner space of three. Play the vital point to make two eyes.",
    },
    success: {
      ca: "Perfecte! Ara el grup negre té dos ulls separats: és viu i no es pot capturar.",
      es: "¡Perfecto! Ahora el grupo negro tiene dos ojos separados: está vivo y no se puede capturar.",
      en: "Perfect! The black group now has two separate eyes: it's alive and can't be captured.",
    },
    wrong: {
      ca: "Juga al centre de l'espai interior perquè quedin dos ulls a banda i banda.",
      es: "Juega en el centro del espacio interior para que queden dos ojos a cada lado.",
      en: "Play the centre of the inner space so two eyes remain on each side.",
    },
    black: [
      "B4", "C4", "D4", "E4", "F4",
      "B5", "F5",
      "B6", "C6", "D6", "E6", "F6",
    ],
    white: [],
    goal: "exact",
    accept: ["D5"],
  },
  {
    id: "cantonades",
    title: {
      ca: "Primer les cantonades",
      es: "Primero las esquinas",
      en: "Corners first",
    },
    intro: {
      ca: "Fer territori és més fàcil a les cantonades (les vores t'ajuden a tancar), després als costats, i el més difícil al centre. Per això les partides comencen ocupant cantonades.",
      es: "Hacer territorio es más fácil en las esquinas (los bordes ayudan a cerrar), luego en los lados, y lo más difícil en el centro. Por eso las partidas empiezan ocupando esquinas.",
      en: "Making territory is easiest in the corners (the edges help you enclose), then on the sides, and hardest in the centre. That's why games start by taking corners.",
    },
    task: {
      ca: "Fes una bona jugada d'obertura ocupant una cantonada (un punt 3-3: C3, G3, C7 o G7).",
      es: "Haz una buena jugada de apertura ocupando una esquina (un punto 3-3: C3, G3, C7 o G7).",
      en: "Make a good opening move by taking a corner (a 3-3 point: C3, G3, C7 or G7).",
    },
    success: {
      ca: "Bona estratègia! Les cantonades són la manera més eficient de començar a fer territori.",
      es: "¡Buena estrategia! Las esquinas son la forma más eficiente de empezar a hacer territorio.",
      en: "Good strategy! Corners are the most efficient way to start making territory.",
    },
    wrong: {
      ca: "Juga en una cantonada, en un punt còmode com C3, G3, C7 o G7.",
      es: "Juega en una esquina, en un punto cómodo como C3, G3, C7 o G7.",
      en: "Play in a corner, at a comfortable point like C3, G3, C7 or G7.",
    },
    black: [],
    white: [],
    goal: "exact",
    accept: ["C3", "G3", "C7", "G7"],
  },
  {
    id: "obertura",
    title: {
      ca: "Obertura en 9×9",
      es: "Apertura en 9×9",
      en: "Opening on 9×9",
    },
    intro: {
      ca: "En un tauler petit el centre pesa molt. Les primeres jugades solen anar al punt central (tengen) o als punts d'estrella, buscant equilibri entre territori i influència.",
      es: "En un tablero pequeño el centro pesa mucho. Las primeras jugadas suelen ir al punto central (tengen) o a los puntos de estrella, buscando equilibrio entre territorio e influencia.",
      en: "On a small board the centre matters a lot. Opening moves usually go to the central point (tengen) or the star points, balancing territory and influence.",
    },
    task: {
      ca: "Fes una bona primera jugada: el centre (E5) o un punt d'estrella (C3, G3, C7, G7).",
      es: "Haz una buena primera jugada: el centro (E5) o un punto de estrella (C3, G3, C7, G7).",
      en: "Make a good first move: the centre (E5) or a star point (C3, G3, C7, G7).",
    },
    success: {
      ca: "Bona obertura! Has ocupat un punt important per al joc en 9×9.",
      es: "¡Buena apertura! Has ocupado un punto importante para el juego en 9×9.",
      en: "Good opening! You took an important point for 9×9 play.",
    },
    wrong: {
      ca: "En 9×9, el centre i els punts d'estrella són les millors obertures.",
      es: "En 9×9, el centro y los puntos de estrella son las mejores aperturas.",
      en: "On 9×9, the centre and the star points are the best openings.",
    },
    black: [],
    white: [],
    goal: "exact",
    accept: ["E5", "C3", "G3", "C7", "G7"],
  },
];
