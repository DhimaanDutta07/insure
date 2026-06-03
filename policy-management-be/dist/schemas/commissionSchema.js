"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commissionUpdateSchema = exports.commissionSchema = void 0;
const zod_1 = require("zod");
exports.commissionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    description: zod_1.z.string().optional(),
});
exports.commissionUpdateSchema = exports.commissionSchema.partial();
