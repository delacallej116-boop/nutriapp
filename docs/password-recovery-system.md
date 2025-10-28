# Sistema de Recuperación de Contraseña para Profesionales

## 🔐 **Recomendaciones para el Sistema de Recuperación**

### **1. 🚫 Restricción de Acceso**
- **Solo profesionales** pueden solicitar recuperación de contraseña
- **Los pacientes NO** tienen acceso a esta funcionalidad
- **Validación en backend** para verificar el tipo de usuario

### **2. 🔒 Métodos de Recuperación Recomendados**

#### **Opción A: Sistema Administrativo (Recomendado)**
```javascript
// Endpoint para profesionales
POST /api/professional/password-recovery
{
  "email": "profesional@nutricion.com",
  "matricula": "12345", // Número de matrícula profesional
  "documento": "12345678" // DNI o documento de identidad
}
```

**Flujo:**
1. Profesional solicita recuperación con credenciales profesionales
2. Sistema valida matrícula y documento
3. Administrador recibe notificación
4. Administrador genera nueva contraseña temporal
5. Se envía por email seguro al profesional

#### **Opción B: Sistema Automático con Validación**
```javascript
// Endpoint con validación adicional
POST /api/professional/password-recovery
{
  "email": "profesional@nutricion.com",
  "matricula": "12345",
  "documento": "12345678",
  "telefono": "+5491123456789" // Para SMS de verificación
}
```

**Flujo:**
1. Validación de credenciales profesionales
2. Envío de código SMS al teléfono registrado
3. Verificación del código
4. Generación automática de contraseña temporal
5. Envío por email con instrucciones

### **3. 🛡️ Medidas de Seguridad**

#### **Validaciones Requeridas:**
- ✅ Verificar que el email pertenece a un profesional
- ✅ Validar número de matrícula profesional
- ✅ Confirmar documento de identidad
- ✅ Verificar teléfono registrado (si aplica)
- ✅ Rate limiting (máximo 3 intentos por hora)

#### **Contraseñas Temporales:**
- **Longitud:** 12 caracteres mínimo
- **Composición:** Letras, números y símbolos
- **Expiración:** 24 horas máximo
- **Uso único:** Se invalida al cambiar contraseña

### **4. 📧 Implementación Recomendada**

#### **Backend (Node.js/Express):**
```javascript
// routes/professional.js
router.post('/password-recovery', async (req, res) => {
  try {
    const { email, matricula, documento } = req.body;
    
    // Validar que es profesional
    const profesional = await Profesional.findOne({
      email,
      matricula,
      documento
    });
    
    if (!profesional) {
      return res.status(404).json({
        error: 'Credenciales profesionales no válidas'
      });
    }
    
    // Generar contraseña temporal
    const tempPassword = generateTempPassword();
    
    // Actualizar en BD con hash
    profesional.password = await bcrypt.hash(tempPassword, 10);
    profesional.tempPassword = true;
    profesional.passwordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await profesional.save();
    
    // Enviar email
    await sendRecoveryEmail(email, tempPassword);
    
    res.json({
      message: 'Contraseña temporal enviada por email'
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});
```

#### **Email Template:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Recuperación de Contraseña - Dr. Alexis Allendez</title>
</head>
<body>
    <h2>Recuperación de Contraseña</h2>
    <p>Estimado/a Dr./Dra. [Nombre],</p>
    
    <p>Se ha solicitado la recuperación de su contraseña para el sistema de gestión nutricional.</p>
    
    <div style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
        <h3>Contraseña Temporal:</h3>
        <code style="font-size: 18px; background: #e9ecef; padding: 10px;">[TEMP_PASSWORD]</code>
    </div>
    
    <p><strong>Importante:</strong></p>
    <ul>
        <li>Esta contraseña expira en 24 horas</li>
        <li>Debe cambiarla en su primer acceso</li>
        <li>No comparta esta información</li>
    </ul>
    
    <p>Si no solicitó este cambio, contacte al administrador inmediatamente.</p>
    
    <hr>
    <small>Sistema de Gestión Nutricional - Dr. Alexis Allendez</small>
</body>
</html>
```

### **5. 🔧 Configuración de Base de Datos**

#### **Tabla Profesional (actualización):**
```sql
ALTER TABLE profesionales ADD COLUMN temp_password BOOLEAN DEFAULT FALSE;
ALTER TABLE profesionales ADD COLUMN password_expiry TIMESTAMP NULL;
ALTER TABLE profesionales ADD COLUMN recovery_attempts INT DEFAULT 0;
ALTER TABLE profesionales ADD COLUMN last_recovery_attempt TIMESTAMP NULL;
```

### **6. 📱 Interfaz de Usuario**

#### **Página de Recuperación (Solo para Profesionales):**
```html
<!-- views/professional/password-recovery.html -->
<div class="recovery-form">
    <h3>Recuperación de Contraseña</h3>
    <p class="text-muted">Solo disponible para profesionales</p>
    
    <form id="recoveryForm">
        <div class="form-floating mb-3">
            <input type="email" class="form-control" id="email" required>
            <label for="email">Email Profesional</label>
        </div>
        
        <div class="form-floating mb-3">
            <input type="text" class="form-control" id="matricula" required>
            <label for="matricula">Número de Matrícula</label>
        </div>
        
        <div class="form-floating mb-3">
            <input type="text" class="form-control" id="documento" required>
            <label for="documento">Documento de Identidad</label>
        </div>
        
        <button type="submit" class="btn btn-primary w-100">
            Solicitar Recuperación
        </button>
    </form>
</div>
```

### **7. 🚨 Consideraciones de Seguridad**

#### **Rate Limiting:**
```javascript
const rateLimit = require('express-rate-limit');

const recoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 intentos por hora
  message: 'Demasiados intentos de recuperación. Intente más tarde.'
});

app.use('/api/professional/password-recovery', recoveryLimiter);
```

#### **Logging de Seguridad:**
```javascript
// Registrar todos los intentos de recuperación
const securityLog = {
  timestamp: new Date(),
  email: email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  success: false,
  reason: 'Invalid credentials'
};
```

### **8. 📋 Checklist de Implementación**

- [ ] Crear endpoint de recuperación para profesionales
- [ ] Implementar validación de credenciales profesionales
- [ ] Configurar sistema de email
- [ ] Crear template de email
- [ ] Implementar rate limiting
- [ ] Agregar logging de seguridad
- [ ] Crear página de recuperación
- [ ] Probar flujo completo
- [ ] Documentar proceso para administradores

### **9. 🎯 Beneficios de este Sistema**

✅ **Seguridad:** Solo profesionales pueden recuperar contraseñas
✅ **Trazabilidad:** Todos los intentos quedan registrados
✅ **Control:** Administrador tiene control total del proceso
✅ **Simplicidad:** No requiere configuración compleja de SMS
✅ **Cumplimiento:** Cumple con estándares de seguridad médica

---

**Nota:** Este sistema está diseñado específicamente para profesionales de la salud, donde la seguridad y el control administrativo son fundamentales.


