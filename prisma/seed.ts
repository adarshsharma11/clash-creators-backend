/**
 * ClashCreators development seed.
 *
 * Development password for all seeded users and the admin:
 *   DevPassword123!
 * Stored only as a bcrypt hash. Never use this password in production.
 */
import { Prisma } from '../src/generated/prisma';
import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/utils/bcryptHandler';
import { v4 as uuidv4 } from 'uuid';

const SEED_NOW = new Date('2026-09-07T09:00:00.000Z');
const DEV_PASSWORD = 'DevPassword123!';

function hoursFromNow(hours: number): Date {
  return new Date(SEED_NOW.getTime() + hours * 60 * 60 * 1000);
}

async function seed() {
  try {
    const passwordHash = await hashPassword(DEV_PASSWORD);

    const existingSeed = await prisma.admin.findUnique({
      where: { email: 'admin@clashcreators.dev' },
      select: { id: true },
    });
    if (existingSeed) {
      console.log('Seed already applied (admin@clashcreators.dev exists). Skipping.');
      console.log('Demo user/admin password: DevPassword123!');
      console.log('Admin email: admin@clashcreators.dev');
      return;
    }

    const [gaming, fitness, music, technology, entertainment] = await prisma.$transaction([
        prisma.category.create({
          data: {
            name: 'Gaming',
            slug: 'gaming',
            description: 'Esports, streams, and competitive play.',
            icon: 'gamepad',
            sortOrder: 1,
          },
        }),
        prisma.category.create({
          data: {
            name: 'Fitness',
            slug: 'fitness',
            description: 'Training, wellness, and athletic creators.',
            icon: 'dumbbell',
            sortOrder: 2,
          },
        }),
        prisma.category.create({
          data: {
            name: 'Music',
            slug: 'music',
            description: 'Artists, producers, and performers.',
            icon: 'music',
            sortOrder: 3,
          },
        }),
        prisma.category.create({
          data: {
            name: 'Technology',
            slug: 'technology',
            description: 'Gadgets, software, and tech culture.',
            icon: 'cpu',
            sortOrder: 4,
          },
        }),
        prisma.category.create({
          data: {
            name: 'Entertainment',
            slug: 'entertainment',
            description: 'Comedy, commentary, and pop culture.',
            icon: 'clapperboard',
            sortOrder: 5,
          },
        }),
        prisma.category.create({
          data: {
            name: 'Education',
            slug: 'education',
            description: 'Learning, explainers, and tutorials.',
            icon: 'book',
            sortOrder: 6,
          },
        }),
        prisma.category.create({
          data: {
            name: 'Lifestyle',
            slug: 'lifestyle',
            description: 'Daily life, travel, and personal brands.',
            icon: 'sparkles',
            sortOrder: 7,
          },
        }),
      ]);

    console.log('Seeded 7 categories');

    const nova = await prisma.user.create({
      data: {
        email: 'nova@clashcreators.dev',
        username: 'nova_gamer',
        fullName: 'Nova Patel',
        passwordHash,
        avatarUrl: 'https://cdn.clashcreators.dev/avatars/nova.png',
        role: 'CREATOR',
        creatorProfile: {
          create: {
            displayName: 'Nova Plays',
            bio: 'Competitive FPS creator and weekly clash regular.',
            avatarUrl: 'https://cdn.clashcreators.dev/creators/nova.png',
            categoryId: gaming.id,
            status: 'ACTIVE',
            socialAccounts: {
              create: [
                {
                  platform: 'INSTAGRAM',
                  username: 'novaplays',
                  displayName: 'Nova Plays',
                  profileUrl: 'https://instagram.com/novaplays',
                  isPrimary: true,
                  isVerified: true,
                },
                {
                  platform: 'YOUTUBE',
                  username: 'NovaPlays',
                  displayName: 'Nova Plays',
                  profileUrl: 'https://youtube.com/@NovaPlays',
                  isVerified: true,
                },
                {
                  platform: 'X',
                  username: 'novaplays',
                  displayName: 'Nova Plays',
                  profileUrl: 'https://x.com/novaplays',
                },
                {
                  platform: 'TWITCH',
                  username: 'novaplays',
                  displayName: 'Nova Plays',
                  profileUrl: 'https://twitch.tv/novaplays',
                  isVerified: true,
                },
              ],
            },
          },
        },
      },
      include: { creatorProfile: true },
    });

    const maya = await prisma.user.create({
      data: {
        email: 'maya@clashcreators.dev',
        username: 'fit_with_maya',
        fullName: 'Maya Singh',
        passwordHash,
        avatarUrl: 'https://cdn.clashcreators.dev/avatars/maya.png',
        role: 'CREATOR',
        creatorProfile: {
          create: {
            displayName: 'Fit With Maya',
            bio: 'Strength training and mobility for busy people.',
            avatarUrl: 'https://cdn.clashcreators.dev/creators/maya.png',
            categoryId: fitness.id,
            status: 'ACTIVE',
            socialAccounts: {
              create: [
                {
                  platform: 'INSTAGRAM',
                  username: 'fitwithmaya',
                  displayName: 'Fit With Maya',
                  profileUrl: 'https://instagram.com/fitwithmaya',
                  isPrimary: true,
                  isVerified: true,
                },
                {
                  platform: 'YOUTUBE',
                  username: 'FitWithMaya',
                  displayName: 'Fit With Maya',
                  profileUrl: 'https://youtube.com/@FitWithMaya',
                },
                {
                  platform: 'X',
                  username: 'fitwithmaya',
                  profileUrl: 'https://x.com/fitwithmaya',
                },
                {
                  platform: 'TIKTOK',
                  username: 'fitwithmaya',
                  displayName: 'Fit With Maya',
                  profileUrl: 'https://tiktok.com/@fitwithmaya',
                  isVerified: true,
                },
              ],
            },
          },
        },
      },
      include: { creatorProfile: true },
    });

    const aria = await prisma.user.create({
      data: {
        email: 'aria@clashcreators.dev',
        username: 'melody_aria',
        fullName: 'Aria Fernandez',
        passwordHash,
        avatarUrl: 'https://cdn.clashcreators.dev/avatars/aria.png',
        role: 'CREATOR',
        creatorProfile: {
          create: {
            displayName: 'Melody Aria',
            bio: 'Original songs, live sessions, and creator battles.',
            avatarUrl: 'https://cdn.clashcreators.dev/creators/aria.png',
            categoryId: music.id,
            status: 'ACTIVE',
            socialAccounts: {
              create: [
                {
                  platform: 'INSTAGRAM',
                  username: 'melodyaria',
                  displayName: 'Melody Aria',
                  profileUrl: 'https://instagram.com/melodyaria',
                  isPrimary: true,
                  isVerified: true,
                },
                {
                  platform: 'YOUTUBE',
                  username: 'MelodyAria',
                  displayName: 'Melody Aria',
                  profileUrl: 'https://youtube.com/@MelodyAria',
                  isVerified: true,
                },
                {
                  platform: 'X',
                  username: 'melodyaria',
                  profileUrl: 'https://x.com/melodyaria',
                },
              ],
            },
          },
        },
      },
      include: { creatorProfile: true },
    });

    const kai = await prisma.user.create({
      data: {
        email: 'kai@clashcreators.dev',
        username: 'tech_kai',
        fullName: 'Kai Nakamura',
        passwordHash,
        avatarUrl: 'https://cdn.clashcreators.dev/avatars/kai.png',
        role: 'CREATOR',
        creatorProfile: {
          create: {
            displayName: 'Tech Kai',
            bio: 'Hands-on reviews and late-night build streams.',
            avatarUrl: 'https://cdn.clashcreators.dev/creators/kai.png',
            categoryId: technology.id,
            status: 'ACTIVE',
            socialAccounts: {
              create: [
                {
                  platform: 'INSTAGRAM',
                  username: 'techkai',
                  profileUrl: 'https://instagram.com/techkai',
                  isPrimary: true,
                },
                {
                  platform: 'YOUTUBE',
                  username: 'TechKai',
                  displayName: 'Tech Kai',
                  profileUrl: 'https://youtube.com/@TechKai',
                  isVerified: true,
                },
                {
                  platform: 'X',
                  username: 'techkai',
                  displayName: 'Tech Kai',
                  profileUrl: 'https://x.com/techkai',
                  isVerified: true,
                },
                {
                  platform: 'FACEBOOK',
                  username: 'techkai',
                  profileUrl: 'https://facebook.com/techkai',
                },
              ],
            },
          },
        },
      },
      include: { creatorProfile: true },
    });

    const jordan = await prisma.user.create({
      data: {
        email: 'jordan@clashcreators.dev',
        username: 'vibe_jordan',
        fullName: 'Jordan Cole',
        passwordHash,
        avatarUrl: 'https://cdn.clashcreators.dev/avatars/jordan.png',
        role: 'CREATOR',
        creatorProfile: {
          create: {
            displayName: 'Vibe Jordan',
            bio: 'Comedy sketches and entertainment clashes.',
            avatarUrl: 'https://cdn.clashcreators.dev/creators/jordan.png',
            categoryId: entertainment.id,
            status: 'ACTIVE',
            socialAccounts: {
              create: [
                {
                  platform: 'INSTAGRAM',
                  username: 'vibejordan',
                  displayName: 'Vibe Jordan',
                  profileUrl: 'https://instagram.com/vibejordan',
                  isPrimary: true,
                },
                {
                  platform: 'YOUTUBE',
                  username: 'VibeJordan',
                  profileUrl: 'https://youtube.com/@VibeJordan',
                },
                {
                  platform: 'X',
                  username: 'vibejordan',
                  profileUrl: 'https://x.com/vibejordan',
                },
                {
                  platform: 'TIKTOK',
                  username: 'vibejordan',
                  displayName: 'Vibe Jordan',
                  profileUrl: 'https://tiktok.com/@vibejordan',
                  isVerified: true,
                },
              ],
            },
          },
        },
      },
      include: { creatorProfile: true },
    });

    const sam = await prisma.user.create({
      data: {
        email: 'sam@clashcreators.dev',
        username: 'learn_with_sam',
        fullName: 'Sam Okonkwo',
        passwordHash,
        role: 'CREATOR',
        creatorProfile: {
          create: {
            displayName: 'Learn With Sam',
            bio: 'Uncategorized educator exploring new clash formats.',
            status: 'ACTIVE',
            socialAccounts: {
              create: [
                {
                  platform: 'INSTAGRAM',
                  username: 'learnwithsam',
                  profileUrl: 'https://instagram.com/learnwithsam',
                  isPrimary: true,
                },
                {
                  platform: 'YOUTUBE',
                  username: 'LearnWithSam',
                  displayName: 'Learn With Sam',
                  profileUrl: 'https://youtube.com/@LearnWithSam',
                  isVerified: true,
                },
                {
                  platform: 'X',
                  username: 'learnwithsam',
                  profileUrl: 'https://x.com/learnwithsam',
                },
              ],
            },
          },
        },
      },
      include: { creatorProfile: true },
    });

    const riya = await prisma.user.create({
      data: {
        email: 'riya@clashcreators.dev',
        username: 'supporter_riya',
        fullName: 'Riya Mehta',
        passwordHash,
        role: 'USER',
      },
    });

    const dev = await prisma.user.create({
      data: {
        email: 'dev@clashcreators.dev',
        username: 'supporter_dev',
        fullName: 'Dev Sharma',
        passwordHash,
        role: 'USER',
      },
    });

    const lee = await prisma.user.create({
      data: {
        email: 'lee@clashcreators.dev',
        username: 'supporter_lee',
        fullName: 'Lee Park',
        passwordHash,
        role: 'USER',
      },
    });

    await prisma.user.create({
      data: {
        email: 'ana@clashcreators.dev',
        username: 'supporter_ana',
        fullName: 'Ana Costa',
        passwordHash,
        role: 'USER',
        isActive: true,
      },
    });

    const novaProfile = nova.creatorProfile;
    const mayaProfile = maya.creatorProfile;
    const ariaProfile = aria.creatorProfile;
    const kaiProfile = kai.creatorProfile;
    const jordanProfile = jordan.creatorProfile;
    const samProfile = sam.creatorProfile;

    if (!novaProfile || !mayaProfile || !ariaProfile || !kaiProfile || !jordanProfile || !samProfile) {
      throw new Error('Expected all creator profiles to be created');
    }

    console.log('Seeded 10 users and 6 creator profiles');

    const liveClash = await prisma.clash.create({
      data: {
        title: 'Gaming Glory Clash',
        slug: 'gaming-glory-clash',
        description: 'Live battle between top gaming creators.',
        categoryId: gaming.id,
        status: 'LIVE',
        startsAt: hoursFromNow(-12),
        endsAt: hoursFromNow(36),
        maxParticipants: 8,
        participants: {
          create: [{ creatorId: novaProfile.id, joinedAt: hoursFromNow(-20) }, { creatorId: kaiProfile.id, joinedAt: hoursFromNow(-18) }],
        },
      },
    });

    const upcomingClash = await prisma.clash.create({
      data: {
        title: 'Fitness Face-Off',
        slug: 'fitness-face-off',
        description: 'Upcoming wellness clash. Support opens at start time.',
        categoryId: fitness.id,
        status: 'UPCOMING',
        startsAt: hoursFromNow(72),
        endsAt: hoursFromNow(120),
        maxParticipants: 6,
        participants: {
          create: [{ creatorId: mayaProfile.id, joinedAt: hoursFromNow(-48) }, { creatorId: samProfile.id, joinedAt: hoursFromNow(-24) }],
        },
      },
    });

    const completedClash = await prisma.clash.create({
      data: {
        title: 'Music Mayhem',
        slug: 'music-mayhem',
        description: 'Completed music clash. Winner recorded from confirmed support.',
        categoryId: music.id,
        status: 'COMPLETED',
        startsAt: hoursFromNow(-168),
        endsAt: hoursFromNow(-24),
        maxParticipants: 4,
        participants: {
          create: [
            { creatorId: ariaProfile.id, joinedAt: hoursFromNow(-180) },
            { creatorId: jordanProfile.id, joinedAt: hoursFromNow(-176) },
          ],
        },
      },
    });

    console.log(`Seeded 3 clashes with participants (${upcomingClash.slug}, ${liveClash.slug}, ${completedClash.slug})`);

    await prisma.support.create({
      data: {
        supporterId: riya.id,
        creatorId: novaProfile.id,
        clashId: liveClash.id,
        points: 50,
        status: 'CONFIRMED',
        createdAt: hoursFromNow(-6),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_live_nova_riya',
            amount: new Prisma.Decimal('50.00'),
            currency: 'INR',
            status: 'PAID',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: dev.id,
        creatorId: novaProfile.id,
        clashId: liveClash.id,
        points: 25,
        status: 'CONFIRMED',
        createdAt: hoursFromNow(-4),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_live_nova_dev',
            amount: new Prisma.Decimal('25.00'),
            currency: 'INR',
            status: 'PAID',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: lee.id,
        creatorId: kaiProfile.id,
        clashId: liveClash.id,
        points: 40,
        status: 'CONFIRMED',
        createdAt: hoursFromNow(-3),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_live_kai_lee',
            amount: new Prisma.Decimal('40.00'),
            currency: 'INR',
            status: 'PAID',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: riya.id,
        creatorId: kaiProfile.id,
        clashId: liveClash.id,
        points: 10,
        status: 'PENDING',
        createdAt: hoursFromNow(-1),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_live_kai_riya_pending',
            amount: new Prisma.Decimal('10.00'),
            currency: 'INR',
            status: 'PENDING',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: lee.id,
        creatorId: ariaProfile.id,
        clashId: completedClash.id,
        points: 100,
        status: 'CONFIRMED',
        createdAt: hoursFromNow(-48),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_music_aria_lee',
            amount: new Prisma.Decimal('100.00'),
            currency: 'INR',
            status: 'PAID',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: riya.id,
        creatorId: ariaProfile.id,
        clashId: completedClash.id,
        points: 50,
        status: 'CONFIRMED',
        createdAt: hoursFromNow(-40),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_music_aria_riya',
            amount: new Prisma.Decimal('50.00'),
            currency: 'INR',
            status: 'PAID',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: dev.id,
        creatorId: jordanProfile.id,
        clashId: completedClash.id,
        points: 80,
        status: 'CONFIRMED',
        createdAt: hoursFromNow(-36),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_music_jordan_dev',
            amount: new Prisma.Decimal('80.00'),
            currency: 'INR',
            status: 'PAID',
          },
        },
      },
    });

    await prisma.support.create({
      data: {
        supporterId: lee.id,
        creatorId: jordanProfile.id,
        clashId: completedClash.id,
        points: 20,
        status: 'FAILED',
        createdAt: hoursFromNow(-30),
        payment: {
          create: {
            provider: 'RAZORPAY',
            providerPaymentId: 'pay_seed_music_jordan_lee_failed',
            amount: new Prisma.Decimal('20.00'),
            currency: 'INR',
            status: 'FAILED',
          },
        },
      },
    });

    console.log('Seeded support and payment records');

    await prisma.winner.create({
      data: {
        clashId: completedClash.id,
        creatorId: ariaProfile.id,
        rank: 1,
        points: 150,
        createdAt: hoursFromNow(-23),
      },
    });

    const achievements = await prisma.$transaction([
      prisma.achievement.create({
        data: {
          name: 'First Win',
          slug: 'first-win',
          description: 'Won a clash for the first time.',
          icon: 'trophy',
        },
      }),
      prisma.achievement.create({
        data: {
          name: 'Top Creator',
          slug: 'top-creator',
          description: 'Reached the top of a clash leaderboard.',
          icon: 'star',
        },
      }),
      prisma.achievement.create({
        data: {
          name: 'Three Wins',
          slug: 'three-wins',
          description: 'Won three completed clashes.',
          icon: 'medal',
        },
      }),
      prisma.achievement.create({
        data: {
          name: 'Ten Wins',
          slug: 'ten-wins',
          description: 'Won ten completed clashes.',
          icon: 'crown',
        },
      }),
      prisma.achievement.create({
        data: {
          name: 'Top Supporter',
          slug: 'top-supporter',
          description: 'Recognized for exceptional support.',
          icon: 'heart',
        },
      }),
    ]);

    await prisma.creatorAchievement.createMany({
      data: [
        { creatorId: ariaProfile.id, achievementId: achievements[0].id, earnedAt: hoursFromNow(-23) },
        { creatorId: ariaProfile.id, achievementId: achievements[1].id, earnedAt: hoursFromNow(-23) },
      ],
    });

    const admin = await prisma.admin.create({
      data: {
        id: uuidv4(),
        email: 'admin@clashcreators.dev',
        name: 'Platform Admin',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLoginAt: hoursFromNow(-2),
      },
    });

    await prisma.report.create({
      data: {
        reporterId: lee.id,
        creatorId: jordanProfile.id,
        clashId: completedClash.id,
        reason: 'SPAM',
        description: 'Promotional comments that look automated.',
        status: 'PENDING',
      },
    });

    await prisma.auditLog.createMany({
      data: [
        {
          adminId: admin.id,
          action: 'CLASH_CREATED',
          entityType: 'Clash',
          entityId: liveClash.id,
          metadata: { slug: liveClash.slug },
          createdAt: hoursFromNow(-30),
        },
        {
          adminId: admin.id,
          action: 'CLASH_COMPLETED',
          entityType: 'Clash',
          entityId: completedClash.id,
          metadata: { winnerCreatorId: ariaProfile.id, rank: 1, points: 150 },
          createdAt: hoursFromNow(-23),
        },
        {
          adminId: admin.id,
          action: 'CREATOR_CREATED',
          entityType: 'CreatorProfile',
          entityId: novaProfile.id,
          metadata: { displayName: novaProfile.displayName },
          createdAt: hoursFromNow(-200),
        },
      ],
    });

    await prisma.platformSetting.createMany({
      data: [
        {
          key: 'supportPointMinimum',
          value: 1,
          description: 'Minimum points a user can send in one support action.',
        },
        {
          key: 'supportPointMaximum',
          value: 1000,
          description: 'Maximum points a user can send in one support action.',
        },
        {
          key: 'clashMinimumParticipants',
          value: 2,
          description: 'Minimum creators required before a clash can go live.',
        },
        {
          key: 'clashMaximumParticipants',
          value: 16,
          description: 'Default maximum creators allowed in a clash.',
        },
        {
          key: 'platformName',
          value: 'ClashCreators',
          description: 'Public platform name.',
        },
        {
          key: 'maintenanceMode',
          value: false,
          description: 'When true, public writes should be disabled.',
        },
      ],
    });

    console.log('Seeded winner, achievements, report, admin, audit logs, and settings');
    console.log('Demo credentials (development only):');
    console.log('  Users: nova@clashcreators.dev (or username nova_gamer) / DevPassword123!');
    console.log('  Admin: admin@clashcreators.dev / DevPassword123!');
    console.log('Database seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

seed();
