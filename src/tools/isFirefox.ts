declare const BUILD_ENV: {
  browser: string;
  mode: string;
  outputPath: string;
};

const isFirefox = (): boolean => {
  return BUILD_ENV.browser === 'firefox';
};

export default isFirefox;
