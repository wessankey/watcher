import { DragEndEvent } from "@dnd-kit/core";
import { useEffect, useReducer, useState } from "react";
import type { TMovieSearchResult } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";

import { Genre, Media, Status, UserMedia } from "@prisma/client";
import { ActionType, reducer } from "../reducers/dashboardReducer";

export type TMedia = Pick<Media, "id" | "title" | "mediaType" | "posterPath"> &
  Pick<UserMedia, "order" | "status"> & { genres: Genre[] };

export type TLane = {
  id: string;
  name: string;
  cards: TMedia[];
};

type TDashboardState = {
  WANT_TO_WATCH: TLane;
  WATCHING: TLane;
  WATCHED: TLane;
};

export const DEFAULT_STATE: TDashboardState = {
  WANT_TO_WATCH: {
    id: Status.WANT_TO_WATCH,
    name: "Want to watch",
    cards: [],
  },
  WATCHING: {
    id: Status.WATCHING,
    name: "Watching",
    cards: [],
  },
  WATCHED: {
    id: Status.WATCHED,
    name: "Watched",
    cards: [],
  },
};

export type TStatus = (typeof Status)[keyof typeof Status];

export const useDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [dashboardState, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const { data, refetch } = api.dashboard.getMedia.useQuery();

  useEffect(() => {
    if (data) {
      dispatch({ type: ActionType.HYDRATE_FROM_DB, payload: { data } });
    }
  }, [data]);

  const [isDragging, setIsDragging] = useState(false);
  const [addCardStatus, setAddCardStatus] = useState<TStatus>(
    Status.WANT_TO_WATCH
  );

  const flattenedLaneState = dashboardState
    ? Object.entries(dashboardState).flatMap(([id, lane]) => {
        return lane.cards.map((card) => ({ ...card, lane: id }));
      })
    : [];

  const [showAddCardModal, setShowAddCardModal] = useState(false);

  const { mutate: changeCardStatusMutation } =
    api.dashboard.changeCardStatus.useMutation({
      onSuccess: () => {
        refetch().then(() => setIsLoading(false));
      },
    });

  const { mutate: deleteCardMutation } = api.dashboard.deleteMedia.useMutation({
    onSuccess: () => {
      refetch().then(() => setIsLoading(false));
    },
  });

  const handleAddCardClick = (status: Status) => {
    setAddCardStatus(status);
    setShowAddCardModal(true);
  };

  const handleCloseAddCardModal = () => {
    setShowAddCardModal(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over) {
      setIsDragging(false);

      const movedCardId = event.active.id;

      const toStatus = event.over.id;
      const fromStatus = flattenedLaneState.find(
        (card) => card.id === event.active.id
      )?.status;

      if (fromStatus === toStatus || !fromStatus) return;

      setIsLoading(true);

      if (event.over.id === "DELETE_CARD_DROP_ZONE") {
        deleteCardMutation({ id: movedCardId as number });
      } else {
        changeCardStatusMutation({
          mediaId: movedCardId as number,
          // @ts-expect-error TODO: fix this
          status: toStatus,
        });
      }
    }
  };

  const handleStartDragging = () => {
    setIsDragging(true);
  };

  const { mutate: addCardMutation } = api.dashboard.addMedia.useMutation({
    onSuccess: () => {
      refetch();
      handleCloseAddCardModal();
    },
    onError: (err) => {
      console.log("error:", err);
    },
  });

  const handleAddCard = (resultToAdd: TMovieSearchResult) => {
    addCardMutation({ id: resultToAdd.id, status: addCardStatus });
  };

  return {
    isLoading,
    isDragging,
    dashboardState,
    showAddCardModal,
    handleStartDragging,
    handleAddCard,
    handleAddCardClick,
    handleCloseAddCardModal,
    handleDragEnd,
  };
};
