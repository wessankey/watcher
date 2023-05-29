import { Modal } from "../common/Modal";
import { MovieDetail } from "./MovieDetail";

export const MovieDetailModal = ({
  id,
  isOpen,
  onClose,
}: {
  id?: number;
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!id) return null;

  return (
    <Modal
      title="Add a Movie 🎬"
      open={isOpen}
      onClose={onClose}
      body={
        <div className="h-full">
          <MovieDetail id={id} />
        </div>
      }
      footer={
        <div className="flex justify-end gap-5">
          <button
            onClick={onClose}
            className="rounded-md bg-red-700 px-3 py-1 text-white"
          >
            Close
          </button>
        </div>
      }
    ></Modal>
  );
};
