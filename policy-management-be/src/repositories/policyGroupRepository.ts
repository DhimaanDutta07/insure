import { PrismaClient, PolicyGroup, PolicyName } from '@prisma/client';

const prisma = new PrismaClient();

export const createPolicyGroup = async (data: { name: string; description?: string }): Promise<PolicyGroup> => {
  return prisma.policyGroup.create({ data });
};

export interface PolicyGroupWithPolicyNames extends PolicyGroup {
  itemNames: PolicyName[];
}

export interface PolicyNameWithPolicyGroup extends PolicyName {
  policyGroup: {
    id: string;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
  } | null;
}

export const getAllPolicyGroups = async (): Promise<PolicyGroupWithPolicyNames[]> => {
  return prisma.policyGroup.findMany({
    where: { is_deleted: false },
    include: {
      itemNames: {
        where: { is_deleted: false },
        select: { id: true, name: true, description: true, created_at: true, updated_at: true },
      },
    },
  }) as Promise<PolicyGroupWithPolicyNames[]>;
};

export const getAllPolicyNames = async (): Promise<PolicyNameWithPolicyGroup[]> => {
  const results = await prisma.policyName.findMany({
    where: { is_deleted: false },
    include: {
      policyGroup: {
        select: { id: true, name: true, description: true, created_at: true, updated_at: true },
      },
    },
  });

  // Filter out null policyGroup and return proper typed objects
  return results
    .filter((item) => item.policyGroup !== null)
    .map((item) => {
      const pg = item.policyGroup!;
      return {
        ...item,
        policyGroup: {
          id: pg.id,
          name: pg.name,
          description: pg.description,
          created_at: pg.created_at,
          updated_at: pg.updated_at,
        },
      } as PolicyNameWithPolicyGroup;
    });
};

// Use findFirst when filtering by multiple conditions including is_deleted
export const getPolicyGroupById = async (id: string): Promise<PolicyGroup | null> => {
  return prisma.policyGroup.findFirst({
    where: { id, is_deleted: false },
  });
};

export const updatePolicyGroup = async (id: string, data: { name?: string; description?: string }): Promise<PolicyGroup> => {
  return prisma.policyGroup.update({
    where: { id },
    data,
  });
};

export const deletePolicyGroup = async (id: string): Promise<PolicyGroup> => {
  return prisma.policyGroup.update({
    where: { id },
    data: { is_deleted: true },
  });
};

export const createPolicyName = async (data: { name: string; description?: string; policy_group_id: string }): Promise<PolicyName> => {
  return prisma.policyName.create({ data });
};

export const getPolicyNamesByGroupId = async (policyGroupId: string): Promise<PolicyNameWithPolicyGroup[]> => {
  const results = await prisma.policyName.findMany({
    where: { policy_group_id: policyGroupId, is_deleted: false },
    include: {
      policyGroup: {
        select: { id: true, name: true, description: true, created_at: true, updated_at: true },
      },
    },
  });

  return results
    .filter(item => item.policyGroup !== null)
    .map(item => {
      const pg = item.policyGroup!;
      return {
        ...item,
        policyGroup: {
          id: pg.id,
          name: pg.name,
          description: pg.description,
          created_at: pg.created_at,
          updated_at: pg.updated_at,
        },
      } as PolicyNameWithPolicyGroup;
    });
};

// Use findFirst when filtering by multiple conditions including is_deleted
export const getPolicyNameById = async (id: string): Promise<PolicyName | null> => {
  return prisma.policyName.findFirst({
    where: { id, is_deleted: false },
  });
};

export const updatePolicyName = async (id: string, data: { name?: string; description?: string; policy_group_id?: string }): Promise<PolicyName> => {
  return prisma.policyName.update({
    where: { id },
    data,
  });
};

export const deletePolicyName = async (id: string): Promise<PolicyName> => {
  return prisma.policyName.update({
    where: { id },
    data: { is_deleted: true },
  });
};
