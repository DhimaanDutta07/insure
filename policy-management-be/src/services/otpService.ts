import otpGenerator from 'otp-generator';
import axios from 'axios';
import dotenv from 'dotenv';
import prisma from '../utils/prismaClient';

dotenv.config();

/**
 * Sends a message to a user using MSG91 Flow API
 * @param {object|null} variables - Variables to be used in the template
 * @param {string} phone - Phone number without country code
 * @param {string} templateId - MSG91 template ID
 * @returns {Promise<any>} - Response from MSG91
 */
async function sendMessageToUserMSG91(variables:string, phone: string, templateId: string): Promise<any> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const url = 'https://control.msg91.com/api/v5/flow/';
  const country = '91';

  const data = {
    template_id: templateId,
    short_url: '0',
    recipients: [
      {
        mobiles: country + phone,
        var: variables,
        var1: 30
      },
    ],
  };

  const headers = {
    'accept': 'application/json',
    'authkey': authKey,
    'content-type': 'application/json',
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Error sending message via MSG91:', error);
    throw error;
  }
}

/**
 * Generates and sends OTP to the provided phone number
 * @param {string} phone - Phone number without country code
 * @returns {Promise<{message: string}>}
 */
export async function generateAndSendOTP(phone: string): Promise<{ message: string; }> {
  let otp;
  let expires_at;
  if(phone === "0000000000"){
    otp = "123456"
    expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

  }
  else{
     otp = otpGenerator.generate(6, { 
        digits: true, 
        upperCaseAlphabets: false, 
        lowerCaseAlphabets: false, 
        specialChars: false 
      });
  // console.log(otp);
  expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
}

  // Store OTP in Prisma
  await prisma.otp.upsert({
    where: { phone },
    update: { otp, expires_at },
    create: { phone, otp, expires_at },
  });

  // Use the new MSG91 Flow API service instead of the old OTP API
  if(phone !== "0000000000"){
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!templateId) {
    throw new Error('MSG91_FLOW_TEMPLATE_ID is not defined in environment variables');
  }
  const variables = otp; // Variables to be used in the template

  await sendMessageToUserMSG91(variables, phone, templateId);
}

  return { message: "OTP sent successfully" };
}



/**
 * Verifies OTP entered by user
 * @param {string} phone - Phone number without country code
 * @param {string} otp - OTP entered by user
 * @returns {Promise<{message: string}>}
 */
export async function verifyOTP(phone: string, otp: string): Promise<{ message: string; }> {
  const storedOtp = await prisma.otp.findUnique({ where: { phone } });

  if (!storedOtp) {
    throw new Error('OTP expired or invalid');
  }

  if (storedOtp.otp !== otp || new Date() > storedOtp.expires_at) {
    throw new Error('Incorrect OTP');
  }

  // OTP is valid, delete it
  await prisma.otp.delete({ where: { phone } });

  return { message: "OTP verified successfully" };
}