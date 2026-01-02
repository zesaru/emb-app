# Unit Test Synthesizer - Ejemplos

## Ejemplo 1: Test para componente Button

```typescript
// test/unit/components/button.test.tsx
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import Button from '@/components/ui/button'

test('renderiza el botón con el texto correcto', () => {
  render(<Button>Click me</Button>)
  expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
})

test('aplica la variante correcta', () => {
  render(<Button variant="destructive">Eliminar</Button>)
  const button = screen.getByRole('button', { name: /eliminar/i })
  expect(button).toHaveClass('bg-destructive')
})

test('ejecuta onClick al hacer clic', async () => {
  const handleClick = vi.fn()
  const user = userEvent.setup()
  render(<Button onClick={handleClick}>Click</Button>)

  await user.click(screen.getByRole('button'))
  expect(handleClick).toHaveBeenCalledTimes(1)
})
```

## Ejemplo 2: Test para server action

```typescript
// test/unit/actions/get-users.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockSupabaseClient } from '@/test/mocks/supabase'
import getUsers from '@/actions/getUsers'

describe('getUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna usuarios cuando está autenticado', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: '123' } },
    })
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: [{ id: '1', name: 'User 1' }],
        }),
      }),
    })

    const result = await getUsers()
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('User 1')
  })

  it('retorna array vacío cuando no está autenticado', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
    })

    const result = await getUsers()
    expect(result).toEqual([])
  })
})
```

## Ejemplo 3: Test para schema de validación

```typescript
// test/unit/lib/validation/schemas.test.ts
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { vacationSchema, compensatorySchema } from '@/lib/validation/schemas'

describe('vacationSchema', () => {
  it('valida datos correctos', () => {
    const data = {
      userId: '123',
      start: '2025-01-01',
      finish: '2025-01-05',
      days: 5,
    }
    expect(() => vacationSchema.parse(data)).not.toThrow()
  })

  it('rechaza días negativos', () => {
    const data = {
      start: '2025-01-01',
      finish: '2025-01-05',
      days: -1,
    }
    expect(() => vacationSchema.parse(data)).toThrow()
  })

  it('rechaza más de 30 días', () => {
    const data = {
      start: '2025-01-01',
      finish: '2025-02-10',
      days: 31,
    }
    expect(() => vacationSchema.parse(data)).toThrow(/máximo 30/i)
  })
})
```
