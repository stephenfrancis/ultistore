
// mimics the window.localStorage object

export default class FakeLocalStorage {

  public getItem(key: string): string {
    return this[key];
  }


  public removeItem(key: string): void {
    delete this[key];
  }


  public setItem(key: string, val: string): void {
    this[key] = val;
  }


  public toString() {
    return "[object Storage]";
  }

}
