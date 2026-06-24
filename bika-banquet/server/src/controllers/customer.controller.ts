import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { sendSuccess, sendError, sendNotFound } from '../utils/response';
import { normalizeCaseFields } from '../utils/textCase';
import phoneDigitsByCode from '../config/phoneDigitsByCode.json';
import { idSchema } from '../utils/validation';
import { toE164 } from '../utils/phone';
import { sanitizeSearchTerm } from '../utils/search';
import { parsePagination } from '../utils/pagination';
import { buildOrderBy, SortWhitelist } from '../utils/listQuery';
import { createAuditLog } from '../utils/auditLog';
import { broadcastBookingEvent } from '../sse';

// Allows letters (including Unicode/Devanagari/Bengali etc.), spaces, dots,
// hyphens, and apostrophes — covers Indian names, D'Souza, S.K. Sharma, etc.
const NAME_PATTERN = /^[\p{L}][\p{L}\s.''-]*$/u;
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

/** On update: empty string or explicit null clears optional DB columns. */
const emptyStringToNull = (value: unknown) => {
  if (value === null) return null;
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const DEFAULT_COUNTRY_CODE = '+91';

// Maps customers-page sortable column keys → Prisma orderBy. Composite UI
// columns (contact/location/stats) map to their best DB column. An `id`
// tie-breaker is appended centrally by buildOrderBy.
const CUSTOMER_SORT_WHITELIST: SortWhitelist = {
  name: (order) => [{ name: order }],
  createdAt: (order) => [{ createdAt: order }],
  contact: (order) => [{ phone: order }],
  location: (order) => [{ city: order }, { state: order }],
  stats: (order) => [{ bookings: { _count: order } }],
};

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
    .regex(NAME_PATTERN, 'Name must start with a letter and can contain letters, spaces, dots, hyphens, or apostrophes')
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

const nullableOptionalEmailSchema = z.preprocess(
  emptyStringToNull,
  z
    .union([z.string().regex(EMAIL_PATTERN, 'Email must contain @ and .'), z.null()])
    .optional()
);

const nullableOptionalPhoneSchema = z.preprocess(
  emptyStringToNull,
  z
    .union([
      z.string().regex(PHONE_PATTERN, 'Phone number must contain only digits'),
      z.null(),
    ])
    .optional()
);

const optionalTextSchema = z.preprocess(
  emptyStringToUndefined,
  z.string().optional()
);

const nullableOptionalTextSchema = z.preprocess(
  emptyStringToNull,
  z.string().nullable().optional()
);

const nullableOptionalPincodeSchema = z.preprocess(
  emptyStringToNull,
  z
    .union([z.string().regex(/^\d{4,10}$/, 'PIN code must contain only digits'), z.null()])
    .optional()
);

const nullableOptionalCountryCodeSchema = z.preprocess(
  emptyStringToNull,
  z
    .union([
      z
        .string()
        .regex(COUNTRY_CODE_PATTERN, 'Country code must be in +91 format')
        .refine(
          (value) => Boolean(PHONE_DIGITS_BY_COUNTRY_CODE[value]),
          'Country code is not supported'
        ),
      z.null(),
    ])
    .optional()
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

const nullableOptionalReferredByIdSchema = z.preprocess(
  emptyStringToNull,
  z.union([idSchema('referred by customer ID'), z.null()]).optional()
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
  isWhatsappSameAsPhone: z.boolean().optional(),
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

function normalizeOptionalPhoneAlias(value: unknown): string | null {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function buildNormalizedPhoneFields(
  data: Record<string, any>,
  existing?: Record<string, any>
) {
  const primaryCountryCode =
    data.phoneCountryCode ??
    existing?.phoneCountryCode ??
    DEFAULT_COUNTRY_CODE;
  const primaryPhone = data.phone ?? existing?.phone;
  const phoneE164 = toE164(primaryCountryCode, primaryPhone);

  const alternateCountryCode =
    data.alterPhoneCountryCode ??
    existing?.alterPhoneCountryCode ??
    primaryCountryCode;
  const alternatePhoneProvided = 'alterPhone' in data || 'alternatePhone' in data;
  const alternatePhoneSource =
    alternatePhoneProvided
      ? data.alterPhone ?? data.alternatePhone ?? null
      : existing?.alterPhone ?? existing?.alternatePhone;
  const normalizedAlternatePhone = alternatePhoneProvided
    ? normalizeOptionalPhoneAlias(alternatePhoneSource)
    : undefined;
  const alternatePhoneE164 =
    toE164(
      alternateCountryCode,
      alternatePhoneProvided ? normalizedAlternatePhone : alternatePhoneSource
    ) ??
    (alternatePhoneProvided ? null : undefined);

  const whatsappCountryCode =
    data.whatsappCountryCode ??
    existing?.whatsappCountryCode ??
    primaryCountryCode;
  const whatsappProvided = 'whatsapp' in data || 'whatsappNumber' in data;
  const whatsappSource =
    whatsappProvided
      ? data.whatsapp ?? data.whatsappNumber ?? null
      : existing?.whatsapp ?? existing?.whatsappNumber;
  const normalizedWhatsapp = whatsappProvided
    ? normalizeOptionalPhoneAlias(whatsappSource)
    : undefined;
  const whatsappE164 =
    toE164(
      whatsappCountryCode,
      whatsappProvided ? normalizedWhatsapp : whatsappSource
    ) ??
    (whatsappProvided ? null : undefined);

  const isWhatsappSameAsPhone =
    data.isWhatsappSameAsPhone !== undefined
      ? Boolean(data.isWhatsappSameAsPhone)
      : !whatsappE164 || (Boolean(phoneE164) && whatsappE164 === phoneE164);

  return {
    phoneE164,
    ...(alternatePhoneProvided
      ? {
          alterPhone: normalizedAlternatePhone,
          alternatePhone: normalizedAlternatePhone,
          ...(normalizedAlternatePhone === null ? { alterPhoneCountryCode: null } : {}),
        }
      : {}),
    alternatePhoneE164,
    ...(whatsappProvided
      ? {
          whatsapp: normalizedWhatsapp,
          whatsappNumber: normalizedWhatsapp,
          ...(normalizedWhatsapp === null ? { whatsappCountryCode: null } : {}),
        }
      : {}),
    whatsappE164,
    isWhatsappSameAsPhone,
  };
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
      email: nullableOptionalEmailSchema,
      alterPhone: nullableOptionalPhoneSchema,
      alternatePhone: nullableOptionalPhoneSchema,
      alterPhoneCountryCode: nullableOptionalCountryCodeSchema,
      whatsapp: nullableOptionalPhoneSchema,
      whatsappCountryCode: nullableOptionalCountryCodeSchema,
      country: nullableOptionalTextSchema,
      address: nullableOptionalTextSchema,
      street1: nullableOptionalTextSchema,
      street2: nullableOptionalTextSchema,
      city: nullableOptionalTextSchema,
      state: nullableOptionalTextSchema,
      pincode: nullableOptionalPincodeSchema,
      notes: nullableOptionalTextSchema,
      occupation: nullableOptionalTextSchema,
      companyName: nullableOptionalTextSchema,
      gstNumber: nullableOptionalTextSchema,
      panNumber: nullableOptionalTextSchema,
      aadharNumber: nullableOptionalTextSchema,
      whatsappNumber: nullableOptionalPhoneSchema,
      instagramHandle: nullableOptionalTextSchema,
      twitter: nullableOptionalTextSchema,
      linkedin: nullableOptionalTextSchema,
      facebookProfile: nullableOptionalTextSchema,
      referredById: nullableOptionalReferredByIdSchema,
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

    const normalizedPhoneFields = buildNormalizedPhoneFields(data);

    const customer = await prisma.customer.create({
      data: {
        ...data,
        ...normalizedPhoneFields,
      },
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

    broadcastBookingEvent('customer:created', { id: customer.id });
    void createAuditLog(req, 'CREATE', 'customer', customer.id, customer.name);
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
    const { page, limit, skip } = parsePagination(
      req.query.page,
      req.query.limit,
      20,
      5000
    );
    const search = sanitizeSearchTerm(req.query.search);

    // Build where clause for search.
    // NOTE: city/state added so server search is a strict SUPERSET of the
    // client-side `filterAndSortRows` (which also searches location).
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { phoneE164: { contains: search } },
        { alterPhone: { contains: search } },
        { alternatePhone: { contains: search } },
        { alternatePhoneE164: { contains: search } },
        { whatsapp: { contains: search } },
        { whatsappNumber: { contains: search } },
        { whatsappE164: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Stable, whitelisted server sort with an `id` tie-breaker so paginated
    // rows never shuffle. Default (no sort param) preserves prior behaviour.
    const orderBy = buildOrderBy(
      req.query.sort,
      req.query.order,
      CUSTOMER_SORT_WHITELIST,
      [{ createdAt: 'desc' }]
    );

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: orderBy as any,
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
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });
    if (!existingCustomer) {
      sendNotFound(res, 'Customer not found');
      return;
    }

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

    const normalizedPhoneFields = buildNormalizedPhoneFields(
      data,
      existingCustomer as Record<string, any>
    );

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        ...normalizedPhoneFields,
      },
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

    broadcastBookingEvent('customer:updated', { id: customer.id });
    void createAuditLog(req, 'UPDATE', 'customer', customer.id, customer.name);
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

    const linkedBookings = await prisma.booking.count({
      where: { customerId: id },
    });

    if (linkedBookings > 0) {
      res.status(409).json({
        success: false,
        message: `This customer cannot be deleted because they have ${linkedBookings} booking(s) on record. Booking history must be preserved for financial integrity.`,
      });
      return;
    }

    const linkedAsSecondary = await prisma.booking.count({
      where: { secondCustomerId: id },
    });

    if (linkedAsSecondary > 0) {
      res.status(409).json({
        success: false,
        message: `This customer cannot be deleted because they are linked as a secondary customer on ${linkedAsSecondary} booking(s).`,
      });
      return;
    }

    await prisma.customer.delete({
      where: { id },
    });

    broadcastBookingEvent('customer:deleted', { id });
    void createAuditLog(req, 'DELETE', 'customer', id, '');
    sendSuccess(res, null, 'Customer deleted successfully');
  } catch (error: any) {
    if (error.code === 'P2025') {
      sendNotFound(res, 'Customer not found');
    } else if (error.code === 'P2003') {
      // Foreign key constraint — customer has linked bookings, enquiries, or other records.
      sendError(
        res,
        'Cannot delete this customer because they have existing bookings or enquiries. Remove those first.',
        409
      );
    } else {
      sendError(res, 'Failed to delete customer');
    }
  }
}
