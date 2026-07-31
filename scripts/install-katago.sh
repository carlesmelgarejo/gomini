#!/usr/bin/env bash
# Instal·lador de KataGo (CPU) per a go.elclic.net.
#
# Descarrega el binari d'Eigen amb AVX2 (CPU, ràpid en processadors moderns com
# el Tiger Lake del ZenBook) i un model de xarxa neuronal, i els deixa a
# /opt/katago. En acabar, imprimeix les variables d'entorn que has de posar al
# fitxer .env.local del projecte.
#
# Ús:   bash scripts/install-katago.sh
# (Necessita sudo per escriure a /opt i les eines wget i unzip.)

set -euo pipefail

KATAGO_VERSION="v1.16.4"
# Build de CPU amb AVX2. Si en executar-lo dona "Illegal instruction", canvia
# "eigenavx2" per "eigen" (build de CPU compatible amb qualsevol processador).
BUILD="katago-${KATAGO_VERSION}-eigenavx2-linux-x64.zip"
BUILD_URL="https://github.com/lightvector/KataGo/releases/download/${KATAGO_VERSION}/${BUILD}"
BUILD_SHA256="c0503d0d7b70d850a4829a695d1bdb2477152834ef3ec8e37f11f556e495d9ee"

# Model (xarxa neuronal). b20c256 és un bon equilibri per a CPU en 9x9.
# (Per gastar menys RAM, un net més petit b10/b6 de katagotraining.org va molt bé.)
MODEL="g170e-b20c256x2-s5303129600-d1228401921.bin.gz"
MODEL_URL="https://github.com/lightvector/KataGo/releases/download/v1.4.5/${MODEL}"

DEST="/opt/katago"

echo "==> Instal·lant dependències (unzip, wget)"
sudo apt-get update -qq
sudo apt-get install -y unzip wget

echo "==> Creant $DEST"
sudo mkdir -p "$DEST/models"
cd "$DEST"

echo "==> Descarregant KataGo $KATAGO_VERSION (build CPU eigenavx2)"
sudo wget -q --show-progress -O "$BUILD" "$BUILD_URL"
echo "$BUILD_SHA256  $BUILD" | sha256sum -c - || {
  echo "ERROR: el checksum no coincideix. Atura't i comprova la descàrrega."; exit 1;
}
sudo unzip -o "$BUILD"

echo "==> Descarregant el model"
sudo wget -q --show-progress -O "models/$MODEL" "$MODEL_URL"

# El binari pot quedar a l'arrel o dins d'una subcarpeta segons la versió.
KATAGO_BIN_PATH="$(find "$DEST" -maxdepth 2 -type f -name katago | head -n1)"
sudo chmod +x "$KATAGO_BIN_PATH"

echo "==> Comprovant"
"$KATAGO_BIN_PATH" version || true

cat <<EOF

===========================================================
KataGo instal·lat. Posa això al fitxer .env.local del projecte
(go.elclic.net), ajustant la ruta del repo a KATAGO_CONFIG:

KATAGO_BIN=$KATAGO_BIN_PATH
KATAGO_MODEL=$DEST/models/$MODEL
KATAGO_CONFIG=<RUTA_AL_REPO>/katago-config/analysis.cfg

(KATAGO_CONFIG ha d'apuntar al fitxer del repo:
 /home/carles/Repositori/go.elclic.net/katago-config/analysis.cfg)
===========================================================
EOF
