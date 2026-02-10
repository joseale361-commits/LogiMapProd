# Resumen del Error: Funcion de Direccion No Encontrada

## Error Reportado

```
Error al crear la direccion: Could not find the function public.create_address_with_location(p_additional_info, p_city, p_country, p_delivery_instructions, p_is_default, p_label, p_lat, p_lng, p_postal_code, p_state, p_street_address, p_user_id) in the schema cache
```

## Causa Raiz

La funcion PostgreSQL `create_address_with_location` **no existe en tu base de datos de Supabase**.

Aunque la definicion SQL existe en los archivos del proyecto ([`supabase/create_address_with_location.sql`](supabase/create_address_with_location.sql)), **nunca se ha ejecutado en la base de datos**.

El codigo en [`app/(shop)/shop/[slug]/checkout/page.tsx`](app/(shop)/shop/[slug]/checkout/page.tsx:100) intenta llamar a esta funcion RPC, pero no puede encontrarla porque no ha sido creada.

## Solucion

### PASO 1: Ejecutar el SQL en Supabase

Tienes que crear la funcion en tu base de datos. La forma mas facil es:

1. Ve al dashboard de tu proyecto en Supabase
2. Navega a **SQL Editor** en el menu lateral
3. Crea una nueva consulta
4. Copia el contenido del archivo [`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql)
5. Pega el SQL en el editor
6. Haz clic en **Run** para ejecutar el script
7. Verifica que aparezcan los mensajes de confirmacion

### PASO 2: Probar la funcionalidad

Despues de ejecutar el SQL:

1. Ve a tu aplicacion en `/shop/[slug]/checkout`
2. Haz clic en "Agregar Nueva Direccion"
3. Llena los detalles de la direccion
4. Selecciona una ubicacion en el mapa
5. Haz clic en "Guardar Direccion"
6. La direccion deberia guardarse exitosamente

## Archivos Creados

He creado dos archivos para ayudarte:

1. **[`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql)** - Script SQL completo para crear la funcion
2. **[`ADDRESS_FUNCTION_DEPLOYMENT_GUIDE.md`](ADDRESS_FUNCTION_DEPLOYMENT_GUIDE.md)** - Guia detallada en ingles con instrucciones paso a paso

## Resumen

**El problema es simple:** La funcion SQL no existe en la base de datos.

**La solucion es simple:** Ejecuta el script [`supabase/deploy-address-function.sql`](supabase/deploy-address-function.sql) en tu base de datos de Supabase usando el Editor SQL.

**No se requieren cambios en el codigo** de la aplicacion - el codigo ya esta correcto.
