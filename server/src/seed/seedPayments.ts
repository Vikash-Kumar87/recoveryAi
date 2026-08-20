import { Payment, FailureReason } from '../models/Payment.js';
import { Recovery } from '../models/Recovery.js';
import { Activity } from '../models/Activity.js';
import { Settings } from '../models/Settings.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { calculateRecoveryMetrics } from '../utils/recoveryScore.js';
import { analyzeFailedPayment } from '../services/groq.service.js';
import { logger } from '../utils/logger.js';

interface SeedPaymentData {
  paymentId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  failureReason: FailureReason;
  attemptNumber: number;
  previousPaymentCount: number;
  successfulPaymentCount: number;
  failedPaymentCount: number;
  status: 'pending' | 'ai_analyzed' | 'recovery_initiated' | 'recovered' | 'failed';
  preferredPaymentTime: string;
  orderId: string;
}

// EXACTLY 25 Realistic Failed Payment Records for Razorpay Demo
const DEMO_PAYMENTS: SeedPaymentData[] = [
  {
    paymentId: 'PAY-1001',
    customerId: 'CUST-1001',
    customerName: 'Aarav Mehta',
    customerEmail: 'aarav.mehta@techcorp.in',
    amount: 149900, // ₹1,499
    failureReason: 'BANK_TIMEOUT',
    attemptNumber: 2,
    previousPaymentCount: 6,
    successfulPaymentCount: 5,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '19:30',
    orderId: 'order_rec_1001',
  },
  {
    paymentId: 'PAY-1002',
    customerId: 'CUST-1002',
    customerName: 'Rohan Verma',
    customerEmail: 'rohan.verma@fintechlabs.in',
    amount: 1499900, // ₹14,999
    failureReason: 'CARD_DECLINED',
    attemptNumber: 2,
    previousPaymentCount: 5,
    successfulPaymentCount: 3,
    failedPaymentCount: 2,
    status: 'ai_analyzed',
    preferredPaymentTime: '14:00',
    orderId: 'order_rec_1002',
  },
  {
    paymentId: 'PAY-1003',
    customerId: 'CUST-1003',
    customerName: 'Priya Sharma',
    customerEmail: 'priya.sharma@cloudscale.io',
    amount: 299900, // ₹2,999
    failureReason: 'INSUFFICIENT_FUNDS',
    attemptNumber: 1,
    previousPaymentCount: 9,
    successfulPaymentCount: 8,
    failedPaymentCount: 1,
    status: 'recovery_initiated',
    preferredPaymentTime: '10:00',
    orderId: 'order_rec_1003',
  },
  {
    paymentId: 'PAY-1004',
    customerId: 'CUST-1004',
    customerName: 'Ananya Iyer',
    customerEmail: 'ananya.iyer@growthworks.in',
    amount: 499900, // ₹4,999
    failureReason: 'EXPIRED_CARD',
    attemptNumber: 1,
    previousPaymentCount: 12,
    successfulPaymentCount: 12,
    failedPaymentCount: 0,
    status: 'ai_analyzed',
    preferredPaymentTime: '18:00',
    orderId: 'order_rec_1004',
  },
  {
    paymentId: 'PAY-1005',
    customerId: 'CUST-1005',
    customerName: 'Vikram Malhotra',
    customerEmail: 'vikram.malhotra@zenithcap.com',
    amount: 999900, // ₹9,999
    failureReason: 'LIMIT_EXCEEDED',
    attemptNumber: 2,
    previousPaymentCount: 16,
    successfulPaymentCount: 15,
    failedPaymentCount: 1,
    status: 'recovery_initiated',
    preferredPaymentTime: '11:30',
    orderId: 'order_rec_1005',
  },
  {
    paymentId: 'PAY-1006',
    customerId: 'CUST-1006',
    customerName: 'Sneha Patel',
    customerEmail: 'sneha.patel@designhub.co',
    amount: 79900, // ₹799
    failureReason: 'NETWORK_ERROR',
    attemptNumber: 1,
    previousPaymentCount: 5,
    successfulPaymentCount: 4,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '20:00',
    orderId: 'order_rec_1006',
  },
  {
    paymentId: 'PAY-1007',
    customerId: 'CUST-1007',
    customerName: 'Rahul Kapoor',
    customerEmail: 'rahul.kapoor@innovate.in',
    amount: 249900, // ₹2,499
    failureReason: 'BANK_TIMEOUT',
    attemptNumber: 1,
    previousPaymentCount: 9,
    successfulPaymentCount: 7,
    failedPaymentCount: 2,
    status: 'pending',
    preferredPaymentTime: '17:45',
    orderId: 'order_rec_1007',
  },
  {
    paymentId: 'PAY-1008',
    customerId: 'CUST-1008',
    customerName: 'Neha Reddy',
    customerEmail: 'neha.reddy@urbanflow.io',
    amount: 149900, // ₹1,499
    failureReason: 'AUTHENTICATION_FAILED',
    attemptNumber: 2,
    previousPaymentCount: 7,
    successfulPaymentCount: 6,
    failedPaymentCount: 1,
    status: 'ai_analyzed',
    preferredPaymentTime: '15:15',
    orderId: 'order_rec_1008',
  },
  {
    paymentId: 'PAY-1009',
    customerId: 'CUST-1009',
    customerName: 'Arjun Nair',
    customerEmail: 'arjun.nair@matrixlogic.com',
    amount: 49900, // ₹499
    failureReason: 'CARD_DECLINED',
    attemptNumber: 1,
    previousPaymentCount: 3,
    successfulPaymentCount: 2,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '12:00',
    orderId: 'order_rec_1009',
  },
  {
    paymentId: 'PAY-1010',
    customerId: 'CUST-1010',
    customerName: 'Pooja Gupta',
    customerEmail: 'pooja.gupta@bluestone.in',
    amount: 99900, // ₹999
    failureReason: 'INSUFFICIENT_FUNDS',
    attemptNumber: 2,
    previousPaymentCount: 11,
    successfulPaymentCount: 9,
    failedPaymentCount: 2,
    status: 'recovery_initiated',
    preferredPaymentTime: '09:30',
    orderId: 'order_rec_1010',
  },
  {
    paymentId: 'PAY-1011',
    customerId: 'CUST-1011',
    customerName: 'Aditya Joshi',
    customerEmail: 'aditya.joshi@novapay.in',
    amount: 1499900, // ₹14,999
    failureReason: 'BANK_TIMEOUT',
    attemptNumber: 1,
    previousPaymentCount: 14,
    successfulPaymentCount: 14,
    failedPaymentCount: 0,
    status: 'ai_analyzed',
    preferredPaymentTime: '16:00',
    orderId: 'order_rec_1011',
  },
  {
    paymentId: 'PAY-1012',
    customerId: 'CUST-1012',
    customerName: 'Meera Deshmukh',
    customerEmail: 'meera.deshmukh@craftworks.in',
    amount: 299900, // ₹2,999
    failureReason: 'NETWORK_ERROR',
    attemptNumber: 1,
    previousPaymentCount: 5,
    successfulPaymentCount: 5,
    failedPaymentCount: 0,
    status: 'pending',
    preferredPaymentTime: '19:00',
    orderId: 'order_rec_1012',
  },
  {
    paymentId: 'PAY-1013',
    customerId: 'CUST-1013',
    customerName: 'Siddharth Rao',
    customerEmail: 'siddharth.rao@vortexai.com',
    amount: 499900, // ₹4,999
    failureReason: 'EXPIRED_CARD',
    attemptNumber: 1,
    previousPaymentCount: 12,
    successfulPaymentCount: 11,
    failedPaymentCount: 1,
    status: 'ai_analyzed',
    preferredPaymentTime: '14:30',
    orderId: 'order_rec_1013',
  },
  {
    paymentId: 'PAY-1014',
    customerId: 'CUST-1014',
    customerName: 'Kavita Menon',
    customerEmail: 'kavita.menon@stridesoft.in',
    amount: 79900, // ₹799
    failureReason: 'AUTHENTICATION_FAILED',
    attemptNumber: 2,
    previousPaymentCount: 5,
    successfulPaymentCount: 3,
    failedPaymentCount: 2,
    status: 'pending',
    preferredPaymentTime: '11:00',
    orderId: 'order_rec_1014',
  },
  {
    paymentId: 'PAY-1015',
    customerId: 'CUST-1015',
    customerName: 'Nikhil Bhat',
    customerEmail: 'nikhil.bhat@hyperstack.io',
    amount: 249900, // ₹2,499
    failureReason: 'CARD_DECLINED',
    attemptNumber: 1,
    previousPaymentCount: 7,
    successfulPaymentCount: 6,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '18:15',
    orderId: 'order_rec_1015',
  },
  {
    paymentId: 'PAY-1016',
    customerId: 'CUST-1016',
    customerName: 'Ritu Singhania',
    customerEmail: 'ritu.singhania@vertexholdings.in',
    amount: 999900, // ₹9,999
    failureReason: 'LIMIT_EXCEEDED',
    attemptNumber: 2,
    previousPaymentCount: 19,
    successfulPaymentCount: 18,
    failedPaymentCount: 1,
    status: 'recovery_initiated',
    preferredPaymentTime: '13:00',
    orderId: 'order_rec_1016',
  },
  {
    paymentId: 'PAY-1017',
    customerId: 'CUST-1017',
    customerName: 'Amit Chauhan',
    customerEmail: 'amit.chauhan@apexdigital.in',
    amount: 149900, // ₹1,499
    failureReason: 'BANK_TIMEOUT',
    attemptNumber: 1,
    previousPaymentCount: 5,
    successfulPaymentCount: 4,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '21:00',
    orderId: 'order_rec_1017',
  },
  {
    paymentId: 'PAY-1018',
    customerId: 'CUST-1018',
    customerName: 'Tanvi Saxena',
    customerEmail: 'tanvi.saxena@pulsemedia.in',
    amount: 49900, // ₹499
    failureReason: 'NETWORK_ERROR',
    attemptNumber: 1,
    previousPaymentCount: 7,
    successfulPaymentCount: 7,
    failedPaymentCount: 0,
    status: 'pending',
    preferredPaymentTime: '17:30',
    orderId: 'order_rec_1018',
  },
  {
    paymentId: 'PAY-1019',
    customerId: 'CUST-1019',
    customerName: 'Harsh Vardhan',
    customerEmail: 'harsh.vardhan@corelogix.com',
    amount: 299900, // ₹2,999
    failureReason: 'INSUFFICIENT_FUNDS',
    attemptNumber: 2,
    previousPaymentCount: 13,
    successfulPaymentCount: 10,
    failedPaymentCount: 3,
    status: 'pending',
    preferredPaymentTime: '10:15',
    orderId: 'order_rec_1019',
  },
  {
    paymentId: 'PAY-1020',
    customerId: 'CUST-1020',
    customerName: 'Divya Nair',
    customerEmail: 'divya.nair@nextgensys.in',
    amount: 1499900, // ₹14,999
    failureReason: 'CARD_DECLINED',
    attemptNumber: 1,
    previousPaymentCount: 18,
    successfulPaymentCount: 16,
    failedPaymentCount: 2,
    status: 'ai_analyzed',
    preferredPaymentTime: '15:45',
    orderId: 'order_rec_1020',
  },
  {
    paymentId: 'PAY-1021',
    customerId: 'CUST-1021',
    customerName: 'Kunal Roy',
    customerEmail: 'kunal.roy@swiftbytes.io',
    amount: 79900, // ₹799
    failureReason: 'AUTHENTICATION_FAILED',
    attemptNumber: 1,
    previousPaymentCount: 3,
    successfulPaymentCount: 2,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '16:30',
    orderId: 'order_rec_1021',
  },
  {
    paymentId: 'PAY-1022',
    customerId: 'CUST-1022',
    customerName: 'Shweta Jain',
    customerEmail: 'shweta.jain@brightpath.in',
    amount: 499900, // ₹4,999
    failureReason: 'BANK_TIMEOUT',
    attemptNumber: 2,
    previousPaymentCount: 14,
    successfulPaymentCount: 13,
    failedPaymentCount: 1,
    status: 'ai_analyzed',
    preferredPaymentTime: '19:15',
    orderId: 'order_rec_1022',
  },
  {
    paymentId: 'PAY-1023',
    customerId: 'CUST-1023',
    customerName: 'Varun Pillai',
    customerEmail: 'varun.pillai@quantumbits.com',
    amount: 249900, // ₹2,499
    failureReason: 'EXPIRED_CARD',
    attemptNumber: 1,
    previousPaymentCount: 8,
    successfulPaymentCount: 8,
    failedPaymentCount: 0,
    status: 'pending',
    preferredPaymentTime: '12:45',
    orderId: 'order_rec_1023',
  },
  {
    paymentId: 'PAY-1024',
    customerId: 'CUST-1024',
    customerName: 'Deepa Hegde',
    customerEmail: 'deepa.hegde@prismventures.in',
    amount: 999900, // ₹9,999
    failureReason: 'LIMIT_EXCEEDED',
    attemptNumber: 2,
    previousPaymentCount: 22,
    successfulPaymentCount: 20,
    failedPaymentCount: 2,
    status: 'recovery_initiated',
    preferredPaymentTime: '11:00',
    orderId: 'order_rec_1024',
  },
  {
    paymentId: 'PAY-1025',
    customerId: 'CUST-1025',
    customerName: 'Yash Mittal',
    customerEmail: 'yash.mittal@elevatetech.io',
    amount: 99900, // ₹999
    failureReason: 'INSUFFICIENT_FUNDS',
    attemptNumber: 1,
    previousPaymentCount: 6,
    successfulPaymentCount: 5,
    failedPaymentCount: 1,
    status: 'pending',
    preferredPaymentTime: '18:30',
    orderId: 'order_rec_1025',
  },
];

export const seedDatabase = async () => {
  try {
    logger.info('Starting RecoverAI Database Seed Process...');
    await connectDatabase();

    // 1. Clear all existing collections
    logger.info('Clearing existing collections (payments, recoveries, activities, settings)...');
    await Promise.all([
      Payment.deleteMany({}),
      Recovery.deleteMany({}),
      Activity.deleteMany({}),
      Settings.deleteMany({}),
    ]);

    // 2. Insert Default Settings
    logger.info('Inserting default merchant settings in MongoDB...');
    await Settings.create({
      enableAiRecovery: true,
      autoStartRecovery: true,
      autoSendMessages: false,
      recoveryThreshold: 70,
      maxRetryAttempts: 3,
      emailAlerts: true,
      smsAlerts: false,
      alertEmail: 'merchant@recoverai.in',
      webhookEnabled: false,
    });

    // 3. Insert EXACTLY 25 Payments
    logger.info(`Inserting EXACTLY ${DEMO_PAYMENTS.length} realistic payment records...`);
    const now = Date.now();
    const paymentsToInsert = DEMO_PAYMENTS.map((p, index) => {
      const createdAt = new Date(now - (DEMO_PAYMENTS.length - index) * 3600000 * 4);
      return {
        ...p,
        currency: 'INR',
        gatewayCode: `GATEWAY_${p.failureReason}`,
        lastSuccessfulPaymentAt: new Date(createdAt.getTime() - 86400000 * 3),
        createdAt,
        updatedAt: createdAt,
      };
    });

    const insertedPayments = await Payment.insertMany(paymentsToInsert);

    // 4. Generate AI Recovery records & Activity timeline events
    logger.info('Generating AI Recovery records and activity timeline events...');
    const recoveriesToInsert = [];
    const activitiesToInsert = [];

    for (const paymentDoc of insertedPayments) {
      const payment = paymentDoc as any;
      const metrics = calculateRecoveryMetrics(payment);

      // Pre-compute intelligent recovery analysis
      const aiOutput = await analyzeFailedPayment(payment, metrics, true);

      const createdAt = payment.createdAt || new Date();
      const amount = payment.amount;

      recoveriesToInsert.push({
        paymentId: payment.paymentId,
        ...aiOutput,
        status:
          payment.status === 'recovered'
            ? 'COMPLETED'
            : payment.status === 'recovery_initiated'
            ? 'IN_PROGRESS'
            : 'PENDING',
        createdAt,
        updatedAt: createdAt,
      });

      // Activity: AI Analysis Event
      activitiesToInsert.push({
        type: 'AI_ANALYSIS',
        paymentId: payment.paymentId,
        message: `AI analyzed payment ${payment.paymentId} for ₹${(amount / 100).toLocaleString('en-IN')}`,
        customerName: payment.customerName,
        amount: amount,
        status: 'success',
        metadata: {
          recoveryProbability: aiOutput.recoveryProbability,
          customerReliability: aiOutput.customerReliability,
          recommendedAction: aiOutput.recommendedAction,
        },
        createdAt: new Date(createdAt.getTime() + 15000),
      });

      // Activity: Recovery Recommended Event
      activitiesToInsert.push({
        type: 'RECOVERY_RECOMMENDED',
        paymentId: payment.paymentId,
        message: `AI recommended strategy: ${aiOutput.recommendedAction} (${aiOutput.recoveryProbability}% probability)`,
        customerName: payment.customerName,
        amount: amount,
        status: 'info',
        metadata: {
          action: aiOutput.recommendedAction,
          bestRetryTime: aiOutput.bestRetryTime,
          priority: aiOutput.priority,
        },
        createdAt: new Date(createdAt.getTime() + 30000),
      });

      if (payment.status === 'recovery_initiated' || payment.status === 'recovered') {
        activitiesToInsert.push({
          type: 'RECOVERY_INITIATED',
          paymentId: payment.paymentId,
          message: `Recovery workflow initiated (${aiOutput.recommendedAction})`,
          customerName: payment.customerName,
          amount: amount,
          status: 'pending',
          createdAt: new Date(createdAt.getTime() + 60000),
        });
      }
    }

    if (recoveriesToInsert.length > 0) {
      await Recovery.insertMany(recoveriesToInsert);
    }
    if (activitiesToInsert.length > 0) {
      await Activity.insertMany(activitiesToInsert);
    }

    logger.info('==================================================');
    logger.info('✅ Seed process completed successfully!');
    logger.info(`Summary: Exactly ${insertedPayments.length} Payments (PAY-1001 to PAY-1025)`);
    logger.info(`Recovery Records: ${recoveriesToInsert.length}`);
    logger.info(`Activity Events: ${activitiesToInsert.length}`);
    logger.info('==================================================');
  } catch (error) {
    logger.error('Error during database seed:', error);
  } finally {
    if (process.argv[1]?.endsWith('seedPayments.ts') || process.argv[1]?.endsWith('seedPayments.js')) {
      await disconnectDatabase();
    }
  }
};

export const autoSeedIfEmpty = async () => {
  try {
    const paymentCount = await Payment.countDocuments();
    if (paymentCount === 0) {
      logger.info('No payments found in MongoDB Atlas. Automatically populating demo payments dataset...');
      await seedDatabase();
    } else {
      logger.info(`Database already contains ${paymentCount} payment records. Skipping auto-seed.`);
    }
  } catch (error) {
    logger.warn('Auto-seed check encountered an issue (non-blocking):', error);
  }
};

if (process.argv[1]?.endsWith('seedPayments.ts') || process.argv[1]?.endsWith('seedPayments.js')) {
  seedDatabase().then(() => process.exit(0));
}
