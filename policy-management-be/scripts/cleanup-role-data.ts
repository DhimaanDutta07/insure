import prisma from '../src/utils/prismaClient';

async function cleanupRoleData() {
  try {
    console.log('🧹 Starting role data cleanup...');

    // Get all roles
    const roles = await prisma.role.findMany();
    
    for (const role of roles) {
      const originalName = role.role_name;
      const originalId = role.id;
      
      const trimmedName = role.role_name.trim();
      const trimmedId = role.id.trim();
      
      // Update if name has whitespace
      if (originalName !== trimmedName) {
        console.log(`Updating role ${originalId}: role_name "${originalName}" -> "${trimmedName}"`);
        await prisma.role.update({
          where: { id: originalId },
          data: { role_name: trimmedName }
        });
      }
      
      // Update if Id has whitespace (this is more complex as it's the primary key)
      if (originalId !== trimmedId) {
        console.log(`⚠️  Role Id has whitespace: "${originalId}" -> "${trimmedId}"`);
        console.log(`   This requires manual database intervention as Id is the primary key`);
      }
    }

    // Get all users and update their role_id if it has whitespace
    const users = await prisma.user.findMany({
      where: { 
        role_id: { 
          not: "" 
        } 
      }
    });

    for (const user of users) {
      const originalRoleId = user.role_id;
      const trimmedRoleId = user.role_id.trim();
      
      if (originalRoleId !== trimmedRoleId) {
        console.log(`Updating user ${user.id}: role_id "${originalRoleId}" -> "${trimmedRoleId}"`);
        await prisma.user.update({
          where: { id: user.id },
          data: { role_id: trimmedRoleId }
        });
      }
    }

    console.log('✅ Cleanup completed!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupRoleData();
