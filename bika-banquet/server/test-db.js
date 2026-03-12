const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const booking = await prisma.booking.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            packs: {
                include: {
                    bookingMenu: {
                        include: {
                            items: true
                        }
                    }
                }
            }
        }
    });

    console.log(JSON.stringify(booking?.packs, null, 2));
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
