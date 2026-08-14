/* oxlint-disable react/only-export-components -- 图标目录与渲染组件必须共享同一映射，便于集中维护。 */
import {
  AirVent, Archive, Armchair, Baby, Backpack, Bath, BedDouble, Bike, Blend,
  BookOpen, Box, BriefcaseBusiness, BusFront, Camera, Car, CircleEllipsis,
  CookingPot, Crown, CupSoda, DoorOpen, Drill, Dumbbell, Fan, Footprints, Fuel,
  Gamepad2, Gem, Gift, GlassWater, Glasses, Hammer, Headphones, Heart, Heater,
  House, Keyboard, Lamp, LampDesk, Laptop, MapPinned, Microwave, Monitor, Mouse,
  Music, NotebookPen, PackageOpen, Palette, PawPrint, PenTool, Plane, Printer,
  Refrigerator, Router, Shirt, Ship, ShoppingBag, Smartphone, Sofa, Speaker,
  Sparkles, Star, Store, TableProperties, Tablet, TentTree, TrainFront, Trophy,
  Tv, Umbrella, Utensils, WalletCards, WashingMachine, Watch, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'

interface AssetIconDefinition {
  key: string
  label: string
  icon: LucideIcon
}

interface AssetIconGroup {
  categoryId: string
  name: string
  icons: AssetIconDefinition[]
}

export const assetIconGroups: AssetIconGroup[] = [
  {
    categoryId: 'digital',
    name: '数码',
    icons: [
      { key: 'smartphone', label: '手机', icon: Smartphone },
      { key: 'laptop', label: '笔记本', icon: Laptop },
      { key: 'tablet', label: '平板', icon: Tablet },
      { key: 'monitor', label: '显示器', icon: Monitor },
      { key: 'watch', label: '手表', icon: Watch },
      { key: 'headphones', label: '耳机', icon: Headphones },
      { key: 'camera', label: '相机', icon: Camera },
      { key: 'gamepad', label: '游戏机', icon: Gamepad2 },
      { key: 'keyboard', label: '键盘', icon: Keyboard },
      { key: 'mouse', label: '鼠标', icon: Mouse },
      { key: 'speaker', label: '音箱', icon: Speaker },
      { key: 'printer', label: '打印机', icon: Printer },
      { key: 'router', label: '路由器', icon: Router },
    ],
  },
  {
    categoryId: 'home',
    name: '家居',
    icons: [
      { key: 'sofa', label: '沙发', icon: Sofa },
      { key: 'bed', label: '床', icon: BedDouble },
      { key: 'lamp', label: '灯具', icon: Lamp },
      { key: 'armchair', label: '座椅', icon: Armchair },
      { key: 'table', label: '桌子', icon: TableProperties },
      { key: 'door', label: '门锁', icon: DoorOpen },
      { key: 'bath', label: '卫浴', icon: Bath },
      { key: 'cookware', label: '厨具', icon: CookingPot },
      { key: 'tableware', label: '餐具', icon: Utensils },
      { key: 'cup', label: '杯子', icon: CupSoda },
      { key: 'glass', label: '水杯', icon: GlassWater },
      { key: 'house', label: '房屋', icon: House },
      { key: 'package-open', label: '收纳', icon: PackageOpen },
    ],
  },
  {
    categoryId: 'appliance',
    name: '家电',
    icons: [
      { key: 'tv', label: '电视', icon: Tv },
      { key: 'refrigerator', label: '冰箱', icon: Refrigerator },
      { key: 'microwave', label: '微波炉', icon: Microwave },
      { key: 'washer', label: '洗衣机', icon: WashingMachine },
      { key: 'air-conditioner', label: '空调', icon: AirVent },
      { key: 'fan', label: '风扇', icon: Fan },
      { key: 'heater', label: '取暖器', icon: Heater },
      { key: 'cleaner', label: '清洁电器', icon: Zap },
      { key: 'desk-lamp', label: '台灯', icon: LampDesk },
      { key: 'blender', label: '料理机', icon: Blend },
    ],
  },
  {
    categoryId: 'clothing',
    name: '服饰穿戴',
    icons: [
      { key: 'shirt', label: '衣服', icon: Shirt },
      { key: 'shoes', label: '鞋子', icon: Footprints },
      { key: 'glasses', label: '眼镜', icon: Glasses },
      { key: 'jewelry', label: '首饰', icon: Gem },
      { key: 'briefcase', label: '公文包', icon: BriefcaseBusiness },
      { key: 'backpack', label: '背包', icon: Backpack },
      { key: 'umbrella', label: '雨伞', icon: Umbrella },
      { key: 'crown', label: '帽饰', icon: Crown },
      { key: 'wallet', label: '钱包', icon: WalletCards },
    ],
  },
  {
    categoryId: 'other',
    name: '出行',
    icons: [
      { key: 'car', label: '汽车', icon: Car },
      { key: 'bike', label: '自行车', icon: Bike },
      { key: 'plane', label: '飞机', icon: Plane },
      { key: 'ship', label: '船只', icon: Ship },
      { key: 'train', label: '火车', icon: TrainFront },
      { key: 'bus', label: '公交车', icon: BusFront },
      { key: 'fuel', label: '车用物品', icon: Fuel },
      { key: 'location', label: '旅行装备', icon: MapPinned },
    ],
  },
  {
    categoryId: 'other',
    name: '办公与兴趣',
    icons: [
      { key: 'book', label: '书籍', icon: BookOpen },
      { key: 'notebook', label: '笔记本', icon: NotebookPen },
      { key: 'pen', label: '文具', icon: PenTool },
      { key: 'palette', label: '绘画', icon: Palette },
      { key: 'music', label: '乐器', icon: Music },
      { key: 'dumbbell', label: '健身', icon: Dumbbell },
      { key: 'trophy', label: '奖杯', icon: Trophy },
      { key: 'camping', label: '露营', icon: TentTree },
      { key: 'drill', label: '电动工具', icon: Drill },
      { key: 'wrench', label: '维修工具', icon: Wrench },
      { key: 'hammer', label: '手工具', icon: Hammer },
      { key: 'store', label: '店铺用品', icon: Store },
    ],
  },
  {
    categoryId: 'other',
    name: '其他',
    icons: [
      { key: 'box', label: '普通物品', icon: Box },
      { key: 'gift', label: '礼物', icon: Gift },
      { key: 'baby', label: '母婴', icon: Baby },
      { key: 'pet', label: '宠物用品', icon: PawPrint },
      { key: 'heart', label: '珍藏', icon: Heart },
      { key: 'star', label: '纪念品', icon: Star },
      { key: 'sparkles', label: '护理用品', icon: Sparkles },
      { key: 'shopping-bag', label: '购物', icon: ShoppingBag },
      { key: 'archive', label: '档案', icon: Archive },
      { key: 'more', label: '其他', icon: CircleEllipsis },
    ],
  },
]

const iconMap = new Map(assetIconGroups.flatMap((group) => group.icons).map((item) => [item.key, item.icon]))
const iconCategoryMap = new Map(assetIconGroups.flatMap((group) => group.icons.map((item) => [item.key, group.categoryId])))
const categoryDefaults: Record<string, string> = {
  digital: 'smartphone',
  home: 'sofa',
  appliance: 'washer',
  clothing: 'shirt',
  other: 'box',
}

export function defaultAssetIcon(categoryId: string) {
  return categoryDefaults[categoryId] ?? 'box'
}

export function normalizeAssetIcon(icon: string | undefined, categoryId: string) {
  const normalizedCategoryId = categoryDefaults[categoryId] ? categoryId : 'other'
  return icon && iconCategoryMap.get(icon) === normalizedCategoryId ? icon : defaultAssetIcon(categoryId)
}

export function AssetIcon({ name, size = 32 }: { name: string; size?: number }) {
  const Icon = iconMap.get(name) ?? Box
  return <Icon size={size} strokeWidth={1.9} aria-hidden="true" />
}

export function AssetIconPicker({ categoryId, value, onChange }: { categoryId: string; value: string; onChange: (value: string) => void }) {
  const normalizedCategoryId = categoryDefaults[categoryId] ? categoryId : 'other'
  const groups = assetIconGroups.filter((group) => group.categoryId === normalizedCategoryId)
  return (
    <fieldset className="asset-icon-picker">
      <legend>选择图标</legend>
      {groups.map((group) => (
        <section key={group.name}>
          <h3>{group.name}</h3>
          <div className="asset-icon-grid">
            {group.icons.map((item) => (
              <button
                type="button"
                key={item.key}
                className={value === item.key ? 'selected' : ''}
                aria-pressed={value === item.key}
                title={item.label}
                onClick={() => onChange(item.key)}
              >
                <item.icon size={25} strokeWidth={1.9} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </fieldset>
  )
}
