"""
Challenger 2: PostgreSQL AST & Syntax Verification using pglast (libpg_query)
Migration: supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql
"""

import sys
import pglast
from pglast import ast, enums

def verify_ast():
    sys.stdout.reconfigure(encoding='utf-8')
    print("=" * 64)
    print("[POSTGRES] RUNNING POSTGRESQL AST VERIFICATION VIA PGLAST")
    print("=" * 64)

    migration_file = "supabase/migrations/20260927_cross_classroom_due_words_and_tz.sql"
    with open(migration_file, "r", encoding="utf-8") as f:
        sql = f.read()

    # 1. Parse using official Postgres C parser
    try:
        raw_stmts = pglast.parse_sql(sql)
        print(f"  [PASS] Parsed {len(raw_stmts)} statements with 0 syntax errors.")
    except Exception as e:
        print(f"  [FAIL] PostgreSQL parsing error: {e}")
        sys.exit(1)

    function_creates = []
    function_drops = []
    grants = []
    analyzes = []

    for item in raw_stmts:
        stmt = item.stmt
        stmt_type = type(stmt).__name__

        if stmt_type == "CreateFunctionStmt":
            # Extract function name
            func_name = stmt.funcname[-1].sval
            function_creates.append((func_name, stmt))
        elif stmt_type == "DropStmt":
            for obj in stmt.objects:
                # obj is ObjectWithArgs
                fn = obj.objname[-1].sval
                function_drops.append(fn)
        elif stmt_type == "GrantStmt":
            grants.append(stmt)
        elif stmt_type == "VacuumStmt": # ANALYZE is parsed as VacuumStmt in Postgres AST
            analyzes.append(stmt)

    print(f"  [PASS] Identified {len(function_drops)} DROP FUNCTION statements.")
    print(f"  [PASS] Identified {len(function_creates)} CREATE FUNCTION statements.")
    print(f"  [PASS] Identified {len(grants)} GRANT/REVOKE statements.")
    print(f"  [PASS] Identified {len(analyzes)} ANALYZE statements.")

    # 2. Check each function created
    created_names = [f[0] for f in function_creates]
    assert "get_due_words_list" in created_names, "Missing get_due_words_list"
    assert "get_word_summary" in created_names, "Missing get_word_summary"
    assert "push_actual_due_counts" in created_names, "Missing push_actual_due_counts"

    for func_name, stmt in function_creates:
        options = {opt.defname: opt.arg for opt in stmt.options}
        
        # Security definer check
        sec_opt = options.get("security")
        is_security_definer = hasattr(sec_opt, "boolval") and sec_opt.boolval is True
        assert is_security_definer, f"{func_name} is NOT SECURITY DEFINER!"
        
        # Volatility check
        vol_opt = options.get("volatility")
        volatility = getattr(vol_opt, "sval", None)
        assert volatility == "stable", f"{func_name} volatility is {volatility}, expected 'stable'!"

        # search_path check
        set_opt = options.get("set")
        assert set_opt is not None, f"{func_name} missing SET options!"
        assert set_opt.name == "search_path", f"{func_name} SET is {set_opt.name}, expected 'search_path'!"
        search_path_args = [arg.val.sval for arg in set_opt.args]
        assert "pg_catalog" in search_path_args and "public" in search_path_args, f"search_path missing pg_catalog or public: {search_path_args}"

        print(f"  [PASS] {func_name}: SECURITY DEFINER=True, Volatility=STABLE, search_path={search_path_args}.")

    # 3. Check ANALYZE statements
    assert len(analyzes) == 4, f"Expected 4 ANALYZE statements, got {len(analyzes)}"
    print("  [PASS] 4 table planner ANALYZE calls validated.")

    print("\n----------------------------------------------------------------")
    print("PostgreSQL AST Verification: 100% SUCCESS")
    print("----------------------------------------------------------------\n")

if __name__ == "__main__":
    verify_ast()
