"""Write a private libpq environment file; never print database credentials."""
import os
import sys
from urllib.parse import parse_qs, unquote, urlsplit


def connection_environment(raw_url: str, project_ref: str) -> dict[str, str]:
    url = urlsplit(raw_url.strip())
    if url.scheme not in ("postgres", "postgresql") or not url.hostname:
        raise ValueError("invalid database connection")
    user = unquote(url.username or "postgres")
    if url.hostname.endswith(".pooler.supabase.com") and user == "postgres":
        if not project_ref.isalnum():
            raise ValueError("pooler project reference required")
        user = "postgres." + project_ref
    port = url.port or 5432
    mode = parse_qs(url.query).get("sslmode", ["require"])[0]
    if mode not in ("require", "verify-ca", "verify-full"):
        raise ValueError("backup requires TLS")
    result = {
        "PGHOST": url.hostname,
        "PGPORT": str(5432 if port == 6543 else port),
        "PGUSER": user,
        "PGPASSWORD": unquote(url.password or ""),
        "PGDATABASE": unquote(url.path.removeprefix("/")) or "postgres",
        "PGSSLMODE": mode,
        "PGCONNECT_TIMEOUT": "30",
    }
    if any("\n" in value or "\r" in value or "\0" in value for value in result.values()):
        raise ValueError("unsupported connection characters")
    return result


if __name__ == "__main__":
    try:
        values = connection_environment(os.environ.get("DATABASE_URL", ""), os.environ.get("SUPABASE_PROJECT_REF", ""))
        descriptor = os.open(sys.argv[1], os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, "w", encoding="utf-8", newline="\n") as file:
            file.write("".join(f"{key}={value}\n" for key, value in values.items()))
    except Exception:
        print("[Backup] invalid connection configuration; details suppressed", file=sys.stderr)
        sys.exit(1)
