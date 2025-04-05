/**
 * Configuration options for logging within the store.
 */
export interface ILoggerOptions {
    /**
     * Logging level to control verbosity.
     * - 'info': General information logs.
     * - 'warn': Warning messages.
     * - 'error': Error messages.
     * - 'none': Disable logging.
     */
    level?: 'info' | 'warn' | 'error' | 'none';

    /**
     * The logging mechanism, typically `console`, but can be replaced with a custom logger.
     */
    logger: Console;

    /**
     * Whether to include timestamps in log messages.
     * @default false
     */
    timestamp?: boolean;

    /**
     * Whether to use colors in logs (if supported by the environment).
     * @default false
     */
    colorize?: boolean;
}
