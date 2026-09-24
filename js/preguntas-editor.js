// =====================================================
// AEROBOTS - EDITOR DE PREGUNTAS (Crear, Editar, Eliminar)
// =====================================================

let modoModalPregunta = 'crear';
let preguntaEditandoId = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnAdd = document.getElementById('btn-add-pregunta');
    const modal = document.getElementById('modal-pregunta');
    const modalClose = document.getElementById('modal-pregunta-close');
    const form = document.getElementById('form-pregunta');
    const message = document.getElementById('modal-pregunta-message');
    const btnSave = document.getElementById('btn-save-pregunta');
    const modalTitle = document.getElementById('modal-pregunta-title');
    const modalSubtitle = document.getElementById('modal-pregunta-subtitle');

    if (!btnAdd || !modal) return;

    // ===== ABRIR MODAL PARA CREAR =====
    btnAdd.addEventListener('click', () => {
        modoModalPregunta = 'crear';
        preguntaEditandoId = null;

        form.reset();
        modalTitle.textContent = 'Nueva Pregunta';
        modalSubtitle.textContent = 'Completa los datos de la pregunta';

        // Sugerir el siguiente orden
        const siguienteOrden = preguntasActuales.length > 0
            ? Math.max(...preguntasActuales.map(p => p.orden || 0)) + 1
            : 1;
        document.getElementById('pregunta-orden').value = siguienteOrden;

        message.textContent = '';
        modal.classList.add('active');
    });

    // ===== CERRAR MODAL =====
    modalClose.addEventListener('click', () => modal.classList.remove('active'));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.classList.remove('active');
    });

    // ===== ENVIAR FORMULARIO =====
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const categoria = document.getElementById('pregunta-categoria').value;
        const orden = parseInt(document.getElementById('pregunta-orden').value) || 0;
        const pregunta = document.getElementById('pregunta-texto').value.trim();
        const respuesta = document.getElementById('pregunta-respuesta').value.trim();

        if (!pregunta || !respuesta) {
            message.textContent = 'La pregunta y la respuesta son obligatorias.';
            message.style.color = 'var(--danger)';
            return;
        }

        message.textContent = modoModalPregunta === 'crear' ? 'Creando...' : 'Guardando...';
        message.style.color = 'var(--text-secondary)';
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        const { data: { session } } = await supabaseClient.auth.getSession();

        const datos = {
            categoria: categoria,
            orden: orden,
            pregunta: pregunta,
            respuesta: respuesta
        };

        let error;

        if (modoModalPregunta === 'crear') {
            datos.created_by = session?.user?.id || null;
            const result = await supabaseClient.from('preguntas').insert(datos);
            error = result.error;
        } else {
            const result = await supabaseClient
                .from('preguntas')
                .update(datos)
                .eq('id', preguntaEditandoId);
            error = result.error;
        }

        btnSave.disabled = false;
        btnSave.textContent = 'Guardar pregunta';

        if (error) {
            console.error('Error:', error);
            message.textContent = 'Error al guardar. Intenta de nuevo.';
            message.style.color = 'var(--danger)';
            return;
        }

        message.textContent = 'Guardado correctamente.';
        message.style.color = 'var(--success)';

        setTimeout(() => {
            modal.classList.remove('active');
            cargarPreguntas();
        }, 1000);
    });
});

// =====================================================
// ABRIR MODAL PARA EDITAR
// =====================================================
function abrirModalEditarPregunta(preguntaId) {
    const pregunta = preguntasActuales.find(p => p.id == preguntaId);
    if (!pregunta) return;

    modoModalPregunta = 'editar';
    preguntaEditandoId = preguntaId;

    document.getElementById('modal-pregunta-title').textContent = 'Editar Pregunta';
    document.getElementById('modal-pregunta-subtitle').textContent = 'Modifica los datos de la pregunta';

    document.getElementById('pregunta-categoria').value = pregunta.categoria;
    document.getElementById('pregunta-orden').value = pregunta.orden || 0;
    document.getElementById('pregunta-texto').value = pregunta.pregunta;
    document.getElementById('pregunta-respuesta').value = pregunta.respuesta;

    document.getElementById('modal-pregunta-message').textContent = '';
    document.getElementById('modal-pregunta').classList.add('active');
}

// =====================================================
// ELIMINAR PREGUNTA
// =====================================================
async function eliminarPregunta(preguntaId) {
    const pregunta = preguntasActuales.find(p => p.id == preguntaId);
    if (!pregunta) return;

    const confirmar = confirm(`¿Eliminar la pregunta "${pregunta.pregunta}"?`);
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('preguntas')
        .delete()
        .eq('id', preguntaId);

    if (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar la pregunta. Intenta de nuevo.');
        return;
    }

    cargarPreguntas();
}