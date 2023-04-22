import { DragEndEvent } from "@dnd-kit/core";
import { MediaType, Status } from "@prisma/client";
import { useReducer, useState } from "react";
import type { TMovie, TTvShow } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";
import { ActionType, reducer } from "../reducers/dashboardReducer";
import { TMedia } from "../types";

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
  const [addCardLoading, setAddCardLoading] = useState(false);
  const [selectedMovieId, setSelectedMovieId] = useState<number>();
  const [selectedTvShowId, setSelectedTvShowId] = useState<number>();
  const [selectedTvShow, setSelectedTvShow] = useState<TTvShow>();
  const [isDragging, setIsDragging] = useState(false);
  const [addMediaType, setAddMediaType] = useState<MediaType>();
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [addCardStatus, setAddCardStatus] = useState<TStatus>(
    Status.WANT_TO_WATCH
  );

  const utils = api.useContext();

  const [dashboardState, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const { isLoading } = api.dashboard.getMedia.useQuery(undefined, {
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

  const { mutate: addMovieMutation } = api.dashboard.addMovie.useMutation({
    onMutate: (payload) => {
      setAddCardLoading(false);

      if (!payload) return;

      // Cancel outgoing refetches so they don't overwrite optimistic update
      utils.dashboard.getMedia.cancel();

      // Snapshot previous value
      const previousState = utils.dashboard.getMedia.getData();

      // Optimistically update the data
      dispatch({
        type: "ADD_MOVIE",
        payload: {
          id: payload.id,
          title: payload.title,
          posterPath: payload.posterPath,
          genres: payload.genres,
          mediaType: "MOVIE",
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

  const { mutate: addTvShowMutation } = api.dashboard.addTvShow.useMutation({
    onMutate: (payload) => {
      setAddCardLoading(false);

      if (!payload) return;

      // Cancel outgoing refetches so they don't overwrite optimistic update
      utils.dashboard.getMedia.cancel();

      // Snapshot previous value
      const previousState = utils.dashboard.getMedia.getData();

      // Optimistically update the data
      dispatch({
        type: "ADD_MOVIE",
        payload: {
          id: payload.id,
          title: payload.name,
          posterPath: payload.posterPath,
          genres: payload.genres,
          mediaType: MediaType.TV_SHOW,
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

  const handleAddCardClick = (status: Status, mediaType: MediaType) => {
    setAddMediaType(mediaType);
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

  const handleAddMovie = (resultToAdd: TMovie, cleanup?: () => void) => {
    setAddCardLoading(true);
    addMovieMutation(
      {
        id: resultToAdd.id,
        status: addCardStatus,
        title: resultToAdd.title,
        posterPath: resultToAdd.posterPath,
        genres: resultToAdd.genres,
      },
      { onSuccess: () => cleanup && cleanup() }
    );
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

  const handleSelectMedia = (id: number, mediaType: MediaType) => {
    if (mediaType === MediaType.MOVIE) {
      setSelectedMovieId(id);
    } else if (mediaType === MediaType.TV_SHOW) {
      setSelectedTvShowId(id);
    }
  };

  const handleCloseMovieDetailModal = () => setSelectedMovieId(undefined);

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
    selectedMovieId,
    selectedTvShow,
    addMediaType,
    handleCloseMovieDetailModal,
    handleCloseTvShowDetailModal,
    handleSelectMedia,
    handleStartDragging,
    handleAddMovie,
    handleAddTvShow,
    handleAddCardClick,
    handleCloseAddMediaModal,
    handleDragEnd,
  };
};
