import debounce from "lodash.debounce";
import Image from "next/image";
import { useState } from "react";
import type { TTvSearchResult, TTvShow } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { Modal } from "../common/Modal";
import { TvShowDetail } from "./TTvShowDetail";

export const AddTvModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resultToAdd: TTvShow, cleanup: () => void) => void;
}) => {
  const [selectedResult, setSelectedResult] = useState<TTvShow | undefined>();
  const [selectedTvShowId, setSelectedTvShowId] = useState<
    number | undefined
  >();

  const resetState = () => {
    setSelectedResult(undefined);
    setSelectedTvShowId(undefined);
  };

  api.dashboard.findTvShowById.useQuery(
    {
      tvShowId: selectedTvShowId || 0,
    },
    {
      enabled: !!selectedTvShowId,
      onSuccess: (data) => setSelectedResult(data),
    }
  );

  const handleResultClick = (result: TTvSearchResult) => {
    setSelectedTvShowId(result.id);
  };

  const handleAddClick = () => {
    if (selectedResult) {
      onAdd(selectedResult, resetState);
    }
  };

  return (
    <Modal
      title="Add a TV Show 📺"
      open={isOpen}
      onClose={() => {
        resetState();
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
        <div className="flex justify-between">
          <div>
            {selectedResult && (
              <button
                onClick={() => setSelectedResult(undefined)}
                className="rounded-md bg-gray-400 px-3 py-1 text-white"
              >
                Back to Results
              </button>
            )}
          </div>
          <div className="flex justify-end gap-5">
            <button
              onClick={() => {
                resetState();
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
        </div>
      }
    ></Modal>
  );
};

const MediaSearch = ({
  selectedResult,
  onResultClick,
}: {
  selectedResult?: TTvShow;
  onResultClick: (result: TTvSearchResult) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const onUpdate = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedResult) {
      onResultClick(selectedResult);
    }

    setSearchTerm(e.target.value);
  }, 500);

  const { data, isLoading } = api.dashboard.tvShowSearch.useQuery({
    text: searchTerm || "",
  });

  return (
    <div className="flex h-full flex-col">
      {selectedResult ? (
        <TvShowDetail data={selectedResult} />
      ) : (
        <div className="overflow-auto">
          <div className="h-12 w-full">
            <input
              className="w-full rounded-md border border-gray-300 px-3 shadow-sm focus:border-gray-300 focus:ring-transparent"
              type="text"
              placeholder="Search for a TV show"
              onChange={onUpdate}
            />
          </div>
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <SearchResultList
                results={data || []}
                onSelectResult={onResultClick}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SearchResultList = ({
  results,
  onSelectResult,
}: {
  results: TTvSearchResult[];
  onSelectResult: (result: TTvSearchResult) => void;
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
  result: TTvSearchResult;
  onSelectResult: (result: TTvSearchResult) => void;
}) => {
  return (
    <div
      className="my-2 flex cursor-pointer justify-between rounded-md bg-zinc-200 px-3
      py-1 hover:bg-zinc-400"
      onClick={() => onSelectResult(result)}
    >
      <div>
        <p>{result.name}</p>

        <div className="w-5/6">
          <p className="line-clamp-2 text-sm">{result.overview}</p>
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
