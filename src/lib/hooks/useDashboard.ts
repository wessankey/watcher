import { DragEndEvent } from "@dnd-kit/core";
import { useEffect, useReducer, useState } from "react";
import { TSearchResult } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";
import {
  ActionType,
  DEFAULT_STATE,
  reducer,
} from "../reducers/dashboardReducer";
import { Status } from "@prisma/client";

const Status = {
  WANT_TO_WATCH: "WANT_TO_WATCH",
  WATCHING: "WATCHING",
  WATCHED: "WATCHED",
} as const;

export type TStatus = (typeof Status)[keyof typeof Status];

export const useDashboard = () => {
  const [dashboardState, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const { data, isLoading, refetch } = api.dashboard.getMedia.useQuery();

  const [isDragging, setIsDragging] = useState(false);
  const [addCardStatus, setAddCardStatus] = useState<TStatus>(
    Status.WANT_TO_WATCH
  );

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

  // TODO: remove refetch
  const { mutate: changeCardStatusMutation } =
    api.dashboard.changeCardStatus.useMutation({
      onSuccess: () => {
        refetch();
      },
    });

  // TODO: remove refetch
  const { mutate: deleteCardMutation } = api.dashboard.deleteMedia.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleAddCardClick = (status: Status) => {
    setAddCardStatus(status);
    setShowAddCardModal(true);
  };

  const handleCloseAddCardModal = () => {
    setShowAddCardModal(false);
  };

  const deleteCard = (id: number) => {
    deleteCardMutation({ id });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (event.over) {
      setIsDragging(false);

      const movedCardId = event.active.id;

      // Check if card was deleted
      if (event.over.id === "DELETE_CARD_DROP_ZONE") {
        deleteCard(movedCardId as number);
        return;
      }

      // Get from lane and to lane
      const toStatus = event.over.id;
      const fromStatus = flattenedLaneState.find(
        (card) => card.id === event.active.id
      )?.status;

      if (fromStatus === toStatus || !fromStatus) return;

      dispatch({
        type: ActionType.CHANGE_CARD_STATUS,
        movedCardId: movedCardId as number,
        fromStatus,
        toStatus: toStatus,
      });

      changeCardStatusMutation({
        mediaId: movedCardId as number,
        // @ts-expect-error TODO: fix this
        status: toStatus,
      });
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

  const handleAddCard = (resultToAdd: TSearchResult) => {
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
