import 'styled-components';
import type { AppTheme } from './theme';

declare module 'styled-components' {
  // Interface merging is styled-components' documented way to type the theme.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends AppTheme {}
}
