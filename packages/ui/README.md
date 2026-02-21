# @liberty-reach/ui

Shared UI Component Library for Liberty Reach.

## Features

- **Cross-Platform** - React Native components for iOS, Android, and Web
- **Themed** - Light, Dark, and Dim themes with easy customization
- **Accessible** - WCAG compliant components with proper ARIA labels
- **Responsive** - Adaptive layouts for all screen sizes
- **Animated** - Smooth animations using Reanimated 3
- **Type-Safe** - Full TypeScript support

## Installation

```bash
npm install @liberty-reach/ui
```

## Usage

### Theme Provider

```typescript
import { ThemeProvider } from '@liberty-reach/ui';

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

### Components

```typescript
import { Button, Text, Input, Avatar } from '@liberty-reach/ui';

function MyComponent() {
  return (
    <View>
      <Text variant="heading1">Welcome</Text>
      <Input placeholder="Enter message" />
      <Button title="Send" variant="primary" />
      <Avatar name="John Doe" size="md" />
    </View>
  );
}
```

### Using Hooks

```typescript
import { useTheme, useColorScheme, useResponsive } from '@liberty-reach/ui';

function ResponsiveComponent() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const { breakpoint, isSmall, isLarge } = useResponsive();
  
  return (
    <View style={{ 
      backgroundColor: theme.colors.background,
      padding: isSmall ? theme.spacing.sm : theme.spacing.lg,
    }}>
      <Text color={theme.colors.textPrimary}>
        Current breakpoint: {breakpoint}
      </Text>
    </View>
  );
}
```

## Components

### Buttons

| Component | Description |
|-----------|-------------|
| `Button` | Primary action button with variants |
| `IconButton` | Icon-only button |

### Inputs

| Component | Description |
|-----------|-------------|
| `Input` | Text input with validation |

### Typography

| Component | Description |
|-----------|-------------|
| `Text` | Themed text with variants |

### Media

| Component | Description |
|-----------|-------------|
| `Avatar` | User avatar with initials fallback |

### Chat

| Component | Description |
|-----------|-------------|
| `ChatBubble` | Message bubble |
| `MessageList` | Scrollable message list |
| `ConversationItem` | Conversation list item |
| `ConversationList` | Conversation list |
| `CallView` | Video/audio call interface |

### Layout

| Component | Description |
|-----------|-------------|
| `StatusBar` | App status bar |
| `Modal` | Modal dialog |
| `LoadingSpinner` | Loading indicator |

## Themes

### Predefined Themes

- `light` - Default light theme
- `dark` - Dark theme
- `dim` - AMOLED dark theme

### Custom Theme

```typescript
import { ThemeProvider, lightTheme } from '@liberty-reach/ui';

const customTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    primary: '#FF6B6B',
  },
};

<ThemeProvider defaultTheme="custom">
  {/* Your app */}
</ThemeProvider>
```

## Breakpoints

| Name | Min Width |
|------|-----------|
| small | 0px |
| medium | 600px |
| large | 1024px |
| xlarge | 1440px |

## API Reference

### Button

```typescript
interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  onPress?: () => void;
}
```

### Input

```typescript
interface InputProps {
  value?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  onChangeText?: (text: string) => void;
}
```

### Text

```typescript
interface TextProps {
  children: React.ReactNode;
  variant?: 'heading1' | 'heading2' | 'body' | 'caption' | ...;
  color?: string;
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
}
```

### Avatar

```typescript
interface AvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  isOnline?: boolean;
}
```

## License

AGPL-3.0-or-later
