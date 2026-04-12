import { memo } from 'react'
import {
  Zap,
  Droplets,
  Flame,
  Wifi,
  Home,
  CreditCard,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  MessageCircle,
  Plus,
  Settings,
  LogOut,
  Menu,
  X,
  Check,
  Bell,
  Paperclip,
  Users,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
  Sparkles,
  PieChart,
  BarChart3,
  Calendar,
  FileText,
  Upload,
  Shield,
  Trash2,
  Edit,
  MoreVertical,
  Camera,
  Building,
} from 'lucide-react'

type IconName = 
  | 'zap'
  | 'droplets'
  | 'flame'
  | 'wifi'
  | 'home'
  | 'credit-card'
  | 'dollar'
  | 'trending-up'
  | 'trending-down'
  | 'alert'
  | 'lightbulb'
  | 'message'
  | 'plus'
  | 'settings'
  | 'logout'
  | 'menu'
  | 'x'
  | 'check'
  | 'bell'
  | 'users'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'send'
  | 'sparkles'
  | 'pie-chart'
  | 'bar-chart'
  | 'calendar'
  | 'file'
  | 'upload'
  | 'trash'
  | 'edit'
  | 'more-vertical'
  | 'camera'
  | 'paperclip'
  | 'shield'
  | 'building'

interface IconProps {
  name: IconName
  className?: string
  size?: number
  style?: React.CSSProperties
}

const icons: Record<IconName, React.ComponentType<any>> = {
  'zap': Zap,
  'droplets': Droplets,
  'flame': Flame,
  'wifi': Wifi,
  'home': Home,
  'credit-card': CreditCard,
  'dollar': DollarSign,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert': AlertTriangle,
  'lightbulb': Lightbulb,
  'message': MessageCircle,
  'plus': Plus,
  'settings': Settings,
  'logout': LogOut,
  'menu': Menu,
  'x': X,
  'check': Check,
  'bell': Bell,
  'users': Users,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'send': Send,
  'sparkles': Sparkles,
  'pie-chart': PieChart,
  'bar-chart': BarChart3,
  'calendar': Calendar,
  'file': FileText,
  'upload': Upload,
  'trash': Trash2,
  'edit': Edit,
  'more-vertical': MoreVertical,
  'camera': Camera,
  'paperclip': Paperclip,
  'shield': Shield,
  'building': Building,
}

function Icon({ name, className = '', size = 20, style }: IconProps) {
  const IconComponent = icons[name]
  if (!IconComponent) {
    return <DollarSign className={className} size={size} style={style} />
  }
  return <IconComponent className={className} size={size} style={style} />
}

const MemoizedIcon = memo(Icon)
export { MemoizedIcon as Icon }

export function getCategoryIcon(iconName?: string | null): IconName {
  const iconMap: Record<string, IconName> = {
    'zap': 'zap',
    'droplets': 'droplets',
    'flame': 'flame',
    'wifi': 'wifi',
    'home': 'home',
    'credit-card': 'credit-card',
    'building': 'building',
  }
  return iconMap[iconName || ''] || 'dollar'
}
