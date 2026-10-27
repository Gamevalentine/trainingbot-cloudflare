"""Offline contract tests for TrainingBot D1 export. No live Cloudflare requests."""
import contextlib
import importlib.util
import io
import json
import os
import pathlib
import sys
import tempfile
import unittest
from unittest import mock


MODULE = pathlib.Path(__file__).resolve().parents[1] / "scripts" / "backup_d1_to_github.py"


def load_module():
    with mock.patch.dict(os.environ, {"CLOUDFLARE_API_TOKEN": "test-only-fake-token"}):
        spec = importlib.util.spec_from_file_location("backup_d1_test", MODULE)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod


class D1BackupTests(unittest.TestCase):
    def setUp(self):
        self.mod = load_module()

    def test_polling_export_and_sql_verification(self):
        original_sql = b"PRAGMA foreign_keys=OFF;\nCREATE TABLE articles (id INTEGER PRIMARY KEY);\nINSERT INTO articles VALUES (1);\n"
        responses = [
            {"success": True, "result": {"name": "trainingbot-db", "uuid": self.mod.DATABASE_ID}},
            {"success": True, "result": {"at_bookmark": "abc123", "status": "in-progress", "type": "export"}},
            {"success": True, "result": {"at_bookmark": "abc123", "status": "complete",
                                         "result": {"filename": "dump.sql", "signed_url": "https://download.test/dump.sql"}}},
        ]
        calls = []
        def fake_open(req, timeout=0):
            calls.append(req.full_url if hasattr(req, "full_url") else req)
            if len(calls) <= 3:
                return io.BytesIO(json.dumps(responses[len(calls) - 1]).encode())
            return io.BytesIO(original_sql)

        with tempfile.TemporaryDirectory() as d:
            target = pathlib.Path(d) / "backup.sql"
            with mock.patch.object(self.mod.urllib.request, "urlopen", side_effect=fake_open), \
                 mock.patch.object(self.mod.time, "sleep"), \
                 mock.patch.object(sys, "argv", ["backup", str(target)]), \
                 contextlib.redirect_stdout(io.StringIO()) as output:
                self.mod.main()
            self.assertEqual(target.read_bytes(), original_sql)
            self.assertNotIn("INSERT INTO", output.getvalue())
            self.assertEqual(calls[-1], "https://download.test/dump.sql")

    def test_identity_check_blocks_export(self):
        response = {"success": True, "result": {"name": "different-db", "uuid": self.mod.DATABASE_ID}}
        with mock.patch.object(self.mod.urllib.request, "urlopen", return_value=io.BytesIO(json.dumps(response).encode())) as m, \
             mock.patch.object(sys, "argv", ["backup", "/tmp/should-not-be-written.sql"]):
            with self.assertRaisesRegex(RuntimeError, "identity mismatch"):
                self.mod.main()
            self.assertEqual(m.call_count, 1)

    def test_export_error_does_not_download(self):
        responses = iter([
            {"success": True, "result": {"name": "trainingbot-db", "uuid": self.mod.DATABASE_ID}},
            {"success": True, "result": {"status": "error", "error": "temporary problem"}},
        ])
        def fake_open(req, timeout=0):
            return io.BytesIO(json.dumps(next(responses)).encode())
        with mock.patch.object(self.mod.urllib.request, "urlopen", side_effect=fake_open), \
             mock.patch.object(sys, "argv", ["backup", "/tmp/should-not-be-written.sql"]):
            with self.assertRaisesRegex(RuntimeError, "export failed"):
                self.mod.main()


if __name__ == "__main__":
    unittest.main()
