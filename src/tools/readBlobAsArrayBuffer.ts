const readBlobAsArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  const reader = new FileReader();
  const promise = fileReaderReady(reader);
  reader.readAsArrayBuffer(blob);
  return promise;
};

function fileReaderReady(reader: FileReader): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(reader.error);
    };
  });
}

export default readBlobAsArrayBuffer;
