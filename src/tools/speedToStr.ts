import formatSpeed from "./formatSpeed";

function speedToStr(speed: number): string {
  if (!Number.isFinite(speed)) {
    return '';
  }
  return formatSpeed(speed);
}

export default speedToStr;
