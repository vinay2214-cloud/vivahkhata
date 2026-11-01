import { toPaise } from '../lib/money';
import { createExpense } from './expenses';
import { createVendor } from './vendors';
import { createGift } from './gifts';

/**
 * Fills a wedding with a realistic sample ledger so a reviewer sees a working app in one tap.
 * Only offered in Demo mode (anonymous users) and local development.
 */
export async function seedDemoWedding(weddingId: string, uid: string): Promise<void> {
  // 1. Seed 4 Vendors with payment schedules
  const v1 = await createVendor(
    weddingId,
    {
      name: 'Sri Lakshmi Caterers & Sweets',
      categoryId: 'catering',
      contactName: 'Ramesh Naidu',
      phone: '+91 98480 11223',
      agreedPaise: toPaise(450000),
      schedule: [
        {
          id: 's1',
          label: 'Advance Token',
          amountPaise: toPaise(100000),
          dueDate: '2026-10-15',
          paid: true,
        },
        {
          id: 's2',
          label: 'Haldi Function Due',
          amountPaise: toPaise(150000),
          dueDate: '2026-10-20',
          paid: false,
        },
        {
          id: 's3',
          label: 'Wedding Day Balance',
          amountPaise: toPaise(200000),
          dueDate: '2026-11-22',
          paid: false,
        },
      ],
      notes: '800 persons breakfast, lunch and dinner on Muhurtham day',
    },
    uid
  );

  const v2 = await createVendor(
    weddingId,
    {
      name: 'Royal Mandapam & Flower Decor',
      categoryId: 'decoration',
      contactName: 'Suresh Kumar',
      phone: '+91 99887 66554',
      agreedPaise: toPaise(280000),
      schedule: [
        {
          id: 's4',
          label: 'Stage Decoration Advance',
          amountPaise: toPaise(80000),
          dueDate: '2026-10-10',
          paid: true,
        },
        {
          id: 's5',
          label: 'Pellikuthuru Stage Due',
          amountPaise: toPaise(100000),
          dueDate: '2026-10-18', // Overdue test
          paid: false,
        },
        {
          id: 's6',
          label: 'Reception Final Due',
          amountPaise: toPaise(100000),
          dueDate: '2026-11-23',
          paid: false,
        },
      ],
      notes: 'Traditional jasmine and marigold floral theme',
    },
    uid
  );

  const v3 = await createVendor(
    weddingId,
    {
      name: 'Creative Studio Photography & Cinematography',
      categoryId: 'photography',
      contactName: 'Kiran Studio',
      phone: '+91 91234 56789',
      agreedPaise: toPaise(180000),
      schedule: [
        {
          id: 's7',
          label: 'Booking Advance',
          amountPaise: toPaise(50000),
          dueDate: '2026-10-01',
          paid: true,
        },
        {
          id: 's8',
          label: 'Album Delivery Balance',
          amountPaise: toPaise(130000),
          dueDate: '2026-12-05',
          paid: false,
        },
      ],
    },
    uid
  );

  // 2. Seed realistic expenses across categories and payers
  const sampleExpenses = [
    {
      amountPaise: toPaise(100000),
      categoryId: 'catering',
      vendorId: v1,
      scheduleItemId: 's1',
      paidByName: 'Srinivasa Rao (Dad)',
      mode: 'bank' as const,
      type: 'advance' as const,
      date: '2026-10-15',
      side: 'bride' as const,
      note: 'Banquet token advance paid via NEFT',
    },
    {
      amountPaise: toPaise(80000),
      categoryId: 'decoration',
      vendorId: v2,
      scheduleItemId: 's4',
      paidByName: 'Kiran (Brother)',
      mode: 'upi' as const,
      type: 'advance' as const,
      date: '2026-10-10',
      side: 'common' as const,
      note: 'Flower mandapam booking advance',
    },
    {
      amountPaise: toPaise(50000),
      categoryId: 'photography',
      vendorId: v3,
      scheduleItemId: 's7',
      paidByName: 'Kiran (Brother)',
      mode: 'upi' as const,
      type: 'advance' as const,
      date: '2026-10-01',
      side: 'common' as const,
      note: 'Drone and pre-wedding shoot advance',
    },
    {
      amountPaise: toPaise(75000),
      categoryId: 'clothing',
      paidByName: 'Lakshmi (Aunt)',
      mode: 'card' as const,
      type: 'full' as const,
      date: '2026-10-14',
      side: 'bride' as const,
      note: 'Kanchi silk sarees bought for pellikoothuru',
    },
    {
      amountPaise: toPaise(25000),
      categoryId: 'priest',
      paidByName: 'Srinivasa Rao (Dad)',
      mode: 'cash' as const,
      type: 'full' as const,
      date: '2026-10-18',
      side: 'bride' as const,
      note: 'Pooja samagri and purohit dakshina',
    },
    {
      amountPaise: toPaise(15000),
      categoryId: 'invitations',
      paidByName: 'Arjun (Groom)',
      mode: 'upi' as const,
      type: 'full' as const,
      date: '2026-10-12',
      side: 'groom' as const,
      note: 'Printed wedding cards and courier',
    },
  ];

  for (const exp of sampleExpenses) {
    await createExpense(weddingId, exp, uid);
  }

  // 3. Seed realistic gifts (Telugu & English, some gold)
  const sampleGifts = [
    {
      envelopeNo: 1,
      giverName: 'Venkata Subbaiah Garu & Family',
      town: 'Tenali',
      relation: 'Pedananna',
      cashPaise: toPaise(10116),
      side: 'bride' as const,
      note: 'Silver lamp + Cash envelope',
    },
    {
      envelopeNo: 2,
      giverName: 'Ramesh Chandra Garu',
      town: 'Guntur',
      relation: 'Menamama',
      cashPaise: toPaise(5000),
      side: 'bride' as const,
      note: 'Given on engagement day',
    },
    {
      envelopeNo: 3,
      giverName: 'Sita Ram & Geetha',
      town: 'Hyderabad',
      relation: 'Cousin',
      cashPaise: toPaise(2000),
      goldMg: 2000,
      goldDescription: '2g Gold Ring',
      side: 'common' as const,
    },
    {
      envelopeNo: 4,
      giverName: 'Prasad Rao Garu',
      town: 'Vijayawada',
      relation: 'Friend of Dad',
      cashPaise: toPaise(5116),
      side: 'bride' as const,
    },
    {
      envelopeNo: 5,
      giverName: 'Anand & Divya',
      town: 'Bengaluru',
      relation: 'Colleague',
      cashPaise: toPaise(2500),
      items: 'Titan Pair Watches',
      side: 'groom' as const,
    },
  ];

  for (const gift of sampleGifts) {
    await createGift(weddingId, gift, uid);
  }

  await createExtraGifts(weddingId, uid);
}

const EXTRA_GIVERS: Array<[string, string, string, number, 'bride' | 'groom' | 'common']> = [
  ['Narasimha Rao Garu', 'Nellore', 'Uncle', 5116, 'bride'],
  ['Padma & Srinivas', 'Rajahmundry', 'Neighbour', 2116, 'bride'],
  ['Kamala Devi Garu', 'Ongole', 'Aunt', 3116, 'groom'],
  ['Suresh Babu Garu', 'Vizag', 'Friend of Dad', 1116, 'bride'],
  ['Ravi Teja & Family', 'Hyderabad', 'Cousin', 5000, 'common'],
  ['Lakshmi Prasanna', 'Guntur', 'Colleague', 1500, 'groom'],
  ['Murali Krishna Garu', 'Tenali', 'Family friend', 2501, 'bride'],
  ['Anitha & Sunil', 'Chennai', 'Friend', 3000, 'groom'],
  ['Venkateswarlu Garu', 'Bapatla', 'Uncle', 10116, 'bride'],
  ['Swarna Kumari', 'Machilipatnam', 'Aunt', 2116, 'groom'],
  ['Ramesh Chandra Garu', 'Guntur', 'Menamama', 5000, 'bride'], // repeat giver: shows combined total
  ['Prasad Rao Garu', 'Vijayawada', 'Friend of Dad', 2000, 'bride'], // repeat giver
];

async function createExtraGifts(weddingId: string, uid: string): Promise<void> {
  let envelope = 6;
  for (const [giverName, town, relation, rupees, side] of EXTRA_GIVERS) {
    await createGift(
      weddingId,
      { envelopeNo: envelope++, giverName, town, relation, cashPaise: toPaise(rupees), side },
      uid
    );
  }
}
