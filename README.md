# JSChess

A browser-based JavaScript chess engine and UI. The project includes a playable board, engine search, evaluation display, opening-book support, and Node-based engine test scripts.

## Features

- Play chess in the browser
- Human vs engine, human vs human, and engine-vs-engine modes
- FEN input and current-position output
- Evaluation bar, principal variation, and top-move display
- Opening book loading from `bookXml.xml`
- Node regression, match, and Stockfish comparison scripts

## Run Locally

Open `index.html` in a browser, or serve the folder with a simple static server:

```powershell
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Test

The regression script runs the engine in Node with lightweight DOM stubs:

```powershell
node scripts/regression.js
```

The full regression can take several minutes because it includes search checks.

## Useful Scripts

```powershell
node scripts/selfplay.js
node scripts/engine-match.js --a js/all.js --b js/all.js --games 20 --time 250
node scripts/position-fuzzer.js --help
```

Some comparison scripts require a local Stockfish executable path.

## License

Original project code is licensed under the MIT License. See [LICENSE](LICENSE).

Bundled third-party files retain their own licenses. See [NOTICE.md](NOTICE.md).
