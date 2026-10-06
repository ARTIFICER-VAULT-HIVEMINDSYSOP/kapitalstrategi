import { bank } from "./bank.mjs";
import { core } from "./core.mjs";
import { future } from "./future.mjs";
import { trading } from "./trading.mjs";

export const translations = { ...core, ...bank, ...future, ...trading };
