import { useEffect, useReducer, useState } from "react";
import { api } from "~/utils/api";
import { ActionType, reducer } from "../reducers/dashboardReducer";
import { Media, Genre } from "@prisma/client";
import { DragEndEvent } from "@dnd-kit/core";
import { TSearchResult } from "~/server/api/routers/dashboard";

export type MediaWithGenres = Media & { genres: Genre[] };

export type TLane = {
  id: string;
  name: string;
  cards: MediaWithGenres[];
};

const Status = {
  WANT_TO_WATCH: "WANT_TO_WATCH",
  WATCHING: "WATCHING",
  WATCHED: "WATCHED",
} as const;

export type TStatus = (typeof Status)[keyof typeof Status];

const DEFAULT_STATE: Record<string, TLane> = {
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

export const useDashboard = () => {
  const [dashboardState, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const { data, isLoading, refetch } = api.dashboard.getMedia.useQuery();

  useEffect(() => {
    if (data) {
      dispatch({ type: ActionType.HYDRATE_FROM_DB, data });
    }
  }, [data]);

  const flattenedLaneState = dashboardState
    ? Object.entries(dashboardState).flatMap(([id, lane]) => {
        return lane.cards.map((card) => ({ ...card, lane: id }));
      })
    : [];

  const [showAddCardModal, setShowAddCardModal] = useState(false);

  const { mutate: changeCardStatusMutation } =
    api.dashboard.changeCardStatus.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  const handleAddCardClick = () => {
    setShowAddCardModal(true);
  };

  const handleCloseAddCardModal = () => {
    setShowAddCardModal(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over) {
      const movedCardId = event.active.id;

      // Get from lane and to lane
      const toLaneId = event.over.id;
      const fromLaneId = flattenedLaneState.find(
        (card) => card.id === event.active.id
      )?.lane;

      if (fromLaneId === toLaneId || !fromLaneId) return;

      dispatch({
        type: ActionType.CHANGE_CARD_STATUS,
        movedCardId: movedCardId as number,
        fromLaneId,
        toLaneId: toLaneId as string,
      });

      changeCardStatusMutation({
        mediaId: movedCardId as number,
        // @ts-expect-error TODO: fix this
        status: toLaneId,
      });
    }
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

  const handleAddCard = (resultToAdd: TSearchResult, status: TStatus) => {
    addCardMutation({ id: resultToAdd.id, status });
  };

  return {
    isLoading,
    dashboardState,
    showAddCardModal,
    handleAddCard,
    handleAddCardClick,
    handleCloseAddCardModal,
    handleDragEnd,
  };
};
