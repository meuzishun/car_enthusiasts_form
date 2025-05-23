import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

const API_KEY = process.env.MAILCHIMP_API_KEY;
const SERVER_PREFIX = process.env.MAILCHIMP_SERVER_PREFIX;
const LIST_ID = process.env.MAILCHIMP_LIST_ID;

app.post('/subscribe', async (req, res) => {
  const { email, firstName, lastName } = req.body;

  try {
    await axios.post(
      `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`,
      {
        email_address: email,
        status: 'subscribed',
        merge_fields: {
          FNAME: firstName || '',
          LNAME: lastName || '',
        },
      },
      {
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // Redirect to custom success page
    res.redirect(
      'https://linktr.ee/nautilusarchitects1?ltsid=8499382f-5ebe-4a48-b2d3-cf2ac3e92946'
    );
  } catch (err) {
    console.error('Mailchimp Error:', err.response?.data || err.message);
    res.redirect('/error.html');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
