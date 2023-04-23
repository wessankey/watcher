import {
  DndContext,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { PlusIcon } from "@heroicons/react/24/solid";
import { NextPage } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Modal } from "~/components/common/Modal";
import debounce from "lodash.debounce";
import { api } from "~/utils/api";
import { TSearchResult } from "~/server/api/routers/dashboard";

type TCard = {
  title: string;
  type: string;
  posterPath: string;
  genre: string;
};

function hasKey<O extends Object>(obj: O, key: PropertyKey): key is keyof O {
  return key in obj;
}

const Dashboard: NextPage = () => {
  /**
   * This is required due a React hydration error. Specifically, the input element
   * causes the following error:
   *   "Expected server HTML to contain a matching <input> in <div>."
   *
   * Source: https://github.com/vercel/next.js/discussions/17443#discussioncomment-637879
   */
  const [mounted, setMounted] = useState(false);

  const [showAddCardModal, setShowAddCardModal] = useState(false);

  const handleAddCardClick = () => {
    setShowAddCardModal(true);
  };

  const handleCloseAddCardModal = () => {
    setShowAddCardModal(false);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const [laneState, setLaneState] = useState({
    "ac22cf17-c3ba-4f47-991b-1d564a8c8d73": {
      name: "Want to Watch",
      cards: [
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
      ],
    },
    "1ea5c16d-fd47-41f5-b5ab-78d9c788d25c": { name: "Watching", cards: [] },
    "8ce42a21-1ed7-46c4-a22c-e810a55eed9a": {
      name: "Watched",
      cards: [
        {
          title: "Succession",
          type: "show",
          genre: "drama",
          posterPath: "/7HW47XbkNQ5fiwQFYGWdw9gs144.jpg",
        },
      ],
    },
  });

  const flattenedLaneState = Object.entries(laneState).flatMap(([id, lane]) => {
    return lane.cards.map((card) => ({ ...card, lane: id }));
  });

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over) {
      const movedCardId = event.active.id;

      // Get from lane and to lane
      const toLaneId = event.over.id;
      const fromLaneId = flattenedLaneState.find(
        (card) => card.title === event.active.id
      )?.lane;

      if (fromLaneId === toLaneId || !fromLaneId) return;

      setLaneState((prev) => {
        if (hasKey(prev, toLaneId) && hasKey(prev, fromLaneId)) {
          const fromLane = prev[fromLaneId];
          const toLane = prev[toLaneId];

          const movedCard = fromLane.cards.find(
            (card) => card.title === movedCardId
          );

          const updatedToLaneCards = [...toLane.cards, movedCard];
          const updatedFromLaneCards = fromLane.cards.filter(
            (card) => card.title !== movedCardId
          );

          return {
            ...prev,
            [toLaneId]: {
              ...toLane,
              cards: updatedToLaneCards,
            },
            [fromLaneId]: {
              ...fromLane,
              cards: updatedFromLaneCards,
            },
          };
        }

        return prev;
      });
    }
  };

  return mounted ? (
    <>
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={handleCloseAddCardModal}
      />
      <DndContext onDragEnd={handleDragEnd}>
        <div
          className="flex h-screen w-screen items-center justify-center gap-20 bg-gradient-to-br from-gray-900
      via-purple-900 to-violet-700"
        >
          {Object.entries(laneState).map(([id, lane]) => {
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
  cards: TCard[];
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
        src={`${process.env.NEXT_PUBLIC_MOVIEDB_POSTER_PATH_PREFIX}${posterPath}`}
        alt="Poster"
        width={50}
        height={50}
      />
    </div>
  );
};

const AddCardModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  return (
    <Modal
      title="Add Media"
      open={isOpen}
      onClose={onClose}
      body={
        <div>
          <MediaSearch />
        </div>
      }
      footer={
        <div className="flex justify-end gap-5">
          <button
            onClick={onClose}
            className="rounded-md bg-red-700 px-3 py-1 text-white"
          >
            Cancel
          </button>
          <button className="rounded-md bg-blue-700 px-3 py-1 text-white">
            Add
          </button>
        </div>
      }
    ></Modal>
  );
};

const MediaSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResult, setSelectedResult] = useState<TSearchResult>();

  const onUpdate = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, 500);

  const onSelectResult = (result: TSearchResult) => {
    setSelectedResult(result);
  };

  const { data } = api.dashboard.search.useQuery({ text: searchTerm || "" });

  return (
    <div>
      <input
        className="h-10 w-full rounded-md border border-gray-300 px-3"
        type="text"
        placeholder="Search for a movie or show"
        onChange={onUpdate}
      />
      {selectedResult ? (
        <SearchResultItem result={selectedResult} />
      ) : (
        <SearchResultList
          results={data || []}
          onSelectResult={onSelectResult}
        />
      )}
    </div>
  );
};

const SearchResultList = ({
  results,
  onSelectResult,
}: {
  results: TSearchResult[];
  onSelectResult: (result: TSearchResult) => void;
}) => {
  return (
    <div className="mt-2">
      {results.map((r) => {
        return (
          <SearchResultItem
            key={r.id}
            result={r}
            onSelectResult={onSelectResult}
          />
        );
      })}
    </div>
  );
};

const SearchResultItem = ({
  result,
  onSelectResult,
}: {
  result: TSearchResult;
  onSelectResult: (result: TSearchResult) => void;
}) => {
  return (
    <div
      className="my-2 flex cursor-pointer justify-between rounded-md bg-zinc-200 px-3
    py-1 hover:bg-zinc-400"
      onClick={() => onSelectResult(result)}
    >
      <div>
        <p>{result.title}</p>

        <div className="w-5/6">
          <p className="line-clamp-2 text-sm">{result.overview}</p>
        </div>
      </div>
      <Image
        src={`${process.env.NEXT_PUBLIC_MOVIEDB_POSTER_PATH_PREFIX}${result.posterPath}`}
        alt="Poster"
        width={50}
        height={50}
      />
    </div>
  );
};

export default Dashboard;
