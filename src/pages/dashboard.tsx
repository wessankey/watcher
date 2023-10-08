import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  FilmIcon,
  PlusIcon,
  TrashIcon,
  TvIcon,
} from "@heroicons/react/24/solid";
import { Status } from "@prisma/client";
import { Spinner } from "flowbite-react";
import { NextPage } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AddCardModal } from "~/components/dashboard/AddCardModal";
import { GenreTag } from "~/components/dashboard/GenreTag";
import { MovieDetailModal } from "~/components/dashboard/MovieDetailModal";
import { TMedia, useDashboard } from "~/lib/hooks/useDashboard";

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
    isDragging,
    dashboardState,
    showAddCardModal,
    selectedMovieId,
    handleCloseMovieDetailModal,
    handleSelectMovie,
    handleStartDragging,
    handleAddCard,
    handleAddCardClick,
    handleCloseAddCardModal,
    handleDragEnd,
  } = useDashboard();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  return mounted ? (
    <div className="flex h-screen flex-col bg-gradient-to-br from-gray-900 via-purple-900 to-violet-700">
      <h1 className="pl-5 pt-8 text-4xl font-bold text-white">🍿Watcher</h1>
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={handleCloseAddCardModal}
        onAdd={handleAddCard}
      />
      <MovieDetailModal
        id={selectedMovieId}
        isOpen={!!selectedMovieId}
        onClose={handleCloseMovieDetailModal}
      />
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex h-full w-screen flex-col items-center pt-8">
          <div className="flex h-5/6 items-center justify-center gap-20 pb-8">
            <Lane
              status={Status.WANT_TO_WATCH}
              name={dashboardState.WANT_TO_WATCH.name}
              cards={dashboardState.WANT_TO_WATCH.cards}
              selectMovie={handleSelectMovie}
              onAddCardClick={handleAddCardClick}
              onStartDragging={handleStartDragging}
              isLoading={isLoading}
            />

            <Lane
              status={Status.WATCHING}
              name={dashboardState.WATCHING.name}
              cards={dashboardState.WATCHING.cards}
              selectMovie={handleSelectMovie}
              onAddCardClick={handleAddCardClick}
              onStartDragging={handleStartDragging}
              isLoading={isLoading}
            />

            <Lane
              status={Status.WATCHED}
              name={dashboardState.WATCHED.name}
              cards={dashboardState.WATCHED.cards}
              selectMovie={handleSelectMovie}
              onAddCardClick={handleAddCardClick}
              onStartDragging={handleStartDragging}
              isLoading={isLoading}
            />
          </div>

          {isDragging && <DeleteCardDropZone />}
        </div>
      </DndContext>
    </div>
  ) : null;
};

const Lane = ({
  status,
  name,
  cards,
  isLoading,
  selectMovie,
  onAddCardClick,
  onStartDragging,
}: {
  status: Status;
  name: string;
  cards: TMedia[];
  isLoading: boolean;
  selectMovie: (id: number) => void;
  onAddCardClick: (status: Status) => void;
  onStartDragging: () => void;
}) => {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`h-full w-72 rounded-md ${
        isOver ? "bg-slate-400" : "bg-slate-100"
      } shadow-xl`}
    >
      <div className="h-full">
        <div className="mx-4 mt-3">
          <h3 className="text-2xl font-bold">{name}</h3>

          <button
            onClick={() => onAddCardClick(status)}
            className="justify mt-2 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-1
             text-white hover:bg-blue-400"
          >
            <PlusIcon height={20} />
            <p>Add</p>
          </button>
        </div>

        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div>
            {cards.map((c) => {
              return (
                <Card
                  key={c.id}
                  {...c}
                  onStartDragging={onStartDragging}
                  onClick={selectMovie}
                />
              );
            })}
          </div>
        )}
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
  onClick,
  onStartDragging,
}: TMedia & {
  onClick: (id: number) => void;
  onStartDragging: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id });

  useEffect(() => {
    if (isDragging) {
      onStartDragging();
    }
  }, [isDragging]);

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick(id);
      }}
    >
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
              return <GenreTag key={genre.id} name={genre.name} />;
            })}
          </div>
        </div>
        <Image
          src={`${process.env.NEXT_PUBLIC_MOVIEDB_IMAGE_PREFIX}${posterPath}`}
          alt="Poster"
          width={50}
          height={50}
        />
      </div>
    </div>
  );
};

const DeleteCardDropZone = () => {
  const { isOver, setNodeRef } = useDroppable({ id: "DELETE_CARD_DROP_ZONE" });

  return (
    <div
      ref={setNodeRef}
      className={`flex h-28 w-1/2 flex-col items-center justify-center rounded-xl ${
        isOver ? "bg-red-300" : "bg-red-400"
      }`}
    >
      <TrashIcon className="fill-white" height={30} />
      <p className="mt-3 text-white">Drag here to remove</p>
    </div>
  );
};

export default Dashboard;
