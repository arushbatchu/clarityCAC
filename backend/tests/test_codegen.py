"""
The TypeScript rules file and parity cases are generated from Python.
If someone changes a weight in Python and forgets to rerun codegen, this fails.
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend" / "scripts"))

import codegen  # noqa: E402


def test_generated_typescript_is_up_to_date():
    committed = (ROOT / "frontend/src/rules.generated.ts").read_text(encoding="utf-8")
    assert committed == codegen.build_rules_ts(), "run: python backend/scripts/codegen.py"


def test_parity_cases_are_up_to_date():
    committed = json.loads((ROOT / "shared/parity_cases.json").read_text(encoding="utf-8"))
    assert committed == json.loads(codegen.build_parity_json()), "run: python backend/scripts/codegen.py"
