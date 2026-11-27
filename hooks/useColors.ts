import { useColorScheme } from 'react-native';
import colors from '@/constants/colors';
import { useThemeContext } from '@/context/ThemeContext';

export function useColors() {
  const scheme = useColorScheme();
  const { theme } = useThemeContext();
  const active = theme ?? (scheme === 'dark' ? 'dark' : 'light');
  return {
    ...(active === 'dark' ? colors.dark : colors.light),
    radius: colors.radius,
  };
}
