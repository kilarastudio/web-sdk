// https://github.com/storybookjs/storybook/issues/29567
import { main } from 'config-storybook';

// These component stories import their assets; this package has no static directory.
export default { ...main, staticDirs: [] };
