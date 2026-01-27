const splitByPart = <T>(arr: T[], limit: number): T[][] => {
  const result: T[][] = [];
  const copy = arr.slice(0);
  while (copy.length) {
    result.push(copy.splice(0, limit));
  }
  return result;
};

export default splitByPart;
