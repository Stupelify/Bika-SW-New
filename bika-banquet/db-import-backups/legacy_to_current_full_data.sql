BEGIN;

CREATE OR REPLACE FUNCTION public._safe_float(val text)
RETURNS double precision
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE outv double precision;
BEGIN
  IF val IS NULL OR btrim(val) = '' THEN
    RETURN 0;
  END IF;
  BEGIN
    outv := regexp_replace(val, '[^0-9.\-]', '', 'g')::double precision;
  EXCEPTION WHEN others THEN
    outv := 0;
  END;
  RETURN COALESCE(outv, 0);
END;
$$;

TRUNCATE TABLE
  public.additional_booking_items,
  public.booking_payments,
  public.booking_packs,
  public.booking_menu_items,
  public.booking_menus,
  public.booking_halls,
  public.finalized_bookings,
  public.finalized_quotations,
  public.bookings,
  public.enquiry_packs,
  public.enquiry_halls,
  public.enquiries,
  public.template_menu_items,
  public.template_menus,
  public.items,
  public.item_types,
  public.halls,
  public.banquets,
  public.meal_slots,
  public.customers
CASCADE;

INSERT INTO public.customers (
  id, name, phone, email, "alternatePhone", address, city, state, pincode,
  "whatsappNumber", "instagramHandle", "facebookProfile", "otpCode", "otpExpiry",
  "isVerified", "notes", "createdAt", "updatedAt", "alterPhone", "alterPhoneCountryCode",
  caste, country, linkedin, "otpExpiresAt", "phoneCountryCode", "phoneVerified", priority,
  rating, street1, street2, twitter, "visitCount", whatsapp, "whatsappCountryCode"
)
SELECT
  c.id::text,
  COALESCE(NULLIF(BTRIM(c.name), ''), 'Customer ' || c.id::text),
  c.phone,
  NULLIF(BTRIM(c.email), ''),
  NULLIF(BTRIM(c."alterPhone"), ''),
  NULLIF(BTRIM(c.address), ''),
  NULLIF(BTRIM(c.city), ''),
  NULLIF(BTRIM(c.state), ''),
  NULLIF(BTRIM(c.pincode), ''),
  NULLIF(BTRIM(c.whatsapp), ''),
  NULLIF(BTRIM(c.instagram), ''),
  NULLIF(BTRIM(c.facebook), ''),
  c."otpCode",
  c."otpExpiresAt",
  COALESCE(c."phoneVerified", false),
  NULL,
  COALESCE(c."createdAt", NOW()),
  COALESCE(c."updatedAt", COALESCE(c."createdAt", NOW())),
  NULLIF(BTRIM(c."alterPhone"), ''),
  NULLIF(BTRIM(c."alterPhoneCountryCode"), ''),
  NULLIF(BTRIM(c.caste), ''),
  COALESCE(NULLIF(BTRIM(c.country), ''), 'India'),
  NULLIF(BTRIM(c.linkedin), ''),
  c."otpExpiresAt",
  NULLIF(BTRIM(c."phoneCountryCode"), ''),
  COALESCE(c."phoneVerified", false),
  c.priority,
  COALESCE(NULLIF(BTRIM(c.rating), ''), '0'),
  NULLIF(BTRIM(c.street1), ''),
  NULLIF(BTRIM(c.street2), ''),
  NULLIF(BTRIM(c.twitter), ''),
  COALESCE(c."visitCount", 0),
  NULLIF(BTRIM(c.whatsapp), ''),
  NULLIF(BTRIM(c."whatsappCountryCode"), '')
FROM public."Customer" c;

UPDATE public.customers c
SET "referredById" = src."referredById"::text
FROM public."Customer" src
WHERE c.id = src.id::text
  AND src."referredById" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.customers r WHERE r.id = src."referredById"::text
  );

INSERT INTO public.banquets (
  id, name, location, address, city, state, pincode, phone, email,
  facilities, description, "isActive", "createdAt", "updatedAt"
)
SELECT
  b.id::text,
  COALESCE(NULLIF(BTRIM(b.name), ''), 'Banquet ' || b.id::text),
  COALESCE(NULLIF(BTRIM(b.location), ''), 'Unknown'),
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
  true,
  NOW(), NOW()
FROM public."Banquet" b;

INSERT INTO public.halls (
  id, name, "banquetId", capacity, "floatingCapacity", area, "floorNumber",
  amenities, description, "basePrice", images, "isActive", "createdAt", "updatedAt",
  location, "order", photo, rate
)
SELECT
  h.id::text,
  COALESCE(NULLIF(BTRIM(h.name), ''), 'Hall ' || h.id::text),
  CASE WHEN bq.id IS NOT NULL THEN h."banquetId"::text ELSE NULL END,
  0,
  NULL,
  NULLIF(public._safe_float(h.area), 0),
  NULL,
  NULL,
  NULL,
  public._safe_float(h.rate),
  ARRAY[]::text[],
  true,
  NOW(), NOW(),
  NULLIF(BTRIM(h.location), ''),
  h."order",
  NULLIF(BTRIM(h.photo), ''),
  NULLIF(BTRIM(h.rate), '')
FROM public."Hall" h
LEFT JOIN public.banquets bq
  ON bq.id = h."banquetId"::text;

INSERT INTO public.meal_slots (
  id, name, description, "startTime", "endTime", "displayOrder", "isActive", "createdAt", "updatedAt"
)
SELECT
  ms.id::text,
  COALESCE(NULLIF(BTRIM(ms.name), ''), 'Meal Slot ' || ms.id::text),
  NULL,
  NULLIF(BTRIM(ms."startTime"), ''),
  NULLIF(BTRIM(ms."endTime"), ''),
  ms.id,
  true,
  NOW(), NOW()
FROM public."MealSlot" ms;

INSERT INTO public.item_types (
  id, name, description, "displayOrder", "isActive", "createdAt", "updatedAt", "order"
)
SELECT
  it.id::text,
  COALESCE(NULLIF(BTRIM(it.name), ''), 'Item Type ' || it.id::text),
  NULL,
  COALESCE(it."order", it.id),
  true,
  NOW(), NOW(),
  COALESCE(it."order", it.id)
FROM public."ItemType" it;

INSERT INTO public.items (
  id, "itemTypeId", name, description, photo, cost, points, "isVeg", "isActive",
  "createdAt", "updatedAt", "itemCost", point, "setupCost"
)
SELECT
  i.id::text,
  i."itemTypeId"::text,
  COALESCE(NULLIF(BTRIM(i.name), ''), 'Item ' || i.id::text),
  COALESCE(NULLIF(BTRIM(i.description), ''), 'No description'),
  NULLIF(BTRIM(i.photo), ''),
  COALESCE(public._safe_float(i."itemCost"), public._safe_float(i."setupCost"), 0),
  COALESCE(i.point, 0),
  true,
  true,
  NOW(), NOW(),
  NULLIF(BTRIM(i."itemCost"), ''),
  COALESCE(i.point, 0),
  NULLIF(BTRIM(i."setupCost"), '')
FROM public."Item" i
JOIN public.item_types it
  ON it.id = i."itemTypeId"::text;

INSERT INTO public.template_menus (
  id, name, description, "setupCost", "ratePerPlate", category, "isActive", "createdAt", "updatedAt"
)
SELECT
  tm.id::text,
  COALESCE(NULLIF(BTRIM(tm.name), ''), 'Template Menu ' || tm.id::text),
  NULL,
  public._safe_float(tm."setupCost"),
  public._safe_float(tm."ratePerPlate"),
  NULL,
  true,
  NOW(), NOW()
FROM public."TemplateMenu" tm;

INSERT INTO public.template_menu_items (
  id, "templateMenuId", "itemId", quantity, "createdAt"
)
SELECT
  'tmi-' || tmi."templateMenuId"::text || '-' || tmi."itemId"::text,
  tmi."templateMenuId"::text,
  tmi."itemId"::text,
  1,
  NOW()
FROM public."TemplateMenuItem" tmi
JOIN public.template_menus tm
  ON tm.id = tmi."templateMenuId"::text
JOIN public.items i
  ON i.id = tmi."itemId"::text;

CREATE TEMP TABLE _migration_meta AS
SELECT
  (SELECT id FROM public.users ORDER BY "createdAt" ASC LIMIT 1) AS fallback_user_id,
  (SELECT id FROM public.customers ORDER BY id ASC LIMIT 1) AS fallback_customer_id,
  (SELECT id FROM public.meal_slots ORDER BY id ASC LIMIT 1) AS fallback_meal_slot_id,
  (SELECT id FROM public.template_menus ORDER BY id ASC LIMIT 1) AS fallback_template_menu_id;

INSERT INTO public.enquiries (
  id, "customerId", "functionName", "functionType", "functionDate", "functionTime",
  "expectedGuests", "budgetPerPlate", "specialRequirements", status, "isPencilBooked",
  "pencilBookedUntil", "quotationSent", "quotationValidUntil", notes, "createdAt", "updatedAt",
  "endTime", note, "pencilBooking", quotation, "startTime", validity
)
SELECT
  e.id::text,
  COALESCE(c.id, m.fallback_customer_id),
  COALESCE(NULLIF(BTRIM(e."functionType"), ''), 'Function'),
  COALESCE(NULLIF(BTRIM(e."functionType"), ''), 'Other'),
  COALESCE(e."functionDate", e."createdAt", NOW()),
  NULLIF(BTRIM(e."startTime"), ''),
  GREATEST(COALESCE(ep.pack_count, 0), 0),
  NULL,
  NULLIF(BTRIM(e.note), ''),
  CASE
    WHEN COALESCE(e.quotation, false) THEN 'quoted'
    WHEN COALESCE(e."pencilBooking", false) THEN 'pending'
    ELSE 'pending'
  END,
  COALESCE(e."pencilBooking", false),
  e.validity,
  COALESCE(e.quotation, false),
  e.validity,
  NULLIF(BTRIM(e.note), ''),
  COALESCE(e."createdAt", NOW()),
  COALESCE(e."updatedAt", COALESCE(e."createdAt", NOW())),
  NULLIF(BTRIM(e."endTime"), ''),
  NULLIF(BTRIM(e.note), ''),
  COALESCE(e."pencilBooking", false),
  COALESCE(e.quotation, false),
  NULLIF(BTRIM(e."startTime"), ''),
  e.validity
FROM public."Enquiry" e
LEFT JOIN (
  SELECT "enquiryId", SUM(COALESCE("noOfPack", 0)) AS pack_count
  FROM public."EnquiryPack"
  GROUP BY "enquiryId"
) ep ON ep."enquiryId" = e.id
LEFT JOIN public.customers c
  ON c.id = e."customerId"::text
CROSS JOIN _migration_meta m
WHERE COALESCE(c.id, m.fallback_customer_id) IS NOT NULL;

INSERT INTO public.enquiry_halls (
  id, "enquiryId", "hallId", "createdAt"
)
SELECT DISTINCT
  'eh-' || eh."enquiryId"::text || '-' || eh."hallId"::text,
  eh."enquiryId"::text,
  eh."hallId"::text,
  NOW()
FROM public."EnquiryHall" eh
JOIN public.enquiries e
  ON e.id = eh."enquiryId"::text
JOIN public.halls h
  ON h.id = eh."hallId"::text;

INSERT INTO public.enquiry_packs (
  id, "enquiryId", "mealSlotId", "templateMenuId", "packCount", "timeSlot", notes, "createdAt"
)
SELECT
  ep.id::text,
  ep."enquiryId"::text,
  COALESCE(ms.id, m.fallback_meal_slot_id),
  COALESCE(tm.id, m.fallback_template_menu_id),
  GREATEST(COALESCE(ep."noOfPack", 0), 0),
  NULLIF(BTRIM(ep."timeSlot"), ''),
  NULL,
  COALESCE(ep."createdAt", NOW())
FROM public."EnquiryPack" ep
JOIN public.enquiries e
  ON e.id = ep."enquiryId"::text
LEFT JOIN public.meal_slots ms
  ON ms.id = ep."mealSlotId"::text
LEFT JOIN public.template_menus tm
  ON tm.id = ep."templateMenuId"::text
CROSS JOIN _migration_meta m
WHERE COALESCE(ms.id, m.fallback_meal_slot_id) IS NOT NULL
  AND COALESCE(tm.id, m.fallback_template_menu_id) IS NOT NULL;

INSERT INTO public.bookings (
  id, "customerId", "secondCustomerId", "referredById", "functionName", "functionType",
  "functionDate", "functionTime", "expectedGuests", "confirmedGuests", "totalAmount",
  "discountAmount", "discountPercentage", "taxAmount", "grandTotal", "advanceReceived",
  "balanceAmount", status, "isQuotation", "isLatest", "previousBookingId", "versionNumber",
  notes, "internalNotes", "createdAt", "updatedAt", "advanceRequired", "discountAmount2nd",
  "discountPercentage2nd", "dueAmount", "endTime", "finalAmount", "paymentReceivedAmount",
  "paymentReceivedPercent", priority, quotation, rating, "secondPriority", "secondRating",
  "startTime", "totalBillAmount"
)
SELECT
  b.id::text,
  COALESCE(c.id, m.fallback_customer_id),
  c2.id,
  cr.id,
  COALESCE(NULLIF(BTRIM(b."functionType"), ''), 'Function'),
  COALESCE(NULLIF(BTRIM(b."functionType"), ''), 'Other'),
  COALESCE(b."functionDate", b."createdAt", NOW()),
  COALESCE(NULLIF(BTRIM(b."startTime"), ''), NULLIF(BTRIM(b."endTime"), ''), '00:00'),
  GREATEST(COALESCE(pg.guests, 0), 0),
  NULL,
  COALESCE(public._safe_float(b."finalAmount"), public._safe_float(b."grandTotal"), public._safe_float(b."totalBillAmount"), 0),
  public._safe_float(b."discountAmount"),
  public._safe_float(b."discountPercentage"),
  0,
  public._safe_float(b."grandTotal"),
  public._safe_float(b."paymentReceivedAmount"),
  public._safe_float(b."dueAmount"),
  CASE WHEN COALESCE(b.quotation, false) THEN 'pending' ELSE 'confirmed' END,
  COALESCE(b.quotation, false),
  COALESCE(b."isLatest", true),
  NULL,
  1,
  NULLIF(BTRIM(b.note), ''),
  NULL,
  COALESCE(b."createdAt", NOW()),
  COALESCE(b."updatedAt", COALESCE(b."createdAt", NOW())),
  NULLIF(BTRIM(b."advanceRequired"), ''),
  NULLIF(BTRIM(b."discountAmount2nd"), ''),
  NULLIF(BTRIM(b."discountPercentage2nd"), ''),
  NULLIF(BTRIM(b."dueAmount"), ''),
  NULLIF(BTRIM(b."endTime"), ''),
  NULLIF(BTRIM(b."finalAmount"), ''),
  NULLIF(BTRIM(b."paymentReceivedAmount"), ''),
  NULLIF(BTRIM(b."paymentReceivedPercent"), ''),
  b.priority,
  COALESCE(b.quotation, false),
  COALESCE(b.rating, 0),
  b."secondPriority",
  COALESCE(b."secondRating", 0),
  NULLIF(BTRIM(b."startTime"), ''),
  NULLIF(BTRIM(b."totalBillAmount"), '')
FROM public."Booking" b
LEFT JOIN (
  SELECT "bookingId", SUM(COALESCE("noOfPack", 0)) AS guests
  FROM public."BookingPack"
  GROUP BY "bookingId"
) pg ON pg."bookingId" = b.id
LEFT JOIN public.customers c
  ON c.id = b."customerId"::text
LEFT JOIN public.customers c2
  ON c2.id = b."secondCustomerId"::text
LEFT JOIN public.customers cr
  ON cr.id = b."referredById"::text
CROSS JOIN _migration_meta m
WHERE COALESCE(c.id, m.fallback_customer_id) IS NOT NULL;

UPDATE public.bookings nb
SET "previousBookingId" = src."previousBookingId"::text
FROM public."Booking" src
WHERE nb.id = src.id::text
  AND src."previousBookingId" IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.bookings pb WHERE pb.id = src."previousBookingId"::text
  );

INSERT INTO public.booking_halls (
  id, "bookingId", "hallId", charges, "createdAt"
)
SELECT DISTINCT
  'bh-' || bh."bookingId"::text || '-' || bh."hallId"::text,
  bh."bookingId"::text,
  bh."hallId"::text,
  0,
  NOW()
FROM public."BookingHall" bh
JOIN public.bookings b
  ON b.id = bh."bookingId"::text
JOIN public.halls h
  ON h.id = bh."hallId"::text;

INSERT INTO public.booking_menus (
  id, name, description, "mealSlotId", "setupCost", "ratePerPlate", "createdAt", "updatedAt"
)
SELECT
  bm.id::text,
  COALESCE(NULLIF(BTRIM(bm.name), ''), 'Menu ' || bm.id::text),
  NULL,
  ms.id,
  public._safe_float(bm."setupCost"),
  public._safe_float(bm."ratePerPlate"),
  COALESCE(bm."createdAt", NOW()),
  COALESCE(bm."updatedAt", COALESCE(bm."createdAt", NOW()))
FROM public."BookingMenu" bm
LEFT JOIN public.meal_slots ms
  ON ms.id = bm."mealSlotId"::text;

INSERT INTO public.booking_menu_items (
  id, "bookingMenuId", "itemId", quantity, "createdAt"
)
SELECT DISTINCT
  'bmi-' || bmi."bookingMenuId"::text || '-' || bmi."itemId"::text,
  bmi."bookingMenuId"::text,
  bmi."itemId"::text,
  1,
  NOW()
FROM public."BookingMenuItems" bmi
JOIN public.booking_menus bm
  ON bm.id = bmi."bookingMenuId"::text
JOIN public.items i
  ON i.id = bmi."itemId"::text;

INSERT INTO public.booking_packs (
  id, "bookingId", "mealSlotId", "bookingMenuId", "packName", "packCount", "hallName",
  "ratePerPlate", "setupCost", "extraCharges", "timeSlot", tags, notes, "createdAt", "updatedAt",
  "boardToRead", "endTime", "extraAmount", "extraPlate", "extraRate", "hallIds", "hallRate",
  "menuPoint", "noOfPack", "startTime"
)
SELECT
  bp.id::text,
  bp."bookingId"::text,
  COALESCE(ms.id, m.fallback_meal_slot_id),
  bp."bookingMenuId"::text,
  COALESCE(NULLIF(BTRIM(bm.name), ''), 'Pack ' || bp.id::text),
  GREATEST(COALESCE(bp."noOfPack", 0), 0),
  NULL,
  public._safe_float(bp."ratePerPlate"),
  public._safe_float(bp."setupCost"),
  0,
  NULLIF(BTRIM(bp."timeSlot"), ''),
  COALESCE(bp.tags, ARRAY[]::text[]),
  NULL,
  COALESCE(bp."createdAt", NOW()),
  COALESCE(bp."createdAt", NOW()),
  NULLIF(BTRIM(bp."boardToRead"), ''),
  NULLIF(BTRIM(bp."endTime"), ''),
  NULLIF(BTRIM(bp."extraAmount"), ''),
  bp."extraPlate",
  NULLIF(BTRIM(bp."extraRate"), ''),
  COALESCE(bp."hallIds", ARRAY[]::integer[]),
  NULLIF(BTRIM(bp."hallRate"), ''),
  bp."menuPoint",
  bp."noOfPack",
  NULLIF(BTRIM(bp."startTime"), '')
FROM public."BookingPack" bp
JOIN public.bookings b
  ON b.id = bp."bookingId"::text
JOIN public.booking_menus bm
  ON bm.id = bp."bookingMenuId"::text
LEFT JOIN public.meal_slots ms
  ON ms.id = bp."mealSlotId"::text
CROSS JOIN _migration_meta m
WHERE COALESCE(ms.id, m.fallback_meal_slot_id) IS NOT NULL;

INSERT INTO public.additional_booking_items (
  id, "bookingId", description, charges, quantity, notes, "createdAt", "updatedAt"
)
SELECT
  abi.id::text,
  abi."bookingId"::text,
  COALESCE(NULLIF(BTRIM(abi.description), ''), 'Additional item'),
  public._safe_float(abi.charges),
  1,
  NULL,
  NOW(), NOW()
FROM public."AdditionalBookingItems" abi
JOIN public.bookings b
  ON b.id = abi."bookingId"::text;

INSERT INTO public.booking_payments (
  id, "bookingId", "receivedBy", amount, method, reference, narration,
  "paymentDate", "createdAt", "updatedAt", "paymentMethod"
)
SELECT
  bp.id::text,
  bp."bookingId"::text,
  COALESCE(u.id, m.fallback_user_id),
  public._safe_float(bp.amount),
  COALESCE(NULLIF(LOWER(BTRIM(bp."paymentMethod")), ''), 'cash'),
  NULL,
  NULLIF(BTRIM(bp.narration), ''),
  COALESCE(bp."paymentDate", bp."createdAt", NOW()),
  COALESCE(bp."createdAt", NOW()),
  COALESCE(bp."updatedAt", COALESCE(bp."createdAt", NOW())),
  NULLIF(BTRIM(bp."paymentMethod"), '')
FROM public."BookingPayments" bp
JOIN public.bookings b
  ON b.id = bp."bookingId"::text
LEFT JOIN public.users u
  ON u.id = bp."receivedById"::text
CROSS JOIN _migration_meta m
WHERE COALESCE(u.id, m.fallback_user_id) IS NOT NULL;

INSERT INTO public.finalized_bookings (
  id, "bookingId", data, "finalizedAt", "createdAt"
)
SELECT
  fb.id::text,
  fb."bookingId"::text,
  fb.data,
  COALESCE(fb."finalizedAt", NOW()),
  COALESCE(fb."finalizedAt", NOW())
FROM public."FinalizedBooking" fb
JOIN public.bookings b
  ON b.id = fb."bookingId"::text;

INSERT INTO public.finalized_quotations (
  id, "bookingId", "quotationData", "finalizedBy", "finalizedAt", "createdAt"
)
SELECT
  fq.id::text,
  fq."bookingId"::text,
  fq."quotationData",
  COALESCE(u.id, m.fallback_user_id),
  COALESCE(fq."finalizedAt", fq."createdAt", NOW()),
  COALESCE(fq."createdAt", NOW())
FROM public."FinalizedQuotation" fq
JOIN public.bookings b
  ON b.id = fq."bookingId"::text
LEFT JOIN public.users u
  ON u.id = fq."finalizedBy"::text
CROSS JOIN _migration_meta m
WHERE COALESCE(u.id, m.fallback_user_id) IS NOT NULL;

DROP FUNCTION IF EXISTS public._safe_float(text);

COMMIT;
