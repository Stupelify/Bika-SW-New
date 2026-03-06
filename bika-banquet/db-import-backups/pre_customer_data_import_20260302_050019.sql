--
-- PostgreSQL database dump
--

\restrict L0PS2tSjtgunX7efevUDqGTC99ZoIYaTeRbOYbowTsbTe6CSTcVv3e2wvOBj44s

-- Dumped from database version 15.17
-- Dumped by pg_dump version 15.17

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
-- Name: additional_booking_items; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.additional_booking_items OWNER TO postgres;

--
-- Name: banquets; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.banquets OWNER TO postgres;

--
-- Name: booking_halls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_halls (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "hallId" text NOT NULL,
    charges double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.booking_halls OWNER TO postgres;

--
-- Name: booking_menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_menu_items (
    id text NOT NULL,
    "bookingMenuId" text NOT NULL,
    "itemId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.booking_menu_items OWNER TO postgres;

--
-- Name: booking_menus; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.booking_menus OWNER TO postgres;

--
-- Name: booking_packs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_packs (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "mealSlotId" text NOT NULL,
    "bookingMenuId" text NOT NULL,
    "noOfPack" integer,
    "packName" text NOT NULL,
    "packCount" integer NOT NULL,
    "hallIds" integer[] DEFAULT ARRAY[]::integer[],
    "hallName" text,
    "ratePerPlate" double precision NOT NULL,
    "setupCost" double precision DEFAULT 0 NOT NULL,
    "startTime" text,
    "endTime" text,
    "extraPlate" integer,
    "extraRate" text,
    "extraAmount" text,
    "menuPoint" integer,
    "hallRate" text,
    "boardToRead" text,
    "extraCharges" double precision DEFAULT 0 NOT NULL,
    "timeSlot" text,
    tags text[] DEFAULT ARRAY[]::text[],
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.booking_packs OWNER TO postgres;

--
-- Name: booking_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.booking_payments (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "receivedBy" text NOT NULL,
    amount double precision NOT NULL,
    method text NOT NULL,
    "paymentMethod" text,
    reference text,
    narration text,
    "paymentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.booking_payments OWNER TO postgres;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "secondCustomerId" text,
    "referredById" text,
    rating integer DEFAULT 0,
    "secondRating" integer DEFAULT 0,
    priority integer,
    "secondPriority" integer,
    "functionName" text NOT NULL,
    "functionType" text NOT NULL,
    "functionDate" timestamp(3) without time zone NOT NULL,
    "functionTime" text NOT NULL,
    "startTime" text,
    "endTime" text,
    "expectedGuests" integer NOT NULL,
    "confirmedGuests" integer,
    "totalAmount" double precision DEFAULT 0 NOT NULL,
    "totalBillAmount" text,
    "finalAmount" text,
    "discountAmount" double precision DEFAULT 0 NOT NULL,
    "discountPercentage" double precision DEFAULT 0 NOT NULL,
    "discountAmount2nd" text,
    "discountPercentage2nd" text,
    "taxAmount" double precision DEFAULT 0 NOT NULL,
    "grandTotal" double precision DEFAULT 0 NOT NULL,
    "advanceReceived" double precision DEFAULT 0 NOT NULL,
    "advanceRequired" text,
    "paymentReceivedPercent" text,
    "paymentReceivedAmount" text,
    "dueAmount" text,
    "balanceAmount" double precision DEFAULT 0 NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    quotation boolean DEFAULT false,
    "isQuotation" boolean DEFAULT false NOT NULL,
    "isLatest" boolean DEFAULT true NOT NULL,
    "previousBookingId" text,
    "versionNumber" integer DEFAULT 1 NOT NULL,
    notes text,
    "internalNotes" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    phone text NOT NULL,
    "phoneCountryCode" text,
    "phoneVerified" boolean DEFAULT false NOT NULL,
    email text,
    "alterPhone" text,
    "alternatePhone" text,
    "alterPhoneCountryCode" text,
    whatsapp text,
    address text,
    country text DEFAULT 'India'::text,
    street1 text,
    street2 text,
    city text,
    state text,
    pincode text,
    priority integer,
    caste text,
    rating text DEFAULT '0'::text,
    "visitCount" integer DEFAULT 0 NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    anniversary timestamp(3) without time zone,
    occupation text,
    "companyName" text,
    "gstNumber" text,
    "panNumber" text,
    "aadharNumber" text,
    "whatsappNumber" text,
    "whatsappCountryCode" text,
    "instagramHandle" text,
    twitter text,
    linkedin text,
    "facebookProfile" text,
    "otpCode" text,
    "otpExpiry" timestamp(3) without time zone,
    "otpExpiresAt" timestamp(3) without time zone,
    "isVerified" boolean DEFAULT false NOT NULL,
    "referredById" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- Name: enquiries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enquiries (
    id text NOT NULL,
    "customerId" text NOT NULL,
    "functionName" text NOT NULL,
    "functionType" text NOT NULL,
    "functionDate" timestamp(3) without time zone NOT NULL,
    "functionTime" text,
    "startTime" text,
    "endTime" text,
    "expectedGuests" integer NOT NULL,
    "budgetPerPlate" double precision,
    "specialRequirements" text,
    quotation boolean DEFAULT false NOT NULL,
    "pencilBooking" boolean DEFAULT false NOT NULL,
    validity timestamp(3) without time zone,
    note text,
    status text DEFAULT 'pending'::text NOT NULL,
    "isPencilBooked" boolean DEFAULT false NOT NULL,
    "pencilBookedUntil" timestamp(3) without time zone,
    "quotationSent" boolean DEFAULT false NOT NULL,
    "quotationValidUntil" timestamp(3) without time zone,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.enquiries OWNER TO postgres;

--
-- Name: enquiry_halls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enquiry_halls (
    id text NOT NULL,
    "enquiryId" text NOT NULL,
    "hallId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.enquiry_halls OWNER TO postgres;

--
-- Name: enquiry_packs; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.enquiry_packs OWNER TO postgres;

--
-- Name: finalized_bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finalized_bookings (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    data jsonb NOT NULL,
    "finalizedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.finalized_bookings OWNER TO postgres;

--
-- Name: finalized_quotations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.finalized_quotations (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "quotationData" jsonb NOT NULL,
    "finalizedBy" text NOT NULL,
    "finalizedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.finalized_quotations OWNER TO postgres;

--
-- Name: halls; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.halls (
    id text NOT NULL,
    name text NOT NULL,
    "banquetId" text,
    location text,
    rate text,
    capacity integer NOT NULL,
    "floatingCapacity" integer,
    area double precision,
    photo text,
    "order" integer,
    "floorNumber" integer,
    amenities text,
    description text,
    "basePrice" double precision,
    images text[],
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.halls OWNER TO postgres;

--
-- Name: item_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.item_types (
    id text NOT NULL,
    name text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    description text,
    "displayOrder" integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.item_types OWNER TO postgres;

--
-- Name: items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.items (
    id text NOT NULL,
    "itemTypeId" text NOT NULL,
    name text NOT NULL,
    description text,
    photo text,
    "setupCost" text,
    "itemCost" text,
    point integer,
    cost double precision DEFAULT 0 NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    "isVeg" boolean DEFAULT true NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.items OWNER TO postgres;

--
-- Name: meal_slots; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.meal_slots OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    id text NOT NULL,
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "userId" text NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: template_menu_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.template_menu_items (
    id text NOT NULL,
    "templateMenuId" text NOT NULL,
    "itemId" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.template_menu_items OWNER TO postgres;

--
-- Name: template_menus; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.template_menus OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id text NOT NULL,
    "userId" text NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
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


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: additional_booking_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.additional_booking_items (id, "bookingId", description, charges, quantity, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: banquets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.banquets (id, name, location, address, city, state, pincode, phone, email, facilities, description, "isActive", "createdAt", "updatedAt") FROM stdin;
84eed600-da48-44be-8cf2-0bbe2f8cf72b	Bika Grand Banquet	Downtown	123 Main Street	Mumbai	Maharashtra	400001	+91 22 1234 5678	\N	\N	\N	t	2026-03-02 04:57:39.16	2026-03-02 04:57:39.16
\.


--
-- Data for Name: booking_halls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_halls (id, "bookingId", "hallId", charges, "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_menu_items (id, "bookingMenuId", "itemId", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: booking_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_menus (id, name, description, "mealSlotId", "setupCost", "ratePerPlate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: booking_packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_packs (id, "bookingId", "mealSlotId", "bookingMenuId", "noOfPack", "packName", "packCount", "hallIds", "hallName", "ratePerPlate", "setupCost", "startTime", "endTime", "extraPlate", "extraRate", "extraAmount", "menuPoint", "hallRate", "boardToRead", "extraCharges", "timeSlot", tags, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: booking_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.booking_payments (id, "bookingId", "receivedBy", amount, method, "paymentMethod", reference, narration, "paymentDate", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bookings (id, "customerId", "secondCustomerId", "referredById", rating, "secondRating", priority, "secondPriority", "functionName", "functionType", "functionDate", "functionTime", "startTime", "endTime", "expectedGuests", "confirmedGuests", "totalAmount", "totalBillAmount", "finalAmount", "discountAmount", "discountPercentage", "discountAmount2nd", "discountPercentage2nd", "taxAmount", "grandTotal", "advanceReceived", "advanceRequired", "paymentReceivedPercent", "paymentReceivedAmount", "dueAmount", "balanceAmount", status, quotation, "isQuotation", "isLatest", "previousBookingId", "versionNumber", notes, "internalNotes", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, phone, "phoneCountryCode", "phoneVerified", email, "alterPhone", "alternatePhone", "alterPhoneCountryCode", whatsapp, address, country, street1, street2, city, state, pincode, priority, caste, rating, "visitCount", "dateOfBirth", anniversary, occupation, "companyName", "gstNumber", "panNumber", "aadharNumber", "whatsappNumber", "whatsappCountryCode", "instagramHandle", twitter, linkedin, "facebookProfile", "otpCode", "otpExpiry", "otpExpiresAt", "isVerified", "referredById", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: enquiries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enquiries (id, "customerId", "functionName", "functionType", "functionDate", "functionTime", "startTime", "endTime", "expectedGuests", "budgetPerPlate", "specialRequirements", quotation, "pencilBooking", validity, note, status, "isPencilBooked", "pencilBookedUntil", "quotationSent", "quotationValidUntil", notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: enquiry_halls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enquiry_halls (id, "enquiryId", "hallId", "createdAt") FROM stdin;
\.


--
-- Data for Name: enquiry_packs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enquiry_packs (id, "enquiryId", "mealSlotId", "templateMenuId", "packCount", "timeSlot", notes, "createdAt") FROM stdin;
\.


--
-- Data for Name: finalized_bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finalized_bookings (id, "bookingId", data, "finalizedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: finalized_quotations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.finalized_quotations (id, "bookingId", "quotationData", "finalizedBy", "finalizedAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: halls; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.halls (id, name, "banquetId", location, rate, capacity, "floatingCapacity", area, photo, "order", "floorNumber", amenities, description, "basePrice", images, "isActive", "createdAt", "updatedAt") FROM stdin;
373c4554-0ebe-4026-bc13-eda7f35df5d8	Grand Hall	84eed600-da48-44be-8cf2-0bbe2f8cf72b	\N	\N	500	600	5000	\N	\N	\N	\N	\N	50000	\N	t	2026-03-02 04:57:39.163	2026-03-02 04:57:39.163
\.


--
-- Data for Name: item_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.item_types (id, name, "order", description, "displayOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
0dcd1d72-56e6-4d32-82e9-c3632bb64363	Starters	0	\N	0	t	2026-03-02 04:57:39.149	2026-03-02 04:57:39.149
cdc70d1a-fc5e-455f-87c4-956e728c1650	Main Course	0	\N	0	t	2026-03-02 04:57:39.151	2026-03-02 04:57:39.151
1bf2c8be-84da-41f5-b1dc-c500c75d37e6	Breads	0	\N	0	t	2026-03-02 04:57:39.153	2026-03-02 04:57:39.153
7929c940-80d1-465f-a250-43450577f2ea	Rice	0	\N	0	t	2026-03-02 04:57:39.155	2026-03-02 04:57:39.155
632a0523-bb82-4fb1-846a-75efdb721cb5	Desserts	0	\N	0	t	2026-03-02 04:57:39.156	2026-03-02 04:57:39.156
0ba00e2c-8ef2-4361-a15b-eda2e3482428	Beverages	0	\N	0	t	2026-03-02 04:57:39.158	2026-03-02 04:57:39.158
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.items (id, "itemTypeId", name, description, photo, "setupCost", "itemCost", point, cost, points, "isVeg", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: meal_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.meal_slots (id, name, description, "startTime", "endTime", "displayOrder", "isActive", "createdAt", "updatedAt") FROM stdin;
dbfb9c89-3f70-4a99-9b51-79ce7d8a2c52	Breakfast	\N	08:00	11:00	0	t	2026-03-02 04:57:39.138	2026-03-02 04:57:39.138
81da47a3-3202-4673-b4d4-723b707295e9	Lunch	\N	12:00	15:00	0	t	2026-03-02 04:57:39.141	2026-03-02 04:57:39.141
80546995-7354-4c73-b00a-f043be8a50e1	Hi-Tea	\N	16:00	18:00	0	t	2026-03-02 04:57:39.144	2026-03-02 04:57:39.144
56656104-2994-4358-8ad9-e90808703cfe	Dinner	\N	19:00	23:00	0	t	2026-03-02 04:57:39.145	2026-03-02 04:57:39.145
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.permissions (id, name, description, "createdAt") FROM stdin;
83a4b982-cd47-440e-b9f4-7d14d9aa23bd	view_dashboard	View dashboard	2026-03-02 04:57:38.782
1bf0bee6-7e19-4fbe-a6a7-02b502597ce2	view_reports	View analytics and reports	2026-03-02 04:57:38.788
57794fa7-bc37-40e1-8195-174c20318e0d	view_calendar	View calendar	2026-03-02 04:57:38.789
78e80ebd-ba5e-4478-b8e7-ff30ac64eb0d	add_user	Add users	2026-03-02 04:57:38.791
7e785277-e2e3-4cfe-9fc3-e9fc742bdcbf	view_user	View users	2026-03-02 04:57:38.793
66e473ce-e3e7-4e32-978f-13c4a063d5fa	edit_user	Edit users	2026-03-02 04:57:38.795
3088d8e7-03ea-40b5-9337-091df67f736d	delete_user	Delete users	2026-03-02 04:57:38.796
d24f25fd-e394-4379-bbc4-21f76219b618	add_customer	Add customers	2026-03-02 04:57:38.798
d7d61f63-4b64-4c1e-b62e-781ff8cc9d94	view_customer	View customers	2026-03-02 04:57:38.799
e7194963-b8df-4962-ba34-01df0eb31f21	edit_customer	Edit customers	2026-03-02 04:57:38.801
d543e7c9-d67c-4915-8b30-fb1497c6ccf8	delete_customer	Delete customers	2026-03-02 04:57:38.802
4c9c86fe-4198-401a-99d2-3fe39cd9a4e2	assign_role	Assign roles	2026-03-02 04:57:38.804
f478c25d-ac1d-4f4b-ab19-1bd213b6250d	add_role	Add roles	2026-03-02 04:57:38.806
801d3853-5e8a-43b5-a57c-ac8fd3a7e0ad	view_role	View roles	2026-03-02 04:57:38.808
94c7aca6-18db-4206-9e2a-c8157a13ff43	edit_role	Edit roles	2026-03-02 04:57:38.814
66b72361-02c0-4a74-96a6-bcfe4eb11fc4	delete_role	Delete roles	2026-03-02 04:57:38.819
bd4b5470-8da8-40dc-835d-b00e49f32f38	manage_permission	Manage permissions	2026-03-02 04:57:38.822
604633bf-70f9-485f-80e3-935266dc4254	add_permission	Add permissions	2026-03-02 04:57:38.825
b6527518-4d26-40a5-9bef-4442c9272247	view_permission	View permissions	2026-03-02 04:57:38.827
2f5fada0-88c5-4369-8a4a-08991fe862fa	edit_permission	Edit permissions	2026-03-02 04:57:38.829
befc0009-6925-4bb6-a056-1b9b10a181c8	delete_permission	Delete permissions	2026-03-02 04:57:38.831
fc8f5352-ac4a-4adf-a552-718017ed163d	add_item	Add items	2026-03-02 04:57:38.833
6b5e4217-0f39-4bac-9ff8-4e2684565eaa	view_item	View items	2026-03-02 04:57:38.835
c757acc5-5561-412c-bdba-19bf79272947	edit_item	Edit items	2026-03-02 04:57:38.837
5f223e9d-5c17-4d3d-89c1-d36b5ce14985	delete_item	Delete items	2026-03-02 04:57:38.838
8bbbb018-3e03-4367-9236-e2172320e54d	add_itemtype	Add item types	2026-03-02 04:57:38.84
b5d24570-886d-4225-b29e-507e4ca9ccda	view_itemtype	View item types	2026-03-02 04:57:38.842
853fe3bb-f88a-403b-b1f0-0d7f2922db3c	edit_itemtype	Edit item types	2026-03-02 04:57:38.845
9394daa7-ff1b-4055-81c9-f9af0590355a	delete_itemtype	Delete item types	2026-03-02 04:57:38.847
d5474dae-70df-48f0-a530-be257586d2a0	add_hall	Add halls	2026-03-02 04:57:38.848
f2e1c2cc-6d5a-4f0c-a2f5-6ab52ec59a44	view_hall	View halls	2026-03-02 04:57:38.85
4189d096-02d9-4592-ab1a-20308624b74f	edit_hall	Edit halls	2026-03-02 04:57:38.851
c4b31fd1-dbe8-48c7-8808-4a62e66bc506	delete_hall	Delete halls	2026-03-02 04:57:38.853
7d426883-5929-4d2d-9be4-730eb7cb6ea4	add_banquet	Add banquets	2026-03-02 04:57:38.869
b1c13445-e8b3-4ade-82f0-7f784725713a	view_banquet	View banquets	2026-03-02 04:57:38.87
34f795b2-a352-4c9a-b480-ebeb520b7e7f	edit_banquet	Edit banquets	2026-03-02 04:57:38.872
ce04485e-e7a9-49a3-ab08-53b98223c0e5	delete_banquet	Delete banquets	2026-03-02 04:57:38.875
2da131c7-b759-4486-aae1-9c110e465085	add_booking	Add bookings	2026-03-02 04:57:38.876
ba275310-3e03-4e4b-92d2-352afe68e5bd	view_booking	View bookings	2026-03-02 04:57:38.878
14b26c13-ddaa-4ba5-8d33-a55d72471e9c	edit_booking	Edit bookings	2026-03-02 04:57:38.879
c12139a1-ff9a-44cf-9dd5-2c4df84a2508	delete_booking	Delete bookings	2026-03-02 04:57:38.88
ba0b198e-909e-4f2e-85a0-8632218f2c9e	add_enquiry	Add enquiries	2026-03-02 04:57:38.882
77f65bac-ab5e-4736-ab0a-da8a088265cf	view_enquiry	View enquiries	2026-03-02 04:57:38.884
41bf422c-6748-4411-beb6-10be160851aa	edit_enquiry	Edit enquiries	2026-03-02 04:57:38.885
d824fa71-9a2b-49b4-8eda-fec50cb1e4c6	delete_enquiry	Delete enquiries	2026-03-02 04:57:38.887
38a87403-e3d1-4195-9427-4d72ec20e287	send_templatemenu	Send template menu	2026-03-02 04:57:38.89
5b48038c-ec89-4f15-87a7-ffb2d54826d1	download_templatemenu	Download template menu	2026-03-02 04:57:38.891
e687f490-5b00-4d4a-b2e0-5577623e99b1	add_templatemenu	Add template menu	2026-03-02 04:57:38.893
108e949a-cabd-4988-a32b-f4ac689e8965	view_templatemenu	View template menu	2026-03-02 04:57:38.894
14ffb477-0432-46fc-89ab-b8dbed2ff478	edit_templatemenu	Edit template menu	2026-03-02 04:57:38.896
61e0f978-67a8-4841-bac6-97d000c112d8	delete_templatemenu	Delete template menu	2026-03-02 04:57:38.897
bba773e9-faeb-40e0-90a8-13b4db9efd69	manage_payments	Manage payments	2026-03-02 04:57:38.899
c3ba717c-315e-47a1-a0b2-320ddc437193	manage_enquiries	Manage enquiries	2026-03-02 04:57:38.9
5410f326-f656-4cb0-a59b-9e72f0fa2591	manage_bookings	Manage bookings	2026-03-02 04:57:38.901
29d4462e-a771-487f-a3c3-0f762b7b66c0	manage_customers	Manage customers	2026-03-02 04:57:38.903
712e1845-8b5b-42a9-886a-d766496ccc51	manage_users	Manage users	2026-03-02 04:57:38.904
7efbcecd-c255-4467-a49a-d43d221a1af1	manage_roles	Manage roles and permissions	2026-03-02 04:57:38.905
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.role_permissions (id, "roleId", "permissionId", "createdAt") FROM stdin;
a051e35f-5a0e-4bd5-bd85-e6af65e8c3a0	305f217b-1d68-4d36-babb-e326d32bfbc7	83a4b982-cd47-440e-b9f4-7d14d9aa23bd	2026-03-02 04:57:38.916
3d45dffc-79c4-40c4-8489-5fee5c21ce25	305f217b-1d68-4d36-babb-e326d32bfbc7	1bf0bee6-7e19-4fbe-a6a7-02b502597ce2	2026-03-02 04:57:38.92
74e2082f-6ca4-44ae-90f1-694662d220da	305f217b-1d68-4d36-babb-e326d32bfbc7	57794fa7-bc37-40e1-8195-174c20318e0d	2026-03-02 04:57:38.922
b0c97d78-cfd1-4b1f-b0a0-e606794b2aeb	305f217b-1d68-4d36-babb-e326d32bfbc7	78e80ebd-ba5e-4478-b8e7-ff30ac64eb0d	2026-03-02 04:57:38.923
1b473374-3576-48f8-b7b5-ed17a97d0046	305f217b-1d68-4d36-babb-e326d32bfbc7	7e785277-e2e3-4cfe-9fc3-e9fc742bdcbf	2026-03-02 04:57:38.929
8ff7946c-bc1e-43d5-8daa-57e551eda920	305f217b-1d68-4d36-babb-e326d32bfbc7	66e473ce-e3e7-4e32-978f-13c4a063d5fa	2026-03-02 04:57:38.931
38bc6d48-144c-4c2e-a7c2-b628eb5a2618	305f217b-1d68-4d36-babb-e326d32bfbc7	3088d8e7-03ea-40b5-9337-091df67f736d	2026-03-02 04:57:38.937
94dff0fe-f0cf-4e06-a41a-ab868dfe09d9	305f217b-1d68-4d36-babb-e326d32bfbc7	d24f25fd-e394-4379-bbc4-21f76219b618	2026-03-02 04:57:38.939
73ac5c53-da28-4534-b333-44ecff0c9304	305f217b-1d68-4d36-babb-e326d32bfbc7	d7d61f63-4b64-4c1e-b62e-781ff8cc9d94	2026-03-02 04:57:38.942
447d9e49-a8f1-4d36-bc1b-783b95bb2f2f	305f217b-1d68-4d36-babb-e326d32bfbc7	e7194963-b8df-4962-ba34-01df0eb31f21	2026-03-02 04:57:38.944
a44c852c-c59e-43f5-aa78-a9b9a2f38225	305f217b-1d68-4d36-babb-e326d32bfbc7	d543e7c9-d67c-4915-8b30-fb1497c6ccf8	2026-03-02 04:57:38.946
b9d37661-5712-4dbd-841a-d46e8990a91b	305f217b-1d68-4d36-babb-e326d32bfbc7	4c9c86fe-4198-401a-99d2-3fe39cd9a4e2	2026-03-02 04:57:38.948
44a31eb9-0dcf-43bf-a2f4-7c4e71f4d452	305f217b-1d68-4d36-babb-e326d32bfbc7	f478c25d-ac1d-4f4b-ab19-1bd213b6250d	2026-03-02 04:57:38.949
f222084f-bdf7-4781-92e6-e9a138c59b4e	305f217b-1d68-4d36-babb-e326d32bfbc7	801d3853-5e8a-43b5-a57c-ac8fd3a7e0ad	2026-03-02 04:57:38.951
b1556673-8fc2-4558-a8b5-e01e361ba37f	305f217b-1d68-4d36-babb-e326d32bfbc7	94c7aca6-18db-4206-9e2a-c8157a13ff43	2026-03-02 04:57:38.952
d52c4c6d-f65a-4cac-a2ac-a70f6a52481a	305f217b-1d68-4d36-babb-e326d32bfbc7	66b72361-02c0-4a74-96a6-bcfe4eb11fc4	2026-03-02 04:57:38.954
c76fe944-c885-4209-aa70-ae5d78007b82	305f217b-1d68-4d36-babb-e326d32bfbc7	bd4b5470-8da8-40dc-835d-b00e49f32f38	2026-03-02 04:57:38.955
8d455693-da23-44a3-b388-c1cd6f90b18b	305f217b-1d68-4d36-babb-e326d32bfbc7	604633bf-70f9-485f-80e3-935266dc4254	2026-03-02 04:57:38.957
9fe7a23c-4a31-4234-b8b7-adfa298a7919	305f217b-1d68-4d36-babb-e326d32bfbc7	b6527518-4d26-40a5-9bef-4442c9272247	2026-03-02 04:57:38.958
e0aa6977-16d0-4dad-93bf-af30ed272149	305f217b-1d68-4d36-babb-e326d32bfbc7	2f5fada0-88c5-4369-8a4a-08991fe862fa	2026-03-02 04:57:38.96
57a44e09-4c00-49f0-8e5c-9d21cce1105c	305f217b-1d68-4d36-babb-e326d32bfbc7	befc0009-6925-4bb6-a056-1b9b10a181c8	2026-03-02 04:57:38.961
56b294e1-dc3f-4c9d-945d-477b84956156	305f217b-1d68-4d36-babb-e326d32bfbc7	fc8f5352-ac4a-4adf-a552-718017ed163d	2026-03-02 04:57:38.962
f80c785e-5d43-469a-a0f2-2a7fa5a1672b	305f217b-1d68-4d36-babb-e326d32bfbc7	6b5e4217-0f39-4bac-9ff8-4e2684565eaa	2026-03-02 04:57:38.964
2d2aea3d-8dbc-4d70-be37-267a80735011	305f217b-1d68-4d36-babb-e326d32bfbc7	c757acc5-5561-412c-bdba-19bf79272947	2026-03-02 04:57:38.965
861cd6da-7c7a-4635-a85f-3bce3013728c	305f217b-1d68-4d36-babb-e326d32bfbc7	5f223e9d-5c17-4d3d-89c1-d36b5ce14985	2026-03-02 04:57:38.967
c2651942-aad4-4a80-b704-f7a1a0151f72	305f217b-1d68-4d36-babb-e326d32bfbc7	8bbbb018-3e03-4367-9236-e2172320e54d	2026-03-02 04:57:38.968
42a72e12-7fa4-4b76-87ba-b738520eb221	305f217b-1d68-4d36-babb-e326d32bfbc7	b5d24570-886d-4225-b29e-507e4ca9ccda	2026-03-02 04:57:38.97
4290c9d9-bf95-45b4-9d2c-8146e23c4c01	305f217b-1d68-4d36-babb-e326d32bfbc7	853fe3bb-f88a-403b-b1f0-0d7f2922db3c	2026-03-02 04:57:38.971
19e31943-a288-4949-8374-4588206f6b5c	305f217b-1d68-4d36-babb-e326d32bfbc7	9394daa7-ff1b-4055-81c9-f9af0590355a	2026-03-02 04:57:38.973
f44199c5-4d7d-455d-9574-788f25782887	305f217b-1d68-4d36-babb-e326d32bfbc7	d5474dae-70df-48f0-a530-be257586d2a0	2026-03-02 04:57:38.975
ea2b8026-24f6-4c57-92e8-85f884904007	305f217b-1d68-4d36-babb-e326d32bfbc7	f2e1c2cc-6d5a-4f0c-a2f5-6ab52ec59a44	2026-03-02 04:57:38.977
d597f40b-69d6-45e2-b5d6-07b822deb850	305f217b-1d68-4d36-babb-e326d32bfbc7	4189d096-02d9-4592-ab1a-20308624b74f	2026-03-02 04:57:38.979
8efa646d-5de0-45a2-9a1e-0c3e4c0acc51	305f217b-1d68-4d36-babb-e326d32bfbc7	c4b31fd1-dbe8-48c7-8808-4a62e66bc506	2026-03-02 04:57:38.98
fd3fd49e-dc23-4a1c-82ec-69e77e60ca7a	305f217b-1d68-4d36-babb-e326d32bfbc7	7d426883-5929-4d2d-9be4-730eb7cb6ea4	2026-03-02 04:57:38.982
b95ee52c-916a-48a3-977c-1ddf0d0c9086	305f217b-1d68-4d36-babb-e326d32bfbc7	b1c13445-e8b3-4ade-82f0-7f784725713a	2026-03-02 04:57:38.983
784ccb0a-5877-428f-93e8-85be181f71a8	305f217b-1d68-4d36-babb-e326d32bfbc7	34f795b2-a352-4c9a-b480-ebeb520b7e7f	2026-03-02 04:57:38.984
e4dd567b-40f3-408b-b713-5d56b2636ef3	305f217b-1d68-4d36-babb-e326d32bfbc7	ce04485e-e7a9-49a3-ab08-53b98223c0e5	2026-03-02 04:57:38.986
67839598-9936-45c7-a4f6-9db25ede7500	305f217b-1d68-4d36-babb-e326d32bfbc7	2da131c7-b759-4486-aae1-9c110e465085	2026-03-02 04:57:38.987
942859e5-395e-4d5d-9aa9-9b9d57adee29	305f217b-1d68-4d36-babb-e326d32bfbc7	ba275310-3e03-4e4b-92d2-352afe68e5bd	2026-03-02 04:57:38.989
4b86d3e8-982f-4b0c-aea0-c1bb5433bfc0	305f217b-1d68-4d36-babb-e326d32bfbc7	14b26c13-ddaa-4ba5-8d33-a55d72471e9c	2026-03-02 04:57:38.99
6747b8be-f7c3-4357-947f-b70005991a3b	305f217b-1d68-4d36-babb-e326d32bfbc7	c12139a1-ff9a-44cf-9dd5-2c4df84a2508	2026-03-02 04:57:38.992
c3cdc92b-1af3-4ad9-9453-2c5fc939c1ea	305f217b-1d68-4d36-babb-e326d32bfbc7	ba0b198e-909e-4f2e-85a0-8632218f2c9e	2026-03-02 04:57:38.993
d6dcfc8e-cc39-4cf4-afa1-8fefbbfb366a	305f217b-1d68-4d36-babb-e326d32bfbc7	77f65bac-ab5e-4736-ab0a-da8a088265cf	2026-03-02 04:57:38.995
2774edfd-b4da-4bee-9acf-e88dc7b6b2e1	305f217b-1d68-4d36-babb-e326d32bfbc7	41bf422c-6748-4411-beb6-10be160851aa	2026-03-02 04:57:38.996
593329f0-e912-40e7-bf45-67a7fea0cbc8	305f217b-1d68-4d36-babb-e326d32bfbc7	d824fa71-9a2b-49b4-8eda-fec50cb1e4c6	2026-03-02 04:57:38.998
16a37725-f401-4fe5-a670-50e42b3fe7de	305f217b-1d68-4d36-babb-e326d32bfbc7	38a87403-e3d1-4195-9427-4d72ec20e287	2026-03-02 04:57:39
87990d7f-2e01-4a7d-9bbb-7909aace03d2	305f217b-1d68-4d36-babb-e326d32bfbc7	5b48038c-ec89-4f15-87a7-ffb2d54826d1	2026-03-02 04:57:39.002
50ae55ad-b1fa-4d5d-8b9b-8a35fc48b09b	305f217b-1d68-4d36-babb-e326d32bfbc7	e687f490-5b00-4d4a-b2e0-5577623e99b1	2026-03-02 04:57:39.004
538626ee-12c0-4b4c-91fd-69a5a04b9b10	305f217b-1d68-4d36-babb-e326d32bfbc7	108e949a-cabd-4988-a32b-f4ac689e8965	2026-03-02 04:57:39.006
d9ac451d-887c-4a46-a7d9-2282de921c2b	305f217b-1d68-4d36-babb-e326d32bfbc7	14ffb477-0432-46fc-89ab-b8dbed2ff478	2026-03-02 04:57:39.008
acf8fb8c-65e9-45d5-94ca-de10ccf9bb7f	305f217b-1d68-4d36-babb-e326d32bfbc7	61e0f978-67a8-4841-bac6-97d000c112d8	2026-03-02 04:57:39.011
398e0a9a-3f98-45d7-af47-ac7ed991c045	305f217b-1d68-4d36-babb-e326d32bfbc7	bba773e9-faeb-40e0-90a8-13b4db9efd69	2026-03-02 04:57:39.013
91bb8544-fef7-41d1-9cba-333a1d98f2fe	305f217b-1d68-4d36-babb-e326d32bfbc7	c3ba717c-315e-47a1-a0b2-320ddc437193	2026-03-02 04:57:39.015
be72065d-233b-4b20-b1f2-6dc9b5c06f49	305f217b-1d68-4d36-babb-e326d32bfbc7	5410f326-f656-4cb0-a59b-9e72f0fa2591	2026-03-02 04:57:39.017
3c1d5baf-4694-40cd-a820-dce350cccc3a	305f217b-1d68-4d36-babb-e326d32bfbc7	29d4462e-a771-487f-a3c3-0f762b7b66c0	2026-03-02 04:57:39.019
0c22089e-4497-4f56-954f-12ca7d0f40a8	305f217b-1d68-4d36-babb-e326d32bfbc7	712e1845-8b5b-42a9-886a-d766496ccc51	2026-03-02 04:57:39.02
4681d471-2836-474c-b5a3-f9905d411844	305f217b-1d68-4d36-babb-e326d32bfbc7	7efbcecd-c255-4467-a49a-d43d221a1af1	2026-03-02 04:57:39.022
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (id, name, description, "createdAt", "updatedAt") FROM stdin;
305f217b-1d68-4d36-babb-e326d32bfbc7	Admin	Full system access	2026-03-02 04:57:38.908	2026-03-02 04:57:38.908
452f99d7-7746-4a79-89c9-325c6d988a1a	Manager	Booking and operations management	2026-03-02 04:57:38.911	2026-03-02 04:57:38.911
f5c67b80-b651-41b6-b3bd-9fb106b1552e	Employee	Operational access	2026-03-02 04:57:38.912	2026-03-02 04:57:38.912
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, "userId", token, "expiresAt", "createdAt") FROM stdin;
0a397b52-f883-4d98-8443-5f01e076a662	admin-v2-default	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi12Mi1kZWZhdWx0IiwiZW1haWwiOiJhZG1pbkBiaWthYmFucXVldC5jb20iLCJyb2xlcyI6W10sImlhdCI6MTc3MjQyNzM4NywiZXhwIjoxNzczMDMyMTg3LCJqdGkiOiJmNjU2M2ZjYi1mNWMzLTQ4NDctOGFiNi00ZGM5YzgxNGVhOTIifQ.6vuQ4oVoSb-JIWhu9im2wFS3_IkncrKI5b5tgbDEFlE	2026-03-09 04:56:27.197	2026-03-02 04:56:27.198
0243a71c-dc31-4f88-835d-66ca35ea13b2	admin-v2-default	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi12Mi1kZWZhdWx0IiwiZW1haWwiOiJhZG1pbkBiaWthYmFucXVldC5jb20iLCJyb2xlcyI6WyJBZG1pbiJdLCJpYXQiOjE3NzI0Mjc0NjksImV4cCI6MTc3MzAzMjI2OSwianRpIjoiMTE3MGVlYzAtMjE2Zi00MThjLWIyM2UtMjNlNzI2ZjYwMzJjIn0.6VeJNLte1PHfzQs4WaFKoRcS0aUJKgfrHqRy6X6Ad14	2026-03-09 04:57:49.745	2026-03-02 04:57:49.746
61738710-303b-4a5c-8a79-3977bfa26f95	admin-v2-default	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi12Mi1kZWZhdWx0IiwiZW1haWwiOiJhZG1pbkBiaWthYmFucXVldC5jb20iLCJyb2xlcyI6WyJBZG1pbiJdLCJpYXQiOjE3NzI0Mjc0OTcsImV4cCI6MTc3MzAzMjI5NywianRpIjoiODY1NTYxZTctZTk4MS00ZmQ0LThiZDctNmY1MzA2YzU1NDlkIn0.qwVM9PXdJ2CgNtxGhP-czDOG0Mdo8SwYT6UV5H8gcrw	2026-03-09 04:58:17.901	2026-03-02 04:58:17.903
\.


--
-- Data for Name: template_menu_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_menu_items (id, "templateMenuId", "itemId", quantity, "createdAt") FROM stdin;
\.


--
-- Data for Name: template_menus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.template_menus (id, name, description, "setupCost", "ratePerPlate", category, "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_roles (id, "userId", "roleId", "createdAt") FROM stdin;
f5326f84-dcd1-47b6-bb63-201fb945c410	admin-v2-default	305f217b-1d68-4d36-babb-e326d32bfbc7	2026-03-02 04:57:39.133
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, "isVerified", "verificationToken", "resetToken", "resetTokenExpiry", "createdAt", "updatedAt") FROM stdin;
admin-v2-default	admin@bikabanquet.com	$2a$10$cp8SSJdZ.gzws31FB5vGFupzfBLrNtzbRKGuvlNsHxJB3TOaUpY5e	Admin	t	\N	\N	\N	2026-03-02 04:55:18.798	2026-03-02 04:56:21.479
\.


--
-- Name: additional_booking_items additional_booking_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.additional_booking_items
    ADD CONSTRAINT additional_booking_items_pkey PRIMARY KEY (id);


--
-- Name: banquets banquets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.banquets
    ADD CONSTRAINT banquets_pkey PRIMARY KEY (id);


--
-- Name: booking_halls booking_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_halls
    ADD CONSTRAINT booking_halls_pkey PRIMARY KEY (id);


--
-- Name: booking_menu_items booking_menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_menu_items
    ADD CONSTRAINT booking_menu_items_pkey PRIMARY KEY (id);


--
-- Name: booking_menus booking_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_menus
    ADD CONSTRAINT booking_menus_pkey PRIMARY KEY (id);


--
-- Name: booking_packs booking_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT booking_packs_pkey PRIMARY KEY (id);


--
-- Name: booking_payments booking_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT booking_payments_pkey PRIMARY KEY (id);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: enquiries enquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);


--
-- Name: enquiry_halls enquiry_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_halls
    ADD CONSTRAINT enquiry_halls_pkey PRIMARY KEY (id);


--
-- Name: enquiry_packs enquiry_packs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT enquiry_packs_pkey PRIMARY KEY (id);


--
-- Name: finalized_bookings finalized_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finalized_bookings
    ADD CONSTRAINT finalized_bookings_pkey PRIMARY KEY (id);


--
-- Name: finalized_quotations finalized_quotations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finalized_quotations
    ADD CONSTRAINT finalized_quotations_pkey PRIMARY KEY (id);


--
-- Name: halls halls_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.halls
    ADD CONSTRAINT halls_pkey PRIMARY KEY (id);


--
-- Name: item_types item_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.item_types
    ADD CONSTRAINT item_types_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: meal_slots meal_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.meal_slots
    ADD CONSTRAINT meal_slots_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: template_menu_items template_menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_menu_items
    ADD CONSTRAINT template_menu_items_pkey PRIMARY KEY (id);


--
-- Name: template_menus template_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_menus
    ADD CONSTRAINT template_menus_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: additional_booking_items_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "additional_booking_items_bookingId_idx" ON public.additional_booking_items USING btree ("bookingId");


--
-- Name: banquets_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX banquets_name_key ON public.banquets USING btree (name);


--
-- Name: booking_halls_bookingId_hallId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "booking_halls_bookingId_hallId_key" ON public.booking_halls USING btree ("bookingId", "hallId");


--
-- Name: booking_halls_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_halls_bookingId_idx" ON public.booking_halls USING btree ("bookingId");


--
-- Name: booking_halls_hallId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_halls_hallId_idx" ON public.booking_halls USING btree ("hallId");


--
-- Name: booking_menu_items_bookingMenuId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_menu_items_bookingMenuId_idx" ON public.booking_menu_items USING btree ("bookingMenuId");


--
-- Name: booking_menu_items_bookingMenuId_itemId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "booking_menu_items_bookingMenuId_itemId_key" ON public.booking_menu_items USING btree ("bookingMenuId", "itemId");


--
-- Name: booking_menu_items_itemId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_menu_items_itemId_idx" ON public.booking_menu_items USING btree ("itemId");


--
-- Name: booking_packs_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_packs_bookingId_idx" ON public.booking_packs USING btree ("bookingId");


--
-- Name: booking_packs_bookingMenuId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "booking_packs_bookingMenuId_key" ON public.booking_packs USING btree ("bookingMenuId");


--
-- Name: booking_payments_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_payments_bookingId_idx" ON public.booking_payments USING btree ("bookingId");


--
-- Name: booking_payments_paymentDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "booking_payments_paymentDate_idx" ON public.booking_payments USING btree ("paymentDate");


--
-- Name: bookings_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_customerId_idx" ON public.bookings USING btree ("customerId");


--
-- Name: bookings_functionDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_functionDate_idx" ON public.bookings USING btree ("functionDate");


--
-- Name: bookings_isLatest_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "bookings_isLatest_idx" ON public.bookings USING btree ("isLatest");


--
-- Name: bookings_previousBookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "bookings_previousBookingId_key" ON public.bookings USING btree ("previousBookingId");


--
-- Name: bookings_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX bookings_status_idx ON public.bookings USING btree (status);


--
-- Name: customers_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_email_idx ON public.customers USING btree (email);


--
-- Name: customers_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);


--
-- Name: customers_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX customers_phone_idx ON public.customers USING btree (phone);


--
-- Name: customers_phone_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX customers_phone_key ON public.customers USING btree (phone);


--
-- Name: customers_referredById_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "customers_referredById_idx" ON public.customers USING btree ("referredById");


--
-- Name: enquiries_customerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "enquiries_customerId_idx" ON public.enquiries USING btree ("customerId");


--
-- Name: enquiries_functionDate_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "enquiries_functionDate_idx" ON public.enquiries USING btree ("functionDate");


--
-- Name: enquiries_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX enquiries_status_idx ON public.enquiries USING btree (status);


--
-- Name: enquiry_halls_enquiryId_hallId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "enquiry_halls_enquiryId_hallId_key" ON public.enquiry_halls USING btree ("enquiryId", "hallId");


--
-- Name: enquiry_halls_enquiryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "enquiry_halls_enquiryId_idx" ON public.enquiry_halls USING btree ("enquiryId");


--
-- Name: enquiry_halls_hallId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "enquiry_halls_hallId_idx" ON public.enquiry_halls USING btree ("hallId");


--
-- Name: enquiry_packs_enquiryId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "enquiry_packs_enquiryId_idx" ON public.enquiry_packs USING btree ("enquiryId");


--
-- Name: finalized_bookings_bookingId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "finalized_bookings_bookingId_key" ON public.finalized_bookings USING btree ("bookingId");


--
-- Name: finalized_quotations_bookingId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "finalized_quotations_bookingId_idx" ON public.finalized_quotations USING btree ("bookingId");


--
-- Name: finalized_quotations_finalizedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "finalized_quotations_finalizedAt_idx" ON public.finalized_quotations USING btree ("finalizedAt");


--
-- Name: halls_banquetId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "halls_banquetId_idx" ON public.halls USING btree ("banquetId");


--
-- Name: halls_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX halls_name_key ON public.halls USING btree (name);


--
-- Name: item_types_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX item_types_name_key ON public.item_types USING btree (name);


--
-- Name: items_itemTypeId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "items_itemTypeId_idx" ON public.items USING btree ("itemTypeId");


--
-- Name: meal_slots_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX meal_slots_name_key ON public.meal_slots USING btree (name);


--
-- Name: permissions_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_name_key ON public.permissions USING btree (name);


--
-- Name: role_permissions_permissionId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "role_permissions_permissionId_idx" ON public.role_permissions USING btree ("permissionId");


--
-- Name: role_permissions_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "role_permissions_roleId_idx" ON public.role_permissions USING btree ("roleId");


--
-- Name: role_permissions_roleId_permissionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "role_permissions_roleId_permissionId_key" ON public.role_permissions USING btree ("roleId", "permissionId");


--
-- Name: roles_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name);


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: sessions_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "sessions_userId_idx" ON public.sessions USING btree ("userId");


--
-- Name: template_menu_items_itemId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "template_menu_items_itemId_idx" ON public.template_menu_items USING btree ("itemId");


--
-- Name: template_menu_items_templateMenuId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "template_menu_items_templateMenuId_idx" ON public.template_menu_items USING btree ("templateMenuId");


--
-- Name: template_menu_items_templateMenuId_itemId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "template_menu_items_templateMenuId_itemId_key" ON public.template_menu_items USING btree ("templateMenuId", "itemId");


--
-- Name: template_menus_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX template_menus_name_key ON public.template_menus USING btree (name);


--
-- Name: user_roles_roleId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_roles_roleId_idx" ON public.user_roles USING btree ("roleId");


--
-- Name: user_roles_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "user_roles_userId_idx" ON public.user_roles USING btree ("userId");


--
-- Name: user_roles_userId_roleId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "user_roles_userId_roleId_key" ON public.user_roles USING btree ("userId", "roleId");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: additional_booking_items additional_booking_items_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.additional_booking_items
    ADD CONSTRAINT "additional_booking_items_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_halls booking_halls_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_halls
    ADD CONSTRAINT "booking_halls_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_halls booking_halls_hallId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_halls
    ADD CONSTRAINT "booking_halls_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES public.halls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_menu_items booking_menu_items_bookingMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_menu_items
    ADD CONSTRAINT "booking_menu_items_bookingMenuId_fkey" FOREIGN KEY ("bookingMenuId") REFERENCES public.booking_menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_menu_items booking_menu_items_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_menu_items
    ADD CONSTRAINT "booking_menu_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_menus booking_menus_mealSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_menus
    ADD CONSTRAINT "booking_menus_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES public.meal_slots(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: booking_packs booking_packs_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT "booking_packs_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_packs booking_packs_bookingMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT "booking_packs_bookingMenuId_fkey" FOREIGN KEY ("bookingMenuId") REFERENCES public.booking_menus(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_packs booking_packs_mealSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_packs
    ADD CONSTRAINT "booking_packs_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES public.meal_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: booking_payments booking_payments_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT "booking_payments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: booking_payments booking_payments_receivedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.booking_payments
    ADD CONSTRAINT "booking_payments_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: bookings bookings_previousBookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_previousBookingId_fkey" FOREIGN KEY ("previousBookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: bookings bookings_secondCustomerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT "bookings_secondCustomerId_fkey" FOREIGN KEY ("secondCustomerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: customers customers_referredById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT "customers_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: enquiries enquiries_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT "enquiries_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.customers(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enquiry_halls enquiry_halls_enquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_halls
    ADD CONSTRAINT "enquiry_halls_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES public.enquiries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enquiry_halls enquiry_halls_hallId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_halls
    ADD CONSTRAINT "enquiry_halls_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES public.halls(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enquiry_packs enquiry_packs_enquiryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT "enquiry_packs_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES public.enquiries(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: enquiry_packs enquiry_packs_mealSlotId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT "enquiry_packs_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES public.meal_slots(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: enquiry_packs enquiry_packs_templateMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enquiry_packs
    ADD CONSTRAINT "enquiry_packs_templateMenuId_fkey" FOREIGN KEY ("templateMenuId") REFERENCES public.template_menus(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: finalized_bookings finalized_bookings_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finalized_bookings
    ADD CONSTRAINT "finalized_bookings_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: finalized_quotations finalized_quotations_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finalized_quotations
    ADD CONSTRAINT "finalized_quotations_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: finalized_quotations finalized_quotations_finalizedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.finalized_quotations
    ADD CONSTRAINT "finalized_quotations_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: halls halls_banquetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.halls
    ADD CONSTRAINT "halls_banquetId_fkey" FOREIGN KEY ("banquetId") REFERENCES public.banquets(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: items items_itemTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT "items_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES public.item_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: role_permissions role_permissions_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public.permissions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: template_menu_items template_menu_items_itemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_menu_items
    ADD CONSTRAINT "template_menu_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: template_menu_items template_menu_items_templateMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_menu_items
    ADD CONSTRAINT "template_menu_items_templateMenuId_fkey" FOREIGN KEY ("templateMenuId") REFERENCES public.template_menus(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_roles user_roles_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict L0PS2tSjtgunX7efevUDqGTC99ZoIYaTeRbOYbowTsbTe6CSTcVv3e2wvOBj44s

