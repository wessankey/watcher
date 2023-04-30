import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genreData = [
  {
    id: 28,
    name: "Action",
    tagColor: "green",
  },
  {
    id: 12,
    name: "Adventure",
    tagColor: "green",
  },
  {
    id: 16,
    name: "Animation",
    tagColor: "green",
  },
  {
    id: 35,
    name: "Comedy",
    tagColor: "green",
  },
  {
    id: 80,
    name: "Crime",
    tagColor: "green",
  },
  {
    id: 99,
    name: "Documentary",
    tagColor: "green",
  },
  {
    id: 18,
    name: "Drama",
    tagColor: "green",
  },
  {
    id: 10751,
    name: "Family",
    tagColor: "green",
  },
  {
    id: 14,
    name: "Fantasy",
    tagColor: "green",
  },
  {
    id: 36,
    name: "History",
    tagColor: "green",
  },
  {
    id: 27,
    name: "Horror",
    tagColor: "green",
  },
  {
    id: 10402,
    name: "Music",
    tagColor: "green",
  },
  {
    id: 9648,
    name: "Mystery",
    tagColor: "green",
  },
  {
    id: 10749,
    name: "Romance",
    tagColor: "green",
  },
  {
    id: 878,
    name: "Science Fiction",
    tagColor: "green",
  },
  {
    id: 10770,
    name: "TV Movie",
    tagColor: "green",
  },
  {
    id: 53,
    name: "Thriller",
    tagColor: "green",
  },
  {
    id: 10752,
    name: "War",
    tagColor: "green",
  },
  {
    id: 37,
    name: "Western",
    tagColor: "green",
  },
];

const main = async () => {
  await prisma.genre.createMany({
    data: genreData,
  });
};

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
