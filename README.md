# GoMini — gomini.elclic.net

Web app per jugar al **Go en tauler petit (7×7 i 9×9) contra KataGo**. Feta amb **Next.js 15 (App Router) + TypeScript**, sense dependències de UI externes: el tauler és SVG i les regles estan escrites en TypeScript. L'oponent és **KataGo** (motor d'anàlisi) darrere una API route, amb un bot ràpid com a alternativa lleugera.

## Què fa

- **Selector de tauler 7×7 / 9×9** (el motor és genèric en la mida; komi 9 en 7×7 i 7 en 9×9).
- Tauler en SVG amb textura de fusta i relleu 3D, pedres mates amb textura, coordenades al marge, previsualització en passar el ratolí i marca de l'última jugada.
- Motor de regles complet: llibertats, captures, **regla del ko**, **prohibició del suïcidi**, passar i final de partida.
- **Compte per àrea** (estil xinès) amb komi segons la mida al final de la partida.
- **Fase de recompte** en acabar la partida (dues passades): pots **marcar pedres mortes** tocant-les (es commuta tot el grup connex), es dibuixen atenuades i es tracten com a capturades. El **territori** de cada color es marca amb un quadradet (negre/blanc) a les interseccions buides que envolta un sol color; els punts neutrals (dame) no es marquen. El compte i els marcadors es **recalculen en viu** i hi ha un botó per **finalitzar el recompte** (i reprendre'l). Funciona a desktop i a mòbil.
- **Selector d'oponent**: bot ràpid (instantani, sense càrrega) o KataGo (sota demanda).
- **Tema clar/fosc** i partida que **es desa i es reprèn** després d'un refresc.
- **Trilingüe** (català, castellà, anglès) amb selector d'idioma; i18n propi sense llibreries (`src/lib/i18n.tsx`), textos de les lliçons localitzats a `lessons.ts`.
- Oponent **KataGo** amb **dificultat ajustable** (Fàcil / Mitjà / Difícil → menys o més _visits_).
- **Bot heurístic de reserva**: si KataGo no està configurat o no respon, l'app segueix jugable amb un oponent senzill en TypeScript. Quan KataGo hi és, mana ell.
- **Botó de pista**: ressalta al tauler la millor jugada segons KataGo i mostra la seva valoració (probabilitat de guanyar, punts esperats i seqüència prevista).
- **Tutorial interactiu** (`/aprendre`): 13 lliçons pas a pas amb posicions preparades, validades amb el motor de regles. Fonaments (llibertats, captura, cadenes, atari, doble atari, ko), formes i tècnica (estendre's/nobi, hane, connectar punts de tall, boca del tigre, triangle buit, dos ulls) i estratègia (cantonades primer, obertura en 9×9).
- Controls: passar, pista, desfer, nova partida.
- **Tema clar/fosc** amb un toggle (☀️/🌙) que recorda la teva preferència. Tauler amb textura de fusta i relleu 3D, pedres glossy.

## Executar en local

```bash
npm install
npm run dev      # http://localhost:3000
```

Sense configurar KataGo ja pots jugar (bot de reserva). Per activar KataGo, mira
la secció següent.

## Configurar KataGo

> **KataGo NO és als repositoris d'Ubuntu** (`apt install katago` falla). S'instal·la
> baixant un binari precompilat de GitHub. En CPU (sense GPU) es fa servir la build
> **Eigen**; en processadors moderns, la variant **eigenavx2** és més ràpida.

### Opció ràpida: script

```bash
bash scripts/install-katago.sh
```

Baixa la build de CPU (eigenavx2) de KataGo v1.16.4 i un model, els deixa a
`/opt/katago` i t'imprimeix les variables d'entorn a posar al `.env.local`.

### Opció manual

1. **Binari** (CPU, AVX2) — [releases de KataGo](https://github.com/lightvector/KataGo/releases):

   ```bash
   cd /opt && sudo mkdir -p katago && cd katago
   sudo wget https://github.com/lightvector/KataGo/releases/download/v1.16.4/katago-v1.16.4-eigenavx2-linux-x64.zip
   sudo apt install unzip -y && sudo unzip katago-v1.16.4-eigenavx2-linux-x64.zip
   ./katago version
   ```

   Si dona `Illegal instruction`, fes servir la build `katago-v1.16.4-eigen-linux-x64.zip`
   (compatible amb qualsevol CPU).

2. **Model** (xarxa neuronal):

   ```bash
   sudo mkdir -p /opt/katago/models && cd /opt/katago/models
   sudo wget https://github.com/lightvector/KataGo/releases/download/v1.4.5/g170e-b20c256x2-s5303129600-d1228401921.bin.gz
   ```

   Per gastar **menys RAM** (recomanat en portàtils), fes servir un net més petit
   (b10 o b6): en 9×9 juga de sobres i n'hi ha a la pàgina de xarxes de
   [katagotraining.org](https://katagotraining.org/networks). Nets grans (b20, b40)
   juguen més fort però gasten força més memòria.

3. **Variables d'entorn** (copia `.env.example` a `.env.local`):

   ```
   KATAGO_BIN=/opt/katago/katago
   KATAGO_MODEL=/opt/katago/models/g170e-b20c256x2-s5303129600-d1228401921.bin.gz
   KATAGO_CONFIG=/ruta/al/repo/katago-config/analysis.cfg
   ```

   El fitxer `katago-config/analysis.cfg` ja ve al repo amb valors base per a CPU/9x9.

4. Reinicia `npm run dev` (o l'app en producció). Al panell hauràs de veure que
   l'oponent és **KataGo** en comptes del bot de reserva.

### Dificultat

La força es controla amb el nombre de _visits_ de KataGo per jugada
(`src/lib/go/remoteEngine.ts`):

| Nivell  | visits | Notes                                 |
| ------- | ------ | ------------------------------------- |
| Fàcil   | 8      | ràpid i assequible                    |
| Mitjà   | 80     | equilibrat                            |
| Difícil | 600    | fort; més CPU i uns segons per jugada |

Ajusta aquests números al gust segons la potència del teu Hetzner.

## Estructura

```
src/
  app/
    layout.tsx            html base (ca) i metadades
    page.tsx              pàgina principal (client)
    globals.css           estil (tema fusta fosc, modern)
    aprendre/page.tsx     pàgina del tutorial interactiu
    api/move/route.ts     API: rep la partida i torna la jugada de KataGo
    api/hint/route.ts     API: jugada recomanada + valoració (pista)
    api/engine/route.ts   API: comprova si KataGo està disponible
  components/
    GoBoard.tsx           tauler SVG interactiu (pedres, hover, pista)
    GamePanel.tsx         motor, dificultat, pista, captures, resultat, controls
    Tutorial.tsx          tutorial interactiu (lliçons + validació)
  hooks/
    useGoGame.ts          orquestra la partida, el torn de la màquina i les pistes
  lib/go/
    types.ts              tipus (Player, Move, Score…)
    board.ts              motor de tauler: grups, captures, ko, suïcidi, historial
    scoring.ts            compte per àrea + komi
    engine.ts             interfície GoEngine + bot heurístic (reserva)
    remoteEngine.ts       client KataGo (compleix GoEngine) + dificultat + pistes
    vertex.ts             conversió punt intern ↔ vèrtex GTP ("E5")
    lessons.ts            contingut de les lliçons del tutorial
  server/
    katago.ts             gestor del procés `katago analysis` (només servidor)
katago-config/
  analysis.cfg            config base del motor d'anàlisi
```

La lògica de regles (`lib/go`) no depèn de React i es pot provar de manera aïllada.

## Com parla amb KataGo

L'app fa servir el **motor d'anàlisi** de KataGo (`katago analysis`), no el GTP:
és _stateless_, així que cada jugada envia la partida sencera i demana la millor
jugada amb un límit de _visits_. Això evita gestionar estat o desincronitzacions,
i permet canviar la dificultat jugada a jugada. `src/server/katago.ts` manté un
únic procés de KataGo i hi encua les consultes per `id`.

## Desplegament a Hetzner (CloudPanel + PM2 + GitHub Actions)

Mateix patró que ScribaAI: build **standalone** servit amb **PM2** darrere el
proxy de CloudPanel, i **desplegament automàtic** a cada `push` a `main`.

Fitxers al repo: `next.config.mjs` (`output: "standalone"`), `ecosystem.config.js`
(PM2), `deploy.sh` (build + PM2) i `.github/workflows/deploy.yml` (CI/CD).

### Preparació del servidor (un sol cop)

1. **CloudPanel:** crear un _Node.js Site_ per al domini (p. ex. `gomini.elclic.net`),
   Node 22, i anotar l'**App Port** assignat. Usuari del site: `gomini` (connecta't
   sempre per SSH com aquest usuari).
2. **Node 22 + PM2** via nvm (sense root):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   source ~/.nvm/nvm.sh && nvm install 22 && nvm alias default 22
   npm install -g pm2
   ```
3. **Clonar el repo** dins la carpeta del site (repo públic → HTTPS):
   ```bash
   cd ~/htdocs/gomini.elclic.net
   find . -mindepth 1 -delete
   git clone https://github.com/carlesmelgarejo/gomini.git .
   ```
4. **`.env.local`** (no és al repo). Com a mínim el port; KataGo és opcional
   (sense ell, l'app juga amb el bot ràpid):
   ```
   PORT=<App Port del site>
   # Opcional, només si instal·les KataGo al servidor:
   # KATAGO_BIN=/opt/katago/katago
   # KATAGO_MODEL=/opt/katago/models/....bin.gz
   # KATAGO_CONFIG=/home/gomini/htdocs/gomini.elclic.net/katago-config/analysis.cfg
   ```
5. Primer desplegament manual: `bash deploy.sh`.
6. **SSL** Let's Encrypt des de CloudPanel. El proxy de CloudPanel ja redirigeix
   al `PORT`; no cal tocar `client_max_body_size` (no hi ha pujades grans).
7. **Persistència PM2:** `pm2 save` (el fa `deploy.sh`) + `pm2 startup` si vols
   resurrecció al reinici.

### Desplegament automàtic (GitHub Actions)

1. **Clau SSH de desplegament** dedicada (com a usuari `gomini`):
   ```bash
   ssh-keygen -t ed25519 -f ~/deploy_key -N ""
   cat ~/deploy_key.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys
   cat ~/deploy_key   # la PRIVADA → secret de GitHub
   ```
2. **Secrets del repo** (Settings → Secrets and variables → Actions):
   - `SSH_HOST`: IP del servidor · `SSH_USER`: `gomini` · `SSH_PORT`: `22`
   - `SSH_KEY`: contingut de la clau **privada** (`~/deploy_key`)
   - `PROJECT_DIR`: `/home/gomini/htdocs/gomini.elclic.net`
3. A partir d'aquí, cada `push` a `main` desplega sol (entra per SSH, fa
   `git reset --hard origin/main` i `bash deploy.sh`). També es pot llançar a mà
   des de la pestanya _Actions_.

> El workflow **no conté secrets** (viuen a GitHub Secrets). `.env.local` està al
> `.gitignore` i no es toca mai en desplegar.

## No indexació

`src/app/robots.ts` bloqueja tots els cercadors i la metadada de `layout.tsx`
inclou `robots: { index: false, follow: false }`, així GoMini **no s'indexa**.

## KataGo al servidor (opcional)

KataGo NO cal per desplegar: sense les variables `KATAGO_*`, l'app juga amb el bot
ràpid. Si vols KataGo en producció, instal·la'l al servidor (CPU/Eigen + model
petit) i defineix les `KATAGO_*` al `.env.local`. Mantenir un procés de KataGo viu
consumeix memòria i CPU; en 9×9 amb un model petit és assumible.
