// Stub web pour @react-native-async-storage/async-storage → localStorage
const AsyncStorage = {
  getItem:    (key)        => Promise.resolve(localStorage.getItem(key)),
  setItem:    (key, value) => Promise.resolve(localStorage.setItem(key, value)),
  removeItem: (key)        => Promise.resolve(localStorage.removeItem(key)),
  clear:      ()           => Promise.resolve(localStorage.clear()),
  getAllKeys:  ()           => Promise.resolve(Object.keys(localStorage)),
  multiGet:   (keys)       => Promise.resolve(keys.map(k => [k, localStorage.getItem(k)])),
  multiSet:   (pairs)      => { pairs.forEach(([k, v]) => localStorage.setItem(k, v)); return Promise.resolve(); },
  multiRemove:(keys)       => { keys.forEach(k => localStorage.removeItem(k)); return Promise.resolve(); },
};

export default AsyncStorage;
