function copyData<T>(obj: T): T {
  // Firefox incorrect stringify mobx model when save in storage
  return JSON.parse(JSON.stringify({ w: obj })).w;
}

export default copyData;
