"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function seedRequiredData() {
    try {
        console.log('🌱 Seeding required data...');
        // Seed Policy Groups
        const policyGroups = [
            'HEALTH INSURANCE',
            'LIFE INSURANCE',
            'MOTOR INSURANCE',
            'TRAVEL INSURANCE',
            'HOME INSURANCE',
        ];
        const policyGroupMap = {};
        for (const name of policyGroups) {
            const existing = await prisma.policyGroup.findUnique({ where: { name } });
            if (!existing) {
                const group = await prisma.policyGroup.create({ data: { name } });
                policyGroupMap[name] = group.id;
                console.log(`✅ Added Policy Group: ${name}`);
            }
            else {
                policyGroupMap[name] = existing.id;
                console.log(`ℹ️ Policy Group already exists: ${name}`);
            }
        }
        // Seed Companies
        const companies = [
            'HDFC ERGO',
            'NIVA BUPA',
            'STAR HEALTH',
            'CARE HEALTH',
            'ICICI LOMBARD',
        ];
        const companyMap = {};
        for (const name of companies) {
            const existing = await prisma.company.findUnique({ where: { name } });
            if (!existing) {
                const company = await prisma.company.create({ data: { name, category: 'HEALTH' } });
                companyMap[name] = company.id;
                console.log(`✅ Added Company: ${name}`);
            }
            else {
                companyMap[name] = existing.id;
                console.log(`ℹ️ Company already exists: ${name}`);
            }
        }
        // Seed Policy Types
        const policyTypes = ['Individual', 'Family', 'Group'];
        const policyTypeMap = {};
        for (const name of policyTypes) {
            const existing = await prisma.policyType.findUnique({ where: { name } });
            if (!existing) {
                const type = await prisma.policyType.create({ data: { name } });
                policyTypeMap[name] = type.id;
                console.log(`✅ Added Policy Type: ${name}`);
            }
            else {
                policyTypeMap[name] = existing.id;
                console.log(`ℹ️ Policy Type already exists: ${name}`);
            }
        }
        // Seed Policy Names
        const policiesByCompany = {
            'HDFC ERGO': [
                'OPTIMA RESTORE',
                'OPTIMA SECURE',
                'OPTIMA SUPER SECURE',
                'ENERGY',
                'EASY HEALTH',
                'KOTI SURAKSHA',
                'IPA',
                'TRAVEL',
                'OTHERS',
            ],
            'NIVA BUPA': [
                'ASPIRE',
                'REASSURE',
                'REASSURE 2.0',
                'PERSONAL ACCIDENT',
                'HEALTH RECHARGE V2',
                'HEALTH COMPANION',
                'HEARTBEAT',
                'OTHERS',
            ],
            'STAR HEALTH': [
                'SUPER STAR',
                'HEALTH ASSURE',
                'STAR COMPREHENSIVE',
                'YOUNG STAR',
                'WOMEN CARE',
                'FAMILY HEALTH OPTIMA',
                'TRAVEL',
                'OTHERS',
            ],
            'CARE HEALTH': [
                'CARE SUPREME',
                'CARE ULTIMATE',
                'IPA',
                'TRAVEL',
                'CARE ADVANTAGE',
                'OTHERS',
            ],
            'ICICI LOMBARD': [
                'ELEVATE',
                'HEALTH ADVANTEDGE',
                'TRAVEL',
                'COMPLETE HEALTH INSURANCE (CHI)',
                'OTHERS',
            ],
        };
        for (const [company, policies] of Object.entries(policiesByCompany)) {
            for (const policyName of policies) {
                const existing = await prisma.policyName.findFirst({
                    where: {
                        name: policyName,
                        company_id: companyMap[company],
                        policy_group_id: policyGroupMap['HEALTH INSURANCE'],
                    },
                });
                if (!existing) {
                    await prisma.policyName.create({
                        data: {
                            name: policyName,
                            policy_group_id: policyGroupMap['HEALTH INSURANCE'],
                            company_id: companyMap[company],
                        },
                    });
                    console.log(`✅ Added policy: ${policyName} (${company})`);
                }
                else {
                    console.log(`ℹ️ Policy already exists: ${policyName} (${company})`);
                }
            }
        }
        console.log('🎉 Seeding completed successfully!');
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    seedRequiredData().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
exports.default = seedRequiredData;
