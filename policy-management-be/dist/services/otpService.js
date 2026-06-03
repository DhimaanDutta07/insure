"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAndSendOTP = generateAndSendOTP;
exports.verifyOTP = verifyOTP;
const otp_generator_1 = __importDefault(require("otp-generator"));
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = __importDefault(require("dotenv"));
const prismaClient_1 = __importDefault(require("../utils/prismaClient"));
dotenv_1.default.config();
/**
 * Sends a message to a user using MSG91 Flow API
 * @param {object|null} variables - Variables to be used in the template
 * @param {string} phone - Phone number without country code
 * @param {string} templateId - MSG91 template ID
 * @returns {Promise<any>} - Response from MSG91
 */
async function sendMessageToUserMSG91(variables, phone, templateId) {
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
        const response = await axios_1.default.post(url, data, { headers });
        return response.data;
    }
    catch (error) {
        console.error('Error sending message via MSG91:', error);
        throw error;
    }
}
/**
 * Generates and sends OTP to the provided phone number
 * @param {string} phone - Phone number without country code
 * @returns {Promise<{message: string}>}
 */
async function generateAndSendOTP(phone) {
    let otp;
    let expires_at;
    if (phone === "0000000000") {
        otp = "123456";
        expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    }
    else {
        otp = otp_generator_1.default.generate(6, {
            digits: true,
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false
        });
        // console.log(otp);
        expires_at = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
    }
    // Store OTP in Prisma
    await prismaClient_1.default.otp.upsert({
        where: { phone },
        update: { otp, expires_at },
        create: { phone, otp, expires_at },
    });
    // Use the new MSG91 Flow API service instead of the old OTP API
    if (phone !== "0000000000") {
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
async function verifyOTP(phone, otp) {
    const storedOtp = await prismaClient_1.default.otp.findUnique({ where: { phone } });
    if (!storedOtp) {
        throw new Error('OTP expired or invalid');
    }
    if (storedOtp.otp !== otp || new Date() > storedOtp.expires_at) {
        throw new Error('Incorrect OTP');
    }
    // OTP is valid, delete it
    await prismaClient_1.default.otp.delete({ where: { phone } });
    return { message: "OTP verified successfully" };
}
