"""Read-only consistency and remaining-entry check. No network or personal data.

Exit 0: assets verified (--assets-only), or no recorded entry blockers.
Exit 1: missing, stale or inconsistent assets. Exit 2: entry still incomplete.
Recorded fields are not independent proof of video visibility or eligibility.
"""
from pathlib import Path, PurePosixPath
from urllib.parse import parse_qs, urlsplit
import argparse
import hashlib
import json
import re
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def digest(data):
    return hashlib.sha256(data).hexdigest()


def project_path(root, name):
    path = PurePosixPath(name)
    if not name or path.is_absolute() or ".." in path.parts or "\\" in name:
        raise ValueError("Unsafe artifact path: " + name)
    result = root / path
    if not result.resolve().is_relative_to(root.resolve()):
        raise ValueError("Artifact leaves project: " + name)
    return result


def public_video_url(value):
    if not isinstance(value, str):
        return False
    try:
        url = urlsplit(value)
        host = url.hostname
        if url.scheme != "https" or url.username or url.password or url.port:
            return False
        if host == "youtu.be":
            return bool(re.fullmatch(r"/[A-Za-z0-9_-]{11}", url.path))
        if host in {"youtube.com", "www.youtube.com"}:
            if url.path == "/watch":
                values = parse_qs(url.query).get("v", [])
                return len(values) == 1 and bool(re.fullmatch(r"[A-Za-z0-9_-]{11}", values[0]))
            return bool(re.fullmatch(r"/shorts/[A-Za-z0-9_-]{11}", url.path))
        return host in {"vimeo.com", "www.vimeo.com"} and bool(re.fullmatch(r"/[0-9]+", url.path))
    except ValueError:
        return False


def entry_blockers(entry):
    blockers = []
    if entry.get("video_recorded") is not True or entry.get("submission_demo_complete") is not True:
        blockers.append("Record actual browser-app footage below three minutes; the technical walkthrough does not qualify.")
    if not public_video_url(entry.get("video_url")):
        blockers.append("Provide a real public HTTPS YouTube/Vimeo video URL and verify it while signed out.")
    if entry.get("current_form_inspected") is not True:
        blockers.append("Authenticate to Devpost and inspect the current entry form; complete its actual fields.")
    if entry.get("terms_accepted") is not True:
        blockers.append("Entrant must review eligibility and handle required declarations and terms truthfully.")
    if entry.get("submitted") is not True or not entry.get("submission_confirmation_url") or entry.get("submission_site_confirmation_observed") is not True:
        blockers.append("Final submission and its actual confirmation remain unverified.")
    return blockers


def verify_assets(root):
    manifest = json.loads((root / "devpost/submission/package-manifest.json").read_text())
    entry = json.loads((root / "devpost/submission/entry-data.json").read_text())
    version = json.loads((root / "package.json").read_text())["version"]
    app = (root / "release/action-receipt.html").read_bytes()
    if manifest["application_version"] != version or manifest["application_sha256"] != digest(app):
        raise ValueError("Package application/version is stale. Rebuild and repackage.")
    if manifest["entry_submitted"] != entry["submitted"] or manifest["video_recorded"] != entry["video_recorded"]:
        raise ValueError("Packaged entry state differs from entry-data.json.")
    rehearsal = json.loads((root / "devpost/demo/rehearsal.json").read_text())
    if rehearsal["status"] != "passed":
        raise ValueError("Rehearsal did not pass.")
    for name, expected in rehearsal["source_files_sha256"].items():
        if digest(project_path(root, name).read_bytes()) != expected:
            raise ValueError("Stale rehearsal source: " + name)
    for name, expected in rehearsal["artifacts"].items():
        if digest(project_path(root / "devpost/demo", name).read_bytes()) != expected:
            raise ValueError("Stale rehearsal artifact: " + name)
    with zipfile.ZipFile(root / "release/action-receipt-submission.zip") as archive:
        expected_names = set(manifest["files_sha256"]) | {"package-manifest.json"}
        names = archive.namelist()
        if len(names) != len(set(names)) or set(names) != expected_names or archive.testzip():
            raise ValueError("Archive members are missing, duplicated, unexpected or damaged.")
        if json.loads(archive.read("package-manifest.json")) != manifest:
            raise ValueError("Archive manifest differs from committed manifest.")
        for name, expected in manifest["files_sha256"].items():
            data = archive.read(name)
            if digest(data) != expected:
                raise ValueError("Archive hash mismatch: " + name)
            # The launcher exists only inside the portable archive.
            if name != "START-HERE.html" and project_path(root, name).read_bytes() != data:
                raise ValueError("Packaged file is stale: " + name)
    for name in ("scope.md", "prd.md", "spec.md"):
        if not (root / "devpost" / name).read_text().strip():
            raise ValueError("Missing planning document: " + name)
    return {"application_version": version, "application_sha256": digest(app),
            "archive_members": len(names), "assets": "verified",
            "entry_blockers": entry_blockers(entry),
            "limits": "Local consistency checks only. Browser use, video duration/visibility, current form, personal eligibility and submission require actual verification."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assets-only", action="store_true", help="Verify prepared assets without requiring a completed entry")
    args = parser.parse_args()
    try:
        report = verify_assets(ROOT)
    except (OSError, ValueError, KeyError, TypeError, zipfile.BadZipFile) as error:
        print(json.dumps({"assets": "failed", "error": str(error)}, indent=2))
        return 1
    print(json.dumps(report, indent=2))
    return 2 if report["entry_blockers"] and not args.assets_only else 0


if __name__ == "__main__":
    sys.exit(main())
