"""Package reviewed public entry assets using only Python's standard library.

Does not create footage, fill personal answers, accept terms, or submit an entry.
Run from the repository root after updating source checks and image assets.
"""
from pathlib import Path
from runpy import run_path
import base64
import hashlib
import html
import json
import re
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "devpost/submission"
digest = lambda data: hashlib.sha256(data).hexdigest()
entry = json.loads((ASSETS / "entry-data.json").read_text())
checks = run_path(str(ROOT / "scripts/check-submission.py"))
public_video_url = checks["public_video_url"]
assert isinstance(entry["submitted"], bool)
if entry["submitted"]:
    assert not checks["entry_blockers"](entry)
    checks["verify_submission_receipt"](entry, json.loads((ASSETS / "submission-receipt.json").read_text()))
else:
    assert entry["submission_confirmation_url"] is None
    assert entry.get("submission_site_confirmation_observed") is not True
assert isinstance(entry["video_recorded"], bool)
assert entry["video_url"] is None or public_video_url(entry["video_url"])
if entry["video_recorded"]:
    demo = entry["browser_demo"]
    assert entry["submission_demo_complete"] is True and demo["actual_browser_ui"] is True
    assert demo["status"] == "complete" and re.fullmatch(r"[0-9a-f]{64}", demo["sha256"])
    assert isinstance(demo["duration_seconds"], (int, float)) and 0 < demo["duration_seconds"] < 180
assert all(entry[k] is None for k in ("personal_reflection", "exit_survey_answers", "eligibility_declarations"))
app = (ROOT / "release/action-receipt.html").read_bytes()
assert b"connect-src 'none'" in app
assert not re.search(rb"<script\b[^>]*src=|<link\b[^>]*rel=[\"']stylesheet", app)
assert app == (ROOT / "dist/index.html").read_bytes()
report = json.loads((ROOT / "devpost/demo/rehearsal.json").read_text())
assert report["status"] == "passed"
for name, expected in report["source_files_sha256"].items():
    assert digest((ROOT / name).read_bytes()) == expected, "Stale rehearsal source hash: " + name
for name, expected in report["artifacts"].items():
    assert digest((ROOT / "devpost/demo" / name).read_bytes()) == expected, "Stale reference artifact"

png = (ASSETS / "action-receipt-cover.png").read_bytes()
assert png[:8] == b"\x89PNG\r\n\x1a\n"
assert struct.unpack(">II", png[16:24]) == (1200, 800)
assert len(png) < 5_000_000
captions = (ASSETS / "planned-captions.srt").read_text()
def milliseconds(stamp):
    h, m, s, ms = map(int, re.split(r"[:,]", stamp))
    assert m < 60 and s < 60 and ms < 1000
    return ((h * 60 + m) * 60 + s) * 1000 + ms
last_end = 0
blocks = captions.strip().split("\n\n")
for i, block in enumerate(blocks, 1):
    number, timing, *lines = block.splitlines()
    assert int(number) == i and lines
    start, end = map(milliseconds, timing.split(" --> "))
    assert last_end <= start < end and len(lines) <= 2
    last_end = end
assert last_end == 155_000 and last_end < 180_000

files = [
    "README.md", "LICENSE", "THIRD_PARTY_NOTICES.md", "release/action-receipt.html",
    "devpost/scope.md", "devpost/prd.md", "devpost/spec.md", "devpost/checklist.md",
    "devpost/workflow.md", "devpost/skill-pack-evidence.json", "devpost/judge-guide.md",
    "devpost/competitive-readiness.md", "devpost/submission-checklist.md", "devpost/zero-cost-plan.md",
    "devpost/demo/recording-guide.md", "devpost/demo/rehearsal.json",
    "devpost/demo/automated-checklist.md", "devpost/demo/automated-calendar.ics",
    "devpost/local-smoke.json", "devpost/usability/facilitator-guide.md",
    "devpost/usability/participant-notices.md", "devpost/usability/observation-template.md",
    "devpost/submission/README.md", "devpost/submission/READY-TO-SUBMIT.md", "devpost/submission/project-description.md",
    "devpost/submission/entry-data.json", "devpost/submission/planned-captions.srt",
    "devpost/submission/action-receipt-cover.png", "devpost/submission/action-receipt-cover.svg",
    "devpost/demo/technical-video-domain-data.json", "devpost/submission/technical-video-manifest.json",
    "devpost/submission/technical-video-captions.srt",
    "devpost/submission/technical-video-narration.json",
]
if entry["video_recorded"]:
    files.extend(["devpost/submission/browser-demo-manifest.json", "devpost/submission/browser-demo-captions.srt"])
if entry["submitted"]:
    files.append("devpost/submission/submission-receipt.json")
contents = {name: (ROOT / name).read_bytes() for name in files}
if entry["video_recorded"]:
    browser_manifest = json.loads(contents["devpost/submission/browser-demo-manifest.json"])
    assert browser_manifest["status"] == "complete" and browser_manifest["actual_browser_ui"] is True
    assert browser_manifest["media"]["sha256"] == demo["sha256"]
    assert browser_manifest["media"]["duration_seconds"] == demo["duration_seconds"]
    assert browser_manifest["public_video_url"] == entry["video_url"]
    assert browser_manifest["captions"]["sha256"] == digest(contents["devpost/submission/browser-demo-captions.srt"])
    actual_blocks = contents["devpost/submission/browser-demo-captions.srt"].decode().strip().split("\n\n")
    actual_last_end = 0
    for i, block in enumerate(actual_blocks, 1):
        number, timing, *lines = block.splitlines()
        start, end = map(milliseconds, timing.split(" --> "))
        assert int(number) == i and lines and actual_last_end <= start < end
        actual_last_end = end
    assert len(actual_blocks) == browser_manifest["captions"]["cue_count"]
    assert actual_last_end / 1000 == browser_manifest["captions"]["last_cue_end_seconds"]
    assert actual_last_end < demo["duration_seconds"] * 1000
story = html.escape((ASSETS / "project-description.md").read_text())
icon = base64.b64encode((ROOT / "public/favicon.svg").read_bytes()).decode()
demo_state = "The edited browser-demo video is complete locally; its public URL remains missing." if entry["video_recorded"] else "Actual browser-demo capture/editing is in progress."
demo_next_step = "upload the finished actual-app demo publicly" if entry["video_recorded"] else "finish and inspect the actual-app demo, then upload it publicly"
if entry["video_url"]:
    video_url = html.escape(entry["video_url"], quote=True)
    demo_state = f'The edited browser demonstration is published on <a href="{video_url}">Vimeo</a>; Public sharing and playback were observed in the owner-authenticated browser. A separate signed-out check is not claimed.'
    demo_next_step = "review the existing draft and its public video link" if entry.get("video_url_saved_to_devpost") else "add the published video link to the existing draft"
entry_state = "The program and Devpost draft are prepared. The entry is not submitted."
entry_progress = "Draft 1239349-action-receipt has saved project fields, cover, public video URL and entrant-directed Additional info; four of five steps are complete. Its finalization page shows no missing-field warnings."
entry_finish = "The binding terms checkbox remains unchecked, and actual submission has not been observed."
terms_state = "Final terms remain pending."
next_action = f"{demo_next_step}. The entrant must review the binding Official Rules and Devpost Terms of Service, then complete the remaining checkbox and Submit project action. Retain the actual submission confirmation; saved draft fields do not prove submission."
if entry["submitted"]:
    confirmation_url = html.escape(entry["submission_confirmation_url"], quote=True)
    confirmed_at = html.escape(entry["submission_confirmed_at"])
    entry_state = "Action Receipt was submitted to Build With AI: Basics."
    entry_progress = f'The actual <a href="{confirmation_url}">Devpost project page</a> displayed Project submitted! at {confirmed_at}.'
    entry_finish = 'The entrant explicitly authorized terms acceptance and submission. The checkbox and Submit project action were completed; <a href="devpost/submission/submission-receipt.json">the receipt</a> records the observed confirmation.'
    terms_state = "Terms acceptance and actual submission were explicitly authorized and observed."
    next_action = "Submission is confirmed. Preserve the public repository and video through judging, and retain the receipt."
launcher = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'">
<title>Action Receipt | Prepared entry materials</title>
<style>body{{margin:0;background:#f6f5ef;color:#24382e;font:16px/1.7 Arial,sans-serif}}main{{max-width:900px;margin:auto;padding:40px 24px}}header{{display:flex;align-items:center;gap:14px}}header img{{width:48px;height:48px}}h1{{font-size:26px}}h2{{font-size:21px;margin-top:30px}}.state{{padding:16px 20px;border:1px solid #dbc78e;background:#fff9ea;border-radius:10px}}a{{color:#245846;overflow-wrap:anywhere}}.button{{display:inline-block;background:#245846;color:white;text-decoration:none;border-radius:7px;padding:12px 18px;margin:12px 10px 10px 0}}li{{margin:7px 0}}textarea{{box-sizing:border-box;width:100%;min-height:480px;padding:16px;font:14px/1.6 monospace;color:#24382e;border:1px solid #ccd7c2;border-radius:8px;background:white}}.note{{font-size:14px;color:#64715b}}code{{overflow-wrap:anywhere}}</style>
</head><body><main><header><img src="data:image/svg+xml;base64,{icon}" alt=""><h1>Action Receipt: prepared entry materials</h1></header>
<p class="state"><strong>{entry_state}</strong><br>{entry_progress} {demo_state} {entry_finish}</p>
<a class="button" href="release/action-receipt.html">Open the offline app</a><a class="button" href="https://github.com/nolankido/action-receipt">Public source repository</a>
<h2>Prepared for you</h2><ul>
<li><a href="devpost/submission/action-receipt-cover.png">Gallery cover PNG</a>: original illustration, not a screenshot.</li>
<li><a href="devpost/submission/entry-data.json">Project facts and public links</a>.</li>
<li><a href="devpost/submission/planned-captions.srt">Planned silent-demo captions</a>: 2:35 target, align to actual footage.</li>
<li><a href="devpost/demo/recording-guide.md">Screen-action recording checklist</a> and <a href="devpost/judge-guide.md">judge instructions</a>.</li>
<li><a href="package-manifest.json">Package hashes</a>; automated reference artifacts under <code>devpost/demo/</code> are labeled as scripted checks.</li></ul>
<h2>Factual project draft</h2><p class="note">Prepared with AI assistance under your delegation. The authenticated form was inspected and its fields saved. Private Additional info answers remain in Devpost and are intentionally absent here. {terms_state}</p><textarea readonly aria-label="AI-assisted factual project draft">{story}</textarea>
<h2>Entry status</h2><p>{next_action} <a href="devpost/submission/READY-TO-SUBMIT.md">Open the status and asset record</a>.</p><p>No face or voice is required by the published rules; actual footage of the functioning software is required. A caption file or project illustration cannot replace it. Focused supported-browser checks verify repeated scanning and consent-action repair; no learner trial or participant study is claimed.</p>
<p>Deadline: October 26, 2026, 11 a.m. Hawaiʻi (21:00 UTC).</p><p><a href="devpost/submission/README.md">Authorship, workflow status and evidence limits</a></p></main></body></html>'''.encode()
contents["START-HERE.html"] = launcher
for name, data in contents.items():
    assert "learner-profile.md" not in name and not name.startswith(".github/")
    assert not re.search(rb"sk-(?:proj-)?[A-Za-z0-9_-]{24,}", data), "Credential-shaped material in package"
manifest = {
    "format_version": 1, "purpose": "Observed submission and portable project assets" if entry["submitted"] else "Submission preparation, not a completed entry",
    "application_version": json.loads((ROOT / "package.json").read_text())["version"],
    "application_sha256": digest(app), "planned_caption_duration_seconds": 155,
    "caption_status": "Original planned captions retained; completed browser-demo captions included separately" if entry["video_recorded"] else "Original planned text; actual browser-demo capture and editing are in progress",
    "entry_submitted": entry["submitted"], "video_recorded": entry["video_recorded"],
    "files_sha256": {name: digest(data) for name, data in sorted(contents.items())},
}
if entry["video_recorded"]:
    manifest["browser_demo"] = {"movie_sha256": demo["sha256"], "duration_seconds": demo["duration_seconds"], "public_video_url": entry["video_url"],
                                "caption_cue_count": len(actual_blocks), "caption_last_cue_end_seconds": actual_last_end / 1000}
manifest_bytes = (json.dumps(manifest, indent=2) + "\n").encode()
(ASSETS / "package-manifest.json").write_bytes(manifest_bytes)
contents["package-manifest.json"] = manifest_bytes
archive = ROOT / "release/action-receipt-submission.zip"
# Fixed metadata makes this a reproducible archive, not a timestamped release claim.
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as package:
    for name, data in sorted(contents.items()):
        item = zipfile.ZipInfo(name, date_time=(2026, 10, 15, 0, 0, 0))
        item.compress_type = zipfile.ZIP_DEFLATED
        item.external_attr = 0o100644 << 16
        package.writestr(item, data)
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    for name, expected in manifest["files_sha256"].items():
        assert digest(package.read(name)) == expected
    assert package.read("release/action-receipt.html") == app
print(json.dumps({"archive": str(archive.relative_to(ROOT)), "files": len(contents), "bytes": archive.stat().st_size,
                  "sha256": digest(archive.read_bytes()), "manifest": "verified", "entry_submitted": entry["submitted"], "video_recorded": entry["video_recorded"]}))
