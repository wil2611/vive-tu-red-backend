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

type SupportPathSample = {
  institutionName: string;
  description: string;
  ubicacion: string;
  phone: string;
  email: string | null;
  schedule: string;
  isActive: boolean;
};

const SUPPORT_PATH_SAMPLES: SupportPathSample[] = [
  {
    institutionName: 'Comisaria de Familia',
    description:
      'Atencion y medidas de proteccion en casos de violencia intrafamiliar y VBG.',
    ubicacion: 'Barranquilla',
    phone: '6053855000',
    email: 'comisaria@barranquilla.gov.co',
    schedule: 'Lunes a viernes de 8:00 a.m. a 5:00 p.m.',
    isActive: true,
  },
  {
    institutionName: 'Secretaria de la Mujer',
    description:
      'Orientacion psicologica, juridica y social para mujeres en riesgo o victimas.',
    ubicacion: 'Barranquilla',
    phone: '6053399999',
    email: 'mujer@barranquilla.gov.co',
    schedule: 'Lunes a viernes de 8:00 a.m. a 4:30 p.m.',
    isActive: true,
  },
  {
    institutionName: 'Linea 155',
    description:
      'Canal nacional para orientacion inmediata en situaciones de violencia.',
    ubicacion: 'Nacional',
    phone: '155',
    email: null,
    schedule: 'Atencion 24/7',
    isActive: true,
  },
];

async function seedAdmin(queryRunner: ReturnType<DataSource['createQueryRunner']>) {
  const existingAdmin = await queryRunner.query(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`,
  );

  if (existingAdmin.length > 0) {
    console.log('Ya existe un usuario administrador');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  await queryRunner.query(
    `INSERT INTO users ("email", "password", "firstName", "lastName", "role", "isActive")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    ['admin@vivetured.com', hashedPassword, 'Admin', 'ViveTuRed', 'admin', true],
  );

  console.log('Usuario administrador creado exitosamente');
  console.log('Email: admin@vivetured.com');
  console.log('Password: admin123');
}

async function seedSupportPaths(
  queryRunner: ReturnType<DataSource['createQueryRunner']>,
) {
  for (const sample of SUPPORT_PATH_SAMPLES) {
    const existing = await queryRunner.query(
      `SELECT id FROM support_paths WHERE "institutionName" = $1 LIMIT 1`,
      [sample.institutionName],
    );

    if (existing.length > 0) {
      continue;
    }

    await queryRunner.query(
      `INSERT INTO support_paths (
        "institutionName",
        "description",
        "city",
        "phone",
        "email",
        "schedule",
        "isActive"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        sample.institutionName,
        sample.description,
        sample.ubicacion,
        sample.phone,
        sample.email,
        sample.schedule,
        sample.isActive,
      ],
    );
  }

  console.log('Se verificaron 3 rutas de atencion de ejemplo');
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Conexion a la base de datos establecida');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await seedAdmin(queryRunner);
    await seedSupportPaths(queryRunner);
  } catch (error) {
    console.error('Error al crear el seed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

seed();
