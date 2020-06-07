
import * as RootLog from "loglevel";
import * as Underscore from "underscore";
import Store from "./Store";
import StoredObject from "./StoredObject";


const Log = RootLog.getLogger("Lapis.AsyncStore");


export default class AsyncStore implements Store {
  private async_store: any;
  private delimiter_char: string;
  private store_id: string;


  constructor(async_store: any, store_id) {
    this.delimiter_char = ":";
    this.async_store = async_store;
    this.checkValidId(store_id);
    this.store_id = store_id; // string store name
  }


  public checkValidId(str: string): string {
    if (!str || typeof str !== "string") {
      throw new Error("id must be a non-blank string");
    }
    if (!str.match(/^[-_a-zA-Z0-9]*$/)) {
      throw new Error("id must contain only alphanumeric characters: " + str);
    }
    return this.store_id + this.delimiter_char + str;
  }


  public delete(id: string): Promise<string> {
    return this.async_store.removeItem(this.checkValidId(id)) as Promise<string>;
  }


  public deleteAll(): Promise<void> {
    const that = this;
    return this.getAllKeys()
      .then(function (keys: Array<string>) {
        return that.async_store.multiRemove(keys);
      }) as Promise<void>;
  }


  public get(id: string): Promise<StoredObject> {
    return this.async_store.getItem(this.checkValidId(id))
      .then(function (res: string) {
        return JSON.parse(res);
      }) as Promise<StoredObject>;
  }


  public getAll(): Promise<Array<StoredObject>> {
    const that = this;
    return this.getAllKeys()
      .then(function (keys: Array<string>) {
        return that.async_store.multiGet(keys);
      })
      .then(function (res: Array<Array<string>>) {
        return Underscore.map(res, function (item: Array<string>) {
          return JSON.parse(item[1]);
        });
      }) as Promise<Array<StoredObject>>;
  }


  public getAllKeys(): Promise<Array<string>> {
    const that = this;
    const re = new RegExp("^" + this.store_id + this.delimiter_char + "(.*)$");
    return this.async_store.getAllKeys()
      .then(function (keys: Array<string>): Array<string> {
        return Underscore.reduce(keys, function (new_set, key) {
          const match = re.exec(key);
          if (match && match.length > 1) {
            new_set.push(match[1]);
          }
          Log.info(`AsyncStore[${that.store_id}].getAllKeys(): ${new_set}`);
          return new_set;
        }, []);
      });
  }


  public save(obj: StoredObject): Promise<StoredObject> {
    const that = this;
    if (!obj.id || typeof obj.id !== "string") {
      throw new Error("save object must have an id property whose value is a string");
    }
    return this.async_store.setItem(this.checkValidId(obj.id), JSON.stringify(obj))
      .then(function () {
        return obj;
      }) as Promise<StoredObject>;
  }

}
