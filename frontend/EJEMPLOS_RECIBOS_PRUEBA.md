# Ejemplos de Recibos de Caja para Pruebas OCR

## 📋 **Formato Válido - Ejemplo 1**

```
RECIBO DE CAJA

Nro.: 001234
Fecha: 15/06/2024

Recibí de: JUAN CARLOS PÉREZ MAMANI

La cantidad de: CIENTO CINCUENTA 00/100 BOLIVIANOS

Total: 150.00

Por concepto de: Pago de inscripción curso de capacitación

Aclaración: Inscripción SANSI 2024 - O-SANSI-2024-12345

Cajero: María González
Sello y Firma
```

---

## 📋 **Formato Válido - Ejemplo 2**

```
UNIVERSIDAD MAYOR DE SAN SIMÓN
RECIBO DE CAJA

Nro.: 005678
Fecha: 20-06-2024

Recibí de: ANA MARÍA LÓPEZ CONDORI

La suma de: DOSCIENTOS 00/100 BOLIVIANOS

Total: 200,00

Concepto: Pago inscripción examen de admisión

Aclaración: Código de inscripción O-SANSI-2024-67890

Responsable: Carlos Mendoza
```

---

## 📋 **Formato Válido - Ejemplo 3**

```
RECIBO N° 009876
Fecha: 25/06/2024

Recibí de: PEDRO ANTONIO QUISPE VARGAS

Cantidad: TRESCIENTOS CINCUENTA 00/100 Bs.

Total: 350.00

Detalle: Pago de inscripción y material didáctico

Aclaración: Estudiante inscrito con código O-SANSI-2024-11111

Firma autorizada
```

---

## ❌ **Ejemplos de Formatos Inválidos**

### **Falta campo "Nro."**

```
RECIBO DE CAJA
Fecha: 15/06/2024
Recibí de: JUAN PÉREZ
Total: 150.00
Aclaración: O-SANSI-2024-12345
```

### **Falta campo "Fecha"**

```
RECIBO DE CAJA
Nro.: 001234
Recibí de: JUAN PÉREZ
Total: 150.00
Aclaración: O-SANSI-2024-12345
```

### **Falta campo "Recibí de:"**

```
RECIBO DE CAJA
Nro.: 001234
Fecha: 15/06/2024
Total: 150.00
Aclaración: O-SANSI-2024-12345
```

### **Falta campo "Total"**

```
RECIBO DE CAJA
Nro.: 001234
Fecha: 15/06/2024
Recibí de: JUAN PÉREZ
Aclaración: O-SANSI-2024-12345
```

### **Falta campo "Aclaración"**

```
RECIBO DE CAJA
Nro.: 001234
Fecha: 15/06/2024
Recibí de: JUAN PÉREZ
Total: 150.00
Por concepto de: Pago de inscripción
```

### **Código inválido en aclaración**

```
RECIBO DE CAJA
Nro.: 001234
Fecha: 15/06/2024
Recibí de: JUAN PÉREZ
Total: 150.00
Aclaración: Pago de inscripción sin código válido
```

### **Código diferente al esperado**

```
RECIBO DE CAJA
Nro.: 001234
Fecha: 15/06/2024
Recibí de: JUAN PÉREZ
Total: 150.00
Aclaración: Código incorrecto O-SANSI-2024-99999
```

---

## 🔍 **Patrones de Extracción OCR**

### **Regex Implementados:**

1. **Número del recibo:**

   ```regex
   /Nro\.?\s*:?\s*([0-9]+)/i
   ```

   - Captura: `001234`, `005678`, `009876`

2. **Fecha:**

   ```regex
   /Fecha:?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i
   ```

   - Captura: `15/06/2024`, `20-06-2024`, `25/06/2024`

3. **Nombre del pagador:**

   ```regex
   /Recib[íi]\s+de:?\s*([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+?)(?:\n|$|[A-Z][a-z]+:)/i
   ```

   - Captura: `JUAN CARLOS PÉREZ MAMANI`, `ANA MARÍA LÓPEZ CONDORI`

4. **Monto total:**

   ```regex
   /Total:?\s*(\d+(?:[.,]\d{2})?)/i
   ```

   - Captura: `150.00`, `200,00`, `350.00`

5. **Aclaración:**

   ```regex
   /Aclaraci[óo]n:?\s*([^\n\r]+)/i
   ```

   - Captura: toda la línea de aclaración

6. **Código de inscripción:**
   ```regex
   /(O-SANSI-\d{4}-\d+)/i
   ```
   - Captura: `O-SANSI-2024-12345`, `O-SANSI-2024-67890`

---

## 📊 **Casos de Prueba Recomendados**

### **Pruebas Positivas:**

1. ✅ Recibo con todos los campos correctos
2. ✅ Diferentes formatos de fecha (/ y -)
3. ✅ Diferentes formatos de monto (. y ,)
4. ✅ Nombres con acentos y caracteres especiales
5. ✅ Códigos de inscripción en diferentes posiciones de la aclaración

### **Pruebas Negativas:**

1. ❌ Recibo sin campo obligatorio
2. ❌ Código de inscripción incorrecto
3. ❌ Monto diferente al de la orden
4. ❌ Nombre diferente al responsable registrado
5. ❌ Formato de fecha inválido
6. ❌ PDF con imagen escaneada (no texto extraíble)

---

## 🛠️ **Herramientas de Prueba**

### **Para crear PDFs de prueba:**

1. **LibreOffice Writer** - Crear documento y exportar a PDF
2. **Google Docs** - Crear documento y descargar como PDF
3. **Microsoft Word** - Crear documento y guardar como PDF

### **Para verificar extracción de texto:**

```bash
# Usar herramienta de línea de comandos (si está disponible)
pdftotext recibo_prueba.pdf
cat recibo_prueba.txt
```

### **Para simular pruebas de API:**

```bash
# Usar curl para probar el endpoint
curl -X POST http://localhost:8000/api/v1/comprobantes-pago/por-codigo \
  -F "pdf_comprobante=@recibo_prueba.pdf" \
  -F "codigo_orden=O-SANSI-2024-12345"
```

---

## 🎯 **Checklist de Validación**

- [ ] PDF contiene texto extraíble (no imagen)
- [ ] Campo "Nro." presente y con formato numérico
- [ ] Campo "Fecha" presente con formato DD/MM/YYYY o DD-MM-YYYY
- [ ] Campo "Recibí de:" presente con nombre completo
- [ ] Campo "Total:" presente con monto numérico
- [ ] Campo "Aclaración:" presente y contiene código de inscripción
- [ ] Código de inscripción tiene formato O-SANSI-YYYY-XXXXX
- [ ] Código extraído coincide con código de la orden
- [ ] Monto extraído coincide con monto de la orden
- [ ] Nombre extraído coincide con responsable registrado

---

**Nota:** Estos ejemplos sirven como guía para crear recibos de prueba. El sistema OCR extraerá automáticamente los datos de estos campos cuando estén presentes en el formato correcto.
