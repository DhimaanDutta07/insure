"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchAllPolicyNames = exports.removePolicyName = exports.modifyPolicyName = exports.fetchPolicyNameById = exports.fetchPolicyNamesByGroupId = exports.addPolicyName = exports.removePolicyGroup = exports.modifyPolicyGroup = exports.fetchPolicyGroupById = exports.fetchAllPolicyGroups = exports.addPolicyGroup = void 0;
const policyGroupRepository_1 = require("../repositories/policyGroupRepository");
const addPolicyGroup = async (policyGroupData) => {
    return (0, policyGroupRepository_1.createPolicyGroup)(policyGroupData);
};
exports.addPolicyGroup = addPolicyGroup;
const fetchAllPolicyGroups = async () => {
    return (0, policyGroupRepository_1.getAllPolicyGroups)();
};
exports.fetchAllPolicyGroups = fetchAllPolicyGroups;
const fetchPolicyGroupById = async (id) => {
    return (0, policyGroupRepository_1.getPolicyGroupById)(id);
};
exports.fetchPolicyGroupById = fetchPolicyGroupById;
const modifyPolicyGroup = async (id, policyGroupData) => {
    return (0, policyGroupRepository_1.updatePolicyGroup)(id, policyGroupData);
};
exports.modifyPolicyGroup = modifyPolicyGroup;
const removePolicyGroup = async (id) => {
    return (0, policyGroupRepository_1.deletePolicyGroup)(id);
};
exports.removePolicyGroup = removePolicyGroup;
const addPolicyName = async (policyGroupId, policyNameData) => {
    const data = { ...policyNameData, policy_group_id: policyGroupId };
    return (0, policyGroupRepository_1.createPolicyName)(data);
};
exports.addPolicyName = addPolicyName;
const fetchPolicyNamesByGroupId = async (policyGroupId) => {
    return (0, policyGroupRepository_1.getPolicyNamesByGroupId)(policyGroupId);
};
exports.fetchPolicyNamesByGroupId = fetchPolicyNamesByGroupId;
const fetchPolicyNameById = async (id) => {
    return (0, policyGroupRepository_1.getPolicyNameById)(id);
};
exports.fetchPolicyNameById = fetchPolicyNameById;
const modifyPolicyName = async (id, policyNameData) => {
    return (0, policyGroupRepository_1.updatePolicyName)(id, policyNameData);
};
exports.modifyPolicyName = modifyPolicyName;
const removePolicyName = async (id) => {
    return (0, policyGroupRepository_1.deletePolicyName)(id);
};
exports.removePolicyName = removePolicyName;
const fetchAllPolicyNames = async () => {
    return (0, policyGroupRepository_1.getAllPolicyNames)();
};
exports.fetchAllPolicyNames = fetchAllPolicyNames;
