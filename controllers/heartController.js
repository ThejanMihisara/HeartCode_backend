import axios from "axios";

function svgToBase64(svg) {
  return Buffer.from(svg).toString("base64");
}

function makeFallbackPuzzle() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const c = Math.floor(Math.random() * 5) + 1;
  const solution = a + b + c;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="420" height="220" viewBox="0 0 420 220">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#12273a"/>
          <stop offset="100%" stop-color="#244964"/>
        </linearGradient>
      </defs>
      <rect width="420" height="220" rx="28" fill="url(#bg)"/>
      <text x="210" y="56" text-anchor="middle" fill="#f8fafc" font-size="24" font-family="Arial">Heart revive puzzle</text>
      <text x="210" y="120" text-anchor="middle" fill="#fbbf24" font-size="54" font-weight="700" font-family="Arial">${a} + ${b} + ${c} = ?</text>
      <text x="210" y="172" text-anchor="middle" fill="#cbd5e1" font-size="20" font-family="Arial">Enter the result to continue your run</text>
    </svg>`;

  return { image: svgToBase64(svg), solution, source: "local-fallback", mime: "image/svg+xml" };
}

function normalizePuzzle(data) {
  if (!data || typeof data !== "object") return null;
  const image = data.image || data.question || data.img || data.base64 || null;
  const solution = data.solution ?? data.answer ?? data.result ?? null;
  if (!image || solution == null) return null;
  return { image, solution, source: "heart-api", mime: "image/png" };
}

export async function getHeartPuzzle(req, res) {
  const urls = [
    "https://marcconrad.com/uob/heart/api.php?out=json&base64=yes",
    "http://marcconrad.com/uob/heart/api.php?out=json&base64=yes",
  ];

  for (const url of urls) {
    try {
      const { data } = await axios.get(url, { timeout: 9000 });
      const puzzle = normalizePuzzle(data);
      if (puzzle) {
        return res.json({ puzzle });
      }
    } catch {
      // try next source
    }
  }

  return res.json({ puzzle: makeFallbackPuzzle() });
}
