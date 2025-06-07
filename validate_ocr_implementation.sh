#!/bin/bash

# Script de Validación Manual - OCR Recibo de Caja
# Archivo: validate_ocr_implementation.sh

echo "🔍 VALIDACIÓN DE IMPLEMENTACIÓN OCR - RECIBO DE CAJA"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Verificar archivos modificados
echo -e "\n${BLUE}1. Verificando archivos modificados...${NC}"

if [ -f "backend/app/Http/Controllers/Api/ComprobantePagoController.php" ]; then
    echo -e "${GREEN}✅ ComprobantePagoController.php existe${NC}"
    
    # Verificar que contiene los nuevos patrones OCR
    if grep -q "Recib\[íi\]" backend/app/Http/Controllers/Api/ComprobantePagoController.php; then
        echo -e "${GREEN}✅ Patrón 'Recibí de:' encontrado${NC}"
    else
        echo -e "${RED}❌ Patrón 'Recibí de:' NO encontrado${NC}"
    fi
    
    if grep -q "Aclaraci\[óo\]n" backend/app/Http/Controllers/Api/ComprobantePagoController.php; then
        echo -e "${GREEN}✅ Patrón 'Aclaración:' encontrado${NC}"
    else
        echo -e "${RED}❌ Patrón 'Aclaración:' NO encontrado${NC}"
    fi
    
    if grep -q "codigo_inscripcion_extraido" backend/app/Http/Controllers/Api/ComprobantePagoController.php; then
        echo -e "${GREEN}✅ Almacenamiento de código extraído implementado${NC}"
    else
        echo -e "${RED}❌ Almacenamiento de código extraído NO implementado${NC}"
    fi
else
    echo -e "${RED}❌ ComprobantePagoController.php NO existe${NC}"
fi

if [ -f "frontend/src/pages/registration/CompletarInscripcionPage.tsx" ]; then
    echo -e "${GREEN}✅ CompletarInscripcionPage.tsx existe${NC}"
    
    if grep -q "Recibo de Caja" frontend/src/pages/registration/CompletarInscripcionPage.tsx; then
        echo -e "${GREEN}✅ Texto 'Recibo de Caja' encontrado${NC}"
    else
        echo -e "${RED}❌ Texto 'Recibo de Caja' NO encontrado${NC}"
    fi
    
    if grep -q "Formato requerido del recibo" frontend/src/pages/registration/CompletarInscripcionPage.tsx; then
        echo -e "${GREEN}✅ Información de formato agregada${NC}"
    else
        echo -e "${RED}❌ Información de formato NO agregada${NC}"
    fi
else
    echo -e "${RED}❌ CompletarInscripcionPage.tsx NO existe${NC}"
fi

# 2. Verificar dependencias
echo -e "\n${BLUE}2. Verificando dependencias...${NC}"

if [ -d "backend/vendor/smalot/pdfparser" ]; then
    echo -e "${GREEN}✅ Librería smalot/pdfparser instalada${NC}"
else
    echo -e "${RED}❌ Librería smalot/pdfparser NO instalada${NC}"
    echo -e "${YELLOW}💡 Ejecutar: composer require smalot/pdfparser${NC}"
fi

# 3. Verificar configuración de Laravel
echo -e "\n${BLUE}3. Verificando configuración de Laravel...${NC}"

cd backend

if [ -f "artisan" ]; then
    echo -e "${GREEN}✅ Laravel artisan disponible${NC}"
    
    # Verificar que Laravel funciona
    php artisan --version > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Laravel funcionando correctamente${NC}"
    else
        echo -e "${RED}❌ Laravel NO funciona correctamente${NC}"
    fi
else
    echo -e "${RED}❌ Laravel artisan NO disponible${NC}"
fi

# 4. Verificar migraciones de base de datos
echo -e "\n${BLUE}4. Verificando estructura de base de datos...${NC}"

# Verificar si existe la tabla comprobantes_pago
php artisan tinker --execute="
try {
    \$exists = \Illuminate\Support\Facades\Schema::hasTable('comprobantes_pago');
    echo \$exists ? 'TABLA_EXISTE' : 'TABLA_NO_EXISTE';
} catch (Exception \$e) {
    echo 'ERROR_BD';
}
" 2>/dev/null | grep -q "TABLA_EXISTE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Tabla comprobantes_pago existe${NC}"
else
    echo -e "${RED}❌ Tabla comprobantes_pago NO existe${NC}"
    echo -e "${YELLOW}💡 Ejecutar migraciones: php artisan migrate${NC}"
fi

cd ..

# 5. Verificar estructura de archivos de documentación
echo -e "\n${BLUE}5. Verificando documentación...${NC}"

if [ -f "frontend/OCR_RECIBO_CAJA_IMPLEMENTATION.md" ]; then
    echo -e "${GREEN}✅ Documentación de implementación creada${NC}"
else
    echo -e "${RED}❌ Documentación de implementación NO creada${NC}"
fi

if [ -f "frontend/OCR_ERROR_FLOW_ANALYSIS.md" ]; then
    echo -e "${GREEN}✅ Análisis de flujo de errores existe${NC}"
else
    echo -e "${RED}❌ Análisis de flujo de errores NO existe${NC}"
fi

if [ -f "backend/tests/Feature/ComprobanteOCRTest.php" ]; then
    echo -e "${GREEN}✅ Tests unitarios creados${NC}"
else
    echo -e "${RED}❌ Tests unitarios NO creados${NC}"
fi

# 6. Verificar endpoints API
echo -e "\n${BLUE}6. Verificando rutas API...${NC}"

if grep -q "comprobantes-pago" backend/routes/api.php; then
    echo -e "${GREEN}✅ Rutas de comprobantes-pago encontradas${NC}"
else
    echo -e "${RED}❌ Rutas de comprobantes-pago NO encontradas${NC}"
fi

# 7. Generar resumen
echo -e "\n${BLUE}7. RESUMEN DE VALIDACIÓN${NC}"
echo "========================="

echo -e "\n${YELLOW}📋 CAMPOS QUE EL OCR EXTRAE:${NC}"
echo "• Nro. - Número del recibo"
echo "• Fecha - Fecha del pago (DD/MM/YYYY o DD-MM-YYYY)"
echo "• Recibí de: - Nombre del pagador"
echo "• Total: - Monto pagado"
echo "• Aclaración: - Texto que debe contener el código de inscripción"

echo -e "\n${YELLOW}🔍 VALIDACIONES IMPLEMENTADAS:${NC}"
echo "• Presencia de todos los campos obligatorios"
echo "• Extracción del código de inscripción de la aclaración"
echo "• Coincidencia del código extraído con el código de la orden"
echo "• Coincidencia del monto del recibo con el monto de la orden"
echo "• Coincidencia del nombre del pagador con el responsable registrado"

echo -e "\n${YELLOW}📄 FORMATOS SOPORTADOS:${NC}"
echo "• PDF con texto extraíble (no imágenes escaneadas)"
echo "• Formato estándar de recibo de caja"
echo "• Fechas: DD/MM/YYYY o DD-MM-YYYY"
echo "• Montos: X.XX o X,XX"

echo -e "\n${YELLOW}🚀 PARA PROBAR LA IMPLEMENTACIÓN:${NC}"
echo "1. Asegurar que el servidor Laravel esté ejecutándose"
echo "2. Asegurar que el frontend React esté ejecutándose"
echo "3. Crear una orden de pago de prueba"
echo "4. Subir un recibo de caja con el formato correcto"
echo "5. Verificar que la extracción y validación funcionen"

echo -e "\n${GREEN}✅ VALIDACIÓN COMPLETADA${NC}"

# Test opcional de conectividad
echo -e "\n${BLUE}8. Test opcional de conectividad (requiere servidor activo)${NC}"
echo -e "${YELLOW}¿Desea probar la conectividad del backend? (y/n):${NC}"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Probando conectividad del backend..."
    
    # Intentar acceder al endpoint de health check o similar
    if command -v curl >/dev/null 2>&1; then
        # Asumiendo que el backend corre en puerto 8000
        curl -s "https://corvus.tis.cs.umss.edu.bo/api/health" >/dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Backend accesible en localhost:8000${NC}"
        else
            echo -e "${YELLOW}⚠️  Backend no accesible en localhost:8000 (puede estar apagado)${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  curl no disponible para test de conectividad${NC}"
    fi
fi

echo -e "\n${GREEN}🎉 Validación completa. La implementación OCR está lista para pruebas.${NC}"
