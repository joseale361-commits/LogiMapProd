# Módulo de Finanzas y Cartera

## Descripción

El módulo de Finanzas y Cartera permite a las distribuidoras gestionar sus cuentas por cobrar (CxC), registrar pagos de clientes y monitorear el estado de la cartera.

## Características

### 1. Tarjetas de Resumen
- **Total CxC**: Suma total de todas las cuentas por cobrar (deuda actual de clientes)
- **Recaudo Hoy**: Efectivo traído por choferes hoy (pagos registrados hoy)
- **Total Deudores**: Número de clientes con deuda pendiente

### 2. Tabla de Deudores
Lista de clientes con deuda pendiente, mostrando:
- Nombre del cliente
- Deuda total
- Último pago (monto y fecha)
- Días de mora (con indicador de color según gravedad)
- Acción "Ver Detalle" para ver historial completo

### 3. Registro de Pagos (Abono en Oficina)
Botón para registrar pagos recibidos en la oficina:
- Selección de cliente
- Ingreso del monto
- Notas opcionales
- Actualización automática de la deuda del cliente

### 4. Historial de Cliente
Al hacer clic en "Ver Detalle", se muestra:
- Resumen actual (deuda total y días de mora)
- Historial de pagos (fecha, monto, método, notas)
- Historial de facturas (número, fecha, total, estado)

## Estructura de Archivos

### Frontend
- `app/(dashboard)/dashboard/[slug]/finance/page.tsx` - Página principal del módulo
- `app/(dashboard)/dashboard/[slug]/finance/FinanceClient.tsx` - Componente cliente con toda la lógica de UI

### API Routes
- `app/api/dashboard/[slug]/finance/route.ts` - GET: Obtiene resumen financiero y lista de deudores
- `app/api/dashboard/[slug]/finance/payments/route.ts` - POST: Registra un nuevo pago
- `app/api/dashboard/[slug]/finance/payments/[customerId]/route.ts` - GET: Obtiene historial de pagos y facturas de un cliente

### Utilidades
- `lib/utils.ts` - Funciones `formatCurrency()` y `formatDate()` añadidas

### Base de Datos
- `create-payments-table.sql` - Script SQL para crear la tabla `payments` con triggers automáticos

## Configuración de Base de Datos

### Tabla `payments`

La tabla `payments` almacena todos los registros de pagos de clientes:

```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY,
  distributor_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'office', 'driver', 'transfer', 'cash'
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Triggers Automáticos

1. **`trigger_update_debt_after_payment`**: Actualiza automáticamente `customer_relationships.current_debt` cuando se inserta un pago
2. **`trigger_restore_debt_after_payment_deletion`**: Restaura la deuda si se elimina un pago
3. **`trigger_update_payments_updated_at`**: Actualiza el timestamp `updated_at` automáticamente

### Políticas RLS

- Los usuarios de la distribuidora pueden ver e insertar pagos para su distribuidora
- Se requiere autenticación

## Instalación

### 1. Ejecutar el script SQL

Ejecuta el archivo `create-payments-table.sql` en tu base de datos Supabase:

```bash
# Usando la CLI de Supabase
supabase db push

# O ejecuta el SQL directamente en el dashboard de Supabase
```

### 2. Verificar la instalación

Asegúrate de que:
- La tabla `payments` existe
- Los triggers están activos
- Las políticas RLS están configuradas

## Uso

### Acceder al módulo

Navega a: `/dashboard/[slug]/finance`

Donde `[slug]` es el slug de tu distribuidora.

### Registrar un pago

1. Haz clic en el botón "Registrar Abono"
2. Selecciona el cliente de la lista
3. Ingresa el monto del pago
4. (Opcional) Agrega notas
5. Haz clic en "Registrar Pago"

El sistema:
- Creará un registro en la tabla `payments`
- Actualizará automáticamente `customer_relationships.current_debt`
- Recargará los datos financieros

### Ver historial de un cliente

1. En la tabla de deudores, haz clic en "Ver Detalle"
2. Se abrirá un diálogo con:
   - Resumen de deuda actual
   - Historial de pagos
   - Historial de facturas

## API Endpoints

### GET `/api/dashboard/[slug]/finance`

Obtiene el resumen financiero y lista de deudores.

**Respuesta:**
```json
{
  "success": true,
  "summary": {
    "total_cxc": 1500000,
    "recaudo_hoy": 250000,
    "total_debtors": 5
  },
  "debtors": [
    {
      "id": "uuid",
      "customer_id": "uuid",
      "customer_name": "Juan Pérez",
      "current_debt": 500000,
      "last_payment_date": "2026-02-01",
      "last_payment_amount": 100000,
      "days_overdue": 6
    }
  ]
}
```

### POST `/api/dashboard/[slug]/finance/payments`

Registra un nuevo pago.

**Body:**
```json
{
  "customer_id": "uuid",
  "amount": 50000,
  "payment_method": "office",
  "notes": "Pago parcial"
}
```

**Respuesta:**
```json
{
  "success": true,
  "payment": { ... },
  "new_debt": 450000
}
```

### GET `/api/dashboard/[slug]/finance/payments/[customerId]`

Obtiene el historial de pagos y facturas de un cliente.

**Respuesta:**
```json
{
  "success": true,
  "payments": [ ... ],
  "invoices": [ ... ],
  "current_debt": 450000,
  "payment_terms_days": 30
}
```

## Cálculo de Días de Mora

El sistema calcula los días de mora basándose en:
1. `payment_terms_days` de la relación cliente-distribuidora (default: 30 días)
2. Fecha del último pago registrado

**Fórmula:**
```
Si hay último pago:
  fecha_vencimiento = último_pago + payment_terms_days
  días_mora = max(0, hoy - fecha_vencimiento)
Si no hay pagos:
  días_mora = payment_terms_days
```

## Colores de Indicadores

- **Verde**: 0 días de mora (al día)
- **Amarillo**: 1-7 días de mora
- **Naranja**: 8-30 días de mora
- **Rojo**: Más de 30 días de mora

## Consideraciones Importantes

1. **Validación de Pagos**: No se permite registrar un pago mayor a la deuda actual
2. **Actualización Automática**: Los triggers aseguran que la deuda siempre esté sincronizada
3. **Seguridad**: Las políticas RLS restringen el acceso a usuarios autorizados
4. **Zona Horaria**: Las fechas se manejan en zona horaria de Colombia (UTC-5)

## Próximas Mejoras

- [ ] Exportar reporte de cartera a PDF/Excel
- [ ] Notificaciones automáticas de pagos vencidos
- [ ] Gráficos de tendencia de pagos
- [ ] Configuración de términos de pago por cliente
- [ ] Múltiples métodos de pago (Nequi, Davivienda, etc.)
- [ ] Conciliación bancaria
