import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

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

  // 1. Add or update the subscriber
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
  } catch (err) {
    const detail = err.response?.data?.detail || '';
    if (detail.includes('was permanently deleted and cannot be re-imported')) {
      return res.status(400).json({
        success: false,
        message:
          'This email address was previously deleted and cannot be re-added automatically. Please check your inbox for a re-subscription email or contact us for help.',
      });
    }
    return res
      .status(400)
      .json({ success: false, message: 'Failed to add subscriber.' });
  }

  // 2. Add the "Luxury on the Move" tag to the subscriber
  try {
    const subscriberHash = crypto
      .createHash('md5')
      .update(email.toLowerCase())
      .digest('hex');
    await axios.post(
      `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${LIST_ID}/members/${subscriberHash}/tags`,
      {
        tags: [
          {
            name: 'Luxury on the Move',
            status: 'active',
          },
        ],
      },
      {
        headers: {
          Authorization: `apikey ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    return res
      .status(400)
      .json({ success: false, message: 'Failed to add tag.' });
  }

  res.json({
    success: true,
    redirectUrl:
      'https://linktr.ee/nautilusarchitects1?ltsid=8499382f-5ebe-4a48-b2d3-cf2ac3e92946',
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
