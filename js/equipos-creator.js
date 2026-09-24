// =====================================================
// AEROBOTS - CREAR EQUIPO NUEVO
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    const btnAdd = document.getElementById('btn-add-equipo');
    const modal = document.getElementById('modal-new-equipo');
    const modalClose = document.getElementById('modal-new-close');
    const form = document.getElementById('form-new-equipo');
    const message = document.getElementById('modal-new-message');
    const btnSave = document.getElementById('btn-save-new-equipo');

    if (!btnAdd || !modal) return;

    btnAdd.addEventListener('click', () => {
        form.reset();
        message.textContent = '';
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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nombre = document.getElementById('new-nombre').value.trim();
        const descripcion = document.getElementById('new-descripcion').value.trim();
        const estado = document.getElementById('new-estado').value;

        if (!nombre) {
            message.textContent = 'El nombre es obligatorio.';
            message.style.color = 'var(--danger)';
            return;
        }

        message.textContent = 'Creando equipo...';
        message.style.color = 'var(--text-secondary)';
        btnSave.disabled = true;
        btnSave.textContent = 'Creando...';

        const { data: { session } } = await supabaseClient.auth.getSession();

        const { error } = await supabaseClient
            .from('equipos')
            .insert({
                categoria_id: categoriaActual,
                nombre: nombre,
                descripcion: descripcion || null,
                estado: estado,
                created_by: session?.user?.id || null
            });

        btnSave.disabled = false;
        btnSave.textContent = 'Crear';

        if (error) {
            console.error('Error al crear equipo:', error);
            message.textContent = 'Error al crear. Verifica que el nombre no exista ya.';
            message.style.color = 'var(--danger)';
            return;
        }

        message.textContent = 'Equipo creado correctamente.';
        message.style.color = 'var(--success)';

        setTimeout(() => {
            modal.classList.remove('active');
            cargarEquipos(categoriaActual, origenActual);
        }, 1000);
    });
});