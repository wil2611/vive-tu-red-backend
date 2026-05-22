import { DataSource } from 'typeorm';
import type { QueryRunner } from 'typeorm';
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

type ProjectAllySample = {
  institutionName: string;
  roleLabel: string;
  type: 'ally' | 'participant';
  summary: string;
  participationScope: string;
  isActive: boolean;
};

type ExistingRow = {
  id: string;
};

const ADMIN_PASSWORD_MIN_LENGTH = 10;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function hasStrongPassword(password: string): boolean {
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return password.length >= ADMIN_PASSWORD_MIN_LENGTH && hasLetter && hasNumber;
}

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

const PROJECT_ALLY_SAMPLES: ProjectAllySample[] = [
  {
    institutionName: 'Universidad del Atlantico',
    roleLabel: 'Aliado clave',
    type: 'ally',
    summary:
      'Aliada en la coordinacion del plan de trabajo y en la articulacion institucional para ampliar el alcance del proyecto en Educacion Superior.',
    participationScope:
      'Los talleres seran disenados, coordinados y desarrollados por el equipo investigador de la Universidad del Norte.',
    isActive: true,
  },
  {
    institutionName: 'Red Colombiana de Mujeres Cientificas (RCMC)',
    roleLabel: 'Participante invitada',
    type: 'participant',
    summary:
      'Participara en espacios de socializacion y reflexion colectiva sobre resultados, fortaleciendo el dialogo interdisciplinario y la apropiacion social del conocimiento.',
    participationScope:
      'Su participacion no contempla responsabilidades de ejecucion, coordinacion ni produccion de entregables del proyecto.',
    isActive: true,
  },
];

async function seedAdmin(queryRunner: QueryRunner) {
  const existingAdmin = (await queryRunner.query(
    `SELECT id FROM users WHERE role = 'admin' AND "isActive" = true LIMIT 1`,
  )) as ExistingRow[];

  if (existingAdmin.length > 0) {
    console.log('Ya existe un usuario administrador activo');
    return;
  }

  const adminEmail = getRequiredEnv('SEED_ADMIN_EMAIL').toLowerCase();
  const adminPassword = getRequiredEnv('SEED_ADMIN_PASSWORD');
  const adminFirstName = process.env.SEED_ADMIN_FIRST_NAME?.trim() || 'Admin';
  const adminLastName = process.env.SEED_ADMIN_LAST_NAME?.trim() || 'ViveTuRed';

  if (!hasStrongPassword(adminPassword)) {
    throw new Error(
      `SEED_ADMIN_PASSWORD must have at least ${ADMIN_PASSWORD_MIN_LENGTH} characters, one letter and one number.`,
    );
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await queryRunner.query(
    `INSERT INTO users ("email", "password", "firstName", "lastName", "role", "isActive")
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [adminEmail, hashedPassword, adminFirstName, adminLastName, 'admin', true],
  );

  console.log('Usuario administrador creado exitosamente');
  console.log(`Email: ${adminEmail}`);
}

async function seedSupportPaths(queryRunner: QueryRunner) {
  for (const sample of SUPPORT_PATH_SAMPLES) {
    const existing = (await queryRunner.query(
      `SELECT id FROM support_paths WHERE "institutionName" = $1 LIMIT 1`,
      [sample.institutionName],
    )) as ExistingRow[];

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

async function seedProjectAllies(queryRunner: QueryRunner) {
  for (const sample of PROJECT_ALLY_SAMPLES) {
    const existing = (await queryRunner.query(
      `SELECT id FROM project_allies WHERE "institutionName" = $1 AND "type" = $2 LIMIT 1`,
      [sample.institutionName, sample.type],
    )) as ExistingRow[];

    if (existing.length > 0) {
      continue;
    }

    await queryRunner.query(
      `INSERT INTO project_allies (
        "institutionName",
        "roleLabel",
        "type",
        "summary",
        "participationScope",
        "isActive"
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        sample.institutionName,
        sample.roleLabel,
        sample.type,
        sample.summary,
        sample.participationScope,
        sample.isActive,
      ],
    );
  }

  console.log('Se verificaron 2 aliados/participantes de ejemplo');
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Conexion a la base de datos establecida');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    await seedAdmin(queryRunner);
    await seedSupportPaths(queryRunner);
    await seedProjectAllies(queryRunner);
  } catch (error) {
    console.error('Error al crear el seed:', error);
    process.exitCode = 1;
  } finally {
    await AppDataSource.destroy();
  }
}

void seed();
