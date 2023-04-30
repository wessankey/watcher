import { Genre, Media, UserMedia } from "@prisma/client";
import { TLane } from "../hooks/useDashboard";

export const ActionType = {
  ADD_CARD: "ADD_CARD",
  REMOVE_CARD: "REMOVE_CARD",
  CHANGE_CARD_STATUS: "CHANGE_CARD_STATUS",
  MOVE_CARD: "MOVE_CARD",
  HYDRATE_FROM_DB: "HYDRATE_FROM_DB",
} as const;

type TAction =
  | {
      type: typeof ActionType.ADD_CARD;
    }
  | {
      type: typeof ActionType.REMOVE_CARD;
      cardId: number;
    }
  | {
      type: typeof ActionType.CHANGE_CARD_STATUS;
      movedCardId: number;
      fromLaneId: string;
      toLaneId: string;
    }
  | {
      type: typeof ActionType.MOVE_CARD;
    }
  | {
      type: typeof ActionType.HYDRATE_FROM_DB;
      data: (UserMedia & { Media: Media & { genres: Genre[] } })[];
    };

export const reducer = (
  state: Record<string, TLane>,
  action: TAction
): Record<string, TLane> => {
  switch (action.type) {
    case ActionType.HYDRATE_FROM_DB: {
      // TODO: handle deletes
      const updatedState = { ...state };

      action.data.forEach((media) => {
        const lane = updatedState[media.status];

        if (lane) {
          if (lane.cards.find((c) => c.id === media.Media.id)) return;
          lane.cards.push({
            id: media.Media.id,
            title: media.Media.title,
            mediaType: media.Media.mediaType,
            lastUpdated: media.Media.lastUpdated,
            posterPath: media.Media.posterPath,
            genres: media.Media.genres,
          });
        }
      });

      return updatedState;
    }
    case ActionType.ADD_CARD:
      return state;
    case ActionType.REMOVE_CARD: {
      return {
        ...state,
      };
    }
    case ActionType.CHANGE_CARD_STATUS:
      const { movedCardId, fromLaneId, toLaneId } = action;

      const fromLane = state[fromLaneId];
      const toLane = state[toLaneId];
      const movedCard = fromLane?.cards.find((card) => card.id === movedCardId);

      if (!fromLane || !toLane || !movedCard) return state;

      const updatedToLaneCards = [...toLane.cards, movedCard];
      const updatedFromLaneCards = fromLane.cards.filter(
        (card) => card.id !== movedCardId
      );

      return {
        ...state,
        [toLaneId]: {
          ...toLane,
          cards: updatedToLaneCards,
        },
        [fromLaneId]: {
          ...fromLane,
          cards: updatedFromLaneCards,
        },
      };
    case ActionType.MOVE_CARD:
      return state;
    default:
      return state;
  }
};
