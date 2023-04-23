import { XMarkIcon } from "@heroicons/react/24/outline";
import ReactDOM from "react-dom";

export const Modal = ({
  title,
  open,
  onClose,
  body,
  footer,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  body?: React.ReactElement;
  footer?: React.ReactElement;
}) => {
  if (!open) return null;

  return ReactDOM.createPortal(
    <>
      <div className="fixed bottom-0 left-0 right-0 top-0 z-30 h-full w-full bg-[#000]/[.45]">
        <div
          className="mh-[15rem] fixed left-1/2 top-1/2 z-40 w-[40rem] translate-x-[-50%] translate-y-[-120%] rounded-md
          bg-[#fff] shadow-lg"
        >
          <div className="flex justify-between border-b border-[#DDD] p-7">
            <h2 className="text-xl">{title}</h2>
            <XMarkIcon
              className="h-5 w-5 cursor-pointer stroke-[#999]"
              onClick={onClose}
            />
          </div>
          <div className="px-7 py-4">{body}</div>
          <div className="border-t border-[#DDD] px-7 py-4">{footer}</div>
        </div>
      </div>
    </>,
    document.getElementById("modal-portal")!
  );
};
