import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { generateOTP } from '../utils/auth';
import { normalizeCaseFields } from '../utils/textCase';
import phoneDigitsByCode from '../config/phoneDigitsByCode.json';
import { idSchema } from '../utils/validation';

const NAME_PATTERN = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/;
const PHONE_PATTERN = /^\d+$/;
const COUNTRY_CODE_PATTERN = /^\+\d{1,4}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_BY_COUNTRY_CODE = phoneDigitsByCode as Record<string, number[]>;
const ALLOWED_CASTE_VALUES = new Set([
  'marwari',
  'jaiswal',
  'gujarati',
  'punjabi',
  'bengali',
  'no preference',
]);

const emptyStringToUndefined = (value: unknown) => {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const DEFAULT_COUNTRY_CODE = '+91';

const formatDigitsText = (digits: number[]): string => {
  if (digits.length <= 1) {
    return String(digits[0] ?? '');
  }
  if (digits.length === 2) {
    return `${digits[0]} or ${digits[1]}`;
  }
  const allButLast = digits.slice(0, -1).join(', ');
  return `${allButLast}, or ${digits[digits.length - 1]}`;
};

const getPhoneRule = (countryCode: string | undefined) => {
  const normalizedCode =
    countryCode && PHONE_DIGITS_BY_COUNTRY_CODE[countryCode]
      ? countryCode
      : DEFAULT_COUNTRY_CODE;
  const digits = PHONE_DIGITS_BY_COUNTRY_CODE[normalizedCode] || [10];
  return { code: normalizedCode, digits };
};

const nameSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must be at most 120 characters')
    .regex(NAME_PATTERN, 'Name can contain only letters and spaces')
);

const phoneSchema = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().regex(PHONE_PATTERN, 'Phone number must contain only digits')
);

const optionalPhoneSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().regex(PHONE_PATTERN, 'Phone number must contain only digits').optional()
);

const optionalPincodeSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .regex(/^\d{4,10}$/, 'PIN code must contain only digits')
    .optional()
);

const optionalCountryCodeSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .regex(COUNTRY_CODE_PATTERN, 'Country code must be in +91 format')
    .refine(
      (value) => Boolean(PHONE_DIGITS_BY_COUNTRY_CODE[value]),
      'Country code is not supported'
    )
    .optional()
);

const optionalEmailSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().regex(EMAIL_PATTERN, 'Email must contain @ and .').optional()
);

const optionalTextSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().optional()
);

const optionalCasteSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .refine(
      (value) => ALLOWED_CASTE_VALUES.has(value.toLowerCase()),
      'Caste must be one of: Marwari, Jaiswal, Gujarati, Punjabi, Bengali, No Preference'
    )
    .optional()
);

const optionalRatingSchema = z.preprocess(
  emptyStringToUndefined,
  z.enum(['0', '1', '2', '3', '4', '5']).optional()
);

const customerBaseSchema = z.object({
  phoneCountryCode: optionalCountryCodeSchema,
  phoneVerified: z.boolean().optional(),
  email: optionalEmailSchema,
  alterPhone: optionalPhoneSchema,
  alternatePhone: optionalPhoneSchema,
  alterPhoneCountryCode: optionalCountryCodeSchema,
  whatsapp: optionalPhoneSchema,
  whatsappCountryCode: optionalCountryCodeSchema,
  country: optionalTextSchema,
  address: optionalTextSchema,
  street1: optionalTextSchema,
  street2: optionalTextSchema,
  city: optionalTextSchema,
  state: optionalTextSchema,
  pincode: optionalPincodeSchema,
  priority: z.coerce.number().int().min(1).max(5).optional(),
  caste: optionalCasteSchema,
  rating: optionalRatingSchema,
  visitCount: z.number().int().optional(),
  dateOfBirth: optionalTextSchema,
  anniversary: optionalTextSchema,
  occupation: optionalTextSchema,
  companyName: optionalTextSchema,
  gstNumber: optionalTextSchema,
  panNumber: optionalTextSchema,
  aadharNumber: optionalTextSchema,
  whatsappNumber: optionalPhoneSchema,
  instagramHandle: optionalTextSchema,
  twitter: optionalTextSchema,
  linkedin: optionalTextSchema,
  facebookProfile: optionalTextSchema,
  referredById: z.preprocess(
    emptyStringToUndefined,
    idSchema('referred by customer ID').optional()
  ),
  notes: optionalTextSchema,
});

function withPhoneLengthValidation<T extends z.AnyZodObject>(schema: T) {
  return schema.superRefine((data: any, ctx) => {
    const primaryCode = data.phoneCountryCode || DEFAULT_COUNTRY_CODE;
    const primaryRule = getPhoneRule(primaryCode);

    if (data.phone && !primaryRule.digits.includes(data.phone.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: `Phone number for ${primaryRule.code} must be exactly ${formatDigitsText(
          primaryRule.digits
        )} digits`,
      });
    }

    if (data.alterPhone) {
      const alterCode = data.alterPhoneCountryCode || primaryCode;
      const alterRule = getPhoneRule(alterCode);
      if (!alterRule.digits.includes(data.alterPhone.length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alterPhone'],
          message: `2nd phone number for ${alterRule.code} must be exactly ${formatDigitsText(
            alterRule.digits
          )} digits`,
        });
      }
    }

    if (data.alternatePhone) {
      const alternateCode = data.alterPhoneCountryCode || primaryCode;
      const alternateRule = getPhoneRule(alternateCode);
      if (!alternateRule.digits.includes(data.alternatePhone.length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['alternatePhone'],
          message: `Alternate phone number for ${alternateRule.code} must be exactly ${formatDigitsText(
            alternateRule.digits
          )} digits`,
        });
      }
    }

    if (data.whatsappNumber) {
      const whatsappCode = data.whatsappCountryCode || primaryCode;
      const whatsappRule = getPhoneRule(whatsappCode);
      if (!whatsappRule.digits.includes(data.whatsappNumber.length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['whatsappNumber'],
          message: `WhatsApp number for ${whatsappRule.code} must be exactly ${formatDigitsText(
            whatsappRule.digits
          )} digits`,
        });
      }
    }

    if (data.whatsapp) {
      const whatsappCode = data.whatsappCountryCode || primaryCode;
      const whatsappRule = getPhoneRule(whatsappCode);
      if (!whatsappRule.digits.includes(data.whatsapp.length)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['whatsapp'],
          message: `WhatsApp number for ${whatsappRule.code} must be exactly ${formatDigitsText(
            whatsappRule.digits
          )} digits`,
        });
      }
    }
  });
}

// Validation schemas
export const createCustomerSchema = z.object({
  body: withPhoneLengthValidation(
    customerBaseSchema.extend({
      name: nameSchema,
      phone: phoneSchema,
    })
  ),
});

export const updateCustomerSchema = z.object({
  body: withPhoneLengthValidation(
    customerBaseSchema.extend({
      name: nameSchema.optional(),
      phone: phoneSchema.optional(),
    })
  ),
});

/**
 * Create new customer
 */
export async function createCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const data = normalizeCaseFields({ ...req.body }, [
      'name',
      'country',
      'address',
      'street1',
      'street2',
      'city',
      'state',
      'caste',
      'occupation',
      'companyName',
    ]);

    // Convert date strings to Date objects
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.anniversary) {
      data.anniversary = new Date(data.anniversary);
    }
    if (data.priority === undefined || data.priority === null) {
      data.priority = 3;
    }

    const customer = await prisma.customer.create({
      data,
      include: {
        referredBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    sendSuccess(res, { customer }, 'Customer created successfully', 201);
  } catch (error: any) {
    if (error.code === 'P2002') {
      sendError(res, 'Customer with this phone or email already exists', 409);
    } else {
      sendError(res, 'Failed to create customer');
    }
  }
}

/**
 * Get all customers with pagination and search
 */
export async function getCustomers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          referredBy: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          _count: {
            select: {
              enquiries: true,
              bookings: true,
              referrals: true,
            },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    sendSuccess(res, {
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, 'Failed to fetch customers');
  }
}

/**
 * Get customer by ID
 */
export async function getCustomerById(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        referredBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        referrals: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
        enquiries: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        bookings: {
          orderBy: { functionDate: 'desc' },
          take: 10,
          where: { isLatest: true },
        },
      },
    });

    if (!customer) {
      sendNotFound(res, 'Customer not found');
      return;
    }

    sendSuccess(res, { customer });
  } catch (error) {
    sendError(res, 'Failed to fetch customer');
  }
}

/**
 * Update customer
 */
export async function updateCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const data = normalizeCaseFields({ ...req.body }, [
      'name',
      'country',
      'address',
      'street1',
      'street2',
      'city',
      'state',
      'caste',
      'occupation',
      'companyName',
    ]);

    // Convert date strings
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.anniversary) {
      data.anniversary = new Date(data.anniversary);
    }

    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        referredBy: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    sendSuccess(res, { customer }, 'Customer updated successfully');
  } catch (error: any) {
    if (error.code === 'P2025') {
      sendNotFound(res, 'Customer not found');
    } else if (error.code === 'P2002') {
      sendError(res, 'Customer with this phone or email already exists', 409);
    } else {
      sendError(res, 'Failed to update customer');
    }
  }
}

/**
 * Delete customer
 */
export async function deleteCustomer(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id },
    });

    sendSuccess(res, null, 'Customer deleted successfully');
  } catch (error: any) {
    if (error.code === 'P2025') {
      sendNotFound(res, 'Customer not found');
    } else {
      sendError(res, 'Failed to delete customer');
    }
  }
}

/**
 * Send OTP to customer
 */
export async function sendOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone } = req.body;

    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // 10 minutes

    // Update or create customer with OTP
    await prisma.customer.upsert({
      where: { phone },
      update: {
        otpCode: otp,
        otpExpiry,
      },
      create: {
        phone,
        name: 'Guest', // Temporary name
        otpCode: otp,
        otpExpiry,
      },
    });

    // TODO: Send SMS with OTP

    sendSuccess(res, null, 'OTP sent successfully');
  } catch (error) {
    sendError(res, 'Failed to send OTP');
  }
}

/**
 * Verify OTP
 */
export async function verifyOTP(req: Request, res: Response): Promise<void> {
  try {
    const { phone, otp } = req.body;

    const customer = await prisma.customer.findUnique({
      where: { phone },
    });

    if (!customer || !customer.otpCode || !customer.otpExpiry) {
      sendError(res, 'Invalid or expired OTP', 400);
      return;
    }

    if (customer.otpExpiry < new Date()) {
      sendError(res, 'OTP has expired', 400);
      return;
    }

    if (customer.otpCode !== otp) {
      sendError(res, 'Invalid OTP', 400);
      return;
    }

    // Mark as verified and clear OTP
    const updatedCustomer = await prisma.customer.update({
      where: { phone },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    sendSuccess(res, { customer: updatedCustomer }, 'OTP verified successfully');
  } catch (error) {
    sendError(res, 'Failed to verify OTP');
  }
}
