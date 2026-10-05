import { PrismaClient, LoaderType, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Superadmin User
  const adminUsername = process.env.SUPERADMIN_USERNAME || 'admin';
  const adminPassword = process.env.SUPERADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error('Define SUPERADMIN_PASSWORD en el .env antes de ejecutar el seed.');
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      password: hashedPassword,
      role: Role.SUPERADMIN,
    },
    create: {
      username: adminUsername,
      password: hashedPassword,
      role: Role.SUPERADMIN,
      skinUrl: 'https://mc-heads.net/avatar/MHF_Steve/100',
    },
  });

  console.log(`👑 Superadmin ready: ${admin.username}`);

  // 2. Modpack: Mimic MC
  const mimicPack = await prisma.modpack.upsert({
    where: { tag: 'mimic-mc' },
    update: { authorId: admin.id },
    create: {
      name: 'Mimic MC',
      tag: 'mimic-mc',
      description: 'Servidor oficial de exploración y RPG de Mimic MC con más de 280 mods optimizados.',
      accentColor: '#f59e0b', // Amber
      iconUrl: 'https://raw.githubusercontent.com/LuisEnriqueGM03/mimic-server/main/icon.png',
      wallpaperUrl: 'https://raw.githubusercontent.com/LuisEnriqueGM03/mimic-server/main/wallpaper.jpg',
      serverIp: 'mimicsv.glemtrod.com',
      serverPort: 25565,
      version: '1.0.0',
      minecraftVersion: '1.21.1',
      loaderType: LoaderType.NEOFORGE,
      loaderVersion: '21.1.248',
      recommendedRam: 6144, // 6 GB
      minRam: 4096,
      githubRepo: 'LuisEnriqueGM03/mimic-server',
      githubBranch: 'main',
      downloadUrl: 'https://raw.githubusercontent.com/LuisEnriqueGM03/mimic-server/main/modpack.json',
      forceUpdate: true,
      order: 1,
      isActive: true,
      authorId: admin.id,
      versions: {
        create: {
          version: '1.0.0',
          changelog: [
            '⚔️ Versión oficial 1.0.0 de Mimic MC Server',
            '⚡ NeoForge 21.1.248 optimizado con más de 280 mods RPG y exploración',
            '✨ Soporte integrado para shaders Iris y luces dinámicas',
            '🛡️ Servidor oficial integrado: mimicsv.glemtrod.com'
          ],
          fileSizeMb: 1400,
          isCurrent: true,
        }
      },
      optionalMods: {
        create: [
          {
            modId: 'iris_shaders',
            name: 'Iris Shaders',
            file: 'iris-neoforge-1.8.14-beta.1+mc1.21.1.jar',
            description: 'Soporte para Shaders de alto rendimiento gráfico. Desactívalo si experimentas tirones.',
            defaultEnabled: true,
          },
          {
            modId: 'lamb_dynamic_lights',
            name: 'LambDynamicLights',
            file: 'lambdynamiclights-4.8.11+1.21.1.jar',
            description: 'Iluminación dinámica en tiempo real al sostener antorchas u objetos luminosos.',
            defaultEnabled: true,
          }
        ]
      }
    }
  });

  // 3. Modpack: Chaos Pack Oficial
  const chaosPack = await prisma.modpack.upsert({
    where: { tag: 'chaos-pack' },
    update: { authorId: admin.id },
    create: {
      name: 'Chaos Pack Oficial',
      tag: 'chaos-pack',
      description: 'El paquete de mods definitivo y ultra optimizado de ChaosLauncher para Minecraft 1.20.1.',
      accentColor: '#ef4444', // Red
      iconUrl: 'https://raw.githubusercontent.com/LuisEduardoDev/ChaosLauncher/main/icon.png',
      wallpaperUrl: '',
      serverIp: 'play.chaoslauncher.net',
      serverPort: 25565,
      version: '1.0.0',
      minecraftVersion: '1.20.1',
      loaderType: LoaderType.FABRIC,
      loaderVersion: '0.15.11',
      recommendedRam: 4096, // 4 GB
      minRam: 2048,
      githubRepo: 'LuisEduardoDev/ChaosLauncher',
      githubBranch: 'main',
      downloadUrl: 'https://raw.githubusercontent.com/LuisEduardoDev/ChaosLauncher/main/modpack-server-example/pack-example.zip',
      forceUpdate: false,
      order: 2,
      isActive: true,
      authorId: admin.id,
      versions: {
        create: {
          version: '1.0.0',
          changelog: [
            '✨ Versión de lanzamiento de Chaos Pack',
            '⚡ Optimización con Sodium, Lithium e Indium',
            '🎙️ Chat de voz posicional integrado',
            '🗺️ Minimapa JourneyMap para el servidor'
          ],
          fileSizeMb: 1,
          isCurrent: true,
        }
      }
    }
  });

  console.log(`✅ Seed completado con éxito:`, { mimic: mimicPack.name, chaos: chaosPack.name });
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
