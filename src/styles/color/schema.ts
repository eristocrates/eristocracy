import * as S from "@effect/schema/Schema";
import type { Schema } from "@effect/schema/Schema";

export const ColorSchema = S.Struct({
  hex: S.String.pipe(S.pattern(/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/)),
});

export type Color = Schema.Type<typeof ColorSchema>;
