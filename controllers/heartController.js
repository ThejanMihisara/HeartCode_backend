import https from "https";

// Function to fetch the heart puzzle from the heart API
async function getHeartPuzzle(req, res) {
  try {
 

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

    const base64Image = imageBuffer.toString('base64');

  
    const mimeType = puzzleData.question.includes('.png') ? 'image/png' :
                     puzzleData.question.includes('.jpg') || puzzleData.question.includes('.jpeg') ? 'image/jpeg' :
                     'image/png';

   
    const formattedPuzzle = {
      image: base64Image,
      mime: mimeType,
      solution: puzzleData.solution
    };

    // Log the response for debugging
    // console.log('Heart puzzle fetched successfully');

    // Send the formatted puzzle data
    res.json({ puzzle: formattedPuzzle });
  } catch (error) {
    // Log detailed error messages for debugging
    console.error("Error fetching heart puzzle:", error);
    console.error("Error details:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }

    // Return a detailed error message to the client
    res.status(500).json({ error: "Failed to fetch heart puzzle", details: error.message });
  }
}


export { getHeartPuzzle };