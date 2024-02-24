import { DragEndEvent } from "@dnd-kit/core";
import { Status } from "@prisma/client";
import { useReducer, useState } from "react";
import type { TTvShow } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";
import { ActionType, reducer } from "../reducers/dashboardReducer";
import { TShow } from "../types";

export type TLane = {
  id: string;
  name: string;
  cards: TShow[];
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
  const [addCardLoading, setAddCardLoading] = useState(false);
  const [selectedTvShowId, setSelectedTvShowId] = useState<number>();
  const [selectedTvShow, setSelectedTvShow] = useState<TTvShow>();
  const [isDragging, setIsDragging] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [addCardStatus, setAddCardStatus] = useState<TStatus>(
    Status.WANT_TO_WATCH
  );

  const utils = api.useContext();

  const [dashboardState, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const { isLoading } = api.dashboard.getShow.useQuery(undefined, {
    onSuccess: (data) =>
      dispatch({ type: ActionType.HYDRATE_FROM_DB, payload: { data } }),
  });

  api.dashboard.findTvShowById.useQuery(
    { tvShowId: selectedTvShowId || 0 },
    {
      enabled: selectedTvShowId !== undefined,
      onSuccess: (data) => setSelectedTvShow(data),
    }
  );

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
        utils.dashboard.getShow.cancel();

        // Snapshot previous value
        const previousState = utils.dashboard.getShow.getData();

        // Optimistically update the data with the move
        dispatch({
          type: "MOVE_SHOW",
          payload: {
            fromStatus: payload.fromStatus,
            toStatus: payload.toStatus,
            showId: payload.mediaId,
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
      utils.dashboard.getShow.cancel();

      // Snapshot previous value
      const previousState = utils.dashboard.getShow.getData();

      // Optimistically update the data with the move
      dispatch({
        type: "DELETE_SHOW",
        payload: {
          showId: payload.id,
          fromStatus: payload.fromStatus,
        },
      });

      // Return previous data so we can revert if there was an error
      return { previousState };
    },
  });

  const { mutate: addTvShowMutation } = api.dashboard.addTvShow.useMutation({
    onMutate: (payload) => {
      setAddCardLoading(false);

      if (!payload) return;

      // Cancel outgoing refetches so they don't overwrite optimistic update
      utils.dashboard.getShow.cancel();

      // Snapshot previous value
      const previousState = utils.dashboard.getShow.getData();

      // Optimistically update the data
      dispatch({
        type: "ADD_SHOW",
        payload: {
          id: payload.id,
          title: payload.name,
          posterPath: payload.posterPath,
          genres: payload.genres,
          status: payload.status,
        },
      });

      handleCloseAddMediaModal();

      // Return previous data so we can revert if there was an error
      return { previousState };
    },
    onError: (err) => {
      console.log("Error adding media:", err);
    },
  });

  const handleAddCardClick = (status: Status) => {
    setShowAddMediaModal(true);
    setAddCardStatus(status);
  };

  const handleCloseAddMediaModal = () => {
    setShowAddMediaModal(false);
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

  const handleAddTvShow = (resultToAdd: TTvShow, cleanup?: () => void) => {
    setAddCardLoading(true);
    addTvShowMutation(
      {
        id: resultToAdd.id,
        status: addCardStatus,
        name: resultToAdd.name,
        posterPath: resultToAdd.posterPath,
        genres: resultToAdd.genres,
      },
      { onSuccess: () => cleanup && cleanup() }
    );
  };

  const handleSelectMedia = (id: number) => {
    setSelectedTvShowId(id);
  };

  const handleCloseTvShowDetailModal = () => {
    setSelectedTvShowId(undefined);
    setSelectedTvShow(undefined);
  };

  return {
    isLoading,
    addCardLoading,
    isDragging,
    dashboardState,
    showAddMediaModal,
    selectedTvShow,
    handleCloseTvShowDetailModal,
    handleSelectMedia,
    handleStartDragging,
    handleAddTvShow,
    handleAddCardClick,
    handleCloseAddMediaModal,
    handleDragEnd,
  };
};
