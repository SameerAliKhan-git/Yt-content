# Video analysis setup

Two environments matter: **this Linux container** (where Claude runs) and
**your own computer**. They are not the same machine.

---

## This container — DONE and tested

| Tool | Status |
|---|---|
| Python | ✅ 3.13.18, preinstalled |
| ffmpeg / ffprobe | ✅ 6.1.1, preinstalled |
| yt-dlp | ✅ 2026.10.26, installed into `/tmp/vaenv` |
| faster-whisper | ✅ 1.2.1, installed (with `av<14` — see below) |

```bash
/tmp/vaenv/bin/python video/analyze_reference.py <URL-or-local> --out build/refs/<name>
```

Produces `shots.json`, `contact_sheet.png`, `transcript.json` (word timings),
`transcript.txt` and `report.md` (shot count, median shot length, cuts/min, wpm).

**Gotcha already hit and fixed:** faster-whisper 1.2.1 breaks on PyAV ≥14
(`av.open() got an unexpected keyword argument 'metadata_errors'`). Pin `av<14`.

**⚠️ YouTube downloads are blocked from this container.** Metadata works, but a
download returns HTTP 429 and *"Sign in to confirm you're not a bot"* — YouTube
blocks datacenter IPs. Options:

1. Run the analyser **on your own machine**, where your residential IP and
   browser cookies work, then share the outputs.
2. Export cookies and pass `--cookies-from-browser chrome` (supported by the
   script) — but cookies from your logged-in account sent through a datacenter
   IP can put the account at risk. I would not.
3. Download on your machine and drop the file in — local files analyse fine.

---

## Your computer

### Windows

```powershell
winget install -e --id Python.Python.3.12
winget install -e --id Gyan.FFmpeg
winget install -e --id yt-dlp.yt-dlp
pip install --upgrade "faster-whisper" "av<14"
```

**PATH as a user environment variable** (no admin needed, persists, not a
PowerShell profile):

```powershell
# shows where winget put things
where.exe ffmpeg; where.exe yt-dlp; where.exe python

# append a folder to the USER PATH permanently
$p = [Environment]::GetEnvironmentVariable('Path','User')
[Environment]::SetEnvironmentVariable('Path', "$p;C:\path\to\folder", 'User')
```

Sign out and back in (or restart the app) for a new PATH to be picked up.

**If something needs admin rights** — run an elevated PowerShell
(Win+X → "Terminal (Admin)") and use:

```powershell
winget install -e --id Gyan.FFmpeg --scope machine
```

Only use `--scope machine` if the per-user install failed; per-user needs no admin.

### macOS

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install python ffmpeg yt-dlp
pip3 install --upgrade "faster-whisper" "av<14"
```

Apple Silicon installs Homebrew to `/opt/homebrew`. Add to PATH permanently:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
exec zsh -l
```

### Verify each one

```bash
python --version        # or python3 --version
ffmpeg -version | head -1
ffprobe -version | head -1
yt-dlp --version
python -c "import faster_whisper, av; print('faster-whisper OK, av', av.__version__)"
```

All five must print a version before the analyser will run.
