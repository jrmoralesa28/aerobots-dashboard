// =====================================================
// AEROBOTS - EDITOR DE PASOS (Crear, Editar, Eliminar)
// =====================================================

let modoModal = 'crear';
let pasoEditandoId = null;
let imagenActualUrl = null;

document.addEventListener('DOMContentLoaded', () => {
    const btnAdd = document.getElementById('btn-add-paso');
    const modal = document.getElementById('modal-paso');
    const modalClose = document.getElementById('modal-paso-close');
    const form = document.getElementById('form-paso');
    const message = document.getElementById('modal-paso-message');
    const btnSave = document.getElementById('btn-save-paso');
    const modalTitle = document.getElementById('modal-paso-title');
    const modalSubtitle = document.getElementById('modal-paso-subtitle');
    const imagenInput = document.getElementById('paso-imagen');
    const imagenInfo = document.getElementById('paso-imagen-info');

    if (!btnAdd || !modal) return;

    btnAdd.addEventListener('click', () => {
        modoModal = 'crear';
        pasoEditandoId = null;
        imagenActualUrl = null;

        form.reset();
        modalTitle.textContent = 'Nuevo Paso';
        modalSubtitle.textContent = 'Completa los datos del paso';
        imagenInfo.textContent = '';

        const siguienteNumero = pasosActuales.length > 0
            ? Math.max(...pasosActuales.map(p => p.numero_paso)) + 1
            : 1;
        document.getElementById('paso-numero').value = siguienteNumero;

        message.textContent = '';
        modal.classList.add('active');
    });

    modalClose.addEventListener('click', () => modal.classList.remove('active'));

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') modal.classList.remove('active');
    });

    imagenInput.addEventListener('change', () => {
        if (imagenInput.files && imagenInput.files[0]) {
            const archivo = imagenInput.files[0];
            const tamanoKB = (archivo.size / 1024).toFixed(0);
            imagenInfo.textContent = `Archivo seleccionado: ${archivo.name} (${tamanoKB} KB)`;
            imagenInfo.style.color = 'var(--text-secondary)';
        } else {
            imagenInfo.textContent = '';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const numero = parseInt(document.getElementById('paso-numero').value);
        const tipo = document.getElementById('paso-tipo').value || null;
        const titulo = document.getElementById('paso-titulo').value.trim();
        const descripcion = document.getElementById('paso-descripcion').value.trim();
        const herramientasTexto = document.getElementById('paso-herramientas').value;
        const advertenciasTexto = document.getElementById('paso-advertencias').value;

        if (!numero || !titulo) {
            message.textContent = 'El numero y el titulo son obligatorios.';
            message.style.color = 'var(--danger)';
            return;
        }

        const herramientas = herramientasTexto
            .split('\n')
            .map(h => h.trim())
            .filter(h => h.length > 0);

        const advertencias = advertenciasTexto
            .split('\n')
            .map(a => a.trim())
            .filter(a => a.length > 0);

        message.textContent = modoModal === 'crear' ? 'Creando paso...' : 'Guardando cambios...';
        message.style.color = 'var(--text-secondary)';
        btnSave.disabled = true;
        btnSave.textContent = 'Guardando...';

        let imagenUrl = imagenActualUrl;

        if (imagenInput.files && imagenInput.files[0]) {
            message.textContent = 'Subiendo imagen...';

            const archivo = imagenInput.files[0];
            const extension = archivo.name.split('.').pop();
            const nombreArchivo = `paso_${Date.now()}.${extension}`;

            const { error: uploadError } = await supabaseClient.storage
                .from('imagenes-pasos')
                .upload(nombreArchivo, archivo, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Error al subir imagen:', uploadError);
                message.textContent = 'Error al subir la imagen. Intenta de nuevo.';
                message.style.color = 'var(--danger)';
                btnSave.disabled = false;
                btnSave.textContent = 'Guardar paso';
                return;
            }

            const { data: urlData } = supabaseClient.storage
                .from('imagenes-pasos')
                .getPublicUrl(nombreArchivo);

            imagenUrl = urlData.publicUrl;
            message.textContent = 'Guardando paso...';
        }

        const { data: { session } } = await supabaseClient.auth.getSession();

        const datos = {
            equipo_id: equipoActual.id,
            numero_paso: numero,
            titulo: titulo,
            descripcion: descripcion || null,
            tipo_objeto: tipo,
            herramientas_necesarias: herramientas.length > 0 ? herramientas : null,
            advertencias: advertencias.length > 0 ? advertencias : null,
            imagen_url: imagenUrl
        };

        let error;

        if (modoModal === 'crear') {
            datos.created_by = session?.user?.id || null;
            const result = await supabaseClient.from('pasos').insert(datos);
            error = result.error;
        } else {
            const result = await supabaseClient
                .from('pasos')
                .update(datos)
                .eq('id', pasoEditandoId);
            error = result.error;
        }

        btnSave.disabled = false;
        btnSave.textContent = 'Guardar paso';

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
            cargarPasos(equipoActual.id);
        }, 1000);
    });
});

function abrirModalEditarPaso(pasoId) {
    const paso = pasosActuales.find(p => p.id == pasoId);
    if (!paso) return;

    modoModal = 'editar';
    pasoEditandoId = pasoId;
    imagenActualUrl = paso.imagen_url || null;

    document.getElementById('modal-paso-title').textContent = 'Editar Paso';
    document.getElementById('modal-paso-subtitle').textContent = 'Modifica los datos del paso';

    document.getElementById('paso-numero').value = paso.numero_paso;
    document.getElementById('paso-tipo').value = paso.tipo_objeto || '';
    document.getElementById('paso-titulo').value = paso.titulo;
    document.getElementById('paso-descripcion').value = paso.descripcion || '';
    document.getElementById('paso-herramientas').value = (paso.herramientas_necesarias || []).join('\n');
    document.getElementById('paso-advertencias').value = (paso.advertencias || []).join('\n');

    const imagenInfo = document.getElementById('paso-imagen-info');
    if (paso.imagen_url) {
        imagenInfo.textContent = 'Ya tiene una imagen. Selecciona otra para reemplazarla.';
        imagenInfo.style.color = 'var(--text-secondary)';
    } else {
        imagenInfo.textContent = '';
    }

    document.getElementById('modal-paso-message').textContent = '';
    document.getElementById('modal-paso').classList.add('active');
}

async function eliminarPaso(pasoId) {
    const paso = pasosActuales.find(p => p.id == pasoId);
    if (!paso) return;

    const confirmar = confirm(`¿Eliminar el paso "${paso.titulo}"?`);
    if (!confirmar) return;

    const { error } = await supabaseClient
        .from('pasos')
        .delete()
        .eq('id', pasoId);

    if (error) {
        console.error('Error al eliminar:', error);
        alert('Error al eliminar el paso. Intenta de nuevo.');
        return;
    }

    cargarPasos(equipoActual.id);
}