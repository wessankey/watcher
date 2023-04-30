import debounce from "lodash.debounce";
import Image from "next/image";
import { useState } from "react";
import { TSearchResult } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";
import { Modal } from "../common/Modal";

export const AddCardModal = ({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resultToAdd: TSearchResult) => void;
}) => {
  const [selectedResult, setSelectedResult] = useState<TSearchResult>();

  const handleResultClick = (result: TSearchResult | undefined) => {
    setSelectedResult(result);
  };

  const handleAddClick = () => {
    if (selectedResult) {
      onAdd(selectedResult);
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
            onClick={handleAddClick}
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
