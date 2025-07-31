const express = require("express");
const router = express.Router();

require('dotenv').config();
const axios = require('axios');

const VERYFI_API_URL = 'https://api.veryfi.com/api/v8/partner/documents/';

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Client-Id': process.env.VERYFI_CLIENT_ID,
  'Authorization': `apikey ${process.env.VERYFI_USERNAME}:${process.env.VERYFI_API_KEY}`
};

async function processDocument(fileName, fileDataBase64) {
  try {
    const response = await axios.post(VERYFI_API_URL, {
      file_name: fileName,
      file_data: fileDataBase64
    }, { headers });

    return response.data;
  } catch (error) {
    console.error('Veryfi Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = { processDocument, router };
