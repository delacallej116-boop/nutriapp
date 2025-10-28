// Ejemplo de cómo agregar botones de verificación de cuenta en la tabla de pacientes
function addAccountButtonsToPatientTable() {
    // Esta función se puede llamar después de cargar la tabla de pacientes
    const patientRows = document.querySelectorAll('.patient-row');
    
    patientRows.forEach(row => {
        const patientId = row.dataset.patientId;
        const tieneCuenta = row.dataset.tieneCuenta === 'true';
        
        // Buscar la columna de acciones
        const actionsCell = row.querySelector('.actions-cell');
        if (actionsCell) {
            // Agregar botón de información de cuenta
            const accountButton = document.createElement('button');
            accountButton.className = 'btn btn-sm btn-outline-info me-1';
            accountButton.innerHTML = `<i class="fas fa-user-circle"></i>`;
            accountButton.title = 'Ver información de cuenta';
            accountButton.onclick = () => showPatientAccountInfo(patientId);
            
            // Agregar indicador visual
            const indicator = document.createElement('span');
            indicator.className = `badge ${tieneCuenta ? 'bg-success' : 'bg-warning'} me-1`;
            indicator.innerHTML = `<i class="fas fa-${tieneCuenta ? 'check' : 'exclamation-triangle'}"></i>`;
            indicator.title = tieneCuenta ? 'Tiene cuenta' : 'Sin cuenta';
            
            actionsCell.insertBefore(indicator, actionsCell.firstChild);
            actionsCell.insertBefore(accountButton, actionsCell.firstChild);
        }
    });
}

// Función para mostrar estadísticas de cuentas en el dashboard
function showAccountStatistics() {
    // Obtener estadísticas desde la API
    fetch('/api/usuarios/profesional/1/pacientes/stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const stats = data.data;
                
                // Crear tarjeta de estadísticas
                const statsCard = document.createElement('div');
                statsCard.className = 'card mb-4';
                statsCard.innerHTML = `
                    <div class="card-header">
                        <h5 class="mb-0">
                            <i class="fas fa-users me-2"></i>Estadísticas de Cuentas
                        </h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-3">
                                <div class="stat-item text-center">
                                    <h3 class="text-primary">${stats.total_pacientes}</h3>
                                    <p class="text-muted mb-0">Total Pacientes</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-item text-center">
                                    <h3 class="text-success">${stats.pacientes_con_cuenta}</h3>
                                    <p class="text-muted mb-0">Con Cuenta</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-item text-center">
                                    <h3 class="text-warning">${stats.pacientes_sin_cuenta}</h3>
                                    <p class="text-muted mb-0">Sin Cuenta</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="stat-item text-center">
                                    <h3 class="text-info">${Math.round((stats.pacientes_con_cuenta / stats.total_pacientes) * 100)}%</h3>
                                    <p class="text-muted mb-0">% Con Acceso</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Insertar en el dashboard
                const dashboard = document.getElementById('dashboard-section');
                if (dashboard) {
                    dashboard.insertBefore(statsCard, dashboard.firstChild);
                }
            }
        })
        .catch(error => {
            console.error('Error obteniendo estadísticas:', error);
        });
}
