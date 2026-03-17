const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('password123', 10);

    console.log('🌱 Starting seeding...');

    // 1. Driver
    const driver = await prisma.user.upsert({
        where: { email: 'driver@test.com' },
        update: {},
        create: {
            username: 'testdriver',
            email: 'driver@test.com',
            password: passwordHash,
            firstName: 'สมหมาย',
            lastName: 'สายลุย',
            gender: 'Male',
            phoneNumber: '0812345678',
            nationalIdNumber: '1100123456789',
            nationalIdPhotoUrl: 'https://placehold.co/600x400?text=National+ID+Card',
            nationalIdExpiryDate: new Date('2030-12-31'),
            selfiePhotoUrl: 'https://placehold.co/600x400?text=Selfie+With+ID',
            role: 'DRIVER',
            isVerified: true,
            isActive: true,
            profilePicture: 'https://i.pravatar.cc/150?u=driver@test.com',
            driverVerification: {
                create: {
                    licenseNumber: 'DL-99998888',
                    firstNameOnLicense: 'Sommai',
                    lastNameOnLicense: 'Salyu',
                    licenseIssueDate: new Date('2022-01-01'),
                    licenseExpiryDate: new Date('2027-12-31'),
                    licensePhotoUrl: 'https://placehold.co/600x400?text=Driver+License',
                    selfiePhotoUrl: 'https://placehold.co/600x400?text=Driver+Selfie',
                    typeOnLicense: 'PRIVATE_CAR',
                    status: 'APPROVED'
                }
            },
            vehicles: {
                create: {
                    vehicleModel: 'Honda Civic (FE)',
                    licensePlate: 'กข 9999 กรุงเทพมหานคร',
                    vehicleType: 'Sedan',
                    color: 'Crystal Black',
                    seatCapacity: 4,
                    amenities: ['Air Conditioning', 'Apple CarPlay', 'USB Charger', 'Drinking Water'],
                    photos: ['https://tse3.mm.bing.net/th/id/OIP.-FNTHa73w2U-UmXbOASoPAAAAA?rs=1&pid=ImgDetMain&o=7&rm=3', 'https://tse3.mm.bing.net/th/id/OIP.7ASVRFqpM1JaaBIagWmT3QHaFj?w=640&h=480&rs=1&pid=ImgDetMain&o=7&rm=3'],
                    isDefault: true
                }
            }
        }
    });
    console.log('✅ Created Driver: Sommai (Complete Info)');

    // 2. Passenger 1
    await prisma.user.upsert({
        where: { email: 'passenger1@test.com' },
        update: {},
        create: {
            username: 'passenger1',
            email: 'passenger1@test.com',
            password: passwordHash,
            firstName: 'สมศรี',
            lastName: 'ใจดี',
            gender: 'Female',
            phoneNumber: '0898887776',
            nationalIdNumber: '3100123456781',
            nationalIdPhotoUrl: 'https://placehold.co/600x400?text=Passenger1+ID',
            nationalIdExpiryDate: new Date('2029-01-01'),
            selfiePhotoUrl: 'https://placehold.co/600x400?text=Passenger1+Selfie',
            role: 'PASSENGER',
            isVerified: true,
            isActive: true,
            profilePicture: 'https://i.pravatar.cc/150?u=passenger1@test.com'
        }
    });
    console.log('✅ Created Passenger 1: Somsri (Complete Info)');

    // 3. Passenger 2
    await prisma.user.upsert({
        where: { email: 'passenger2@test.com' },
        update: {},
        create: {
            username: 'passenger2',
            email: 'passenger2@test.com',
            password: passwordHash,
            firstName: 'วิชัย',
            lastName: 'พากเพียร',
            gender: 'Male',
            phoneNumber: '0623334445',
            nationalIdNumber: '1100987654321',
            nationalIdPhotoUrl: 'https://placehold.co/600x400?text=Passenger2+ID',
            nationalIdExpiryDate: new Date('2028-06-15'),
            selfiePhotoUrl: 'https://placehold.co/600x400?text=Passenger2+Selfie',
            role: 'PASSENGER',
            isVerified: true,
            isActive: true,
            profilePicture: 'https://i.pravatar.cc/150?u=passenger2@test.com'
        }
    });
    console.log('✅ Created Passenger 2: Wichai (Complete Info)');

    console.log('✨ Seeding finished successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
