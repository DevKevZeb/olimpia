# 🏗️ Arquitectura Frontend Correcta

## 📁 Estructura Recomendada

```
src/
├── pages/                          # 📄 PÁGINAS (Rutas principales)
│   ├── RegistrationPage.tsx        # Página principal de inscripción
│   ├── CompletarInscripcionPage.tsx # Página para completar inscripción
│   └── DescargarBoletaPage.tsx     # Página para descargar boleta
│
├── components/                     # 🧩 COMPONENTES REUTILIZABLES
│   ├── ui/                        # Componentes de UI básicos
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Alert.tsx
│   │
│   ├── forms/                     # Componentes de formularios
│   │   ├── CodeVerificationForm.tsx
│   │   ├── FileUploadForm.tsx
│   │   └── StudentForm.tsx
│   │
│   └── layout/                    # Componentes de layout
│       ├── PageHeader.tsx
│       ├── PageContainer.tsx
│       └── Breadcrumbs.tsx
│
├── hooks/                         # 🎣 HOOKS PERSONALIZADOS
│   ├── useCodeVerification.ts
│   ├── useFileUpload.ts
│   └── usePDFDownload.ts
│
└── api/                          # 🌐 SERVICIOS API
    └── registration/
        ├── inscripcionApi.ts
        ├── boletaApi.ts
        └── comprobanteApi.ts
```

## 📄 Ejemplo: Página Correcta

```tsx
// src/pages/CompletarInscripcionPage.tsx
export default function CompletarInscripcionPage() {
  // 🎣 Lógica delegada a hooks personalizados
  const { verifyCode, isLoading, error } = useCodeVerification();
  const { uploadFile, isUploading } = useFileUpload();

  return (
    <PageContainer>
      <PageHeader
        title="Completar Inscripción"
        breadcrumbs={[...]}
      />

      {/* 🧩 Componentes reutilizables */}
      <CodeVerificationForm
        onVerify={verifyCode}
        loading={isLoading}
        error={error}
      />

      <FileUploadForm
        onUpload={uploadFile}
        loading={isUploading}
        acceptedTypes=".pdf"
      />
    </PageContainer>
  );
}
```

## 🧩 Ejemplo: Componente Reutilizable

```tsx
// src/components/forms/CodeVerificationForm.tsx
interface Props {
  onVerify: (code: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export default function CodeVerificationForm({
  onVerify,
  loading,
  error,
}: Props) {
  const [code, setCode] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onVerify(code);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        value={code}
        onChange={setCode}
        placeholder="Ingrese código"
        disabled={loading}
      />

      {error && <Alert type="error" message={error} />}

      <Button type="submit" loading={loading}>
        Verificar
      </Button>
    </form>
  );
}
```

## 🎣 Ejemplo: Hook Personalizado

```tsx
// src/hooks/useCodeVerification.ts
export function useCodeVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState(null);

  const verifyCode = async (code: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await verificarCodigoOrden(code);
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { verifyCode, isLoading, error, data };
}
```

## 🌐 Configuración de Rutas

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/registration" element={<RegistrationPage />} />
        <Route
          path="/complete-registration"
          element={<CompletarInscripcionPage />}
        />
        <Route
          path="/download-payment-slip"
          element={<DescargarBoletaPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}
```

## ✨ Beneficios de esta Arquitectura

### 🔄 Reutilización

- `CodeVerificationForm` se puede usar en ambas páginas
- `Button`, `Input`, `Alert` se usan en toda la app
- `useCodeVerification` se puede reutilizar

### 🧪 Testabilidad

- Componentes pequeños = tests más fáciles
- Hooks aislados = lógica testeable independientemente
- Páginas = tests de integración

### 🛠️ Mantenibilidad

- Responsabilidades claras
- Cambios aislados
- Código más limpio

### 📱 Escalabilidad

- Fácil agregar nuevas funcionalidades
- Componentes crecen orgánicamente
- Arquitectura sostenible
