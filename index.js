
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const API_KEY = 'YOUR_OPENAI_PROJECT_API_KEY';
const ASSISTANT_ID = 'YOUR_ASSISTANT_ID';

app.post('/', async (req, res) => {
  const { prompt } = req.body;

  try {
    const headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    };

    const threadRes = await axios.post('https://api.openai.com/v1/threads', {}, { headers });
    const threadId = threadRes.data.id;

    await axios.post(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      role: 'user',
      content: prompt
    }, { headers });

    const runRes = await axios.post(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      assistant_id: ASSISTANT_ID
    }, { headers });

    const runId = runRes.data.id;

    let status = 'in_progress';
    while (status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusCheck = await axios.get(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, { headers });
      status = statusCheck.data.status;
    }

    const messagesRes = await axios.get(`https://api.openai.com/v1/threads/${threadId}/messages`, { headers });
    const reply = messagesRes.data.data[0].content[0].text.value;

    res.json({ reply });
  } catch (error) {
    console.error(error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
