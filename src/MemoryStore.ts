
import * as RootLog from "loglevel";
import * as Underscore from "underscore";
import Store from "./Store";
import StoredObject from "./StoredObject";


const Log = RootLog.getLogger("Lapis.MemoryStore");

// call from browser: new Database({ indexedDB = window.indexedDB }, ...)

export default class MemoryStore implements Store {
  private items: any;
  private backing_store?: any;


  constructor(store?: Store) {
    this.items = {};
    this.backing_store = store;
  }


  public delete(id: string): Promise<string> {
    const that = this;
    return this.load()
      .then(function () {
        delete that.items[id];
        if (that.backing_store) {
          that.backing_store.delete(id);
        }
        return id;
      }) as Promise<string>;
  }


  public deleteAll(): Promise<void> {
    const that = this;
    return this.load()
      .then(function () {
        that.items = {};
        if (that.backing_store) {
          that.backing_store.deleteAll();
        }
      }) as Promise<void>;
  }


  public get(id: string): Promise<StoredObject> {
    const that = this;
    return this.load()
      .then(function () {
        return that.items[id] as StoredObject;
      }) as Promise<StoredObject>;
  }


  public getAll(): Promise<Array<StoredObject>> {
    const that = this;
    return this.load()
      .then(function () {
        return Underscore.map(that.items, function (item: StoredObject) {
          return item;
        });
      }) as Promise<Array<StoredObject>>;
  }


  private load(): Promise<void> {
    const that = this;
    Log.debug("MemoryStore.start() beginning");
    if (!this.backing_store) {
      return new Promise(function (resolve) {
        resolve();
      });
    }
    return this.backing_store.getAll()
      .then(function (results) {
        Log.debug("MemoryStore.start() caching results: " + results.length);
        results.forEach(function (item) {
          that.items[item.id] = item;
        });
        Log.debug("MemoryStore.start() finishing");
      });
  }


  public save(obj: StoredObject): Promise<StoredObject> {
    const that = this;
    return this.load()
      .then(function () {
        if (!obj.id || typeof obj.id !== "string") {
          throw new Error("save object must have an id property whose value is a string");
        }
        that.items[obj.id] = obj;
        if (that.backing_store) {
          that.backing_store.save(obj);
        }
        return obj;
      }) as Promise<StoredObject>;
  }

}
