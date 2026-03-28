import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def run(command):
    print("> " + command)
    result = subprocess.run(command, cwd=ROOT, shell=True)
    if result.returncode != 0:
        sys.exit(result.returncode)


def main():
    if not (ROOT / "package.json").exists():
        print("package.json was not found in this folder.")
        sys.exit(1)

    if shutil.which("npm") is None and shutil.which("npm.cmd") is None:
        print("npm was not found.")
        sys.exit(1)

    if not (ROOT / "node_modules").exists():
        run("npm install")

    run("npm run dev")


if __name__ == "__main__":
    main()