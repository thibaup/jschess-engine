from __future__ import annotations
import argparse
import heapq
import math
import os
import re
import shutil
import sys
import urllib.request
import zipfile
from itertools import count
from pathlib import Path



import chess
import chess.pgn
import chess.polyglot

UCI_RE = re.compile(r"^[a-h][1-8][a-h][1-8][qrbn]?$", re.IGNORECASE)

PRESETS = {
    "gm2001": {
        "url": "https://raw.githubusercontent.com/michaeldv/donna_opening_books/master/gm2001.bin",
        "kind": "bin",
        "filename": "gm2001.bin",
    },
    "komodo": {
        "url": "https://raw.githubusercontent.com/michaeldv/donna_opening_books/master/komodo.bin",
        "kind": "bin",
        "filename": "komodo.bin",
    },
    "rodent": {
        "url": "https://raw.githubusercontent.com/michaeldv/donna_opening_books/master/rodent.bin",
        "kind": "bin",
        "filename": "rodent.bin",
    },
    "human": {
        "url": "https://digilander.libero.it/taioscacchi/archivio/Human-polyglot.zip",
        "kind": "zip->bin",
        "filename": "Human-polyglot.zip",
    },
    "titans": {
        "url": "https://digilander.libero.it/taioscacchi/archivio/Titans.zip",
        "kind": "zip->bin",
        "filename": "Titans.zip",
    },
}


def human_bytes(n: int) -> str:
    units = ["B", "KB", "MB", "GB", "TB"]
    x = float(n)
    for u in units:
        if x < 1024.0 or u == units[-1]:
            return f"{x:.1f}{u}" if u != "B" else f"{int(x)}B"
        x /= 1024.0
    return f"{n}B"


def download_file(url: str, dst: Path, overwrite: bool = False) -> Path:
    dst.parent.mkdir(parents=True, exist_ok=True)
    part = dst.with_suffix(dst.suffix + ".part")

    if dst.exists() and not overwrite:
        return dst

    resume_from = part.stat().st_size if part.exists() else 0
    headers = {"User-Agent": "book-downloader/1.0"}
    if resume_from > 0 and not overwrite:
        headers["Range"] = f"bytes={resume_from}-"

    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        status = getattr(resp, "status", None)
        total = resp.headers.get("Content-Length")
        total_int = int(total) + resume_from if total and status == 206 else (int(total) if total else None)

        mode = "ab" if (resume_from > 0 and status == 206) else "wb"
        downloaded = resume_from if mode == "ab" else 0

        with part.open(mode) as f:
            while True:
                chunk = resp.read(1024 * 1024)
                if not chunk:
                    break
                f.write(chunk)
                downloaded += len(chunk)
                if total_int:
                    pct = (downloaded / total_int) * 100.0
                    print(
                        f"\rDownloading {dst.name}: {pct:6.2f}% ({human_bytes(downloaded)}/{human_bytes(total_int)})",
                        end="",
                        file=sys.stderr,
                    )
                else:
                    print(f"\rDownloading {dst.name}: {human_bytes(downloaded)}", end="", file=sys.stderr)

    print("", file=sys.stderr)
    part.replace(dst)
    return dst


def safe_extract_zip(zip_path: Path, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    extracted: list[Path] = []
    with zipfile.ZipFile(zip_path) as z:
        for info in z.infolist():
            name = info.filename
            if not name or name.endswith("/"):
                continue
            target = (out_dir / name).resolve()
            if not str(target).startswith(str(out_dir.resolve()) + os.sep):
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(info) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            extracted.append(target)
    return extracted


def pick_largest_bin(paths: list[Path]) -> Path:
    bins = [p for p in paths if p.suffix.lower() == ".bin" and p.is_file()]
    if not bins:
        raise FileNotFoundError("No .bin found after extraction.")
    bins.sort(key=lambda p: p.stat().st_size, reverse=True)
    return bins[0]


def write_xml(lines: list[tuple[str, ...]], out_path: Path):
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write("<book>\n")
        for moves in lines:
            f.write(f"<line>{' '.join(moves)} </line>\n")
        f.write("</book>\n")


def parse_tscp_txt(path: Path) -> list[tuple[str, ...]]:
    out: list[tuple[str, ...]] = []
    for raw in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw.strip()
        if not line or line.startswith(("#", ";", "//")):
            continue
        toks = [t.lower() for t in line.split() if UCI_RE.match(t)]
        if toks:
            out.append(tuple(toks))
    return out


def parse_pgn(path: Path, max_plies: int, max_games: int | None) -> list[tuple[str, ...]]:
    out: list[tuple[str, ...]] = []
    with path.open("r", encoding="utf-8", errors="ignore") as f:
        game_count = 0
        while True:
            game = chess.pgn.read_game(f)
            if game is None:
                break
            game_count += 1
            if max_games is not None and game_count > max_games:
                break
            toks: list[str] = []
            for mv in game.mainline_moves():
                toks.append(mv.uci())
                if len(toks) >= max_plies:
                    break
            if toks:
                out.append(tuple(toks))
    return out


def resolve_input(args) -> tuple[Path, str]:
    dl_dir = Path(args.download_dir)

    if args.preset:
        p = PRESETS[args.preset]
        downloaded = download_file(p["url"], dl_dir / p["filename"], overwrite=args.overwrite_download)
        if p["kind"] == "bin":
            return downloaded, "bin"
        if p["kind"] == "zip->bin":
            extract_dir = dl_dir / (downloaded.stem + "_extracted")
            extracted = safe_extract_zip(downloaded, extract_dir)
            return pick_largest_bin(extracted), "bin"
        raise ValueError("Unsupported preset kind")

    if args.url:
        name = Path(urllib.request.urlparse(args.url).path).name or "downloaded"
        downloaded = download_file(args.url, dl_dir / name, overwrite=args.overwrite_download)
        typ = args.type or ("zip" if downloaded.suffix.lower() == ".zip" else downloaded.suffix.lower().lstrip("."))
        if typ == "zip":
            extract_dir = dl_dir / (downloaded.stem + "_extracted")
            extracted = safe_extract_zip(downloaded, extract_dir)
            return pick_largest_bin(extracted), "bin"
        return downloaded, typ

    if args.input:
        inp = Path(args.input)
        if not inp.exists():
            raise FileNotFoundError(str(inp))
        typ = args.type or ("zip" if inp.suffix.lower() == ".zip" else inp.suffix.lower().lstrip("."))
        if typ == "zip":
            extract_dir = dl_dir / (inp.stem + "_extracted")
            extracted = safe_extract_zip(inp, extract_dir)
            return pick_largest_bin(extracted), "bin"
        return inp, typ

    raise ValueError("Provide one of: --preset, --url, or --in")


class GroupStream:
    def __init__(
        self,
        reader: chess.polyglot.Reader,
        start_board: chess.Board,
        start_path: tuple[str, ...],
        start_score: float,
        *,
        max_depth: int,
        min_depth: int,
        topk: int,
        min_weight: int,
    ):
        self.reader = reader
        self.max_depth = max_depth
        self.min_depth = min_depth
        self.topk = topk
        self.min_weight = min_weight
        self._ctr = count()
        self._heap: list[tuple[float, int, int, chess.Board, tuple[str, ...]]] = []
        heapq.heappush(self._heap, (-start_score, len(start_path), next(self._ctr), start_board, start_path))

    def next_line(self) -> tuple[float, tuple[str, ...]] | None:
        while self._heap:
            neg_score, depth, _, board, path = heapq.heappop(self._heap)
            score = -neg_score

            entries = list(self.reader.find_all(board))
            entries.sort(key=lambda e: e.weight, reverse=True)
            filtered = [e for e in entries if e.weight >= self.min_weight]
            if self.topk > 0:
                filtered = filtered[: self.topk]

            terminal = (depth >= self.max_depth) or (not filtered)
            if terminal:
                if path and (depth >= self.min_depth or not filtered or depth >= self.max_depth):
                    return score, path
                if path and not filtered:
                    return score, path
                continue

            for e in filtered:
                mv = e.move
                if mv not in board.legal_moves:
                    continue
                w = int(e.weight)
                if w <= 0:
                    continue
                nb = board.copy(stack=False)
                nb.push(mv)
                np = path + (mv.uci(),)
                ns = score + math.log(w)
                heapq.heappush(self._heap, (-ns, depth + 1, next(self._ctr), nb, np))

        return None


def build_groups(
    reader: chess.polyglot.Reader,
    *,
    root_topk: int,
    reply_topk: int,
    group_min_weight: int,
) -> list[tuple[chess.Board, tuple[str, ...], float]]:
    start = chess.Board()

    root_entries = list(reader.find_all(start))
    root_entries.sort(key=lambda e: e.weight, reverse=True)
    root_filtered = [e for e in root_entries if e.weight >= group_min_weight]
    if root_topk > 0:
        root_filtered = root_filtered[:root_topk]

    groups: list[tuple[chess.Board, tuple[str, ...], float]] = []
    for e1 in root_filtered:
        m1 = e1.move
        if m1 not in start.legal_moves:
            continue
        b1 = start.copy(stack=False)
        b1.push(m1)

        reply_entries = list(reader.find_all(b1))
        reply_entries.sort(key=lambda e: e.weight, reverse=True)
        reply_filtered = [e for e in reply_entries if e.weight >= group_min_weight]
        if reply_topk > 0:
            reply_filtered = reply_filtered[:reply_topk]

        for e2 in reply_filtered:
            m2 = e2.move
            if m2 not in b1.legal_moves:
                continue
            b2 = b1.copy(stack=False)
            b2.push(m2)
            path = (m1.uci(), m2.uci())
            score = math.log(max(1, int(e1.weight))) + math.log(max(1, int(e2.weight)))
            groups.append((b2, path, score))

    return groups


def polyglot_varied_best_lines(
    book_path: Path,
    *,
    max_lines: int,
    per_group_cap: int,
    ensure_coverage: bool,
    max_depth: int,
    min_depth: int,
    topk: int,
    min_weight: int,
    root_topk: int,
    reply_topk: int,
    group_min_weight: int,
) -> list[tuple[str, ...]]:
    out: list[tuple[str, ...]] = []
    seen: set[tuple[str, ...]] = set()

    with chess.polyglot.open_reader(str(book_path)) as reader:
        group_seeds = build_groups(
            reader,
            root_topk=root_topk,
            reply_topk=reply_topk,
            group_min_weight=group_min_weight,
        )

        streams: list[GroupStream] = []
        for b2, path2, score2 in group_seeds:
            streams.append(
                GroupStream(
                    reader,
                    b2,
                    path2,
                    score2,
                    max_depth=max_depth,
                    min_depth=min_depth,
                    topk=topk,
                    min_weight=min_weight,
                )
            )

        group_counts = [0] * len(streams)
        global_ctr = count()
        global_heap: list[tuple[float, int, int, tuple[str, ...]]] = []

        def push_next(gid: int):
            if group_counts[gid] >= per_group_cap:
                return
            nxt = streams[gid].next_line()
            if nxt is None:
                return
            score, moves = nxt
            heapq.heappush(global_heap, (-score, next(global_ctr), gid, moves))

        if ensure_coverage:
            for gid in range(len(streams)):
                if len(out) >= max_lines:
                    break
                if group_counts[gid] >= per_group_cap:
                    continue
                first = streams[gid].next_line()
                if first is None:
                    continue
                _, moves = first
                if moves not in seen:
                    seen.add(moves)
                    out.append(moves)
                    group_counts[gid] += 1
                push_next(gid)
        else:
            for gid in range(len(streams)):
                push_next(gid)

        while global_heap and len(out) < max_lines:
            _, _, gid, moves = heapq.heappop(global_heap)
            if group_counts[gid] >= per_group_cap:
                continue
            if moves in seen:
                push_next(gid)
                continue
            seen.add(moves)
            out.append(moves)
            group_counts[gid] += 1
            push_next(gid)

    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)

    ap.add_argument("--preset", choices=sorted(PRESETS))
    ap.add_argument("--url")
    ap.add_argument("--in", dest="input")
    ap.add_argument("--type", choices=["txt", "pgn", "bin", "zip"])

    ap.add_argument("--download-dir", default="downloads")
    ap.add_argument("--overwrite-download", action="store_true", default=False)

    ap.add_argument("--max-plies", type=int, default=24)
    ap.add_argument("--max-games", type=int, default=None)

    ap.add_argument("--max-lines", type=int, default=100000)

    ap.add_argument("--max-depth", type=int, default=20)
    ap.add_argument("--min-depth", type=int, default=12)

    ap.add_argument("--topk", type=int, default=3)
    ap.add_argument("--min-weight", type=int, default=2)

    ap.add_argument("--root-topk", type=int, default=40)
    ap.add_argument("--reply-topk", type=int, default=40)
    ap.add_argument("--group-min-weight", type=int, default=1)

    ap.add_argument("--per-group-cap", type=int, default=1200)
    ap.add_argument("--no-coverage", action="store_true", default=False)

    args = ap.parse_args()
    inp_path, typ = resolve_input(args)
    out_path = Path(args.out)

    if typ == "txt":
        lines = parse_tscp_txt(inp_path)
    elif typ == "pgn":
        lines = parse_pgn(inp_path, max_plies=args.max_plies, max_games=args.max_games)
    elif typ == "bin":
        lines = polyglot_varied_best_lines(
            inp_path,
            max_lines=args.max_lines,
            per_group_cap=args.per_group_cap,
            ensure_coverage=not args.no_coverage,
            max_depth=args.max_depth,
            min_depth=args.min_depth,
            topk=args.topk,
            min_weight=args.min_weight,
            root_topk=args.root_topk,
            reply_topk=args.reply_topk,
            group_min_weight=args.group_min_weight,
        )
    else:
        raise ValueError(f"Unsupported type after resolution: {typ}")

    write_xml(lines, out_path)


if __name__ == "__main__":
    raise SystemExit(main())