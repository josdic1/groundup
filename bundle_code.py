import os
from pathlib import Path

OUTPUT_FILE = "code_payload.txt"

SKIP_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    ".vite",
    ".next",
    "coverage",
    "__pycache__",
}

SKIP_FILES = {
    "package-lock.json",
    "README.md",
    OUTPUT_FILE,
}

INCLUDE_EXTS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".css",
    ".html",
    ".json",
    ".sql",
    ".sh",
}

PRIORITY_FILES = [
    # root workspace config
    "package.json",

    # shared types
    "packages/shared-types/package.json",
    "packages/shared-types/tsconfig.json",
    "packages/shared-types/src/index.ts",

    # server
    "server/package.json",
    "server/tsconfig.json",
    "server/src/index.ts",

    # frontend
    "frontend/package.json",
    "frontend/tsconfig.json",
    "frontend/tsconfig.app.json",
    "frontend/tsconfig.node.json",
    "frontend/vite.config.ts",
    "frontend/index.html",
    "frontend/src/main.tsx",
    "frontend/src/app/App.tsx",
    "frontend/src/config.ts",
    "frontend/src/index.css",
]


def language_hint(path: str) -> str:
    ext = Path(path).suffix.lower()
    return {
        ".ts": "ts",
        ".tsx": "tsx",
        ".js": "javascript",
        ".jsx": "jsx",
        ".css": "css",
        ".html": "html",
        ".json": "json",
        ".sql": "sql",
        ".sh": "bash",
    }.get(ext, "")


def read_file(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return f"// Error reading file: {e}"


def should_skip_dir(dirname: str) -> bool:
    return dirname in SKIP_DIRS or dirname.startswith(".")


def should_include_file(path: Path) -> bool:
    if path.name in SKIP_FILES:
        return False
    if path.name.startswith("."):
        return False
    return path.suffix.lower() in INCLUDE_EXTS


def status_label(line_count: int) -> str:
    if line_count > 500:
        return "🚨 VERY LARGE"
    if line_count > 250:
        return "⚠️ LARGE"
    return "✅ REVIEWABLE"


def add_file(root: Path, rel_path: str, payloads: list, processed: set):
    path = root / rel_path

    if not path.exists() or not path.is_file():
        return

    rel_norm = rel_path.replace("\\", "/")

    if rel_norm in processed:
        return

    payloads.append((rel_norm, read_file(path)))
    processed.add(rel_norm)


def bundle():
    root = Path.cwd()
    payloads = []
    processed = set()

    print("🔍 Bundling GroundUp monorepo...")

    # 1. Add important files first
    for rel_path in PRIORITY_FILES:
        add_file(root, rel_path, payloads, processed)

    # 2. Add the rest of frontend/server/shared-types source
    TARGET_ROOTS = [
        root / "frontend",
        root / "server",
        root / "packages" / "shared-types",
    ]

    for target_root in TARGET_ROOTS:
        if not target_root.exists():
            continue

        for current_root, dirs, files in os.walk(target_root):
            dirs[:] = sorted([d for d in dirs if not should_skip_dir(d)])

            for file_name in sorted(files):
                full_path = Path(current_root) / file_name

                if not should_include_file(full_path):
                    continue

                rel_path = full_path.relative_to(root).as_posix()

                if rel_path in processed:
                    continue

                payloads.append((rel_path, read_file(full_path)))
                processed.add(rel_path)

    if not payloads:
        print("❌ No files found. Run this from the repo root.")
        return

    output_path = root / OUTPUT_FILE

    with output_path.open("w", encoding="utf-8") as out:
        out.write("🚀 GROUNDUP MONOREPO BUNDLE\n")
        out.write("=" * 80 + "\n\n")
        out.write(f"PROJECT ROOT: {root.as_posix()}\n")
        out.write(f"TOTAL FILES: {len(payloads)}\n")
        out.write("INCLUDES: frontend, server, packages/shared-types\n\n")

        for index, (path, content) in enumerate(payloads, start=1):
            line_count = content.count("\n") + (1 if content else 0)
            lang = language_hint(path)

            out.write(f"--- BATCH {index} | {path} ---\n")
            out.write(f"STATUS: {status_label(line_count)} ({line_count} lines)\n")
            out.write(f"FILE: {path}\n")
            out.write("```" + lang + "\n")
            out.write(content)
            if content and not content.endswith("\n"):
                out.write("\n")
            out.write("```\n")
            out.write("\n" + "=" * 80 + "\n\n")

    print(f"✨ Success! Bundled {len(payloads)} files into {OUTPUT_FILE}")
    print("📦 Included shared types from packages/shared-types/src/index.ts")


if __name__ == "__main__":
    bundle()