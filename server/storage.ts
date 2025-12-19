import { IStorage } from "./storage/interface";
import { UserStorage } from "./storage/users";
import { LineStorage } from "./storage/lines";
import { FaultStorage } from "./storage/faults";
import { SubsidiaryStorage } from "./storage/subsidiaries";
import { MessageStorage } from "./storage/messages";
import { LineRequestStorage } from "./storage/line-requests";

export * from "./storage/interface";

export class DatabaseStorage {
  // Methods will be mixed in
}

export interface DatabaseStorage extends UserStorage, LineStorage, FaultStorage, SubsidiaryStorage, MessageStorage, LineRequestStorage {}

function applyMixins(derivedCtor: any, constructors: any[]) {
  constructors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      Object.defineProperty(
        derivedCtor.prototype,
        name,
        Object.getOwnPropertyDescriptor(baseCtor.prototype, name) || Object.create(null)
      );
    });
  });
}

applyMixins(DatabaseStorage, [
  UserStorage,
  LineStorage,
  FaultStorage,
  SubsidiaryStorage,
  MessageStorage,
  LineRequestStorage,
]);

export const storage = new DatabaseStorage();
