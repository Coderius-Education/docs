#!/usr/bin/env bash
# Controleert je eigen Ubuntu in WSL na een thema van de Linux-cursus.
#
#   bash controleer.sh 5
#   bash controleer.sh 6
#   bash controleer.sh 7
#
# Het script verandert niets: het kijkt alleen. Per controle staat er een ✓
# of een ✗, en bij een ✗ wat er mis is en waar het staat uitgelegd.
# Klaar met 0 als alles klopt, 1 als er iets niet klopt, 2 bij een verkeerd
# thema.

CURSUS="https://informatica.coderius.nl/linux"

# De bestanden waar het script naar kijkt. De tests van de cursus zetten
# hier een eigen versie neer.
OS_RELEASE="${CONTROLEER_OS_RELEASE:-/etc/os-release}"
PROC_VERSION="${CONTROLEER_PROC_VERSION:-/proc/version}"
WERKMAP="${CONTROLEER_WERKMAP:-$PWD}"

fouten=0

goed() {
  echo "✓ $1"
}

fout() {
  echo "✗ $1"
  echo "  $2"
  echo "  Zie $CURSUS/$3"
  fouten=$((fouten + 1))
}

# ── Thema 5: Linux op je eigen computer ──────────────────────────────────────

thema5() {
  if grep -qi microsoft "$PROC_VERSION" 2>/dev/null; then
    goed "Dit is Linux in WSL."
  else
    fout "Dit lijkt geen Linux in WSL." \
      "Start het script in Ubuntu, niet in PowerShell of op een andere computer." \
      "docs/wsl/installeren#stap-2-wsl-en-ubuntu-installeren"
  fi

  if grep -q '^VERSION_ID="24.04"' "$OS_RELEASE" 2>/dev/null; then
    goed "Ubuntu 24.04."
  else
    fout "Dit is geen Ubuntu 24.04." \
      "De lessen gaan uit van Ubuntu 24.04; een andere versie kan andere meldingen geven." \
      "docs/wsl/installeren#windows-kent-de-naam-ubuntu-2404-niet"
  fi

  case "$WERKMAP" in
    /mnt/*)
      fout "Je staat in een map van Windows: $WERKMAP" \
        "Zet je werk in je Linux-thuismap. Typ cd ~ en start het script daar." \
        "docs/wsl/windows-en-linux#waar-zet-je-je-projecten"
      ;;
    *)
      goed "Je werkt in een map van Linux."
      ;;
  esac

  if man -w ls >/dev/null 2>&1; then
    goed "man werkt."
  else
    fout "man vindt de handleiding van ls niet." \
      "Ubuntu is kleiner gemaakt zonder handleidingen. Zet ze terug met sudo unminimize." \
      "docs/wsl/hulp#this-system-has-been-minimized"
  fi
}

# ── Thema 6: Programma's, diensten en groepen ────────────────────────────────

thema6() {
  if id -nG | tr ' ' '\n' | grep -qx sudo; then
    goed "Je zit in de groep sudo."
  else
    fout "Je zit niet in de groep sudo." \
      "Dat gebeurt na usermod -G zonder -a. Typ in PowerShell: wsl -d Ubuntu-24.04 -u root usermod -aG sudo $USER" \
      "docs/wsl/groepen#sam-is-not-in-the-sudoers-file"
  fi

  if [ "$(ps -p 1 -o comm= 2>/dev/null)" = "systemd" ]; then
    goed "Ubuntu is opgestart met systemd."
  else
    fout "Ubuntu is niet opgestart met systemd." \
      "Dan werkt systemctl niet." \
      "docs/wsl/diensten#niet-opgestart-met-systemd"
  fi

  if command -v cowsay >/dev/null 2>&1; then
    goed "cowsay is geïnstalleerd."
  else
    fout "cowsay is niet geïnstalleerd." \
      "Installeer het met sudo apt update en sudo apt install cowsay." \
      "docs/wsl/apt#opdracht-61a-een-koe-die-praat"
  fi

  if [ -f ~/.bashrc ] && ! bash -n ~/.bashrc 2>/dev/null; then
    fout "Je ~/.bashrc heeft een fout." \
      "Zet de reservekopie terug met cp ~/.bashrc.bak ~/.bashrc, of verbeter het met nano." \
      "docs/wsl/nano#opdracht-62a-een-welkomstgroet"
  elif grep -q 'Welkom terug' ~/.bashrc 2>/dev/null; then
    goed "Je ~/.bashrc groet je."
  else
    fout "Je ~/.bashrc groet je nog niet." \
      "Zet onderaan de regel echo \"Welkom terug, \$USER\"." \
      "docs/wsl/nano#opdracht-62a-een-welkomstgroet"
  fi

  if systemctl is-active --quiet nginx 2>/dev/null || systemctl is-enabled --quiet nginx 2>/dev/null; then
    fout "nginx staat nog aan." \
      "Zet hem uit met sudo systemctl disable --now nginx." \
      "docs/wsl/diensten#opdracht-64a-nginx-uit"
  else
    goed "nginx staat uit."
  fi
}

# ── Thema 7: Netwerk ─────────────────────────────────────────────────────────

thema7() {
  if curl -sI -m 10 https://github.com >/dev/null 2>&1; then
    goed "Je komt op internet."
  else
    fout "curl krijgt geen antwoord van github.com." \
      "Kijk met ping en curl waar het probleem zit." \
      "docs/wsl/netwerk#opdracht-71b-waar-zit-het-probleem"
  fi

  if [ -f ~/.ssh/id_ed25519 ] && [ -f ~/.ssh/id_ed25519.pub ]; then
    goed "Je hebt een sleutelpaar."
    if [ "$(stat -c %a ~/.ssh/id_ed25519)" = "600" ]; then
      goed "Je privésleutel is alleen van jou."
    else
      fout "Ook anderen mogen je privésleutel lezen." \
        "Maak hem alleen van jou met chmod 600 ~/.ssh/id_ed25519." \
        "docs/wsl/ssh#unprotected-private-key-file"
    fi
  else
    fout "Er staat geen sleutelpaar in ~/.ssh." \
      "Maak er een met ssh-keygen -t ed25519." \
      "docs/wsl/ssh#een-sleutel-in-plaats-van-een-wachtwoord"
  fi

  if ssh -T -o BatchMode=yes -o ConnectTimeout=10 git@github.com 2>&1 | grep -q 'successfully authenticated'; then
    goed "GitHub kent je sleutel."
  else
    fout "GitHub kent je sleutel niet, of je komt er niet bij." \
      "Zet je publieke sleutel op GitHub, en probeer ssh -T git@github.com." \
      "docs/wsl/github#de-publieke-sleutel-op-github"
  fi

  if systemctl is-active --quiet ssh 2>/dev/null || systemctl is-enabled --quiet ssh.socket 2>/dev/null; then
    fout "De ssh-dienst op je laptop staat nog aan." \
      "Zet hem uit met sudo systemctl disable --now ssh.socket ssh." \
      "docs/wsl/tunnel#de-ssh-dienst-weer-uit"
  else
    goed "De ssh-dienst op je laptop staat uit."
  fi
}

case "${1:-}" in
  5) thema5 ;;
  6) thema6 ;;
  7) thema7 ;;
  *)
    echo "Gebruik: bash controleer.sh 5, 6 of 7 (het nummer van het thema)."
    exit 2
    ;;
esac

echo
if [ "$fouten" -eq 0 ]; then
  echo "Alles klopt."
  exit 0
fi
echo "$fouten keer ✗. Los het op en draai het script opnieuw."
exit 1
