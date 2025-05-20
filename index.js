
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const assistant_id = process.env.ASSISTANT_ID;
const thread_id = process.env.THREAD_ID;

app.post('/', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    await openai.beta.threads.messages.create(thread_id, {
      role: "user",
      content: prompt
    });

    const run = await openai.beta.threads.runs.create(thread_id, {
      assistant_id: assistant_id,
    });

    let status;
    let tries = 0;
    let run_result;

    while (tries < 20) {
      run_result = await openai.beta.threads.runs.retrieve(thread_id, run.id);
      status = run_result.status;

      if (status === "completed") break;
      if (status === "failed") throw new Error("❌ Run failed");

      await new Promise(r => setTimeout(r, 1000));
      tries++;
    }

    const messages = await openai.beta.threads.messages.list(thread_id);
    const reply = messages.data[0]?.content[0]?.text?.value || "❌ No reply received";

    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
