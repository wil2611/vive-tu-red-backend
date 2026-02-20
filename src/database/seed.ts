import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'vive_tu_red',
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('📦 Conexión a la base de datos establecida');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // Verificar si ya existe un admin
    const existingAdmin = await queryRunner.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1`,
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Ya existe un usuario administrador');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await queryRunner.query(
      `INSERT INTO users ("email", "password", "firstName", "lastName", "role", "isActive")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        'admin@vivetured.com',
        hashedPassword,
        'Admin',
        'ViveTuRed',
        'admin',
        true,
      ],
    );

    console.log('✅ Usuario administrador creado exitosamente');
    console.log('   Email: admin@vivetured.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  Cambia la contraseña en producción!');
  } catch (error) {
    console.error('❌ Error al crear el seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
