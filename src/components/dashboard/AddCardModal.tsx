import debounce from "lodash.debounce";
import Image from "next/image";
import { useState } from "react";
import type {
  TMovie,
  TMovieSearchResult,
} from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";
import { Modal } from "../common/Modal";
import { MovieDetail } from "./MovieDetail";

export const AddCardModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resultToAdd: TMovieSearchResult) => void;
}) => {
  const [selectedResult, setSelectedResult] = useState<TMovie>();
  const [selectedMovieId, setSelectedMovieId] = useState<number | undefined>();

  const query = api.dashboard.findMovieById.useQuery(
    {
      movieId: selectedMovieId,
    },
    {
      enabled: !!selectedMovieId,
      onSuccess: (data) => setSelectedResult(data),
    }
  );

  const handleResultClick = (result: TMovieSearchResult | undefined) => {
    setSelectedMovieId(result.id);
  };

  const handleAddClick = () => {
    if (selectedResult) {
      onAdd(selectedResult);
      setSelectedResult(undefined);
    }
  };

  return (
    <Modal
      title="Add a Movie 🎬"
      open={isOpen}
      onClose={() => {
        setSelectedResult(undefined);
        onClose();
      }}
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
            onClick={() => {
              setSelectedResult(undefined);
              onClose();
            }}
            className="rounded-md bg-red-700 px-3 py-1 text-white"
          >
            Cancel
          </button>
          <button
            disabled={!selectedResult}
            onClick={handleAddClick}
            className="rounded-md bg-blue-700 px-3 py-1 text-white disabled:cursor-not-allowed disabled:opacity-50"
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
  selectedResult?: TMovie;
  onResultClick: (result: TMovieSearchResult | undefined) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const onUpdate = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedResult) {
      onResultClick(undefined);
    }

    setSearchTerm(e.target.value);
  }, 500);

  const onSelectResult = (result: TMovieSearchResult) => {
    onResultClick(result);
  };

  const { data } = api.dashboard.search.useQuery({
    text: searchTerm || "",
  });

  return (
    <div className="flex h-full flex-col">
      {!selectedResult && (
        <div className="h-12 w-full">
          <input
            className="w-full rounded-md border border-gray-300 px-3 shadow-sm focus:border-gray-300 focus:ring-transparent"
            type="text"
            placeholder="Search for a movie"
            onChange={onUpdate}
          />
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {selectedResult ? (
          <MovieDetail data={selectedResult} />
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
  results: TMovieSearchResult[];
  onSelectResult: (result: TMovieSearchResult) => void;
}) => {
  return (
    <div className="py-1">
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
  result: TMovieSearchResult;
  onSelectResult: (result: TMovieSearchResult) => void;
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
          <p className="text-sm line-clamp-2">{result.overview}</p>
        </div>
      </div>
      {result.posterPath && (
        <Image
          src={`${process.env.NEXT_PUBLIC_MOVIEDB_IMAGE_PREFIX}${result.posterPath}`}
          alt="Poster"
          width={50}
          height="0"
          style={{ height: "auto" }}
        />
      )}
    </div>
  );
};
