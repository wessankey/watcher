import { NextPage } from "next";
import Image from "next/image";
import { PlusIcon } from "@heroicons/react/24/solid";

type TCard = {
  title: string;
  type: string;
  posterPath: string;
  genre: string;
};

const Dashboard: NextPage = () => {
  const toWatchCards: TCard[] = [
    {
      title: "Inception",
      type: "movie",
      posterPath: "/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg",
      genre: "action",
    },
    {
      title: "Breaking Bad",
      type: "show",
      posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      genre: "drama",
    },
  ];

  const watchedCards: TCard[] = [
    {
      title: "Succession",
      type: "show",
      genre: "drama",
      posterPath: "/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg",
    },
  ];

  return (
    <div
      className="flex h-screen w-screen items-center justify-center gap-20 bg-gradient-to-br from-gray-900
    via-purple-900 to-violet-700"
    >
      <Lane name="Want to Watch" cards={toWatchCards} />
      <Lane name="Watching" cards={[]} />
      <Lane name="Watched" cards={watchedCards} />
    </div>
  );
};

const Lane = ({ name, cards }: { name: string; cards: TCard[] }) => {
  return (
    <div className="h-3/4 w-72 rounded-md bg-slate-300 shadow-xl">
      <div className="flex items-center justify-between px-4 pt-3">
        <h3 className="text-2xl font-bold">{name}</h3>
        <button className="justify flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-white">
          <PlusIcon height={20} />
          <p>Add</p>
        </button>
      </div>

      <div>
        {cards.map((c) => {
          return <Card key={c.title} {...c} />;
        })}
      </div>
    </div>
  );
};

const Card = ({ title, type, posterPath, genre }: TCard) => {
  return (
    <div className="m-3 flex cursor-pointer justify-between rounded-md bg-zinc-700 p-2 text-zinc-200 shadow-md">
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm">{type}</p>
        <p className="text-sm">{genre}</p>
      </div>
      <Image
        src={`${process.env.NEXT_PUBLIC_POSTER_PATH_PREFIX}${posterPath}`}
        alt="Poster"
        width={50}
        height={50}
      />
    </div>
  );
};

export default Dashboard;
