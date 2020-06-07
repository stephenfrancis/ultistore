
import * as RootLog from "loglevel";
import * as Underscore from "underscore";
import Store from "./Store";
import StoredObject from "./StoredObject";


const Log = RootLog.getLogger("Lapis.LocalStore");

// call from browser: new LocalStore(window.localStorage, ...)

export default class LocalStore implements Store {
  private delimiter_char: string;
  private keys: Array<string>;
  private store_id: string;
  private window_localStorage: any;


  constructor(window_localStorage, store_id) {
    this.delimiter_char = ":";
    this.setLocalStorage(window_localStorage);
    this.checkValidId(store_id);
    this.store_id = store_id; // string store name
    this.loadKeys();
  }


  public checkValidId(str: string) {
    if (!str || typeof str !== "string") {
      throw new Error("id must be a non-blank string");
    }
    if (!str.match(/^[-_a-zA-Z0-9]*$/)) {
      throw new Error("id must contain only alphanumeric characters: " + str);
    }
    // if (str.length < 4 || str.length > 40) {
    //   throw new Error("id must be between 4 and 40 characters: " + str);
    // }
  }


  public containsKey(id: string) {
    return (this.keys.indexOf(id) > -1);
  }


  public count() {
    return this.keys.length;
  }


  public delete(id: string): Promise<string> {
    const that = this;
    return new Promise(function (resolve, reject) {
      try {
        that.window_localStorage.removeItem(that.store_id + that.delimiter_char + id);
        that.keys.splice(that.keys.indexOf(id), 1);
        Log.debug(`LocalStore.delete(${id}) keys left ${that.keys.length}`);
        resolve(id);
      } catch (err) {
        reject(err);
      }
    }) as Promise<string>;
  }


  public deleteAll(): Promise<void> {
    const that = this;
    function deleteOneItem(): Promise<void> {
      if (that.keys.length === 0) {
        return;
      }
      return that.delete(that.keys[0])
        .then(function () {
          return deleteOneItem();
        });
    }
    return deleteOneItem();
  }


  public forEachKey(callback) {
    const keys = this.keys.slice(0); // shallow copy keys
    keys.forEach(function (id) {
      callback(id);
    });
  }


  public get(id: string): Promise<StoredObject> {
    const that = this;
    // if (typeof obj.pullObjectFromStore === "function") {
    //   obj.pullObjectFromStore();
    // }
    return new Promise(function (resolve, reject) {
      try {
        that.checkValidId(id);
        resolve(that.getInternal(id));
      } catch (err) {
        reject(err);
      }
    }) as Promise<StoredObject>;
  }


  private getInternal(id: string): StoredObject {
    const str = this.window_localStorage.getItem(this.store_id + this.delimiter_char + id);
    Log.debug(`LocalStore.getInternal(${id}) found ${str}`);
    if (!str) {
      throw new Error("id not found: " + id);
    }
    return JSON.parse(str) as StoredObject;
  }


  public getAll(): Promise<Array<StoredObject>> {
    const that = this;
    Log.debug(`LocalStore.getAll() keys now ${this.keys.length}`);
    return new Promise(function (resolve, reject) {
      try {
        const vals: Array<StoredObject> = Underscore.map(that.keys, function (key: string): StoredObject {
          return that.getInternal(key) as StoredObject;
        });
        resolve(vals);
      } catch (err) {
        reject(err);
      }
    }) as Promise<Array<StoredObject>>;
  }


  public loadKeys() {
    const that = this;
    const re = new RegExp("^" + this.store_id + this.delimiter_char + "(.*)$");
    this.keys = [];
    Object.keys(this.window_localStorage).forEach(function (id) {
      var match = re.exec(id);
      if (match && match.length > 1 && typeof that.window_localStorage[id] === "string") {
        that.keys.push(match[1]);
      }
    });
  }


  public save(obj: StoredObject): Promise<StoredObject> {
    const that = this;
    // if (typeof obj.pushObjectToStore === "function") {
    //   obj = obj.pushObjectToStore();
    // }
    return new Promise(function (resolve, reject) {
      try {
        that.checkValidId(obj.id);
        that.window_localStorage.setItem(that.store_id + that.delimiter_char + obj.id,
          JSON.stringify(obj));
        if (that.keys.indexOf(obj.id) === -1) {
          that.keys.push(obj.id);
        }
        Log.debug(`LocalStore.save(${obj.id}) keys now ${that.keys.length}`);
        resolve(obj);
      } catch (err) {
        reject(err);
      }
    }) as Promise<StoredObject>;
  }


  public setLocalStorage(window_localStorage: any) {
    if (!window_localStorage || typeof window_localStorage.setItem !== "function") {
      throw new Error("invalid localStorage object (doesn't exist or has no setItem() function)");
    }
    this.window_localStorage = window_localStorage;
  }

}
