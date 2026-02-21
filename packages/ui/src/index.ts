/**
 * Liberty Reach UI Library
 * 
 * Shared component library for Liberty Reach applications.
 * Provides themed, accessible components for mobile, desktop, and web.
 * 
 * @module @liberty-reach/ui
 */

// Components
export {
  Button,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from './components/Button.js';

export {
  Input,
  type InputProps,
} from './components/Input.js';

export {
  Text,
  type TextProps,
  type TextVariant,
} from './components/Text.js';

export {
  Avatar,
  type AvatarProps,
  type AvatarSize,
} from './components/Avatar.js';

export {
  ChatBubble,
  type ChatBubbleProps,
  type MessageAlignment,
} from './components/ChatBubble.js';

export {
  MessageList,
  type MessageListProps,
} from './components/MessageList.js';

export {
  ConversationItem,
  type ConversationItemProps,
} from './components/ConversationItem.js';

export {
  ConversationList,
  type ConversationListProps,
} from './components/ConversationList.js';

export {
  CallView,
  type CallViewProps,
  type CallStatus,
} from './components/CallView.js';

export {
  StatusBar,
  type StatusBarProps,
} from './components/StatusBar.js';

export {
  IconButton,
  type IconButtonProps,
} from './components/IconButton.js';

export {
  Modal,
  type ModalProps,
} from './components/Modal.js';

export {
  LoadingSpinner,
  type LoadingSpinnerProps,
} from './components/LoadingSpinner.js';

// Hooks
export { useTheme } from './hooks/useTheme.js';
export { useColorScheme } from './hooks/useColorScheme.js';
export { useResponsive } from './hooks/useResponsive.js';

// Theme
export {
  ThemeProvider,
  useThemeContext,
  type Theme,
  type ThemeColors,
  type ThemeSpacing,
  type ThemeTypography,
  lightTheme,
  darkTheme,
  dimTheme,
} from './theme/index.js';

// Constants
export {
  BREAKPOINTS,
  type Breakpoint,
} from './theme/breakpoints.js';
