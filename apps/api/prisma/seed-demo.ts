import { PrismaClient, SportType, SeatStatus, CoachProficiencyBand } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Demo Seed Script - 創建三種狀態的測試資料
 *
 * 1. 未記錄未評量 - Lesson #101: 課程有席位但還沒建立教學記錄
 * 2. 已記錄未評量 - Lesson #102: 有教學記錄但沒有能力評分
 * 3. 都完成 - Lesson #103: 完整的教學記錄和能力評分
 */

async function main() {
  console.log('🌱 Starting demo data seed...\n');

  // 1. 創建測試帳號和教練
  console.log('👤 Creating test accounts and instructors...');
  const account = await prisma.account.upsert({
    where: { id: 'demo-instructor-1' },
    create: {
      id: 'demo-instructor-1',
      role: 'instructor',
      status: 'active',
      mfaEnabled: false
    },
    update: {}
  });

  const instructor = await prisma.instructor.upsert({
    where: { id: 'demo-instructor-1-profile' },
    create: {
      id: 'demo-instructor-1-profile',
      accountId: account.id,
      canViewSharedRecords: true
    },
    update: {}
  });

  // 2. 創建雪場
  console.log('🏔️  Creating resort...');
  const resort = await prisma.resort.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: '白馬雪場',
      location: '長野縣'
    },
    update: {}
  });

  // 3. 創建學生
  console.log('👨‍🎓 Creating students...');
  const students = await Promise.all([
    prisma.globalStudent.upsert({
      where: { id: 'student-demo-1' },
      create: {
        id: 'student-demo-1',
        email: 'student1@demo.com',
        phone: '0912345678'
      },
      update: {}
    }),
    prisma.globalStudent.upsert({
      where: { id: 'student-demo-2' },
      create: {
        id: 'student-demo-2',
        email: 'student2@demo.com',
        phone: '0923456789'
      },
      update: {}
    }),
    prisma.globalStudent.upsert({
      where: { id: 'student-demo-3' },
      create: {
        id: 'student-demo-3',
        email: 'student3@demo.com',
        phone: '0934567890'
      },
      update: {}
    })
  ]);

  // 創建學生映射
  const mappings = await Promise.all([
    prisma.studentMapping.upsert({
      where: { id: 'mapping-demo-1' },
      create: {
        id: 'mapping-demo-1',
        globalStudentId: students[0].id,
        resortId: resort.id
      },
      update: {}
    }),
    prisma.studentMapping.upsert({
      where: { id: 'mapping-demo-2' },
      create: {
        id: 'mapping-demo-2',
        globalStudentId: students[1].id,
        resortId: resort.id
      },
      update: {}
    }),
    prisma.studentMapping.upsert({
      where: { id: 'mapping-demo-3' },
      create: {
        id: 'mapping-demo-3',
        globalStudentId: students[2].id,
        resortId: resort.id
      },
      update: {}
    })
  ]);

  // =====================================================
  // 情境 1: 未記錄未評量 (Lesson #101)
  // =====================================================
  console.log('\n📋 Scenario 1: 未記錄未評量 (Lesson #101)');
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 101 },
    create: {
      id: 101,
      resortId: resort.id,
      instructorId: instructor.id,
      lessonDate: new Date('2025-01-15T09:00:00Z')
    },
    update: {
      lessonDate: new Date('2025-01-15T09:00:00Z')
    }
  });

  // 創建席位 - 已認領但沒有教學記錄
  await prisma.orderSeat.upsert({
    where: { id: 'seat-101-1' },
    create: {
      id: 'seat-101-1',
      lessonId: lesson1.id,
      seatNumber: 1,
      status: SeatStatus.claimed,
      claimedMappingId: mappings[0].id,
      claimedAt: new Date('2025-01-10T10:00:00Z')
    },
    update: {}
  });

  // 創建學生自評
  await prisma.studentSelfEvaluation.upsert({
    where: { id: 'self-eval-101-1' },
    create: {
      id: 'self-eval-101-1',
      lessonId: lesson1.id,
      studentMappingId: mappings[0].id,
      selfRating: 3,
      selfComment: '我覺得我在轉彎的時候還不太穩定,希望教練能多指導。'
    },
    update: {}
  });

  console.log('  ✅ Created Lesson #101 with 1 claimed seat (no teaching record yet)');

  // =====================================================
  // 情境 2: 已記錄未評量 (Lesson #102)
  // =====================================================
  console.log('\n📝 Scenario 2: 已記錄未評量 (Lesson #102)');
  const lesson2 = await prisma.lesson.upsert({
    where: { id: 102 },
    create: {
      id: 102,
      resortId: resort.id,
      instructorId: instructor.id,
      lessonDate: new Date('2025-01-16T09:00:00Z')
    },
    update: {
      lessonDate: new Date('2025-01-16T09:00:00Z')
    }
  });

  await prisma.orderSeat.upsert({
    where: { id: 'seat-102-1' },
    create: {
      id: 'seat-102-1',
      lessonId: lesson2.id,
      seatNumber: 1,
      status: SeatStatus.claimed,
      claimedMappingId: mappings[1].id,
      claimedAt: new Date('2025-01-12T10:00:00Z')
    },
    update: {}
  });

  // 創建教學記錄 - 但沒有評分
  const record2 = await prisma.lessonRecord.upsert({
    where: { lessonId: lesson2.id },
    create: {
      lessonId: lesson2.id,
      summary: '今天主要練習了基本的轉彎技巧。學員表現積極,但還需要更多練習。'
    },
    update: {}
  });

  // 獲取一些分析項目
  const analysisItems = await prisma.analysisItem.findMany({
    take: 2,
    orderBy: { id: 'asc' }
  });

  // 獲取一些練習技能
  const practiceSkills = await prisma.practiceSkill.findMany({
    take: 1,
    include: { drills: true },
    orderBy: { id: 'asc' }
  });

  await prisma.lessonRecordDetail.upsert({
    where: { id: 'record-detail-102-1' },
    create: {
      id: 'record-detail-102-1',
      lessonRecordId: record2.id,
      studentMappingId: mappings[1].id,
      resortId: resort.id,
      shareVisibility: 'private',
      analyses: analysisItems.length > 0 ? {
        create: analysisItems.map((item, idx) => ({
          id: `analysis-102-1-${idx + 1}`,
          analysisItemId: item.id,
          customAnalysis: idx === 0 ? '需要加強重心轉移' : null
        }))
      } : undefined,
      practices: practiceSkills.length > 0 && practiceSkills[0].drills.length > 0 ? {
        create: [{
          id: 'practice-102-1-1',
          drillId: practiceSkills[0].drills[0].id,
          customDrill: null,
          practiceNotes: '重複練習20次,進步明顯'
        }]
      } : undefined
    },
    update: {}
  });

  console.log('  ✅ Created Lesson #102 with teaching record (no ability ratings)');

  // =====================================================
  // 情境 3: 都完成 (Lesson #103)
  // =====================================================
  console.log('\n⭐ Scenario 3: 都完成 (Lesson #103)');
  const lesson3 = await prisma.lesson.upsert({
    where: { id: 103 },
    create: {
      id: 103,
      resortId: resort.id,
      instructorId: instructor.id,
      lessonDate: new Date('2025-01-17T09:00:00Z')
    },
    update: {
      lessonDate: new Date('2025-01-17T09:00:00Z')
    }
  });

  await prisma.orderSeat.upsert({
    where: { id: 'seat-103-1' },
    create: {
      id: 'seat-103-1',
      lessonId: lesson3.id,
      seatNumber: 1,
      status: SeatStatus.claimed,
      claimedMappingId: mappings[2].id,
      claimedAt: new Date('2025-01-14T10:00:00Z')
    },
    update: {}
  });

  // 創建完整的教學記錄
  const record3 = await prisma.lessonRecord.upsert({
    where: { lessonId: lesson3.id },
    create: {
      lessonId: lesson3.id,
      summary: '優秀的表現！學員掌握了所有基本技巧,可以開始進階課程。'
    },
    update: {}
  });

  const detail3 = await prisma.lessonRecordDetail.upsert({
    where: { id: 'record-detail-103-1' },
    create: {
      id: 'record-detail-103-1',
      lessonRecordId: record3.id,
      studentMappingId: mappings[2].id,
      resortId: resort.id,
      shareVisibility: 'resort',
      analyses: analysisItems.length > 0 ? {
        create: analysisItems.map((item, idx) => ({
          id: `analysis-103-1-${idx + 1}`,
          analysisItemId: item.id,
          customAnalysis: null
        }))
      } : undefined,
      practices: practiceSkills.length > 0 && practiceSkills[0].drills.length > 0 ? {
        create: [{
          id: 'practice-103-1-1',
          drillId: practiceSkills[0].drills[0].id,
          practiceNotes: '完美執行,可以進入下一階段'
        }]
      } : undefined
    },
    update: {}
  });

  // 創建能力評分
  const abilities = await prisma.abilityCatalog.findMany({
    where: { sportType: SportType.ski },
    take: 10,
    orderBy: [
      { skillLevel: 'asc' },
      { sequenceInLevel: 'asc' }
    ]
  });

  if (abilities.length > 0) {
    const ratings = abilities.slice(0, 8).map((ability, idx) => {
      const proficiencyBands: CoachProficiencyBand[] = ['knew', 'familiar', 'excellent'];
      const band = proficiencyBands[idx % 3];

      return {
        id: `rating-103-1-${idx + 1}`,
        lessonRecordDetailId: detail3.id,
        coachAccountId: account.id,
        abilityId: ability.id,
        rating: band === 'knew' ? 1 : band === 'familiar' ? 2 : 3,
        proficiencyBand: band,
        comment: idx === 0 ? '表現優異,掌握良好' : idx === 3 ? '需要更多練習' : null
      };
    });

    for (const rating of ratings) {
      await prisma.coachAbilityRating.upsert({
        where: { id: rating.id },
        create: rating,
        update: {}
      });
    }

    console.log(`  ✅ Created Lesson #103 with full record and ${ratings.length} ability ratings`);
  }

  console.log('\n✨ Demo data seed completed successfully!\n');
  console.log('📊 Summary:');
  console.log('  - Lesson #101: 未記錄未評量 (1 seat, has self-eval, no record)');
  console.log('  - Lesson #102: 已記錄未評量 (has record with analysis & practice, no ratings)');
  console.log('  - Lesson #103: 都完成 (full record with 8 ability ratings)');
  console.log('\n🔑 Login with: demo-instructor-1');
}

main()
  .then(() => {
    console.log('\n✅ Database demo seed completed');
  })
  .catch((error) => {
    console.error('❌ Database demo seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
