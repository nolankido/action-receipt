"""Render a narrated video from real domain outputs, with its limits on every scene.

Requires local Pillow and FFmpeg. Does not control a browser, create simulated
app screenshots, upload a video, or claim a completed hackathon demonstration.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs/video"
DATA = json.loads((OUT / "domain-capture.json").read_text())
NARRATION_PATH = ROOT / "devpost/submission/technical-video-narration.json"
NARRATION = json.loads(NARRATION_PATH.read_text())
assert NARRATION["browser_footage"] is False
assert DATA["synthetic"] and DATA["all_review_choices_scripted"] and not DATA["human_review"]
W, H = 1600, 900
BG, INK, GREEN, MUTED = "#f6f5ef", "#24382e", "#245846", "#596b53"
FONT_ROOT = Path("/usr/share/fonts/truetype/dejavu")
def font(size, bold=False, serif=False, mono=False):
    name = "DejaVuSansMono" if mono else "DejaVuSerif" if serif else "DejaVuSans"
    return ImageFont.truetype(str(FONT_ROOT / (name + ("-Bold" if bold else "") + ".ttf")), size)
F = {"title": font(57, serif=True), "body": font(29), "small": font(22), "label": font(19, True), "mono": font(24, mono=True)}
SCENES = []

def wrap(text, face, width):
    result = []
    for paragraph in text.split("\n"):
        if not paragraph:
            result.append(""); continue
        line = ""
        for word in paragraph.split():
            candidate = (line + " " + word).strip()
            if face.getlength(candidate) > width:
                assert line and face.getlength(word) <= width, "Unwrappable word"
                result.append(line); line = word
            else:
                line = candidate
        result.append(line)
    return result

def text(draw, xy, value, face, fill=INK, width=1350, leading=None):
    x, y = xy
    leading = leading or int(face.size * 1.48)
    lines = wrap(value, face, width)
    for line in lines:
        draw.text((x, y), line, font=face, fill=fill)
        y += leading
    return y

def scene(title, duration, caption, blocks, eyebrow="ACTUAL DOMAIN OUTPUTS"):
    image = Image.new("RGB", (W, H), BG); draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((60, 39, 104, 85), 11, fill=GREEN)
    draw.line([(72, 62), (81, 71), (94, 52)], fill="white", width=3)
    draw.text((122, 44), "Action Receipt", font=font(30, True), fill=INK)
    draw.text((1550, 51), "TECHNICAL WALKTHROUGH", font=F["label"], fill=MUTED, anchor="ra")
    draw.line((60, 108, 1540, 108), fill="#d7dfcf", width=2)
    draw.text((66, 135), eyebrow, font=F["label"], fill=GREEN)
    y = text(draw, (61, 174), title, F["title"], width=1450, leading=70) + 25
    for block in blocks:
        face = F.get(block.get("font", "body"), F["body"])
        lines = wrap(block["text"], face, 1392)
        height = len(lines) * int(face.size * 1.48) + 36
        assert y + height <= 739, f"Scene overflow: {title}"
        draw.rounded_rectangle((62, y, 1538, y + height), 13, fill=block.get("background", "white"), outline="#d8dfd0", width=2)
        text(draw, (84, y + 15), block["text"], face, fill=block.get("color", INK), width=1392)
        y += height + 15
    draw.rounded_rectangle((60, 759, 1540, 837), 10, fill=GREEN)
    caption_lines = wrap(caption, F["small"], 1420)
    assert len(caption_lines) == 1, title + " caption too long"
    # The encoder burns the spoken captions here using measured audio timing.
    draw.text((62, 847), "SCRIPTED SYNTHETIC CHECK  |  COMPUTER VOICE  |  BROWSER INTERFACE NOT SHOWN", font=font(18, True), fill=MUTED)
    draw.text((1538, 847), f"{len(SCENES)+1:02d}", font=font(18), fill=MUTED, anchor="ra")
    path = OUT / f"scene-{len(SCENES):02d}.png"; image.save(path)
    SCENES.append({"path": path.name, "title": title, "duration_seconds": duration, "caption": caption,
                   "content": [b["text"] for b in blocks], "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})

scene("Know what is next. Keep the proof.", 7,
      "One notice. Source-linked actions. Dates that need a deliberate check.", [
    {"text": "A narrow tool for students reviewing school, club and administrative notices.", "background": "#edf3e6"},
    {"text": "This video presents real rule-engine outputs and export checks.\nIt is not a recording of the browser interface.", "font": "small"},
], "SOURCE TO REVIEWED RECEIPT")
scene("Start with the original notice.", 14,
      "An invented practice notice supplies the input for every result shown here.", [
    {"text": DATA["source"], "font": "small"},
])
initial = DATA["initial"]
scene("Three proposals. No automatic approval.", 8,
      "The local English text rules run on the source, with no model or API request.", [
    {"text": "\n".join(f"{i+1}. {a['title']}\n    Proposed date: {a['date'] or 'unresolved'}" for i, a in enumerate(initial["actions"])), "font": "small"},
    {"text": f"{len(initial['attention'])} passages flagged. Initial downloads: 0 checklist tasks, 0 calendar entries.", "background": "#edf3e6", "font": "small"},
])
scene("Different tasks, different deadlines.", 8,
      "Exact quotations establish where words occurred, not whether the interpretation is right.", [
    {"text": initial["actions"][0]["evidence"][0]["quote"], "background": "#edf3e6"},
    {"text": initial["actions"][1]["evidence"][0]["quote"]},
])
consent = next(f for f in initial["attention"] if "consent form" in f["evidence"]["quote"])
scene("Repair an instruction the rules missed.", 9,
      "The real repair function creates a separate action from the exact flagged passage.", [
    {"text": consent["evidence"]["quote"]},
    {"text": "New action: " + DATA["repaired"]["actions"][-1]["title"] + "\nDate: unresolved. Approval: unchecked.", "background": "#edf3e6"},
])
fee = next(f for f in initial["attention"] if "membership fee" in f["evidence"]["quote"])
scene("A waived fee stays out of the tasks.", 7,
      "The scripted source decision records its reason and preserves the original flag.", [
    {"text": fee["evidence"]["quote"], "background": "#fbf1dd"},
    {"text": "Decision: not an obligation.\nNo separate membership-fee task or event is created."},
])
email = initial["actions"][2]
scene("Keep the condition. Keep the uncertainty.", 8,
      "The program does not turn next Friday into a guessed calendar date.", [
    {"text": email["evidence"][0]["quote"], "background": "#fbf1dd"},
    {"text": "Condition: " + email["condition"] + "\nDate: unresolved. Calendar: excluded."},
])
scene("Approval and date confirmation are separate.", 9,
      "These are scripted contract checks, not a claim that a person reviewed the notice.", [
    {"text": "Fresh scan: 0 checklist tasks, 0 calendar entries.\nAfter action checks: 4 checklist tasks, 0 calendar entries.\nAfter complete date checks: 4 checklist tasks, 2 calendar entries.", "background": "#edf3e6"},
    {"text": "The undated consent form and conditional email remain checklist-only.", "font": "small"},
])
md_lines = DATA["markdown"].splitlines()
md_excerpt = next(line for line in md_lines if line.startswith("Notice:")) + "\n\n" + "\n".join(
    [line for line in md_lines if line.startswith("- [ ]") or "Action source:" in line or "Reviewed date:" in line][:6])
scene("The checklist keeps its evidence.", 14,
      "This is an excerpt from the actual Markdown serializer output.", [
    {"text": md_excerpt, "font": "small"},
], "ACTUAL FILE EXCERPT")
ics_lines = DATA["calendar"].replace("\r\n ", "").split("\r\n")
ics_excerpt = "\n".join(line for line in ics_lines if line in ("BEGIN:VEVENT", "END:VEVENT") or line.startswith(("DTSTART", "DTEND", "SUMMARY:")))
scene("Only two dates enter the calendar.", 11,
      "The timed cutoff is converted to the same instant in UTC, with no inferred reminder.", [
    {"text": ics_excerpt, "font": "mono", "background": "#edf3e6"},
    {"text": "Selected properties shown. Complete files also retain quotations, warnings and context.", "font": "small"},
], "ACTUAL ICALENDAR PROPERTIES")
assert DATA["editedCutoff"] == {"approved": False, "dateConfirmed": False}
assert DATA["reopenedCounts"] == {"checklist": 0, "calendar": 0}
scene("Changed data needs fresh review.", 8,
      "The capture also exercised edit invalidation and the real saved-review parser.", [
    {"text": "Edit a reviewed cutoff:\nAction approval cleared. Date confirmation cleared.", "background": "#fbf1dd"},
    {"text": "Reopen a saved review:\n0 checklist tasks and 0 calendar entries until checked again."},
])
scene("Built with AI. Runs without an AI bill.", 8,
      "Codex used the Devpost Learn Skill Pack; generated planning documents are public.", [
    {"text": "Runtime: local English text rules, React and TypeScript.\nOne self-contained browser file. No account, model download or API credits.", "background": "#edf3e6"},
    {"text": "Automated checks are not student feedback or proof of complete language understanding.", "font": "small"},
])
scene("Try the actual browser app.", 9,
      "Public source and the runnable offline file: github.com/nolankido/action-receipt", [
    {"text": "github.com/nolankido/action-receipt", "background": "#edf3e6"},
    {"text": "This technical walkthrough is complete.\nBrowser-interface footage and a public YouTube/Vimeo link remain necessary for the finished hackathon demo.", "font": "small"},
], "HONEST EVIDENCE, VISIBLE LIMITS")

assert len(NARRATION["scenes"]) == len(SCENES)
audio_paths = []
for i, (s, narration) in enumerate(zip(SCENES, NARRATION["scenes"])):
    # Synthesize short caption units independently so their start/end timestamps
    # come from measured audio, rather than guesses about the reading speed.
    units = []
    for sentence in re.split(r"(?<=[.!?]) +", narration):
        line = ""
        for word in sentence.split():
            candidate = (line + " " + word).strip()
            if len(candidate) > 124 and line:
                units.append(line); line = word
            else:
                line = candidate
        units.append(line)
    sentence_paths = []; measured = []; speech_duration = 0.0
    for j, unit in enumerate(units):
        # Text is passed as a file, never interpolated into a shell command.
        text_path = OUT / f"narration-{i:02d}-{j:02d}.txt"
        text_path.write_text(unit + "\n")
        sentence_path = OUT / f"speech-{i:02d}-{j:02d}.wav"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i",
                        f"flite=textfile={text_path}:voice={NARRATION['voice']}",
                        "-af", "apad=pad_dur=0.10", "-ar", "48000", "-ac", "1", str(sentence_path)], check=True)
        unit_probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_format", "-of", "json", str(sentence_path)]))
        unit_duration = float(unit_probe["format"]["duration"])
        measured.append({"text": unit, "start_seconds": speech_duration, "duration_seconds": unit_duration})
        speech_duration += unit_duration
        sentence_paths.append(sentence_path)
    sentence_concat = OUT / f"speech-{i:02d}.ffconcat"
    sentence_concat.write_text("ffconcat version 1.0\n" + "".join(f"file '{p.name}'\n" for p in sentence_paths))
    speech_path = OUT / f"speech-{i:02d}.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-safe", "1", "-f", "concat", "-i", str(sentence_concat),
                    "-ar", "48000", "-ac", "1", str(speech_path)], check=True)
    # Readable scenes are never shortened. Leave a breath before and after each voice cue.
    s["duration_seconds"] = max(s["duration_seconds"], int(speech_duration + 1.8))
    s["narration"] = narration
    s["speech_duration_seconds"] = speech_duration
    s["speech_start_seconds"] = 0.35
    s["spoken_captions"] = measured
    padded_path = OUT / f"narrated-{i:02d}.wav"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(speech_path),
                    "-af", "adelay=350,apad", "-t", str(s["duration_seconds"]),
                    "-ar", "48000", "-ac", "1", str(padded_path)], check=True)
    audio_paths.append(padded_path)
duration = sum(s["duration_seconds"] for s in SCENES)
assert duration < 180, f"Narrated video exceeds the three-minute limit: {duration}"
audio_concat = OUT / "narration.ffconcat"
audio_concat.write_text("ffconcat version 1.0\n" + "".join(f"file '{p.name}'\n" for p in audio_paths))
audio_track = OUT / "narration.wav"
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-safe", "1", "-f", "concat", "-i", str(audio_concat),
                "-af", "loudnorm=I=-18:TP=-2:LRA=7", "-ar", "48000", "-ac", "1", str(audio_track)], check=True)
concat = OUT / "scenes.ffconcat"
concat.write_text("ffconcat version 1.0\n" + "".join(f"file '{s['path']}'\nduration {s['duration_seconds']}\n" for s in SCENES) + f"file '{SCENES[-1]['path']}'\n")
def cue_stamp(value):
    ms = round(value * 1000)
    return f"{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}"
def ass_stamp(value):
    cs = round(value * 100)
    return f"{cs//360000}:{cs//6000%60:02d}:{cs//100%60:02d}.{cs%100:02d}"
position = 0; cues = []; dialogue = []
for s in SCENES:
    for unit in s["spoken_captions"]:
        start = position + s["speech_start_seconds"] + unit["start_seconds"]
        end = start + unit["duration_seconds"]
        assert end < position + s["duration_seconds"]
        words = unit["text"].split(); lines = []; line = ""
        for word in words:
            candidate = (line + " " + word).strip()
            if len(candidate) > 68 and line:
                lines.append(line); line = word
            else:
                line = candidate
        lines.append(line)
        assert len(lines) <= 2
        assert all(font(24).getlength(line) < 1400 for line in lines)
        cues.append(f"{len(cues)+1}\n{cue_stamp(start)} --> {cue_stamp(end)}\n" + "\n".join(lines) + "\n")
        dialogue.append(f"Dialogue: 0,{ass_stamp(start)},{ass_stamp(end)},Default,,0,0,0,," + r"{\an8\pos(800,771)}" + r"\N".join(lines))
    position += s["duration_seconds"]
(OUT / "technical-walkthrough.srt").write_text("\n".join(cues))
ass_path = OUT / "technical-walkthrough.ass"
ass_path.write_text("[Script Info]\nScriptType: v4.00+\nPlayResX: 1600\nPlayResY: 900\nWrapStyle: 2\n\n"
    "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
    "Style: Default,DejaVu Sans,24,&H00FFFFFF,&H00FFFFFF,&H00245846,&H00245846,0,0,0,0,100,100,0,0,1,0,0,8,70,70,0,1\n\n"
    "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n" + "\n".join(dialogue) + "\n")
movie = ROOT / "outputs/action-receipt-technical-walkthrough.mp4"
subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-safe", "1", "-f", "concat", "-i", str(concat),
                "-i", str(audio_track), "-map", "0:v:0", "-map", "1:a:0",
                "-t", str(duration), "-vf", f"fps=24,subtitles={ass_path}:fontsdir={FONT_ROOT}", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "128k", "-ar", "48000",
                "-movflags", "+faststart", "-metadata", "title=Action Receipt | Technical walkthrough",
                "-metadata", "comment=Real domain outputs; offline computer-generated narration; scripted synthetic choices; browser interface not shown; not a completed hackathon demo.", str(movie)], check=True)
probe = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-show_format", "-show_streams", "-of", "json", str(movie)]))
assert float(probe["format"]["duration"]) < 180
video = next(s for s in probe["streams"] if s["codec_type"] == "video")
assert (video["width"], video["height"], video["codec_name"], video["pix_fmt"]) == (W, H, "h264", "yuv420p")
audio = next(s for s in probe["streams"] if s["codec_type"] == "audio")
assert audio["codec_name"] == "aac" and audio["channels"] == 1 and audio["sample_rate"] == "48000"
manifest = {"kind": "Narrated technical walkthrough of real domain outputs", "browser_footage": False,
            "hackathon_demo_complete": False, "review_choices": "scripted synthetic contract checks", "duration_seconds": float(probe["format"]["duration"]),
            "resolution": [W, H], "codec": "H.264", "audio": "AAC mono; offline FFmpeg libflite computer-generated voice slt; no impersonation",
            "narration_sha256": hashlib.sha256(NARRATION_PATH.read_bytes()).hexdigest(),
            "caption_alignment": "Measured synthesis-clip boundaries; full spoken captions burned into video and included as SRT",
            "movie_sha256": hashlib.sha256(movie.read_bytes()).hexdigest(), "scenes": SCENES,
            "input_capture_sha256": hashlib.sha256((OUT / "domain-capture.json").read_bytes()).hexdigest(),
            "render_script_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
(OUT / "video-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
thumbs = Image.new("RGB", (W, 1125), "#dfe5d6")
for i, s in enumerate(SCENES):
    image = Image.open(OUT / s["path"]); image.thumbnail((400,225)); thumbs.paste(image, ((i%4)*400,(i//4)*225))
thumbs.save(OUT / "contact-sheet.jpg")
print(json.dumps({"movie": str(movie), "duration_seconds": manifest["duration_seconds"], "bytes": movie.stat().st_size,
                  "sha256": manifest["movie_sha256"], "actual_browser_footage": False, "finished_hackathon_demo": False}))
