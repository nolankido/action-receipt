"""Isolated packaging/readiness checks, separate from application domain tests."""
import importlib.util
from contextlib import redirect_stdout
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location("submission_check", Path(__file__).resolve().parents[1] / "scripts/check-submission.py")
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)


class SubmissionChecks(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.entry = {"video_recorded": False, "submission_demo_complete": False, "video_url": None,
                      "current_form_inspected": False, "terms_accepted": False,
                      "submitted": False, "submission_confirmation_url": None}
        self.write("package.json", {"version": "test"})
        self.write("release/action-receipt.html", b"synthetic test app")
        self.write("devpost/submission/entry-data.json", self.entry)
        self.write("app/source.ts", b"synthetic source")
        self.write("devpost/demo/output.md", b"synthetic output")
        self.write("devpost/demo/rehearsal.json", {"status": "passed",
                   "source_files_sha256": {"app/source.ts": check.digest(b"synthetic source")},
                   "artifacts": {"output.md": check.digest(b"synthetic output")}})
        for name in ("scope.md", "prd.md", "spec.md"):
            self.write("devpost/" + name, b"synthetic plan")
        self.members = {name: (self.root / name).read_bytes() for name in
                        ["release/action-receipt.html", "devpost/submission/entry-data.json"]}
        self.members["START-HERE.html"] = b"synthetic launcher"
        self.manifest = {"application_version": "test", "application_sha256": check.digest(b"synthetic test app"),
                         "entry_submitted": False, "video_recorded": False,
                         "files_sha256": {n: check.digest(b) for n, b in self.members.items()}}
        self.package()

    def write(self, name, value):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(value if isinstance(value, bytes) else json.dumps(value).encode())

    def package(self, extra=None):
        self.write("devpost/submission/package-manifest.json", self.manifest)
        with zipfile.ZipFile(self.root / "release/action-receipt-submission.zip", "w") as archive:
            for name, data in self.members.items():
                archive.writestr(name, data)
            archive.writestr("package-manifest.json", json.dumps(self.manifest))
            if extra:
                archive.writestr(*extra)

    def test_valid_assets_retain_entry_blockers(self):
        report = check.verify_assets(self.root)
        self.assertEqual(report["assets"], "verified")
        self.assertEqual(len(report["entry_blockers"]), 5)

    def test_technical_video_does_not_complete_demo(self):
        entry = self.entry | {"technical_video_created": True, "technical_video_duration_seconds": 162}
        self.assertEqual(check.entry_blockers(entry), check.entry_blockers(self.entry))

    def test_completed_local_browser_demo_still_requires_a_public_video_url(self):
        entry = self.entry | {"video_recorded": True, "submission_demo_complete": True,
                              "current_form_inspected": True}
        blockers = check.entry_blockers(entry)
        self.assertEqual(len(blockers), 3)
        self.assertTrue(any("public HTTPS YouTube/Vimeo" in item for item in blockers))
        self.assertTrue(any("Final submission" in item for item in blockers))
        self.write("devpost/submission/entry-data.json", entry)
        name = "devpost/submission/entry-data.json"
        self.members[name] = (self.root / name).read_bytes()
        self.manifest["files_sha256"][name] = check.digest(self.members[name])
        self.manifest["video_recorded"] = True
        self.package()
        with patch.object(check, "ROOT", self.root), patch("sys.argv", ["check-submission.py"]), redirect_stdout(io.StringIO()):
            self.assertEqual(check.main(), 2)

    def test_submission_flag_and_url_cannot_replace_an_observed_site_confirmation(self):
        entry = self.entry | {"submitted": True, "submission_confirmation_url": "https://devpost.com/software/action-receipt"}
        self.assertTrue(any("Final submission" in item for item in check.entry_blockers(entry)))
        self.assertTrue(any("Final submission" in item for item in check.entry_blockers(entry | {"submission_site_confirmation_observed": False})))

    def test_observed_complete_entry_requires_a_matching_packaged_receipt(self):
        entry = self.entry | {"video_recorded": True, "submission_demo_complete": True,
            "video_url": "https://vimeo.com/123456", "current_form_inspected": True,
            "terms_accepted": True, "submitted": True, "submission_site_confirmation_observed": True,
            "submission_confirmation_url": "https://devpost.com/software/action-receipt",
            "submission_confirmed_at": "2026-10-15T21:36:34.848Z", "devpost_submission_id": "test-entry"}
        receipt = {"status": "submitted", "confirmation_url": entry["submission_confirmation_url"],
            "observed_at": entry["submission_confirmed_at"], "devpost_submission_id": "test-entry",
            **{key: True for key in ("user_explicitly_authorized_terms_acceptance_and_submission",
                "terms_checkbox_checked", "submit_project_clicked", "terms_accepted", "submission_site_confirmation_observed")}}
        for name, value in (("devpost/submission/entry-data.json", entry), ("devpost/submission/submission-receipt.json", receipt)):
            self.write(name, value)
            self.members[name] = (self.root / name).read_bytes()
            self.manifest["files_sha256"][name] = check.digest(self.members[name])
        self.manifest.update(entry_submitted=True, video_recorded=True)
        self.package()
        with patch.object(check, "ROOT", self.root), patch("sys.argv", ["check-submission.py"]), redirect_stdout(io.StringIO()):
            self.assertEqual(check.main(), 0)
        receipt["observed_at"] = "different observation"
        self.write("devpost/submission/submission-receipt.json", receipt)
        with self.assertRaisesRegex(ValueError, "Submission receipt"):
            check.verify_assets(self.root)

    def test_video_urls_reject_host_spoofs_and_non_video_pages(self):
        for value in (None, "https://youtube.com.evil.test/watch?v=abcdefghijk", "http://youtu.be/abcdefghijk",
                      "https://user@youtu.be/abcdefghijk", "https://youtube.com/playlist?list=abc",
                      "https://vimeo.com/", "https://youtu.be:443/abcdefghijk", "https://youtube.com/watch?v=short"):
            with self.subTest(value=value):
                self.assertFalse(check.public_video_url(value))
        for value in ("https://www.youtube.com/watch?v=abcdefghijk", "https://youtu.be/abcdefghijk", "https://vimeo.com/123456"):
            self.assertTrue(check.public_video_url(value))

    def test_source_drift_is_rejected(self):
        self.write("app/source.ts", b"changed")
        with self.assertRaisesRegex(ValueError, "Stale rehearsal source"):
            check.verify_assets(self.root)

    def test_reference_drift_is_rejected(self):
        self.write("devpost/demo/output.md", b"changed")
        with self.assertRaisesRegex(ValueError, "Stale rehearsal artifact"):
            check.verify_assets(self.root)

    def test_local_asset_drift_is_rejected(self):
        self.write("devpost/submission/entry-data.json", self.entry | {"project_name": "changed"})
        with self.assertRaisesRegex(ValueError, "Packaged file is stale"):
            check.verify_assets(self.root)

    def test_unexpected_archive_member_is_rejected(self):
        self.package(("unexpected.txt", b"extra"))
        with self.assertRaisesRegex(ValueError, "Archive members"):
            check.verify_assets(self.root)

    def test_app_or_version_drift_is_rejected(self):
        self.write("package.json", {"version": "changed"})
        with self.assertRaisesRegex(ValueError, "application/version is stale"):
            check.verify_assets(self.root)

    def test_unsafe_paths_are_rejected(self):
        for name in ("../outside", "/absolute", "foo\\bar"):
            with self.subTest(name=name), self.assertRaises(ValueError):
                check.project_path(self.root, name)


if __name__ == "__main__":
    unittest.main()
