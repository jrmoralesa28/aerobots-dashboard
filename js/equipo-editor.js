// =====================================================
// AEROBOTS - EDITOR DE EQUIPO (Editar y Eliminar)
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnEdit = document.getElementById('btn-edit-equipo');
    const btnDelete = document.getElementById('btn-delete-equipo');
    const modal = document.getElementById('modal-edit-equipo');
    const modalClose = document.getElementById('modal-edit-close');
    const formEdit = document.getElementById('form-edit-equipo');
    const modalMessage = document.getElementById('modal-edit-message');
    const btnSave = document.getElementById('btn-save-equipo');

    if (!btnEdit) return;

    btnEdit.addEventListener('click', () => {
        if (!equipoActual) return;

        document.getElementById('edit-nombre').value = equipoActual.nombre;
        document.getElementById('edit-descripcion-equipo').value = equipoActual.descripcion || '';
        document.getElementById('edit-estado').value = equipoActual.estado;

        modalMessage.textContent = '';
        modal.classList.add('active');
    });

    modalClose.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            modal.classList.remove('active');
        }
    });

    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!equipoActual) return;

        const nuevoNombre = document.getElementById('edit-nombre').value.trim();
        const nuevaDescripcion = document.getElementById('edit-descripcion-equipo').value.trim();
        const nuevoEstado = document.getElementById('edit-estado').value;

        if (!nuevoNombre) {
            modalMessage.textContent = 'El nombre no puede estar vacio.';
            modalMessage.style.color = 'var(--danger)';
            return;
        }

        modalMessage.textContent = 'Guardando...';
        modalMessage.style.color = 'var(--text-secondary)';
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const { error } = await supabaseClient
            .from('equipos')
            .update({
                nombre: nuevoNombre,
                descripcion: nuevaDescripcion || null,
                estado: nuevoEstado
            })
            .eq('id', equipoActual.id);

        btnSave.disabled = false;
        btnSave.textContent = 'Guardar cambios';

        if (error) {
            console.error('Error al guardar:', error);
            modalMessage.textContent = 'Error al guardar. Intenta de nuevo.';
            modalMessage.style.color = 'var(--danger)';
            return;
        }

        modalMessage.textContent = 'Cambios guardados correctamente.';
        modalMessage.style.color = 'var(--success)';

        setTimeout(() => {
            modal.classList.remove('active');
            document.getElementById('equipo-title').textContent = nuevoNombre;

            const badge = document.getElementById('equipo-badge');
            if (nuevoEstado === 'authorized') {
                badge.textContent = 'Aprobado';
                badge.className = 'badge aprobado';
            } else {
                badge.textContent = 'Pendiente';
                badge.className = 'badge pendiente';
            }
            equipoActual.nombre = nuevoNombre;
            equipoActual.descripcion = nuevaDescripcion;
            equipoActual.estado = nuevoEstado;
        }, 1000);
    });

    btnDelete.addEventListener('click', async () => {
        if (!equipoActual) return;

        const confirmar = confirm(`¿Estas seguro que deseas eliminar "${equipoActual.nombre}"? Esta accion eliminara tambien todos sus pasos.`);
        if (!confirmar) return;

        const params = new URLSearchParams(window.location.search);
        const origen = params.get('origen') || 'armado';

        const { error } = await supabaseClient
            .from('equipos')
            .delete()
            .eq('id', equipoActual.id);

        if (error) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el equipo. Intenta de nuevo.');
            return;
        }

        alert('Equipo eliminado correctamente.');
        window.location.href = `${origen}.html`;
    });
});