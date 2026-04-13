import https from "https";

// Fetch heart puzzle from external API
async function getHeartPuzzle(req, res) {
  try {
    // Fetch puzzle data from API
    const puzzleData = await new Promise((resolve, reject) => {
      https.get('https://marcconrad.com/uob/heart/api.php?out=json&base64=no', (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    // Fetch image buffer
    const imageBuffer = await new Promise((resolve, reject) => {
      https.get(puzzleData.question, (response) => {
        const chunks = [];
        response.on('data', (chunk) => {
          chunks.push(chunk);
        });
        response.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
      }).on('error', reject);
    });

    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');

    // Determine MIME type
    const mimeType = puzzleData.question.includes('.png') ? 'image/png' :
                     puzzleData.question.includes('.jpg') || puzzleData.question.includes('.jpeg') ? 'image/jpeg' :
                     'image/png';

    // Format puzzle response
    const formattedPuzzle = {
      image: base64Image,
      mime: mimeType,
      solution: puzzleData.solution
    };

    res.json({ puzzle: formattedPuzzle });
  } catch (error) {
    console.error("Error fetching heart puzzle:", error);
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    res.status(500).json({ error: "Failed to fetch heart puzzle", details: error.message });
  }
}


export { getHeartPuzzle };