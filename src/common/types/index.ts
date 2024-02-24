import { Genre, Show, UserShow } from "@prisma/client";

export type TShow = Pick<Show, "id" | "title" | "posterPath"> &
  Pick<UserShow, "order" | "status"> & { genres: Genre[] };
