# Actualización OCR - Nuevo Formato de Recibo de Caja

## 📋 **Resumen de Cambios Implementados**

### **🎯 Objetivo**

Actualizar la funcionalidad OCR del sistema para trabajar con el nuevo formato de "Recibo de Caja" en lugar del formato anterior de comprobante de pago.

### **📄 Nuevo Formato de Documento**

El sistema ahora extrae los siguientes campos del recibo de caja:

1. **Nro.** - Número del recibo
2. **Fecha** - Fecha del pago (formato DD/MM/YYYY o DD-MM-YYYY)
3. **Recibí de:** - Nombre completo del pagador
4. **Total:** - Monto total pagado
5. **Aclaración:** - Campo que contiene el código de inscripción

---

## 🔧 **Archivos Modificados**

### **1. Backend - ComprobantePagoController.php**

**Ubicación:** `c:\xampp\htdocs\oh-sansi\backend\app\Http\Controllers\Api\ComprobantePagoController.php`

#### **Cambios Principales:**

##### **Nuevos Patrones de Extracción OCR:**

```php
// Extraer Nro. del recibo
if (preg_match('/Nro\.?\s*:?\s*([0-9]+)/i', $ocrText, $m)) {
    $numero = trim($m[1]);
}

// Extraer fecha (formato DD/MM/YYYY o DD-MM-YYYY)
if (preg_match('/Fecha:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i', $ocrText, $m)) {
    $fecha = trim($m[1]);
}

// Extraer nombre del pagador "Recibí de:"
if (preg_match('/Recib[íi]\s+de:?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:\n|$|[A-Z][a-z]+:)/i', $ocrText, $m)) {
    $nombre = trim($m[1]);
}

// Extraer monto "Total:"
if (preg_match('/Total:?\s*(\d+(?:[.,]\d{2})?)/i', $ocrText, $m)) {
    $monto = str_replace(',', '.', trim($m[1]));
}

// Extraer aclaración completa
if (preg_match('/Aclaraci[óo]n:?\s*([^\n\r]+)/i', $ocrText, $m)) {
    $aclaracion = trim($m[1]);

    // Buscar código de inscripción en la aclaración
    if (preg_match('/(O-SANSI-\d{4}-\d+)/i', $aclaracion, $cm)) {
        $codigoInscripcion = trim($cm[1]);
    }
}
```

##### **Nuevas Validaciones:**

```php
// 1. Validación de campos obligatorios
- Número del recibo
- Fecha del pago
- Nombre del pagador
- Monto total
- Aclaración
- Código de inscripción en la aclaración

// 2. Validación de código de inscripción
if (strtoupper($codigoInscripcion) !== strtoupper($orden->codigo_unico)) {
    return $this->errorResponse('El código de inscripción en la aclaración del recibo no coincide con el código de la orden de pago.', 422);
}

// 3. Validación de monto exacto
if (abs($montoOrden - $montoRecibo) > 0.01) {
    return $this->errorResponse('El monto del recibo no coincide con el monto de la orden de pago.', 422);
}
```

##### **Datos OCR Almacenados:**

```php
'datos_ocr' => [
    'ocr_text' => $ocrText,
    'numero_recibo' => $numero,
    'fecha' => $fecha,
    'nombre_pagador' => $nombre,
    'monto_total' => $monto,
    'aclaracion' => $aclaracion,
    'codigo_inscripcion_extraido' => $codigoInscripcion,
    'codigo_orden_validado' => $orden->codigo_unico
]
```

### **2. Frontend - CompletarInscripcionPage.tsx**

**Ubicación:** `C:\xampp\htdocs\oh-sansi\frontend\src\pages\registration\CompletarInscripcionPage.tsx`

#### **Mejoras en la Interfaz:**

##### **Información Específica del Formato:**

```tsx
<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
  <h4 className="font-semibold text-yellow-900 mb-3">
    Formato requerido del recibo
  </h4>
  <p className="text-yellow-800 text-sm mb-3">
    Asegúrese de que su recibo de caja contenga los siguientes campos:
  </p>
  <ul className="text-yellow-800 text-sm space-y-1 list-disc list-inside">
    <li>
      <strong>Nro.:</strong> Número del recibo
    </li>
    <li>
      <strong>Fecha:</strong> Fecha del pago
    </li>
    <li>
      <strong>Recibí de:</strong> Su nombre completo
    </li>
    <li>
      <strong>Total:</strong> Monto pagado
    </li>
    <li>
      <strong>Aclaración:</strong> Debe contener el código de inscripción
    </li>
  </ul>
</div>
```

##### **Actualización de Títulos:**

- "Subir Comprobante de Pago" → "Subir Recibo de Caja"
- Descripción más específica sobre el formato requerido

---

## 🔍 **Nuevos Mensajes de Error**

### **Errores de Extracción:**

1. `"No se pudo extraer el número del recibo. Asegúrese de que el documento contenga el campo 'Nro.'"`
2. `"No se pudo extraer la fecha del recibo. Asegúrese de que el documento contenga el campo 'Fecha:'"`
3. `"No se pudo extraer el nombre del pagador. Asegúrese de que el documento contenga el campo 'Recibí de:'"`
4. `"No se pudo extraer el monto total. Asegúrese de que el documento contenga el campo 'Total:'"`
5. `"No se pudo extraer la aclaración del recibo. Asegúrese de que el documento contenga el campo 'Aclaración:'"`

### **Errores de Validación:**

1. `"No se encontró un código de inscripción válido en la aclaración. El código debe tener el formato O-SANSI-YYYY-XXXXX"`
2. `"El código de inscripción en la aclaración del recibo no coincide con el código de la orden de pago."`
3. `"El nombre del pagador en el recibo no coincide con el responsable de pago registrado."`
4. `"El monto del recibo (Bs. X.XX) no coincide con el monto de la orden de pago (Bs. Y.YY)."`

---

## 📊 **Flujo de Validación Actualizado**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NUEVO FLUJO OCR - RECIBO DE CAJA                        │
└─────────────────────────────────────────────────────────────────────────────┘

1. 📄 SUBIDA DE RECIBO PDF
   └── Usuario sube recibo de caja en formato PDF

2. 🔍 EXTRACCIÓN OCR
   ├── Nro.: [Número del recibo]
   ├── Fecha: [DD/MM/YYYY]
   ├── Recibí de: [Nombre del pagador]
   ├── Total: [Monto pagado]
   └── Aclaración: [Texto con código de inscripción]

3. ✅ VALIDACIONES
   ├── Campos obligatorios presentes
   ├── Código de inscripción extraído de aclaración
   ├── Código coincide con orden de pago
   ├── Nombre coincide con responsable registrado
   └── Monto coincide con orden de pago

4. 💾 ALMACENAMIENTO
   └── Datos OCR completos guardados en base de datos

5. 🎯 RESULTADO
   ├── ✅ Éxito: Comprobante registrado y orden marcada como pagada
   └── ❌ Error: Mensaje específico según validación fallida
```

---

## 🧪 **Pruebas Recomendadas**

### **Casos de Prueba Positivos:**

1. **Recibo válido completo** - Todos los campos presentes y correctos
2. **Diferentes formatos de fecha** - DD/MM/YYYY, DD-MM-YYYY
3. **Nombres con acentos** - Validar caracteres especiales
4. **Montos con decimales** - Formato X.XX y X,XX

### **Casos de Prueba Negativos:**

1. **Campo faltante** - Recibo sin "Nro.", "Fecha", etc.
2. **Código incorrecto** - Aclaración sin código o código diferente
3. **Monto incorrecto** - Total diferente al de la orden
4. **Nombre incorrecto** - Pagador diferente al responsable registrado

---

## 🔧 **Configuración Técnica**

### **Dependencias:**

- **Backend:** `smalot/pdfparser` (ya instalado)
- **Frontend:** Sin cambios en dependencias

### **Base de Datos:**

- **Tabla:** `comprobantes_pago`
- **Campo:** `datos_ocr` (JSON) - Almacena todos los datos extraídos

### **API Endpoint:**

- **POST** `/v1/comprobantes-pago/por-codigo`
- **Formato:** `multipart/form-data`
- **Campos:** `pdf_comprobante`, `codigo_orden`

---

## 📈 **Beneficios de la Actualización**

1. **Mayor Precisión:** Extracción específica para formato de recibo de caja
2. **Validación Robusta:** Verificación cruzada del código de inscripción
3. **Mejor UX:** Mensajes de error más específicos y útiles
4. **Trazabilidad:** Almacenamiento completo de datos OCR extraídos
5. **Flexibilidad:** Soporte para diferentes formatos de fecha y monto

---

## ⚠️ **Consideraciones Importantes**

1. **Formato del Documento:** El recibo debe seguir el formato estándar con los campos requeridos
2. **Calidad del PDF:** Asegurar que el texto sea extraíble (no imagen escaneada)
3. **Código en Aclaración:** El código de inscripción debe estar presente en el campo "Aclaración"
4. **Montos:** Se permite diferencia de máximo 1 centavo por redondeo
5. **Nombres:** La validación normaliza acentos y caracteres especiales

---

## 🚀 **Estado de Implementación**

- ✅ **Backend OCR:** Completamente actualizado
- ✅ **Frontend UI:** Interfaz mejorada con información específica
- ✅ **Validaciones:** Nuevas validaciones implementadas
- ✅ **Mensajes de Error:** Actualizados para nuevo formato
- ✅ **Documentación:** Completa y actualizada

**La implementación está lista para producción.**
