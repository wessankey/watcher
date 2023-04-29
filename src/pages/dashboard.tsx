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
import { Genre, Media } from "@prisma/client";

type MediaWithGenres = Media & { genres: Genre[] };

type TLane = {
  id: string;
  name: string;
  cards: MediaWithGenres[];
};

const DEFAULT_STATE: Record<string, TLane> = {
  WANT_TO_WATCH: {
    id: "WANT_TO_WATCH",
    name: "Want to watch",
    cards: [],
  },
  WATCHING: {
    id: "WATCHING",
    name: "Watching",
    cards: [],
  },
  WATCHED: {
    id: "WATCHED",
    name: "Watched",
    cards: [],
  },
};

const Dashboard: NextPage = () => {
  /**
   * This is required due a React hydration error. Specifically, the input element
   * causes the following error:
   *   "Expected server HTML to contain a matching <input> in <div>."
   *
   * Source: https://github.com/vercel/next.js/discussions/17443#discussioncomment-637879
   */
  const [mounted, setMounted] = useState(false);

  const [laneState, setLaneState] =
    useState<Record<string, TLane>>(DEFAULT_STATE);

  const { data, isLoading } = api.dashboard.getMedia.useQuery();

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

  useEffect(() => {
    if (data) {
      setLaneState((prev) => {
        const updatedState = { ...prev };

        data.forEach((media) => {
          const lane = updatedState[media.status];

          if (lane) {
            if (lane.cards.find((c) => c.id === media.Media.id)) return;
            lane.cards.push({
              id: media.Media.id,
              title: media.Media.title,
              mediaType: media.Media.mediaType,
              lastUpdated: media.Media.lastUpdated,
              posterPath: media.Media.posterPath,
              genres: [],
            });
          }
        });

        return updatedState;
      });
    }
  }, [data]);

  const { mutate: changeCardStatusMutation } =
    api.dashboard.changeCardStatus.useMutation();

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over) {
      const movedCardId = event.active.id;

      // Get from lane and to lane
      const toLaneId = event.over.id;
      const fromLaneId = flattenedLaneState.find(
        (card) => card.id === event.active.id
      )?.lane;

      if (fromLaneId === toLaneId || !fromLaneId) return;

      setLaneState((prev) => {
        const fromLane = prev[fromLaneId];
        const toLane = prev[toLaneId];

        const movedCard = fromLane?.cards.find(
          (card) => card.id === movedCardId
        );

        if (!fromLane || !toLane || !movedCard) return prev;

        const updatedToLaneCards = [...toLane.cards, movedCard];
        const updatedFromLaneCards = fromLane.cards.filter(
          (card) => card.id !== movedCardId
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
      });

      changeCardStatusMutation({
        mediaId: movedCardId as number,
        // @ts-expect-error TODO: fix this
        status: toLaneId,
      });
    }
  };

  const flattenedLaneState = laneState
    ? Object.entries(laneState).flatMap(([id, lane]) => {
        return lane.cards.map((card) => ({ ...card, lane: id }));
      })
    : [];

  if (isLoading) {
    return <p>Loading...</p>;
  }

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

const Card = ({ id, title, mediaType, posterPath }: MediaWithGenres) => {
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
      <div>
        <p className="font-bold">{title}</p>
        <p className="text-sm">{mediaType}</p>
        {/* <p className="text-sm">{genre}</p> */}
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
  const [selectedResult, setSelectedResult] = useState<TSearchResult>();

  const { mutate, isLoading } = api.dashboard.addMedia.useMutation({
    onSuccess: () => {
      console.log("success!");
      onClose();
    },
    onError: (err) => {
      console.log("error:", err);
    },
  });

  const handleResultClick = (result: TSearchResult | undefined) => {
    setSelectedResult(result);
  };

  const handleAdd = () => {
    if (selectedResult) {
      mutate({ id: selectedResult.id, status: "WANT_TO_WATCH" });
    }
  };

  return (
    <Modal
      title="Add Media"
      open={isOpen}
      onClose={onClose}
      body={
        <div className="h-full">
          <MediaSearch
            selectedResult={selectedResult}
            onResultClick={handleResultClick}
          />
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
          <button
            disabled={!selectedResult}
            onClick={handleAdd}
            className="rounded-md bg-blue-700 px-3 py-1 text-white disabled:cursor-not-allowed
            disabled:opacity-50"
          >
            Add
          </button>
        </div>
      }
    ></Modal>
  );
};

const MediaSearch = ({
  selectedResult,
  onResultClick,
}: {
  selectedResult?: TSearchResult;
  onResultClick: (result: TSearchResult | undefined) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const onUpdate = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedResult) {
      onResultClick(undefined);
    }

    setSearchTerm(e.target.value);
  }, 500);

  const onSelectResult = (result: TSearchResult) => {
    onResultClick(result);
  };

  const { data } = api.dashboard.search.useQuery({ text: searchTerm || "" });

  return (
    <div className="h-full overflow-auto">
      <input
        className="h-10 w-full rounded-md border border-gray-300 px-3"
        type="text"
        placeholder="Search for a movie or show"
        onChange={onUpdate}
      />
      <div className="h-full overflow-auto">
        {selectedResult ? (
          <SearchResultItem
            result={selectedResult}
            onSelectResult={onSelectResult}
          />
        ) : (
          <SearchResultList
            results={data || []}
            onSelectResult={onSelectResult}
          />
        )}
      </div>
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
    <div className="mt-2 h-full">
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
