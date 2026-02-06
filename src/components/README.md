# UI Components

Reusable React UI components built with Tailwind CSS and Radix UI primitives.

## 📁 Structure

```
components/
├── ui/                    # Base UI components
│   ├── button.tsx         # Button component
│   ├── card.tsx           # Card component
│   ├── badge.tsx          # Badge component
│   ├── progress.tsx       # Progress indicator
│   ├── dialog.tsx         # Dialog/Modal
│   ├── dropdown.tsx       # Dropdown menu
│   ├── input.tsx          # Input field
│   ├── select.tsx         # Select dropdown
│   └── ...
└── (additional components as needed)
```

---

## 🔘 Button (button.tsx)

### Purpose
Reusable button component with variants and sizes.

### Props

| Prop | Type | Description |
|------|------|-------------|
| variant | 'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link' | Visual style |
| size | 'default' \| 'sm' \| 'lg' \| 'icon' | Button size |
| disabled | boolean | Disable interaction |
| loading | boolean | Show loading state |

### Variants

| Variant | Appearance |
|---------|------------|
| default | Primary blue button |
| destructive | Red danger button |
| outline | Bordered button |
| secondary | Gray secondary button |
| ghost | No background, hover effect |
| link | Text-only button |

### Usage

```typescript
import { Button } from './ui/button';

<Button>Click me</Button>
<Button variant="destructive">Delete</Button>
<Button size="lg">Large button</Button>
<Button loading>Loading...</Button>
```

---

## 🃏 Card (card.tsx)

### Purpose
Container component for grouped content.

### Components

| Component | Purpose |
|-----------|---------|
| Card | Main container |
| CardHeader | Header section |
| CardTitle | Title text |
| CardDescription | Description text |
| CardContent | Main content |
| CardFooter | Footer section |

### Usage

```typescript
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Description text here</CardDescription>
  </CardHeader>
  <CardContent>
    Main content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

---

## 🏷️ Badge (badge.tsx)

### Purpose
Small status indicator or label.

### Props

| Prop | Type | Description |
|------|------|-------------|
| variant | 'default' \| 'secondary' \| 'destructive' \| 'outline' | Visual style |

### Usage

```typescript
import { Badge } from './ui/badge';

<Badge>Default</Badge>
<Badge variant="destructive">Critical</Badge>
<Badge variant="secondary">Medium</Badge>
<Badge variant="outline">Info</Badge>
```

---

## 📊 Progress (progress.tsx)

### Purpose
Visual progress indicator for tasks and uploads.

### Props

| Prop | Type | Description |
|------|------|-------------|
| value | number | Progress value (0-100) |
| max | number | Maximum value (default 100) |

### Usage

```typescript
import { Progress } from './ui/progress';

<Progress value={50} />      // 50% complete
<Progress value={75} max={200} /> // 37.5% complete (75/200)
```

---

## 💬 Dialog (dialog.tsx)

### Purpose
Modal dialog for focused interactions.

### Components

| Component | Purpose |
|-----------|---------|
| Dialog | Root component |
| DialogTrigger | Button that opens dialog |
| DialogContent | Dialog content container |
| DialogHeader | Header section |
| DialogTitle | Title text |
| DialogDescription | Description text |
| DialogFooter | Footer with actions |
| DialogClose | Close button |

### Usage

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>
        This is the dialog description
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 📋 Dropdown (dropdown.tsx)

### Purpose
Dropdown menu for additional actions.

### Components

| Component | Purpose |
|-----------|---------|
| DropdownMenu | Root component |
| DropdownMenuTrigger | Trigger element |
| DropdownMenuContent | Menu container |
| DropdownMenuItem | Menu item |
| DropdownMenuSeparator | Visual separator |

### Usage

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown';

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

## 📝 Input (input.tsx)

### Purpose
Text input field with validation support.

### Props

| Prop | Type | Description |
|------|------|-------------|
| type | string | Input type (text, password, email, etc.) |
| placeholder | string | Placeholder text |
| disabled | boolean | Disable input |
| error | boolean | Show error state |

### Usage

```typescript
import { Input } from './ui/input';

<Input placeholder="Enter text..." />
<Input type="password" placeholder="Password" />
<Input error placeholder="Invalid input" />
```

---

## 🎯 Select (select.tsx)

### Purpose
Dropdown select for choosing from options.

### Usage

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

---

## 🎨 Design System

### Colors

Tailwind CSS color palette:

| Color | Usage |
|-------|-------|
| blue-600 | Primary action |
| red-600 | Destructive/critical |
| green-600 | Success |
| yellow-600 | Warning |
| gray-600 | Secondary text |

### Typography

| Class | Usage |
|-------|-------|
| text-2xl font-bold | Page titles |
| text-xl font-semibold | Section titles |
| text-lg | Subtitles |
| text-sm | Secondary text |
| text-xs | Labels |

### Spacing

Tailwind spacing scale (0.25rem increments):

| Class | Value |
|-------|-------|
| p-4 | 1rem (16px) |
| p-6 | 1.5rem (24px) |
| p-8 | 2rem (32px) |
| gap-4 | 1rem (16px) |
| gap-2 | 0.5rem (8px) |

---

## 🔧 Component Patterns

### Loading State

```typescript
function Component() {
  const [loading, setLoading] = useState(false);

  return (
    <Button loading={loading} onClick={handleClick}>
      {loading ? 'Loading...' : 'Submit'}
    </Button>
  );
}
```

### Error State

```typescript
function Component() {
  const [error, setError] = useState(null);

  return (
    <div>
      {error && <div className="text-red-600">{error}</div>}
      {/* content */}
    </div>
  );
}
```

### Responsive Components

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>
```

---

## 📦 Dependencies

```json
{
  "dependencies": {
    "radix-ui": "*",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  }
}
```

---

## 🧪 Adding New Components

1. Create component file in `src/components/ui/`
2. Use Radix UI primitives for accessibility
3. Style with Tailwind CSS classes
4. Export from `src/components/ui/index.ts`

```typescript
// src/components/ui/your-component.tsx
export function YourComponent({ children }: { children: React.ReactNode }) {
  return <div className="your-classes">{children}</div>;
}

// src/components/ui/index.ts
export * from './your-component';
```