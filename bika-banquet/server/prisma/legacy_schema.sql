-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "phone" TEXT NOT NULL,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "otpCode" TEXT,
    "otpExpiresAt" TIMESTAMP(3),
    "name" TEXT,
    "alterPhone" TEXT,
    "whatsapp" TEXT,
    "whatsappCountryCode" TEXT,
    "email" TEXT,
    "address" TEXT,
    "country" TEXT DEFAULT 'India',
    "pincode" TEXT,
    "state" TEXT,
    "city" TEXT,
    "street1" TEXT,
    "street2" TEXT,
    "priority" INTEGER,
    "caste" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "linkedin" TEXT,
    "rating" TEXT DEFAULT '0',
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "phoneCountryCode" TEXT,
    "alterPhoneCountryCode" TEXT,
    "referredById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "functionType" TEXT NOT NULL,
    "functionDate" TIMESTAMP(3) NOT NULL,
    "quotation" BOOLEAN NOT NULL DEFAULT false,
    "pencilBooking" BOOLEAN NOT NULL DEFAULT false,
    "validity" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryPack" (
    "id" SERIAL NOT NULL,
    "enquiryId" INTEGER NOT NULL,
    "mealSlotId" INTEGER NOT NULL,
    "noOfPack" INTEGER NOT NULL,
    "templateMenuId" INTEGER NOT NULL,
    "timeSlot" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealSlot" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,

    CONSTRAINT "MealSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banquet" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,

    CONSTRAINT "Banquet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hall" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "rate" TEXT,
    "area" TEXT,
    "photo" TEXT,
    "order" INTEGER,
    "banquetId" INTEGER,

    CONSTRAINT "Hall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ItemType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "description" TEXT NOT NULL,
    "itemTypeId" INTEGER NOT NULL,
    "setupCost" TEXT,
    "itemCost" TEXT,
    "point" INTEGER DEFAULT 0,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateMenu" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "setupCost" TEXT NOT NULL,
    "ratePerPlate" TEXT NOT NULL,

    CONSTRAINT "TemplateMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryHall" (
    "enquiryId" INTEGER NOT NULL,
    "hallId" INTEGER NOT NULL,

    CONSTRAINT "EnquiryHall_pkey" PRIMARY KEY ("enquiryId","hallId")
);

-- CreateTable
CREATE TABLE "TemplateMenuItem" (
    "templateMenuId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "TemplateMenuItem_pkey" PRIMARY KEY ("templateMenuId","itemId")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER,
    "secondCustomerId" INTEGER,
    "rating" INTEGER DEFAULT 0,
    "secondRating" INTEGER DEFAULT 0,
    "priority" INTEGER,
    "secondPriority" INTEGER,
    "functionType" TEXT,
    "functionDate" TIMESTAMP(3),
    "note" TEXT,
    "discountAmount" TEXT,
    "discountPercentage" TEXT,
    "grandTotal" TEXT,
    "totalBillAmount" TEXT,
    "finalAmount" TEXT,
    "discountAmount2nd" TEXT,
    "discountPercentage2nd" TEXT,
    "advanceRequired" TEXT,
    "paymentReceivedPercent" TEXT,
    "paymentReceivedAmount" TEXT,
    "dueAmount" TEXT,
    "quotation" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "referredById" INTEGER,
    "isLatest" BOOLEAN DEFAULT true,
    "previousBookingId" INTEGER,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPack" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER,
    "mealSlotId" INTEGER,
    "noOfPack" INTEGER,
    "bookingMenuId" INTEGER,
    "timeSlot" TEXT,
    "hallIds" INTEGER[],
    "setupCost" TEXT,
    "ratePerPlate" TEXT,
    "startTime" TEXT,
    "endTime" TEXT,
    "extraPlate" INTEGER,
    "extraRate" TEXT,
    "extraAmount" TEXT,
    "menuPoint" INTEGER,
    "hallRate" TEXT,
    "boardToRead" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingHall" (
    "bookingId" INTEGER NOT NULL,
    "hallId" INTEGER NOT NULL,

    CONSTRAINT "BookingHall_pkey" PRIMARY KEY ("bookingId","hallId")
);

-- CreateTable
CREATE TABLE "BookingMenu" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "setupCost" TEXT NOT NULL,
    "ratePerPlate" TEXT NOT NULL,
    "mealSlotId" INTEGER,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "BookingMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingMenuItems" (
    "bookingMenuId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,

    CONSTRAINT "BookingMenuItems_pkey" PRIMARY KEY ("bookingMenuId","itemId")
);

-- CreateTable
CREATE TABLE "AdditionalBookingItems" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER,
    "charges" TEXT,
    "description" TEXT,

    CONSTRAINT "AdditionalBookingItems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPayments" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER,
    "amount" TEXT,
    "narration" TEXT,
    "receivedById" INTEGER,
    "paymentDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "BookingPayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalizedBooking" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinalizedBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinalizedQuotation" (
    "id" SERIAL NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "quotationData" JSONB NOT NULL,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinalizedQuotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_BookingReferral" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Banquet_name_key" ON "Banquet"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hall_name_key" ON "Hall"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_previousBookingId_key" ON "Booking"("previousBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPack_bookingMenuId_key" ON "BookingPack"("bookingMenuId");

-- CreateIndex
CREATE UNIQUE INDEX "FinalizedBooking_bookingId_key" ON "FinalizedBooking"("bookingId");

-- CreateIndex
CREATE INDEX "FinalizedQuotation_bookingId_idx" ON "FinalizedQuotation"("bookingId");

-- CreateIndex
CREATE INDEX "FinalizedQuotation_finalizedAt_idx" ON "FinalizedQuotation"("finalizedAt");

-- CreateIndex
CREATE UNIQUE INDEX "_BookingReferral_AB_unique" ON "_BookingReferral"("A", "B");

-- CreateIndex
CREATE INDEX "_BookingReferral_B_index" ON "_BookingReferral"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryPack" ADD CONSTRAINT "EnquiryPack_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryPack" ADD CONSTRAINT "EnquiryPack_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "MealSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryPack" ADD CONSTRAINT "EnquiryPack_templateMenuId_fkey" FOREIGN KEY ("templateMenuId") REFERENCES "TemplateMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hall" ADD CONSTRAINT "Hall_banquetId_fkey" FOREIGN KEY ("banquetId") REFERENCES "Banquet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Item" ADD CONSTRAINT "Item_itemTypeId_fkey" FOREIGN KEY ("itemTypeId") REFERENCES "ItemType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryHall" ADD CONSTRAINT "EnquiryHall_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryHall" ADD CONSTRAINT "EnquiryHall_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateMenuItem" ADD CONSTRAINT "TemplateMenuItem_templateMenuId_fkey" FOREIGN KEY ("templateMenuId") REFERENCES "TemplateMenu"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemplateMenuItem" ADD CONSTRAINT "TemplateMenuItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_secondCustomerId_fkey" FOREIGN KEY ("secondCustomerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_previousBookingId_fkey" FOREIGN KEY ("previousBookingId") REFERENCES "Booking"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "BookingPack" ADD CONSTRAINT "BookingPack_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPack" ADD CONSTRAINT "BookingPack_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "MealSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPack" ADD CONSTRAINT "BookingPack_bookingMenuId_fkey" FOREIGN KEY ("bookingMenuId") REFERENCES "BookingMenu"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHall" ADD CONSTRAINT "BookingHall_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingHall" ADD CONSTRAINT "BookingHall_hallId_fkey" FOREIGN KEY ("hallId") REFERENCES "Hall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMenu" ADD CONSTRAINT "BookingMenu_mealSlotId_fkey" FOREIGN KEY ("mealSlotId") REFERENCES "MealSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMenuItems" ADD CONSTRAINT "BookingMenuItems_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingMenuItems" ADD CONSTRAINT "BookingMenuItems_bookingMenuId_fkey" FOREIGN KEY ("bookingMenuId") REFERENCES "BookingMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalBookingItems" ADD CONSTRAINT "AdditionalBookingItems_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayments" ADD CONSTRAINT "BookingPayments_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPayments" ADD CONSTRAINT "BookingPayments_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizedBooking" ADD CONSTRAINT "FinalizedBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizedQuotation" ADD CONSTRAINT "FinalizedQuotation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinalizedQuotation" ADD CONSTRAINT "FinalizedQuotation_finalizedBy_fkey" FOREIGN KEY ("finalizedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingReferral" ADD CONSTRAINT "_BookingReferral_A_fkey" FOREIGN KEY ("A") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BookingReferral" ADD CONSTRAINT "_BookingReferral_B_fkey" FOREIGN KEY ("B") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

