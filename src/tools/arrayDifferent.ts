const arrayDifferent = <T>(prev: T[], current: T[]): T[] => {
  return prev.filter(i => !current.includes(i));
};

export default arrayDifferent;
