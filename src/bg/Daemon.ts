import getLogger from "../tools/getLogger";
import type { IBgForDaemon } from "../types";

const logger = getLogger('Daemon');

class Daemon {
  bg: IBgForDaemon;
  isActive: boolean;
  retryCount: number;
  intervalId: ReturnType<typeof setInterval> | null;
  inProgress: boolean;

  constructor(bg: IBgForDaemon) {
    this.bg = bg;

    this.isActive = false;
    this.retryCount = 0;
    this.intervalId = null;
    this.inProgress = false;
  }

  get bgStore(): IBgForDaemon['bgStore'] {
    return this.bg.bgStore;
  }

  handleFire(): void {
    logger.info('Fire');
    if (this.inProgress) return;
    this.inProgress = true;

    this.bg.client?.updateTorrents().then(() => {
      this.retryCount = 0;
    }, (err) => {
      logger.error('updateTorrents error', err);
      if (++this.retryCount > 3) {
        logger.warn('Daemon stopped, cause', err);
        this.stop();
      }
    }).finally(() => {
      this.inProgress = false;
    });
  }

  start(): void {
    logger.info('Start');
    this.stop(true);

    if (this.bgStore.config.backgroundUpdateInterval >= 1000) {
      this.isActive = true;
      this.retryCount = 0;
      this.intervalId = setInterval(() => {
        this.handleFire();
      }, this.bgStore.config.backgroundUpdateInterval);
    }
  }

  stop(force?: boolean): void {
    if (!force) {
      logger.info('Stop');
    }
    this.isActive = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  destroy(): void {
    logger.info('Destroyed');
    this.stop();
  }
}

export default Daemon;
