"""Connection parser tests use synthetic credentials only."""
import importlib.util
import unittest

spec = importlib.util.spec_from_file_location("backup_connection", "scripts/backup/connection.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ConnectionTests(unittest.TestCase):
    def test_port_rewrite_does_not_change_password(self):
        result = module.connection_environment("postgresql://postgres:fixture6543%20value@aws.pooler.supabase.com:6543/postgres", "fixtureproject")
        self.assertEqual(result["PGPASSWORD"], "fixture6543 value")
        self.assertEqual(result["PGPORT"], "5432")
        self.assertEqual(result["PGUSER"], "postgres.fixtureproject")
        self.assertEqual(result["PGSSLMODE"], "require")

    def test_existing_pooler_identity_and_verified_tls(self):
        result = module.connection_environment("postgres://postgres.other:p%40ss@aws.pooler.supabase.com:5432/db?sslmode=verify-full", "fixtureproject")
        self.assertEqual(result["PGUSER"], "postgres.other")
        self.assertEqual(result["PGPASSWORD"], "p@ss")
        self.assertEqual(result["PGSSLMODE"], "verify-full")

    def test_fail_closed(self):
        for value in ["", "https://example.com", "postgres://p:p@host/db?sslmode=disable", "postgres://p:x%0APGINJECT%3Dbad@host/db", "postgres://p:p@host:bad/db"]:
            with self.assertRaises(ValueError):
                module.connection_environment(value, "fixtureproject")


if __name__ == "__main__":
    unittest.main()
