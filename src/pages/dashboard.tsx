import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { PlusIcon } from "@heroicons/react/24/solid";
import { NextPage } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";

type TCard = {
  title: string;
  type: string;
  posterPath: string;
  genre: string;
};

const Dashboard: NextPage = () => {
  /**
   * This is required due a React hydration error. Specifically, the input element
   * causes the following error:
   * - "Expected server HTML to contain a matching <input> in <div>."
   *
   * Source: https://github.com/vercel/next.js/discussions/17443#discussioncomment-637879
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  return mounted ? (
    <DndContext>
      <div
        className="flex h-screen w-screen items-center justify-center gap-20 bg-gradient-to-br from-gray-900
      via-purple-900 to-violet-700"
      >
        <Lane name="Want to Watch" cards={toWatchCards} />
        <Lane name="Watching" cards={[]} />
        <Lane name="Watched" cards={watchedCards} />
      </div>
    </DndContext>
  ) : null;
};

const Lane = ({ name, cards }: { name: string; cards: TCard[] }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: name,
  });

  if (isOver) {
    console.log("isOver");
  }

  return (
    <div
      ref={setNodeRef}
      className={`h-3/4 w-72 rounded-md ${
        isOver ? "bg-slate-400" : "bg-slate-300"
      } shadow-xl`}
    >
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
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: title,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="m-3 flex justify-between rounded-md bg-zinc-700 p-2 text-zinc-200 shadow-md"
    >
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
