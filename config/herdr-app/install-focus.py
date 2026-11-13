#!/usr/bin/env python3
"""Install only the personal Focus files; leave bundled Herdr files alone."""
import json
import os
import shutil
from pathlib import Path

source = Path(__file__).resolve().parent
target = Path(os.environ.get("HERDR_APP_HOME", str(Path(os.environ.get("XDG_CONFIG_HOME", Path.home() / ".config")) / "herdr-app")))
files = list(source.glob("layouts/focus.*"))
for file in files:
    destination = target / file.relative_to(source)
    if destination.exists() and destination.resolve() != file.resolve() and destination.read_bytes() != file.read_bytes():
        raise SystemExit(f"Personal file differs; preserve it before installing: {destination}")
for file in files:
    destination = target / file.relative_to(source)
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_symlink() and destination.resolve() == file.resolve():
        continue
    if destination.exists() and destination.read_bytes() != file.read_bytes():
        raise SystemExit(f"Personal file differs; preserve it before installing: {destination}")
    destination.unlink(missing_ok=True)
    destination.symlink_to(file)

# Link the whole personal mod directory. Herdr canonicalizes the module root:
# individual helper-file links escape that boundary and imports are refused.
module_source = source / "mods/focus"
module_target = target / "mods/focus"
module_target.parent.mkdir(parents=True, exist_ok=True)
if not (module_target.is_symlink() and module_target.resolve() == module_source.resolve()):
    backup = module_target.with_name(f".focus-install-{os.getpid()}")
    if module_target.exists() or module_target.is_symlink():
        if module_target.is_dir() and not module_target.is_symlink():
            for file in module_target.rglob("*"):
                if not file.is_file():
                    continue
                expected = module_source / file.relative_to(module_target)
                generated = file.suffix == ".ts" or file.name == "jsconfig.json"
                if not generated and (not expected.exists() or expected.read_bytes() != file.read_bytes()):
                    raise SystemExit(f"Personal file differs; preserve it before installing: {file}")
        module_target.rename(backup)
    try:
        module_target.symlink_to(module_source, target_is_directory=True)
    except OSError:
        if backup.exists() or backup.is_symlink():
            backup.rename(module_target)
        raise
    if backup.is_symlink():
        backup.unlink()
    elif backup.exists():
        shutil.rmtree(backup)

# Older app versions bound SVG reads to the config directory even though their
# module loader follows the directory link. Keep assets inside that boundary.
shutil.copytree(module_source / "icons", target / "focus-icons", dirs_exist_ok=True)

# Home Manager already links this user's keys to the checkout. For a regular
# config file, merge only the new layout's bindings and preserve every other key.
keys_file = target / "keys.json"
source_keys = source / "keys.json"
if not keys_file.exists() or not keys_file.samefile(source_keys):
    keys = json.loads(keys_file.read_text()) if keys_file.exists() else json.loads(source_keys.read_text())
    keys["layout:focus"] = json.loads(source_keys.read_text())["layout:focus"]
    temporary = keys_file.with_name("keys.focus-install.tmp")
    temporary.write_text(json.dumps(keys, indent=2) + "\n")
    temporary.replace(keys_file)
print(f"Installed Focus in {target}")
