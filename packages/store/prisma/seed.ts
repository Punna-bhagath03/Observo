import { prismaClient } from "../index";

async function main() {
    const regions = [
        {
            id: "426aadc0-55e7-45b6-a928-ea98da7e0454",
            name: "India",
        },
        {
            id: "c1df32e0-97cb-4577-835f-2aadb28bcc72",
            name: "USA",
        },
        {
            id: "44097c6b-bfa4-42b3-a72d-dfaf8ce05b37",
            name: "Africa",
        },
        {
            id: "21120c33-270f-4b0d-bc68-162a6180b5a3",
            name: "Europe",
        },
    ];

    for (const region of regions) {
        await prismaClient.region.upsert({
            where: {
                id: region.id,
            },
            update: {
                name: region.name,
            },
            create: {
                id: region.id,
                name: region.name,
            },
        });

        console.log(` Seeded ${region.name}`);
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exit(1);
    })
    .finally(async () => {
        await prismaClient.$disconnect();
    });