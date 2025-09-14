import { Injectable, OnModuleInit } from '@nestjs/common';
import { SuperAdminSeeder } from './super-admin.seeder';

@Injectable()
export class SeederService implements OnModuleInit {
  constructor(private superAdminSeeder: SuperAdminSeeder) {}

  async onModuleInit() {
    console.log('🌱 Starting database seeding...');
    
    try {
      // Seed Super Admin
      await this.superAdminSeeder.seed();
      
      console.log('✅ Database seeding completed successfully');
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
    }
  }
}
