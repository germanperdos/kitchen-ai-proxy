import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const replicateToken = process.env.REPLICATE_API_TOKEN

app.post('/generate', async (req, res) => {
  const userPrompt = req.body.prompt

  const prediction = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Token ${replicateToken}`
    },
   body: JSON.stringify({
    version: "e7cf05ccea7b60c80b6b84e8216f2525b7cfb7b8687dc792f60a38c5d0c180a1",
    input: {
      prompt: "high quality kitchen interior design, " + userPrompt
    }
  })
  })

if (!prediction.ok) {
  const errorText = await prediction.text();
  console.error("Ошибка Replicate:", errorText);
  return res.status(500).json({ error: "Ошибка от Replicate API" });
}

const predictionData = await prediction.json();
const statusUrl = predictionData.urls.get;


  let outputUrl = null
  let tries = 0

  while (!outputUrl && tries < 10) {
    const statusRes = await fetch(statusUrl, {
      headers: {
        "Authorization": `Token ${replicateToken}`
      }
    })

    const statusJson = await statusRes.json()

    if (statusJson.status === "succeeded") {
      outputUrl = statusJson.output[0]
    } else if (statusJson.status === "failed") {
      return res.status(500).json({ error: "Generation failed" })
    }

    await new Promise(r => setTimeout(r, 3000))
    tries++
  }

  if (outputUrl) {
    res.json({ image: outputUrl })
  } else {
    res.status(500).json({ error: "Timeout" })
  }
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
