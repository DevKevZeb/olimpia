# Instrucciones para limpiar y actualizar la base de datos

Este documento contiene las instrucciones para limpiar completamente la base de datos del sistema OH-SANSI y migrar a la nueva estructura.

## Descripción de los cambios

A diferencia de la migración anterior que intentaba mantener los datos existentes, este proceso eliminará todos los datos y tablas para crear una estructura limpia con la nueva versión. Este enfoque es recomendado cuando:

1. Los datos existentes ya no son necesarios o son de prueba
2. La estructura ha cambiado significativamente
3. Se prefiere comenzar con una base de datos limpia

## Pasos para ejecutar la limpieza y migración

### 1. Realizar un respaldo de la base de datos (Opcional)

Si desea conservar una copia de los datos actuales para referencia futura, realice un respaldo completo de la base de datos:

```bash
mysqdump -u [usuario] -p [nombre_base_datos] > backup_oh_sansi_[fecha].sql
```

Reemplace `[usuario]`, `[nombre_base_datos]` y `[fecha]` con los valores correspondientes.

### 2. Eliminar todas las tablas y ejecutar las migraciones

Para eliminar todas las tablas existentes y ejecutar las migraciones desde cero, siga estos pasos:

1. Abra una terminal en la carpeta raíz del proyecto backend
2. Ejecute el siguiente comando para eliminar todas las tablas y ejecutar las migraciones:

```bash
php artisan migrate:fresh
```

3. Si el sistema le pregunta si desea ejecutar la migración, confirme con "yes".

### 3. Ejecutar los seeders (Opcional)

Si necesita cargar datos iniciales en la base de datos, puede ejecutar los seeders con el siguiente comando:

```bash
php artisan db:seed
```

O si prefiere ejecutar un seeder específico:

```bash
php artisan db:seed --class=NombreDelSeeder
```

### 4. Verificar la migración

Para verificar que la migración se ha ejecutado correctamente, puede revisar el estado de las migraciones con el siguiente comando:

```bash
php artisan migrate:status
```

Todas las migraciones deben aparecer como ejecutadas (Y).

## Solución de problemas

Si encuentra algún problema durante la migración, puede:

1. Restaurar el respaldo de la base de datos que realizó en el paso 1 (si lo hizo).
2. Revisar los logs de Laravel en `storage/logs/laravel.log` para identificar el error.
3. Contactar al equipo de desarrollo para obtener asistencia.

## Notas importantes

-   Este proceso **eliminará todos los datos existentes** en la base de datos. Asegúrese de realizar un respaldo si necesita conservar alguna información.
-   El comando `migrate:fresh` elimina todas las tablas y ejecuta las migraciones desde cero, lo que garantiza una estructura limpia.
-   Asegúrese de que no haya usuarios utilizando el sistema durante la migración para evitar problemas.
-   Si necesita mantener algunos datos específicos, considere exportarlos antes de ejecutar la migración y luego importarlos manualmente después.
