import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { PlusIcon, FilmIcon, TvIcon } from "@heroicons/react/24/solid";
import { NextPage } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AddCardModal } from "~/components/dashboard/AddCardModal";
import { GenreTag } from "~/components/dashboard/GenreTag";
import { MediaWithGenres, useDashboard } from "~/lib/hooks/useDashboard";

const Dashboard: NextPage = () => {
  /**
   * This is required due a React hydration error. Specifically, the input element
   * causes the following error:
   *   "Expected server HTML to contain a matching <input> in <div>."
   *
   * Source: https://github.com/vercel/next.js/discussions/17443#discussioncomment-637879
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    isLoading,
    dashboardState,
    showAddCardModal,
    handleAddCard,
    handleAddCardClick,
    handleCloseAddCardModal,
    handleDragEnd,
  } = useDashboard();

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return mounted ? (
    <>
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={handleCloseAddCardModal}
        onAdd={handleAddCard}
      />
      <DndContext onDragEnd={handleDragEnd}>
        <div
          className="flex h-screen w-screen items-center justify-center gap-20 bg-gradient-to-br from-gray-900
      via-purple-900 to-violet-700"
        >
          {Object.entries(dashboardState).map(([id, lane]) => {
            return (
              <Lane
                key={id}
                id={id}
                name={lane.name}
                cards={lane.cards}
                onAddCardClick={handleAddCardClick}
              />
            );
          })}
        </div>
      </DndContext>
    </>
  ) : null;
};

const Lane = ({
  id,
  name,
  cards,
  onAddCardClick,
}: {
  id: string;
  name: string;
  cards: MediaWithGenres[];
  onAddCardClick: () => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`h-3/4 w-72 rounded-md ${
        isOver ? "bg-slate-400" : "bg-slate-100"
      } shadow-xl`}
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <h3 className="text-2xl font-bold">{name}</h3>
        <button
          onClick={onAddCardClick}
          className="justify flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1 text-white"
        >
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

const Card = ({
  id,
  title,
  mediaType,
  posterPath,
  genres,
}: MediaWithGenres) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });

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
      <div className="flex flex-col justify-between">
        <div className="flex items-center gap-2">
          {mediaType === "MOVIE" ? (
            <FilmIcon height={20} />
          ) : (
            <TvIcon height={20} />
          )}
          <p className="font-bold">{title}</p>
        </div>

        <div className="flex gap-1">
          {genres.slice(0, 2).map((genre) => {
            return <GenreTag name={genre.name} color={genre.tagColor} />;
          })}
        </div>
      </div>
      <Image
        src={`${process.env.NEXT_PUBLIC_MOVIEDB_POSTER_PATH_PREFIX}${posterPath}`}
        alt="Poster"
        width={50}
        height={50}
      />
    </div>
  );
};

export default Dashboard;
