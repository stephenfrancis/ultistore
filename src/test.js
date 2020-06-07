
const IndexedDB = require("../dist/IndexedDB.js").default;
const FakeIndexedDB = require("fake-indexeddb");
const LocalStore = require("../dist/LocalStore.js").default;
const FakeLocalStorage = require("../dist/FakeLocalStorage.js").default;
const MemoryStore = require("../dist/MemoryStore.js").default;

const RootLog = require("loglevel");
const test = require("ava");

RootLog.setLevel("trace");

function testStore(store, t) {
  var test_obj = {
    id: "a",
    a: "A",
  };

  return store.save(test_obj)
    .then(function (result_obj) {
      t.is(test_obj, result_obj, "object saved");

      return store.get("a");
    })
    .then(function (result_obj) {
      t.is(test_obj.id, result_obj.id);
      t.is(test_obj.a, result_obj.a, "object retrieved");

      test_obj.a = "AAA";
      test_obj.b = "BBB";
      return store.save(test_obj);
    })
    .then(function (result_obj) {
      t.is(test_obj, result_obj, "changed object saved");

      return store.get("a");
    })
    .then(function (result_obj) {
      t.is(test_obj.a, result_obj.a);
      t.is(test_obj.b, result_obj.b, "changed object retrieved");

      return store.save({ id: "c", });
    })
    .then(function (result_obj) {
      t.is(result_obj.id, "c", "c stored");

      return store.save({ id: "d", });
    })
    .then(function (result_obj) {
      t.is(result_obj.id, "d", "d stored");

      return store.save({ id: "e", });
    })
    .then(function (result_obj) {
      t.is(result_obj.id, "e", "e stored");

      return store.delete("a");
    })
    .then(function (result) {
      t.is(result, "a", "a deleted");

      return store.getAll();
    })
    .then(function (results) {
      t.is(results.length, 3, "3 records found");

      return store.deleteAll();
    })
    .then(function (result) {
      t.is(result, undefined, "all records deleted");

      return store.getAll();
    })
    .then(function (results) {
      t.is(results.length, 0, "0 records found");
    })
    .then(null, function (err) {
      // console.error(err);
      t.is(null, err);
      t.done();
    });
}


test("IndexedDBStore", async t => {
  var database = new IndexedDB(FakeIndexedDB, "test", 1);
  var store = database.addStore("test");
  await database.start();
  await testStore(store, t);
});


test("LocalStore", async t => {
  var store = new LocalStore(new FakeLocalStorage(), "test");
  await testStore(store, t);
});


test("MemoryStoreUnbacked", async t => {
  var store = new MemoryStore();
  await testStore(store, t);
});


test("MemoryStoreBacked", async t => {
  var store = new MemoryStore(new LocalStore(new FakeLocalStorage(), "test"));
  await testStore(store, t);
});
