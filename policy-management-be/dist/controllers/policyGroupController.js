"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllPolicyNames = exports.deletePolicyName = exports.updatePolicyName = exports.getPolicyName = exports.getPolicyNames = exports.createPolicyName = exports.deletePolicyGroup = exports.updatePolicyGroup = exports.getPolicyGroup = exports.getAllPolicyGroups = exports.createPolicyGroup = void 0;
const policyGroupService_1 = require("../services/policyGroupService");
const policyGroupSchema_1 = require("../schemas/policyGroupSchema");
const errorHandler_1 = require("../utils/errorHandler");
// PolicyGroup CRUD
exports.createPolicyGroup = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.createPolicyGroupSchema.parse({
        body: req.body
    });
    const { name, description } = validatedData.body;
    const policyGroup = await (0, policyGroupService_1.addPolicyGroup)({ name, description: description || undefined });
    res.status(201).json(policyGroup);
});
exports.getAllPolicyGroups = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const policyGroups = await (0, policyGroupService_1.fetchAllPolicyGroups)();
    res.status(200).json({ policyGroups });
});
exports.getPolicyGroup = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.getPolicyGroupSchema.parse({
        params: req.params
    });
    const { id } = validatedData.params;
    const policyGroup = await (0, policyGroupService_1.fetchPolicyGroupById)(id);
    if (!policyGroup) {
        res.status(404).json({ error: 'PolicyGroup not found' });
        return;
    }
    res.status(200).json(policyGroup);
});
exports.updatePolicyGroup = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.updatePolicyGroupSchema.parse({
        params: req.params,
        body: req.body
    });
    const { id } = validatedData.params;
    const { name, description } = validatedData.body;
    const updatedPolicyGroup = await (0, policyGroupService_1.modifyPolicyGroup)(id, { name, description: description || undefined });
    res.status(200).json(updatedPolicyGroup);
});
exports.deletePolicyGroup = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.deletePolicyGroupSchema.parse({
        params: req.params
    });
    const { id } = validatedData.params;
    const deletedPolicyGroup = await (0, policyGroupService_1.removePolicyGroup)(id);
    res.status(200).json(deletedPolicyGroup);
});
// PolicyName CRUD
exports.createPolicyName = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.createPolicyNameSchema.parse({
        params: req.params,
        body: req.body
    });
    const { id } = validatedData.params; // policyGroupId
    const { name, description } = validatedData.body;
    const policyName = await (0, policyGroupService_1.addPolicyName)(id, { name, description: description || undefined });
    res.status(201).json(policyName);
});
exports.getPolicyNames = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.getPolicyNamesSchema.parse({
        params: req.params
    });
    const { id } = validatedData.params; // policyGroupId
    const policyNames = await (0, policyGroupService_1.fetchPolicyNamesByGroupId)(id);
    res.status(200).json(policyNames);
});
exports.getPolicyName = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.getPolicyNameSchema.parse({
        params: req.params
    });
    const { id } = validatedData.params;
    const policyName = await (0, policyGroupService_1.fetchPolicyNameById)(id);
    if (!policyName) {
        res.status(404).json({ error: 'PolicyName not found' });
        return;
    }
    res.status(200).json(policyName);
});
exports.updatePolicyName = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.updatePolicyNameSchema.parse({
        params: req.params,
        body: req.body
    });
    const { id } = validatedData.params;
    const { name, description, policy_group_id } = validatedData.body;
    if (!policy_group_id) {
        res.status(400).json({ error: 'policy_group_id is required' });
        return;
    }
    const updatedPolicyName = await (0, policyGroupService_1.modifyPolicyName)(id, {
        name,
        description: description || undefined,
        policy_group_id
    });
    res.status(200).json(updatedPolicyName);
});
exports.deletePolicyName = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const validatedData = policyGroupSchema_1.deletePolicyNameSchema.parse({
        params: req.params
    });
    const { id } = validatedData.params;
    const deletedPolicyName = await (0, policyGroupService_1.removePolicyName)(id);
    res.status(200).json(deletedPolicyName);
});
exports.getAllPolicyNames = (0, errorHandler_1.asyncTryCatch)(async (req, res) => {
    const policyNames = await (0, policyGroupService_1.fetchAllPolicyNames)();
    if (!policyNames) {
        res.status(404).json({ error: 'PolicyNames not found' });
        return;
    }
    res.status(200).json(policyNames);
});
