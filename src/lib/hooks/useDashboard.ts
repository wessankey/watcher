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
  const [selectedMovieId, setSelectedMovieId] = useState<number | undefined>();
  const [isDragging, setIsDragging] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [addCardStatus, setAddCardStatus] = useState<TStatus>(
    Status.WANT_TO_WATCH
  );

  const utils = api.useContext();

  const [dashboardState, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const { data, refetch } = api.dashboard.getMedia.useQuery();

  useEffect(() => {
    if (data) {
      dispatch({ type: ActionType.HYDRATE_FROM_DB, payload: { data } });
    }
  }, [data]);

  const flattenedLaneState = dashboardState
    ? Object.entries(dashboardState).flatMap(([id, lane]) => {
        return lane.cards.map((card) => ({ ...card, lane: id }));
      })
    : [];

  const { mutate: changeCardStatusMutation } =
    api.dashboard.changeCardStatus.useMutation({
      onMutate: async (payload) => {
        if (!payload) return;

        // Cancel outgoing refetches so they don't overwrite optimistic update
        utils.dashboard.getMedia.cancel();

        // Snapshot previous value
        const previousState = utils.dashboard.getMedia.getData();

        // Optimistically update the data with the move
        dispatch({
          type: "MOVE_MOVIE",
          payload: {
            fromStatus: payload.fromStatus,
            toStatus: payload.toStatus,
            movieId: payload.mediaId,
          },
        });

        // Return previous data so we can revert if there was an error
        return { previousState };
      },
    });

  const { mutate: deleteCardMutation } = api.dashboard.deleteMedia.useMutation({
    onMutate: async (payload) => {
      if (!payload) return;

      // Cancel outgoing refetches so they don't overwrite optimistic update
      utils.dashboard.getMedia.cancel();

      // Snapshot previous value
      const previousState = utils.dashboard.getMedia.getData();

      // Optimistically update the data with the move
      dispatch({
        type: "DELETE_MOVIE",
        payload: {
          movieId: payload.id,
          fromStatus: payload.fromStatus,
        },
      });

      // Return previous data so we can revert if there was an error
      return { previousState };
    },
  });

  const { mutate: addCardMutation } = api.dashboard.addMedia.useMutation({
    onSuccess: () => {
      refetch();
      handleCloseAddCardModal();
    },
    onError: (err) => {
      console.log("error:", err);
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

      const mediaId = event.active.id as number;

      const toStatus = event.over.id as Status;
      const fromStatus = flattenedLaneState.find(
        (card) => card.id === event.active.id
      )?.status;

      if (fromStatus === toStatus || !fromStatus) return;

      if (event.over.id === "DELETE_CARD_DROP_ZONE") {
        deleteCardMutation({ id: mediaId, fromStatus });
      } else {
        changeCardStatusMutation({ mediaId, fromStatus, toStatus });
      }
    }
  };

  const handleStartDragging = () => {
    setIsDragging(true);
  };

  const handleAddCard = (resultToAdd: TMovieSearchResult) => {
    addCardMutation({ id: resultToAdd.id, status: addCardStatus });
  };

  const handleSelectMovie = (id: number) => setSelectedMovieId(id);

  const handleCloseMovieDetailModal = () => setSelectedMovieId(undefined);

  return {
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
  };
};
