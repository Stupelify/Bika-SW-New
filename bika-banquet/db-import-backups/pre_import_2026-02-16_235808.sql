--
-- PostgreSQL database dump
--

\restrict nphVYXaXtksAtRfEbhj5ky9SbWjQIifTxUWVmah00JHSPaWduTV1mGhamsstmJU

-- Dumped from database version 15.16
-- Dumped by pg_dump version 15.16

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: additional_booking_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.additional_booking_items (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    description text NOT NULL,
    charges double precision NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: banquets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banquets (
    id text NOT NULL,
    name text NOT NULL,
    location text NOT NULL,
    address text,
    city text,
    state text,
    pincode text,
    phone text,
    email text,
    facilities text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: booking_halls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_halls (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "hallId" text NOT NULL,
    charges double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booking_menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_menu_items (
    id text NOT NULL,
    "bookingMenuId" text NOT NULL,
    "itemId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: booking_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_menus (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "mealSlotId" text,
    "setupCost" double precision DEFAULT 0 NOT NULL,
    "ratePerPlate" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: booking_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_packs (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "mealSlotId" text NOT NULL,
    "bookingMenuId" text NOT NULL,
    "packName" text NOT NULL,
    "packCount" integer NOT NULL,
    "hallName" text,
    "ratePerPlate" double precision NOT NULL,
    "setupCost" double precision DEFAULT 0 NOT NULL,
    "extraCharges" double precision DEFAULT 0 NOT NULL,
    "timeSlot" text,
    tags text[] DEFAULT ARRAY[]::text[],
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "boardToRead" text,
    "endTime" text,
    "extraAmount" text,
    "extraPlate" integer,
    "extraRate" text,
    "hallIds" integer[] DEFAULT ARRAY[]::integer[],
    "hallRate" text,
    "menuPoint" integer,
    "noOfPack" integer,
    "startTime" text
);


--
-- Name: booking_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.booking_payments (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "receivedBy" text NOT NULL,
    amount double precision NOT NULL,
    method text NOT NULL,
    reference text,
    narration text,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "paymentMethod" text
);


--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "secondCustomerId" text,
    "referredById" text,
    "functionName" text NOT NULL,
    "functionType" text NOT NULL,
    "functionDate" timestamp(3) without time zone NOT NULL,
    "functionTime" text NOT NULL,
    "expectedGuests" integer NOT NULL,
    "confirmedGuests" integer,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "discountAmount" double precision DEFAULT 0 NOT NULL,
    "discountPercentage" double precision DEFAULT 0 NOT NULL,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "grandTotal" double precision DEFAULT 0 NOT NULL,
    "advanceReceived" double precision DEFAULT 0 NOT NULL,
    "balanceAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    "isQuotation" boolean DEFAULT false NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "previousBookingId" text,
    "versionNumber" integer DEFAULT 1 NOT NULL,
    notes text,
    "internalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "advanceRequired" text,
    "discountAmount2nd" text,
    "discountPercentage2nd" text,
    "dueAmount" text,
    "endTime" text,
    "finalAmount" text,
    "paymentReceivedAmount" text,
    "paymentReceivedPercent" text,
    priority integer,
    quotation boolean DEFAULT false,
    rating integer DEFAULT 0,
    "secondPriority" integer,
    "secondRating" integer DEFAULT 0,
    "startTime" text,
    "totalBillAmount" text
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    email text,
    "alternatePhone" text,
    address text,
    city text,
    state text,
    pincode text,
    "dateOfBirth" timestamp(3) without time zone,
    anniversary timestamp(3) without time zone,
    occupation text,
    "companyName" text,
    "gstNumber" text,
    "panNumber" text,
    "aadharNumber" text,
    "whatsappNumber" text,
    "instagramHandle" text,
    "facebookProfile" text,
    "otpCode" text,
    "otpExpiry" timestamp(3) without time zone,
    "isVerified" boolean DEFAULT false NOT NULL,
    "referredById" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "alterPhone" text,
    "alterPhoneCountryCode" text,
    caste text,
    country text DEFAULT 'India'::text,
    linkedin text,
    "otpExpiresAt" timestamp(3) without time zone,
    "phoneCountryCode" text,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    priority integer,
    rating text DEFAULT '0'::text,
    street1 text,
    street2 text,
    twitter text,
    "visitCount" integer DEFAULT 0 NOT NULL,
    whatsapp text,
    "whatsappCountryCode" text
);


--
-- Name: enquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiries (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "functionName" text NOT NULL,
    "functionType" text NOT NULL,
    "functionDate" timestamp(3) without time zone NOT NULL,
    "functionTime" text,
    "expectedGuests" integer NOT NULL,
    "budgetPerPlate" double precision,
    "specialRequirements" text,
    status text DEFAULT 'pending'::text NOT NULL,
    "isPencilBooked" boolean DEFAULT false NOT NULL,
    "pencilBookedUntil" timestamp(3) without time zone,
    "quotationSent" boolean DEFAULT false NOT NULL,
    "quotationValidUntil" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "endTime" text,
    note text,
    "pencilBooking" boolean DEFAULT false NOT NULL,
    quotation boolean DEFAULT false NOT NULL,
    "startTime" text,
    validity timestamp(3) without time zone
);


--
-- Name: enquiry_halls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiry_halls (
    id text NOT NULL,
    "enquiryId" text NOT NULL,
    "hallId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: enquiry_packs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enquiry_packs (
    id text NOT NULL,
    "enquiryId" text NOT NULL,
    "mealSlotId" text NOT NULL,
    "templateMenuId" text NOT NULL,
    "packCount" integer NOT NULL,
    "timeSlot" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: finalized_bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finalized_bookings (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    data jsonb NOT NULL,
    "finalizedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: finalized_quotations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finalized_quotations (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "quotationData" jsonb NOT NULL,
    "finalizedBy" text NOT NULL,
    "finalizedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: halls; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.halls (
    id text NOT NULL,
    name text NOT NULL,
    "banquetId" text,
    capacity integer NOT NULL,
    "floatingCapacity" integer,
    area double precision,
    "floorNumber" integer,
    amenities text,
    description text,
    "basePrice" double precision,
    images text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    location text,
    "order" integer,
    photo text,
    rate text
);


--
-- Name: item_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_types (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id text NOT NULL,
    "itemTypeId" text NOT NULL,
    name text NOT NULL,
    description text,
    photo text,
    cost double precision DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    "isVeg" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "itemCost" text,
    point integer,
    "setupCost" text
);


--
-- Name: meal_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.meal_slots (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: template_menu_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_menu_items (
    id text NOT NULL,
    "templateMenuId" text NOT NULL,
    "itemId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: template_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_menus (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "setupCost" double precision DEFAULT 0 NOT NULL,
    "ratePerPlate" double precision DEFAULT 0 NOT NULL,
    category text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    "isVerified" boolean DEFAULT false NOT NULL,
    "verificationToken" text,
    "resetToken" text,
    "resetTokenExpiry" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: additional_booking_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.additional_booking_items (id, "bookingId", description, charges, quantity, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: banquets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.banquets (id, name, location, address, city, state, pincode, phone, email, facilities, description, "isActive", "createdAt", "updatedAt") FROM stdin;
98175807-ba18-4400-99d2-9ab363d3ba40	Bika Grand Banquet	Downtown	123 Main Street	Mumbai	Maharashtra	400001	+91 22 1234 5678	\N	\N	\N	t	2026-02-17 04:30:17.184	2026-02-17 04:30:17.184
9c209772-4d0f-45ca-b47d-3473c16d8c78	Smoke Banquet 1771305768060	Test Zone	\N	\N	\N	\N	\N	\N	\N	\N	t	2026-02-17 05:22:48.088	2026-02-17 05:22:48.088
\.


--
-- Data for Name: booking_halls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_halls (id, "bookingId", "hallId", charges, "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_menu_items (id, "bookingMenuId", "itemId", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_menus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_menus (id, name, description, "mealSlotId", "setupCost", "ratePerPlate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: booking_packs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_packs (id, "bookingId", "mealSlotId", "bookingMenuId", "packName", "packCount", "hallName", "ratePerPlate", "setupCost", "extraCharges", "timeSlot", tags, notes, "createdAt", "updatedAt", "boardToRead", "endTime", "extraAmount", "extraPlate", "extraRate", "hallIds", "hallRate", "menuPoint", "noOfPack", "startTime") FROM stdin;
\.


--
-- Data for Name: booking_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.booking_payments (id, "bookingId", "receivedBy", amount, method, reference, narration, "paymentDate", "createdAt", "updatedAt", "paymentMethod") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bookings (id, "customerId", "secondCustomerId", "referredById", "functionName", "functionType", "functionDate", "functionTime", "expectedGuests", "confirmedGuests", "totalAmount", "discountAmount", "discountPercentage", "taxAmount", "grandTotal", "advanceReceived", "balanceAmount", status, "isQuotation", "isLatest", "previousBookingId", "versionNumber", notes, "internalNotes", "createdAt", "updatedAt", "advanceRequired", "discountAmount2nd", "discountPercentage2nd", "dueAmount", "endTime", "finalAmount", "paymentReceivedAmount", "paymentReceivedPercent", priority, quotation, rating, "secondPriority", "secondRating", "startTime", "totalBillAmount") FROM stdin;
a7f2e3d5-3181-4b0d-994f-6ee5e78b063f	02ff09c4-b42f-447a-8a7a-f48f919c7b1a	\N	\N	UI Booking 1771306487551	Wedding	2026-02-17 00:00:00	19:00	150	\N	0	0	0	0	0	0	0	confirmed	f	t	\N	1	\N	\N	2026-02-17 05:34:47.565	2026-02-17 05:34:47.568	\N	\N	\N	0	\N	0	\N	\N	\N	f	0	\N	0	\N	0
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customers (id, name, phone, email, "alternatePhone", address, city, state, pincode, "dateOfBirth", anniversary, occupation, "companyName", "gstNumber", "panNumber", "aadharNumber", "whatsappNumber", "instagramHandle", "facebookProfile", "otpCode", "otpExpiry", "isVerified", "referredById", notes, "createdAt", "updatedAt", "alterPhone", "alterPhoneCountryCode", caste, country, linkedin, "otpExpiresAt", "phoneCountryCode", "phoneVerified", priority, rating, street1, street2, twitter, "visitCount", whatsapp, "whatsappCountryCode") FROM stdin;
02ff09c4-b42f-447a-8a7a-f48f919c7b1a	Harshit Goyal	+16088962290	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N	\N	2026-02-17 04:47:25.368	2026-02-17 04:47:25.368	\N	\N	\N	India	\N	\N	\N	f	\N	0	\N	\N	\N	0	\N	\N
\.


--
-- Data for Name: enquiries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enquiries (id, "customerId", "functionName", "functionType", "functionDate", "functionTime", "expectedGuests", "budgetPerPlate", "specialRequirements", status, "isPencilBooked", "pencilBookedUntil", "quotationSent", "quotationValidUntil", notes, "createdAt", "updatedAt", "endTime", note, "pencilBooking", quotation, "startTime", validity) FROM stdin;
8cae491e-6b26-40df-a220-d9a6fa47d88d	02ff09c4-b42f-447a-8a7a-f48f919c7b1a	Smoke Enquiry 1771305768060	Wedding	2026-02-17 05:22:48.134	\N	180	\N	\N	pending	f	\N	t	\N	\N	2026-02-17 05:22:48.141	2026-02-17 05:22:48.141	\N	\N	f	t	\N	\N
\.


--
-- Data for Name: enquiry_halls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enquiry_halls (id, "enquiryId", "hallId", "createdAt") FROM stdin;
\.


--
-- Data for Name: enquiry_packs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enquiry_packs (id, "enquiryId", "mealSlotId", "templateMenuId", "packCount", "timeSlot", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: finalized_bookings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finalized_bookings (id, "bookingId", data, "finalizedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: finalized_quotations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.finalized_quotations (id, "bookingId", "quotationData", "finalizedBy", "finalizedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: halls; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.halls (id, name, "banquetId", capacity, "floatingCapacity", area, "floorNumber", amenities, description, "basePrice", images, "isActive", "createdAt", "updatedAt", location, "order", photo, rate) FROM stdin;
499b21ad-811c-424b-8eaa-71e1b514ce50	Grand Hall	98175807-ba18-4400-99d2-9ab363d3ba40	500	600	5000	\N	\N	\N	50000	\N	t	2026-02-17 04:30:17.188	2026-02-17 04:30:17.188	\N	\N	\N	\N
4f55fb2e-c552-4db6-bcd9-fd0193ad08e2	Smoke Hall 1771305768060	9c209772-4d0f-45ca-b47d-3473c16d8c78	250	\N	\N	\N	\N	\N	\N	{}	t	2026-02-17 05:22:48.099	2026-02-17 05:22:48.099	\N	\N	\N	\N
\.


--
-- Data for Name: item_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_types (id, name, description, "displayOrder", "isActive", "createdAt", "updatedAt", "order") FROM stdin;
3688883a-2bff-44c7-afa1-124620660131	Starters	\N	0	t	2026-02-17 04:30:17.17	2026-02-17 04:30:17.17	0
5b80db82-40e2-43c7-ac2e-a5b740315655	Main Course	\N	0	t	2026-02-17 04:30:17.178	2026-02-17 04:30:17.178	0
7a2916c1-a191-4844-9651-cfde17cf5a16	Breads	\N	0	t	2026-02-17 04:30:17.179	2026-02-17 04:30:17.179	0
4a73eca0-38c5-4084-adb7-ceacc721ddc0	Rice	\N	0	t	2026-02-17 04:30:17.18	2026-02-17 04:30:17.18	0
8e13cbe2-5c65-4cde-9238-8c5f955b1945	Desserts	\N	0	t	2026-02-17 04:30:17.18	2026-02-17 04:30:17.18	0
59ed8b25-ea2a-458a-bbe9-abcded499b35	Beverages	\N	0	t	2026-02-17 04:30:17.181	2026-02-17 04:30:17.181	0
93ff7358-2317-4669-a839-37e21c9c47ba	Smoke Type 1771305768060	\N	0	t	2026-02-17 05:22:48.103	2026-02-17 05:22:48.103	0
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, "itemTypeId", name, description, photo, cost, points, "isVeg", "isActive", "createdAt", "updatedAt", "itemCost", point, "setupCost") FROM stdin;
2c68f6ec-98b8-405d-8888-ddac22927bc7	93ff7358-2317-4669-a839-37e21c9c47ba	Smoke Item 1771305768060	\N	\N	120	0	t	t	2026-02-17 05:22:48.109	2026-02-17 05:22:48.109	\N	\N	\N
\.


--
-- Data for Name: meal_slots; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.meal_slots (id, name, description, "startTime", "endTime", "displayOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
3258e807-5658-48e6-80c0-aaca40031ee3	Breakfast	\N	08:00	11:00	0	t	2026-02-17 04:30:17.166	2026-02-17 04:30:17.166
42308b2d-f828-47a7-9fc8-512cc4191ba4	Lunch	\N	12:00	15:00	0	t	2026-02-17 04:30:17.168	2026-02-17 04:30:17.168
cb0d0a71-cff8-4b81-8648-54e1e0a20f7e	Hi-Tea	\N	16:00	18:00	0	t	2026-02-17 04:30:17.169	2026-02-17 04:30:17.169
4dde4bf2-f3aa-4b0c-93bc-8ade5638595b	Dinner	\N	19:00	23:00	0	t	2026-02-17 04:30:17.169	2026-02-17 04:30:17.169
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, description, "createdAt") FROM stdin;
a3e52aea-985e-4f76-963a-986bb44a4bdf	view_dashboard	View dashboard	2026-02-17 04:30:16.999
43857095-c7cb-42fa-bedf-2384d62cdc2f	manage_customers	Manage customers	2026-02-17 04:30:17.01
0f5cffbe-ea2d-4784-ba4d-1d11b4563a19	delete_customer	Delete customers	2026-02-17 04:30:17.011
441c0c49-69b9-45a2-a8e5-cee75dc1d197	manage_enquiries	Manage enquiries	2026-02-17 04:30:17.013
4e105190-bd56-41e0-b5f2-f852978b341f	manage_bookings	Manage bookings	2026-02-17 04:30:17.015
ec0e652d-99c0-4496-a0ba-924e3e2b3f9a	cancel_booking	Cancel bookings	2026-02-17 04:30:17.016
3bafeeee-1ac6-4a2f-9706-a18cd61233c9	manage_payments	Manage payments	2026-02-17 04:30:17.016
85f954d7-c900-49f3-9fc2-2ebf21efd4e7	manage_halls	Manage halls and banquets	2026-02-17 04:30:17.018
d3fc9bc8-af99-43d1-8c7d-e784ceeed7fd	manage_menu	Manage menus and items	2026-02-17 04:30:17.019
68b6fae0-e447-4103-81f0-1e67276498f1	manage_users	Manage users	2026-02-17 04:30:17.02
7648ee3b-b6f0-4a81-b43f-b7ed817f4750	manage_roles	Manage roles and permissions	2026-02-17 04:30:17.021
fcc2c146-539f-4a72-a407-e07bb389f207	view_reports	View analytics and reports	2026-02-17 04:30:17.022
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (id, "roleId", "permissionId", "createdAt") FROM stdin;
0045e380-8703-4615-bac6-c44e04c6c5f2	9ac844c0-a25c-4289-8124-366b23f1ca62	a3e52aea-985e-4f76-963a-986bb44a4bdf	2026-02-17 04:30:17.027
1361f70e-738b-4dd3-bac4-b22f56659e90	9ac844c0-a25c-4289-8124-366b23f1ca62	43857095-c7cb-42fa-bedf-2384d62cdc2f	2026-02-17 04:30:17.033
311d9936-0e91-438f-946f-d7049447617d	9ac844c0-a25c-4289-8124-366b23f1ca62	0f5cffbe-ea2d-4784-ba4d-1d11b4563a19	2026-02-17 04:30:17.036
32649af1-140a-4684-81b7-1a4e9030e972	9ac844c0-a25c-4289-8124-366b23f1ca62	441c0c49-69b9-45a2-a8e5-cee75dc1d197	2026-02-17 04:30:17.039
95f62a64-4feb-42ca-bfc3-e3c3004bca48	9ac844c0-a25c-4289-8124-366b23f1ca62	4e105190-bd56-41e0-b5f2-f852978b341f	2026-02-17 04:30:17.039
8d4eb684-36bd-4d6b-83ad-68c304cfbea4	9ac844c0-a25c-4289-8124-366b23f1ca62	ec0e652d-99c0-4496-a0ba-924e3e2b3f9a	2026-02-17 04:30:17.04
855e7192-8369-4b21-aaa6-f854efa7b6c8	9ac844c0-a25c-4289-8124-366b23f1ca62	3bafeeee-1ac6-4a2f-9706-a18cd61233c9	2026-02-17 04:30:17.042
19d9c8c7-a5ca-40bd-8458-74a63f56e2d4	9ac844c0-a25c-4289-8124-366b23f1ca62	85f954d7-c900-49f3-9fc2-2ebf21efd4e7	2026-02-17 04:30:17.044
f877350b-3fac-428a-bef6-9af506e7d1d9	9ac844c0-a25c-4289-8124-366b23f1ca62	d3fc9bc8-af99-43d1-8c7d-e784ceeed7fd	2026-02-17 04:30:17.045
fc5711b3-731e-4d0f-b413-41ccefd941d4	9ac844c0-a25c-4289-8124-366b23f1ca62	68b6fae0-e447-4103-81f0-1e67276498f1	2026-02-17 04:30:17.046
f52de3fb-7c01-41ef-8986-a052d5cc8251	9ac844c0-a25c-4289-8124-366b23f1ca62	7648ee3b-b6f0-4a81-b43f-b7ed817f4750	2026-02-17 04:30:17.047
b539e1ec-878e-4392-a0b3-810869573427	9ac844c0-a25c-4289-8124-366b23f1ca62	fcc2c146-539f-4a72-a407-e07bb389f207	2026-02-17 04:30:17.048
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, "createdAt", "updatedAt") FROM stdin;
9ac844c0-a25c-4289-8124-366b23f1ca62	Admin	Full system access	2026-02-17 04:30:17.023	2026-02-17 04:30:17.023
2a76491c-b322-4643-83a0-bd55183a6771	Manager	Booking and operations management	2026-02-17 04:30:17.025	2026-02-17 04:30:17.025
6633d6bc-6ebc-42e0-a540-0e240388f7ad	Sales	Customer and enquiry management	2026-02-17 04:30:17.025	2026-02-17 04:30:17.025
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
95fd6cc4-a0fb-4ca4-97e0-262ca502a1e5	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMjY0MiwiZXhwIjoxNzcxOTA3NDQyfQ.zVyrpk9mFQXuprAEGq9IJ19-xogVD77nGvMooBts7uc	2026-02-24 04:30:42.078	2026-02-17 04:30:42.08
a02eb3b3-54d6-40e0-adc3-63b63a124e21	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMjkzNiwiZXhwIjoxNzcxOTA3NzM2fQ.0tNbE_kj0ZNH3cc3uzoWjgqZlwsjcQTxG1DOqQ7vymI	2026-02-24 04:35:36.657	2026-02-17 04:35:36.658
f652222c-48c6-4a86-b0f8-969686d3ef4e	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMzMwNCwiZXhwIjoxNzcxOTA4MTA0fQ.vpljmJpVlcPs2qAx5RcNj-7dHGcf9JW5NR9VLgZf_k0	2026-02-24 04:41:44.377	2026-02-17 04:41:44.378
e18cb847-9bac-4a9f-a0b5-781b78c8be99	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMzMxMywiZXhwIjoxNzcxOTA4MTEzfQ.anJzSnPGgqYqhe1Ix97LmOCp3spgZgYVreqE_vvADYQ	2026-02-24 04:41:53.591	2026-02-17 04:41:53.592
1cbcf5c3-f47b-431c-8061-87731b8beff5	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMzMyOCwiZXhwIjoxNzcxOTA4MTI4fQ.uItMB1BsuUUQdU2TRhi1YWBSHmTpr8vpzo8axkDRnNo	2026-02-24 04:42:08.153	2026-02-17 04:42:08.154
5a3b4c96-4eb5-4584-95d8-ad5b522a5622	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMzQ2MSwiZXhwIjoxNzcxOTA4MjYxfQ.G3DK42iuNIXX4sfcI23vgc7ZRow0G4A2a2Ru_F2c15s	2026-02-24 04:44:21.603	2026-02-17 04:44:21.603
c48dd39e-ef48-47c6-aaea-97d4ff3ebb5e	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwMzYzNiwiZXhwIjoxNzcxOTA4NDM2fQ.RD6Z7XAm2IDVafRmyidGfKhKV8w2gIUB7r-KYyEhq8U	2026-02-24 04:47:16.389	2026-02-17 04:47:16.39
6576bedc-cf7c-4a1d-b2f9-6399206a87ac	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTY3OSwiZXhwIjoxNzcxOTEwNDc5fQ.Yp1a6xwNULUMUT7tPTdGbspJXDfK0LRFU_6zsVNQW2s	2026-02-24 05:21:19.193	2026-02-17 05:21:19.194
481f7e16-71f6-4ef5-9bd9-ca5ac6eef652	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTY4OSwiZXhwIjoxNzcxOTEwNDg5fQ.7tcG67cs33FHgSf8sIzXqWIxQQsNUYjLSl8C6Jzc2s0	2026-02-24 05:21:29.123	2026-02-17 05:21:29.124
3fed28a4-f338-448d-8109-c60429e1893c	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTc0MiwiZXhwIjoxNzcxOTEwNTQyLCJqdGkiOiIzZDQ1NTA5NC04ODE2LTQzYmYtYTIyMy1mNjc0NDQ5OGNhYTUifQ.EczgmYIxnmzbquL8ks1CsZchd_yPMJzqeAlyI3wNkMg	2026-02-24 05:22:22.747	2026-02-17 05:22:22.749
20dbc692-b170-40ce-8acf-0eb7ecf3c02f	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTc0MiwiZXhwIjoxNzcxOTEwNTQyLCJqdGkiOiI3NzY0ZGI5MS0zNDZiLTRlZWQtYjI0Zi02ZWNjZTU2ODVhZDIifQ.sbFW6VW4HG_WQfC_bm0xEAZezZwbCFcgszyc5bAVCBg	2026-02-24 05:22:22.749	2026-02-17 05:22:22.749
4a36d32e-271a-456e-846e-bc2e70f39694	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTc0MiwiZXhwIjoxNzcxOTEwNTQyLCJqdGkiOiI2ZGFmMmVkZS02ZWJiLTRjYTItYjhlYS1mOGIyYWU3OTdhZDAifQ.9HdEqDW12ibdljLsxuir9m0v3HJhp-7Y9rCkTTD-Wjs	2026-02-24 05:22:22.856	2026-02-17 05:22:22.857
50195b61-1fc1-433f-be07-f8e8d849cb28	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTc0MiwiZXhwIjoxNzcxOTEwNTQyLCJqdGkiOiJlNTM5OGRhOC04MTVmLTRjYjEtYTNjMS02MmQxNDJlNjdlNGUifQ.abbJOLXjrBV8N_maCZFQ_8G5HB2q93cWddUuujrRsJQ	2026-02-24 05:22:22.951	2026-02-17 05:22:22.953
cf98ac5d-270f-4255-af11-501d3fcb928f	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNTc2OCwiZXhwIjoxNzcxOTEwNTY4LCJqdGkiOiIzNDFhY2M1YS0yZmIwLTQ0NGUtYWExOC1hYmEyN2Q3MGRmMDIifQ.h1IFaAGAJFRNo8GI1yKeS5XC5NXyNb6waKelc38PA2I	2026-02-24 05:22:48.047	2026-02-17 05:22:48.049
56315bcd-1b37-4116-92cf-cae0e92658f6	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNjI4MSwiZXhwIjoxNzcxOTExMDgxLCJqdGkiOiJjMmQ5N2EyYS1iZTk5LTRjNWMtYTJiMi1lN2QyMzk3MTYzYmUifQ._OW4uBP3TbBYXkhfssSeBVw7ZokvTP-IAl7ytyg82Ak	2026-02-24 05:31:21.245	2026-02-17 05:31:21.246
2e1c462a-6121-4ab6-a586-767a837702c8	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNjQ4NywiZXhwIjoxNzcxOTExMjg3LCJqdGkiOiJiYWMyMzc0Mi00YjQ4LTQ4ZmYtYWY1My0zNTMxMzdmOThhNzIifQ.fMWfPUPWidDcMPR4ItvxWIV6hyi3T15MpghpJl0OXmk	2026-02-24 05:34:47.482	2026-02-17 05:34:47.483
507b7008-ff9c-4bd7-bf95-d16aa610e1f1	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNjUxMywiZXhwIjoxNzcxOTExMzEzLCJqdGkiOiJiOGMxZWU1MS0xODZmLTRlNmEtOTk0MC00MzM3MzMyMjE5MTEifQ.ImltrX-TXLyZN2wizX334k2OhTYenz5PFiWdmDUk4DU	2026-02-24 05:35:13.76	2026-02-17 05:35:13.761
ff15c9b0-3965-4407-97a2-5b3d3427a2db	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNzA1OCwiZXhwIjoxNzcxOTExODU4LCJqdGkiOiIyMmEyYmZkNi1kYzNiLTQxYTYtOGZmYy05MmY5YmY1MTRhZmQifQ.0iApgBNdsVn9CjIYQhvwXRxK0pUSDkxWVLpaUjzYhRk	2026-02-24 05:44:18.518	2026-02-17 05:44:18.52
ef695793-eb93-4bfe-af81-d122063e7da5	92959316-136a-4e5b-a9c9-579705fbf4b5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5Mjk1OTMxNi0xMzZhLTRlNWItYTljOS01Nzk3MDVmYmY0YjUiLCJlbWFpbCI6ImFkbWluQGJpa2FiYW5xdWV0LmNvbSIsInJvbGVzIjpbIkFkbWluIl0sImlhdCI6MTc3MTMwNzU2MSwiZXhwIjoxNzcxOTEyMzYxLCJqdGkiOiI5MDA1ODRkNS1lY2Y0LTRhNmMtODJmOS05YjA1YmRlYjE2ZGEifQ.VIAHoMefVmx9XljNRIxCgK6QmxU2al3M5Sc0udH9CUw	2026-02-24 05:52:41.889	2026-02-17 05:52:41.891
\.


--
-- Data for Name: template_menu_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.template_menu_items (id, "templateMenuId", "itemId", quantity, "createdAt") FROM stdin;
6f3321aa-cf55-4bdf-92d4-25ab1e669594	88e6d77d-1e06-4928-80a3-52a2083727dc	2c68f6ec-98b8-405d-8888-ddac22927bc7	1	2026-02-17 05:22:48.123
\.


--
-- Data for Name: template_menus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.template_menus (id, name, description, "setupCost", "ratePerPlate", category, "isActive", "createdAt", "updatedAt") FROM stdin;
88e6d77d-1e06-4928-80a3-52a2083727dc	Smoke Menu 1771305768060	\N	0	500	\N	t	2026-02-17 05:22:48.121	2026-02-17 05:22:48.121
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (id, "userId", "roleId", "createdAt") FROM stdin;
a71dad79-0a54-4fc3-902e-60cad32a322e	92959316-136a-4e5b-a9c9-579705fbf4b5	9ac844c0-a25c-4289-8124-366b23f1ca62	2026-02-17 04:30:17.163
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, password, name, "isVerified", "verificationToken", "resetToken", "resetTokenExpiry", "createdAt", "updatedAt") FROM stdin;
92959316-136a-4e5b-a9c9-579705fbf4b5	admin@bikabanquet.com	$2a$10$QPHyv2X9vSWr837U9.vWRelo/E5vmUEgey/UuA7JCbg8eO8iWRpTW	Admin User	t	\N	\N	\N	2026-02-17 04:30:17.159	2026-02-17 04:30:17.159
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: additional_booking_items additional_booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.additional_booking_items
    ADD CONSTRAINT additional_booking_items_pkey PRIMARY KEY (id);


--
-- Name: banquets banquets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banquets
    ADD CONSTRAINT banquets_pkey PRIMARY KEY (id);


--
-- Name: booking_halls booking_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_halls
    ADD CONSTRAINT booking_halls_pkey PRIMARY KEY (id);


--
-- Name: booking_menu_items booking_menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_menu_items
    ADD CONSTRAINT booking_menu_items_pkey PRIMARY KEY (id);


--
-- Name: booking_menus booking_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_menus
    ADD CONSTRAINT booking_menus_pkey PRIMARY KEY (id);


--
-- Name: booking_packs booking_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT booking_packs_pkey PRIMARY KEY (id);


--
-- Name: booking_payments booking_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT booking_payments_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);


--
-- Name: enquiry_halls enquiry_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_halls
    ADD CONSTRAINT enquiry_halls_pkey PRIMARY KEY (id);


--
-- Name: enquiry_packs enquiry_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT enquiry_packs_pkey PRIMARY KEY (id);


--
-- Name: finalized_bookings finalized_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finalized_bookings
    ADD CONSTRAINT finalized_bookings_pkey PRIMARY KEY (id);


--
-- Name: finalized_quotations finalized_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finalized_quotations
    ADD CONSTRAINT finalized_quotations_pkey PRIMARY KEY (id);


--
-- Name: halls halls_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.halls
    ADD CONSTRAINT halls_pkey PRIMARY KEY (id);


--
-- Name: item_types item_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_types
    ADD CONSTRAINT item_types_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: meal_slots meal_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.meal_slots
    ADD CONSTRAINT meal_slots_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: template_menu_items template_menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_menu_items
    ADD CONSTRAINT template_menu_items_pkey PRIMARY KEY (id);


--
-- Name: template_menus template_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_menus
    ADD CONSTRAINT template_menus_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: additional_booking_items_bookingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "additional_booking_items_bookingId_idx" ON public.additional_booking_items USING btree ("bookingId");


--
-- Name: banquets_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX banquets_name_key ON public.banquets USING btree (name);


--
-- Name: booking_halls_bookingId_hallId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "booking_halls_bookingId_hallId_key" ON public.booking_halls USING btree ("bookingId", "hallId");


--
-- Name: booking_halls_bookingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_halls_bookingId_idx" ON public.booking_halls USING btree ("bookingId");


--
-- Name: booking_halls_hallId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_halls_hallId_idx" ON public.booking_halls USING btree ("hallId");


--
-- Name: booking_menu_items_bookingMenuId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_menu_items_bookingMenuId_idx" ON public.booking_menu_items USING btree ("bookingMenuId");


--
-- Name: booking_menu_items_bookingMenuId_itemId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "booking_menu_items_bookingMenuId_itemId_key" ON public.booking_menu_items USING btree ("bookingMenuId", "itemId");


--
-- Name: booking_menu_items_itemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_menu_items_itemId_idx" ON public.booking_menu_items USING btree ("itemId");


--
-- Name: booking_packs_bookingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_packs_bookingId_idx" ON public.booking_packs USING btree ("bookingId");


--
-- Name: booking_packs_bookingMenuId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "booking_packs_bookingMenuId_key" ON public.booking_packs USING btree ("bookingMenuId");


--
-- Name: booking_payments_bookingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_payments_bookingId_idx" ON public.booking_payments USING btree ("bookingId");


--
-- Name: booking_payments_paymentDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "booking_payments_paymentDate_idx" ON public.booking_payments USING btree ("paymentDate");


--
-- Name: bookings_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bookings_customerId_idx" ON public.bookings USING btree ("customerId");


--
-- Name: bookings_functionDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bookings_functionDate_idx" ON public.bookings USING btree ("functionDate");


--
-- Name: bookings_isLatest_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "bookings_isLatest_idx" ON public.bookings USING btree ("isLatest");


--
-- Name: bookings_previousBookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "bookings_previousBookingId_key" ON public.bookings USING btree ("previousBookingId");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: customers_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_email_idx ON public.customers USING btree (email);


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: customers_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);


--
-- Name: customers_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX customers_phone_key ON public.customers USING btree (phone);


--
-- Name: customers_referredById_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "customers_referredById_idx" ON public.customers USING btree ("referredById");


--
-- Name: enquiries_customerId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enquiries_customerId_idx" ON public.enquiries USING btree ("customerId");


--
-- Name: enquiries_functionDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enquiries_functionDate_idx" ON public.enquiries USING btree ("functionDate");


--
-- Name: enquiries_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX enquiries_status_idx ON public.enquiries USING btree (status);


--
-- Name: enquiry_halls_enquiryId_hallId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "enquiry_halls_enquiryId_hallId_key" ON public.enquiry_halls USING btree ("enquiryId", "hallId");


--
-- Name: enquiry_halls_enquiryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enquiry_halls_enquiryId_idx" ON public.enquiry_halls USING btree ("enquiryId");


--
-- Name: enquiry_halls_hallId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enquiry_halls_hallId_idx" ON public.enquiry_halls USING btree ("hallId");


--
-- Name: enquiry_packs_enquiryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "enquiry_packs_enquiryId_idx" ON public.enquiry_packs USING btree ("enquiryId");


--
-- Name: finalized_bookings_bookingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "finalized_bookings_bookingId_key" ON public.finalized_bookings USING btree ("bookingId");


--
-- Name: finalized_quotations_bookingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "finalized_quotations_bookingId_idx" ON public.finalized_quotations USING btree ("bookingId");


--
-- Name: finalized_quotations_finalizedAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "finalized_quotations_finalizedAt_idx" ON public.finalized_quotations USING btree ("finalizedAt");


--
-- Name: halls_banquetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "halls_banquetId_idx" ON public.halls USING btree ("banquetId");


--
-- Name: halls_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX halls_name_key ON public.halls USING btree (name);


--
-- Name: item_types_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX item_types_name_key ON public.item_types USING btree (name);


--
-- Name: items_itemTypeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "items_itemTypeId_idx" ON public.items USING btree ("itemTypeId");


--
-- Name: meal_slots_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX meal_slots_name_key ON public.meal_slots USING btree (name);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: role_permissions_permissionId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "role_permissions_permissionId_idx" ON public.role_permissions USING btree ("permissionId");


--
-- Name: role_permissions_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "role_permissions_roleId_idx" ON public.role_permissions USING btree ("roleId");


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: template_menu_items_itemId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "template_menu_items_itemId_idx" ON public.template_menu_items USING btree ("itemId");


--
-- Name: template_menu_items_templateMenuId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "template_menu_items_templateMenuId_idx" ON public.template_menu_items USING btree ("templateMenuId");


--
-- Name: template_menu_items_templateMenuId_itemId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "template_menu_items_templateMenuId_itemId_key" ON public.template_menu_items USING btree ("templateMenuId", "itemId");


--
-- Name: template_menus_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX template_menus_name_key ON public.template_menus USING btree (name);


--
-- Name: user_roles_roleId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_roles_roleId_idx" ON public.user_roles USING btree ("roleId");


--
-- Name: user_roles_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "user_roles_userId_idx" ON public.user_roles USING btree ("userId");


--
-- Name: user_roles_userId_roleId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON public.user_roles USING btree ("userId", "roleId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: additional_booking_items additional_booking_items_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.additional_booking_items
    ADD CONSTRAINT "additional_booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_halls booking_halls_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_halls
    ADD CONSTRAINT "booking_halls_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_halls booking_halls_hallId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_halls
    ADD CONSTRAINT "booking_halls_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES public.halls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_menu_items booking_menu_items_bookingMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_menu_items
    ADD CONSTRAINT "booking_menu_items_bookingMenuId_fkey" FOREIGN KEY ("bookingMenuId") REFERENCES public.booking_menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_menu_items booking_menu_items_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_menu_items
    ADD CONSTRAINT "booking_menu_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_menus booking_menus_mealSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_menus
    ADD CONSTRAINT "booking_menus_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES public.meal_slots(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booking_packs booking_packs_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT "booking_packs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_packs booking_packs_bookingMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT "booking_packs_bookingMenuId_fkey" FOREIGN KEY ("bookingMenuId") REFERENCES public.booking_menus(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_packs booking_packs_mealSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT "booking_packs_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES public.meal_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_payments booking_payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT "booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_payments booking_payments_receivedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT "booking_payments_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_previousBookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_previousBookingId_fkey" FOREIGN KEY ("previousBookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookings bookings_secondCustomerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_secondCustomerId_fkey" FOREIGN KEY ("secondCustomerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_referredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enquiries enquiries_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT "enquiries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enquiry_halls enquiry_halls_enquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_halls
    ADD CONSTRAINT "enquiry_halls_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES public.enquiries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enquiry_halls enquiry_halls_hallId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_halls
    ADD CONSTRAINT "enquiry_halls_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES public.halls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enquiry_packs enquiry_packs_enquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT "enquiry_packs_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES public.enquiries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enquiry_packs enquiry_packs_mealSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT "enquiry_packs_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES public.meal_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enquiry_packs enquiry_packs_templateMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT "enquiry_packs_templateMenuId_fkey" FOREIGN KEY ("templateMenuId") REFERENCES public.template_menus(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: finalized_bookings finalized_bookings_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finalized_bookings
    ADD CONSTRAINT "finalized_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: finalized_quotations finalized_quotations_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finalized_quotations
    ADD CONSTRAINT "finalized_quotations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: finalized_quotations finalized_quotations_finalizedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finalized_quotations
    ADD CONSTRAINT "finalized_quotations_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: halls halls_banquetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.halls
    ADD CONSTRAINT "halls_banquetId_fkey" FOREIGN KEY ("banquetId") REFERENCES public.banquets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_itemTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT "items_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES public.item_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_menu_items template_menu_items_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_menu_items
    ADD CONSTRAINT "template_menu_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: template_menu_items template_menu_items_templateMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_menu_items
    ADD CONSTRAINT "template_menu_items_templateMenuId_fkey" FOREIGN KEY ("templateMenuId") REFERENCES public.template_menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict nphVYXaXtksAtRfEbhj5ky9SbWjQIifTxUWVmah00JHSPaWduTV1mGhamsstmJU

